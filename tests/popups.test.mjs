import { test } from "node:test";
import assert from "node:assert/strict";
import { popupCanShow, popupDestination, popupIsActive, popupKey, rememberPopupDismissal } from "../src/utils/popups.js";

const now = Date.parse("2026-11-17T10:00:00Z");
const popup = { id: "new-arrival", status: "active", frequency: "session" };
const makeStore = () => { const data = new Map(); return { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) }; };

test("active unscheduled popups display; inactive, future and expired popups do not", () => {
  assert.equal(popupIsActive(popup, now), true);
  assert.equal(popupIsActive({ ...popup, status: "inactive" }, now), false);
  assert.equal(popupIsActive({ ...popup, startsAt: new Date(now + 1000) }, now), false);
  assert.equal(popupIsActive({ ...popup, endsAt: new Date(now - 1000) }, now), false);
});
test("session frequency is isolated from persistent browser history", () => {
  const stores = { session: makeStore(), persistent: makeStore() };
  assert.equal(popupCanShow(popup, stores, now), true);
  stores.session.setItem(popupKey(popup), String(now));
  assert.equal(popupCanShow(popup, stores, now), false);
  assert.equal(popupCanShow(popup, { ...stores, session: makeStore() }, now), true);
});
test("old renderer history cannot suppress the redesigned popup", () => {
  const stores = { session: makeStore(), persistent: makeStore() };
  stores.session.setItem(`snz:popup:${popup.id}:original`, String(now));
  assert.equal(popupCanShow(popup, stores, now), true);
});
test("only a dismissal consumes the frequency limit; always popups remain eligible", () => {
  const stores = { session: makeStore(), persistent: makeStore() };
  assert.equal(popupCanShow(popup, stores, now), true);
  // A render, refresh or interrupted timer does not write to history.
  assert.equal(popupCanShow(popup, stores, now + 1000), true);
  rememberPopupDismissal(popup, stores, now);
  assert.equal(popupCanShow(popup, stores, now), false);
  const always = { ...popup, frequency: "always" };
  rememberPopupDismissal(always, stores, now);
  assert.equal(popupCanShow(always, stores, now), true);
});
test("daily and weekly limits expire at their configured interval; always stays eligible", () => {
  for (const [frequency, days] of [["day", 1], ["week", 7]]) {
    const item = { ...popup, frequency };
    const stores = { persistent: makeStore() };
    stores.persistent.setItem(popupKey(item), String(now));
    assert.equal(popupCanShow(item, stores, now + days * 86400000 - 1), false);
    assert.equal(popupCanShow(item, stores, now + days * 86400000), true);
    assert.equal(popupCanShow({ ...item, frequency: "always" }, stores, now), true);
    assert.equal(popupCanShow({ ...item, updatedAt: "changed" }, stores, now), true);
  }
});
test("blocked storage does not prevent an eligible popup from rendering", () => {
  assert.equal(popupCanShow(popup, { session: { getItem() { throw new Error("blocked"); } } }, now), true);
});
test("destination links allow storefront paths and web URLs", () => {
  for (const url of ["/products", "https://shoponzy.in/products"]) assert.equal(popupDestination(url), url);
  for (const url of ["javascript:alert(1)", "//other.example", "", "data:text/html,test"]) assert.equal(popupDestination(url), "");
});

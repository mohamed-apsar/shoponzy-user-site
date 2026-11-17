import { test } from "node:test";
import assert from "node:assert/strict";
import { shippingForPincode } from "../src/utils/shipping.js";

const shipping = {
  states: [{ name: "Tamil Nadu", enabled: true, districts: [{ name: "Chennai", enabled: true }] }],
  pincodes: [{ code: "625007", state: "TAMIL NADU", district: "CHENNAI", price: 40, enabled: true }],
};
test("configured PIN rates override the generic fee and free-shipping threshold", () => {
  for (const generic of [59, 0]) assert.equal(shippingForPincode(shipping, "625007", generic).fee, 40);
  assert.equal(shippingForPincode({ ...shipping, pincodes: [{ ...shipping.pincodes[0], price: 0 }] }, "625007", 59).fee, 0);
});
test("missing, incomplete and unsupported PIN codes never display the generic fee", () => {
  for (const pin of [undefined, "", "62500"]) assert.equal(shippingForPincode(shipping, pin, 59).status, "pending");
  const unsupported = shippingForPincode(shipping, "600043", 59);
  assert.equal(unsupported.status, "unavailable");
  assert.equal(unsupported.fee, null);
});
test("disabled PIN codes, districts and states are unavailable", () => {
  const variants = [
    { ...shipping, pincodes: [{ ...shipping.pincodes[0], enabled: false }] },
    { ...shipping, states: [{ ...shipping.states[0], enabled: false }] },
    { ...shipping, states: [{ ...shipping.states[0], districts: [{ name: "Chennai", enabled: false }] }] },
  ];
  for (const settings of variants) assert.equal(shippingForPincode(settings, "625007", 59).status, "unavailable");
});
test("stores without PIN rates retain generic shipping and free shipping", () => {
  assert.equal(shippingForPincode({ states: [], pincodes: [] }, "600043", 59).fee, 59);
  assert.equal(shippingForPincode(undefined, "600043", 0).fee, 0);
});

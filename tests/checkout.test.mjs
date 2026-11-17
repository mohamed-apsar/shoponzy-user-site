import { test } from "node:test";
import assert from "node:assert/strict";
import { checkoutItems, subtractPurchasedLines } from "../src/utils/checkout.js";

const a = { id: "a", c: 0, s: "8", qty: 3 };
const b = { id: "b", c: 0, s: "8", qty: 1 };
test("checkout cleanup preserves unselected products, variants and remaining quantities", () => {
  const otherSize = { ...a, s: "9", qty: 1 };
  assert.deepEqual(subtractPurchasedLines([a, b, otherSize], [{ ...a, qty: 2 }]), [{ ...a, qty: 1 }, b, otherSize]);
  assert.deepEqual(subtractPurchasedLines([a, b], [a]), [b]);
});
test("checkout payload contains only selected options and quantities, without client prices", () => {
  const products = [{ id: "a", apiId: "product-a", colors: [["#000", "Black"]], variants: [{ id: "variant-a", color: "Black", size: "8" }] }];
  assert.deepEqual(checkoutItems([{ ...a, qty: 1 }], products), [{ productId: "product-a", variantId: "variant-a", qty: 1 }]);
  assert.throws(() => checkoutItems([b], products), /no longer available/);
});

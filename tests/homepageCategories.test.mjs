import { test } from "node:test";
import assert from "node:assert/strict";
import { homepageSubcategories } from "../src/utils/homepageCategories.js";

test("only explicitly enabled subcategories appear, using their own name, image and listing link", () => {
  const tree = [{ id: "root", slug: "shoes", name: "Foot Wear", showOnHomepage: true, children: [
    { id: "one", name: "Sneakers", showOnHomepage: true, image: { url: "/sneakers.jpg" } },
    { id: "two", name: "Sandals", showOnHomepage: false },
    { id: "three", name: "Boots" },
  ] }];
  const selected = homepageSubcategories(tree);
  assert.equal(selected.length, 1);
  assert.equal(selected[0].name, "Sneakers");
  assert.equal(selected[0].image, "/sneakers.jpg");
  assert.equal(selected[0].href, "/categories/shoes?sub=one");
  tree[0].children[0].showOnHomepage = false;
  assert.deepEqual(homepageSubcategories(tree), []);
});

test("disabled branches stay hidden and nested selections keep their distinct listing ids", () => {
  const nested = { id: "nested", name: "Running", showOnHomepage: true, productImage: { url: "/running.jpg" } };
  const tree = [{ id: "root", slug: "shoes", children: [{ id: "sub", name: "Sneakers", children: [nested] }] }];
  assert.equal(homepageSubcategories(tree)[0].href, "/categories/shoes?sub=nested");
  assert.equal(homepageSubcategories(tree)[0].image, "/running.jpg");
  tree[0].children[0].status = "disabled";
  assert.deepEqual(homepageSubcategories(tree), []);
  tree[0].children[0].status = "enabled";
  tree[0].status = "disabled";
  assert.deepEqual(homepageSubcategories(tree), []);
});

// Read the public tree so disabled categories and their descendants stay hidden.
export function homepageSubcategories(tree = []) {
  const selected = [];
  function visit(nodes, root) {
    for (const node of nodes || []) {
      if (node.status === "disabled") continue;
      if (root && node.showOnHomepage === true) {
        selected.push({
          id: node.id, name: node.name,
          image: node.image?.url || node.productImage?.url || "",
          href: `/categories/${encodeURIComponent(root.slug)}?sub=${encodeURIComponent(node.id)}`,
          icon: [node.display?.artKind || "bag", node.display?.artColor || root.display?.color || "#999999"],
        });
      }
      visit(node.children, root || node);
    }
  }
  visit(tree, null);
  return selected;
}

export function productMatchesCategory(product, category) {
  const [slug, , , , , categoryId, , , ancestorIds] = category;
  const hasCategoryPath = product.categoryIds?.length > 0;
  return (categoryId && hasCategoryPath ? product.categoryIds.includes(categoryId) : product.sub === slug)
    || Boolean(product.assignedCategoryId && ancestorIds?.includes(product.assignedCategoryId));
}

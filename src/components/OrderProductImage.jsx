import Icon from "./Icon";
import ProductMedia from "./ProductMedia";
import { useCatalog } from "../context/CatalogContext";

export default function OrderProductImage({ item, className = "" }) {
  const { products } = useCatalog();
  if (!item) return <span className={`${className} order-image-fallback`} aria-hidden="true"><Icon name="i-bag" /></span>;

  const itemProductId = typeof item.product === "object" ? item.product?.id || item.product?._id : item.product;
  const product = products.find((candidate) => String(candidate.apiId) === String(itemProductId) || candidate.slug === item.slug);
  if (product) {
    const colorIndex = product.colors.findIndex((color) => color[1] === item.color);
    return <ProductMedia product={product} ci={Math.max(0, colorIndex)} className={className} />;
  }
  if (item.image) return <span className={className}><img src={item.image} alt={item.name || "Ordered product"} loading="lazy" /></span>;
  return <span className={`${className} order-image-fallback`} aria-hidden="true"><Icon name="i-bag" /></span>;
}

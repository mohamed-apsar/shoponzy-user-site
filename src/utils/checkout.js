export const cartLineKey = (line) => [line.id, line.c, line.s].join("|");

export function checkoutQuantityLimit(product, line) {
  const color = product?.colors?.[line.c]?.[1];
  const variant = product?.variants?.find((v) => (v.color ?? "Default") === color && (v.size ?? "One size") === line.s);
  if (!variant || variant.inStock === false) return 1;
  return Number.isFinite(variant.stock) ? Math.max(1, Math.min(10, variant.stock)) : 10;
}

export function changeCheckoutQuantity(lines, target, delta, product) {
  return lines.map((line) => cartLineKey(line) === cartLineKey(target)
    ? { ...line, qty: Math.max(1, Math.min(checkoutQuantityLimit(product, line), line.qty + delta)) }
    : line);
}

export function confirmedCheckoutTotals(order, payment) {
  const amount = Math.round(Number(order.total) * 100);
  if (!Number.isSafeInteger(amount) || amount <= 0 || payment?.amount !== amount || payment.currency !== "INR") {
    throw new Error("The payment amount could not be confirmed. Please try again.");
  }
  return {
    sub: order.subtotal, disc: order.couponDiscount, prepaid: order.prepaidDiscount,
    ship: order.shippingFee, tax: order.tax, total: amount / 100,
    shippingStatus: "ready",
  };
}

export function subtractPurchasedLines(cart, purchased) {
  const quantities = new Map(purchased.map((line) => [cartLineKey(line), line.qty]));
  return cart.flatMap((line) => {
    const qty = line.qty - (quantities.get(cartLineKey(line)) || 0);
    return qty > 0 ? [{ ...line, qty }] : [];
  });
}

export function checkoutItems(lines, products) {
  return lines.map((line) => {
    const product = products.find((p) => p.id === line.id);
    const color = product?.colors[line.c]?.[1];
    const variant = product?.variants.find((v) => (v.color ?? "Default") === color && (v.size ?? "One size") === line.s);
    if (!product?.apiId || !variant?.id) throw new Error(`${product?.name || "This item"} is no longer available in this option.`);
    return { productId: product.apiId, variantId: variant.id, qty: line.qty };
  });
}

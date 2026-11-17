export function shippingForPincode(shipping, pincode, defaultFee) {
  if (!shipping?.pincodes?.length) return { fee: defaultFee, status: "ready", message: "", byPincode: false };
  if (!/^\d{6}$/.test(pincode || "")) return { fee: null, status: "pending", message: "Enter your PIN code", byPincode: true };
  const rate = shipping.pincodes.find((entry) => entry.code === pincode && entry.enabled);
  const state = rate && shipping.states.find((entry) => entry.enabled && entry.name.toLowerCase() === rate.state.toLowerCase());
  const district = state?.districts.find((entry) => entry.enabled && entry.name.toLowerCase() === rate.district.toLowerCase());
  if (!rate || !district) return { fee: null, status: "unavailable", message: "Delivery is not available for this PIN code.", byPincode: true };
  return { fee: rate.price, status: "ready", message: "", byPincode: true };
}

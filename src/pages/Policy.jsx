import { Link } from "react-router-dom";
import { useCatalog } from "../context/CatalogContext";
import usePageMeta from "../hooks/usePageMeta";

export default function Policy() {
  const { store } = useCatalog();
  usePageMeta("Policies | Shoponzy");

  return <>
    <div className="container page-title">
      <h1>Shoponzy policies</h1>
      <p>Information about delivery, returns, privacy and shopping with Shoponzy.</p>
    </div>
    <section className="section" style={{ paddingTop: 12 }}>
      <div className="container prose" style={{ maxWidth: 900 }}>
        <h2 id="shipping">Shipping policy</h2>
        <ul>
          <li>Orders are dispatched within 1–2 working days.</li>
          <li>{store.deliveryText}.</li>
          <li>Delivery is free on orders above {store.freeShippingAbove}; otherwise the delivery fee is {store.shippingFee}.</li>
          <li>Cash on delivery is available on eligible PIN codes.</li>
        </ul>

        <h2 id="returns">Return and refund policy</h2>
        <ul>
          <li>Request a return or exchange within 7 days of delivery for unused items with their original tags and packaging.</li>
          <li>Perfumes, innerwear and items marked non-returnable cannot be returned once opened.</li>
          <li>For prepaid orders, refunds are sent to the original payment method within 5–7 working days after the return is received.</li>
        </ul>
        <p>Visit <Link to="/return-policy">Returns and exchanges</Link> to start a request or read more.</p>

        <h2 id="privacy">Privacy policy</h2>
        <p>We collect the contact and delivery details needed to process and deliver your order, such as your name, phone number, address and email. We do not sell your personal information. Wishlist items are stored in your browser.</p>

        <h2 id="terms">Terms and conditions</h2>
        <ul>
          <li>Prices and offers may change without notice.</li>
          <li>Price, stock and discounts are confirmed when an order is placed.</li>
          <li>Product colours may look slightly different across screens.</li>
        </ul>

        <p>For questions about these policies, <Link to="/contact">contact Shoponzy</Link>.</p>
      </div>
    </section>
  </>;
}

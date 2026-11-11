import { Navigate, Route, Routes, useLocation, useSearchParams } from "react-router-dom";
import Layout from "./layouts/Layout";
import Home from "./pages/Home";
import { CategoryPage, ShopPage } from "./pages/ProductListing";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Wishlist from "./pages/Wishlist";
import Help, { HELP_SECTIONS } from "./pages/Help";
import NotFound from "./pages/NotFound";
import LegacyRedirect from "./pages/LegacyRedirect";
import Account from "./pages/Account";
import AccountOrder from "./pages/AccountOrder";
import { ForgotPassword, ResetPassword } from "./pages/PasswordReset";
import { useCustomer } from "./context/CustomerContext";

function SearchRedirect() {
  const [params] = useSearchParams();
  return <Navigate to={`/products?${params.toString()}`} replace />;
}

function CustomerCheckout() {
  const { signedIn, status } = useCustomer();
  const location = useLocation();
  if (status === "loading") return <div className="container page-title"><p>Checking your account…</p></div>;
  if (!signedIn) {
    const next = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={`/account?next=${encodeURIComponent(next)}`} replace />;
  }
  return <Checkout />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="products" element={<ShopPage />} />
        <Route path="products/:slug" element={<ProductDetail />} />
        <Route path="categories/:slug" element={<CategoryPage />} />
        <Route path="search" element={<SearchRedirect />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<CustomerCheckout />} />
        <Route path="wishlist" element={<Wishlist />} />
        <Route path="account" element={<Account />} />
        <Route path="account/orders/:orderNumber" element={<AccountOrder />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />
        <Route path="help" element={<Help />} />
        {Object.keys(HELP_SECTIONS).map((path) => <Route key={path} path={path} element={<Help section={path} />} />)}
        <Route path="*" element={<LegacyRedirect fallback={<NotFound />} />} />
      </Route>
    </Routes>
  );
}

# Shoponzy — customer website (React)

React + Vite conversion of the original static site (kept for reference in `../legacy-site/`). The design, CSS, illustrations and animations are carried over unchanged.

## Run

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build in dist/
npm run preview   # serve dist/ (SPA fallback included)
npm run lint
```

## Structure

```
src/
├── data/catalog.js        Seed data used by the backend; storefront catalogue is loaded from the API
├── styles/style.css       Original stylesheet, verbatim
├── components/            Art (SVG product illustrations), Icon sprite, ProductCard, ProductMedia,
│   ├── layout/            Header (announcement bar, mega-menus), Footer, TabBar
│   └── sheets/            Bag drawer, quick add, search, categories, menu, size guide
├── context/StoreContext   Bag, wishlist, coupon, recently viewed, sheets, toasts
├── fx/                    GSAP motion layer as hooks (reverted on route change; honours reduced motion)
├── hooks/usePageMeta      Title, description, Open Graph, canonical per page
├── layouts/Layout.jsx     Site chrome + global behaviours (Escape, bag-icon delegation, scroll restoration)
└── pages/                 Home, ProductListing (category / shop / search), ProductDetail, Cart,
                           Checkout, Wishlist, Help (+ policy routes), NotFound, LegacyRedirect
```

## Routes

| Route | Page | Replaces |
|---|---|---|
| `/` | Home | `index.html` |
| `/products` (`?q=`, `?sale=1`, `?sort=`) | Shop all / search | `shop.html` |
| `/categories/:slug` (`?sub=`) | Category | `shoes.html` … `essentials.html` |
| `/products/:slug` | Product | `product.html?id=` |
| `/cart`, `/checkout`, `/wishlist` | | `cart.html`, `checkout.html`, `wishlist.html` |
| `/help`, `/track-order`, `/contact`, `/about`, `/shipping-policy`, `/return-policy`, `/privacy-policy`, `/terms`, `/faqs` | Help centre, scrolled to the section | `help.html#…` |
| `/search?q=` | Redirects to `/products?q=` | |

Old `.html` URLs (including `?id=`, `?sub=` and `#anchors`) redirect client-side to the new routes. The production web server should also answer them with 301s (Phase 8).

## Data and checkout

- Categories, products, homepage banners/sections and public store settings load from the backend API.
- During local development, `/api` is proxied to `http://localhost:5000`; start the backend and seed its database first. Production builds default to `https://shoponzy-backend.vercel.app/api/v1`; set the Vercel project environment variable `VITE_API_BASE_URL` to override it.
- Bag, wishlist and recently viewed live in `localStorage`, as on the original site (Phase 6 → synced to the account).
- Checkout, contact form and newsletter still use the interim WhatsApp flow; server-side orders, customer account sync and branding are not connected yet.
- If the API cannot be reached, the storefront shows the API error and a retry action rather than silently presenting the static seed catalogue.

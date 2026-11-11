/* ==========================================================
   SHOPONZY — store settings & catalogue (static seed)
   Ported from legacy-site/assets/js/catalog.js. Used by the React
   site until the backend API replaces it (Phase 6), and by the
   backend seed script (Phase 4).
   ⚠️ Values marked CONFIRM are placeholders from the original site.
   Products with real:true use actual photos and prices; all others
   are SAMPLE products rendered with illustrations.
   ========================================================== */
export const STORE = {
  name: "Shoponzy",
  whatsapp: "919000000000", // CONFIRM: orders are sent here
  phoneDisplay: "+91 90000 00000", // CONFIRM
  phoneTel: "+919000000000", // CONFIRM
  email: "support@shoponzy.in", // CONFIRM
  address: "Shoponzy, Street, City, Tamil Nadu", // CONFIRM
  instagram: "#", facebook: "#", youtube: "#", // CONFIRM
  currency: "₹",
  freeShippingAbove: 999, // CONFIRM
  shippingFee: 59, // CONFIRM
  prepaidOffPct: 5, // CONFIRM: extra % off for prepaid orders
  taxRate: 0,
  coupons: { WELCOME10: { pct: 10, min: 1499, label: "10% off on ₹1,499+" } }, // CONFIRM
  deliveryText: "Usually delivered in 3–7 working days", // CONFIRM
  offers: [
    "👟 Step into style! Extra 5% OFF on prepaid orders",
    "🚚 Free delivery on orders above ₹999",
    "🔁 7-day easy returns & exchange",
    "🎁 Use WELCOME10 for 10% off above ₹1,499",
  ],
};

const WP = "https://lightskyblue-stork-831178.hostingersite.com/wp-content/uploads/";

// subs: [id, name, art kind, art colour used in menus and heroes]
export const CATS = [
  { id: "shoes", name: "Shoes", tag: "Step into style", color: "#FF4D2E", gradient: ["#FF4D2E", "#FF8A3D"],
    subs: [["sneakers", "Sneakers", "sneaker", "#F2F2F2"], ["sandals", "Sandals", "sandal", "#7A4A2A"], ["boots", "Boots", "boot", "#1E1E1E"], ["loafers", "Loafers", "loafer", "#F2F2F2"], ["slides", "Slides", "slide", "#7A4A2A"]],
    heroArt: [["sneaker", "#F2F2F2"], ["sandal", "#7A4A2A"], ["boot", "#1E1E1E"]], bannerArt: ["sandal", "#7A4A2A"] },
  { id: "sunglass", name: "Sunglass", tag: "Made for the sun", color: "#1E88E5", gradient: ["#0D47A1", "#29B6F6"],
    subs: [["aviator", "Aviator", "aviator", "#2E5D3A"], ["wayfarer", "Wayfarer", "wayfarer", "#2B2B2B"], ["round", "Round", "round", "#E64A19"], ["sports", "Sports", "sport", "#2E5D3A"]],
    heroArt: [["aviator", "#2E5D3A"], ["wayfarer", "#2B2B2B"], ["round", "#E64A19"]], bannerArt: ["wayfarer", "#2B2B2B"] },
  { id: "perfumes", name: "Perfumes", tag: "Leave a trail", color: "#C2185B", gradient: ["#880E4F", "#EC407A"],
    subs: [["edp", "Eau de Parfum", "bottle", "#3B2A4A"], ["luxe", "Luxe Collection", "flacon", "#F2B33D"], ["mist", "Body Mist", "mist", "#9C8BD1"]],
    heroArt: [["bottle", "#3B2A4A"], ["flacon", "#F2B33D"], ["mist", "#9C8BD1"]], bannerArt: ["flacon", "#F2B33D"] },
  { id: "clothing", name: "Clothing", tag: "Everyday essentials", color: "#2E7D32", gradient: ["#1B5E20", "#66BB6A"],
    subs: [["tshirts", "T-Shirts", "tshirt", "#1E1E1E"], ["shirts", "Shirts", "shirt", "#9CC3E6"], ["hoodies", "Hoodies", "hoodie", "#7B1E2B"], ["jeans", "Jeans", "jeans", "#1E1E1E"]],
    heroArt: [["tshirt", "#1E1E1E"], ["shirt", "#9CC3E6"], ["hoodie", "#7B1E2B"]], bannerArt: ["shirt", "#9CC3E6"] },
  { id: "watches", name: "Watches", tag: "Time, well kept", color: "#5E35B1", gradient: ["#311B92", "#7E57C2"],
    subs: [["analog", "Analog", "analog", "#1E1E1E"], ["smart", "Smart Watches", "smart", "#D4A59A"]],
    heroArt: [["analog", "#1E1E1E"], ["smart", "#D4A59A"], ["analog", "#2E5D8A"]], bannerArt: ["smart", "#D4A59A"] },
  { id: "essentials", name: "Essentials", tag: "Carry it well", color: "#8D6E63", gradient: ["#4E342E", "#A1887F"],
    subs: [["wallets", "Wallets", "wallet", "#7A4A2A"], ["belts", "Belts", "belt", "#24365E"], ["caps", "Caps", "cap", "#6B7F5E"], ["bags", "Bags", "bag", "#7A4A2A"]],
    heroArt: [["wallet", "#7A4A2A"], ["belt", "#24365E"], ["cap", "#6B7F5E"]], bannerArt: ["belt", "#24365E"] },
];

const slugify = (value) => value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// helper: p(id, cat, sub, name, price, mrp, colours[[hex,name]], sizes, badge, isNew, extra)
const p = (id, cat, sub, name, price, mrp, colors, sizes, badge = "", isNew = false, extra = {}) =>
  ({ id, slug: slugify(name), cat, sub, name, price, mrp, colors, sizes, badge, isNew, ...extra });
const SH = ["6", "7", "8", "9", "10"], CL = ["S", "M", "L", "XL", "XXL"], FREE = ["Free size"];

export const PRODUCTS = [
  /* ---------- SHOES (first 4 are real products) ---------- */
  p("SANDAL-1", "shoes", "sandals", "Athletic Sandal – Ankle Strap", 600, 650, [["#B07A4A", "Tan"]], ["7", "10"], "Bestseller", false,
    { real: true, brand: "MHD", images: ["2023/08/Athletic-Sandal-1.webp", "2023/08/Athletic-Sandal-2.webp", "2023/08/Athletic-Sandal-3.webp", "2023/08/Athletic-Sandal-5.webp", "2023/08/Athletic-Sandal-4.webp"].map((x) => WP + x),
      desc: "Tan ankle-strap athletic sandals with adjustable straps, a comfortable synthetic finish and a durable rubber sole. Lightweight flat sandals with an open-toe design for casual outings and everyday walking.",
      specs: [["Sandal type", "Athletic sandal"], ["Occasion", "Casual"], ["Style", "Ankle strap"], ["Heel", "Flat"], ["Water resistance", "Not water resistant"]] }),
  p("SANDAL-2", "shoes", "sandals", "Athletic Sandal – Ankle Strap MHD", 560, 600, [["#6B4A33", "Brown"]], ["7", "10"], "", true,
    { real: true, brand: "MHD", images: ["2026/10/Athletic-Sandal-7.webp", "2026/10/Athletic-Sandal-8.webp"].map((x) => WP + x) }),
  p("BOOT-BRN", "shoes", "boots", "Chelsea Boots – Brown", 480, 0, [["#7A4A2A", "Brown"]], SH, "New Drop", true,
    { real: true, from: true, priceTo: 520, images: ["2026/10/chelsea-boots-brown-1.webp", "2026/10/chelsea-boots-brown-3.webp"].map((x) => WP + x) }),
  p("BOOT-BLK", "shoes", "boots", "Chelsea Boots – Black", 480, 0, [["#1E1E1E", "Black"]], SH, "New Drop", true,
    { real: true, from: true, priceTo: 520, images: ["2026/10/chelsea-boots-black-1.webp", "2026/10/chelsea-boots-black-3.webp"].map((x) => WP + x) }),
  p("SH-101", "shoes", "sneakers", "Men White Lace-Up Everyday Sneakers", 1299, 2499, [["#F2F2F2", "White"], ["#1E1E1E", "Black"]], SH, "Trending", true),
  p("SH-102", "shoes", "sneakers", "Men Navy Knit Running Sneakers", 1499, 2999, [["#24365E", "Navy"], ["#7A8794", "Grey"]], SH, "", true),
  p("SH-103", "shoes", "loafers", "Men Brown Leather Driving Loafers", 1799, 3499, [["#6B4A33", "Brown"], ["#1E1E1E", "Black"]], SH, "Bestseller"),
  p("SH-104", "shoes", "slides", "Unisex Black Cushioned Slides", 499, 899, [["#1E1E1E", "Black"], ["#3C6E9E", "Blue"]], SH),
  p("SH-105", "shoes", "sneakers", "Women Pink Chunky Sneakers", 1399, 2799, [["#F4A7B9", "Pink"], ["#F2F2F2", "White"]], ["4", "5", "6", "7"], "New Drop", true),
  p("SH-106", "shoes", "sandals", "Men Black Strap Floater Sandals", 699, 1299, [["#1E1E1E", "Black"], ["#556B2F", "Olive"]], SH),

  /* ---------- SUNGLASS ---------- */
  p("SG-201", "sunglass", "aviator", "Gold Metal Aviator – Green Lens", 899, 1999, [["#2E5D3A", "Green"], ["#3B3B3B", "Smoke"]], FREE, "Bestseller", false, { frame: "#C9A44C" }),
  p("SG-202", "sunglass", "wayfarer", "Classic Black Wayfarer – UV400", 699, 1499, [["#2B2B2B", "Black"], ["#7A4A2A", "Tortoise"]], FREE, "Trending", true),
  p("SG-203", "sunglass", "round", "Retro Round Sunglasses – Brown Gradient", 799, 1699, [["#7A4A2A", "Brown"], ["#2B2B2B", "Black"]], FREE, "", true),
  p("SG-204", "sunglass", "sports", "Polarised Sports Wraparound – Blue Mirror", 1199, 2499, [["#1E88E5", "Blue mirror"], ["#E64A19", "Fire"]], FREE, "New Drop", true),
  p("SG-205", "sunglass", "aviator", "Silver Aviator – Blue Gradient", 949, 1999, [["#3F6FA8", "Blue"], ["#3B3B3B", "Smoke"]], FREE),
  p("SG-206", "sunglass", "wayfarer", "Clear Frame Wayfarer – Grey Lens", 749, 1499, [["#555555", "Grey"], ["#9C6B3F", "Amber"]], FREE),

  /* ---------- PERFUMES ---------- */
  p("PF-301", "perfumes", "edp", "Oud Noir Eau de Parfum 100 ml", 1299, 2499, [["#3B2A4A", "Oud Noir"]], ["50 ml", "100 ml"], "Bestseller"),
  p("PF-302", "perfumes", "edp", "Citrus Breeze Eau de Parfum 100 ml", 999, 1999, [["#F2B33D", "Citrus"]], ["50 ml", "100 ml"], "", true),
  p("PF-303", "perfumes", "luxe", "Rose Velvet Luxe Parfum 75 ml", 1799, 3499, [["#C2185B", "Rose"]], ["75 ml"], "New Drop", true),
  p("PF-304", "perfumes", "mist", "Vanilla Cloud Body Mist 200 ml", 449, 799, [["#F3D9C3", "Vanilla"]], ["200 ml"], "Trending"),
  p("PF-305", "perfumes", "luxe", "Aqua Marine Luxe Parfum 75 ml", 1699, 3299, [["#4FA3C7", "Aqua"]], ["75 ml"]),
  p("PF-306", "perfumes", "mist", "Fresh Lavender Body Mist 200 ml", 449, 799, [["#9C8BD1", "Lavender"]], ["200 ml"], "", true),

  /* ---------- CLOTHING ---------- */
  p("CL-401", "clothing", "tshirts", "Men Oversized Cotton T-Shirt", 499, 999, [["#1E1E1E", "Black"], ["#F2F2F2", "White"], ["#6B7F5E", "Olive"]], CL, "Bestseller"),
  p("CL-402", "clothing", "shirts", "Men Sky Blue Oxford Casual Shirt", 899, 1799, [["#9CC3E6", "Sky blue"], ["#F2F2F2", "White"]], CL, "", true),
  p("CL-403", "clothing", "hoodies", "Unisex Charcoal Fleece Hoodie", 1199, 2299, [["#3D3D42", "Charcoal"], ["#7B1E2B", "Maroon"]], CL, "New Drop", true),
  p("CL-404", "clothing", "jeans", "Men Slim Fit Mid-Blue Jeans", 1099, 2199, [["#3E5F8A", "Mid blue"], ["#22324A", "Dark blue"]], ["30", "32", "34", "36"], "Trending"),
  p("CL-405", "clothing", "tshirts", "Women Relaxed Fit Graphic T-Shirt", 449, 899, [["#F4A7B9", "Pink"], ["#F2E3C4", "Cream"]], ["XS", "S", "M", "L"], "", true),
  p("CL-406", "clothing", "shirts", "Men Olive Linen Blend Shirt", 999, 1999, [["#6B7F5E", "Olive"], ["#D8C8A8", "Beige"]], CL),

  /* ---------- WATCHES ---------- */
  p("WT-501", "watches", "analog", "Men Classic Black Dial Analog Watch", 1499, 3499, [["#1E1E1E", "Black"], ["#7A4A2A", "Brown"]], FREE, "Bestseller"),
  p("WT-502", "watches", "smart", "Smart Watch with AMOLED Display & Calling", 2499, 5999, [["#1E1E1E", "Black"], ["#E57373", "Rose"]], FREE, "Trending", true),
  p("WT-503", "watches", "analog", "Women Rose Gold Mesh Strap Watch", 1699, 3999, [["#D4A59A", "Rose gold"], ["#BDBDBD", "Silver"]], FREE, "New Drop", true),
  p("WT-504", "watches", "smart", "Fitness Smart Watch with SpO2 & Heart Rate", 1999, 4999, [["#2E5D8A", "Blue"], ["#1E1E1E", "Black"]], FREE),
  p("WT-505", "watches", "analog", "Men Silver Chronograph Steel Watch", 2299, 4999, [["#BDBDBD", "Silver"], ["#1E1E1E", "Black"]], FREE, "", true),

  /* ---------- ESSENTIALS ---------- */
  p("ES-601", "essentials", "wallets", "Men Brown Genuine Leather Bifold Wallet", 599, 1299, [["#7A4A2A", "Brown"], ["#1E1E1E", "Black"]], FREE, "Bestseller"),
  p("ES-602", "essentials", "belts", "Men Black Leather Formal Belt", 549, 1099, [["#1E1E1E", "Black"], ["#7A4A2A", "Brown"]], ["32", "34", "36", "38"], ""),
  p("ES-603", "essentials", "caps", "Unisex Cotton Baseball Cap", 349, 699, [["#24365E", "Navy"], ["#1E1E1E", "Black"], ["#C9B48A", "Beige"]], FREE, "Trending", true),
  p("ES-604", "essentials", "bags", "Everyday Laptop Backpack 25L", 1299, 2599, [["#3D3D42", "Charcoal"], ["#24365E", "Navy"]], FREE, "New Drop", true),
  p("ES-605", "essentials", "wallets", "Women Slim Card Holder Wallet", 449, 899, [["#C2185B", "Berry"], ["#F2E3C4", "Cream"]], FREE, "", true),
  p("ES-606", "essentials", "bags", "Canvas Weekend Duffle Bag", 1499, 2999, [["#6B7F5E", "Olive"], ["#C9B48A", "Khaki"]], FREE),
];

/* Home page hero slides */
export const HERO_SLIDES = [
  { kick: "Shoponzy · Shoes", title: "Step into style", text: "New season sneakers, sandals & boots.", cta: "Shop shoes", href: "/categories/shoes", bg: "linear-gradient(120deg,#FF4D2E,#FF8A3D 60%,#FFB36B)", art: ["sneaker", "#1E1E1E", "shoes"] },
  { kick: "Shoponzy · Sunglass", title: "Made for the sun", text: "UV400 aviators, wayfarers and sport shades.", cta: "Shop sunglasses", href: "/categories/sunglass", bg: "linear-gradient(120deg,#0D47A1,#1E88E5 60%,#4FC3F7)", art: ["aviator", "#2E5D3A", "sunglass"] },
  { kick: "Shoponzy · Perfumes", title: "Leave a trail", text: "Long-lasting parfums and body mists.", cta: "Shop perfumes", href: "/categories/perfumes", bg: "linear-gradient(120deg,#4A0E2E,#AD1457 55%,#EC407A)", art: ["flacon", "#C2185B", "perfumes"] },
  { kick: "Shoponzy · Watches", title: "Time, well kept", text: "Analog classics and smart watches.", cta: "Shop watches", href: "/categories/watches", bg: "linear-gradient(120deg,#1A1033,#5E35B1 60%,#9575CD)", art: ["smart", "#E57373", "watches"] },
];

/* "Shop by occasion" tiles on the home page */
export const OCCASIONS = [
  { name: "Everyday Ease", href: "/categories/shoes?sub=slides", art: "slide", color: "#3C6E9E", cat: "shoes" },
  { name: "Weekend Ready", href: "/categories/shoes?sub=sneakers", art: "sneaker", color: "#FF4D2E", cat: "shoes" },
  { name: "Work & Beyond", href: "/categories/watches", art: "analog", color: "#1E1E1E", cat: "watches" },
  { name: "Sun & Travel", href: "/categories/sunglass", art: "aviator", color: "#2E5D3A", cat: "sunglass" },
];

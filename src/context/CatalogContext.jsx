import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { STORE as DEFAULT_STORE } from "../data/catalog";
import { API_BASE } from "../api/config";

const CatalogContext = createContext(null);
const PRODUCT_PAGE_SIZE = 60;

async function getJson(path) {
  const response = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  const body = await response.json().catch(() => null);
  if (!response.ok || body?.success !== true) {
    throw new Error(body?.error?.message || `Store API request failed (${response.status}).`);
  }
  return body;
}

function mapCategory(category) {
  const display = category.display || {};
  const firstChild = category.children?.[0]?.display || {};
  return {
    // Illustration for the category itself; categories added in the admin may have no subcategories yet.
    icon: [firstChild.artKind || display.artKind || "bag", firstChild.artColor || display.artColor || display.color || "#999999"],
    id: category.slug,
    name: category.name,
    image: category.image?.url || "",
    tag: display.tagline || category.description || "",
    color: display.color || "#555555",
    gradient: display.gradient?.length === 2 ? display.gradient : ["#333333", "#777777"],
    heroArt: Array.from({ length: 3 }, (_, index) => {
      const art = display.heroArt?.[index] || display.heroArt?.[0] || { kind: display.artKind || "bag", color: display.artColor || "#999999" };
      return [art.kind, art.color];
    }),
    bannerArt: display.bannerArt ? [display.bannerArt.kind, display.bannerArt.color] : [display.artKind || "bag", display.artColor || "#999999"],
    subs: (category.children || []).map((child) => [
      child.slug,
      child.name,
      child.display?.artKind || "bag",
      child.display?.artColor || display.color || "#999999",
    ]),
  };
}

function mapProduct(product, categoryById) {
  const path = product.categoryPath || [];
  const category = categoryById.get(path[0]);
  const subcategory = categoryById.get(path[path.length - 1]);
  const colors = product.colors?.length
    ? product.colors.map(({ hex, name }) => [hex || "#999999", name])
    : [["#999999", "Default"]];
  const sizes = product.sizes?.length ? product.sizes.map(String) : ["One size"];
  return {
    id: product.legacyId || product.id,
    apiId: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand || "",
    desc: product.description || product.shortDescription || "",
    cat: category?.slug || "essentials",
    sub: subcategory?.slug || "",
    colors,
    sizes,
    images: (product.images || []).map((image) => image.url).filter(Boolean),
    specs: (product.specs || []).map(({ label, value }) => [label, value]),
    variants: product.variants || [],
    price: product.price,
    priceTo: product.priceTo,
    from: product.priceTo != null && product.priceTo > product.price,
    mrp: product.mrp || 0,
    isNew: Boolean(product.isNewArrival),
    isBestseller: Boolean(product.isBestseller),
    isTrending: Boolean(product.isTrending),
    badge: product.badge || "",
  };
}

function mapSettings(settings) {
  const general = settings.general || {};
  const commerce = settings.commerce || {};
  const contact = settings.contact || {};
  const announcement = settings.announcement || {};
  const branding = settings.branding || {};
  const headerFooter = settings.headerFooter || {};
  const seo = settings.seo || {};
  const homeCategories = settings.homeCategories || {};
  return {
    ...DEFAULT_STORE,
    name: general.websiteName || DEFAULT_STORE.name,
    homeCategories: {
      categories: homeCategories.categories || [],
      showAllCategories: homeCategories.showAllCategories ?? true,
      showNewIn: homeCategories.showNewIn ?? true,
      showDeals: homeCategories.showDeals ?? true,
    },
    logo: branding.logo?.url || headerFooter.headerLogo?.url || "",
    headerLogo: headerFooter.headerLogo?.url || "",
    footerLogo: headerFooter.footerLogo?.url || branding.footerLogo?.url || "",
    favicon: branding.favicon?.url || "",
    footerDescription: headerFooter.footerDescription || "",
    shareImage: seo.shareImage?.url || "",
    freeShippingAbove: commerce.freeShippingAbove ?? DEFAULT_STORE.freeShippingAbove,
    shippingFee: commerce.shippingFee ?? DEFAULT_STORE.shippingFee,
    prepaidOffPct: commerce.prepaidOffPct ?? DEFAULT_STORE.prepaidOffPct,
    deliveryText: commerce.deliveryText || DEFAULT_STORE.deliveryText,
    phoneDisplay: contact.phone || DEFAULT_STORE.phoneDisplay,
    phoneTel: contact.phone ? contact.phone.replace(/[^\d+]/g, "") : DEFAULT_STORE.phoneTel,
    email: contact.email || DEFAULT_STORE.email,
    address: contact.address || DEFAULT_STORE.address,
    whatsapp: contact.whatsapp ? contact.whatsapp.replace(/\D/g, "") : DEFAULT_STORE.whatsapp,
    instagram: contact.instagram || DEFAULT_STORE.instagram,
    facebook: contact.facebook || DEFAULT_STORE.facebook,
    youtube: contact.youtube || DEFAULT_STORE.youtube,
    offers: announcement.active && announcement.messages?.length ? announcement.messages : [],
  };
}

async function loadCatalog() {
  const [categoryResponse, homepageResponse, settingsResponse, firstPage] = await Promise.all([
    getJson("/categories"),
    getJson("/homepage"),
    getJson("/site-settings"),
    getJson(`/products?limit=${PRODUCT_PAGE_SIZE}&page=1`),
  ]);
  const categories = categoryResponse.data.map(mapCategory);
  const categoryById = new Map();
  function collectCategoryIds(nodes) {
    for (const node of nodes) {
      categoryById.set(node.id, node);
      collectCategoryIds(node.children || []);
    }
  }
  collectCategoryIds(categoryResponse.data);
  const pages = firstPage.meta?.pages || 1;
  const remaining = await Promise.all(
    Array.from({ length: Math.max(0, pages - 1) }, (_, index) =>
      getJson(`/products?limit=${PRODUCT_PAGE_SIZE}&page=${index + 2}`),
    ),
  );
  const products = [...firstPage.data, ...remaining.flatMap((page) => page.data)]
    .map((product) => mapProduct(product, categoryById));
  const mapHomepageProduct = (product) => mapProduct(product, categoryById);
  const sections = homepageResponse.data.sections.map((section) => ({
    ...section,
    products: (section.products || []).map(mapHomepageProduct),
  }));
  const slides = homepageResponse.data.banners.map((banner) => ({
    kick: banner.kicker,
    title: banner.title,
    text: banner.subtitle,
    cta: banner.buttonText,
    href: banner.url,
    bg: banner.background,
    image: banner.image?.url || "",
    mobileImage: banner.mobileImage?.url || "",
    art: [banner.art?.kind || "bag", banner.art?.color || "#999999", banner.art?.category || "essentials"],
  }));
  return {
    categories,
    products,
    slides,
    sections,
    store: mapSettings(settingsResponse.data),
  };
}

export function CatalogProvider({ children }) {
  const [catalog, setCatalog] = useState({
    categories: [],
    products: [],
    slides: [],
    sections: [],
    store: DEFAULT_STORE,
    status: "loading",
    error: "",
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setCatalog((current) => ({ ...current, status: current.status === "ready" ? "ready" : "loading", error: "" }));
    loadCatalog().then((data) => {
      if (active) setCatalog({ ...data, status: "ready", error: "" });
    }).catch((error) => {
      if (active) setCatalog((current) => ({ ...current, status: current.status === "ready" ? "ready" : "error", error: error.message }));
    });
    return () => { active = false; };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") retry();
    };
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => document.removeEventListener("visibilitychange", refreshWhenVisible);
  }, [retry]);

  return <CatalogContext.Provider value={{ ...catalog, retry }}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const catalog = useContext(CatalogContext);
  if (!catalog) throw new Error("useCatalog must be used inside CatalogProvider");
  return catalog;
}

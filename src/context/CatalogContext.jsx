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
  const descendants = [];
  function collectDescendants(children, ancestors = [], ancestorIds = [category.id]) {
    for (const child of children || []) {
      const pathNames = [...ancestors, child.name];
      descendants.push([
        child.slug,
        child.name,
        child.display?.artKind || "bag",
        child.display?.artColor || display.color || "#999999",
        child.image?.url || child.productImage?.url || "",
        child.id,
        pathNames.join(" / "),
        child.level,
        ancestorIds,
      ]);
      collectDescendants(child.children, pathNames, [...ancestorIds, child.id]);
    }
  }
  collectDescendants(category.children);
  return {
    // Illustration for the category itself; categories added in the admin may have no subcategories yet.
    icon: [firstChild.artKind || display.artKind || "bag", firstChild.artColor || display.artColor || display.color || "#999999"],
    id: category.slug,
    name: category.name,
    image: category.image?.url || "",
    exploreImage: category.exploreImage?.url || "",
    bannerImage: category.bannerImage?.url || "",
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
      child.image?.url || "",
      child.id,
      child.name,
      child.level,
      [category.id],
    ]),
    descendants,
  };
}

function mapProduct(product, categoryById) {
  const path = product.categoryPath || [];
  const category = categoryById.get(path[0]);
  const assignedCategoryId = typeof product.category === "string" ? product.category : product.category?.id || product.category?._id;
  const assignedCategory = categoryById.get(assignedCategoryId);
  const subcategory = assignedCategory || categoryById.get(path[path.length - 1]);
  const colors = product.colors?.length
    ? product.colors.map(({ hex, name, featuredImage }) => [hex || "#999999", name, featuredImage?.url || ""])
    : [["#999999", "Default"]];
  const sizes = product.sizes?.length ? product.sizes.map(String) : ["One size"];
  const images = (product.images || []).map((image) => image.url).filter(Boolean);
  const colorImages = (product.colors || []).map((color) => [
    color.featuredImage?.url,
    ...(color.images || []).map((image) => image.url),
    ...images,
  ].filter((url, index, list) => url && list.indexOf(url) === index));
  // Product totals are normally derived by the API. Older/simple product records may
  // only have prices on their single variant, so keep storefront pricing available there too.
  const variants = product.variants || [];
  const variantPrices = variants.map((variant) => Number(variant.price)).filter(Number.isFinite);
  const variantMrps = variants.map((variant) => Number(variant.mrp)).filter(Number.isFinite);
  const price = product.price ?? product.minPrice ?? (variantPrices.length ? Math.min(...variantPrices) : 0);
  const mrp = Math.max(Number(product.mrp) || 0, variantMrps.length ? Math.max(...variantMrps) : 0);
  return {
    id: product.legacyId || product.id,
    apiId: product.id,
    categoryIds: path,
    assignedCategoryId,
    slug: product.slug,
    name: product.name,
    brand: product.brand || "",
    desc: product.description || product.shortDescription || "",
    cat: category?.slug || "essentials",
    sub: subcategory?.slug || "",
    colors,
    sizes,
    images,
    colorImages,
    seo: product.seo || {},
    specs: (product.specs || []).map(({ label, value }) => [label, value]),
    variants,
    price,
    priceTo: product.priceTo,
    from: product.priceTo != null && product.priceTo > price,
    mrp,
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
      newInImage: homeCategories.newInImage?.url || "",
    },
    logo: branding.logo?.url || headerFooter.headerLogo?.url || "",
    headerLogo: headerFooter.headerLogo?.url || "",
    footerLogo: headerFooter.footerLogo?.url || branding.footerLogo?.url || "",
    favicon: branding.favicon?.url || "",
    seo: { ...seo },
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

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api } from "./lib/api.js";
import { readStored, writeStored } from "./lib/format.js";

const DEFAULT_CONFIG = {
  categories: ["Légumes", "Fruits", "Riz & céréales", "Feuilles & herbes", "Épices", "Autres"],
  units: ["kg", "botte", "régime", "sac de 5 kg"],
  zones: ["Antananarivo", "Antsirabe", "Fianarantsoa", "Mahajanga", "Analamanga"],
  service_fee: 0,
};

const StoreContext = createContext(null);
export const useStore = () => useContext(StoreContext);

export function StoreProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [cart, setCart] = useState(() => readStored("madaagri-cart", []));
  const [favorites, setFavorites] = useState(() => readStored("madaagri-favorites", []));
  const [search, setSearch] = useState("");
  const [checkout, setCheckout] = useState(() => ({
    delivery_method: "delivery", delivery_address: readStored("madaagri-address", ""), note: "",
    payment_method: "at_delivery", payment_phone: "",
  }));
  const [toastMessage, setToastMessage] = useState("");
  const [dialog, setDialog] = useState(null);
  const toastTimer = useRef();

  const toast = useCallback((message) => {
    setToastMessage(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMessage(""), 2800);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const data = await api("/bootstrap");
      setProducts(data.products || []);
      setUser(data.user || null);
      setNotifications(data.notifications || []);
      setConfig({ ...DEFAULT_CONFIG, ...(data.catalog_config || {}) });
      setLoadError("");
      return data;
    } catch (error) {
      setLoadError(error.message);
      return null;
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => writeStored("madaagri-cart", cart), [cart]);
  useEffect(() => writeStored("madaagri-favorites", favorites), [favorites]);

  const addToCart = useCallback((product, quantity = 1) => {
    if (!product) return;
    const first = cart.length ? products.find((p) => p.id === cart[0].product_id) : null;
    if (first && first.producer_name !== product.producer_name) {
      toast("Une commande regroupe les produits d’un seul producteur. Videz le panier pour changer.");
      return;
    }
    setCart((lines) => {
      const line = lines.find((l) => l.product_id === product.id);
      if (line) return lines.map((l) => l === line ? { ...l, quantity: Math.min(product.stock, l.quantity + quantity) } : l);
      return [...lines, { product_id: product.id, quantity: Math.min(product.stock, quantity) }];
    });
    toast(product.name + " ajouté au panier.");
  }, [cart, products, toast]);

  const setQuantity = useCallback((productId, quantity) => {
    const product = products.find((p) => p.id === productId);
    setCart((lines) => lines.map((l) => l.product_id === productId ? { ...l, quantity: Math.max(1, Math.min(product ? product.stock : quantity, quantity)) } : l));
  }, [products]);
  const removeFromCart = useCallback((productId) => setCart((lines) => lines.filter((l) => l.product_id !== productId)), []);
  const clearCart = useCallback(() => setCart([]), []);

  const toggleFavorite = useCallback((product) => {
    setFavorites((ids) => {
      const has = ids.includes(product.id);
      toast(has ? product.name + " retiré de vos favoris." : product.name + " ajouté à vos favoris.");
      return has ? ids.filter((id) => id !== product.id) : [...ids, product.id];
    });
  }, [toast]);

  const updateCheckout = useCallback((values) => {
    setCheckout((data) => {
      const next = { ...data, ...values };
      if (values.delivery_address !== undefined) writeStored("madaagri-address", next.delivery_address);
      return next;
    });
  }, []);

  // Promise-based dialog: ask({ title, message, fields, confirmLabel }) resolves with the field values or null.
  const ask = useCallback((options) => new Promise((resolve) => setDialog({ ...options, resolve })), []);
  const closeDialog = useCallback((values) => {
    setDialog((current) => { current?.resolve(values); return null; });
  }, []);

  const cartLines = useMemo(() => cart
    .map((line) => ({ ...line, product: products.find((p) => p.id === line.product_id) }))
    .filter((line) => line.product), [cart, products]);
  const cartTotal = cartLines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const serviceFee = Number(config.service_fee) || 0;

  const value = {
    products, user, setUser, notifications, config, ready, loadError, refresh,
    cart, cartLines, cartTotal, cartCount, serviceFee, addToCart, setQuantity, removeFromCart, clearCart,
    favorites, toggleFavorite, search, setSearch, checkout, updateCheckout,
    toast, toastMessage, ask, dialog, closeDialog,
  };
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

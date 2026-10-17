const numberFormat = new Intl.NumberFormat("fr-FR");
export const money = (amount) => numberFormat.format(Number(amount) || 0) + " Ar";
export const rating = (value) => Number(value || 4.7).toFixed(1).replace(".", ",");

const WEBP = new Set(["tomates.png", "riz-rouge.png", "bredes-mafana.png", "bananes.png", "aubergines-piments.png", "hero-marche.png"]);
export function photo(name) {
  const file = name || "tomates.png";
  return "/assets/product-photos/" + encodeURIComponent(WEBP.has(file) ? file.replace(/\.png$/, ".webp") : file);
}

export const unitShort = (unit) => String(unit || "").split(" ")[0];

// SQLite stores CURRENT_TIMESTAMP in UTC ("YYYY-MM-DD HH:MM:SS").
export function parseDate(value) {
  const date = new Date(String(value).replace(" ", "T") + "Z");
  return Number.isNaN(date.getTime()) ? null : date;
}
export function orderDate(value, withTime = false) {
  const date = parseDate(value);
  if (!date) return String(value || "");
  const time = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (date.toDateString() === new Date().toDateString()) return "Aujourd’hui" + (withTime ? " · " + time : "");
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: withTime ? undefined : "numeric" }) + (withTime ? " · " + time : "");
}

export const paymentName = (method) => ({ mvola: "MVola", orange_money: "Orange Money", at_delivery: "À la réception" })[method] || "À convenir";

export function orderTotal(order) {
  const delivery = order.delivery_method === "delivery" && order.delivery_fee_accepted ? Number(order.delivery_fee || 0) : 0;
  return Number(order.subtotal) + Number(order.service_fee || 0) + delivery;
}

// Short status label + tone used by the status pills of screens 12–15.
export function orderStatus(order, role) {
  const quoted = order.status === "pending_confirmation" && order.delivery_status === "quoted";
  const buyer = role === "buyer";
  switch (order.status) {
    case "pending_confirmation": return [quoted ? "Frais à valider" : "À confirmer", "warm"];
    case "accepted": return ["Confirmée", "warm"];
    case "preparing": return [buyer ? "En préparation" : "À préparer", "warm"];
    case "ready":
      if (order.delivery_method !== "delivery") return ["Prête au retrait", "green"];
      return [order.delivery_status === "in_transit" ? "En livraison" : "Prête", "green"];
    case "delivered": return [buyer ? "Livrée" : "Terminée", "green"];
    case "cancelled": return ["Annulée", "grey"];
    default: return [order.status, "grey"];
  }
}

export function itemsShort(order) {
  return order.items.map((item) => `${item.name.split(" ")[0]} · ${item.quantity} ${unitShort(item.unit)}`).join(", ");
}

export function maskPhone(phone) {
  const digits = String(phone || "").replace(/[^\d+]/g, "");
  if (digits.length < 6) return phone || "";
  const local = digits.startsWith("+261") ? digits.slice(4) : digits.replace(/^0/, "");
  return `+261 ${local.slice(0, 2)} •• •• ${local.slice(-2)}`;
}

export function addressCity(address, zones = []) {
  const text = String(address || "").toLocaleLowerCase("fr");
  return zones.find((zone) => text.includes(zone.toLocaleLowerCase("fr"))) || "Antananarivo";
}

export const initials = (name) => String(name || "").split(/\s+/).filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase();

export function readStored(key, fallback) {
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback; } catch { return fallback; }
}
export function writeStored(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode: keep in memory only */ }
}

import { useState } from "react";
import { useStore } from "../store.jsx";
import { post } from "../lib/api.js";
import { addressCity, money } from "../lib/format.js";

const NEXT_LABEL = { accepted: "Confirmer la commande", preparing: "Marquer en préparation", delivered: "Confirmer la remise" };

// Every decision of the order lifecycle, shown under the tracking timeline (screen 11).
export default function OrderActions({ order, onDone }) {
  const { user, config, toast, ask } = useStore();
  const [busy, setBusy] = useState(false);
  const staff = user.role === "producer" || user.role === "admin";
  const delivery = order.delivery_method === "delivery";

  const run = async (call, message) => {
    setBusy(true);
    try { await call(); toast(message); await onDone(); }
    catch (error) { toast(error.message); }
    setBusy(false);
  };
  const setStatus = async (status) => {
    let reason = "";
    if (status === "cancelled") {
      const values = await ask({ title: order.status === "pending_confirmation" ? "Refuser la commande" : "Annuler la commande", danger: true, confirmLabel: "Confirmer l’annulation",
        message: "L’acheteur est prévenu. Le stock réservé est remis en vente.",
        fields: [{ name: "reason", label: "Motif (obligatoire)", type: "textarea", required: true, minLength: 5, placeholder: "Ex. récolte abîmée par la pluie" }] });
      if (!values) return;
      reason = values.reason.trim();
    }
    run(() => post(`/orders/${order.id}/status`, { status, reason }), "Le statut de la commande a été mis à jour.");
  };
  const confirmPayment = async () => {
    const values = await ask({ title: "Confirmer le paiement reçu", confirmLabel: "Confirmer le paiement",
      message: "Saisissez la référence d’un reçu réellement vérifié ou la confirmation de remise en espèces.",
      fields: [{ name: "reference", label: "Référence du reçu", required: true, minLength: 5, placeholder: "Ex. MVola 0123456789" }] });
    if (values) run(() => post(`/orders/${order.id}/payment`, { reference: values.reference.trim() }), "Paiement confirmé manuellement.");
  };
  const quote = (event) => {
    event.preventDefault();
    const v = Object.fromEntries(new FormData(event.currentTarget).entries());
    run(() => post(`/orders/${order.id}/delivery`, { fee: Number(v.fee), zone: v.zone, responsible: v.responsible }), "Tarif envoyé à l’acheteur.");
  };
  const answerQuote = async (accepted) => {
    if (!accepted && !(await ask({ title: "Refuser les frais de livraison ?", message: "Refuser ces frais annule la commande.", confirmLabel: "Refuser et annuler", danger: true }))) return;
    run(() => post(`/orders/${order.id}/delivery/accept`, { accepted }), accepted ? "Frais acceptés. Le producteur peut confirmer la commande." : "Commande annulée.");
  };
  const review = async () => {
    const values = await ask({ title: "Laisser un avis", confirmLabel: "Publier mon avis", fields: [
      { name: "rating", label: "Votre note", type: "select", defaultValue: "5", options: [5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: "★".repeat(n) + " " + n + "/5" })) },
      { name: "comment", label: "Votre avis (facultatif)", type: "textarea" }] });
    if (values) run(() => post("/reviews", { order_code: order.code, rating: Number(values.rating), comment: values.comment }), "Merci, votre avis a été enregistré.");
  };
  const claim = async () => {
    const values = await ask({ title: "Signaler un problème", confirmLabel: "Envoyer la réclamation",
      fields: [{ name: "details", label: "Décrivez le problème rencontré", type: "textarea", required: true, minLength: 5 }] });
    if (values) run(() => post("/claims", { order_code: order.code, reason: "quality", details: values.details }), "Votre réclamation est enregistrée.");
  };

  const buttons = [];
  const button = (key, label, onClick, outline = false) => buttons.push(
    <button key={key} type="button" disabled={busy} onClick={onClick} className={`${outline ? "btn-outline" : "btn-primary"} h-9 px-4 text-[10px]`}>{label}</button>);
  let quoteBlock = null;

  if (staff) {
    if (order.status === "pending_confirmation" && delivery && !order.delivery_fee_accepted) {
      const quoted = order.delivery_status === "quoted";
      quoteBlock = (
        <form onSubmit={quote} className="grid gap-3 rounded-xl bg-soft p-4">
          <b className="text-[10px] text-forest">{quoted ? `Tarif proposé : ${money(order.delivery_fee)} · en attente de l’acheteur` : "Proposer les frais de livraison"}</b>
          <div className="grid gap-2.5 md:grid-cols-[120px_1fr_1.4fr]">
            <label className="grid gap-1.5 text-[9px] font-bold">Frais (Ar)<input name="fee" type="number" min="0" max="1000000" required defaultValue={order.delivery_fee ?? ""} className="input h-9" /></label>
            <label className="grid gap-1.5 text-[9px] font-bold">Zone
              <select name="zone" required defaultValue={order.delivery_zone || addressCity(order.delivery_address, config.zones)} className="input h-9">
                {config.zones.map((z) => <option key={z}>{z}</option>)}
              </select></label>
            <label className="grid gap-1.5 text-[9px] font-bold">Livreur / responsable<input name="responsible" minLength={2} required defaultValue={order.delivery_responsible || ""} placeholder="Ex. Ferme Rakoto" className="input h-9" /></label>
          </div>
          <button disabled={busy} className="btn-primary h-9 justify-self-start px-4 text-[10px]">{quoted ? "Modifier le tarif" : "Envoyer le tarif à l’acheteur"}</button>
        </form>
      );
    }
    const canAccept = !delivery || order.delivery_fee_accepted;
    if (order.status === "pending_confirmation" && canAccept) button("accept", NEXT_LABEL.accepted, () => setStatus("accepted"));
    if (order.status === "accepted") button("prepare", NEXT_LABEL.preparing, () => setStatus("preparing"));
    if (order.status === "preparing") button("ready", delivery ? "Marquer prête à livrer" : "Marquer prête au retrait", () => setStatus("ready"));
    if (order.status === "ready" && delivery && order.delivery_status === "confirmed")
      button("start", "Démarrer la livraison", () => run(() => post(`/orders/${order.id}/delivery/status`, { status: "in_transit" }), "Livraison démarrée. L’acheteur est prévenu."));
    if (order.status === "ready" && (!delivery || order.delivery_status === "in_transit")) button("deliver", NEXT_LABEL.delivered, () => setStatus("delivered"));
    if (["pending_confirmation", "accepted", "preparing"].includes(order.status))
      button("cancel", order.status === "pending_confirmation" ? "Refuser" : "Annuler", () => setStatus("cancelled"), true);
    if (order.payment_status === "pending" && order.status !== "cancelled" && (order.payment_method !== "at_delivery" || order.status === "delivered"))
      button("pay", "Confirmer le paiement reçu", confirmPayment, true);
  } else {
    if (order.status === "pending_confirmation" && order.delivery_status === "quoted") {
      quoteBlock = (
        <div className="grid gap-2.5 rounded-xl bg-soft p-4">
          <b className="text-[10px] text-forest">Frais de livraison proposés : {money(order.delivery_fee)}</b>
          <small className="text-[9px] text-muted">{order.delivery_zone} · {order.delivery_responsible} · nouveau total {money(Number(order.subtotal) + Number(order.service_fee || 0) + Number(order.delivery_fee || 0))}</small>
          <div className="flex flex-wrap gap-2.5">
            <button type="button" disabled={busy} onClick={() => answerQuote(true)} className="btn-primary h-9 px-4 text-[10px]">Accepter les frais</button>
            <button type="button" disabled={busy} onClick={() => answerQuote(false)} className="btn-outline h-9 px-4 text-[10px]">Refuser et annuler</button>
          </div>
        </div>
      );
    }
    if (order.status === "delivered") {
      button("review", "Laisser un avis", review);
      button("claim", "Signaler un problème", claim, true);
    }
  }
  if (!quoteBlock && !buttons.length) return null;
  return (
    <div className="mt-6 grid gap-3 border-t border-line pt-5">
      {quoteBlock}
      {buttons.length > 0 && <div className="flex flex-wrap gap-2.5">{buttons}</div>}
    </div>
  );
}

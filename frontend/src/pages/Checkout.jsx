import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useStore } from "../store.jsx";
import { post } from "../lib/api.js";
import { addressCity, money } from "../lib/format.js";
import { CheckoutSteps, OrderSummary, PrimaryAction } from "../components/Checkout.jsx";
import { Icon, PageHead } from "../components/ui.jsx";

function Guard({ children }) {
  const { cartLines, user } = useStore();
  if (!user) return <Navigate to="/connexion" state={{ from: "/livraison" }} replace />;
  if (!cartLines.length) return <Navigate to="/panier" replace />;
  return children;
}

function Choice({ checked, onChange, name, value, title, text, mark, badge }) {
  return (
    <label className={`relative flex min-h-[67px] cursor-pointer items-start gap-3.5 rounded-2xl border bg-paper px-3 py-[17px] lg:min-h-[68px] lg:px-[18px] ${checked ? "border-forest bg-[#f4f7ef]" : "border-line"}`}>
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="peer sr-only" />
      <span className={`mt-px grid size-5 shrink-0 place-items-center rounded-full border ${checked ? "border-forest bg-forest text-white" : "border-line bg-paper"} peer-focus-visible:ring-2 peer-focus-visible:ring-forest`}>
        {checked && <Icon name="check" className="size-3" strokeWidth={3} />}
      </span>
      {mark}
      <span className="flex-1">
        <b className="block text-[10px] lg:text-[11px]">{title}</b>
        <small className="mt-[9px] block text-[8px] text-muted lg:text-[9px]">{text}</small>
      </span>
      {badge}
    </label>
  );
}

function Notice({ title, children }) {
  return (
    <div className="rounded-2xl bg-soft px-[18px] py-[18px] text-[8px] text-muted lg:py-[22px] lg:text-[9px]">
      <b className="block text-ink">{title}</b><span className="mt-2.5 block">{children}</span>
    </div>
  );
}

function MobileTotal({ label, value }) {
  const { cartTotal, serviceFee } = useStore();
  return (
    <div className="rounded-2xl bg-soft p-4 text-[8px] lg:hidden">
      <div className="flex justify-between text-muted"><span>{label}</span><b className="text-ink">{value}</b></div>
      <div className="mt-3 flex justify-between font-bold"><span>Total connu</span><b className="text-[13px] font-extrabold text-forest">{money(cartTotal + serviceFee)}</b></div>
    </div>
  );
}

export function Delivery() {
  return <Guard><DeliveryStep /></Guard>;
}

function DeliveryStep() {
  const { checkout, updateCheckout, config } = useStore();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(checkout.delivery_address.trim().length < 5);
  const [address, setAddress] = useState(checkout.delivery_address);
  const [method, setMethod] = useState(checkout.delivery_method);
  const [note, setNote] = useState(checkout.note);

  const submit = (event) => {
    event.preventDefault();
    if (method === "delivery" && address.trim().length < 5) { setEditing(true); return; }
    updateCheckout({ delivery_method: method, delivery_address: address.trim(), note });
    navigate("/paiement");
  };

  return (
    <form className="page" onSubmit={submit}>
      <PageHead label="08 / Livraison" title="Où livrer votre commande ?" text="Choisissez la livraison ou le retrait auprès du producteur." mobileText="Choisissez livraison ou retrait." />
      <CheckoutSteps active="delivery" />
      <div className="mt-[18px] lg:mt-[22px] lg:grid lg:grid-cols-[minmax(0,800px)_minmax(0,442px)] lg:gap-[54px]">
        <div className="grid gap-[18px]">
          <section>
            <h2 className="mx-1 mb-3 text-[13px] font-[750] lg:mx-0 lg:mb-[15px] lg:text-[15px]">Adresse de livraison</h2>
            <div className="flex min-h-[79px] items-start gap-2 rounded-2xl border border-line bg-paper px-[15px] py-[15px] lg:min-h-[92px] lg:gap-3.5 lg:px-[18px] lg:py-[21px]">
              <span className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded-full lg:mt-1 lg:size-5 ${editing ? "bg-leaf text-forest" : "bg-forest text-white"}`}>
                <Icon name={editing ? "pin" : "check"} className="size-2.5 lg:size-3" strokeWidth={editing ? 2 : 3} />
              </span>
              {editing ? (
                <label className="block flex-1">
                  <b className="block text-[10px] lg:text-[11px]">Adresse ou quartier de livraison</b>
                  <input autoFocus value={address} onChange={(e) => setAddress(e.target.value)} required={method === "delivery"} minLength={5} autoComplete="street-address"
                    placeholder="Ex. Lot II M 45, Analamahitsy, Antananarivo" className="mt-2 h-[30px] w-full rounded-lg border border-line bg-[#fbfbf6] px-2.5 text-[9px] outline-none focus:border-forest lg:text-[10px]" />
                </label>
              ) : (
                <>
                  <span className="flex-1"><b className="block text-[10px] lg:text-[11px]">Domicile — {addressCity(address, config.zones)}</b>
                    <small className="mt-2.5 block text-[8px] text-muted lg:mt-3 lg:text-[9px]">{address}</small></span>
                  <button type="button" onClick={() => setEditing(true)} className="self-end text-[8px] font-bold text-forest lg:text-[9px]">Modifier</button>
                </>
              )}
            </div>
          </section>
          <section>
            <h2 className="mx-1 mt-2 mb-3 text-[13px] font-[750] lg:mx-0 lg:mt-5 lg:mb-2.5 lg:text-[15px]">Mode de réception</h2>
            <div className="grid gap-3 lg:grid-cols-2 lg:gap-[18px]">
              <Choice name="delivery_method" value="delivery" checked={method === "delivery"} onChange={() => setMethod("delivery")}
                title="Livraison à domicile" text="Le producteur vous confirme les frais et le délai." />
              <Choice name="delivery_method" value="pickup" checked={method === "pickup"} onChange={() => setMethod("pickup")}
                title="Retrait chez le producteur" text="Retrait gratuit, lieu à confirmer." />
            </div>
          </section>
          <label className="block lg:mt-2">
            <span className="field-label mx-1 lg:mx-0">Note au livreur (facultatif)</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={500} placeholder="Ex. portail vert, appeler à l’arrivée…"
              className="input mt-2.5 h-[42px] resize-none py-3 text-[9px] lg:h-[53px]" />
          </label>
          <div className="hidden lg:block"><Notice title="Le créneau et les frais seront confirmés par le producteur.">Aucune adresse n’est transmise avant la validation de la commande.</Notice></div>
          <MobileTotal label="Livraison" value={method === "pickup" ? "Retrait gratuit" : "À confirmer"} />
          <div className="lg:hidden"><PrimaryAction type="submit">Continuer vers le paiement</PrimaryAction></div>
        </div>
        <OrderSummary title="Votre commande" className="lg:mt-[11px]" deliveryLabel={method === "pickup" ? "Retrait gratuit" : "Frais à confirmer"}
          actionOutside={<PrimaryAction type="submit">Continuer vers le paiement</PrimaryAction>}
          note="Le producteur confirme les frais éventuels avant votre engagement définitif. Aucun paiement n’est prélevé ici." />
      </div>
    </form>
  );
}

export function Payment() {
  return <Guard><PaymentStep /></Guard>;
}

const PAYMENTS = [
  ["mvola", "MVola", "Mobile Money · disponibilité à confirmer", "M", "bg-[#f7d34a] text-[#1d2921]"],
  ["orange_money", "Orange Money", "Mobile Money · disponibilité à confirmer", "O", "bg-orange text-white"],
  ["at_delivery", "Paiement à la réception", "Confirmer le paiement avec le producteur.", "✓", "bg-leaf text-forest"],
];

function PaymentStep() {
  const { checkout, updateCheckout, cartLines, refresh, toast } = useStore();
  const navigate = useNavigate();
  const [method, setMethod] = useState(checkout.payment_method);
  const [phone, setPhone] = useState(checkout.payment_phone);
  const [busy, setBusy] = useState(false);
  if (checkout.delivery_method === "delivery" && checkout.delivery_address.trim().length < 5) return <Navigate to="/livraison" replace />;

  const submit = async (event) => {
    event.preventDefault();
    updateCheckout({ payment_method: method, payment_phone: phone });
    setBusy(true);
    try {
      const result = await post("/orders", {
        items: cartLines.map(({ product_id, quantity }) => ({ product_id, quantity })),
        delivery_method: checkout.delivery_method, payment_method: method,
        delivery_address: checkout.delivery_method === "delivery" ? checkout.delivery_address : "",
        payment_phone: phone, note: checkout.note,
      });
      // The confirmation screen empties the cart once it is shown; emptying it here would
      // let the checkout guard redirect to /panier before the navigation lands.
      navigate(`/confirmation/${result.id}`, { replace: true, state: { justOrdered: true } });
      refresh();
      toast("Commande créée : " + result.code);
    } catch (error) { toast(error.message); setBusy(false); }
  };

  const action = <PrimaryAction type="submit" disabled={busy}>Envoyer la demande</PrimaryAction>;
  return (
    <form className="page" onSubmit={submit}>
      <PageHead label="09 / Paiement" title="Comment souhaitez-vous payer ?" mobileTitle="Comment payer ?"
        text="Choisissez une préférence de paiement, à confirmer avec le producteur." mobileText="Aucun débit n’est effectué ici." />
      <CheckoutSteps active="payment" />
      <div className="mt-[18px] lg:mt-[22px] lg:grid lg:grid-cols-[minmax(0,800px)_minmax(0,442px)] lg:gap-[54px]">
        <div className="grid gap-3 lg:gap-[13px]">
          <h2 className="mx-1 text-[13px] font-[750] lg:mx-0 lg:mb-0.5 lg:text-[15px]">Moyen de paiement</h2>
          {PAYMENTS.map(([value, title, text, mark, markClass]) => (
            <Choice key={value} name="payment_method" value={value} checked={method === value} onChange={() => setMethod(value)} title={title} text={text}
              mark={<span className={`hidden size-7 shrink-0 place-items-center rounded-lg text-[11px] font-extrabold lg:grid ${markClass}`}>{mark}</span>}
              badge={value !== "at_delivery" && <span className="self-center rounded-full bg-warm px-2 py-1.5 text-[8px] font-bold text-warm-ink lg:min-w-[110px] lg:px-4 lg:text-center lg:text-[10px]">À confirmer</span>} />
          ))}
          <label className="mt-2.5 block">
            <span className="field-label mx-1 lg:mx-0">Numéro Mobile Money (si applicable)</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" autoComplete="tel" required={method !== "at_delivery"}
              placeholder="+261 34 00 000 00" className="input mt-2.5 h-[47px] text-[9px]" />
          </label>
          <div className="mt-1.5"><Notice title="Moyens de paiement à confirmer avant lancement.">Aucun paiement n’est prélevé par cette application.</Notice></div>
          <MobileTotal label="Livraison" value={checkout.delivery_method === "pickup" ? "Retrait gratuit" : "À confirmer"} />
          <div className="lg:hidden">{action}</div>
        </div>
        <OrderSummary title="Résumé de la commande" className="lg:mt-[11px]" deliveryLabel={checkout.delivery_method === "pickup" ? "Retrait gratuit" : "Frais à confirmer"}
          actionOutside={action} note="Le producteur confirme les frais éventuels avant votre engagement définitif. Aucun paiement n’est prélevé ici." />
      </div>
    </form>
  );
}

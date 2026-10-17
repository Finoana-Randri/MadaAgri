import { Link, Navigate, useParams } from "react-router-dom";
import { useStore } from "../store.jsx";
import { useOrders } from "../lib/useOrders.js";
import { addressCity, money, orderDate, orderTotal, paymentName } from "../lib/format.js";
import OrderActions from "../components/OrderActions.jsx";
import { Icon, Kv } from "../components/ui.jsx";

export default function Tracking() {
  const { id } = useParams();
  const { user, config, toast } = useStore();
  const { orders, loading, reload } = useOrders();
  if (!user) return <Navigate to="/connexion" state={{ from: `/commandes/${id}` }} replace />;
  if (loading) return <div className="page text-[11px] text-muted">Chargement du suivi…</div>;
  const order = orders.find((o) => o.id === Number(id));
  if (!order) return <Navigate to="/commandes" replace />;

  const staff = user.role !== "buyer";
  const delivery = order.delivery_method === "delivery";
  const cancelled = order.status === "cancelled";
  const baseIndex = { pending_confirmation: 0, accepted: 1, preparing: 1, ready: 2, delivered: 4, cancelled: -1 }[order.status];
  const index = order.status === "ready" && delivery && order.delivery_status === "in_transit" ? 3 : baseIndex;
  const where = order.delivery_zone || addressCity(order.delivery_address, config.zones);
  const stages = [
    [order.status === "pending_confirmation" ? "Commande envoyée au producteur" : "Commande confirmée",
      order.status === "pending_confirmation" ? (order.delivery_status === "quoted" ? "Frais de livraison à valider" : "En attente de confirmation · " + orderDate(order.created_at, true)) : orderDate(order.created_at, true)],
    ["Préparation chez le producteur", order.status === "preparing" ? "En cours · " + order.producer_name : order.status === "accepted" ? "Bientôt · " + order.producer_name : index > 1 ? "Terminée" : "À venir"],
    [delivery ? "Prise en charge par le livreur" : "Prête pour le retrait", index === 2 ? (delivery ? "Départ imminent" + (order.delivery_responsible ? " · " + order.delivery_responsible : "") : "À récupérer chez le producteur") : index > 2 ? "Terminée" : "À venir"],
    [delivery ? "Livrée chez vous" : "Retirée chez le producteur", index === 4 ? "Remise confirmée" : index === 3 ? "En route · " + where : "À venir"],
  ];
  const title = cancelled ? "Commande annulée" : order.status === "delivered" ? "Commande remise !" : order.status === "pending_confirmation" ? "Commande bien reçue !" : "Commande en cours";
  const text = cancelled ? "Cette commande a été annulée. Aucun montant n’a été prélevé."
    : order.status === "delivered" ? "La commande a été remise. Merci de faire vivre les producteurs locaux."
    : staff ? "Confirmez chaque étape : l’acheteur est prévenu automatiquement."
    : order.status === "pending_confirmation" ? "Votre producteur vérifie votre récolte. Vous recevez une mise à jour à chaque étape."
    : "Votre producteur prépare votre récolte. Vous recevez une mise à jour à chaque étape.";
  const count = order.items.reduce((sum, item) => sum + Number(item.quantity), 0);
  const deliveryValue = delivery ? (order.delivery_fee != null ? money(order.delivery_fee) + (order.delivery_fee_accepted ? "" : " · à valider") : "Frais à confirmer") : "Retrait gratuit";
  const support = () => toast(!staff && order.status === "delivered"
    ? "Utilisez « Signaler un problème » sous le suivi : l’équipe traite votre réclamation."
    : `Notez la référence ${order.code} : le producteur vous contacte pour toute question avant la remise.`);

  return (
    <div className="page">
      <span className="page-label">11 / Suivi de commande</span>
      <section className={`flex flex-wrap items-start gap-3 rounded-[18px] px-3.5 py-4 lg:flex-nowrap lg:items-center lg:gap-[30px] lg:rounded-[20px] lg:py-5 lg:pr-[52px] lg:pl-[30px] ${cancelled ? "bg-soft" : "bg-leaf"} min-h-[150px] lg:min-h-[130px]`}>
        <span className={`grid size-10 shrink-0 place-items-center rounded-full text-white lg:size-[50px] ${cancelled ? "bg-muted" : "bg-forest"}`}>
          <Icon name={cancelled ? "close" : "check"} className="size-5 lg:size-[22px]" strokeWidth={2.6} />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="mt-0.5 text-[18px] leading-[23px] font-extrabold text-forest lg:text-[25px] lg:leading-[31px]">{title}</h1>
          <p className="mt-1 text-[7px] text-muted lg:hidden">{order.code} · {order.payment_status === "confirmed" ? "paiement confirmé" : "paiement à vérifier"}</p>
          <p className="mt-3.5 hidden text-[10px] text-muted lg:block">{text}</p>
        </div>
        <p className="w-full text-[8px] text-ink lg:hidden">{text}</p>
        <span className="hidden h-[26px] w-[230px] shrink-0 items-center justify-center rounded-full bg-paper text-[9px] font-extrabold lg:inline-flex">{order.code}</span>
      </section>

      <div className="mt-5 grid gap-4 lg:mt-11 lg:grid-cols-[minmax(0,808px)_minmax(0,1fr)] lg:gap-[31px]">
        <div>
          <div className="mx-1 lg:mx-0">
            <h2 className="text-[16px] font-[750] lg:text-[19px]">Suivi de la commande</h2>
            <small className="mt-2 block text-[8px] text-muted">{staff ? order.buyer_name + " · " : ""}Commandée {orderDate(order.created_at, true).toLowerCase()}</small>
          </div>
          <section className="mt-4 rounded-2xl border border-line bg-paper px-3.5 py-[18px] lg:px-7 lg:pt-7 lg:pb-[30px]">
            {cancelled ? <p className="py-4 text-[10px] text-muted">La commande est annulée.</p> : (
              <ol>
                {stages.map(([label, detail], i) => {
                  const done = index > i || index === 4;
                  const current = index === i && index !== 4;
                  return (
                    <li key={label} className="relative flex min-h-[62px] gap-4 lg:min-h-[82px] lg:gap-5">
                      {i < stages.length - 1 && <span className={`absolute top-[26px] bottom-0 left-3 w-0.5 lg:top-[34px] lg:left-4 ${done ? "bg-forest" : "bg-line"}`} />}
                      <span className={`relative z-10 grid size-[26px] shrink-0 place-items-center rounded-full text-[9px] font-extrabold lg:size-[34px] lg:text-[11px] ${done || current ? "bg-forest text-white" : "bg-soft text-muted"}`}>
                        {done ? <Icon name="check" className="size-3" strokeWidth={3} /> : i + 1}
                      </span>
                      <div><b className="mt-0.5 block text-[9px] lg:mt-[3px] lg:text-[12px]">{label}</b><small className="mt-[7px] block text-[7px] text-muted lg:mt-[9px] lg:text-[9px]">{detail}</small></div>
                    </li>
                  );
                })}
              </ol>
            )}
            <OrderActions order={order} onDone={reload} />
          </section>
        </div>
        <aside className="grid content-start gap-4 lg:gap-[18px]">
          <section className="grid gap-3 rounded-2xl border border-line bg-paper px-3.5 py-4 lg:gap-[18px] lg:px-[30px] lg:pt-[26px] lg:pb-7">
            <h2 className="text-[11px] font-[750] lg:mb-3 lg:text-[15px]">Récapitulatif</h2>
            <Kv label="Produits" className="text-[8px] lg:text-[9px]">{count} article{count > 1 ? "s" : ""}</Kv>
            <Kv label={delivery ? "Livraison" : "Retrait"} className="text-[8px] lg:text-[9px]">{deliveryValue}</Kv>
            <Kv label="Paiement" className="text-[8px] lg:text-[9px]" valueClass={order.payment_status === "confirmed" ? "" : "text-warm-ink"}>
              {paymentName(order.payment_method)} · {order.payment_status === "confirmed" ? "confirmé" : "à vérifier"}</Kv>
            <div className="mt-1.5 flex items-center justify-between border-t border-line pt-4 text-[8px] font-bold lg:pt-6 lg:text-[11px]">
              <span>Total estimé</span><b className="text-[13px] font-extrabold text-forest lg:text-[16px]">{money(orderTotal(order))}</b>
            </div>
            <div className="grid gap-1.5">
              {order.items.map((item) => <small key={item.id} className="text-[8px] text-muted">{item.quantity} × {item.name} · {money(item.price * item.quantity)}</small>)}
            </div>
          </section>
          <section className="hidden items-center justify-between gap-4 rounded-2xl border border-line bg-paper py-5 pr-6 pl-[26px] lg:flex">
            <div><b className="block text-[13px]">Besoin d’aide ?</b><small className="mt-3 block text-[8px] text-muted">Contactez-nous avec votre numéro de commande.</small></div>
            <button onClick={support} className="btn-outline h-12 w-[132px] text-[9px]">Support</button>
          </section>
          <Link to="/commandes" className="btn-outline h-12 rounded-2xl text-[10px] lg:hidden">Voir mes commandes</Link>
        </aside>
      </div>
    </div>
  );
}

import { useEffect } from "react";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import { useStore } from "../store.jsx";
import { useOrders } from "../lib/useOrders.js";
import { money, paymentName, photo, unitShort } from "../lib/format.js";
import { Icon, Kv, Pill } from "../components/ui.jsx";

export default function Confirmation() {
  const { id } = useParams();
  const { user, products, clearCart } = useStore();
  const { orders, loading } = useOrders();
  const { state } = useLocation();
  useEffect(() => { if (state?.justOrdered) clearCart(); }, [state, clearCart]);
  if (!user) return <Navigate to="/connexion" replace />;
  if (loading) return <div className="page text-[11px] text-muted">Chargement de votre commande…</div>;
  const order = orders.find((o) => o.id === Number(id));
  if (!order) return <Navigate to="/commandes" replace />;

  const pickup = order.delivery_method === "pickup";
  const productsTotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = productsTotal + Number(order.service_fee || 0);
  const image = (item) => products.find((p) => p.id === item.product_id)?.image;

  return (
    <div className="page">
      <span className="page-label">10 / Commande confirmée</span>
      <section className="flex h-[213px] flex-col items-center rounded-[18px] bg-leaf pt-6 text-center lg:h-[280px] lg:rounded-[20px] lg:pt-7">
        <span className="grid size-[76px] place-items-center rounded-full bg-forest text-white lg:size-20"><Icon name="check" className="size-9" strokeWidth={2.4} /></span>
        <h1 className="mt-[22px] text-[19px] leading-6 font-extrabold lg:mt-[42px] lg:text-[31px] lg:leading-[38px]">Commande enregistrée !</h1>
        <p className="mt-3 text-[8px] text-muted lg:mt-2.5 lg:text-[12px]">Merci d’encourager les producteurs locaux.</p>
        <span className="mt-4 inline-flex h-[26px] items-center rounded-full bg-paper px-[34px] text-[9px] font-extrabold lg:mt-[22px]">N° {order.code}</span>
      </section>
      <div className="mt-5 grid gap-[18px] lg:mt-8 lg:grid-cols-[minmax(0,800px)_minmax(0,1fr)] lg:gap-7">
        <section className="rounded-[18px] border border-line bg-paper px-4 pt-[18px] pb-[26px] lg:rounded-2xl lg:px-7 lg:pt-[26px] lg:pb-6">
          <h2 className="text-[11px] font-[750] lg:text-[15px]"><span className="hidden lg:inline">Votre commande</span><span className="lg:hidden">Résumé de votre commande</span></h2>
          <div className="mt-5 hidden lg:block">
            {order.items.map((item) => (
              <div key={item.id} className="mb-3.5 grid grid-cols-[60px_1fr_auto] items-center gap-3.5">
                <img src={photo(image(item))} alt="" className="size-[60px] rounded-[10px] object-cover" />
                <b className="text-[11px]">{item.name} · {item.quantity} {unitShort(item.unit)}</b>
                <b className="text-[9px]">{money(item.price * item.quantity)}</b>
              </div>
            ))}
          </div>
          <div className="mt-[18px] grid gap-[18px] lg:hidden">
            <Kv label={`${order.items.length} article${order.items.length > 1 ? "s" : ""} · 1 producteur`} className="text-[8px]">{money(productsTotal)}</Kv>
            <Kv label={pickup ? "Retrait" : "Livraison estimée"} className="text-[8px]">{pickup ? "Gratuit" : "À confirmer"}</Kv>
          </div>
          <div className="mt-6 flex items-center justify-between border-t border-line pt-6 text-[8px] font-bold lg:mt-1 lg:pt-[22px] lg:text-[9px] lg:font-normal lg:text-muted">
            <span className="hidden lg:inline">{pickup ? "Retrait chez le producteur · gratuit" : "Livraison · frais à confirmer par le producteur"}</span>
            <span className="lg:hidden">Total connu / à régler</span>
            <b className="text-[15px] font-extrabold text-forest lg:text-[14px]"><span className="hidden lg:inline">Total </span>{money(total)}</b>
          </div>
        </section>
        <aside className="flex flex-col lg:rounded-2xl lg:border lg:border-line lg:bg-paper lg:px-[27px] lg:pt-[26px] lg:pb-6">
          <h2 className="hidden text-[15px] font-[750] lg:block">Prochaine étape</h2>
          <p className="mt-[22px] hidden text-[9px] leading-[15px] text-muted lg:block">Le producteur vérifie son stock et vous confirme {pickup ? "le retrait" : "les frais de livraison"}.</p>
          <span className="mt-4 hidden lg:block"><Pill tone="warm" className="h-auto min-h-[27px] max-w-[326px] py-1.5 text-center whitespace-normal">Paiement à confirmer selon le moyen choisi · {paymentName(order.payment_method)}</Pill></span>
          <Link to={`/commandes/${order.id}`} className="btn-primary h-[46px] text-[10px] lg:mt-[30px] lg:text-[11px]">Suivre ma commande <Icon name="arrow" className="size-4" /></Link>
          <Link to="/" className="btn-outline mt-3 h-[46px] text-[10px] lg:hidden">Retour au marché</Link>
          <p className="mt-5 text-center text-[7px] text-muted lg:text-[9px]">Vous êtes notifié à chaque étape dans « Mes commandes ».</p>
        </aside>
      </div>
    </div>
  );
}

import { Link, Navigate, useNavigate } from "react-router-dom";
import { useStore } from "../store.jsx";
import { useOrders } from "../lib/useOrders.js";
import { money, orderDate, orderStatus, orderTotal } from "../lib/format.js";
import { Icon, PageHead, Pill } from "../components/ui.jsx";

export function StatusPill({ order, role, className = "" }) {
  const [label, tone] = orderStatus(order, role);
  return <Pill tone={tone} className={`min-w-[110px] lg:min-w-[120px] ${className}`}>{label}</Pill>;
}

export default function Orders() {
  const { user } = useStore();
  const { orders, loading } = useOrders();
  const navigate = useNavigate();
  if (!user) return <Navigate to="/connexion" state={{ from: "/commandes" }} replace />;
  const buyer = user.role === "buyer";
  const open = (order) => navigate(`/commandes/${order.id}`);
  const columns = "lg:grid-cols-[minmax(0,1.36fr)_minmax(0,1.05fr)_minmax(0,2.6fr)_minmax(0,1fr)_minmax(0,1.23fr)_minmax(0,.55fr)]";

  return (
    <div className="page">
      <PageHead label="12 / Mes commandes" title={buyer ? "Mes commandes" : "Commandes reçues"}
        text={buyer ? "Retrouvez l’historique et suivez vos achats auprès des producteurs." : "Confirmez, préparez et remettez les commandes de vos acheteurs."}
        mobileText={buyer ? "Historique et suivi de vos achats." : "Commandes de vos acheteurs."} className="mb-[26px] lg:mb-11" />
      <section className="lg:min-h-[515px] lg:overflow-hidden lg:rounded-2xl lg:border lg:border-line lg:bg-paper lg:px-[26px] lg:pb-[30px]">
        <div className={`-mx-[26px] hidden h-[50px] items-center bg-soft px-[26px] text-[8px] font-[750] tracking-[.05em] text-muted uppercase lg:grid ${columns}`}>
          <span>Commande</span><span>Date</span><span>{buyer ? "Producteurs" : "Acheteur"}</span><span>Total estimé</span><span>Statut</span><span />
        </div>
        {loading ? <p className="py-6 text-[10px] text-muted">Chargement…</p> : !orders.length ? (
          <div className="card p-6 text-center lg:border-0 lg:bg-transparent">
            <p className="text-[11px] text-muted">Aucune commande pour le moment.</p>
            <Link to="/" className="btn-primary mx-auto mt-4 h-10 w-fit px-5 text-[11px]">Explorer le marché</Link>
          </div>
        ) : orders.map((order) => (
          <article key={order.id} onClick={() => open(order)} onKeyDown={(e) => e.key === "Enter" && open(order)} tabIndex={0}
            className={`relative mb-[17px] h-[115px] cursor-pointer rounded-2xl border border-line bg-paper px-4 py-5 text-[9px] hover:bg-[#fbfbf6] lg:mb-0 lg:grid lg:h-[98px] lg:items-center lg:rounded-none lg:border-0 lg:border-b lg:bg-transparent lg:p-0 ${columns}`}>
            <b className="font-extrabold">{order.code}</b>
            <span className="mt-3.5 block text-[7px] text-muted lg:mt-0 lg:text-[9px] lg:font-bold">{orderDate(order.created_at)}</span>
            <span className="hidden pr-5 font-bold lg:block">{buyer ? order.producer_name : order.buyer_name}</span>
            <strong className="absolute top-5 right-4 font-extrabold lg:static">{money(orderTotal(order))}</strong>
            <span className="absolute bottom-[18px] left-4 lg:static"><StatusPill order={order} role={user.role} /></span>
            <Link to={`/commandes/${order.id}`} onClick={(e) => e.stopPropagation()} className="absolute right-4 bottom-[22px] flex items-center gap-1 font-bold text-forest lg:static lg:justify-self-end">
              Détails <Icon name="arrow" className="size-3" />
            </Link>
          </article>
        ))}
      </section>
      <div className="mt-4 flex items-center justify-between lg:mt-11">
        <div className="hidden lg:block">
          <b className="block text-[12px]">Besoin d’aide avec une commande ?</b>
          <small className="mt-3.5 block text-[9px] text-muted">Ouvrez la commande : le suivi indique chaque étape et permet de signaler un problème après la remise.</small>
        </div>
        <Link to="/" className="btn h-11 w-full rounded-xl bg-leaf text-[9px] text-forest lg:h-12 lg:w-[243px] lg:border lg:border-line lg:bg-paper lg:text-[10px]">Continuer mes achats</Link>
      </div>
    </div>
  );
}

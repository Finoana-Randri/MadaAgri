import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStore } from "../store.jsx";
import { useOrders } from "../lib/useOrders.js";
import { money, orderDate, orderTotal, paymentName } from "../lib/format.js";
import { AdminGuard, FilterChips, Metric } from "../components/AdminBits.jsx";
import { Icon, PageHead, Pill } from "../components/ui.jsx";
import { StatusPill } from "./Orders.jsx";

export default function AdminOrders() {
  return <AdminGuard from="/admin/commandes"><OrdersBoard /></AdminGuard>;
}

const ACTIVE = ["pending_confirmation", "accepted", "preparing"];
const COLUMNS = "lg:grid-cols-[minmax(0,162fr)_minmax(0,215fr)_minmax(0,150fr)_minmax(0,165fr)_minmax(0,190fr)_minmax(0,190fr)_70px]";

function OrdersBoard() {
  const { user } = useStore();
  const { orders, loading } = useOrders();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const active = orders.filter((o) => ACTIVE.includes(o.status));
  const onRoad = orders.filter((o) => o.status === "ready");
  const visible = filter === "pending" ? active : filter === "route" ? onRoad : orders;

  return (
    <div className="page">
      <PageHead label="15 / BO / Gestion des commandes" title="Commandes" text="Suivez chaque paiement, préparation et livraison." mobileText="Suivez les paiements et les livraisons." className="mb-5 lg:mb-[34px]" />
      <div className="hidden grid-cols-3 gap-[27px] lg:grid lg:pr-6">
        <Metric label="À traiter" value={active.length} />
        <Metric label="En livraison" value={onRoad.length} />
        <Metric label="Terminées" value={orders.filter((o) => o.status === "delivered").length} />
      </div>
      <FilterChips className="mb-4 lg:hidden" value={filter} onChange={setFilter}
        options={[["all", `Toutes · ${orders.length}`], ["pending", `À traiter · ${active.length}`], ["route", `En route · ${onRoad.length}`]]} />
      <section className="lg:mt-7 lg:min-h-[472px] lg:rounded-2xl lg:border lg:border-line lg:bg-paper lg:px-[25px] lg:pt-[18px] lg:pb-6">
        <div className="hidden items-center justify-between lg:flex">
          <h2 className="text-[15px] font-[750]">Toutes les commandes</h2>
          <Pill tone="green">{visible.length} commande{visible.length > 1 ? "s" : ""}</Pill>
        </div>
        <div className={`mt-[30px] hidden text-[8px] font-[750] tracking-[.05em] text-muted uppercase lg:grid ${COLUMNS}`}>
          <span>N° commande</span><span>Acheteur</span><span>Date</span><span>Total</span><span>Paiement</span><span>Statut</span><span />
        </div>
        {loading ? <p className="py-6 text-[10px] text-muted">Chargement…</p> : visible.length ? visible.map((o) => (
          <article key={o.id} onClick={() => navigate(`/commandes/${o.id}`)} onKeyDown={(e) => e.key === "Enter" && navigate(`/commandes/${o.id}`)} tabIndex={0}
            className={`relative mb-4 h-[112px] cursor-pointer rounded-2xl border border-line bg-paper text-[9px] hover:bg-[#fbfbf6] lg:mb-0 lg:grid lg:h-[75px] lg:items-center lg:rounded-none lg:border-0 lg:border-b lg:bg-transparent ${COLUMNS}`}>
            <b className="absolute top-[19px] left-[13px] text-[10px] font-extrabold text-forest lg:static lg:text-[9px]">{o.code}</b>
            <span className="absolute top-11 left-[13px] text-[8px] text-muted lg:static lg:text-[9px] lg:font-semibold lg:text-ink">{o.buyer_name}<span className="lg:hidden"> · {o.items.length} article{o.items.length > 1 ? "s" : ""}</span></span>
            <span className="hidden text-[8px] text-muted lg:block">{orderDate(o.created_at, true)}</span>
            <strong className="absolute top-11 right-4 font-extrabold lg:static">{money(orderTotal(o))}</strong>
            <span className="hidden text-[8px] text-muted lg:block">{paymentName(o.payment_method)}</span>
            <span className="absolute top-[11px] right-[15px] lg:static"><StatusPill order={o} role={user.role} className="!min-w-[92px] lg:!min-w-[117px]" /></span>
            <span className="absolute right-4 bottom-3.5 left-[13px] flex justify-between border-t border-line pt-3 text-[8px] font-bold lg:static lg:border-0 lg:p-0">
              <span className="lg:hidden">Mise à jour du statut</span>
              <Link to={`/commandes/${o.id}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 text-forest lg:ml-auto lg:text-[9px]">Ouvrir <Icon name="arrow" className="size-3" /></Link>
            </span>
          </article>
        )) : <p className="py-6 text-[10px] text-muted">Aucune commande dans cette catégorie.</p>}
        <p className="mt-6 hidden text-[9px] text-muted lg:block">Les paiements et statuts restent indicatifs tant que le producteur ne les a pas confirmés.</p>
      </section>
    </div>
  );
}

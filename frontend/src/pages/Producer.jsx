import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useStore } from "../store.jsx";
import { api, post } from "../lib/api.js";
import { useOrders } from "../lib/useOrders.js";
import { itemsShort, money, orderTotal, parseDate, photo } from "../lib/format.js";
import ProductFormModal from "../components/ProductFormModal.jsx";
import { Icon, PageHead, Pill } from "../components/ui.jsx";
import { StatusPill } from "./Orders.jsx";

const PRODUCT_STATUS = { published: ["Publié", "green"], pending: ["À vérifier", "warm"], inactive: ["Désactivé", "grey"], rejected: ["Refusé", "grey"] };

export default function Producer() {
  const { user } = useStore();
  if (!user) return <Navigate to="/connexion" state={{ from: "/producteur" }} replace />;
  if (user.role === "buyer") return <ProducerPitch />;
  return <Dashboard />;
}

function ProducerPitch() {
  return (
    <div className="page">
      <PageHead label="13 / Espace producteur" title="Votre récolte mérite sa place." text="Créez un compte producteur pour proposer vos produits aux acheteurs." />
      <div className="card mt-6 p-6">
        <p className="text-[11px] text-muted">Les fiches sont vérifiées avant publication. Pour commencer, ouvrez un compte producteur.</p>
        <Link to="/inscription" state={{ role: "producer" }} className="btn-primary mt-4 h-10 w-fit px-5 text-[11px]">Créer mon compte producteur <Icon name="arrow" className="size-4" /></Link>
      </div>
    </div>
  );
}

function Dashboard() {
  const { user, toast, refresh } = useStore();
  const navigate = useNavigate();
  const { orders } = useOrders();
  const [products, setProducts] = useState([]);
  const [editing, setEditing] = useState(undefined); // undefined: closed, null: new product
  const [showProducts, setShowProducts] = useState(false);

  const loadProducts = useCallback(async () => {
    try { setProducts((await api("/producer/products")).products || []); } catch (error) { toast(error.message); }
  }, [toast]);
  useEffect(() => { loadProducts(); }, [loadProducts]);

  const toggle = async (product) => {
    try { await post(`/products/${product.id}/toggle`); toast("Disponibilité mise à jour."); loadProducts(); refresh(); }
    catch (error) { toast(error.message); }
  };

  const shop = (products.find((p) => p.status === "published") || products[0])?.producer_name || user.name;
  const toPrepare = orders.filter((o) => ["pending_confirmation", "accepted", "preparing"].includes(o.status));
  const published = products.filter((p) => p.status === "published");
  const weekAgo = Date.now() - 7 * 864e5;
  const sales = orders.filter((o) => o.status !== "cancelled" && (parseDate(o.created_at)?.getTime() || 0) >= weekAgo).reduce((s, o) => s + Number(o.subtotal), 0);
  const rated = products.filter((p) => Number(p.rating) > 0);
  const average = rated.length ? rated.reduce((s, p) => s + Number(p.rating), 0) / rated.length : 0;
  const kpis = [
    ["Commandes à préparer", "À préparer", toPrepare.length, `${orders.filter((o) => o.status === "pending_confirmation").length} à confirmer`],
    ["Produits publiés", "Produits publiés", published.length, `${published.filter((p) => Number(p.stock) < 10).length} bientôt indisponibles`],
    ["Ventes estimées", "Ventes estimées", money(sales), "7 derniers jours"],
    ["Note moyenne", null, average ? average.toFixed(1).replace(".", ",") + " / 5" : "—", "Moyenne de vos fiches"],
  ];

  return (
    <div className="page">
      <PageHead label="13 / Espace producteur" title={`Bonjour, ${shop}`} text="Suivez vos récoltes, vos commandes et vos acheteurs." mobileText="Votre activité cette semaine" className="mb-[26px] lg:mb-11" />
      {!user.verified && <div className="mb-5 rounded-xl bg-warm p-4 text-[10px] text-warm-ink">Votre profil attend la vérification de l’administration. La publication sera disponible après validation.</div>}
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 lg:gap-6">
        {kpis.map(([label, mobileLabel, value, note]) => (
          <div key={label} className={`h-[78px] rounded-2xl border border-line bg-paper px-3.5 pt-4 lg:h-[115px] lg:px-[18px] lg:pt-[18px] ${mobileLabel ? "" : "hidden lg:block"}`}>
            <span className="block text-[7px] font-bold text-muted lg:text-[9px]"><span className="hidden lg:inline">{label}</span><span className="lg:hidden">{mobileLabel}</span></span>
            <b className="mt-3.5 block text-[16px] leading-5 font-extrabold text-forest lg:mt-4 lg:text-[22px] lg:leading-7">{value}</b>
            <small className="mt-3 hidden text-[8px] text-muted lg:block">{note}</small>
          </div>
        ))}
      </div>

      <div className="mt-[22px] grid gap-4 lg:mt-6 lg:grid-cols-[minmax(0,800px)_minmax(0,1fr)] lg:gap-7">
        <section className="lg:min-h-[408px] lg:rounded-2xl lg:border lg:border-line lg:bg-paper lg:px-6 lg:pt-5 lg:pb-6">
          <div className="flex items-center justify-between px-1 pb-3.5 lg:border-b lg:border-line lg:px-0 lg:pb-[18px]">
            <h2 className="text-[14px] font-[750] lg:text-[15px]">Commandes récentes</h2>
            <Link to="/commandes" className="hidden items-center gap-1 text-[9px] font-bold text-forest lg:flex">Voir tout <Icon name="arrow" className="size-3" /></Link>
          </div>
          <div className="mt-[22px] hidden grid-cols-[210px_1fr_200px_110px] text-[8px] font-[750] tracking-[.05em] text-muted uppercase lg:grid">
            <span>Commande</span><span>Produits</span><span>Statut</span><span className="text-right">Total</span>
          </div>
          {orders.length ? orders.slice(0, 4).map((o) => (
            <article key={o.id} onClick={() => navigate(`/commandes/${o.id}`)} onKeyDown={(e) => e.key === "Enter" && navigate(`/commandes/${o.id}`)} tabIndex={0}
              className="relative mb-[15px] h-[67px] cursor-pointer rounded-2xl border border-line bg-paper px-3.5 py-4 text-[9px] hover:bg-[#fbfbf6] lg:mb-0 lg:grid lg:h-[71px] lg:grid-cols-[210px_1fr_200px_110px] lg:items-center lg:rounded-none lg:border-0 lg:border-b lg:bg-transparent lg:p-0">
              <b className="font-extrabold">{o.code}</b>
              <span className="mt-3.5 block truncate pr-4 text-[7px] text-muted lg:mt-0 lg:text-[9px]">{itemsShort(o)}</span>
              <span className="absolute top-[19px] right-3 lg:static"><StatusPill order={o} role={user.role} className="!min-w-[82px] lg:!min-w-[94px]" /></span>
              <strong className="hidden text-right font-extrabold lg:block">{money(orderTotal(o))}</strong>
            </article>
          )) : <p className="py-5 text-[10px] text-muted">Aucune commande pour le moment.</p>}
          <Link to="/commandes" className="flex items-center justify-center gap-1 text-[9px] font-bold text-forest lg:hidden">Voir toutes les commandes <Icon name="arrow" className="size-3" /></Link>
        </section>

        <section className={`rounded-2xl border border-line bg-paper p-3.5 lg:block lg:px-[27px] lg:pt-4 lg:pb-6 ${showProducts ? "block" : "hidden"}`}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[13px] font-[750] lg:text-[15px]">Mes produits</h2>
            <button disabled={!user.verified} onClick={() => setEditing(null)} className="btn-soft h-9 w-[108px] rounded-[10px] text-[9px]">+ Ajouter</button>
          </div>
          {products.length ? products.map((p) => {
            const [label, tone] = PRODUCT_STATUS[p.status] || [p.status, "grey"];
            return (
              <article key={p.id} className="grid grid-cols-[52px_1fr_auto] items-center gap-2.5 py-[15px] lg:grid-cols-[66px_1fr_auto] lg:gap-3.5">
                <img src={photo(p.image)} alt="" className="size-[52px] rounded-[10px] object-cover lg:h-[65px] lg:w-[66px]" />
                <div className="min-w-0">
                  <b className="block truncate text-[10px]">{p.name}</b>
                  <small className="mt-2 block text-[9px] text-muted">{money(p.price)} / {p.unit} · {p.stock} dispo.</small>
                  <span className="mt-2 flex gap-3.5">
                    <button onClick={() => setEditing(p)} className="link">Modifier</button>
                    <button onClick={() => toggle(p)} className="link">{p.status === "inactive" ? "Réactiver" : "Désactiver"}</button>
                  </span>
                </div>
                <Pill tone={tone} className="min-w-16 text-[8px] lg:min-w-[82px] lg:text-[10px]">{label}</Pill>
              </article>
            );
          }) : <p className="py-5 text-[10px] text-muted">Vous n’avez pas encore ajouté de produit.</p>}
        </section>
      </div>
      <button onClick={() => setShowProducts((v) => !v)} className="btn-primary mt-[30px] h-[46px] w-full text-[10px] lg:hidden">
        {showProducts ? "Masquer mes produits" : <>Gérer mes produits <Icon name="arrow" className="size-4" /></>}
      </button>
      {editing !== undefined && <ProductFormModal product={editing} onClose={() => setEditing(undefined)} onSaved={() => { loadProducts(); refresh(); }} />}
    </div>
  );
}

import { useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../store.jsx";
import { post } from "../lib/api.js";
import { useAdmin } from "../lib/useAdmin.js";
import { money, photo } from "../lib/format.js";
import { AdminGuard, FilterChips } from "../components/AdminBits.jsx";
import { PageHead, Pill } from "../components/ui.jsx";

export default function AdminCatalog() {
  return <AdminGuard from="/admin/catalogue"><Catalog /></AdminGuard>;
}

const COLUMNS = "lg:grid-cols-[72px_minmax(0,235fr)_minmax(0,295fr)_minmax(0,150fr)_minmax(0,150fr)_minmax(0,170fr)_100px]";
const STATUS = { pending: ["À valider", "warm"], published: ["En ligne", "green"], rejected: ["Refusé", "grey"], inactive: ["Désactivé", "grey"] };

function Catalog() {
  const { toast, refresh } = useStore();
  const { data, reload } = useAdmin();
  const [filter, setFilter] = useState("pending");
  const [producer, setProducer] = useState("");
  const products = data.products;
  const producers = [...new Set(products.map((p) => p.producer_name))].sort((a, b) => a.localeCompare(b, "fr"));
  const visible = products.filter((p) => p.status === filter && (!producer || p.producer_name === producer));
  const count = (status) => products.filter((p) => p.status === status).length;

  const moderate = async (product, status) => {
    try { await post(`/products/${product.id}/moderate`, { status }); toast("Décision enregistrée."); await reload(); refresh(); }
    catch (error) { toast(error.message); }
  };
  const actions = (p) => p.status === "pending"
    ? [["Publier", "published"], ["Refuser", "rejected"]]
    : p.status === "published" ? [["Retirer", "rejected"]] : [["Publier", "published"]];

  return (
    <div className="page">
      <PageHead label="16 / BO / Catalogue produits" title="Catalogue produits" mobileTitle="Catalogue"
        text="Gérez les prix, stocks, photos et publications du marché." mobileText="Validez les fiches avant publication.">
        <Link to="/producteur" className="btn-primary h-8 w-[126px] shrink-0 text-[8px] lg:mt-[7px] lg:h-[43px] lg:w-[191px] lg:text-[10px]">
          <span className="hidden lg:inline">+ Ajouter un produit</span><span className="lg:hidden">+ Ajouter</span>
        </Link>
      </PageHead>
      <FilterChips className="mt-4 mb-4 lg:mt-[22px] lg:mb-[18px]" value={filter} onChange={setFilter}
        options={[["pending", `À valider · ${count("pending")}`], ["published", `En ligne · ${count("published")}`], ["rejected", `Refusés · ${count("rejected")}`]]} />
      <section className="lg:min-h-[520px] lg:rounded-2xl lg:border lg:border-line lg:bg-paper lg:px-[25px] lg:pt-[22px] lg:pb-8">
        <div className="hidden items-center justify-between lg:flex">
          <h2 className="text-[15px] font-[750]">Fiches produits</h2>
          <select value={producer} onChange={(e) => setProducer(e.target.value)} aria-label="Filtrer par producteur" className="bg-transparent text-[8px] text-muted">
            <option value="">Filtrer par producteur</option>
            {producers.map((name) => <option key={name}>{name}</option>)}
          </select>
        </div>
        <div className={`mt-[37px] hidden text-[8px] font-[750] tracking-[.05em] text-muted uppercase lg:grid ${COLUMNS}`}>
          <span className="col-span-2">Produit</span><span>Producteur</span><span>Prix</span><span>Stock</span><span>Statut</span><span />
        </div>
        {visible.length ? visible.map((p) => {
          const [label, tone] = STATUS[p.status] || [p.status, "grey"];
          return (
            <article key={p.id} className={`relative mb-4 h-[112px] rounded-2xl border border-line bg-paper text-[9px] lg:mb-0 lg:grid lg:h-[93px] lg:items-start lg:rounded-none lg:border-0 lg:border-b lg:bg-transparent lg:py-[7px] ${COLUMNS}`}>
              <img src={photo(p.image)} alt="" className="absolute top-2.5 left-[9px] size-[72px] rounded-[10px] object-cover lg:static lg:size-14" />
              <b className="absolute top-[19px] left-[91px] text-[8px] lg:static lg:mt-3.5 lg:text-[9px]">{p.name}</b>
              <span className="absolute top-[39px] left-[91px] text-[7px] text-muted lg:static lg:mt-3.5 lg:text-[9px]">{p.producer_name}</span>
              <strong className="absolute top-[59px] left-[91px] text-[8px] text-forest lg:static lg:mt-3.5 lg:text-[9px] lg:text-ink">{money(p.price)} / {p.unit}</strong>
              <span className="absolute top-[81px] left-[91px] text-[7px] text-muted lg:static lg:mt-3.5 lg:text-[9px] lg:text-ink"><span className="lg:hidden">Stock : </span>{p.stock} {p.unit}</span>
              <span className="absolute top-2.5 right-3.5 lg:static lg:mt-3.5"><Pill tone={tone} className="h-6 min-w-20 text-[8px] lg:h-[27px] lg:min-w-[105px] lg:text-[10px]">{label}</Pill></span>
              <span className="absolute right-[17px] bottom-[11px] flex gap-2 lg:static lg:mt-3.5 lg:flex-col lg:items-end lg:gap-[5px]">
                {actions(p).map(([text, status]) => <button key={status} onClick={() => moderate(p, status)} className="text-[7px] font-bold text-forest hover:underline lg:text-[8px]">{text}</button>)}
              </span>
            </article>
          );
        }) : <p className="card p-5 text-[10px] text-muted lg:border-0 lg:px-0">Aucun produit dans cette catégorie.</p>}
      </section>
      <p className="mt-[18px] hidden rounded-[11px] bg-soft px-5 py-[13px] text-[9px] text-forest lg:block">Chaque annonce affiche une unité, une zone de collecte et un stock avant publication.</p>
    </div>
  );
}

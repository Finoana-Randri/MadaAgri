import { useState } from "react";
import { useStore } from "../store.jsx";
import { post } from "../lib/api.js";
import { useAdmin } from "../lib/useAdmin.js";
import { initials, money, photo } from "../lib/format.js";
import { AdminGuard, Metric } from "../components/AdminBits.jsx";
import { Icon, Kv, Modal, PageHead, Pill } from "../components/ui.jsx";

export default function Admin() {
  return <AdminGuard from="/admin"><Moderation /></AdminGuard>;
}

function Moderation() {
  const { toast, refresh } = useStore();
  const { data, reload } = useAdmin();
  const [examined, setExamined] = useState(null);
  const [producer, setProducer] = useState(null);
  const [decisions, setDecisions] = useState({});
  const pending = data.products.filter((p) => p.status === "pending");
  const producers = data.users.filter((u) => u.role === "producer" && !u.verified);

  const act = async (call, message) => {
    try { await call(); toast(message); setExamined(null); setProducer(null); await reload(); refresh(); }
    catch (error) { toast(error.message); }
  };
  const moderate = (product, status) => act(() => post(`/products/${product.id}/moderate`, { status }), status === "published" ? "Fiche publiée." : "Fiche refusée.");
  const verify = (user) => act(() => post(`/users/${user.id}/verify`, { verified: true }), "Producteur vérifié.");
  const decide = (claim, status) => {
    const resolution = (decisions[claim.id] || "").trim();
    if (resolution.length < 5) { toast("Décrivez la décision en cinq caractères au moins."); return; }
    act(() => post(`/claims/${claim.id}/resolve`, { status, resolution }), "Réclamation traitée.");
  };

  return (
    <div className="page">
      <PageHead label="14 / Back-office / Modération" title="Back-office" text="Vérifiez les producteurs, les produits et les commandes signalées." mobileText="Modération du marché" className="mb-[26px] lg:mb-[42px]" />
      <div className="grid grid-cols-3 gap-2.5 lg:gap-[27px] lg:pr-6">
        <Metric label="Producteurs à vérifier" mobileLabel="Producteurs" value={producers.length} note="Demandes en attente" />
        <Metric label="Produits à examiner" mobileLabel="Produits" value={pending.length} note="Nouvelles publications" />
        <Metric label="Réclamations ouvertes" mobileLabel="Réclamations" value={data.metrics.open_claims || 0} note="À traiter" />
      </div>

      <div className="mt-[26px] grid gap-5 lg:grid-cols-[minmax(0,800px)_minmax(0,1fr)] lg:gap-7">
        <section className="lg:min-h-[457px] lg:rounded-2xl lg:border lg:border-line lg:bg-paper lg:p-[26px]">
          <div className="flex items-center justify-between px-1 pb-3 lg:border-b lg:border-line lg:px-0 lg:pb-3.5">
            <h2 className="text-[14px] font-[750] lg:text-[15px]"><span className="hidden lg:inline">Fiches produits en attente</span><span className="lg:hidden">Produits à examiner</span></h2>
            {pending.length > 0 && <span className="hidden lg:block"><Pill tone="warm" className="min-w-[122px]">{pending.length} à examiner</Pill></span>}
          </div>
          {pending.length ? pending.map((p) => (
            <article key={p.id} className="relative mb-3 grid h-24 grid-cols-[70px_1fr] gap-3 rounded-2xl border border-line bg-paper p-[9px] lg:mb-0 lg:h-auto lg:grid-cols-[76px_1fr_auto] lg:gap-[17px] lg:rounded-none lg:border-0 lg:border-b lg:bg-transparent lg:px-0 lg:pt-5 lg:pb-[7px]">
              <img src={photo(p.image)} alt="" className="h-[76px] w-[70px] rounded-[11px] object-cover lg:size-[76px]" />
              <div>
                <b className="mt-3 block text-[8px] lg:mt-4 lg:text-[11px]">{p.name}</b>
                <small className="mt-2 block text-[7px] text-muted lg:mt-3 lg:text-[9px]">{p.producer_name} · {money(p.price)} / {p.unit}</small>
                <span className="mt-3.5 hidden lg:block"><Pill tone="warm" className="min-w-[88px]">En attente</Pill></span>
              </div>
              <div className="absolute right-3.5 bottom-2.5 left-[91px] flex justify-between lg:static lg:mt-3.5 lg:gap-2.5">
                <button onClick={() => setExamined(p)} className="btn-soft h-[26px] w-[104px] rounded-[10px] text-[7px] lg:h-[37px] lg:w-[100px] lg:text-[9px]">Examiner</button>
                <button onClick={() => moderate(p, "rejected")} className="text-[7px] font-bold text-warm-ink lg:btn-outline lg:h-[37px] lg:w-[118px] lg:rounded-[10px] lg:text-[9px] lg:text-forest">Refuser</button>
              </div>
            </article>
          )) : <p className="px-1 py-5 text-[10px] text-muted">Aucune fiche en attente.</p>}
        </section>

        <section className="px-1 lg:rounded-2xl lg:border lg:border-line lg:bg-paper lg:p-[26px] lg:pb-[30px]">
          <h2 className="text-[9px] font-[750] lg:text-[15px]"><span className="hidden lg:inline">Vérification producteur</span><span className="lg:hidden">Producteurs à vérifier · {producers.length} demande{producers.length > 1 ? "s" : ""}</span></h2>
          {producers.length ? producers.map((u) => (
            <div key={u.id} className="grid grid-cols-[40px_1fr_auto] items-start gap-3.5 pt-3 pb-1 lg:pt-6 lg:pb-5">
              <span className="grid size-10 place-items-center rounded-full bg-leaf text-[10px] font-extrabold text-forest">{initials(u.name)}</span>
              <div className="border-b border-line pb-4">
                <b className="block text-[9px]">{u.name}</b>
                <small className="mt-3 block text-[7px] text-muted">{u.phone ? "Téléphone " + (u.phone_verified ? "vérifié" : "à confirmer") : "Identité et zone à confirmer"}</small>
              </div>
              <button onClick={() => setProducer(u)} className="mt-2.5 flex items-center gap-1 text-[9px] font-bold text-forest">Ouvrir <Icon name="arrow" className="size-3" /></button>
            </div>
          )) : <p className="py-5 text-[10px] text-muted">Aucun profil à vérifier.</p>}
          <div className="mt-4 rounded-xl bg-soft px-[18px] py-[22px] lg:mt-9">
            <b className="block text-[9px]">Paiement et livraison</b>
            <small className="mt-3.5 block text-[8px] text-muted">Partenaires à confirmer avant activation : les frais sont convenus entre acheteur et producteur.</small>
          </div>
        </section>
      </div>

      <section className="mt-5 rounded-2xl border border-line bg-paper p-3.5 lg:mt-[17px] lg:p-[18px]">
        <div className="flex items-center justify-between gap-3.5">
          <h2 className="text-[11px] font-[750] lg:text-[15px]">Réclamations</h2>
          <a href="/api/admin/export" className="btn-soft h-9 px-3.5 text-[10px] lg:text-[11px]">Exporter commandes CSV</a>
        </div>
        {data.claims.length ? data.claims.map((c) => (
          <div key={c.id} className="mt-3 grid gap-2 border-t border-line pt-3 lg:grid-cols-[1fr_auto] lg:items-start">
            <div>
              <b className="block text-[10px]">{c.code} · {c.reason}</b>
              <small className="mt-1 block text-[9px] text-muted">{c.details} · {c.status === "open" ? "ouverte" : c.status === "resolved" ? "résolue" : "rejetée"}{c.resolution ? " · " + c.resolution : ""}</small>
              {c.status === "open" && <textarea value={decisions[c.id] || ""} onChange={(e) => setDecisions({ ...decisions, [c.id]: e.target.value })}
                aria-label={`Décision pour ${c.code}`} placeholder="Expliquez la décision au client" className="input mt-2 !h-14 max-w-[500px] py-2" />}
            </div>
            {c.status === "open" && <div className="flex gap-2">
              <button onClick={() => decide(c, "resolved")} className="btn-primary h-8 px-3 text-[10px]">Résoudre</button>
              <button onClick={() => decide(c, "rejected")} className="btn-outline h-8 px-3 text-[10px]">Rejeter</button>
            </div>}
          </div>
        )) : <p className="mt-3 text-[9px] text-muted">Aucune réclamation enregistrée.</p>}
      </section>

      {examined && (
        <Modal onClose={() => setExamined(null)} labelledBy="examine-title">
          <img src={photo(examined.image)} alt="" className="mb-4 h-[220px] w-full rounded-xl object-cover" />
          <Pill tone="warm">En attente</Pill>
          <h2 id="examine-title" className="mt-3 text-[19px] font-bold">{examined.name}</h2>
          <p className="mt-2 mb-3 text-[10px] text-muted">{examined.producer_name} · {examined.region} · {examined.category}</p>
          <Kv label="Prix" className="py-2 text-[10px]">{money(examined.price)} / {examined.unit}</Kv>
          <Kv label="Stock annoncé" className="py-2 text-[10px]">{examined.stock} {examined.unit}</Kv>
          <p className="mt-3 mb-5 text-[10px] leading-4 text-muted">{examined.description || "Sans description."}</p>
          <div className="flex justify-end gap-2.5">
            <button onClick={() => moderate(examined, "rejected")} className="btn-outline h-10 px-4 text-[11px]">Refuser</button>
            <button onClick={() => moderate(examined, "published")} className="btn-primary h-10 px-4 text-[11px]">Publier la fiche</button>
          </div>
        </Modal>
      )}
      {producer && (
        <Modal onClose={() => setProducer(null)} labelledBy="producer-title">
          <h2 id="producer-title" className="text-[19px] font-bold">{producer.name}</h2>
          <p className="mt-2 mb-3 text-[10px] text-muted">Demande de compte producteur</p>
          <Kv label="E-mail" className="py-2 text-[10px]">{producer.email}</Kv>
          <Kv label="Téléphone" className="py-2 text-[10px]">{producer.phone ? `${producer.phone} · ${producer.phone_verified ? "vérifié" : "non vérifié"}` : "Non renseigné"}</Kv>
          <Kv label="Fiches déposées" className="py-2 text-[10px]">{data.products.filter((p) => p.producer_id === producer.id).length}</Kv>
          <p className="mt-3 mb-5 text-[10px] leading-4 text-muted">Vérifiez l’identité et la zone de production avant d’autoriser la publication de fiches.</p>
          <div className="flex justify-end gap-2.5">
            <button onClick={() => setProducer(null)} className="btn-outline h-10 px-4 text-[11px]">Plus tard</button>
            <button onClick={() => verify(producer)} className="btn-primary h-10 px-4 text-[11px]">Vérifier le producteur</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

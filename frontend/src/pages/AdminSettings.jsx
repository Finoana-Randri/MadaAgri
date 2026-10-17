import { useState } from "react";
import { useStore } from "../store.jsx";
import { post } from "../lib/api.js";
import { useAdmin } from "../lib/useAdmin.js";
import { AdminGuard } from "../components/AdminBits.jsx";
import { PageHead, Pill } from "../components/ui.jsx";

export default function AdminSettings() {
  return <AdminGuard from="/admin/parametres"><Settings /></AdminGuard>;
}

const lines = (value) => String(value || "").split(/\r?\n/).map((s) => s.trim()).filter(Boolean);

function Settings() {
  const { toast, refresh } = useStore();
  const { data, loading, reload } = useAdmin();
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const settings = data.settings || {};
  const accounts = data.users.filter((u) => u.role !== "admin" && `${u.name} ${u.email}`.toLocaleLowerCase("fr").includes(query.toLocaleLowerCase("fr")));

  const setActive = async (account, active) => {
    try { await post(`/users/${account.id}/active`, { active }); toast("Accès au compte mis à jour."); reload(); }
    catch (error) { toast(error.message); }
  };
  const save = async (event) => {
    event.preventDefault();
    const v = Object.fromEntries(new FormData(event.currentTarget).entries());
    setBusy(true);
    try {
      await post("/admin/settings", { categories: lines(v.categories), units: lines(v.units), zones: lines(v.zones), commission_percent: Number(v.commission_percent), service_fee: Number(v.service_fee) });
      toast("Paramètres enregistrés."); await reload(); refresh();
    } catch (error) { toast(error.message); }
    setBusy(false);
  };
  const listField = (name, label) => (
    <label className="block">
      <span className="field-label">{label}</span>
      <textarea name={name} rows={6} required defaultValue={(settings[name] || []).join("\n")} className="input h-auto py-2.5" />
      <small className="mt-1 block text-[9px] text-muted">Un élément par ligne.</small>
    </label>
  );

  return (
    <div className="page">
      <PageHead label="17 / BO / Comptes et paramètres" title="Comptes et paramètres" text="Gérez les accès et les règles publiques du marché." className="mb-6 lg:mb-9" />
      <div className="grid gap-5 lg:grid-cols-2 lg:gap-7">
        <section className="card p-4 lg:p-[26px]">
          <h2 className="text-[15px] font-[750]">Comptes</h2>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un compte" aria-label="Rechercher un compte" className="input mt-4" />
          <div className="mt-2">
            {accounts.length ? accounts.map((u) => (
              <div key={u.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-line py-3 md:grid-cols-[minmax(0,1fr)_auto_auto] md:gap-3">
                <div className="min-w-0"><b className="block truncate text-[11px]">{u.name}</b><small className="block truncate text-[9px] text-muted">{u.email} · {u.role === "producer" ? "Producteur" : "Acheteur"}</small></div>
                <span className="hidden md:block"><Pill tone={u.active ? "green" : "grey"}>{u.active ? "Actif" : "Suspendu"}</Pill></span>
                <button onClick={() => setActive(u, !u.active)} className={`${u.active ? "btn-outline" : "btn-soft"} h-8 px-3 text-[10px]`}>{u.active ? "Suspendre" : "Réactiver"}</button>
              </div>
            )) : <p className="py-4 text-[10px] text-muted">Aucun compte.</p>}
          </div>
        </section>
        <section className="card p-4 lg:p-[26px]">
          <h2 className="text-[15px] font-[750]">Catalogue et zones</h2>
          {!loading && (
            <form onSubmit={save} className="mt-4 grid gap-4">
              {listField("categories", "Catégories")}
              {listField("units", "Unités de vente")}
              {listField("zones", "Zones desservies")}
              <div className="grid grid-cols-2 gap-3">
                <label><span className="field-label">Commission producteur (%)</span><input name="commission_percent" type="number" min="0" max="100" step="0.1" required defaultValue={Number(settings.commission_percent || 0)} className="input" /></label>
                <label><span className="field-label">Frais de service (Ar)</span><input name="service_fee" type="number" min="0" required defaultValue={Number(settings.service_fee || 0)} className="input" /></label>
              </div>
              <p className="text-[9px] text-muted">Publiez les conditions destinées aux producteurs avant d’appliquer une commission commerciale.</p>
              <button disabled={busy} className="btn-primary h-11 text-[11px]">Enregistrer les paramètres</button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}

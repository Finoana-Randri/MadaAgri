import { useState } from "react";
import { useStore } from "../store.jsx";
import { post } from "../lib/api.js";
import { Modal } from "./ui.jsx";

const PHOTOS = [["tomates.png", "Tomates"], ["riz-rouge.png", "Riz rouge"], ["bredes-mafana.png", "Brèdes mafana"], ["bananes.png", "Bananes"], ["aubergines-piments.png", "Aubergines & piments"]];

const readBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result).split(",")[1]);
  reader.onerror = () => reject(new Error("La photo n’a pas pu être lue."));
  reader.readAsDataURL(file);
});

export default function ProductFormModal({ product, onClose, onSaved }) {
  const { user, config, toast } = useStore();
  const [busy, setBusy] = useState(false);
  const field = "grid gap-1.5 text-[10px] font-bold";

  const submit = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const values = Object.fromEntries(form.entries());
    const file = form.get("photo_file");
    delete values.photo_file;
    setBusy(true);
    try {
      if (file && file.size) {
        if (file.size > 2_000_000 || !["image/png", "image/jpeg", "image/webp"].includes(file.type)) throw new Error("Utilisez une photo PNG, JPEG ou WebP de 2 Mo maximum.");
        values.image = (await post("/uploads", { data: await readBase64(file) })).image;
      }
      await post(product ? `/products/${product.id}/update` : "/products", values);
      toast(product ? "Fiche mise à jour." : "Fiche envoyée à la modération.");
      onClose();
      onSaved();
    } catch (error) { toast(error.message); setBusy(false); }
  };

  return (
    <Modal onClose={onClose} labelledBy="product-form-title">
      <h2 id="product-form-title" className="text-[17px] font-bold">{product ? "Modifier la fiche" : "Ajouter une fiche produit"}</h2>
      <p className="mt-2 mb-4 text-[10px] text-muted">{product ? "Les changements de prix et de stock sont visibles immédiatement." : "La fiche est vérifiée par l’équipe avant publication."}</p>
      <form onSubmit={submit} className="grid gap-3">
        <label className={field}>Nom du produit<input name="name" required maxLength={120} defaultValue={product?.name} className="input" /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className={field}>Prix (Ar)<input name="price" type="number" min="1" required defaultValue={product?.price} className="input" /></label>
          <label className={field}>Unité<select name="unit" required defaultValue={product?.unit} className="input">{config.units.map((u) => <option key={u}>{u}</option>)}</select></label>
          <label className={field}>Stock disponible<input name="stock" type="number" min="0" required defaultValue={product?.stock} className="input" /></label>
          <label className={field}>Région<select name="region" required defaultValue={product?.region} className="input">{config.zones.map((z) => <option key={z}>{z}</option>)}</select></label>
        </div>
        <label className={field}>Catégorie<select name="category" defaultValue={product?.category} className="input">{config.categories.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label className={field}>Photo du produit
          <select name="image" defaultValue={product?.image} className="input">
            {product?.image?.startsWith("user-") && <option value={product.image}>Photo actuelle</option>}
            {PHOTOS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <input name="photo_file" type="file" accept="image/png,image/jpeg,image/webp" aria-label="Importer une photo de produit"
            className="mt-1 rounded-lg border border-dashed border-[#b8cabb] bg-[#f8faf5] p-2 text-[10px] font-normal" />
          <small className="font-normal text-muted">Ou importez votre photo (PNG, JPEG, WebP · 2 Mo maximum).</small>
        </label>
        <label className={field}>Description<textarea name="description" maxLength={500} defaultValue={product?.description} className="input !h-20 py-2.5" /></label>
        <div className="mt-1 flex justify-end gap-2.5">
          <button type="button" onClick={onClose} className="btn-outline h-10 px-4 text-[11px]">Annuler</button>
          <button disabled={busy || !user.verified} className="btn-primary h-10 px-4 text-[11px]">{product ? "Enregistrer" : "Envoyer à la vérification"}</button>
        </div>
      </form>
    </Modal>
  );
}

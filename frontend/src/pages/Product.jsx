import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useStore } from "../store.jsx";
import { money, photo, rating } from "../lib/format.js";
import { Icon } from "../components/ui.jsx";
import NotFound from "./NotFound.jsx";

export default function Product() {
  const { id } = useParams();
  const { products, addToCart, favorites, toggleFavorite } = useStore();
  const product = products.find((p) => p.id === Number(id));
  const [quantity, setQuantity] = useState(1);
  if (!product) return <NotFound text="Ce produit n’est plus disponible sur le marché." />;
  const favorite = favorites.includes(product.id);
  const change = (delta) => setQuantity((q) => Math.max(1, Math.min(product.stock, q + delta)));

  return (
    <div className="page">
      <span className="page-label">06 / Fiche produit</span>
      <nav className="mb-[17px] hidden gap-2 text-[9px] text-muted lg:flex" aria-label="Fil d’Ariane">
        <Link to="/" className="hover:text-forest">Marché</Link>/<span>{product.category}</span>/<span>{product.name}</span>
      </nav>
      <div className="lg:grid lg:grid-cols-[minmax(0,625fr)_minmax(0,620fr)] lg:gap-[51px] xl:grid-cols-[625px_620px]">
        <div>
          <div className="relative">
            <img src={photo(product.image)} alt={product.name} className="h-[225px] w-full rounded-[18px] object-cover lg:h-[500px] lg:rounded-[22px]" />
            <span className="absolute top-3 left-3 flex h-[27px] items-center rounded-full bg-paper px-6 text-[10px] font-bold lg:top-[17px] lg:left-[18px]">Récolté ce matin</span>
            <button onClick={() => toggleFavorite(product)} aria-pressed={favorite} aria-label={favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
              className={`absolute top-3 right-3 grid size-9 place-items-center rounded-full bg-paper ${favorite ? "text-orange" : "text-forest"}`}>
              <Icon name="heart" className={`size-4 ${favorite ? "fill-current" : ""}`} />
            </button>
          </div>
          <div className="mt-3 hidden gap-3 lg:flex">
            {[0, 1, 2].map((i) => <img key={i} src={photo(product.image)} alt="" className="h-[66px] w-[81px] rounded-[10px] object-cover" />)}
          </div>
        </div>

        <section className="mx-1 mt-6 lg:mx-0 lg:mt-0 lg:min-h-[578px] lg:rounded-[18px] lg:border lg:border-line lg:bg-paper lg:p-[35px]">
          <p className="text-[8px] font-bold tracking-[.1em] text-forest uppercase lg:text-[9px]">
            <span className="hidden lg:inline">Marché local / </span>{product.category} / {product.region}
          </p>
          <h1 className="mt-3 text-[22px] leading-[28px] font-extrabold lg:mt-[22px] lg:text-[31px] lg:leading-[38px]">{product.name}</h1>
          <p className="mt-2.5 text-[9px] text-muted lg:mt-3 lg:text-[10px]">{product.producer_name} · {product.region}</p>
          <p className="mt-4 text-[9px] font-bold text-[#d8a24c] lg:mt-5">★ {rating(product.rating)} · Producteur vérifié</p>
          <div className="mt-6 flex items-center justify-between lg:mt-6 lg:border-t lg:border-line lg:pt-[25px]">
            <p className="text-[22px] font-extrabold text-forest lg:text-[29px]">{money(product.price)} <small className="text-[9px] font-medium text-muted lg:text-[10px]">/ {product.unit}</small></p>
            <span className="inline-flex h-[27px] items-center rounded-full bg-leaf px-4 text-[9px] font-bold text-forest lg:mr-6 lg:px-9">{product.stock} {product.unit} disponibles</span>
          </div>
          <p className="mt-6 text-[9px] leading-[17px] text-muted lg:mt-9 lg:text-[11px] lg:text-ink">
            {product.description}<span className="block lg:mt-1.5 lg:text-[9px] lg:text-muted">Une récolte locale, fraîche et soigneusement triée.</span>
          </p>
          <p className="mt-9 hidden text-[10px] font-bold lg:block">Quantité</p>
          <div className="mt-5 flex gap-2 lg:mt-3 lg:gap-3">
            <div className="flex h-[45px] w-[136px] shrink-0 items-center justify-between rounded-xl border border-line bg-paper px-3.5 lg:h-12 lg:w-[150px] lg:px-4">
              <button onClick={() => change(-1)} aria-label="Diminuer la quantité" className="text-forest"><Icon name="minus" className="size-3.5" /></button>
              <span className="text-[10px] font-semibold">{quantity} {product.unit}</span>
              <button onClick={() => change(1)} aria-label="Augmenter la quantité" className="text-forest"><Icon name="plus" className="size-3.5" /></button>
            </div>
            <button onClick={() => addToCart(product, quantity)} className="btn-primary h-[45px] flex-1 text-[10px] lg:h-12 lg:text-[12px]">Ajouter au panier <Icon name="arrow" className="size-4" /></button>
          </div>
          <div className="mt-6 text-[9px] font-bold text-forest lg:mt-6 lg:border-t lg:border-line lg:pt-6 lg:text-[10px]">
            <p>✓ Producteur vérifié <span className="lg:hidden">· Livraison ou retrait</span></p>
            <p className="mt-3.5 hidden lg:block">• Livraison à domicile ou retrait</p>
            <p className="mt-3.5 hidden text-[8px] font-normal text-muted lg:block">Frais de livraison confirmés avant votre engagement.</p>
          </div>
        </section>
      </div>
      <div className="mt-8 hidden rounded-2xl border border-line bg-soft px-[26px] py-[22px] lg:block">
        <b className="text-[14px] font-bold text-forest">Cultivé avec soin à Madagascar</b>
        <p className="mt-3 text-[9px] text-muted">Découvrez l’origine de votre récolte : {product.producer_name}, {product.region}, vendue sans intermédiaire.</p>
      </div>
    </div>
  );
}

import { Link } from "react-router-dom";
import { useStore } from "../store.jsx";
import { money, photo, rating } from "../lib/format.js";
import { Icon } from "./ui.jsx";

export default function ProductCard({ product }) {
  const { addToCart, favorites, toggleFavorite } = useStore();
  const favorite = favorites.includes(product.id);
  const href = `/produit/${product.id}`;
  return (
    <article className="relative flex h-[188px] flex-col overflow-hidden rounded-2xl border border-line bg-paper lg:h-[277px]">
      <Link to={href} className="block h-[92px] shrink-0 lg:h-[151px]" tabIndex={-1}>
        <img src={photo(product.image)} alt={product.name} width="900" height="900" loading="lazy" decoding="async" className="size-full object-cover" />
      </Link>
      <span className="absolute top-[13px] left-[13px] hidden h-[27px] items-center rounded-full bg-paper px-2.5 text-[10px] font-bold lg:flex">Récolté ce matin</span>
      <button onClick={() => toggleFavorite(product)} aria-pressed={favorite} aria-label={(favorite ? "Retirer " : "Ajouter ") + product.name + " des favoris"}
        className={`absolute top-2 right-2 grid size-7 place-items-center rounded-full bg-paper/90 lg:top-[13px] lg:right-[13px] ${favorite ? "text-orange" : "text-forest"}`}>
        <Icon name="heart" className={`size-3.5 ${favorite ? "fill-current" : ""}`} />
      </button>
      <div className="relative flex-1 px-2.5 pt-3 lg:px-4 lg:pt-3.5">
        <h3 className="text-[10px] leading-[13px] font-bold lg:mb-1.5 lg:text-[14px] lg:leading-[17px] lg:font-[750]">
          <Link to={href} className="hover:underline">{product.name}</Link>
        </h3>
        <p className="mt-2.5 text-[7px] text-warm-ink lg:mt-0 lg:text-[9px] lg:text-muted">
          <span className="hidden lg:inline">{product.producer_name} · {product.region}</span>
          <span className="lg:hidden">Producteur vérifié · Madagascar</span>
        </p>
        <p className="mt-[18px] text-[9px] lg:mt-5 lg:text-[12px]">
          <b className="font-extrabold">{money(product.price)}</b> <span className="text-muted">/ {product.unit}</span>
        </p>
        <p className="absolute bottom-[17px] left-4 hidden text-[9px] font-bold text-warm-ink lg:block">★ {rating(product.rating)} · Producteur vérifié</p>
        <button onClick={() => addToCart(product)} aria-label={`Ajouter ${product.name} au panier`}
          className="absolute right-2.5 bottom-2.5 grid size-[26px] place-items-center rounded-[9px] bg-leaf text-forest lg:right-4 lg:bottom-[15px] lg:size-[31px] lg:rounded-[10px]">
          <Icon name="plus" className="size-3.5" strokeWidth={2.4} />
        </button>
      </div>
    </article>
  );
}

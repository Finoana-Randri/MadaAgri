import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useStore } from "../store.jsx";
import { photo } from "../lib/format.js";
import ProductCard from "../components/ProductCard.jsx";
import { Icon } from "../components/ui.jsx";

const SORTS = { season: "De saison", "price-up": "Prix croissant", "price-down": "Prix décroissant", rating: "Mieux notés" };
const chipLabel = (c) => (c === "Tout" ? "Tout voir" : c === "Feuilles & herbes" ? "Feuilles" : c);

export default function Home() {
  const { products, config, search, setSearch, favorites } = useStore();
  const [params, setParams] = useSearchParams();
  const [category, setCategory] = useState("Tout");
  const [sort, setSort] = useState("season");
  const searchInput = useRef(null);
  const grid = useRef(null);
  const onlyFavorites = params.get("favoris") === "1";
  const mobileSearch = params.get("recherche") === "1" || Boolean(search);

  useEffect(() => {
    if (params.get("recherche") === "1") { searchInput.current?.focus(); grid.current?.scrollIntoView({ behavior: "smooth" }); }
  }, [params]);

  const categories = ["Tout", ...config.categories.filter((c) => c !== "Autres" || products.some((p) => p.category === "Autres"))];
  const shown = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("fr");
    const list = products.filter((p) => (category === "Tout" || p.category === category)
      && (!onlyFavorites || favorites.includes(p.id))
      && (!term || [p.name, p.category, p.region, p.producer_name].join(" ").toLocaleLowerCase("fr").includes(term)));
    if (sort === "price-up") list.sort((a, b) => a.price - b.price);
    if (sort === "price-down") list.sort((a, b) => b.price - a.price);
    if (sort === "rating") list.sort((a, b) => b.rating - a.rating);
    return list;
  }, [products, category, search, sort, onlyFavorites, favorites]);

  const showAll = () => { setCategory("Tout"); setSearch(""); setParams({}); };

  return (
    <div className="page">
      <span className="page-label lg:mt-0">01 / Marché</span>
      <section className="relative isolate h-[206px] overflow-hidden rounded-[18px] bg-forest text-white lg:h-[294px] lg:rounded-[21px]">
        <img src={photo("hero-marche.png")} alt="Marché de produits frais à Madagascar" width="1536" height="1024" fetchPriority="high"
          className="absolute inset-0 -z-10 size-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(23,61,47,.92),rgba(23,61,47,.78)_48%,rgba(23,61,47,.38))] lg:bg-[linear-gradient(90deg,rgba(33,75,55,.98),rgba(33,75,55,.88)_48%,rgba(33,75,55,.76))]" />
        <div className="px-[18px] pt-[18px] lg:px-11 lg:pt-10">
          <p className="text-[8px] font-bold tracking-[.1em] text-mist uppercase lg:text-[10px]">
            <span className="hidden lg:inline">Le goût du terroir, près de chez vous</span><span className="lg:hidden">Du champ à votre table</span>
          </p>
          <h1 className="mt-4 text-[21px] leading-[26px] font-bold lg:mt-[19px] lg:text-[42px] lg:leading-[1.1] lg:font-extrabold">Les bons produits,<br />directement du producteur.</h1>
          <p className="mt-3 mb-[22px] text-[10px] lg:mt-3.5 lg:mb-[27px] lg:text-[14px]">
            <span className="hidden lg:inline">Découvrez les récoltes de producteurs malgaches et commandez simplement.</span>
            <span className="lg:hidden">Les récoltes de nos régions, près de chez vous.</span>
          </p>
          <button onClick={() => grid.current?.scrollIntoView({ behavior: "smooth" })}
            className="btn h-[37px] w-[155px] rounded-xl bg-leaf text-[10px] text-forest lg:h-[46px] lg:w-[190px] lg:text-[12px]">
            Explorer le marché <Icon name="arrow" className="hidden size-3.5 lg:block" />
          </button>
        </div>
      </section>

      <section className="mt-[34px] hidden lg:block">
        <h2 className="text-[19px] leading-[23px] font-[750]">Choisir par catégorie</h2>
        <div className="mt-[9px] flex flex-wrap gap-[9px]">
          {categories.map((c) => (
            <button key={c} onClick={() => setCategory(c)} aria-pressed={category === c}
              className={`h-[27px] min-w-[82px] rounded-full border px-3 text-[10px] font-bold ${category === c ? "border-forest bg-forest text-white" : "border-line bg-paper text-ink hover:border-forest/40"}`}>
              {chipLabel(c)}
            </button>
          ))}
        </div>
      </section>

      <div ref={grid} className="flex scroll-mt-24 items-center justify-between px-1 pt-[22px] pb-2.5 lg:h-[68px] lg:items-end lg:px-0 lg:pt-0 lg:pb-[13px]">
        <h2 className="text-[17px] leading-[21px] font-[750] lg:text-[21px] lg:leading-[25px]">
          {onlyFavorites ? "Vos favoris" : <><span className="hidden lg:inline">Les récoltes du moment</span><span className="lg:hidden">Récoltes du moment</span></>}
        </h2>
        <button onClick={showAll} className="flex items-center gap-1 text-[9px] font-bold text-forest lg:text-[11px]">
          <span className="hidden lg:inline">Voir tout</span><span className="lg:hidden">Tout voir</span> <Icon name="arrow" className="size-3" />
        </button>
      </div>

      <div className={`mb-3.5 gap-2 ${mobileSearch ? "flex" : "hidden"} lg:hidden`}>
        <label className="flex h-10 flex-1 items-center gap-2 rounded-xl border border-line bg-paper px-3 text-muted">
          <Icon name="search" className="size-3.5" />
          <input ref={searchInput} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Un produit, une région, un producteur…"
            className="w-full bg-transparent text-[11px] text-ink outline-none" aria-label="Rechercher" />
        </label>
        <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Trier les produits" className="h-10 rounded-xl border border-line bg-paper px-2 text-[10px]">
          {Object.entries(SORTS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>
      <div className="mb-3 hidden items-center justify-between lg:flex">
        <div className="flex gap-2 text-[10px] text-muted">
          {search && <span>Recherche : « {search} » · {shown.length} résultat{shown.length > 1 ? "s" : ""}</span>}
          {onlyFavorites && <button className="link text-[10px]" onClick={showAll}>Afficher tout le marché</button>}
        </div>
        {(search || onlyFavorites) && (
          <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Trier les produits" className="h-8 rounded-lg border border-line bg-paper px-2 text-[10px]">
            {Object.entries(SORTS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3.5 md:grid-cols-3 lg:max-w-[1240px] lg:grid-cols-4 lg:gap-5">
        {shown.length ? shown.map((p) => <ProductCard key={p.id} product={p} />)
          : <div className="col-span-full card p-6 text-[11px] text-muted">Aucun produit ne correspond. Essayez une autre recherche.</div>}
      </div>

      <section id="comment-ca-marche" className="mt-10 grid scroll-mt-28 gap-3 lg:mt-14 lg:grid-cols-3 lg:gap-5">
        {[["leaf", "Des producteurs connus", "Chaque récolte a un visage et une région."],
          ["shield", "Des prix sans surprise", "Le total produits est visible avant validation."],
          ["heart", "Une agriculture vivante", "Votre achat soutient l’économie locale."]].map(([icon, title, text]) => (
          <div key={title} className="card flex items-center gap-3.5 p-4 lg:p-5">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-leaf text-forest"><Icon name={icon} /></span>
            <div><b className="block text-[11px] lg:text-[12px]">{title}</b><span className="text-[9px] text-muted lg:text-[10px]">{text}</span></div>
          </div>
        ))}
      </section>
    </div>
  );
}

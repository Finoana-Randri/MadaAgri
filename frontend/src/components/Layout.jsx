import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useStore } from "../store.jsx";
import { post } from "../lib/api.js";
import { initials } from "../lib/format.js";
import { DialogHost, Icon, Toast } from "./ui.jsx";

export function Brand({ footer = false }) {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="MadaAgri accueil">
      <span className={`grid place-items-center rounded-xl bg-forest font-extrabold text-white ${footer ? "size-[42px] text-[23px]" : "size-9 text-[20px] lg:size-[42px] lg:rounded-[13px] lg:text-[23px]"}`}>M</span>
      <span className="leading-none">
        <span className={`block font-extrabold text-forest ${footer ? "text-[20px]" : "text-[17px] lg:text-[20px]"}`}>MadaAgri</span>
        <small className="mt-1.5 block text-[8px] font-bold tracking-[.1em] text-muted">
          {footer ? "MARCHÉ LOCAL" : <><span className="hidden lg:inline">LE MARCHÉ DE NOS TERROIRS</span><span className="lg:hidden">MARCHÉ LOCAL</span></>}
        </small>
      </span>
    </Link>
  );
}

function spaceFor(user) {
  if (!user) return null;
  if (user.role === "admin") return ["/admin", "Back-office"];
  if (user.role === "producer") return ["/producteur", "Espace producteur"];
  return ["/commandes", "Mes commandes"];
}

function AccountMenu({ onClose, className }) {
  const { user, refresh, clearCart, toast } = useStore();
  const navigate = useNavigate();
  const ref = useRef(null);
  useEffect(() => {
    const away = (event) => { if (!ref.current?.contains(event.target)) onClose(); };
    setTimeout(() => document.addEventListener("click", away));
    return () => document.removeEventListener("click", away);
  }, [onClose]);
  const logout = async () => {
    try { await post("/logout"); clearCart(); await refresh(); onClose(); navigate("/"); toast("Vous êtes déconnecté."); }
    catch (error) { toast(error.message); }
  };
  const [href, label] = spaceFor(user);
  const item = "block w-full rounded-lg px-2 py-1.5 text-left text-[11px] font-semibold text-forest hover:bg-soft";
  return (
    <div ref={ref} className={`z-40 grid min-w-[190px] gap-0.5 rounded-xl border border-line bg-white p-3 shadow-pop ${className}`}>
      <b className="px-2 pb-1 text-[12px]">{user.name}</b>
      <Link className={item} to={href} onClick={onClose}>{label}</Link>
      {user.role === "admin" && <>
        <Link className={item} to="/admin/commandes" onClick={onClose}>Commandes</Link>
        <Link className={item} to="/admin/catalogue" onClick={onClose}>Catalogue produits</Link>
        <Link className={item} to="/admin/parametres" onClick={onClose}>Comptes et paramètres</Link>
      </>}
      {user.role === "producer" && <Link className={item} to="/commandes" onClick={onClose}>Commandes reçues</Link>}
      {user.role !== "admin" && !user.phone_verified && <Link className={item} to="/verification" onClick={onClose}>Vérifier mon numéro</Link>}
      <button className={item} onClick={logout}>Se déconnecter</button>
    </div>
  );
}

function Header() {
  const { user, cartCount, search, setSearch, favorites, toast } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [menu, setMenu] = useState(false);
  const navClass = ({ isActive }) => `py-8 text-[12px] font-semibold ${isActive ? "text-forest" : "text-[#536056] hover:text-forest"}`;
  const onSearch = (value) => { setSearch(value); if (location.pathname !== "/") navigate("/"); };
  const showFavorites = () => {
    if (!favorites.length) { toast("Touchez ♡ sur un produit pour le garder dans vos favoris."); return; }
    navigate("/?favoris=1");
  };
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper">
      <div className="mx-auto flex h-[68px] w-[calc(100%-36px)] items-center justify-between lg:h-[81px] lg:w-[min(1296px,91vw)] lg:gap-6">
        <Brand />
        <nav className="hidden items-center gap-[clamp(24px,3.3vw,48px)] lg:flex lg:mr-auto lg:ml-[clamp(12px,3vw,48px)]" aria-label="Navigation principale">
          <NavLink to="/" end className={navClass}>Marché</NavLink>
          <NavLink to="/producteur" className={navClass}>Producteurs</NavLink>
          <Link to="/#comment-ca-marche" className={navClass({ isActive: false })}>Comment ça marche</Link>
        </nav>
        <div className="flex items-center gap-2.5 lg:gap-3.5">
          <label className="hidden h-[46px] w-[clamp(170px,23vw,333px)] items-center gap-2.5 rounded-xl border border-line bg-[#fbfbf6] px-5 text-muted lg:flex">
            <Icon name="search" className="size-3.5" />
            <input value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Rechercher tomates, riz, brèdes…" aria-label="Rechercher des produits"
              className="w-full bg-transparent text-[11px] text-ink outline-none placeholder:text-muted" />
          </label>
          <button onClick={showFavorites} aria-label="Favoris" className="hidden h-[46px] w-12 place-items-center rounded-xl border border-line bg-paper text-forest lg:grid">
            <Icon name="heart" className="size-[18px]" />
          </button>
          <Link to="/panier" aria-label={`Panier, ${cartCount} article${cartCount > 1 ? "s" : ""}`}
            className="grid h-9 w-[46px] place-items-center rounded-xl border border-line bg-paper text-forest lg:flex lg:h-[46px] lg:w-[95px] lg:items-center lg:justify-center lg:gap-1.5">
            <Icon name="cart" className="size-[18px] lg:hidden" />
            <span className="hidden text-[11px] font-bold lg:inline">Panier</span>
            <b className="hidden text-[11px] lg:inline">{cartCount}</b>
          </Link>
          <div className="relative hidden lg:block">
            <button onClick={() => (user ? setMenu((v) => !v) : navigate("/connexion"))} aria-label={user ? "Mon compte" : "Se connecter"}
              className="grid size-[42px] place-items-center rounded-full bg-leaf text-[10px] font-extrabold text-forest">
              {user ? initials(user.name) : "FR"}
            </button>
            {menu && user && <AccountMenu onClose={() => setMenu(false)} className="absolute top-[52px] right-0" />}
          </div>
        </div>
      </div>
    </header>
  );
}

function MobileNav() {
  const { user } = useStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menu, setMenu] = useState(false);
  const item = (active) => `flex flex-col items-center gap-[5px] text-[8px] ${active ? "text-forest" : "text-muted"}`;
  return (
    <>
      {menu && user && <AccountMenu onClose={() => setMenu(false)} className="fixed right-3 bottom-[72px]" />}
      <nav aria-label="Navigation mobile" className="fixed inset-x-0 bottom-0 z-30 grid h-[62px] grid-cols-5 border-t border-line bg-paper pt-2.5 pb-[7px] lg:hidden">
        <Link to="/" className={item(pathname === "/")}><Icon name="home" className="size-[17px]" />Accueil</Link>
        <button onClick={() => navigate("/?recherche=1")} className={item(false)}><Icon name="search" className="size-[17px]" />Marché</button>
        <Link to="/panier" className={item(pathname === "/panier")}><Icon name="cart" className="size-[17px]" />Panier</Link>
        <Link to="/commandes" className={item(pathname.startsWith("/commandes"))}><Icon name="clock" className="size-[17px]" />Commandes</Link>
        <button onClick={() => (user ? setMenu((v) => !v) : navigate("/connexion"))} className={item(menu)}><Icon name="user" className="size-[17px]" />Compte</button>
      </nav>
    </>
  );
}

function Footer() {
  const link = "text-[10px] text-[#7b857b] hover:text-forest";
  return (
    <footer className="hidden bg-[#f0f1ea] lg:block">
      <div className="mx-auto grid w-[min(1220px,88vw)] grid-cols-[1.5fr_.8fr_.9fr_.8fr] gap-11 pt-9 pb-8">
        <div>
          <Brand footer />
          <p className="mt-4 max-w-[290px] text-[10px] leading-[1.7] text-[#80897f]">Une rencontre plus juste entre les producteurs malgaches et celles et ceux qui aiment bien manger.</p>
        </div>
        <div className="flex flex-col gap-2.5"><b className="mb-1 text-[11px] text-forest">Explorer</b>
          <Link className={link} to="/">Le marché</Link><Link className={link} to="/commandes">Mes commandes</Link><Link className={link} to="/producteur">Vendre sur MadaAgri</Link>
        </div>
        <div className="flex flex-col gap-2.5"><b className="mb-1 text-[11px] text-forest">Notre promesse</b>
          <span className={link}>Produits de saison</span><span className={link}>Prix affichés clairement</span><span className={link}>Producteurs vérifiés</span>
        </div>
        <div className="flex flex-col justify-center gap-2.5 border-l border-[#e4e8df] pl-6">
          <Icon name="leaf" className="size-6 text-orange" /><b className="text-[13px] text-forest">Le goût du vrai.</b><span className={link}>De nos terres à votre table.</span>
        </div>
      </div>
      <div className="mx-auto flex w-[min(1220px,88vw)] items-center justify-between border-t border-[#e7eae2] py-4 text-[9px] text-[#92998f]">
        <span>© 2026 MadaAgri Market</span><span>Un marché qui fait grandir nos régions.</span><Link to="/connexion" className="text-[#707c70]">Connexion</Link>
      </div>
    </footer>
  );
}

export default function Layout() {
  const { ready, loadError } = useStore();
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" });
    else window.scrollTo(0, 0);
  }, [pathname, hash]);
  return (
    <>
      <div className="hidden h-[31px] bg-forest text-[11px] text-[#eef3e9] lg:block">
        <div className="mx-auto flex h-full w-[min(1296px,91vw)] items-center justify-between">
          <span>Des produits frais, directement des producteurs malgaches</span><span className="text-[10px]">Antananarivo · Français</span>
        </div>
      </div>
      <Header />
      <main className="min-h-[calc(100vh-112px)]">
        {loadError ? <div className="page"><div className="card p-6 text-[12px]">Impossible de charger le marché : {loadError}</div></div>
          : ready ? <Outlet /> : <div className="grid h-60 place-items-center text-[12px] text-muted">Préparation du marché…</div>}
      </main>
      <Footer />
      <MobileNav />
      <Toast />
      <DialogHost />
    </>
  );
}

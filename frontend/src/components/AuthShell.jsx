import { photo } from "../lib/format.js";

// Screens 02–05: photo panel on the left (desktop only) and the form card on the right.
export default function AuthShell({ label, kicker, title, text, badge, icon, mobileHead, children }) {
  return (
    <div className="page lg:pb-12">
      <span className={`page-label ${icon ? "mb-10 lg:mb-3" : ""}`}>{label}</span>
      {mobileHead && <div className="mx-1 mb-[18px] lg:hidden">{mobileHead}</div>}
      <div className="lg:grid lg:grid-cols-[minmax(0,625fr)_minmax(0,617fr)] lg:gap-[54px] xl:grid-cols-[625px_617px]">
        <aside className="relative hidden h-[710px] overflow-hidden rounded-[22px] text-white lg:block">
          <img src={photo("hero-marche.png")} alt="Marché malgache de produits frais" className="absolute inset-0 size-full object-cover" />
          <div className="absolute inset-0 bg-[rgba(33,75,55,.72)]" />
          <div className="relative px-10 pt-[71px]">
            <span className="text-[10px] font-bold tracking-[.1em] text-[#deead4] uppercase">{kicker}</span>
            <h2 className="my-8 text-[clamp(30px,2.65vw,38px)] leading-[1.18] font-extrabold">{title}</h2>
            <p className="mb-11 text-[13px] leading-6">{text}</p>
            {badge && <span className="inline-flex h-[27px] items-center rounded-full bg-leaf px-[13px] text-[10px] font-bold text-forest">✓ {badge}</span>}
          </div>
        </aside>
        <section className="relative rounded-[20px] border border-line bg-paper px-[19px] pt-5 pb-7 lg:min-h-[710px] lg:rounded-2xl lg:px-[49px] lg:pt-[30px]">
          {icon && <span className="mb-[18px] grid size-12 place-items-center rounded-2xl bg-leaf text-[20px] font-extrabold text-forest lg:hidden">{icon}</span>}
          {children}
        </section>
      </div>
    </div>
  );
}

export function AuthTitle({ children, className = "" }) {
  return <h1 className={`text-[22px] leading-[27px] font-extrabold lg:text-[25px] lg:leading-[31px] ${className}`}>{children}</h1>;
}

export function Field({ label, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

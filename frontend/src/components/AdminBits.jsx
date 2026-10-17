import { Link, Navigate } from "react-router-dom";
import { useStore } from "../store.jsx";

export function AdminGuard({ children, from }) {
  const { user } = useStore();
  if (!user) return <Navigate to="/connexion" state={{ from }} replace />;
  if (user.role !== "admin") {
    return (
      <div className="page">
        <h1 className="text-[22px] font-extrabold">Accès réservé.</h1>
        <p className="mt-2 text-[11px] text-muted">Connectez-vous avec un compte administrateur.</p>
        <Link to="/" className="btn-primary mt-5 h-10 w-fit px-5 text-[11px]">Retour au marché</Link>
      </div>
    );
  }
  return children;
}

export function Metric({ label, mobileLabel, value, note, className = "" }) {
  return (
    <div className={`h-[75px] rounded-2xl border border-line bg-paper px-2.5 py-[17px] lg:h-[101px] lg:p-[19px] ${className}`}>
      <span className="block text-[7px] text-muted lg:text-[10px]">
        {mobileLabel ? <><span className="hidden lg:inline">{label}</span><span className="lg:hidden">{mobileLabel}</span></> : label}
      </span>
      <b className="mt-2 block text-[19px] leading-6 font-extrabold text-forest lg:mt-2.5 lg:text-[23px] lg:leading-7">{value}</b>
      {note && <small className="mt-0.5 hidden text-[9px] text-muted lg:block">{note}</small>}
    </div>
  );
}

export function FilterChips({ options, value, onChange, className = "" }) {
  return (
    <div className={`flex gap-2 overflow-x-auto lg:gap-2.5 ${className}`}>
      {options.map(([id, label]) => (
        <button key={id} onClick={() => onChange(id)} aria-pressed={value === id}
          className={`h-[27px] shrink-0 rounded-full px-4 text-[10px] font-bold ${value === id ? "bg-forest text-white" : "bg-leaf text-forest"}`}>{label}</button>
      ))}
    </div>
  );
}

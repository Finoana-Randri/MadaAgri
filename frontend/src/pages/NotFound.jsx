import { Link } from "react-router-dom";
import { Icon } from "../components/ui.jsx";

export default function NotFound({ text = "Cette page n’existe pas ou a été déplacée." }) {
  return (
    <div className="page">
      <div className="card mx-auto mt-10 max-w-md p-8 text-center">
        <h1 className="text-[22px] font-extrabold">Page introuvable</h1>
        <p className="mt-2 text-[11px] text-muted">{text}</p>
        <Link to="/" className="btn-primary mx-auto mt-5 h-10 w-fit px-5 text-[11px]">Retour au marché <Icon name="arrow" className="size-4" /></Link>
      </div>
    </div>
  );
}

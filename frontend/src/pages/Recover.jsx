import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStore } from "../store.jsx";
import { post } from "../lib/api.js";
import AuthShell, { AuthTitle, Field } from "../components/AuthShell.jsx";
import { Icon } from "../components/ui.jsx";

export default function Recover() {
  const { toast } = useStore();
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);

  const request = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const result = await post("/password-reset/request", { email: new FormData(event.currentTarget).get("email") });
      if (result.demo_token) setToken(result.demo_token);
      else toast(result.message || "Si le compte existe, les instructions seront envoyées.");
    } catch (error) { toast(error.message); }
    setBusy(false);
  };
  const confirm = async (event) => {
    event.preventDefault();
    const v = Object.fromEntries(new FormData(event.currentTarget).entries());
    if (v.password !== v.confirm) { toast("Les deux mots de passe ne correspondent pas."); return; }
    setBusy(true);
    try { await post("/password-reset/confirm", { token, password: v.password }); toast("Mot de passe mis à jour. Connectez-vous."); navigate("/connexion"); }
    catch (error) { toast(error.message); setBusy(false); }
  };

  return (
    <AuthShell label="04 / Mot de passe oublié" kicker="Votre compte" icon="↗"
      title={<>On vous aide à<br />revenir au marché.</>}
      text="Un code de réinitialisation vous sera remis pour retrouver l’accès à votre compte.">
      <AuthTitle className="lg:mt-[39px]"><span className="hidden lg:inline">Réinitialiser le mot de passe</span><span className="lg:hidden">Mot de passe oublié ?</span></AuthTitle>
      <p className="mt-2 text-[9px] leading-[17px] text-muted lg:text-[10px] lg:leading-4">Saisissez votre adresse e-mail pour recevoir un code sécurisé de réinitialisation.</p>
      {!token ? (
        <form onSubmit={request} className="mt-6 grid gap-[30px] lg:mt-5">
          <Field label="Adresse e-mail du compte"><input name="email" type="email" required autoComplete="email" placeholder="nom@email.com" className="input" /></Field>
          <button disabled={busy} className="btn-primary h-[45px] text-[10px] lg:h-[49px] lg:text-[13px]">Recevoir un code <Icon name="arrow" className="size-4" /></button>
        </form>
      ) : (
        <form onSubmit={confirm} className="mt-6 grid gap-[18px]">
          <div className="rounded-xl bg-warm p-4 text-[10px] leading-4 text-warm-ink">
            Code local de démonstration : <b className="break-all">{token}</b><br />Il expire dans 30 minutes. En production, ce code doit être envoyé par e-mail.
          </div>
          <Field label="Nouveau mot de passe"><input name="password" type="password" required minLength={8} autoComplete="new-password" className="input" /></Field>
          <Field label="Confirmer le nouveau mot de passe"><input name="confirm" type="password" required minLength={8} autoComplete="new-password" className="input" /></Field>
          <button disabled={busy} className="btn-primary h-[45px] text-[12px]">Mettre à jour le mot de passe</button>
        </form>
      )}
      <div className="mt-7 rounded-xl bg-soft px-[15px] py-[21px] lg:px-5">
        <b className="block text-[8px] text-forest lg:text-[10px]">Le code expire après 30 minutes.</b>
        <small className="mt-3.5 block text-[8px] text-muted lg:text-[9px]">En démonstration, il s’affiche sur cette page.</small>
      </div>
      <Link to="/connexion" className="mt-11 flex items-center justify-center gap-1 text-[9px] font-bold text-forest lg:text-[11px]"><Icon name="back" className="size-3" /> Retour à la connexion</Link>
    </AuthShell>
  );
}

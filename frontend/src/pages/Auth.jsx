import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useStore } from "../store.jsx";
import { post } from "../lib/api.js";
import AuthShell, { AuthTitle, Field } from "../components/AuthShell.jsx";
import { Icon } from "../components/ui.jsx";

export const homeFor = (user) => (user.role === "admin" ? "/admin" : user.role === "producer" ? "/producteur" : "/commandes");

export function Login() {
  const { refresh, toast } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [busy, setBusy] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    setBusy(true);
    try {
      await post("/login", { email: values.email, password: values.password });
      const data = await refresh();
      navigate(location.state?.from || homeFor(data.user), { replace: true });
      toast(data.user.role === "producer" && !data.user.verified ? "Votre compte producteur attend sa vérification." : "Bienvenue sur MadaAgri.");
    } catch (error) { toast(error.message); setBusy(false); }
  };
  return (
    <AuthShell label="02 / Connexion & inscription" kicker="Madagascar · Marché direct" badge="Producteurs malgaches vérifiés"
      title={<>Le meilleur du<br />terroir vous attend.</>}
      text={<>Un compte unique pour acheter local, suivre vos commandes<br />ou vendre les produits de votre ferme.</>}>
      <AuthTitle className="lg:mt-5">Ravi de vous revoir</AuthTitle>
      <p className="mt-2 text-[10px] text-muted lg:text-[11px]">Connectez-vous pour retrouver vos commandes.</p>
      <div className="mt-7 flex gap-[33px] border-b border-line text-[10px] lg:mt-8 lg:text-[12px]">
        <span className="border-b-2 border-forest pb-3 font-bold text-forest">Connexion</span>
        <Link to="/inscription" state={location.state} className="pb-3 font-semibold text-muted hover:text-forest">Créer un compte</Link>
      </div>
      <form onSubmit={submit} className="mt-6 grid gap-[18px]">
        <Field label="Téléphone ou e-mail"><input name="email" required autoComplete="username" placeholder="+261… ou nom@email.com" className="input" /></Field>
        <Field label="Mot de passe"><input name="password" type="password" required autoComplete="current-password" placeholder="••••••••" className="input" /></Field>
        <Link to="/mot-de-passe" className="-mt-2 justify-self-end text-[9px] font-bold text-forest">Mot de passe oublié ?</Link>
        <button disabled={busy} className="btn-primary h-[45px] text-[13px] lg:h-[49px]">Se connecter <Icon name="arrow" className="hidden size-4 lg:block" /></button>
      </form>
      <div className="my-4 flex items-center gap-3 text-[9px] text-muted before:h-px before:flex-1 before:bg-line after:h-px after:flex-1 after:bg-line">ou continuer avec</div>
      <button type="button" onClick={() => toast("La connexion Google sera disponible après configuration du service.")}
        className="btn-outline h-[42px] w-full text-[10px] text-ink lg:h-[45px] lg:text-[11px]">Continuer avec Google</button>
      <div className="mt-[15px] flex flex-col items-center border-t border-line pt-[17px] text-[9px] text-muted">
        Nouveau sur MadaAgri ?
        <Link to="/inscription" className="btn-soft mt-[15px] h-[42px] w-full text-[10px] lg:h-auto lg:w-auto lg:bg-transparent lg:text-[12px] lg:hover:bg-transparent lg:hover:underline">
          Créer un compte acheteur <Icon name="arrow" className="hidden size-3.5 lg:block" />
        </Link>
      </div>
      <Link to="/producteur" className="mt-7 flex items-center justify-center gap-1 text-[9px] font-bold text-forest">Producteur ? Accéder à mon espace <Icon name="arrow" className="size-3" /></Link>
    </AuthShell>
  );
}

export function Register() {
  const { refresh, toast } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState(location.state?.role || "buyer");
  const [busy, setBusy] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    const v = Object.fromEntries(new FormData(event.currentTarget).entries());
    setBusy(true);
    try {
      await post("/register", { name: [v.name, v.surname].filter(Boolean).join(" "), phone: v.phone, email: v.email, password: v.password, role });
      await refresh();
      navigate("/verification", { replace: true, state: { from: location.state?.from } });
      toast("Compte créé. Vérifiez votre numéro.");
    } catch (error) { toast(error.message); setBusy(false); }
  };
  const roleButton = (value, label) => (
    <button type="button" onClick={() => setRole(value)} aria-pressed={role === value}
      className={`h-[39px] rounded-xl border text-[10px] font-bold ${role === value ? "border-forest bg-forest text-white" : "border-line bg-paper text-ink"}`}>{label}</button>
  );
  return (
    <AuthShell label="03 / Créer un compte" kicker="Une communauté, un marché" badge="Inscription gratuite"
      title={<>Vendez au plus près.<br />Achetez plus juste.</>}
      text={<>Des récoltes locales, un lien direct et des paiements<br />adaptés aux habitudes de chaque région.</>}
      mobileHead={<><AuthTitle>Rejoignez le marché local</AuthTitle><p className="mt-1 text-[9px] text-muted">Achetez ou vendez en toute simplicité.</p></>}>
      <AuthTitle className="hidden lg:mt-5 lg:block">Créer votre compte</AuthTitle>
      <p className="mt-2 hidden text-[11px] text-muted lg:block">Quelques informations pour commencer.</p>
      <form onSubmit={submit} className="grid gap-[18px] lg:mt-6 lg:grid-cols-2 lg:gap-x-6 lg:gap-y-[18px]">
        <Field label={<><span className="hidden lg:inline">Nom</span><span className="lg:hidden">Nom complet</span></>}>
          <input name="name" required minLength={2} autoComplete="name" placeholder="Ex. Fara Rakoto" className="input" />
        </Field>
        <Field label="Prénom" className="hidden lg:block"><input name="surname" autoComplete="given-name" placeholder="Rakoto" className="input" /></Field>
        <Field label="Téléphone" className="lg:col-span-2"><input name="phone" type="tel" required autoComplete="tel" placeholder="+261 34 00 000 00" className="input" /></Field>
        <Field label="Adresse e-mail" className="lg:col-span-2"><input name="email" type="email" required autoComplete="email" placeholder="nom@email.com" className="input" /></Field>
        <Field label="Mot de passe" className="lg:col-span-2"><input name="password" type="password" required minLength={8} autoComplete="new-password" placeholder="8 caractères minimum" className="input" /></Field>
        <div className="lg:col-span-2">
          <span className="field-label mt-3"><span className="hidden lg:inline">Votre profil</span><span className="lg:hidden">Je souhaite utiliser MadaAgri comme</span></span>
          <div className="mt-3 grid grid-cols-2 gap-3 lg:gap-[22px]">{roleButton("buyer", "Acheteur")}{roleButton("producer", "Producteur")}</div>
        </div>
        <label className="flex items-center gap-3 text-[8px] text-muted lg:col-span-2">
          <input type="checkbox" name="terms" required className="size-4 accent-forest" />
          <span>J’accepte les conditions d’utilisation<span className="hidden lg:inline"> et la politique de confidentialité</span>.</span>
        </label>
        <button disabled={busy} className="btn-primary h-[45px] text-[13px] lg:col-span-2">Créer mon compte <Icon name="arrow" className="size-4" /></button>
      </form>
      <p className="mt-8 text-center text-[9px] font-bold text-ink">Déjà inscrit ? <Link to="/connexion" className="text-forest">Se connecter</Link></p>
    </AuthShell>
  );
}

import { useCallback, useEffect, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useStore } from "../store.jsx";
import { post } from "../lib/api.js";
import { maskPhone } from "../lib/format.js";
import AuthShell, { AuthTitle, Field } from "../components/AuthShell.jsx";
import { Icon } from "../components/ui.jsx";

const countdown = (s) => String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");

export default function Verify() {
  const { user, refresh, toast } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [sent, setSent] = useState(null); // { phone, expiresAt, demoCode }
  const [editing, setEditing] = useState(false);
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  const boxes = useRef([]);
  const autoSent = useRef(false);

  const send = useCallback(async (phone) => {
    const result = await post("/phone/send", phone ? { phone } : {});
    setSent({ phone: result.phone, expiresAt: Date.now() + result.expires_in * 1000, demoCode: result.demo_code || "" });
    setDigits(["", "", "", "", "", ""]);
    setEditing(false);
    return result;
  }, []);

  useEffect(() => {
    if (!user || user.phone_verified || !user.phone || autoSent.current) return;
    autoSent.current = true;
    send().catch((error) => toast(error.message));
  }, [user, send, toast]);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  useEffect(() => { if (sent) boxes.current[0]?.focus(); }, [sent]);

  const verify = useCallback(async (code) => {
    setBusy(true);
    try {
      await post("/phone/verify", { code });
      await refresh();
      toast("Numéro vérifié. Bienvenue sur MadaAgri.");
      navigate(location.state?.from || (user.role === "producer" ? "/producteur" : "/"), { replace: true });
    } catch (error) { toast(error.message); setDigits(["", "", "", "", "", ""]); boxes.current[0]?.focus(); }
    setBusy(false);
  }, [refresh, toast, navigate, location.state, user]);

  if (!user) return <Navigate to="/connexion" state={{ from: "/verification" }} replace />;

  const phone = sent?.phone || user.phone || "";
  const remaining = sent ? Math.max(0, Math.round((sent.expiresAt - now) / 1000)) : 0;
  const mode = editing || !phone ? "edit" : user.phone_verified && !sent ? "done" : "code";

  const typeDigit = (index, raw) => {
    const value = raw.replace(/\D/g, "");
    const next = [...digits];
    if (value.length > 1) value.slice(0, 6 - index).split("").forEach((d, i) => { next[index + i] = d; });
    else next[index] = value;
    setDigits(next);
    const target = value.length > 1 ? Math.min(index + value.length, 5) : value ? index + 1 : index;
    boxes.current[target]?.focus();
    if (next.every(Boolean) && !busy) verify(next.join(""));
  };
  const keyDown = (index, event) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      const next = [...digits]; next[index - 1] = ""; setDigits(next); boxes.current[index - 1]?.focus(); event.preventDefault();
    }
  };
  const submitCode = (event) => {
    event.preventDefault();
    const code = digits.join("");
    if (!/^\d{6}$/.test(code)) { toast("Saisissez les 6 chiffres du code."); return; }
    verify(code);
  };
  const submitPhone = async (event) => {
    event.preventDefault();
    setBusy(true);
    try { const r = await send(new FormData(event.currentTarget).get("phone")); toast("Code envoyé au " + r.phone + "."); }
    catch (error) { toast(error.message); }
    setBusy(false);
  };
  const resend = async () => {
    setBusy(true);
    try { await send(); toast("Nouveau code envoyé."); } catch (error) { toast(error.message); }
    setBusy(false);
  };

  const info = (
    <div className="mt-9 rounded-xl bg-soft px-[15px] py-[18px] lg:mt-[52px] lg:px-5 lg:py-[22px]">
      <b className="block text-[8px] text-forest lg:text-[10px]">Votre numéro reste privé<span className="lg:hidden"> et sert au suivi</span>.</b>
      <small className="mt-3.5 block text-[8px] text-muted lg:text-[9px]"><span className="hidden lg:inline">Il sert uniquement à la sécurité et au suivi.</span><span className="lg:hidden">des commandes et à la sécurité du compte.</span></small>
    </div>
  );

  return (
    <AuthShell label="05 / Vérification du compte" kicker="Votre compte, en sécurité" icon="✓"
      title={<>Un dernier pas<br />avant le marché.</>}
      text={<>Nous vérifions votre numéro pour protéger<br />vos commandes et votre espace producteur.</>}>
      {mode === "done" && <>
        <AuthTitle className="lg:mt-[39px]">Numéro vérifié</AuthTitle>
        <p className="mt-2 text-[10px] text-muted">Votre numéro {maskPhone(phone)} est confirmé.</p>
        {info}
        <button onClick={() => navigate(user.role === "producer" ? "/producteur" : "/")} className="btn-primary mt-7 h-[45px] w-full text-[12px]">Continuer vers le marché <Icon name="arrow" className="size-4" /></button>
        <button onClick={() => setEditing(true)} className="mx-auto mt-8 block text-[10px] font-bold text-forest">Modifier mon numéro</button>
      </>}
      {mode === "edit" && <>
        <AuthTitle className="lg:mt-[39px]">Votre numéro de téléphone</AuthTitle>
        <p className="mt-2 text-[10px] text-muted">Nous vous envoyons un code à 6 chiffres pour confirmer votre compte.</p>
        <form onSubmit={submitPhone} className="mt-7 grid gap-6">
          <Field label="Téléphone"><input name="phone" type="tel" required autoComplete="tel" defaultValue={phone} placeholder="+261 34 00 000 00" className="input" /></Field>
          <button disabled={busy} className="btn-primary h-[45px] text-[12px] lg:h-[49px] lg:text-[13px]">Recevoir le code <Icon name="arrow" className="size-4" /></button>
        </form>
        {info}
        <button onClick={() => (phone ? setEditing(false) : navigate("/"))} className="mx-auto mt-8 block text-[10px] font-bold text-forest">{phone ? "← Revenir au code" : "Plus tard"}</button>
      </>}
      {mode === "code" && <>
        <AuthTitle className="lg:mt-[39px]">Vérifiez votre numéro</AuthTitle>
        <p className="mt-2 text-[9px] leading-[17px] text-muted lg:text-[10px] lg:leading-4">
          <span className="hidden lg:inline">Code envoyé au {maskPhone(phone)}</span>
          <span className="lg:hidden">Un code à 6 chiffres a été envoyé au<br /><b className="text-ink">{maskPhone(phone)}.</b></span>
        </p>
        <form onSubmit={submitCode}>
          <div className="mt-7 flex gap-2 lg:mt-[30px] lg:gap-4">
            {digits.map((digit, i) => (
              <input key={i} ref={(el) => { boxes.current[i] = el; }} value={digit} inputMode="numeric" autoComplete={i ? "off" : "one-time-code"}
                maxLength={6} aria-label={`Chiffre ${i + 1} du code`} onChange={(e) => typeDigit(i, e.target.value)} onKeyDown={(e) => keyDown(i, e)}
                className="h-[52px] w-0 min-w-0 flex-1 rounded-[10px] border border-line bg-paper text-center text-[20px] font-extrabold text-forest outline-none focus:border-forest focus:ring-3 focus:ring-leaf lg:h-[72px] lg:w-[68px] lg:flex-none lg:rounded-xl lg:text-[24px]" />
            ))}
          </div>
          <p className="mt-6 flex gap-10 text-[8px] text-muted lg:gap-[26px] lg:text-[9px]">Le code expire dans <b className="text-forest">{countdown(remaining)}</b></p>
          {sent?.demoCode && <p className="mt-2.5 text-[9px] text-warm-ink">Mode démo, aucun SMS envoyé · code : <b className="tracking-[.2em]">{sent.demoCode}</b></p>}
          <button disabled={busy} className="btn-primary mt-6 h-[45px] w-full text-[10px] lg:h-[49px] lg:text-[13px]">Vérifier mon numéro <Icon name="arrow" className="size-4" /></button>
        </form>
        <p className="mt-6 flex flex-col items-center gap-3 text-[9px] text-muted lg:mt-7 lg:block lg:text-center lg:text-[10px] lg:font-bold lg:text-ink">
          <span>Vous n’avez rien reçu ?</span> <button disabled={busy} onClick={resend} className="text-[9px] font-bold text-forest lg:text-[10px]">Renvoyer un code</button>
        </p>
        {info}
        <button onClick={() => setEditing(true)} className="mx-auto mt-[30px] block text-[9px] font-bold text-forest lg:mt-[50px] lg:text-[10px]"><span className="hidden lg:inline">← </span>Modifier mon numéro</button>
      </>}
    </AuthShell>
  );
}

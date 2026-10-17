import { useEffect, useRef } from "react";
import { useStore } from "../store.jsx";

const ICONS = {
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></>,
  heart: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />,
  cart: <path d="M4 7h16l-1.6 10.2a2 2 0 0 1-2 1.8H7.6a2 2 0 0 1-2-1.8L4 7Zm4 0a4 4 0 0 1 8 0" />,
  home: <path d="M4 11.5 12 5l8 6.5V20h-5v-5H9v5H4v-8.5Z" />,
  clock: <><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></>,
  user: <><circle cx="12" cy="9" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></>,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
  back: <path d="M19 12H5m5 5-5-5 5-5" />,
  pin: <><path d="M12 21s-6-5.7-6-11a6 6 0 0 1 12 0c0 5.3-6 11-6 11Z" /><circle cx="12" cy="10" r="2.2" /></>,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  leaf: <path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14Zm0 0 7-7" />,
  shield: <path d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6l-7-3Z" />,
};

export function Icon({ name, className = "size-4", strokeWidth = 1.8 }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}

const PILL_TONES = { warm: "bg-warm text-warm-ink", green: "bg-leaf text-forest", grey: "bg-soft text-muted", white: "bg-paper text-ink" };
export function Pill({ tone = "green", className = "", children }) {
  return <span className={`inline-flex h-[27px] items-center justify-center whitespace-nowrap rounded-full px-3.5 text-[10px] font-bold ${PILL_TONES[tone]} ${className}`}>{children}</span>;
}

export function PageHead({ label, title, mobileTitle, text, mobileText, className = "", children }) {
  return (
    <div className={className}>
      {label && <span className="page-label">{label}</span>}
      <div className="mx-1 flex items-start justify-between gap-4 lg:mx-0">
        <div>
          <h1 className="text-[21px] leading-[27px] font-extrabold lg:text-[29px] lg:leading-9">
            {mobileTitle ? <><span className="hidden lg:inline">{title}</span><span className="lg:hidden">{mobileTitle}</span></> : title}
          </h1>
          {text && (
            <p className="mt-1 text-[9px] leading-[13px] text-muted lg:mt-[5px] lg:text-[11px] lg:leading-4">
              {mobileText ? <><span className="hidden lg:inline">{text}</span><span className="lg:hidden">{mobileText}</span></> : text}
            </p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

export function Kv({ label, children, className = "", valueClass = "" }) {
  return (
    <div className={`flex items-center justify-between gap-3 text-[9px] text-muted ${className}`}>
      <span>{label}</span><b className={`text-right font-bold text-ink ${valueClass}`}>{children}</b>
    </div>
  );
}

export function Modal({ onClose, labelledBy, className = "", children }) {
  const panel = useRef(null);
  useEffect(() => {
    const onKey = (event) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    panel.current?.querySelector("input,select,textarea,button:not([data-close])")?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#101c16a6] p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={panel} role="dialog" aria-modal="true" aria-labelledby={labelledBy}
        className={`relative max-h-[calc(100vh-32px)] w-full max-w-[560px] overflow-auto rounded-2xl bg-paper p-5 shadow-[0_30px_80px_#10201a40] lg:p-7 ${className}`}>
        <button data-close type="button" onClick={onClose} aria-label="Fermer" className="absolute top-3 right-3 grid size-8 place-items-center rounded-full text-ink hover:bg-soft">
          <Icon name="close" />
        </button>
        {children}
      </div>
    </div>
  );
}

// Renders the dialog requested through store.ask().
export function DialogHost() {
  const { dialog, closeDialog } = useStore();
  if (!dialog) return null;
  const submit = (event) => {
    event.preventDefault();
    closeDialog(Object.fromEntries(new FormData(event.currentTarget).entries()));
  };
  return (
    <Modal onClose={() => closeDialog(null)} labelledBy="dialog-title">
      <form onSubmit={submit}>
        <h2 id="dialog-title" className="pr-8 text-[17px] font-bold">{dialog.title}</h2>
        {dialog.message && <p className="mt-2 text-[11px] leading-[17px] text-muted">{dialog.message}</p>}
        <div className="mt-4 grid gap-3">
          {(dialog.fields || []).map((field) => (
            <label key={field.name} className="block">
              <span className="field-label">{field.label}</span>
              {field.type === "textarea" ? (
                <textarea name={field.name} required={field.required} minLength={field.minLength} placeholder={field.placeholder}
                  className="input !h-24 py-2.5" />
              ) : field.type === "select" ? (
                <select name={field.name} required={field.required} defaultValue={field.defaultValue} className="input">
                  {field.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : (
                <input name={field.name} type={field.type || "text"} required={field.required} minLength={field.minLength}
                  min={field.min} max={field.max} placeholder={field.placeholder} defaultValue={field.defaultValue} className="input" />
              )}
            </label>
          ))}
        </div>
        <div className="mt-5 flex justify-end gap-2.5">
          <button type="button" className="btn-outline h-10 px-4 text-[11px]" onClick={() => closeDialog(null)}>Annuler</button>
          <button type="submit" className={`h-10 px-4 text-[11px] ${dialog.danger ? "btn bg-warm-ink text-white" : "btn-primary"}`}>{dialog.confirmLabel || "Valider"}</button>
        </div>
      </form>
    </Modal>
  );
}

export function Toast() {
  const { toastMessage } = useStore();
  return (
    <div role="status" aria-live="polite"
      className={`pointer-events-none fixed bottom-20 left-1/2 z-[60] max-w-[calc(100vw-30px)] -translate-x-1/2 rounded-full bg-forest-deep px-[18px] py-3 text-center text-[11px] font-semibold text-white shadow-pop transition-all duration-200 lg:bottom-7 ${toastMessage ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"}`}>
      {toastMessage}
    </div>
  );
}

export function Empty({ children, className = "" }) {
  return <p className={`py-5 text-[10px] text-muted ${className}`}>{children}</p>;
}

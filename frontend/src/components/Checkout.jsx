import { useStore } from "../store.jsx";
import { money, photo, unitShort } from "../lib/format.js";
import { Icon } from "./ui.jsx";

const STEPS = [["cart", "Panier"], ["delivery", "Livraison"], ["payment", "Paiement"]];

export function CheckoutSteps({ active }) {
  const index = STEPS.findIndex(([id]) => id === active);
  return (
    <ol className="mt-3.5 flex gap-2.5 lg:mt-[22px] lg:gap-3.5" aria-label="Étapes de commande">
      {STEPS.map(([id, label], i) => (
        <li key={id} aria-current={i === index ? "step" : undefined}
          className={`flex h-[27px] items-center rounded-full px-[18px] text-[9px] font-bold lg:px-[30px] lg:text-[10px] ${i === index ? "bg-forest text-white" : i < index ? "bg-leaf text-forest" : "border border-line bg-paper text-ink"}`}>
          {i < index ? "✓ " : ""}{i + 1} {label}
        </li>
      ))}
    </ol>
  );
}

// Right-hand summary of screens 07–09.
export function OrderSummary({ title, deliveryLabel, total, totalLabel = "Total connu", action, actionOutside, note, detailed = false, className = "" }) {
  const { cartLines, cartTotal, serviceFee } = useStore();
  return (
    <aside className={`hidden lg:block ${className}`}>
      <div className="rounded-2xl border border-line bg-paper px-[29px] pt-[25px] pb-[30px]">
        <h2 className="text-[17px] font-[750]">{title}</h2>
        <div className="mt-[18px] grid gap-[9px]">
          {cartLines.map(({ product, quantity }) => (
            <div key={product.id} className="grid grid-cols-[55px_1fr_auto] items-center gap-[13px]">
              <img src={photo(product.image)} alt="" className="size-[55px] rounded-[10px] object-cover" />
              <span className="text-[10px] font-bold">{product.name}{detailed ? "" : ` · ${quantity} ${unitShort(product.unit)}`}
                {detailed && <small className="mt-[7px] block text-[9px] font-normal text-muted">{quantity} {unitShort(product.unit)}</small>}</span>
              <b className="text-[9px]">{money(product.price * quantity)}</b>
            </div>
          ))}
        </div>
        <div className="mt-[18px] grid gap-[18px] border-t border-line pt-[22px] text-[9px] text-muted">
          <div className="flex justify-between"><span>Sous-total</span><b className="text-ink">{money(cartTotal)}</b></div>
          {serviceFee > 0 && <div className="flex justify-between"><span>Frais de service</span><b className="text-ink">{money(serviceFee)}</b></div>}
          <div className="flex justify-between"><span>Livraison</span><span className="text-forest">{deliveryLabel}</span></div>
        </div>
        <div className="mt-[18px] flex items-center justify-between border-t border-line pt-[22px]">
          <b className="text-[11px]">{totalLabel}</b><b className="text-[15px] font-extrabold text-forest">{money(total ?? cartTotal + serviceFee)}</b>
        </div>
        {action && <div className="mt-[22px]">{action}</div>}
      </div>
      {actionOutside && <div className="mt-[19px]">{actionOutside}</div>}
      {note && <p className="mt-3 text-center text-[8px] leading-[14px] text-muted">{note}</p>}
    </aside>
  );
}

export function PrimaryAction({ children, ...props }) {
  return <button {...props} className="btn-primary h-[46px] w-full text-[10px] lg:h-[49px] lg:text-[11px]">{children} <Icon name="arrow" className="size-4" /></button>;
}

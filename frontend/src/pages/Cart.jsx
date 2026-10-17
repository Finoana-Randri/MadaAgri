import { Link, useNavigate } from "react-router-dom";
import { useStore } from "../store.jsx";
import { money, photo, unitShort } from "../lib/format.js";
import { CheckoutSteps, OrderSummary, PrimaryAction } from "../components/Checkout.jsx";
import { Icon, PageHead } from "../components/ui.jsx";

export default function Cart() {
  const { cartLines, cartTotal, serviceFee, setQuantity, removeFromCart, user } = useStore();
  const navigate = useNavigate();
  const next = () => navigate(user ? "/livraison" : "/connexion", user ? undefined : { state: { from: "/livraison" } });
  const count = cartLines.length;

  return (
    <div className="page">
      <PageHead label="07 / Panier" title="Votre panier"
        text={count ? `${count} produit${count > 1 ? "s" : ""} de producteurs locaux` : "Votre panier attend ses bons produits."} />
      <CheckoutSteps active="cart" />
      {!count ? (
        <div className="card mt-6 p-6 text-center lg:mt-[22px]">
          <p className="text-[11px] text-muted">Aucun produit pour le moment.</p>
          <Link to="/" className="btn-primary mx-auto mt-4 h-10 w-fit px-5 text-[11px]">Explorer le marché <Icon name="arrow" className="size-4" /></Link>
        </div>
      ) : (
        <div className="mt-4 lg:mt-[22px] lg:grid lg:grid-cols-[minmax(0,810px)_minmax(0,442px)] lg:items-start lg:gap-11">
          <div className="grid gap-3.5 lg:gap-[18px]">
            {cartLines.map(({ product, quantity }) => (
              <article key={product.id} className="relative grid grid-cols-[86px_1fr] gap-3 rounded-2xl border border-line bg-paper p-[11px] lg:grid-cols-[126px_1fr] lg:gap-6 lg:p-[15px]">
                <Link to={`/produit/${product.id}`}><img src={photo(product.image)} alt={product.name} className="size-[86px] rounded-xl object-cover lg:size-[126px]" /></Link>
                <div className="min-w-0 pt-1 lg:pt-6">
                  <h3 className="pr-14 text-[11px] font-bold lg:text-[16px]">{product.name}</h3>
                  <p className="mt-1.5 text-[8px] text-muted lg:mt-3 lg:text-[9px]">{product.producer_name}</p>
                  <p className="mt-2 text-[9px] font-bold lg:mt-6 lg:text-[10px]">{money(product.price)} / {product.unit}</p>
                  <div className="mt-2 flex h-8 w-[118px] items-center justify-between rounded-[10px] border border-line px-3 lg:absolute lg:top-[83px] lg:right-[80px] lg:mt-0 lg:h-[42px] lg:w-[144px] lg:px-[17px]">
                    <button onClick={() => setQuantity(product.id, quantity - 1)} aria-label="Diminuer la quantité"><Icon name="minus" className="size-3" /></button>
                    <span className="text-[9px] font-semibold">{quantity} {unitShort(product.unit)}</span>
                    <button onClick={() => setQuantity(product.id, quantity + 1)} aria-label="Augmenter la quantité"><Icon name="plus" className="size-3" /></button>
                  </div>
                </div>
                <b className="absolute right-[13px] bottom-[15px] text-[10px] lg:hidden">{money(product.price * quantity)}</b>
                <button onClick={() => removeFromCart(product.id)} className="absolute top-[13px] right-[13px] text-[8px] font-semibold text-warm-ink lg:top-[25px] lg:right-[30px] lg:text-[9px]">Retirer</button>
              </article>
            ))}
          </div>
          <OrderSummary title="Résumé de la commande" detailed deliveryLabel="À confirmer" note="Frais éventuels confirmés avec le producteur avant votre engagement."
            action={<PrimaryAction onClick={next}>Choisir la livraison</PrimaryAction>} />
          <div className="mt-5 grid gap-4 lg:hidden">
            <div className="rounded-2xl bg-soft p-4 text-[9px]">
              <div className="flex justify-between text-muted"><span>Livraison</span><b className="text-ink">À confirmer</b></div>
              <div className="mt-3 flex justify-between font-bold"><span>Total connu</span><b className="text-[13px] text-forest">{money(cartTotal + serviceFee)}</b></div>
            </div>
            <PrimaryAction onClick={next}>Choisir la livraison</PrimaryAction>
          </div>
        </div>
      )}
    </div>
  );
}

const state = { products: [], user: null, notifications: [], catalogConfig:{categories:["Légumes","Fruits","Riz & céréales","Feuilles & herbes","Épices","Autres"],units:["kg","botte","régime","sac de 5 kg"],zones:["Antananarivo","Antsirabe","Fianarantsoa","Mahajanga","Analamanga"],service_fee:0}, view: "home", category: "Tout", search: "", sort: "season", cart: readCart(), orders: [], producerProducts: [], admin: null, registerRole: "buyer", checkoutStep: "delivery", checkoutData: {delivery_method:"delivery", delivery_address:stored("madaagri-address",""), note:"", payment_method:"at_delivery", payment_phone:""}, lastOrder: null, selectedProductId: null, productQuantity: 1, selectedOrderId: null };
const app = document.getElementById("app");
const modalRoot = document.getElementById("modal-root");
const volatileStorage = {};

function readCart() { return stored("madaagri-cart",[]); }
function stored(key, fallback) {
  try { if (typeof localStorage !== "undefined") { const value=localStorage.getItem(key); return value ? JSON.parse(value) : fallback; } } catch (_) {}
  try { return Object.prototype.hasOwnProperty.call(volatileStorage,key) ? JSON.parse(volatileStorage[key]) : fallback; } catch (_) { return fallback; }
}
function persist(key, value) {
  const encoded=JSON.stringify(value);
  try { if (typeof localStorage !== "undefined") { localStorage.setItem(key,encoded); return; } } catch (_) {}
  volatileStorage[key]=encoded;
}
const SAMPLE_PRODUCTS = [
  {id:1,producer_id:2,producer_name:"Ferme Rakoto",name:"Tomates bien mûres",category:"Légumes",price:3500,unit:"kg",stock:24,region:"Antsirabe",image:"tomates.png",description:"Récoltées à maturité, en agriculture familiale.",rating:4.9,status:"published",min_qty:1},
  {id:2,producer_id:4,producer_name:"Coopérative Vary Tsara",name:"Riz rouge de Madagascar",category:"Riz & céréales",price:12000,unit:"sac de 5 kg",stock:38,region:"Fianarantsoa",image:"riz-rouge.png",description:"Riz rouge parfumé, trié et conditionné par la coopérative.",rating:4.8,status:"published",min_qty:1},
  {id:3,producer_id:5,producer_name:"Potager de Lalao",name:"Brèdes mafana",category:"Feuilles & herbes",price:2000,unit:"botte",stock:18,region:"Analamanga",image:"bredes-mafana.png",description:"Feuilles fraîches cueillies le matin même.",rating:5,status:"published",min_qty:1},
  {id:4,producer_id:6,producer_name:"Ferme Soa",name:"Bananes mûres",category:"Fruits",price:4000,unit:"régime",stock:16,region:"Mahajanga",image:"bananes.png",description:"Bananes locales, mûries naturellement.",rating:4.7,status:"published",min_qty:1},
  {id:5,producer_id:2,producer_name:"Ferme Rakoto",name:"Aubergines du jardin",category:"Légumes",price:2500,unit:"kg",stock:12,region:"Antsirabe",image:"aubergines-piments.png",description:"Petite récolte de saison, cultivée sans intermédiaire.",rating:4.8,status:"published",min_qty:1},
  {id:6,producer_id:5,producer_name:"Potager de Lalao",name:"Piments rouges",category:"Légumes",price:3000,unit:"kg",stock:9,region:"Antananarivo",image:"aubergines-piments.png",description:"Piments frais au goût fruité et relevé.",rating:4.6,status:"published",min_qty:1}
];
function offlineUsers() {
  return stored("madaagri-demo-users",[
    {id:1,name:"Acheteur Démo",email:"acheteur@madaagri.test",phone:"",role:"buyer",verified:0,password:"acheteur123"},
    {id:2,name:"Mamy Rakoto",email:"producteur@madaagri.test",phone:"",role:"producer",verified:1,password:"producteur123"},
    {id:3,name:"Admin MadaAgri",email:"admin@madaagri.test",phone:"",role:"admin",verified:1,password:"admin123"},
    {id:4,name:"Coopérative Vary Tsara",email:"coop@madaagri.test",phone:"",role:"producer",verified:1,password:"coop12345"},
    {id:5,name:"Lalao Raveloson",email:"lalao@madaagri.test",phone:"",role:"producer",verified:1,password:"lalao12345"},
    {id:6,name:"Soa Randria",email:"soa@madaagri.test",phone:"",role:"producer",verified:1,password:"fermesoa123"}
  ]);
}
function offlineProducts() { return stored("madaagri-demo-products",SAMPLE_PRODUCTS); }
function offlineOrders() { return stored("madaagri-demo-orders",[]); }
async function offlineApi(path, options) {
  options=options||{}; const method=options.method||"GET", body=options.body||{};
  const users=offlineUsers(), products=offlineProducts(), orders=offlineOrders();
  let current=stored("madaagri-demo-user",null);
  if(path==="/bootstrap") return {products:products.filter(function(p){return p.status==="published";}),user:current,notifications:[]};
  if(path==="/register") {
    if(users.some(function(u){return u.email===body.email;})) throw new Error("Cette adresse e-mail est déjà utilisée.");
    const user={id:Math.max(3,...users.map(function(u){return u.id;}))+1,name:body.name,email:body.email,phone:body.phone||"",role:body.role,verified:0,password:body.password};
    users.push(user); persist("madaagri-demo-users",users); current={id:user.id,name:user.name,email:user.email,phone:user.phone,role:user.role,verified:user.verified}; persist("madaagri-demo-user",current); return {ok:true,user:current};
  }
  if(path==="/login") {
    const found=users.find(function(u){return u.email===body.email&&u.password===body.password;});
    if(!found) throw new Error("Adresse e-mail ou mot de passe incorrect.");
    current={id:found.id,name:found.name,email:found.email,phone:found.phone||"",role:found.role,verified:found.verified}; persist("madaagri-demo-user",current); return {ok:true,user:current};
  }
  if(path==="/password-reset/request") {
    const found=users.find(function(u){return u.email===String(body.email||"").toLowerCase();});
    if(!found)return {ok:true,message:"Si le compte existe, une instruction de réinitialisation sera affichée."};
    const token=Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2);
    persist("madaagri-demo-reset",{email:found.email,token:token,expires:Date.now()+1800000});
    return {ok:true,demo_token:token,message:"Code de démonstration valable 30 minutes."};
  }
  if(path==="/password-reset/confirm") {
    const reset=stored("madaagri-demo-reset",null);
    if(!reset||reset.token!==body.token||reset.expires<Date.now()||String(body.password||"").length<8)throw new Error("Code invalide ou expiré, ou mot de passe trop court.");
    const found=users.find(function(u){return u.email===reset.email;}); if(!found)throw new Error("Compte introuvable.");
    found.password=body.password; persist("madaagri-demo-users",users);
    try { if(typeof localStorage!=="undefined")localStorage.removeItem("madaagri-demo-reset"); } catch (_) {}
    delete volatileStorage["madaagri-demo-reset"]; return {ok:true};
  }
  if(path==="/logout") { localStorage.removeItem("madaagri-demo-user"); return {ok:true}; }
  if(path==="/orders" && method==="GET") {
    if(!current) throw new Error("Connectez-vous.");
    const visible=current.role==="admin" ? orders : current.role==="producer" ? orders.filter(function(o){return o.producer_id===current.id;}) : orders.filter(function(o){return o.buyer_id===current.id;});
    return {orders:visible.map(function(o){const buyer=users.find(function(u){return u.id===o.buyer_id;});return Object.assign({},o,{buyer_name:buyer?buyer.name:"Acheteur"});}).reverse()};
  }
  if(path==="/producer/products") {
    if(!current||!["producer","admin"].includes(current.role)) throw new Error("Accès réservé aux producteurs.");
    return {products:products.filter(function(p){return current.role==="admin"||p.producer_id===current.id;})};
  }
  if(path==="/admin") {
    if(!current||current.role!=="admin") throw new Error("Accès réservé.");
    const claims=stored("madaagri-demo-claims",[]);
    return {users:users,products:products,claims:claims,metrics:{orders:orders.length,pending_products:products.filter(function(p){return p.status==="pending";}).length,open_claims:claims.filter(function(c){return c.status==="open";}).length}};
  }
  if(path==="/orders"&&method==="POST") {
    if(!current) throw new Error("Connectez-vous pour continuer.");
    const lines=(body.items||[]).map(function(line){const p=products.find(function(x){return x.id===Number(line.product_id)&&x.status==="published";});if(!p||line.quantity>p.stock)throw new Error("Stock ou quantité indisponible.");return {product:p,quantity:Number(line.quantity)};});
    if(!lines.length) throw new Error("Votre panier est vide.");
    const sellers=Array.from(new Set(lines.map(function(line){return line.product.producer_name;})));
    if(sellers.length>1) throw new Error("Une commande regroupe les produits d'un seul producteur.");
    if(body.delivery_method==="delivery"&&String(body.delivery_address||"").trim().length<5) throw new Error("Indiquez votre quartier ou adresse de livraison.");
    const subtotal=lines.reduce(function(sum,line){return sum+line.product.price*line.quantity;},0);
    const code="MAD-"+new Date().toISOString().slice(2,10).replaceAll("-","")+"-"+Math.random().toString(16).slice(2,8).toUpperCase();
    const order={id:Date.now(),code:code,buyer_id:current.id,producer_id:lines[0].product.producer_id,producer_name:sellers[0],status:"pending_confirmation",payment_status:"pending",payment_method:"at_delivery",delivery_method:body.delivery_method,delivery_address:body.delivery_address||"",note:body.note||"",subtotal:subtotal,delivery_fee:null,created_at:new Date().toLocaleString("fr-FR"),items:lines.map(function(line){return {product_id:line.product.id,name:line.product.name,unit:line.product.unit,price:line.product.price,quantity:line.quantity};})};
    orders.push(order); persist("madaagri-demo-orders",orders); return {ok:true,code:code,status:order.status,payment_status:"pending",subtotal:subtotal};
  }
  if(path==="/products"&&method==="POST") {
    if(!current||current.role!=="producer") throw new Error("Accès réservé aux producteurs.");
    if(!current.verified) throw new Error("Votre compte producteur attend sa vérification par l'administration.");
    const product={id:Math.max(0,...products.map(function(p){return p.id;}))+1,producer_id:current.id,producer_name:current.name,name:body.name,category:body.category,price:Number(body.price),unit:body.unit,stock:Number(body.stock),region:body.region,image:body.image,description:body.description||"",rating:0,status:"pending",min_qty:1};
    products.push(product); persist("madaagri-demo-products",products); return {ok:true};
  }
  let parts=path.split("/");
  if(parts.length===4&&parts[1]==="orders"&&parts[3]==="status"&&method==="POST") {
    const order=orders.find(function(o){return o.id===Number(parts[2]);});
    if(!current||!order||(current.role==="producer"&&order.producer_id!==current.id)||!["producer","admin"].includes(current.role)) throw new Error("Commande introuvable ou accès réservé.");
    if(body.status==="accepted") {
      for(const item of order.items) { const product=products.find(function(p){return p.id===item.product_id;}); if(product&&product.stock<item.quantity)throw new Error("Le stock a changé. Vérifiez la disponibilité avant de confirmer."); }
      for(const item of order.items) { const product=products.find(function(p){return p.id===item.product_id;}); if(product)product.stock-=item.quantity; }
      persist("madaagri-demo-products",products);
    }
    if(body.status==="cancelled"&&["accepted","preparing"].includes(order.status)) {
      for(const item of order.items) { const product=products.find(function(p){return p.id===item.product_id;}); if(product)product.stock+=item.quantity; }
      persist("madaagri-demo-products",products);
    }
    order.status=body.status; persist("madaagri-demo-orders",orders); return {ok:true,status:order.status};
  }
  parts=path.split("/");
  if(parts.length===4&&parts[1]==="products"&&parts[3]==="moderate"&&method==="POST") {
    if(!current||current.role!=="admin") throw new Error("Accès réservé.");
    const product=products.find(function(p){return p.id===Number(parts[2]);}); if(!product)throw new Error("Produit introuvable.");
    product.status=body.status; persist("madaagri-demo-products",products); return {ok:true};
  }
  parts=path.split("/");
  if(parts.length===4&&parts[1]==="users"&&parts[3]==="verify"&&method==="POST") {
    if(!current||current.role!=="admin") throw new Error("Accès réservé.");
    const user=users.find(function(u){return u.id===Number(parts[2])&&u.role==="producer";}); if(user)user.verified=body.verified?1:0;
    persist("madaagri-demo-users",users); return {ok:true};
  }
  if(path==="/claims"&&method==="POST") {
    if(!current)throw new Error("Connectez-vous.");
    const order=orders.find(function(o){return o.code===body.order_code&&o.buyer_id===current.id&&o.status==="delivered";});
    if(!order)throw new Error("Une réclamation est possible après une commande livrée.");
    const claims=stored("madaagri-demo-claims",[]); claims.push({id:Date.now(),order_id:order.id,buyer_id:current.id,reason:body.reason,details:body.details,status:"open",code:order.code}); persist("madaagri-demo-claims",claims);return {ok:true};
  }
  if(path==="/reviews"&&method==="POST") {
    if(!current)throw new Error("Connectez-vous.");
    const order=orders.find(function(o){return o.code===body.order_code&&o.buyer_id===current.id&&o.status==="delivered";});
    if(!order)throw new Error("L'avis est disponible après livraison.");
    const reviews=stored("madaagri-demo-reviews",[]); if(reviews.some(function(r){return r.order_id===order.id;}))throw new Error("Vous avez déjà évalué cette commande.");
    reviews.push({order_id:order.id,rating:body.rating,comment:body.comment}); persist("madaagri-demo-reviews",reviews);return {ok:true};
  }
  throw new Error("Action indisponible en mode aperçu.");
}
function saveCart() { localStorage.setItem("madaagri-cart", JSON.stringify(state.cart)); updateCartCount(); }
function money(amount) { return new Intl.NumberFormat("fr-FR").format(amount || 0) + " Ar"; }
function esc(value) { return String(value == null ? "" : value).replace(/[&<>"']/g, function(c) { return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]; }); }
const WEBP_PHOTOS = new Map([
  ["tomates.png", "tomates.webp"],
  ["riz-rouge.png", "riz-rouge.webp"],
  ["bredes-mafana.png", "bredes-mafana.webp"],
  ["bananes.png", "bananes.webp"],
  ["aubergines-piments.png", "aubergines-piments.webp"],
  ["hero-marche.png", "hero-marche.webp"]
]);
function photo(name) {
  const filename = name || "tomates.png";
  return "/assets/product-photos/" + encodeURIComponent(WEBP_PHOTOS.get(filename) || filename);
}
function toast(message) {
  const box = document.getElementById("toast");
  box.textContent = message; box.classList.add("show");
  clearTimeout(toast.timer); toast.timer = setTimeout(function() { box.classList.remove("show"); }, 2600);
}
async function api(path, options) {
  options = options || {};
  if (typeof window.fetch !== "function") return offlineApi(path, options);
  const response = await fetch("/?__mada=" + encodeURIComponent(path.slice(1)), {
    method: options.method || "GET",
    headers: options.body ? {"Content-Type":"application/json"} : {},
    body: options.body ? JSON.stringify(options.body) : undefined,
    credentials: "same-origin"
  });
  const data = await response.json().catch(function() { return {}; });
  if (!response.ok) throw new Error(data.error || "Une erreur est survenue.");
  return data;
}
async function refresh() {
  try {
    const data = await api("/bootstrap");
    state.products = data.products || [];
    state.user = data.user || null;
    state.notifications = data.notifications || [];
    state.catalogConfig = data.catalog_config || state.catalogConfig;
    updateCartCount();
    await go(state.view);
  } catch (error) {
    app.innerHTML = '<div class="content-page"><div class="panel">Impossible de charger le marché : ' + esc(error.message) + '</div></div>';
  }
}
function updateCartCount() {
  const count = state.cart.reduce(function(sum, item) { return sum + item.quantity; }, 0);
  const badge = document.getElementById("cart-count"); if (badge) badge.textContent = String(count);
}
function cartTotal() {
  return state.cart.reduce(function(sum, item) {
    const product = state.products.find(function(p) { return p.id === item.product_id; });
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);
}
function serviceFee(){return Number(state.catalogConfig.service_fee)||0;}
function knownTotal(){return cartTotal()+serviceFee();}
function addToCart(productId, quantity) {
  const product = state.products.find(function(p) { return p.id === Number(productId); });
  if (!product) return;
  const existingProducer = state.cart.length ? state.products.find(function(p) { return p.id === state.cart[0].product_id; }) : null;
  if (existingProducer && existingProducer.producer_name !== product.producer_name) {
    toast("Une commande regroupe les produits d'un seul producteur. Videz le panier pour changer.");
    return;
  }
  const line = state.cart.find(function(item) { return item.product_id === product.id; });
  if (line) line.quantity = Math.min(product.stock, line.quantity + (quantity || 1));
  else state.cart.push({product_id: product.id, quantity: Math.min(product.stock, quantity || 1)});
  saveCart(); toast(product.name + " ajouté au panier.");
}
function productCard(product) {
  return '<article class="product-card">' +
    '<span class="product-tag">✳ ' + esc(product.stock < 10 ? "Petite récolte" : "Produit local") + '</span>' +
    '<button class="product-heart" aria-label="Voir ' + esc(product.name) + '" data-open="' + product.id + '">♡</button>' +
    '<img class="product-image" src="' + photo(product.image) + '" alt="' + esc(product.name) + '" width="900" height="900" loading="lazy" decoding="async" data-open="' + product.id + '">' +
    '<div class="product-body"><span class="product-category">' + esc(product.category) + '</span>' +
    '<h3 data-open="' + product.id + '">' + esc(product.name) + '</h3>' +
    '<div class="producer-line"><span class="producer-desktop">' + esc(product.producer_name) + ' · ' + esc(product.region) + '</span><span class="producer-mobile">Producteur vérifié · Madagascar</span></div>' +
    '<div class="product-price-row"><span class="product-price">' + money(product.price) + '</span><span class="unit">/ ' + esc(product.unit) + '</span></div>' +
    '<div class="card-bottom"><span class="rating"><span>★</span> ' + Number(product.rating || 4.7).toFixed(1).replace(".", ",") + ' · <span class="rating-note">Producteur vérifié</span></span>' +
    '<button class="add-button" data-add="' + product.id + '" aria-label="Ajouter au panier">+</button></div></div></article>';
}
function renderHome() {
  const categories = ["Tout", ...(state.catalogConfig.categories||[]).filter(category=>category!=="Autres"||state.products.some(p=>p.category==="Autres"))];
  let shown = state.products.filter(function(p) {
    const matchCategory = state.category === "Tout" || p.category === state.category;
    const term = state.search.trim().toLowerCase();
    const matchText = !term || [p.name,p.category,p.region,p.producer_name].join(" ").toLowerCase().includes(term);
    return matchCategory && matchText;
  });
  if (state.sort === "price-up") shown.sort(function(a,b) { return a.price-b.price; });
  if (state.sort === "price-down") shown.sort(function(a,b) { return b.price-a.price; });
  if (state.sort === "rating") shown.sort(function(a,b) { return b.rating-a.rating; });
  app.innerHTML = '<section class="hero-wrap"><div class="page-label">01 / Marché</div><div class="hero">' +
    '<img class="hero-photo" src="' + photo("hero-marche.png") + '" alt="Marché de produits frais à Madagascar" width="1536" height="1024" loading="eager" fetchpriority="high" decoding="async">' +
    '<div class="hero-copy"><span class="eyebrow"><span class="eyebrow-desktop">Le goût du terroir, près de chez vous</span><span class="eyebrow-mobile">Du champ à votre table</span></span>' +
    '<h1>Les bons produits,<br>directement du producteur.</h1>' +
    '<p><span class="hero-description-desktop">Découvrez les récoltes de producteurs malgaches et commandez simplement.</span><span class="hero-description-mobile">Les récoltes de nos régions, près de chez vous.</span></p>' +
    '<div class="hero-action"><button class="button light" data-scroll-products>Explorer le marché <span>→</span></button></div>' +
    '</div></div></section>' +
    '<section id="marche" class="market-content"><div class="category-block"><h2>Choisir par catégorie</h2><div class="category-row">' + categories.map(function(category) { return '<button class="chip ' + (state.category === category ? "active" : "") + '" data-category="' + esc(category) + '">' + esc(category === "Tout" ? "Tout voir" : category === "Feuilles & herbes" ? "Feuilles" : category) + '</button>'; }).join("") + '</div></div>' +
    '<div class="intro-row"><div><span class="section-kicker">Produits de saison</span><h2><span class="desktop-copy">Les récoltes du moment</span><span class="mobile-copy">Récoltes du moment</span></h2></div><button class="text-button" data-action="show-all"><span class="desktop-copy">Voir tout</span><span class="mobile-copy">Tout voir</span> <span>→</span></button></div>' +
    '<div class="market-tools"><label class="search-box"><span>⌕</span><input id="search-input" value="' + esc(state.search) + '" placeholder="Un produit, une région, un producteur…"></label>' +
    '<select class="sort-select" id="sort-select" aria-label="Trier les produits"><option value="season"' + (state.sort==="season"?" selected":"") + '>De saison</option><option value="price-up"' + (state.sort==="price-up"?" selected":"") + '>Prix croissant</option><option value="price-down"' + (state.sort==="price-down"?" selected":"") + '>Prix décroissant</option><option value="rating"' + (state.sort==="rating"?" selected":"") + '>Mieux notés</option></select></div>' +
    '<div class="product-grid">' + (shown.length ? shown.map(productCard).join("") : '<div class="market-empty">Aucun produit ne correspond. Essayez une autre recherche.</div>') + '</div></section>' +
    '<section class="trust-strip" id="comment-ca-marche"><div class="trust-item"><div class="trust-icon">✳</div><div><b>Des producteurs connus</b><span>Chaque récolte a un visage et une région.</span></div></div><div class="trust-item"><div class="trust-icon">↗</div><div><b>Des prix sans surprise</b><span>Le total produits est visible avant validation.</span></div></div><div class="trust-item"><div class="trust-icon">♡</div><div><b>Une agriculture vivante</b><span>Votre achat soutient l’économie locale.</span></div></div></section>';
  setActiveNav("home"); mountMobileNav();
}
function setActiveNav(view) {
  document.querySelectorAll(".desktop-nav .nav-link").forEach(function(link) {
    const target = link.dataset.nav;
    link.classList.toggle("active", Boolean(target) && (target === view || (view === "home" && target === "home")));
  });
}
function mountMobileNav() {
  const previous = document.querySelector(".mobile-nav"); if (previous) previous.remove();
  const nav = document.createElement("nav"); nav.className = "mobile-nav"; nav.setAttribute("aria-label","Navigation mobile");
  nav.innerHTML = '<button data-nav="home"><span>⌂</span>Accueil</button><button data-action="focus-search" aria-label="Rechercher dans le marché"><span>⌕</span>Marché</button><button data-action="cart"><span>▱</span>Panier</button><button data-nav="orders"><span>◷</span>Commandes</button><button data-action="account"><span>◉</span>Compte</button>';
  document.body.appendChild(nav);
}
function renderCart() {
  const lines = state.cart.map(function(item) {
    const p = state.products.find(function(product) { return product.id === item.product_id; });
    if (!p) return "";
    return '<div class="cart-line"><img src="' + photo(p.image) + '" alt=""><div class="cart-line-info"><h3>' + esc(p.name) + '</h3><span class="cart-producer">' + esc(p.producer_name) + '</span><span class="cart-unit-price">' + money(p.price) + ' / ' + esc(p.unit) + '</span><div class="quantity"><button data-qty="' + p.id + '" data-delta="-1">−</button><span>' + item.quantity + ' ' + esc(p.unit.split(' ')[0]) + '</span><button data-qty="' + p.id + '" data-delta="1">+</button></div></div><div class="cart-line-end"><b>' + money(p.price * item.quantity) + '</b><button class="remove-line" data-remove="' + p.id + '">Retirer</button></div></div>';
  }).join("");
  const summaryProducts = state.cart.map(function(item) { const p = state.products.find(function(product) { return product.id === item.product_id; }); return p ? '<div class="summary-product"><img src="'+photo(p.image)+'" alt=""><span>'+esc(p.name)+'<small>'+item.quantity+' '+esc(p.unit.split(' ')[0])+'</small></span><b>'+money(p.price*item.quantity)+'</b></div>' : ''; }).join('');
  app.innerHTML = '<section class="content-page checkout-page cart-page"><div class="page-label">07 / Panier</div><div class="page-head"><h1>Votre panier</h1><p>' + (state.cart.length ? state.cart.length + ' produits de producteurs locaux' : "Votre panier attend ses bons produits.") + '</p></div>' + renderCheckoutSteps("cart") +
    (state.cart.length ? '<div class="cart-layout checkout-layout"><div class="panel cart-items">' + lines + '</div><aside class="summary-card"><h2>Résumé de la commande</h2><div class="cart-summary-products">'+summaryProducts+'</div><div class="summary-row"><span>Sous-total</span><b>' + money(cartTotal()) + '</b></div>'+(serviceFee()?'<div class="summary-row"><span>Frais de service</span><b>'+money(serviceFee())+'</b></div>':'')+'<div class="summary-row"><span>Livraison</span><span>À confirmer</span></div><div class="summary-row total"><span>Total connu</span><b>' + money(knownTotal()) + '</b></div><button class="button" data-nav="checkout">Choisir la livraison <span>→</span></button><p class="fine-print">Frais éventuels confirmés avec le producteur avant votre engagement.</p></aside></div>' :
    '<div class="panel empty-cart"><p class="fine-print">Explorez la récolte du moment et ajoutez les produits qui vous font envie.</p><button class="button" data-nav="home">Découvrir le marché</button></div>') + '</section>';
  setActiveNav(""); mountMobileNav();
}
function renderProductPage() {
  const product = state.products.find(function(item){return item.id===Number(state.selectedProductId);});
  if(!product){state.view="home";return renderHome();}
  state.productQuantity=Math.max(1,Math.min(product.stock,state.productQuantity||1));
  app.innerHTML='<section class="content-page product-page"><div class="page-label">06 / Fiche produit</div><button class="back-link" data-nav="home">Marché &nbsp; / &nbsp; '+esc(product.category)+' &nbsp; / &nbsp; '+esc(product.name)+'</button><div class="product-detail-grid"><div class="product-gallery"><img class="product-main-image" src="'+photo(product.image)+'" alt="'+esc(product.name)+'"><span class="product-harvest-badge">Récolté ce matin</span><div class="product-thumbnails"><img src="'+photo(product.image)+'" alt=""><img src="'+photo(product.image)+'" alt=""><img src="'+photo(product.image)+'" alt=""></div></div><div class="product-detail"><span class="product-category"><span class="desktop-copy">MARCHÉ LOCAL / </span>'+esc(product.category)+' / '+esc(product.region)+'</span><h1>'+esc(product.name)+'</h1><p class="product-producer">'+esc(product.producer_name)+' · '+esc(product.region)+'</p><div class="detail-rating"><span>★</span> '+Number(product.rating||4.7).toFixed(1).replace(".",",")+' · Producteur vérifié</div><div class="detail-price">'+money(product.price)+' <small>/ '+esc(product.unit)+'</small></div><div class="availability">'+esc(product.stock)+' '+esc(product.unit)+' disponibles</div><p class="detail-description">'+esc(product.description)+'<span>Une récolte locale, fraîche et soigneusement triée.</span></p><div class="detail-origin"><span>✳</span><div><b>Cultivé avec soin à Madagascar</b><small>Découvrez l’origine de votre récolte, vendue sans intermédiaire.</small></div></div><div class="detail-quantity-label">Quantité</div><div class="detail-buy-row"><div class="quantity"><button data-detail-qty="-1" aria-label="Diminuer la quantité">−</button><span>'+state.productQuantity+' '+esc(product.unit)+'</span><button data-detail-qty="1" aria-label="Augmenter la quantité">+</button></div><button class="button" data-add="'+product.id+'" data-quantity="'+state.productQuantity+'">Ajouter au panier <span>→</span></button></div><p class="fine-print">✓ Producteur vérifié <span class="desktop-copy">· Livraison à domicile ou retrait</span><span class="mobile-copy"> · Livraison ou retrait</span><span class="desktop-copy fx-delivery-note">Frais de livraison confirmés avant votre engagement.</span></p></div></div></section>';
  setActiveNav("home");mountMobileNav();
}
function renderCheckoutSteps(active) {
  const steps = [{id:"cart",label:"1 Panier"},{id:"delivery",label:"2 Livraison"},{id:"payment",label:"3 Paiement"}];
  const activeIndex = steps.findIndex(function(step){return step.id===active;});
  return '<div class="checkout-steps" aria-label="Étapes de commande">' + steps.map(function(step,index){return '<span class="checkout-step ' + (step.id===active?'active':index<activeIndex?'complete':'') + '">' + (index<activeIndex?'✓ ':'') + step.label + '</span>';}).join("") + '</div>';
}
function checkoutSummary(title,buttonText,buttonAttrs) {
  const items = state.cart.map(function(item) { const p=state.products.find(function(x){return x.id===item.product_id;}); return p?'<div class="summary-product"><img src="'+photo(p.image)+'" alt=""><span>'+esc(p.name)+' · '+item.quantity+' '+esc(p.unit.split(' ')[0])+'</span><b>'+money(p.price*item.quantity)+'</b></div>':""; }).join("");
  const delivery = state.checkoutData.delivery_method === "pickup" ? "Retrait gratuit" : "Frais à confirmer";
  return '<aside class="summary-card"><h2>'+title+'</h2>'+items+'<div class="summary-row"><span>Sous-total</span><b>'+money(cartTotal())+'</b></div>'+(serviceFee()?'<div class="summary-row"><span>Frais de service</span><b>'+money(serviceFee())+'</b></div>':'')+'<div class="summary-row"><span>Livraison</span><span>'+delivery+'</span></div><div class="summary-row total"><span>Total connu</span><b>'+money(knownTotal())+'</b></div><button class="button" '+buttonAttrs+'>'+buttonText+' <span>→</span></button><p class="fine-print">Le producteur confirme les frais éventuels avant votre engagement définitif. Aucun paiement n’est prélevé ici.</p></aside>';
}
function statusLabel(status) {
  return {pending_confirmation:"En attente du producteur",accepted:"Confirmée",preparing:"En préparation",ready:"Prête / en livraison",delivered:"Livrée",cancelled:"Annulée"}[status] || status;
}
function addressCity(address) {
  const zones=state.catalogConfig.zones||[], text=String(address||"");
  const zone=zones.find(function(z){return text.toLocaleLowerCase("fr").includes(z.toLocaleLowerCase("fr"));});
  return zone || "Antananarivo";
}
function addressBlock(data) {
  const address=String(data.delivery_address||"").trim(), required=data.delivery_method==="delivery";
  if (address.length>=5 && !state.editingAddress) {
    return '<div class="address-card fx-address"><span class="fx-address-check">✓</span><span class="fx-address-text"><b>Domicile — '+esc(addressCity(address))+'</b><small>'+esc(address)+'</small></span><button type="button" class="fx-link fx-address-edit" data-address-edit>Modifier</button><input type="hidden" name="delivery_address" value="'+esc(address)+'"></div>';
  }
  return '<div class="address-card fx-address editing"><span class="fx-address-check pin">⌖</span><label class="fx-address-text" for="delivery-address-input"><b>Adresse ou quartier de livraison</b><input id="delivery-address-input" name="delivery_address" autocomplete="street-address" '+(required?'required minlength="5"':'')+' value="'+esc(address)+'" placeholder="Ex. Lot II M 45, Analamahitsy, Antananarivo"></label></div>';
}
function renderCheckout() {
  if (!state.cart.length) { state.view = "cart"; return renderCart(); }
  if (!state.user) { state.view = "login"; state.loginNext = "checkout"; return renderAuth(); }
  const step = state.checkoutStep || "delivery", data=state.checkoutData;
  const pageLabel = step === "payment" ? "09 / Paiement" : "08 / Livraison";
  const title = step === "payment" ? '<span class="desktop-copy">Comment souhaitez-vous payer ?</span><span class="mobile-copy">Comment payer ?</span>' : "Où livrer votre commande ?";
  const subtitle = step === "payment" ? '<span class="desktop-copy">Choisissez une préférence de paiement, à confirmer avec le producteur.</span><span class="mobile-copy">Aucun débit n’est effectué ici.</span>' : '<span class="desktop-copy">Choisissez la livraison ou le retrait auprès du producteur.</span><span class="mobile-copy">Choisissez livraison ou retrait.</span>';
  const hiddenPaymentChoice = '<input type="hidden" name="payment_method" value="'+esc(data.payment_method)+'"><input type="hidden" name="payment_phone" value="'+esc(data.payment_phone||'')+'">';
  const hiddenDeliveryChoice = '<input type="hidden" name="delivery_method" value="'+esc(data.delivery_method)+'"><input type="hidden" name="delivery_address" value="'+esc(data.delivery_address)+'"><input type="hidden" name="note" value="'+esc(data.note)+'">';
  let formContent = "";
  if (step === "delivery") {
    formContent = '<section class="panel checkout-main"><h2 class="panel-title">Adresse de livraison</h2>'+addressBlock(data)+'<h2 class="panel-title">Mode de réception</h2><div class="delivery-choice-grid"><label class="choice-card"><input type="radio" name="delivery_method" value="delivery" '+(data.delivery_method==="delivery"?'checked':'')+'><span><b>Livraison à domicile</b><small>Le producteur vous confirme les frais et le délai.</small></span></label><label class="choice-card"><input type="radio" name="delivery_method" value="pickup" '+(data.delivery_method==="pickup"?'checked':'')+'><span><b>Retrait chez le producteur</b><small>Retrait gratuit, lieu à confirmer.</small></span></label></div><div class="field"><label for="order-note">Note au livreur (facultatif)</label><textarea id="order-note" name="note" placeholder="Ex. portail vert, appeler à l’arrivée…">'+esc(data.note)+'</textarea></div><div class="notice">Le créneau et les frais seront confirmés par le producteur.</div><div class="mobile-checkout-total">'+(serviceFee()?'<span>Frais de service <b>'+money(serviceFee())+'</b></span>':'')+'<span>Livraison <b>'+(data.delivery_method==="pickup"?"Retrait gratuit":"À confirmer")+'</b></span><span>Total connu <b>'+money(knownTotal())+'</b></span></div><button class="button mobile-checkout-button" type="button" data-checkout-next="payment">Continuer vers le paiement →</button>'+hiddenPaymentChoice+'</section>' + checkoutSummary("Votre commande","Continuer vers le paiement",'type="button" data-checkout-next="payment"');
  } else {
    formContent = '<section class="panel checkout-main"><h2 class="panel-title">Moyen de paiement</h2><div class="payment-options"><label class="choice-card payment-option"><input type="radio" name="payment_method" value="mvola" '+(data.payment_method==="mvola"?'checked':'')+'><span class="payment-mark mvola">M</span><span><b>MVola</b><small>Mobile Money · disponibilité à confirmer</small></span><span class="status pending">À confirmer</span></label><label class="choice-card payment-option"><input type="radio" name="payment_method" value="orange_money" '+(data.payment_method==="orange_money"?'checked':'')+'><span class="payment-mark orange">O</span><span><b>Orange Money</b><small>Mobile Money · disponibilité à confirmer</small></span><span class="status pending">À confirmer</span></label><label class="choice-card payment-option"><input type="radio" name="payment_method" value="at_delivery" '+(data.payment_method==="at_delivery"?'checked':'')+'><span class="payment-mark cash">✓</span><span><b>À la réception</b><small>Confirmer le paiement avec le producteur.</small></span></label></div><div class="field"><label for="payment_phone">Numéro Mobile Money (si applicable)</label><input id="payment_phone" name="payment_phone" type="tel" value="'+esc(data.payment_phone||'')+'" placeholder="+261 34 00 000 00"></div><div class="notice payment-note"><b>Moyens de paiement à confirmer avant lancement.</b><br>Aucun paiement n’est prélevé par cette application.</div><div class="mobile-checkout-total">'+(serviceFee()?'<span>Frais de service <b>'+money(serviceFee())+'</b></span>':'')+'<span>Total connu <b>'+money(knownTotal())+'</b></span><small>Frais de livraison à confirmer</small></div><button class="button mobile-checkout-button" type="submit">Envoyer la demande →</button>'+hiddenDeliveryChoice+'</section>' + checkoutSummary("Résumé de la commande","Envoyer la demande",'type="submit"');
  }
  app.innerHTML = '<section class="content-page checkout-page '+(step==='payment'?'payment-page':'delivery-page')+'"><div class="page-label">'+pageLabel+'</div>'+(step==="payment"?'<button class="back-link" data-checkout-back>← Retour à la livraison</button>':'<button class="back-link" data-nav="cart">← Retour au panier</button>')+'<div class="page-head"><h1>'+title+'</h1><p>'+subtitle+'</p></div>'+renderCheckoutSteps(step)+'<form id="checkout-form" class="checkout-layout">'+formContent+'</form></section>';
  setActiveNav(""); mountMobileNav();
  document.querySelectorAll('input[name="delivery_method"]').forEach(function(radio) { radio.addEventListener("change", function() { const address=document.getElementById("delivery-address-input"); if(address){address.required=radio.value==="delivery"&&radio.checked;} }); });
}
function renderAuth() {
  const registering = state.view === "register";
  app.innerHTML = '<section class="auth-wrap ' + (registering?'auth-register':'auth-login') + '"><div class="auth-aside"><img src="' + photo("hero-marche.png") + '" alt="Marché malgache de produits frais"><div class="auth-aside-copy"><span class="kicker">' + (registering?'UNE COMMUNAUTÉ, UN MARCHÉ':'MADAGASCAR · MARCHÉ DIRECT') + '</span><h2>' + (registering?'Vendez au plus près.<br>Achetez plus juste.':'Le meilleur du<br>terroir vous attend.') + '</h2><p>' + (registering?'Des récoltes locales, un lien direct et des paiements<br>adaptés aux habitudes de chaque région.':'Un compte unique pour acheter local, suivre vos commandes<br>ou vendre les produits de votre ferme.') + '</p><span class="auth-aside-badge">' + (registering?'✓ Inscription gratuite':'✓ Producteurs malgaches vérifiés') + '</span><button class="button light" data-nav="home">Explorer le marché <span>→</span></button></div></div><div class="auth-form"><div class="page-label">' + (registering?'03 / Créer un compte':'02 / Connexion & inscription') + '</div><div class="auth-panel ' + (registering ? 'register-panel' : 'login-panel') + '">' +
    '<span class="section-kicker">' + (registering ? "Rejoindre MadaAgri" : "Ravi de vous revoir") + '</span><h1>' + (registering ? '<span class="desktop-copy">Créer votre compte</span><span class="mobile-copy">Rejoignez le marché local</span>' : "Ravi de vous revoir") + '</h1><p>' + (registering ? '<span class="desktop-copy">Quelques informations pour commencer.</span><span class="mobile-copy">Achetez ou vendez en toute simplicité.</span>' : "Connectez-vous pour retrouver vos commandes.") + '</p>' + (!registering?'<div class="auth-tabs"><button type="button" class="active" data-nav="login">Connexion</button><button type="button" data-nav="register">Créer un compte</button></div>':'') +
    '<form id="auth-form">' + (registering ? '<div class="field register-name"><label for="auth-name"><span class="desktop-copy">Nom</span><span class="mobile-copy">Nom complet</span></label><input id="auth-name" name="name" required autocomplete="given-name" placeholder="Ex. Fara Rakoto"></div><div class="field register-surname"><label for="auth-surname">Prénom</label><input id="auth-surname" name="surname" autocomplete="family-name" placeholder="Rakoto"></div><div class="field register-phone"><label for="auth-phone">Téléphone</label><input id="auth-phone" name="phone" autocomplete="tel" placeholder="+261 34 00 000 00"></div>' : '') +
    '<div class="field"><label for="auth-email">' + (registering?'Adresse e-mail':'Téléphone ou e-mail') + '</label><input id="auth-email" name="email" type="' + (registering?'email':'text') + '" required autocomplete="email" placeholder="' + (registering?'nom@email.com':'+261… ou nom@email.com') + '"></div><div class="field"><label for="auth-password">Mot de passe' + (registering ? ' · 8 caractères minimum' : '') + '</label><input id="auth-password" name="password" type="password" minlength="' + (registering?"8":"1") + '" required autocomplete="' + (registering?"new-password":"current-password") + '" placeholder="' + (registering?'8 caractères minimum':'••••••••') + '"></div>' +
    (registering ? '<div class="register-role-label"><span class="desktop-copy">Votre profil</span><span class="mobile-copy">Je souhaite utiliser MadaAgri comme</span></div><div class="role-switch"><button type="button" class="' + (state.registerRole==="buyer"?"active":"") + '" data-role="buyer">Acheteur</button><button type="button" class="' + (state.registerRole==="producer"?"active":"") + '" data-role="producer">Producteur</button></div><label class="terms-check"><input type="checkbox" name="terms" required><span>J’accepte les conditions d’utilisation<span class="desktop-copy"> et la politique de confidentialité</span>.</span></label>' : '<div class="forgot-row"><button type="button" class="text-button" data-nav="recover">Mot de passe oublié ?</button></div>') +
    '<button class="button auth-submit" type="submit">' + (registering ? "Créer mon compte" : "Se connecter") + ' <span>→</span></button></form>' +
    (!registering ? '<div class="social-divider"><span>ou continuer avec</span></div><button class="google-button" type="button" data-action="google-login"><span class="google-mark">G</span>Continuer avec Google</button>' : '') +
    '<div class="auth-switch">' + (registering ? 'Déjà membre ? <button class="text-button" data-nav="login">Se connecter</button>' : 'Nouveau sur MadaAgri ? <button class="text-button" data-nav="register">Créer un compte acheteur</button>') + '</div>' +
    (!registering ? '<div class="producer-entry"><button class="text-button" data-nav="producer">Producteur ? Accéder à mon espace →</button></div>' : '') + '</div></div></section>';
  setActiveNav(""); mountMobileNav();
}
function renderRecovery() {
  const stage = state.resetToken ?
    '<div class="recovery-code notice">Code local de démonstration : <b>' + esc(state.resetToken) + '</b><br>Il expire dans 30 minutes. En production, ce code doit être envoyé par e-mail.</div><form id="reset-confirm-form"><input type="hidden" name="token" value="' + esc(state.resetToken) + '"><div class="field"><label for="new-password">Nouveau mot de passe</label><input id="new-password" name="password" type="password" minlength="8" required autocomplete="new-password"></div><div class="field"><label for="confirm-password">Confirmer le nouveau mot de passe</label><input id="confirm-password" name="confirm_password" type="password" minlength="8" required autocomplete="new-password"></div><button class="button" type="submit">Mettre à jour le mot de passe</button></form>' :
    '<form id="reset-request-form"><div class="field"><label for="reset-email">Adresse e-mail du compte</label><input id="reset-email" name="email" type="email" required value="' + esc(state.resetEmail||"") + '" placeholder="nom@email.com"></div><button class="button" type="submit">Recevoir un code →</button></form><div class="recovery-info"><b>Le code expire après 30 minutes.</b><small>En démonstration, il s’affiche sur la page suivante.</small></div>';
  app.innerHTML='<section class="auth-wrap auth-recovery '+(state.resetToken?'has-reset-code':'')+'"><div class="auth-aside"><img src="'+photo("hero-marche.png")+'" alt="Marché de producteurs"><div class="auth-aside-copy"><span class="kicker">VOTRE COMPTE</span><h2>On vous aide à<br>revenir au marché.</h2><p>Un code de réinitialisation vous sera remis pour retrouver l’accès à votre compte.</p></div></div><div class="auth-form"><div class="page-label">04 / Mot de passe oublié</div><div class="auth-panel recovery-panel"><span class="recovery-icon">↗</span><h1><span class="desktop-copy">Réinitialiser le mot de passe</span><span class="mobile-copy">Mot de passe oublié ?</span></h1><p>Saisissez votre adresse e-mail pour recevoir un code sécurisé de réinitialisation.</p>'+stage+'<div class="auth-switch"><button class="text-button" data-nav="login">← Retour à la connexion</button></div></div></div></section>';
  setActiveNav(""); mountMobileNav();
}
function maskPhone(phone) {
  const digits=String(phone||"").replace(/[^\d+]/g,"");
  if(digits.length<6) return esc(phone||"");
  const local=digits.startsWith("+261")?digits.slice(4):digits.replace(/^0/,"");
  return "+261 "+esc(local.slice(0,2))+" •• •• "+esc(local.slice(-2));
}
function verifyRemaining() {
  const expires=(state.phoneVerify&&state.phoneVerify.expiresAt)||0;
  return Math.max(0,Math.round((expires-Date.now())/1000));
}
function formatCountdown(seconds) { return String(Math.floor(seconds/60)).padStart(2,"0")+":"+String(seconds%60).padStart(2,"0"); }
async function sendPhoneCode(phone) {
  const result=await api("/phone/send",{method:"POST",body:phone?{phone:phone}:{}});
  state.phoneVerify={phone:result.phone,expiresAt:Date.now()+result.expires_in*1000,demoCode:result.demo_code||"",editing:false,sent:true};
  if(state.user) state.user.phone=result.phone;
  return result;
}
function renderVerify() {
  if (!state.user) { state.view = "login"; state.loginNext = "verify"; return renderAuth(); }
  const v=state.phoneVerify||{}, phone=v.phone||state.user.phone||"";
  const editing=!phone||v.editing, verified=state.user.phone_verified&&!v.sent&&!editing;
  const remaining=verifyRemaining();
  let body;
  if (verified) {
    body='<h1>Numéro vérifié</h1><p class="verify-lead">Votre numéro '+maskPhone(phone)+' est confirmé.</p><div class="verify-info"><b>Votre numéro reste privé.</b><small>Il sert uniquement à la sécurité et au suivi de vos commandes.</small></div><button class="button verify-submit" type="button" data-nav="'+(state.user.role==="producer"?"producer":"home")+'">Continuer vers le marché <span>→</span></button><button class="text-button verify-edit" type="button" data-phone-edit>Modifier mon numéro</button>';
  } else if (editing) {
    body='<h1>Votre numéro de téléphone</h1><p class="verify-lead">Nous vous envoyons un code à 6 chiffres pour confirmer votre compte.</p><form id="phone-change-form"><div class="field"><label for="verify-phone">Téléphone</label><input id="verify-phone" name="phone" type="tel" required autocomplete="tel" value="'+esc(phone)+'" placeholder="+261 34 00 000 00"></div><button class="button verify-submit" type="submit">Recevoir le code <span>→</span></button></form><div class="verify-info"><b>Votre numéro reste privé.</b><small>Il sert uniquement à la sécurité et au suivi.</small></div>'+(phone?'<button class="text-button verify-edit" type="button" data-phone-cancel-edit>← Revenir au code</button>':'<button class="text-button verify-edit" type="button" data-nav="home">Plus tard</button>');
  } else {
    const boxes=[0,1,2,3,4,5].map(function(i){return '<input class="otp-input" inputmode="numeric" maxlength="6" autocomplete="'+(i?'off':'one-time-code')+'" aria-label="Chiffre '+(i+1)+' du code" data-otp="'+i+'">';}).join("");
    body='<h1>Vérifiez votre numéro</h1><p class="verify-lead"><span class="desktop-copy">Code envoyé au '+maskPhone(phone)+'</span><span class="mobile-copy">Un code à 6 chiffres a été envoyé au<br><b>'+maskPhone(phone)+'.</b></span></p><form id="phone-verify-form"><div class="otp-row">'+boxes+'</div><div class="otp-timer"><span>Le code expire dans</span><b id="otp-timer">'+formatCountdown(remaining)+'</b></div>'+(v.demoCode?'<div class="otp-demo">Mode démo, aucun SMS envoyé · code : <b>'+esc(v.demoCode)+'</b></div>':'')+'<button class="button verify-submit" type="submit">Vérifier mon numéro <span>→</span></button></form><div class="verify-resend"><span>Vous n’avez rien reçu ?</span> <button class="text-button" type="button" data-phone-resend>Renvoyer un code</button></div><div class="verify-info"><b>Votre numéro reste privé<span class="mobile-copy"> et sert au suivi</span>.</b><small><span class="desktop-copy">Il sert uniquement à la sécurité et au suivi.</span><span class="mobile-copy">des commandes et à la sécurité du compte.</span></small></div><button class="text-button verify-edit" type="button" data-phone-edit><span class="desktop-copy">← </span>Modifier mon numéro</button>';
  }
  app.innerHTML='<section class="auth-wrap auth-verify"><div class="auth-aside"><img src="'+photo("hero-marche.png")+'" alt="Marché de producteurs"><div class="auth-aside-copy"><span class="kicker">VOTRE COMPTE, EN SÉCURITÉ</span><h2>Un dernier pas<br>avant le marché.</h2><p>Nous vérifions votre numéro pour protéger<br>vos commandes et votre espace producteur.</p></div></div><div class="auth-form"><div class="page-label">05 / Vérification du compte</div><div class="auth-panel verify-panel"><span class="verify-icon">✓</span>'+body+'</div></div></section>';
  setActiveNav(""); mountMobileNav();
  const first=document.querySelector('[data-otp="0"]'); if(first) first.focus({preventScroll:true});
  clearInterval(renderVerify.timer);
  if(!verified && !editing){renderVerify.timer=setInterval(function(){const el=document.getElementById("otp-timer");if(!el||state.view!=="verify"){clearInterval(renderVerify.timer);return;}el.textContent=formatCountdown(verifyRemaining());},1000);}
}
async function openVerify() {
  state.view="verify";
  const needsCode=state.user && !state.user.phone_verified && state.user.phone && !(state.phoneVerify&&state.phoneVerify.sent&&verifyRemaining()>0);
  if(needsCode){ try { await sendPhoneCode(); } catch(error) { toast(error.message); } }
  renderVerify();
}
async function loadOrders() {
  const data = await api("/orders");
  state.orders = data.orders || [];
}
function orderTotal(order) { return Number(order.subtotal)+Number(order.service_fee||0)+(order.delivery_method==="delivery"&&order.delivery_fee_accepted?Number(order.delivery_fee||0):0); }
function orderDate(value, withTime) {
  if (!value) return "";
  const date=new Date(String(value).replace(" ","T")+"Z");
  if (isNaN(date)) return esc(value);
  const today=new Date(), time=date.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"});
  if (date.toDateString()===today.toDateString()) return "Aujourd’hui"+(withTime?" · "+time:"");
  return date.toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:withTime?undefined:"numeric"})+(withTime?" · "+time:"");
}
function orderPill(order) {
  const quoted=order.status==="pending_confirmation"&&order.delivery_status==="quoted";
  const map={pending_confirmation:[quoted?"Frais à valider":"À confirmer","warm"],accepted:["Confirmée","warm"],preparing:[state.user&&state.user.role==="buyer"?"En préparation":"À préparer","warm"],ready:[order.delivery_method==="delivery"?(order.delivery_status==="in_transit"?"En livraison":"Prête"):"Prête au retrait","green"],delivered:[state.user&&state.user.role==="buyer"?"Livrée":"Terminée","green"],cancelled:["Annulée","grey"]};
  const value=map[order.status]||[order.status,"grey"];
  return '<span class="fx-pill '+value[1]+'">'+esc(value[0])+'</span>';
}
function paymentName(method) { return {mvola:"MVola",orange_money:"Orange Money",at_delivery:"À la réception"}[method]||"À convenir"; }
function itemsShort(order) { return order.items.map(function(item){return esc(item.name.split(" ")[0])+' · '+item.quantity+' '+esc(String(item.unit).split(" ")[0]);}).join(", "); }
function orderActions(order) {
  const role=state.user.role, actions=[];
  const staff=role==="producer"||role==="admin";
  if (staff && order.status==="pending_confirmation" && order.delivery_method==="delivery" && !order.delivery_fee_accepted) {
    const zones=(state.catalogConfig.zones||[]).map(function(z){return '<option '+(z===(order.delivery_zone||addressCity(order.delivery_address))?'selected':'')+'>'+esc(z)+'</option>';}).join("");
    actions.push('<form class="fx-quote" data-quote-order="'+order.id+'"><b>'+(order.delivery_status==="quoted"?'Tarif proposé : '+money(order.delivery_fee)+' · en attente de l’acheteur':'Proposer les frais de livraison')+'</b><div class="fx-quote-grid"><label>Frais (Ar)<input name="fee" type="number" min="0" max="1000000" required value="'+(order.delivery_fee!=null?esc(order.delivery_fee):'')+'"></label><label>Zone<select name="zone" required>'+zones+'</select></label><label>Livreur / responsable<input name="responsible" minlength="2" required value="'+esc(order.delivery_responsible||'')+'" placeholder="Ex. Ferme Rakoto"></label></div><button class="button small" type="submit">'+(order.delivery_status==="quoted"?'Modifier le tarif':'Envoyer le tarif à l’acheteur')+'</button></form>');
  }
  if (staff) {
    const canAccept=order.delivery_method==="pickup"||order.delivery_fee_accepted;
    const next={pending_confirmation:canAccept?["accepted","Confirmer la commande"]:null,accepted:["preparing","Marquer en préparation"],preparing:["ready",order.delivery_method==="delivery"?"Marquer prête à livrer":"Marquer prête au retrait"],ready:order.delivery_method==="delivery"&&order.delivery_status!=="in_transit"?null:["delivered","Confirmer la remise"]}[order.status];
    if (next) actions.push('<button class="button small" data-order-status="'+order.id+'" data-status="'+next[0]+'">'+next[1]+'</button>');
    if (order.status==="ready"&&order.delivery_method==="delivery"&&order.delivery_status==="confirmed") actions.push('<button class="button small" data-delivery-start="'+order.id+'">Démarrer la livraison</button>');
    if (["pending_confirmation","accepted","preparing"].includes(order.status)) actions.push('<button class="button small outline" data-order-status="'+order.id+'" data-status="cancelled">'+(order.status==="pending_confirmation"?"Refuser":"Annuler")+'</button>');
    if (order.payment_status==="pending"&&order.status!=="cancelled"&&(order.payment_method!=="at_delivery"||order.status==="delivered")) actions.push('<button class="button small outline" data-payment-confirm="'+order.id+'">Confirmer le paiement reçu</button>');
  }
  if (role==="buyer") {
    if (order.status==="pending_confirmation"&&order.delivery_status==="quoted") actions.push('<div class="fx-quote fx-quote-buyer"><b>Frais de livraison proposés : '+money(order.delivery_fee)+'</b><small>'+esc(order.delivery_zone)+' · '+esc(order.delivery_responsible)+' · nouveau total '+money(Number(order.subtotal)+Number(order.service_fee||0)+Number(order.delivery_fee||0))+'</small><div class="fx-quote-actions"><button class="button small" data-delivery-accept="'+order.id+'" data-accepted="1">Accepter les frais</button><button class="button small outline" data-delivery-accept="'+order.id+'" data-accepted="0">Refuser et annuler</button></div></div>');
    if (order.status==="delivered") actions.push('<button class="button small soft" data-review="'+esc(order.code)+'">Laisser un avis</button><button class="button small outline" data-claim="'+esc(order.code)+'">Signaler un problème</button>');
  }
  return actions.length?'<div class="fx-actions">'+actions.join("")+'</div>':'';
}
function renderOrderConfirmation(result, items, paymentMethod) {
  const delivery=state.lastOrder&&state.lastOrder.deliveryMethod||state.checkoutData.delivery_method;
  const products=items.reduce(function(sum,item){return sum+item.price*item.quantity;},0), total=products+Number(result.service_fee||0);
  const rows=items.map(function(item){return '<div class="fx-confirm-line"><img class="fx-thumb" src="'+photo(item.image)+'" alt=""><b>'+esc(item.name)+' · '+item.quantity+' '+esc(String(item.unit).split(" ")[0])+'</b><strong>'+money(item.price*item.quantity)+'</strong></div>';}).join("");
  const deliveryText=delivery==="pickup"?"Retrait chez le producteur · gratuit":"Livraison · frais à confirmer par le producteur";
  app.innerHTML='<section class="fx-page fx-confirm"><div class="page-label">10 / Commande confirmée</div><div class="fx-success"><span class="fx-success-check">✓</span><h1>Commande enregistrée !</h1><p>Merci d’encourager les producteurs locaux.</p><span class="fx-ref">N° '+esc(result.code)+'</span></div><div class="fx-confirm-grid"><section class="fx-card fx-confirm-order"><h2 class="fx-title"><span class="desktop-copy">Votre commande</span><span class="mobile-copy">Résumé de votre commande</span></h2><div class="fx-confirm-lines">'+rows+'</div><div class="fx-kv fx-mobile-only"><span>'+items.length+' article'+(items.length>1?'s':'')+' · 1 producteur</span><b>'+money(products)+'</b></div><div class="fx-kv fx-mobile-only"><span>'+(delivery==="pickup"?"Retrait":"Livraison estimée")+'</span><b>'+(delivery==="pickup"?"Gratuit":"À confirmer")+'</b></div><div class="fx-confirm-foot"><span class="desktop-copy">'+deliveryText+'</span><span class="mobile-copy">Total connu / à régler</span><b><span class="desktop-copy">Total </span>'+money(total)+'</b></div></section><aside class="fx-card fx-next"><h2 class="fx-title">Prochaine étape</h2><p class="fx-next-text">Le producteur vérifie son stock et vous confirme '+(delivery==="pickup"?"le retrait":"les frais de livraison")+'.</p><span class="fx-pill warm">Paiement à confirmer selon le moyen choisi · '+esc(paymentName(paymentMethod))+'</span><button class="button" data-track="'+esc(result.id||"")+'">Suivre ma commande <span>→</span></button><button class="button outline fx-back" data-nav="home">Retour au marché</button><p class="fx-note">Vous êtes notifié à chaque étape dans « Mes commandes ».</p></aside></div></section>';
  setActiveNav(""); mountMobileNav();
}
function renderOrders() {
  if (!state.user) { state.view = "login"; state.loginNext = "orders"; return renderAuth(); }
  const buyer=state.user.role==="buyer";
  const rows=state.orders.map(function(order){
    return '<article class="fx-row fx-order-row" data-track="'+order.id+'" tabindex="0"><b class="fx-order-code">'+esc(order.code)+'</b><span class="fx-order-date">'+orderDate(order.created_at)+'</span><span class="fx-order-who">'+esc(buyer?order.producer_name:order.buyer_name)+'</span><strong class="fx-order-total">'+money(orderTotal(order))+'</strong><span class="fx-order-status">'+orderPill(order)+'</span><button class="fx-link fx-order-open" data-track="'+order.id+'">Détails →</button></article>';
  }).join("");
  app.innerHTML='<section class="fx-page fx-orders"><div class="page-label">12 / Mes commandes</div><div class="fx-head"><h1>'+(buyer?"Mes commandes":"Commandes reçues")+'</h1><p><span class="desktop-copy">'+(buyer?"Retrouvez l’historique et suivez vos achats auprès des producteurs.":"Confirmez, préparez et remettez les commandes de vos acheteurs.")+'</span><span class="mobile-copy">'+(buyer?"Historique et suivi de vos achats.":"Commandes de vos acheteurs.")+'</span></p></div><section class="fx-card fx-orders-card"><div class="fx-table-head fx-orders-grid"><span>Commande</span><span>Date</span><span>'+(buyer?"Producteurs":"Acheteur")+'</span><span>Total estimé</span><span>Statut</span><span></span></div>'+(rows||'<p class="fx-empty">Aucune commande pour le moment.</p>')+'</section><div class="fx-help"><div class="desktop-copy"><b>Besoin d’aide avec une commande ?</b><small>Ouvrez la commande : le suivi indique chaque étape et permet de signaler un problème après la remise.</small></div><button class="button outline" data-nav="home">Continuer mes achats</button></div></section>';
  setActiveNav("orders"); mountMobileNav();
}
function renderTracking() {
  if(!state.user){state.view="login";state.loginNext="tracking";return renderAuth();}
  const order=state.orders.find(function(item){return item.id===Number(state.selectedOrderId);})||state.orders[0];
  if(!order){state.view="orders";return renderOrders();}
  const delivery=order.delivery_method==="delivery";
  const order_index={pending_confirmation:0,accepted:1,preparing:1,ready:2,delivered:4,cancelled:-1}[order.status];
  const index=order.status==="ready"&&delivery&&order.delivery_status==="in_transit"?3:order_index;
  const stages=[
    {label:order.status==="pending_confirmation"?"Commande envoyée au producteur":"Commande confirmée",detail:order.status==="pending_confirmation"?(order.delivery_status==="quoted"?"Frais de livraison à valider":"En attente de confirmation · "+orderDate(order.created_at,true)):orderDate(order.created_at,true)},
    {label:"Préparation chez le producteur",detail:order.status==="preparing"?"En cours · "+esc(order.producer_name):order.status==="accepted"?"Bientôt · "+esc(order.producer_name):index>1?"Terminée":"À venir"},
    {label:delivery?"Prise en charge par le livreur":"Prête pour le retrait",detail:index===2?(delivery?"Départ imminent"+(order.delivery_responsible?" · "+esc(order.delivery_responsible):""):"À récupérer chez le producteur"):index>2?"Terminée":"À venir"},
    {label:delivery?"Livrée chez vous":"Retirée chez le producteur",detail:index===4?"Remise confirmée":index===3?"En route · "+esc(order.delivery_zone||addressCity(order.delivery_address)):"À venir"}
  ];
  const timeline=stages.map(function(stage,i){const done=index>i||index===4,current=index===i&&index!==4;return '<div class="fx-step '+(done?'done':current?'current':'')+'"><span class="fx-step-dot">'+(done?'✓':i+1)+'</span><div><b>'+stage.label+'</b><small>'+stage.detail+'</small></div></div>';}).join("");
  const count=order.items.reduce(function(sum,item){return sum+Number(item.quantity);},0);
  const deliveryValue=delivery?(order.delivery_fee!=null?money(order.delivery_fee)+(order.delivery_fee_accepted?"":" · à valider"):"Frais à confirmer"):"Retrait gratuit";
  const cancelled=order.status==="cancelled";
  const title=cancelled?"Commande annulée":order.status==="delivered"?"Commande remise !":order.status==="pending_confirmation"?"Commande bien reçue !":"Commande en cours";
  const staff=state.user.role!=="buyer";
  const text=cancelled?"Cette commande a été annulée. Aucun montant n’a été prélevé.":order.status==="delivered"?"La commande a été remise. Merci de faire vivre les producteurs locaux.":staff?"Confirmez chaque étape : l’acheteur est prévenu automatiquement.":order.status==="pending_confirmation"?"Votre producteur vérifie votre récolte. Vous recevez une mise à jour à chaque étape.":"Votre producteur prépare votre récolte. Vous recevez une mise à jour à chaque étape.";
  app.innerHTML='<section class="fx-page fx-track"><div class="page-label">11 / Suivi de commande</div><div class="fx-banner '+(cancelled?'cancelled':'')+'"><span class="fx-success-check">'+(cancelled?'×':'✓')+'</span><div><h1>'+title+'</h1><p class="fx-mobile-only fx-banner-code">'+esc(order.code)+' · '+(order.payment_status==="confirmed"?"paiement confirmé":"paiement à vérifier")+'</p><p>'+text+'</p></div><span class="fx-ref">'+esc(order.code)+'</span></div><div class="fx-track-grid"><div class="fx-track-main"><div class="fx-section-head"><h2>Suivi de la commande</h2><small>'+(staff?esc(order.buyer_name)+' · ':'')+'Commandée '+orderDate(order.created_at,true).toLowerCase()+'</small></div><section class="fx-card fx-timeline">'+(cancelled?'<p class="fx-empty">La commande est annulée.</p>':'<div class="fx-steps">'+timeline+'</div>')+orderActions(order)+'</section></div><aside class="fx-track-side"><section class="fx-card fx-recap"><h2 class="fx-title">Récapitulatif</h2><div class="fx-kv"><span>Produits</span><b>'+count+' article'+(count>1?'s':'')+'</b></div><div class="fx-kv"><span>'+(delivery?"Livraison":"Retrait")+'</span><b>'+deliveryValue+'</b></div><div class="fx-kv"><span>Paiement</span><b class="'+(order.payment_status==="confirmed"?"":"warm")+'">'+esc(paymentName(order.payment_method))+' · '+(order.payment_status==="confirmed"?"confirmé":"à vérifier")+'</b></div><div class="fx-kv fx-total"><span>Total estimé</span><b>'+money(orderTotal(order))+'</b></div><div class="fx-recap-items">'+order.items.map(function(item){return '<small>'+item.quantity+' × '+esc(item.name)+' · '+money(item.price*item.quantity)+'</small>';}).join("")+'</div></section><section class="fx-card fx-support"><div><b>Besoin d’aide ?</b><small>Contactez-nous avec votre numéro de commande.</small></div><button class="button outline small" data-support="'+order.id+'">Support</button></section><button class="button outline fx-mobile-only fx-all-orders" data-nav="orders">Voir mes commandes</button></aside></div></section>';
  setActiveNav("orders");mountMobileNav();
}
function productStatusPill(p) {
  const map={published:["Publié","green"],pending:["À vérifier","warm"],inactive:["Désactivé","grey"],rejected:["Refusé","grey"]}[p.status]||[p.status,"grey"];
  return '<span class="fx-pill '+map[1]+'">'+map[0]+'</span>';
}
function productFormModal() {
  const editing=state.producerProducts.find(p=>p.id===Number(state.editingProductId));
  const options=function(list){return (list||[]).map(value=>'<option value="'+esc(value)+'">'+esc(value)+'</option>').join('');};
  modalRoot.innerHTML='<div class="modal-backdrop" data-backdrop><div class="fx-modal" role="dialog" aria-modal="true" aria-labelledby="product-form-title"><button class="modal-close" type="button" data-close-modal aria-label="Fermer">×</button><h2 class="fx-title" id="product-form-title">'+(editing?'Modifier la fiche':'Ajouter une fiche produit')+'</h2><p class="fx-modal-lead">'+(editing?'Les changements de prix et de stock sont visibles immédiatement.':'La fiche est vérifiée par l’équipe avant publication.')+'</p><form id="product-form"><div class="field"><label>Nom du produit</label><input name="name" value="'+esc(editing?.name||'')+'" required></div><div class="field-grid"><div class="field"><label>Prix (Ar)</label><input name="price" type="number" min="1" value="'+(editing?.price||'')+'" required></div><div class="field"><label>Unité</label><select name="unit" required>'+options(state.catalogConfig.units)+'</select></div></div><div class="field-grid"><div class="field"><label>Stock disponible</label><input name="stock" type="number" min="0" value="'+(editing?.stock??'')+'" required></div><div class="field"><label>Région</label><select name="region" required>'+options(state.catalogConfig.zones)+'</select></div></div><div class="field"><label>Catégorie</label><select name="category">'+options(state.catalogConfig.categories)+'</select></div><div class="field"><label>Photo du produit</label><select name="image">'+(editing?.image?.startsWith('user-')?'<option value="'+esc(editing.image)+'">Photo actuelle</option>':'')+'<option value="tomates.png">Tomates</option><option value="riz-rouge.png">Riz rouge</option><option value="bredes-mafana.png">Brèdes mafana</option><option value="bananes.png">Bananes</option><option value="aubergines-piments.png">Aubergines & piments</option></select><input class="photo-upload" name="photo_file" type="file" accept="image/png,image/jpeg,image/webp" aria-label="Importer une photo de produit"><small>Ou importez votre photo (PNG, JPEG, WebP · 2 Mo maximum).</small></div><div class="field"><label>Description</label><textarea name="description">'+esc(editing?.description||'')+'</textarea></div><div class="fx-modal-actions"><button class="button outline" type="button" data-close-modal>Annuler</button><button class="button" type="submit" '+(!state.user.verified?'disabled':'')+'>'+(editing?'Enregistrer':'Envoyer à la vérification')+'</button></div></form></div></div>';
  if(editing){const form=document.getElementById('product-form');form.category.value=editing.category;form.unit.value=editing.unit;form.region.value=editing.region;form.image.value=editing.image;}
  document.querySelector('#product-form [name="name"]')?.focus();
}
function renderProducer() {
  if (!state.user) { state.view = "login"; state.loginNext = "producer"; return renderAuth(); }
  if (state.user.role !== "producer" && state.user.role !== "admin") {
    app.innerHTML = '<section class="fx-page"><div class="page-label">13 / Espace producteur</div><div class="fx-head"><h1>Votre récolte mérite sa place.</h1><p>Créez un compte producteur pour proposer vos produits aux acheteurs.</p></div><div class="fx-card fx-pitch"><p>Les fiches sont vérifiées avant publication. Pour commencer, ouvrez un compte producteur.</p><button class="button" data-nav="register">Créer mon compte producteur →</button></div></section>';
    state.registerRole = "producer"; setActiveNav("producer"); return mountMobileNav();
  }
  const products=state.producerProducts, orders=state.orders;
  const shop=((products.find(p=>p.status==="published")||products[0])||{}).producer_name||state.user.name;
  const toPrepare=orders.filter(o=>["pending_confirmation","accepted","preparing"].includes(o.status));
  const published=products.filter(p=>p.status==="published");
  const weekAgo=Date.now()-7*864e5;
  const sales=orders.filter(o=>o.status!=="cancelled"&&new Date(String(o.created_at).replace(" ","T")+"Z").getTime()>=weekAgo).reduce((sum,o)=>sum+Number(o.subtotal),0);
  const rated=products.filter(p=>Number(p.rating)>0), rating=rated.length?rated.reduce((s,p)=>s+Number(p.rating),0)/rated.length:0;
  const orderRows=orders.slice(0,4).map(function(o){return '<article class="fx-row fx-recent-row" data-track="'+o.id+'" tabindex="0"><b>'+esc(o.code)+'</b><span class="fx-recent-items">'+itemsShort(o)+'</span><span>'+orderPill(o)+'</span><strong>'+money(orderTotal(o))+'</strong></article>';}).join("");
  const productRows=products.map(function(p){return '<article class="fx-product-row"><img class="fx-thumb" src="'+photo(p.image)+'" alt=""><div class="fx-product-info"><b>'+esc(p.name)+'</b><small>'+money(p.price)+' / '+esc(p.unit)+' · '+esc(p.stock)+' dispo.</small><span class="fx-product-actions"><button class="fx-link" data-edit-product="'+p.id+'">Modifier</button><button class="fx-link" data-toggle-product="'+p.id+'">'+(p.status==='inactive'?'Réactiver':'Désactiver')+'</button></span></div>'+productStatusPill(p)+'</article>';}).join("");
  app.innerHTML='<section class="fx-page fx-producer '+(state.producerProductsOpen?'show-products':'')+'"><div class="page-label">13 / Espace producteur</div><div class="fx-head"><h1>Bonjour, '+esc(shop)+'</h1><p><span class="desktop-copy">Suivez vos récoltes, vos commandes et vos acheteurs.</span><span class="mobile-copy">Votre activité cette semaine</span></p></div>'+(!state.user.verified?'<div class="notice fx-notice">Votre profil attend la vérification de l’administration. La publication sera disponible après validation.</div>':'')+
    '<div class="fx-kpis"><div class="fx-card fx-kpi"><span><span class="desktop-copy">Commandes à préparer</span><span class="mobile-copy">À préparer</span></span><b>'+toPrepare.length+'</b><small>'+orders.filter(o=>o.status==="pending_confirmation").length+' à confirmer</small></div><div class="fx-card fx-kpi"><span>Produits publiés</span><b>'+published.length+'</b><small>'+published.filter(p=>Number(p.stock)<10).length+' bientôt indisponibles</small></div><div class="fx-card fx-kpi"><span>Ventes estimées</span><b>'+money(sales)+'</b><small>7 derniers jours</small></div><div class="fx-card fx-kpi fx-kpi-rating"><span>Note moyenne</span><b>'+(rating?rating.toFixed(1).replace(".",",")+' / 5':'—')+'</b><small>Moyenne de vos fiches</small></div></div>'+
    '<div class="fx-producer-grid"><section class="fx-card fx-recent"><div class="fx-card-head"><h2 class="fx-title">Commandes récentes</h2><button class="fx-link desktop-copy" data-nav="orders">Voir tout →</button></div><div class="fx-table-head fx-recent-grid"><span>Commande</span><span>Produits</span><span>Statut</span><span>Total</span></div>'+(orderRows||'<p class="fx-empty">Aucune commande pour le moment.</p>')+'<button class="fx-link fx-mobile-only fx-recent-all" data-nav="orders">Voir toutes les commandes →</button></section><section class="fx-card fx-products"><div class="fx-card-head"><h2 class="fx-title">Mes produits</h2><button class="button soft small" data-new-product '+(!state.user.verified?'disabled':'')+'>+ Ajouter</button></div>'+(productRows||'<p class="fx-empty">Vous n’avez pas encore ajouté de produit.</p>')+'</section></div><button class="button fx-mobile-only fx-manage" data-toggle-products>'+(state.producerProductsOpen?'Masquer mes produits':'Gérer mes produits <span>→</span>')+'</button></section>';
  setActiveNav("producer"); mountMobileNav();

}
async function renderAdmin() {
  if (!state.user || state.user.role !== "admin") {
    app.innerHTML = '<section class="content-page"><div class="page-head"><span class="section-kicker">Administration</span><h1>Accès réservé.</h1><p>Connectez-vous avec un compte administrateur.</p></div><button class="button" data-nav="login">Se connecter</button></section>'; return mountMobileNav();
  }
  try { state.admin = await api("/admin"); } catch (error) { toast(error.message); state.admin = {users:[],products:[],claims:[],metrics:{}}; }
  const data = state.admin;
  const pending = data.products.filter(function(p){return p.status==="pending";});
  const producers = data.users.filter(function(u){return u.role==="producer" && !u.verified;});
  const productRows = pending.map(function(p) {
    return '<div class="fx-mod-row"><img class="fx-thumb" src="' + photo(p.image) + '" alt=""><div class="fx-mod-info"><b>' + esc(p.name) + '</b><small>' + esc(p.producer_name) + ' · ' + money(p.price) + ' / ' + esc(p.unit) + '</small><span class="fx-pill warm">En attente</span></div><div class="fx-mod-actions"><button class="button soft" data-examine-product="' + p.id + '">Examiner</button><button class="button outline" data-moderate="' + p.id + '" data-status="rejected">Refuser</button></div></div>';
  }).join("");
  const producerRows = producers.map(function(u) {
    const initials=u.name.split(/\s+/).map(w=>w[0]).join('').slice(0,2).toUpperCase();
    return '<div class="fx-verify-row"><span class="fx-avatar">' + esc(initials) + '</span><div><b>' + esc(u.name) + '</b><small>' + (u.phone ? 'Téléphone ' + (u.phone_verified ? 'vérifié' : 'à confirmer') : 'Identité et zone à confirmer') + '</small></div><button class="fx-link" data-open-producer="' + u.id + '">Ouvrir →</button></div>';
  }).join("");
  app.innerHTML = '<section class="content-page admin-page"><div class="page-label">14 / Back-office / Modération</div><div class="page-head"><h1>Back-office</h1><p><span class="desktop-copy">Vérifiez les producteurs, les produits et les commandes signalées.</span><span class="mobile-copy">Modération du marché</span></p></div>' +
    '<div class="dashboard-grid"><div class="metric"><span><span class="desktop-copy">Producteurs à vérifier</span><span class="mobile-copy">Producteurs</span></span><b>' + producers.length + '</b><small>Demandes en attente</small></div><div class="metric"><span><span class="desktop-copy">Produits à examiner</span><span class="mobile-copy">Produits</span></span><b>' + pending.length + '</b><small>Nouvelles publications</small></div><div class="metric"><span><span class="desktop-copy">Réclamations ouvertes</span><span class="mobile-copy">Réclamations</span></span><b>' + (data.metrics.open_claims || 0) + '</b><small>À traiter</small></div></div>' +
    '<div class="dashboard-columns"><section class="panel fx-mod-panel"><div class="fx-card-head fx-mod-head"><h2 class="panel-title"><span class="desktop-copy">Fiches produits en attente</span><span class="mobile-copy">Produits à examiner</span></h2>' + (pending.length ? '<span class="fx-pill warm">' + pending.length + ' à examiner</span>' : '') + '</div>' + (productRows || '<p class="fine-print">Aucune fiche en attente.</p>') + '</section><section class="panel fx-verify-panel"><h2 class="panel-title"><span class="desktop-copy">Vérification producteur</span><span class="mobile-copy">Producteurs à vérifier · ' + producers.length + ' demande' + (producers.length > 1 ? 's' : '') + '</span></h2>' + (producerRows || '<p class="fine-print">Aucun profil à vérifier.</p>') + '<div class="fx-info"><b>Paiement et livraison</b><small>Partenaires à confirmer avant activation : les frais sont convenus entre acheteur et producteur.</small></div></section></div>' +
    '<section class="panel" style="margin-top:17px"><div style="display:flex;justify-content:space-between;align-items:center;gap:14px"><h2 class="panel-title">Réclamations</h2><button class="button small soft" data-export>Exporter commandes CSV</button></div>' +
    (data.claims.length ? data.claims.map(function(c){return '<div class="moderation-row claim-row"><div class="grow"><b>'+esc(c.code)+' · '+esc(c.reason)+'</b><small>'+esc(c.details)+' · '+esc(c.status)+(c.resolution?' · '+esc(c.resolution):'')+'</small>'+(c.status==='open'?'<textarea aria-label="Décision pour '+esc(c.code)+'" placeholder="Expliquez la décision au client" required></textarea>':'')+'</div>'+(c.status==='open'?'<div class="row-actions"><button class="button small" data-claim-decision="'+c.id+'" data-status="resolved">Résoudre</button><button class="button small outline" data-claim-decision="'+c.id+'" data-status="rejected">Rejeter</button></div>':'')+'</div>';}).join("") : '<p class="fine-print">Aucune réclamation enregistrée.</p>') + '</section></section>';
  setActiveNav("admin"); mountMobileNav();
}
function adminAccess() {
  if (state.user && state.user.role === "admin") return true;
  app.innerHTML = '<section class="content-page"><div class="page-head"><h1>Accès réservé.</h1><p>Connectez-vous avec un compte administrateur.</p></div><button class="button" data-nav="login">Se connecter</button></section>';
  mountMobileNav(); return false;
}
async function renderAdminOrders() {
  if (!adminAccess()) return;
  try { await loadOrders(); } catch (error) { toast(error.message); state.orders=[]; }
  const filter=state.adminOrderFilter||"all";
  const matches=function(order){return filter==="all" || (filter==="pending" && ["pending_confirmation","accepted","preparing"].includes(order.status)) || (filter==="route" && order.status==="ready");};
  const visible=state.orders.filter(matches);
  const chips=[['all','Toutes · '+state.orders.length],['pending','À traiter · '+state.orders.filter(o=>["pending_confirmation","accepted","preparing"].includes(o.status)).length],['route','En route · '+state.orders.filter(o=>o.status==="ready").length]].map(([id,label])=>'<button class="admin-filter '+(filter===id?'active':'')+'" data-admin-order-filter="'+id+'">'+label+'</button>').join('');
  const rows=visible.map(function(order){return '<article class="admin-order-row"><b class="order-ref">'+esc(order.code)+'</b><span class="order-buyer">'+esc(order.buyer_name)+'</span><span class="order-date">'+orderDate(order.created_at,true)+'</span><strong class="order-amount">'+money(Number(order.subtotal)+Number(order.service_fee||0))+'</strong><span class="order-payment">'+esc(({mvola:'MVola',orange_money:'Orange Money',at_delivery:'À la réception'})[order.payment_method]||'À confirmer')+'</span><span class="fx-order-pill">'+orderPill(order)+'</span><button class="text-button order-open" data-track="'+order.id+'">Ouvrir →</button><span class="order-count">'+order.items.length+' article'+(order.items.length>1?'s':'')+'</span></article>';}).join('');
  app.innerHTML='<section class="content-page admin-list-page admin-orders-page"><div class="page-label">15 / BO / Gestion des commandes</div><div class="page-head"><h1>Commandes</h1><p>Suivez chaque paiement, préparation et livraison.</p></div><div class="dashboard-grid"><div class="metric"><span>À traiter</span><b>'+state.orders.filter(o=>["pending_confirmation","accepted","preparing"].includes(o.status)).length+'</b></div><div class="metric"><span>En livraison</span><b>'+state.orders.filter(o=>o.status==="ready").length+'</b></div><div class="metric"><span>Terminées</span><b>'+state.orders.filter(o=>o.status==="delivered").length+'</b></div></div><div class="admin-list-filters">'+chips+'</div><section class="panel admin-list-panel"><h2 class="panel-title">Toutes les commandes</h2><span class="admin-count">'+visible.length+' commande'+(visible.length>1?'s':'')+'</span><div class="admin-table-head"><span>N° COMMANDE</span><span>ACHETEUR</span><span>DATE</span><span>TOTAL</span><span>PAIEMENT</span><span>STATUT</span></div><div class="admin-list-rows">'+(rows||'<p class="fine-print">Aucune commande dans cette catégorie.</p>')+'</div><p class="admin-list-note">Les paiements et statuts restent indicatifs tant que le producteur ne les a pas confirmés.</p></section></section>';
  setActiveNav("admin"); mountMobileNav();
}
async function renderAdminCatalog() {
  if (!adminAccess()) return;
  try { state.admin=await api('/admin'); } catch(error) { toast(error.message); state.admin={products:[]}; }
  const products=state.admin.products||[], filter=state.adminCatalogFilter||'pending';
  const producerFilter=state.adminCatalogProducer||'';
  const producers=[...new Set(products.map(p=>p.producer_name))].sort((a,b)=>a.localeCompare(b,'fr'));
  const visible=products.filter(p=>p.status===filter&&(!producerFilter||p.producer_name===producerFilter));
  const chips=[['pending','À valider · '+products.filter(p=>p.status==='pending').length],['published','En ligne · '+products.filter(p=>p.status==='published').length],['rejected','Refusés · '+products.filter(p=>p.status==='rejected').length]].map(([id,label])=>'<button class="admin-filter '+(filter===id?'active':'')+'" data-admin-catalog-filter="'+id+'">'+label+'</button>').join('');
  const rows=visible.map(function(p){return '<article class="admin-catalog-row"><img src="'+photo(p.image)+'" alt=""><b class="catalog-name">'+esc(p.name)+'</b><span class="catalog-producer">'+esc(p.producer_name)+'</span><strong class="catalog-price">'+money(p.price)+' / '+esc(p.unit)+'</strong><span class="catalog-stock">'+esc(p.stock)+' '+esc(p.unit)+'</span><span class="fx-pill '+(p.status==='pending'?'warm':p.status==='published'?'green':'grey')+'">'+esc(p.status==='pending'?'À valider':p.status==='published'?'En ligne':'Refusé')+'</span><div class="catalog-actions">'+(p.status==='pending'?'<button class="text-button" data-moderate="'+p.id+'" data-status="published">Publier</button><button class="text-button" data-moderate="'+p.id+'" data-status="rejected">Refuser</button>':'<button class="text-button" data-moderate="'+p.id+'" data-status="'+(p.status==='published'?'rejected':'published')+'">'+(p.status==='published'?'Retirer':'Publier')+'</button>')+'</div></article>';}).join('');
  app.innerHTML='<section class="content-page admin-list-page admin-catalog-page"><div class="page-label">16 / BO / Catalogue produits</div><div class="page-head"><h1><span class="desktop-copy">Catalogue produits</span><span class="mobile-copy">Catalogue</span></h1><p><span class="desktop-copy">Gérez les prix, stocks, photos et publications du marché.</span><span class="mobile-copy">Validez les fiches avant publication.</span></p></div><button class="button catalog-add" data-nav="producer"><span class="desktop-copy">+ Ajouter un produit</span><span class="mobile-copy">+ Ajouter</span></button><div class="admin-list-filters">'+chips+'</div><section class="panel admin-list-panel"><h2 class="panel-title">Fiches produits</h2><label class="fx-producer-filter"><span class="sr-only">Filtrer par producteur</span><select data-catalog-producer><option value="">Filtrer par producteur</option>'+producers.map(name=>'<option '+(name===producerFilter?'selected':'')+' value="'+esc(name)+'">'+esc(name)+'</option>').join('')+'</select></label><div class="admin-table-head"><span>PRODUIT</span><span>PRODUCTEUR</span><span>PRIX</span><span>STOCK</span><span>STATUT</span></div><div class="admin-list-rows">'+(rows||'<p class="fine-print">Aucun produit dans cette catégorie.</p>')+'</div></section><div class="catalog-notice">Chaque annonce affiche une unité, une zone de collecte et un stock avant publication.</div></section>';
  setActiveNav("admin"); mountMobileNav();
}
async function renderAdminSettings() {
  if (!adminAccess()) return;
  try { state.admin=await api("/admin"); } catch(error) { toast(error.message); return; }
  const data=state.admin, settings=data.settings||{};
  const accounts=(data.users||[]).filter(u=>u.role!=="admin").map(u=>'<div class="admin-account-row" data-account-row><div><b>'+esc(u.name)+'</b><small>'+esc(u.email)+' · '+esc(u.role==='producer'?'Producteur':'Acheteur')+'</small></div><span class="status '+(u.active?'published':'rejected')+'">'+(u.active?'Actif':'Suspendu')+'</span><button class="button small '+(u.active?'outline':'soft')+'" data-user-active="'+u.id+'" data-active="'+(u.active?'0':'1')+'">'+(u.active?'Suspendre':'Réactiver')+'</button></div>').join('');
  const field=(name,label,value)=>'<div class="field"><label for="setting-'+name+'">'+label+'</label><textarea id="setting-'+name+'" name="'+name+'" rows="3" required>'+esc((value||[]).join('\n'))+'</textarea><small>Un élément par ligne.</small></div>';
  app.innerHTML='<section class="content-page admin-settings-page"><div class="page-label">17 / BO / Comptes et paramètres</div><div class="page-head"><h1>Comptes et paramètres</h1><p>Gérez les accès et les règles publiques du marché.</p></div><div class="admin-settings-grid"><section class="panel"><h2 class="panel-title">Comptes</h2><input id="admin-account-search" type="search" placeholder="Rechercher un compte" aria-label="Rechercher un compte"><div id="admin-account-list">'+(accounts||'<p class="fine-print">Aucun compte.</p>')+'</div></section><section class="panel"><h2 class="panel-title">Catalogue et zones</h2><form id="admin-settings-form">'+field('categories','Catégories',settings.categories)+field('units','Unités de vente',settings.units)+field('zones','Zones desservies',settings.zones)+'<div class="field-grid"><div class="field"><label>Commission producteur (%)</label><input name="commission_percent" type="number" min="0" max="100" step="0.1" value="'+Number(settings.commission_percent||0)+'" required></div><div class="field"><label>Frais de service (Ar)</label><input name="service_fee" type="number" min="0" value="'+Number(settings.service_fee||0)+'" required></div></div><p class="fine-print">Publiez les conditions destinées aux producteurs avant d’appliquer une commission commerciale.</p><button class="button" type="submit">Enregistrer les paramètres</button></form></section></div></section>';
  setActiveNav("admin");mountMobileNav();
}
async function go(view) {
  state.view = view || "home";
  window.scrollTo(0,0);
  document.body.dataset.view = state.view;
  if (state.view === "checkout" && !state.checkoutStep) state.checkoutStep="delivery";
  if (state.view === "cart") return renderCart();
  if (state.view === "checkout") return renderCheckout();
  if (state.view === "product") return renderProductPage();
  if (state.view === "tracking") { try { await loadOrders(); } catch(error) { toast(error.message); } return renderTracking(); }
  if (state.view === "login" || state.view === "register") return renderAuth();
  if (state.view === "recover") return renderRecovery();
  if (state.view === "verify") return openVerify();
  if (state.view === "orders") {
    try { await loadOrders(); } catch (error) { toast(error.message); state.view = "login"; return renderAuth(); }
    return renderOrders();
  }
  if (state.view === "producer") {
    if (state.user) {
      try { state.producerProducts = (await api("/producer/products")).products || []; await loadOrders(); } catch (_) {}
    }
    return renderProducer();
  }
  if (state.view === "admin") return renderAdmin();
  if (state.view === "admin-orders") return renderAdminOrders();
  if (state.view === "admin-catalog") return renderAdminCatalog();
  if (state.view === "admin-settings") return renderAdminSettings();
  state.view = "home"; renderHome();
}
function openProduct(id) {
  const p = state.products.find(function(product){return product.id===Number(id);});
  if (!p) return;
  state.selectedProductId=p.id;state.productQuantity=1;go("product");
}
function setViewFromClick(target) {
  const nav = target.closest("[data-nav]");
  if (nav) { document.getElementById("account-menu")?.remove(); if(nav.dataset.nav==="checkout") state.checkoutStep="delivery"; go(nav.dataset.nav); return true; }
  if (target.closest("[data-action='cart']")) { go("cart"); return true; }
  if (target.closest("[data-action='account']")) { if (!state.user) go("login"); return !state.user; }
  if (target.closest("[data-action='login']")) { go("login"); return true; }
  return false;
}

document.addEventListener("click", async function(event) {
  const target = event.target;
  if (setViewFromClick(target)) return;
  const add = target.closest("[data-add]");
  if (add) { addToCart(add.dataset.add,Number(add.dataset.quantity)||1); modalRoot.innerHTML = ""; return; }
  const open = target.closest("[data-open]");
  if (open) { openProduct(open.dataset.open); return; }
  const detailQty=target.closest("[data-detail-qty]");
  if(detailQty){const product=state.products.find(function(p){return p.id===Number(state.selectedProductId);});if(product){state.productQuantity=Math.max(1,Math.min(product.stock,state.productQuantity+Number(detailQty.dataset.detailQty)));renderProductPage();}return;}
  const track=target.closest("[data-track]");
  if(track){state.selectedOrderId=Number(track.dataset.track);go("tracking");return;}
  const category = target.closest("[data-category]");
  if (category) { state.category = category.dataset.category; renderHome(); return; }
  const orderFilter=target.closest("[data-admin-order-filter]");
  if(orderFilter){state.adminOrderFilter=orderFilter.dataset.adminOrderFilter;renderAdminOrders();return;}
  const catalogFilter=target.closest("[data-admin-catalog-filter]");
  if(catalogFilter){state.adminCatalogFilter=catalogFilter.dataset.adminCatalogFilter;renderAdminCatalog();return;}
  const editProduct=target.closest("[data-edit-product]");
  if(editProduct){state.editingProductId=Number(editProduct.dataset.editProduct);productFormModal();return;}
  if(target.closest('[data-new-product]')){state.editingProductId=null;productFormModal();return;}
  if(target.closest('[data-toggle-products]')){state.producerProductsOpen=!state.producerProductsOpen;renderProducer();if(state.producerProductsOpen)document.querySelector('.fx-products')?.scrollIntoView({behavior:'smooth',block:'start'});return;}
  const toggleProduct=target.closest('[data-toggle-product]');
  if(toggleProduct){try{await api('/products/'+toggleProduct.dataset.toggleProduct+'/toggle',{method:'POST',body:{}});toast('Disponibilité mise à jour.');await go('producer');}catch(error){toast(error.message);}return;}
  const deltaButton = target.closest("[data-qty]");
  if (deltaButton) {
    const id = Number(deltaButton.dataset.qty), delta = Number(deltaButton.dataset.delta);
    const line = state.cart.find(function(item){return item.product_id===id;});
    const p = state.products.find(function(item){return item.id===id;});
    if (line && p) {
      line.quantity = Math.max(1, Math.min(p.stock, line.quantity + delta));
      saveCart(); renderCart();
    }
    return;
  }
  const removeButton = target.closest("[data-remove]");
  if (removeButton) { state.cart = state.cart.filter(function(item){return item.product_id!==Number(removeButton.dataset.remove);}); saveCart(); renderCart(); return; }
  if (target.closest("[data-close-modal]") || target.matches("[data-backdrop]")) { modalRoot.innerHTML = ""; state.editingProductId=null; return; }
  const role = target.closest("[data-role]");
  if (role) { state.registerRole = role.dataset.role; renderAuth(); return; }
  const checkoutNext = target.closest("[data-checkout-next]");
  if (checkoutNext) {
    const form = document.getElementById("checkout-form");
    if (!form || !form.reportValidity()) return;
    Object.assign(state.checkoutData, Object.fromEntries(new FormData(form).entries()));
    if (state.checkoutData.delivery_address) persist("madaagri-address", state.checkoutData.delivery_address);
    state.editingAddress = false;
    state.checkoutStep = checkoutNext.dataset.checkoutNext;
    renderCheckout(); return;
  }
  if(target.closest("[data-phone-edit]")){state.phoneVerify=Object.assign({},state.phoneVerify||{},{editing:true});renderVerify();return;}
  if(target.closest("[data-phone-cancel-edit]")){state.phoneVerify=Object.assign({},state.phoneVerify||{},{editing:false});renderVerify();return;}
  const resend=target.closest("[data-phone-resend]");
  if(resend){resend.disabled=true;try{await sendPhoneCode();toast("Nouveau code envoyé.");renderVerify();}catch(error){toast(error.message);resend.disabled=false;}return;}
  if(target.closest("[data-address-edit]")){const form=document.getElementById("checkout-form");if(form)Object.assign(state.checkoutData,Object.fromEntries(new FormData(form).entries()));state.editingAddress=true;renderCheckout();document.getElementById("delivery-address-input")?.focus();return;}
  if(target.closest("[data-checkout-back]")){state.checkoutStep="delivery";renderCheckout();return;}
  if (target.closest("[data-action='how-it-works']")) { document.getElementById("comment-ca-marche")?.scrollIntoView({behavior:"smooth"}); return; }
  if (target.closest("[data-action='favorites']")) { toast("Vos favoris seront bientôt disponibles."); return; }
  if (target.closest("[data-action='google-login']")) { toast("La connexion Google sera disponible après configuration du service."); return; }
  if (target.closest("[data-action='show-all']")) { state.category="Tout"; state.search=""; renderHome(); return; }
  const statusButton = target.closest("[data-order-status]");
  if (statusButton) {
    statusButton.disabled = true;
    const reason=statusButton.dataset.status==='cancelled'?prompt("Motif de l’annulation (obligatoire) :"):'';
    if(statusButton.dataset.status==='cancelled' && (!reason || reason.trim().length<5)){statusButton.disabled=false;toast('Indiquez un motif d’au moins 5 caractères.');return;}
    try { await api("/orders/" + statusButton.dataset.orderStatus + "/status", {method:"POST",body:{status:statusButton.dataset.status,reason:reason||''}}); toast("Le statut de la commande a été mis à jour."); await go(state.view); }
    catch(error) { toast(error.message); statusButton.disabled=false; }
    return;
  }
  const deliveryStart=target.closest("[data-delivery-start]");
  if(deliveryStart){deliveryStart.disabled=true;try{await api("/orders/"+deliveryStart.dataset.deliveryStart+"/delivery/status",{method:"POST",body:{status:"in_transit"}});toast("Livraison démarrée. L’acheteur est prévenu.");await go(state.view);}catch(error){toast(error.message);deliveryStart.disabled=false;}return;}
  const deliveryAccept=target.closest("[data-delivery-accept]");
  if(deliveryAccept){const accepted=deliveryAccept.dataset.accepted==="1";if(!accepted&&!confirm("Refuser ces frais annule la commande. Continuer ?"))return;deliveryAccept.disabled=true;try{await api("/orders/"+deliveryAccept.dataset.deliveryAccept+"/delivery/accept",{method:"POST",body:{accepted:accepted}});toast(accepted?"Frais acceptés. Le producteur peut confirmer la commande.":"Commande annulée.");await go(state.view);}catch(error){toast(error.message);deliveryAccept.disabled=false;}return;}
  const support=target.closest("[data-support]");
  if(support){const order=state.orders.find(o=>o.id===Number(support.dataset.support));if(order&&order.status==="delivered"&&state.user.role==="buyer"){support.closest(".fx-page").querySelector("[data-claim]")?.click();}else{toast("Notez la référence "+(order?order.code:"")+" : le producteur vous contacte pour toute question avant la remise.");}return;}
  const paymentConfirm = target.closest("[data-payment-confirm]");
  if (paymentConfirm) {
    const reference = prompt("Saisissez la référence d’un reçu réellement vérifié ou la confirmation de remise en espèces :");
    if (reference === null) return;
    if (reference.trim().length < 5) { toast("Indiquez une référence ou un reçu vérifié."); return; }
    paymentConfirm.disabled = true;
    try { await api("/orders/" + paymentConfirm.dataset.paymentConfirm + "/payment", {method:"POST",body:{reference:reference.trim()}}); toast("Paiement confirmé manuellement."); await go(state.view); }
    catch(error) { toast(error.message); paymentConfirm.disabled = false; }
    return;
  }
  const moderate = target.closest("[data-moderate]");
  if (moderate) {
    try { await api("/products/" + moderate.dataset.moderate + "/moderate", {method:"POST",body:{status:moderate.dataset.status}}); modalRoot.innerHTML=""; toast("Décision enregistrée."); await (state.view==="admin-catalog"?renderAdminCatalog():renderAdmin()); }
    catch(error) { toast(error.message); }
    return;
  }
  const examine=target.closest("[data-examine-product]");
  if(examine){const p=(state.admin.products||[]).find(x=>x.id===Number(examine.dataset.examineProduct));if(p){modalRoot.innerHTML='<div class="modal-backdrop" data-backdrop><div class="fx-modal fx-examine" role="dialog" aria-modal="true"><button class="modal-close" type="button" data-close-modal aria-label="Fermer">×</button><img src="'+photo(p.image)+'" alt=""><span class="fx-pill warm">En attente</span><h2 class="fx-title">'+esc(p.name)+'</h2><p class="fx-modal-lead">'+esc(p.producer_name)+' · '+esc(p.region)+' · '+esc(p.category)+'</p><div class="fx-kv"><span>Prix</span><b>'+money(p.price)+' / '+esc(p.unit)+'</b></div><div class="fx-kv"><span>Stock annoncé</span><b>'+esc(p.stock)+' '+esc(p.unit)+'</b></div><p class="fx-examine-desc">'+esc(p.description||'Sans description.')+'</p><div class="fx-modal-actions"><button class="button outline" data-moderate="'+p.id+'" data-status="rejected">Refuser</button><button class="button" data-moderate="'+p.id+'" data-status="published">Publier la fiche</button></div></div></div>';}return;}
  const openProducer=target.closest("[data-open-producer]");
  if(openProducer){const u=(state.admin.users||[]).find(x=>x.id===Number(openProducer.dataset.openProducer));if(u){const own=(state.admin.products||[]).filter(p=>p.producer_id===u.id);modalRoot.innerHTML='<div class="modal-backdrop" data-backdrop><div class="fx-modal" role="dialog" aria-modal="true"><button class="modal-close" type="button" data-close-modal aria-label="Fermer">×</button><h2 class="fx-title">'+esc(u.name)+'</h2><p class="fx-modal-lead">Demande de compte producteur</p><div class="fx-kv"><span>E-mail</span><b>'+esc(u.email)+'</b></div><div class="fx-kv"><span>Téléphone</span><b>'+(u.phone?esc(u.phone)+(u.phone_verified?' · vérifié':' · non vérifié'):'Non renseigné')+'</b></div><div class="fx-kv"><span>Fiches déposées</span><b>'+own.length+'</b></div><p class="fx-examine-desc">Vérifiez l’identité et la zone de production avant d’autoriser la publication de fiches.</p><div class="fx-modal-actions"><button class="button outline" type="button" data-close-modal>Plus tard</button><button class="button" data-verify="'+u.id+'">Vérifier le producteur</button></div></div></div>';}return;}
  const verify = target.closest("[data-verify]");
  if (verify) {
    try { await api("/users/" + verify.dataset.verify + "/verify", {method:"POST",body:{verified:true}}); modalRoot.innerHTML=""; toast("Producteur vérifié."); await renderAdmin(); }
    catch(error) { toast(error.message); }
    return;
  }
  const accountActive=target.closest("[data-user-active]");
  if(accountActive){
    try { await api("/users/"+accountActive.dataset.userActive+"/active",{method:"POST",body:{active:accountActive.dataset.active==="1"}});toast("Accès au compte mis à jour.");await renderAdminSettings(); }
    catch(error){toast(error.message);}return;
  }
  const claimDecision=target.closest('[data-claim-decision]');
  if(claimDecision){const row=claimDecision.closest('.claim-row'),resolution=row?.querySelector('textarea')?.value.trim()||'';if(resolution.length<5){toast('Décrivez la décision en cinq caractères au moins.');return;}try{await api('/claims/'+claimDecision.dataset.claimDecision+'/resolve',{method:'POST',body:{status:claimDecision.dataset.status,resolution}});toast('Réclamation traitée.');await renderAdmin();}catch(error){toast(error.message);}return;}
  const review = target.closest("[data-review]");
  if (review) {
    const rating = Number(prompt("Votre note de 1 à 5 pour cette commande :"));
    if (!rating) return;
    const comment = prompt("Votre avis (facultatif) :") || "";
    try { await api("/reviews", {method:"POST",body:{order_code:review.dataset.review,rating:rating,comment:comment}}); toast("Merci, votre avis a été enregistré."); }
    catch(error) { toast(error.message); }
    return;
  }
  const claim = target.closest("[data-claim]");
  if (claim) {
    const details = prompt("Décrivez le problème rencontré :");
    if (!details) return;
    try { await api("/claims", {method:"POST",body:{order_code:claim.dataset.claim,reason:"quality",details:details}}); toast("Votre réclamation est enregistrée."); await go("orders"); }
    catch(error) { toast(error.message); }
    return;
  }
  if (target.closest("[data-export]")) {
    window.location.href = "/?__mada=admin%2Fexport"; return;
  }
  if (target.closest("[data-scroll-products]")) { document.getElementById("marche").scrollIntoView({behavior:"smooth"}); return; }
  if (target.closest("[data-action='focus-search']")) {
    if (state.view !== "home") await go("home");
    document.body.dataset.searchOpen="true";
    const visibleInput = Array.from(document.querySelectorAll("#search-input,#header-search-input")).find(function(input){return input.getClientRects().length;});
    if (visibleInput) visibleInput.focus();
    return;
  }
  if (target.closest("[data-action='menu']")) {
    const existing = document.getElementById("mobile-menu-panel");
    if (existing) existing.remove();
    else {
      const panel=document.createElement("div"); panel.id="mobile-menu-panel"; panel.style.cssText="position:fixed;z-index:30;top:92px;right:12px;background:white;padding:12px 18px;border:1px solid #e8e9e4;border-radius:10px;box-shadow:0 14px 42px #18392b18;display:grid;gap:14px;font-size:12px";
      panel.innerHTML='<button class="text-button" data-nav="home">Le marché</button><button class="text-button" data-nav="producer">Espace producteur</button><button class="text-button" data-nav="orders">Mes commandes</button><button class="text-button" data-nav="admin">Administration</button>'; document.body.appendChild(panel);
    }
    return;
  }
  if (target.closest("[data-action='logout']")) {
    try { await api("/logout",{method:"POST",body:{}}); document.getElementById("account-menu")?.remove(); state.user=null;state.orders=[];state.cart=[];saveCart();await refresh();await go("home");toast("Vous êtes déconnecté."); } catch(error) { toast(error.message); }
  }
});

document.addEventListener("input", function(event) {
  if (event.target.id === "search-input" || event.target.id === "header-search-input") {
    state.search = event.target.value;
    if (state.view !== "home") return;
    const inputId = event.target.id, cursor = event.target.selectionStart;
    renderHome();
    const input = document.getElementById(inputId);
    if (input) { input.focus(); input.setSelectionRange(cursor,cursor); }
  }
});
document.addEventListener("keydown", function(event) {
  if (event.target.classList && event.target.classList.contains("otp-input") && event.key === "Backspace" && !event.target.value) {
    const boxes=Array.from(document.querySelectorAll(".otp-input")), previous=boxes[boxes.indexOf(event.target)-1];
    if (previous) { previous.value=""; previous.focus(); event.preventDefault(); }
  }
  if ((event.target.id === "header-search-input" || event.target.id === "search-input") && event.key === "Enter" && state.view !== "home") go("home");
});
document.addEventListener("change", function(event) {
  if (event.target.id === "sort-select") { state.sort = event.target.value; renderHome(); }
  if (event.target.matches("[data-catalog-producer]")) { state.adminCatalogProducer = event.target.value; renderAdminCatalog(); }
});
document.addEventListener("submit", async function(event) {
  const form = event.target;
  if (form.matches("[data-quote-order]")) {
    event.preventDefault();
    const values=Object.fromEntries(new FormData(form).entries()), submit=form.querySelector('button[type="submit"]'); submit.disabled=true;
    try { await api("/orders/"+form.dataset.quoteOrder+"/delivery",{method:"POST",body:{fee:Number(values.fee),zone:values.zone,responsible:values.responsible}}); toast("Tarif envoyé à l’acheteur."); await go(state.view); }
    catch(error) { toast(error.message); submit.disabled=false; }
    return;
  }
  if (!["auth-form","checkout-form","product-form","reset-request-form","reset-confirm-form","admin-settings-form","phone-verify-form","phone-change-form"].includes(form.id)) return;
  event.preventDefault();
  const values = Object.fromEntries(new FormData(form).entries());
  const submit = form.querySelector('button[type="submit"]'); if (submit) submit.disabled = true;
  try {
    if(form.id==="admin-settings-form"){
      const split=value=>String(value||"").split(/\r?\n/).map(item=>item.trim()).filter(Boolean);
      await api("/admin/settings",{method:"POST",body:{categories:split(values.categories),units:split(values.units),zones:split(values.zones),commission_percent:Number(values.commission_percent),service_fee:Number(values.service_fee)}});
      toast("Paramètres enregistrés.");await refresh();await go("admin-settings");return;
    }
    if (form.id === "auth-form") {
      if (state.view === "register") {
        await api("/register",{method:"POST",body:{name:[values.name,values.surname].filter(Boolean).join(" "),phone:values.phone,email:values.email,password:values.password,role:state.registerRole}});
      } else {
        await api("/login",{method:"POST",body:{email:values.email,password:values.password}});
      }
      const registered = state.view === "register";
      await refresh();
      if (registered) { state.phoneVerify=null; await go("verify"); toast("Compte créé. Vérifiez votre numéro."); return; }
      const next = state.loginNext || (state.user.role==="admin" ? "admin" : state.user.role==="producer" ? "producer" : "orders");
      state.loginNext = null; await go(next);
      toast(state.user.role==="producer" && !state.user.verified ? "Votre compte producteur attend sa vérification." : "Bienvenue sur MadaAgri.");
      return;
    }
    if (form.id === "phone-change-form") {
      await sendPhoneCode(values.phone); toast("Code envoyé au " + state.phoneVerify.phone + "."); renderVerify(); return;
    }
    if (form.id === "phone-verify-form") {
      const code=Array.from(form.querySelectorAll(".otp-input")).map(function(input){return input.value;}).join("");
      if (!/^\d{6}$/.test(code)) throw new Error("Saisissez les 6 chiffres du code.");
      await api("/phone/verify",{method:"POST",body:{code:code}});
      state.phoneVerify=null; await refresh();
      const next=state.loginNext; state.loginNext=null;
      toast("Numéro vérifié. Bienvenue sur MadaAgri.");
      await go(next || (state.user.role==="producer" ? "producer" : "home")); return;
    }
    if (form.id === "reset-request-form") {
      state.resetEmail=values.email;
      const result=await api("/password-reset/request",{method:"POST",body:{email:values.email}});
      state.resetToken=result.demo_token||null;
      if(!state.resetToken) toast(result.message||"Si le compte existe, les instructions seront envoyées.");
      await go("recover"); return;
    }
    if (form.id === "reset-confirm-form") {
      if(values.password!==values.confirm_password)throw new Error("Les deux mots de passe ne correspondent pas.");
      await api("/password-reset/confirm",{method:"POST",body:{token:values.token,password:values.password}});
      state.resetToken=null; state.resetEmail=""; toast("Mot de passe mis à jour. Connectez-vous."); await go("login"); return;
    }
    if (form.id === "checkout-form") {
      Object.assign(state.checkoutData, values);
      const orderItems = state.cart.map(function(line){const product=state.products.find(function(item){return item.id===line.product_id;});return product?{name:product.name,image:product.image,unit:product.unit,price:product.price,quantity:line.quantity}:null;}).filter(Boolean);
      const result = await api("/orders",{method:"POST",body:{
        items:state.cart,delivery_method:values.delivery_method,payment_method:values.payment_method,
        delivery_address:values.delivery_address || "",payment_phone:values.payment_phone || "",note:values.note || ""
      }});
      state.lastOrder={code:result.code,items:orderItems,paymentMethod:values.payment_method,deliveryMethod:values.delivery_method};
      state.cart=[]; saveCart(); await refresh();
      state.view="orders"; renderOrderConfirmation(result,orderItems,values.payment_method); toast("Commande créée : " + result.code); return;
    }
    if (form.id === "product-form") {
      const file = values.photo_file;
      delete values.photo_file;
      if (file && file.size) {
        if (file.size > 2_000_000 || !["image/png","image/jpeg","image/webp"].includes(file.type)) throw new Error("Utilisez une photo PNG, JPEG ou WebP de 2 Mo maximum.");
        const encoded = await new Promise(function(resolve,reject){const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(",")[1]);reader.onerror=()=>reject(new Error("La photo n’a pas pu être lue."));reader.readAsDataURL(file);});
        values.image = (await api("/uploads",{method:"POST",body:{data:encoded}})).image;
      }
      await api(state.editingProductId?"/products/"+state.editingProductId+"/update":"/products",{method:"POST",body:values});
      toast(state.editingProductId?"Fiche mise à jour.":"Fiche envoyée à la modération.");state.editingProductId=null;modalRoot.innerHTML="";await go(state.view==="admin-catalog"?"admin-catalog":"producer"); return;
    }
  } catch(error) { toast(error.message); if (submit) submit.disabled=false; }
});

document.addEventListener("click", function(event) {
  if (event.target.closest("[data-action='account']") && state.user) {
    const existing = document.getElementById("account-menu");
    if (existing) existing.remove();
    else {
      const panel=document.createElement("div"); panel.id="account-menu"; panel.style.cssText="position:fixed;z-index:31;top:93px;right:75px;background:white;padding:15px;border:1px solid #e8e9e4;border-radius:10px;box-shadow:0 14px 42px #18392b18;display:grid;gap:11px;min-width:175px;font-size:11px";
      panel.innerHTML='<b>'+esc(state.user.name)+'</b><button class="text-button" data-nav="'+(state.user.role==="admin"?"admin":state.user.role==="producer"?"producer":"orders")+'">'+(state.user.role==="producer"?"Espace producteur":state.user.role==="admin"?"Back-office":"Mes commandes")+'</button>'+(state.user.role==="admin"?'<button class="text-button" data-nav="admin-orders">Commandes</button><button class="text-button" data-nav="admin-catalog">Catalogue produits</button><button class="text-button" data-nav="admin-settings">Comptes et paramètres</button>':'')+(state.user.role!=="admin"&&!state.user.phone_verified?'<button class="text-button" data-nav="verify">Vérifier mon numéro</button>':'')+'<button class="text-button" data-action="logout">Se déconnecter</button>'; document.body.appendChild(panel);
    }
  }
});

document.addEventListener("input",function(event){
  const otp=event.target.closest&&event.target.closest(".otp-input");
  if(otp){
    const digits=otp.value.replace(/\D/g,"");
    const boxes=Array.from(document.querySelectorAll(".otp-input")), index=boxes.indexOf(otp);
    if(digits.length>1){digits.slice(0,6-index).split("").forEach(function(d,i){if(boxes[index+i])boxes[index+i].value=d;});(boxes[Math.min(index+digits.length,6)-1]||otp).focus();}
    else{otp.value=digits;if(digits&&boxes[index+1])boxes[index+1].focus();}
    if(boxes.every(function(b){return b.value;})) document.getElementById("phone-verify-form")?.requestSubmit();
    return;
  }
  if(event.target.id!=="admin-account-search")return;
  const query=event.target.value.trim().toLocaleLowerCase("fr");
  document.querySelectorAll("[data-account-row]").forEach(row=>{row.hidden=!row.textContent.toLocaleLowerCase("fr").includes(query);});
});

refresh();

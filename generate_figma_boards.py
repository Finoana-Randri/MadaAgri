from pathlib import Path
from io import BytesIO
from PIL import Image
import base64
import html

ROOT = Path(__file__).resolve().parent
PHOTOS = ROOT / "assets" / "product-photos"
OUT = ROOT / "figma-import"
OUT.mkdir(exist_ok=True)

P = {
    "forest": "#214b37", "forest2": "#315f46", "leaf": "#e8efdf",
    "cream": "#f7f6ef", "paper": "#fffefa", "ink": "#1d2921",
    "muted": "#778078", "line": "#e6e8df", "orange": "#df7444",
    "gold": "#e4b858", "white": "#ffffff", "soft": "#f0f2e9",
    "pending": "#fbf1df", "pendingText": "#a76a22"
}

def photo_data(name, max_size=900):
    im = Image.open(PHOTOS / name).convert("RGB")
    im.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
    buf = BytesIO()
    im.save(buf, format="JPEG", quality=68, optimize=True)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode("ascii")

PHOTOS_DATA = {
    "tomato": photo_data("tomates.png"),
    "rice": photo_data("riz-rouge.png"),
    "greens": photo_data("bredes-mafana.png"),
    "banana": photo_data("bananes.png"),
    "eggplant": photo_data("aubergines-piments.png"),
    "market": photo_data("hero-marche.png", 1100),
}

class Board:
    def __init__(self, mobile):
        self.mobile = mobile
        self.w = 390 if mobile else 1440
        self.h = 844 if mobile else 960
        self.gap_x = 36 if mobile else 52
        self.gap_y = 66 if mobile else 62
        self.margin = 54 if mobile else 64
        self.title_h = 52
        self.parts = []
        self.image_counter = 0

    def add(self, s):
        self.parts.append(s)

    def rect(self, x, y, w, h, fill, r=0, stroke=None, sw=1, opacity=1):
        stroke_attr = f' stroke="{stroke}" stroke-width="{sw}"' if stroke else ""
        op = f' opacity="{opacity}"' if opacity != 1 else ""
        self.add(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}"{stroke_attr}{op}/>')

    def line(self, x1, y1, x2, y2, color=None, sw=1):
        self.add(f'<path d="M{x1} {y1} L{x2} {y2}" fill="none" stroke="{color or P["line"]}" stroke-width="{sw}"/>')

    def text(self, x, y, value, size=14, color=None, weight=400, anchor="start", letter=0):
        v = html.escape(str(value), quote=False)
        self.add(f'<text x="{x}" y="{y}" fill="{color or P["ink"]}" font-family="Inter,Arial,sans-serif" font-size="{size}" font-weight="{weight}" text-anchor="{anchor}" letter-spacing="{letter}">{v}</text>')

    def image(self, x, y, w, h, key, r=12):
        self.image_counter += 1
        clip = f"photo-clip-{self.image_counter}"
        self.add(f'<defs><clipPath id="{clip}"><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}"/></clipPath></defs>')
        self.add(f'<image x="{x}" y="{y}" width="{w}" height="{h}" href="{PHOTOS_DATA[key]}" preserveAspectRatio="xMidYMid slice" clip-path="url(#{clip})"/>')

    def button(self, x, y, w, h, label, fill=None, color=None, outline=False, size=13):
        fill = fill or P["forest"]
        color = color or P["white"]
        self.rect(x, y, w, h, P["paper"] if outline else fill, 12, P["line"] if outline else None)
        self.text(x+w/2, y+h/2+size*.34, label, size, P["forest"] if outline else color, 700, "middle")

    def pill(self, x, y, label, fill=None, color=None, w=None):
        w = w or max(82, int(len(label)*6.6+22))
        self.rect(x, y, w, 27, fill or P["leaf"], 14)
        self.text(x+w/2, y+18, label, 10, color or P["forest"], 700, "middle")
        return w

    def title_label(self, x, y, label, idx):
        self.text(x, y, f"{idx:02d}  /  {label}", 13, P["forest"], 750)

    def header(self):
        if self.mobile:
            self.rect(0, 0, self.w, 68, P["paper"])
            self.rect(18, 16, 36, 36, P["forest"], 12)
            self.text(36, 40, "M", 20, P["white"], 800, "middle")
            self.text(66, 33, "MadaAgri", 16, P["forest"], 800)
            self.text(66, 49, "MARCHÉ LOCAL", 8, P["muted"], 700, letter=1)
            self.rect(324, 17, 46, 36, P["paper"], 12, P["line"])
            self.text(347, 41, "▱", 17, P["forest"], 700, "middle")
        else:
            self.rect(0, 0, self.w, 31, P["forest"])
            self.text(74, 20, "Des produits frais, directement des producteurs malgaches", 11, "#edf4e7", 500)
            self.text(1365, 20, "Antananarivo  ·  Français", 10, "#edf4e7", 500, "end")
            self.rect(0, 31, self.w, 81, P["paper"])
            self.rect(72, 50, 42, 42, P["forest"], 13)
            self.text(93, 79, "M", 23, P["white"], 800, "middle")
            self.text(124, 69, "MadaAgri", 20, P["forest"], 800)
            self.text(125, 85, "LE MARCHÉ DE NOS TERROIRS", 8, P["muted"], 700, letter=1)
            self.text(326, 78, "Marché", 12, P["forest"], 700)
            self.text(419, 78, "Producteurs", 12, P["muted"], 600)
            self.text(535, 78, "Comment ça marche", 12, P["muted"], 600)
            self.rect(736, 49, 333, 46, "#fbfbf7", 12, P["line"])
            self.text(756, 77, "⌕  Rechercher tomates, riz, brèdes…", 11, P["muted"], 400)
            self.rect(1085, 49, 48, 46, P["paper"], 12, P["line"])
            self.text(1109, 79, "♡", 18, P["forest"], 500, "middle")
            self.rect(1147, 49, 95, 46, P["paper"], 12, P["line"])
            self.text(1194, 77, "Panier  2", 11, P["forest"], 700, "middle")
            self.rect(1257, 50, 42, 42, P["leaf"], 21)
            self.text(1278, 77, "FR", 10, P["forest"], 800, "middle")

    def footer_mobile(self):
        self.rect(0, 782, 390, 62, P["paper"])
        self.line(0, 782, 390, 782)
        for x, icon, label, active in [(38,"⌂","Accueil",True),(116,"⌕","Marché",False),(194,"▱","Panier",False),(272,"◷","Commandes",False),(350,"◉","Compte",False)]:
            c = P["forest"] if active else P["muted"]
            self.text(x, 810, icon, 17, c, 700, "middle")
            self.text(x, 828, label, 8, c, 650, "middle")

    def start_screen(self, idx, name):
        self.rect(0, 0, self.w, self.h, P["cream"])
        self.header()
        self.title_label(22 if self.mobile else 72, 98 if self.mobile else 147, name, idx)

    def card(self, x, y, w, h, fill=P["paper"], r=16, stroke=P["line"]):
        self.rect(x, y, w, h, fill, r, stroke)

    def input(self, x, y, w, label, placeholder):
        self.text(x, y, label, 10, P["ink"], 700)
        self.rect(x, y+10, w, 43, P["white"], 10, P["line"])
        self.text(x+13, y+37, placeholder, 11, P["muted"], 400)

    def footer(self):
        if self.mobile: self.footer_mobile()

    def screen_home(self):
        self.start_screen(1, "Marché")
        if self.mobile:
            self.image(14, 113, 362, 205, "market", 18)
            self.rect(14, 113, 362, 205, P["forest"], 18, opacity=.74)
            self.text(32, 151, "DU CHAMP À VOTRE TABLE", 8, "#dce8d2", 700, letter=1)
            self.text(32, 190, "Les bons produits,", 22, P["white"], 800)
            self.text(32, 216, "directement du producteur.", 20, P["white"], 800)
            self.text(32, 246, "Les récoltes de nos régions, près de chez vous.", 10, "#edf4e7", 500)
            self.button(32, 264, 155, 37, "Explorer le marché", P["leaf"], P["forest"], size=10)
            self.text(18, 355, "Récoltes du moment", 17, P["ink"], 750)
            self.text(372, 355, "Tout voir →", 9, P["forest"], 700, "end")
            xs=[14,202,14,202]; ys=[371,371,576,576]
            keys=["tomato","rice","greens","banana"]
            titles=["Tomates bien mûres","Riz rouge de Madagascar","Brèdes mafana","Bananes mûres"]
            prices=["3 500 Ar / kg","12 000 Ar / sac","2 000 Ar / botte","4 000 Ar / régime"]
            for i,(x,y,key,title,price) in enumerate(zip(xs,ys,keys,titles,prices)):
                self.card(x,y,174,190)
                self.image(x,y,174,92,key,14)
                self.text(x+10,y+111,title,10,P["ink"],750)
                self.text(x+10,y+130,"Producteur vérifié · Madagascar",7,P["muted"],500)
                self.text(x+10,y+155,price,9,P["forest"],750)
                self.rect(x+140,y+148,25,25,P["leaf"],9)
                self.text(x+152,y+166,"+",15,P["forest"],800,"middle")
            self.footer()
        else:
            self.image(72, 164, 1296, 294, "market", 21)
            self.rect(72, 164, 1296, 294, P["forest"], 21, opacity=.76)
            self.rect(72, 164, 1296, 294, "url(#hero-gradient)", 21)
            self.text(116, 216, "LE GOÛT DU TERROIR, PRÈS DE CHEZ VOUS", 10, "#dce8d2", 700, letter=1)
            self.text(116, 272, "Les bons produits,", 42, P["white"], 800)
            self.text(116, 318, "directement du producteur.", 38, P["white"], 800)
            self.text(116, 356, "Découvrez les récoltes de producteurs malgaches et commandez simplement.", 14, "#edf4e7", 450)
            self.button(116, 388, 190, 46, "Explorer le marché  →", P["leaf"], P["forest"], size=12)
            self.text(72, 507, "Choisir par catégorie", 19, P["ink"], 750)
            chips=["Tout voir","Légumes","Fruits","Riz & céréales","Feuilles","Épices"]
            xx=72
            for i,ch in enumerate(chips):
                ww=self.pill(xx,524,ch,P["forest"] if i==0 else P["paper"],P["white"] if i==0 else P["muted"],None)
                xx += ww+9
            self.text(72, 601, "Les récoltes du moment", 21, P["ink"], 750)
            self.text(1368, 601, "Voir tout →", 11, P["forest"], 700, "end")
            keys=["tomato","rice","greens","banana"]
            titles=["Tomates bien mûres","Riz rouge de Madagascar","Brèdes mafana","Bananes mûres"]
            sellers=["Ferme RAKOTO · Antsirabe","Coopérative Vary Tsara · Fianarantsoa","Potager de Lalao · Analamanga","Ferme Soa · Itasy"]
            prices=["3 500 Ar / kg","12 000 Ar / sac 5 kg","2 000 Ar / botte","4 000 Ar / régime"]
            for i,(key,title,seller,price) in enumerate(zip(keys,titles,sellers,prices)):
                x=72+i*315
                self.card(x,619,295,277)
                self.image(x,619,295,151,key,16)
                self.pill(x+13,632,"Récolté ce matin",P["paper"],P["forest"],126)
                self.text(x+16,795,title,14,P["ink"],750)
                self.text(x+16,815,seller,9,P["muted"],500)
                self.text(x+16,850,price,12,P["forest"],800)
                self.text(x+16,874,"★ 4,9  ·  Producteur vérifié",9,P["pendingText"],600)
                self.rect(x+248,846,31,31,P["leaf"],10)
                self.text(x+263,868,"+",17,P["forest"],800,"middle")

    def screen_login(self):
        self.start_screen(2, "Connexion & inscription")
        if self.mobile:
            self.rect(14,116,362,644,P["paper"],20,P["line"])
            self.text(34,157,"Ravi de vous revoir",22,P["ink"],800)
            self.text(34,182,"Connectez-vous pour retrouver vos commandes.",10,P["muted"],450)
            self.text(34,229,"Connexion",10,P["forest"],750)
            self.text(116,229,"Créer un compte",10,P["muted"],600)
            self.line(34,240,96,240,P["forest"],2)
            self.input(34,267,322,"Téléphone ou e-mail","ex. nom@email.com")
            self.input(34,344,322,"Mot de passe","••••••••••")
            self.text(356,420,"Mot de passe oublié ?",9,P["forest"],650,"end")
            self.button(34,445,322,45,"Se connecter")
            self.text(195,518,"ou continuer avec",9,P["muted"],500,"middle")
            self.button(34,536,322,42,"Continuer avec Google",P["white"],P["ink"],True,10)
            self.rect(34,593,322,1,P["line"])
            self.text(195,621,"Nouveau sur MadaAgri ?",9,P["muted"],500,"middle")
            self.button(34,641,322,42,"Créer un compte acheteur",P["leaf"],P["forest"],False,10)
            self.text(195,718,"Producteur ?  Accéder à mon espace →",9,P["forest"],700,"middle")
            self.footer()
        else:
            self.image(72,170,625,710,"market",22)
            self.rect(72,170,625,710,P["forest"],22,opacity=.72)
            self.text(112,253,"MADAGASCAR · MARCHÉ DIRECT",10,"#deead4",750,letter=1)
            self.text(112,320,"Le meilleur du",38,P["white"],800)
            self.text(112,365,"terroir vous attend.",38,P["white"],800)
            self.text(112,414,"Un compte unique pour acheter local, suivre vos commandes",13,"#e6eee2",450)
            self.text(112,438,"ou vendre les produits de votre ferme.",13,"#e6eee2",450)
            self.pill(112,488,"✓ Producteurs malgaches vérifiés",P["leaf"],P["forest"],232)
            self.card(751,170,617,710)
            self.text(801,228,"Ravi de vous revoir",29,P["ink"],800)
            self.text(801,255,"Connectez-vous pour retrouver vos commandes.",12,P["muted"],450)
            self.text(801,303,"Connexion",12,P["forest"],750)
            self.text(905,303,"Créer un compte",12,P["muted"],600)
            self.line(801,314,877,314,P["forest"],2)
            self.input(801,348,515,"Téléphone ou e-mail","ex. nom@email.com")
            self.input(801,430,515,"Mot de passe","Saisissez votre mot de passe")
            self.text(1316,502,"Mot de passe oublié ?",10,P["forest"],650,"end")
            self.button(801,531,515,49,"Se connecter  →")
            self.text(1058,612,"ou continuer avec",10,P["muted"],500,"middle")
            self.button(801,632,515,45,"Continuer avec Google",P["white"],P["ink"],True,11)
            self.line(801,709,1316,709)
            self.text(1058,742,"Nouveau sur MadaAgri ?",10,P["muted"],500,"middle")
            self.text(1058,775,"Créer un compte acheteur  →",12,P["forest"],750,"middle")
            self.text(1058,824,"Vous êtes producteur ?  Accéder à mon espace",10,P["forest"],650,"middle")

    def screen_product(self):
        self.start_screen(6, "Fiche produit")
        if self.mobile:
            self.image(14,113,362,226,"tomato",17)
            self.pill(26,124,"Récolté ce matin",P["paper"],P["forest"],132)
            self.text(18,374,"LÉGUMES FRAIS  /  ANTANANARIVO",8,P["forest2"],750,letter=.8)
            self.text(18,405,"Tomates bien mûres",24,P["ink"],800)
            self.text(18,429,"Ferme RAKOTO · Antsirabe, Vakinankaratra",9,P["muted"],500)
            self.text(18,457,"★ 4,9  ·  28 avis",10,P["gold"],700)
            self.text(18,505,"3 500 Ar",23,P["forest"],800)
            self.text(130,505,"/ kg",10,P["muted"],450)
            self.pill(258,483,"24 kg disponibles",P["leaf"],P["forest"],118)
            self.text(18,541,"Tomates cueillies à maturité, cultivées localement et",9,P["muted"],450)
            self.text(18,558,"soigneusement triées par votre producteur.",9,P["muted"],450)
            self.rect(18,583,135,39,P["paper"],10,P["line"])
            self.text(85,608,"−      2 kg      +",10,P["forest"],700,"middle")
            self.button(161,583,211,39,"Ajouter au panier  →",size=10)
            self.text(18,654,"✓ Producteur vérifié  ·  Livraison ou retrait",9,P["forest"],650)
            self.footer()
        else:
            self.text(72,179,"Marché   /   Légumes   /   Tomates",10,P["muted"],500)
            self.image(72,201,625,500,"tomato",19)
            self.pill(90,218,"Récolté ce matin",P["paper"],P["forest"],137)
            for i,key in enumerate(["tomato","greens","rice"]): self.image(72+i*93,714,81,66,key,10)
            self.card(748,201,620,579)
            self.text(783,244,"MARCHÉ LOCAL  /  LÉGUMES FRAIS",9,P["forest2"],750,letter=1)
            self.text(783,290,"Tomates bien mûres",31,P["ink"],800)
            self.text(783,321,"Ferme RAKOTO · Antsirabe, Vakinankaratra",11,P["muted"],500)
            self.text(783,353,"★ 4,9  ·  28 avis",11,P["gold"],700)
            self.line(783,376,1331,376)
            self.text(783,427,"3 500 Ar",30,P["forest"],800)
            self.text(917,427,"/ kg",12,P["muted"],450)
            self.pill(1148,400,"Disponible · 24 kg",P["leaf"],P["forest"],158)
            self.text(783,474,"Tomates cueillies à maturité, cultivées à Madagascar.",12,P["ink"],450)
            self.text(783,497,"Une récolte locale, fraîche et soigneusement triée.",11,P["muted"],450)
            self.text(783,544,"Quantité",11,P["ink"],700)
            self.rect(783,558,150,48,P["paper"],11,P["line"])
            self.text(858,588,"−     2 kg     +",11,P["forest"],700,"middle")
            self.button(946,558,385,48,"Ajouter au panier  →")
            self.line(783,628,1331,628)
            self.text(783,659,"✓ Producteur vérifié",11,P["forest"],700)
            self.text(783,686,"⌖ Livraison à domicile ou retrait",11,P["forest"],700)
            self.text(783,713,"Livraison estimée affichée avant confirmation.",10,P["muted"],450)
            self.card(72,810,1296,82,P["soft"],16)
            self.text(97,843,"Cultivé avec soin à Madagascar",15,P["forest"],750)
            self.text(97,869,"Découvrez l’histoire de la ferme RAKOTO et l’origine de votre récolte.",10,P["muted"],450)

    def screen_cart(self):
        self.start_screen(7, "Panier")
        if self.mobile:
            self.text(18,135,"Votre panier",22,P["ink"],800)
            self.text(18,157,"2 produits de producteurs locaux",9,P["muted"],450)
            self.pill(18,171,"1  Panier",P["forest"],P["white"],88)
            self.text(119,189,"2 Livraison  ·  3 Paiement",9,P["muted"],600)
            rows=[("tomato","Tomates bien mûres","Ferme RAKOTO","3 500 Ar / kg","2 kg"),("rice","Riz rouge de Madagascar","Coopérative Vary Tsara","12 000 Ar / sac 5 kg","1 sac")]
            for i,(key,title,seller,price,qty) in enumerate(rows):
                y=213+i*136
                self.card(14,y,362,122)
                self.image(25,y+11,94,96,key,12)
                self.text(132,y+31,title[:25],11,P["ink"],750)
                self.text(132,y+50,seller,8,P["muted"],450)
                self.text(132,y+72,price,9,P["forest"],700)
                self.rect(132,y+83,139,28,P["paper"],8,P["line"])
                self.text(201,y+102,"−    "+qty+"    +",8,P["forest"],700,"middle")
            self.card(14,492,362,262)
            self.text(30,522,"Résumé de la commande",14,P["ink"],750)
            self.text(30,556,"Sous-total",10,P["muted"],450); self.text(358,556,"19 000 Ar",10,P["ink"],700,"end")
            self.text(30,584,"Livraison",10,P["muted"],450); self.text(358,584,"À calculer",9,P["muted"],500,"end")
            self.line(30,603,358,603)
            self.text(30,633,"Total produits",11,P["ink"],700); self.text(358,633,"19 000 Ar",12,P["forest"],800,"end")
            self.button(30,670,328,44,"Choisir la livraison  →",size=10)
            self.text(194,735,"Frais affichés avant paiement",8,P["muted"],450,"middle")
            self.footer()
        else:
            self.text(72,186,"Votre panier",30,P["ink"],800)
            self.text(72,211,"2 produits de producteurs locaux",11,P["muted"],450)
            self.pill(72,230,"1  Panier",P["forest"],P["white"],101)
            self.pill(186,230,"2  Livraison",P["paper"],P["muted"],111)
            self.pill(310,230,"3  Paiement",P["paper"],P["muted"],111)
            rows=[("tomato","Tomates bien mûres","Ferme RAKOTO · Antsirabe","3 500 Ar / kg","2 kg"),("rice","Riz rouge de Madagascar","Coopérative Vary Tsara · Fianarantsoa","12 000 Ar / sac de 5 kg","1 sac")]
            for i,(key,title,seller,price,qty) in enumerate(rows):
                y=279+i*174
                self.card(72,y,810,157)
                self.image(88,y+15,126,127,key,13)
                self.text(237,y+47,title,16,P["ink"],750)
                self.text(237,y+72,seller,10,P["muted"],450)
                self.text(237,y+109,price,11,P["forest"],700)
                self.rect(658,y+83,144,42,P["paper"],10,P["line"])
                self.text(730,y+109,"−      "+qty+"      +",10,P["forest"],700,"middle")
                self.text(851,y+34,"Retirer",9,"#a75b49",600,"end")
            self.card(926,279,442,350)
            self.text(955,313,"Résumé de la commande",17,P["ink"],750)
            self.image(955,337,56,56,"tomato",10); self.text(1024,359,"Tomates bien mûres",10,P["ink"],700); self.text(1024,378,"2 kg",9,P["muted"],450); self.text(1336,365,"7 000 Ar",9,P["ink"],700,"end")
            self.image(955,407,56,56,"rice",10); self.text(1024,429,"Riz rouge de Madagascar",10,P["ink"],700); self.text(1024,448,"1 sac",9,P["muted"],450); self.text(1336,435,"12 000 Ar",9,P["ink"],700,"end")
            self.line(955,481,1336,481)
            self.text(955,508,"Sous-total",10,P["muted"],450); self.text(1336,508,"19 000 Ar",10,P["ink"],700,"end")
            self.text(955,537,"Livraison",10,P["muted"],450); self.text(1336,537,"À calculer",10,P["muted"],500,"end")
            self.line(955,555,1336,555)
            self.text(955,583,"Total produits",12,P["ink"],700); self.text(1336,583,"19 000 Ar",14,P["forest"],800,"end")
            self.button(955,598,381,45,"Choisir la livraison  →",size=11)
            self.text(955,653,"Le montant final est confirmé avant paiement.",9,P["muted"],450)

    def screen_delivery(self):
        self.start_screen(8, "Livraison")
        if self.mobile:
            self.text(18,135,"Où livrer votre commande ?",20,P["ink"],800)
            self.text(18,159,"Choisissez livraison ou retrait.",9,P["muted"],450)
            self.pill(18,173,"✓ Panier",P["leaf"],P["forest"],82)
            self.pill(112,173,"2 Livraison",P["forest"],P["white"],97)
            self.pill(221,173,"3 Paiement",P["paper"],P["muted"],98)
            self.text(18,232,"Adresse de livraison",13,P["ink"],750)
            self.card(14,245,362,79)
            self.text(29,274,"⌖  Maison — Antananarivo",10,P["ink"],700)
            self.text(47,298,"Lot II M 45, Analamahitsy",8,P["muted"],450)
            self.text(18,360,"Mode de réception",13,P["ink"],750)
            self.card(14,374,362,69); self.rect(25,390,17,17,P["forest"],9); self.text(33.5,403,"✓",9,P["white"],800,"middle"); self.text(53,399,"Livraison à domicile",10,P["forest"],700); self.text(53,421,"Demain · 9 h–12 h",8,P["muted"],450)
            self.card(14,453,362,69); self.rect(25,469,17,17,P["paper"],9,P["line"]); self.text(53,478,"Retrait chez le producteur",10,P["ink"],700); self.text(53,500,"Gratuit selon disponibilité",8,P["muted"],450)
            self.text(18,555,"Note au livreur (facultatif)",10,P["ink"],700)
            self.rect(14,564,362,42,P["white"],10,P["line"]); self.text(28,590,"Ex. portail vert, appeler à l’arrivée…",8,P["muted"],450)
            self.card(14,624,362,65,P["soft"],12,P["soft"])
            self.text(28,650,"Livraison estimée",8,P["muted"],450); self.text(359,650,"2 000 Ar",9,P["ink"],700,"end")
            self.text(28,677,"Total estimé",9,P["ink"],700); self.text(359,677,"21 000 Ar",11,P["forest"],800,"end")
            self.button(14,710,362,48,"Continuer vers le paiement →",size=10)
            self.footer()
        else:
            self.text(72,186,"Où livrer votre commande ?",29,P["ink"],800)
            self.text(72,212,"Choisissez la livraison ou le retrait auprès du producteur.",11,P["muted"],450)
            self.pill(72,232,"✓  Panier",P["leaf"],P["forest"],104); self.pill(190,232,"2  Livraison",P["forest"],P["white"],122); self.pill(326,232,"3  Paiement",P["paper"],P["muted"],120)
            self.text(72,300,"Adresse de livraison",15,P["ink"],750)
            self.card(72,315,800,92); self.rect(91,339,20,20,P["forest"],10); self.text(101,354,"✓",10,P["white"],800,"middle")
            self.text(128,345,"Maison — Antananarivo",11,P["ink"],700); self.text(128,368,"Lot II M 45, Analamahitsy, Antananarivo",10,P["muted"],450); self.text(826,380,"Modifier",9,P["forest"],700,"end")
            self.text(72,450,"Mode de réception",15,P["ink"],750)
            self.card(72,464,390,100); self.rect(90,489,19,19,P["forest"],10); self.text(99.5,503,"✓",9,P["white"],800,"middle"); self.text(120,497,"Livraison à domicile",11,P["forest"],700); self.text(120,520,"Demain · 9 h–12 h",9,P["muted"],450); self.text(437,497,"2 000 Ar",10,P["forest"],700,"end")
            self.card(480,464,392,100); self.rect(498,489,19,19,P["paper"],10,P["line"]); self.text(528,497,"Retrait chez le producteur",11,P["ink"],700); self.text(528,520,"Antsirabe · gratuit si disponible",9,P["muted"],450)
            self.text(72,605,"Note au livreur (facultatif)",10,P["ink"],700); self.rect(72,615,800,53,P["white"],10,P["line"]); self.text(88,646,"Ex. portail vert, appeler à l’arrivée…",10,P["muted"],450)
            self.card(72,696,800,67,P["soft"],12,P["soft"]); self.text(90,722,"Le créneau et les frais seront confirmés par le producteur.",10,P["forest"],650); self.text(90,743,"Aucune adresse n’est transmise avant la validation de la commande.",9,P["muted"],450)
            self.card(925,300,443,350)
            self.text(955,335,"Votre commande",17,P["ink"],750)
            self.image(955,356,55,55,"tomato",10); self.text(1023,378,"Tomates bien mûres",10,P["ink"],700); self.text(1337,384,"7 000 Ar",9,P["ink"],700,"end")
            self.image(955,420,55,55,"rice",10); self.text(1023,442,"Riz rouge de Madagascar",10,P["ink"],700); self.text(1337,448,"12 000 Ar",9,P["ink"],700,"end")
            self.line(955,488,1337,488); self.text(955,516,"Sous-total",10,P["muted"],450); self.text(1337,516,"19 000 Ar",10,P["ink"],700,"end"); self.text(955,545,"Livraison",10,P["muted"],450); self.text(1337,545,"2 000 Ar",10,P["ink"],700,"end"); self.line(955,560,1337,560); self.text(955,588,"Total estimé",12,P["ink"],700); self.text(1337,588,"21 000 Ar",14,P["forest"],800,"end")
            self.button(925,673,443,49,"Continuer vers le paiement  →",size=11)

    def screen_payment(self):
        self.start_screen(9, "Paiement")
        if self.mobile:
            self.text(18,135,"Comment payer ?",22,P["ink"],800)
            self.text(18,159,"Votre montant final avant validation.",9,P["muted"],450)
            self.pill(18,173,"✓ Panier",P["leaf"],P["forest"],82); self.pill(112,173,"✓ Livraison",P["leaf"],P["forest"],97); self.pill(221,173,"3 Paiement",P["forest"],P["white"],98)
            self.text(18,232,"Moyen de paiement",13,P["ink"],750)
            options=[("MVola","Mobile Money · disponibilité à confirmer"),("Orange Money","Mobile Money · disponibilité à confirmer"),("À la réception","Selon les options de votre zone")]
            for i,(name,desc) in enumerate(options):
                y=246+i*68
                self.card(14,y,362,57,P["paper"],12,P["forest"] if i==0 else P["line"])
                self.rect(26,y+17,18,18,P["forest"] if i==0 else P["paper"],9,P["forest"] if i==0 else P["line"])
                if i==0: self.rect(31,y+22,8,8,P["white"],4)
                self.text(56,y+25,name,10,P["ink"],700)
                self.text(56,y+42,desc[:41],7,P["muted"],450)
                if i<2:self.pill(296,y+16,"À confirmer",P["pending"],P["pendingText"],69)
            self.text(18,464,"Numéro Mobile Money (si applicable)",9,P["ink"],700)
            self.rect(14,473,362,42,P["white"],10,P["line"]); self.text(28,500,"+261 34 00 000 00",9,P["muted"],450)
            self.card(14,531,362,64,P["soft"],12,P["soft"])
            self.text(28,554,"Moyens de paiement à confirmer avant lancement.",8,P["forest"],700)
            self.text(28,576,"Cette maquette ne prélève aucun paiement.",8,P["muted"],450)
            self.card(14,610,362,78)
            self.text(28,638,"Total estimé",9,P["muted"],450); self.text(359,638,"21 000 Ar",12,P["forest"],800,"end"); self.text(28,670,"Livraison incluse · frais indicatifs",7,P["muted"],450)
            self.button(14,710,362,48,"Confirmer la commande  →",size=10)
            self.footer()
        else:
            self.text(72,186,"Comment souhaitez-vous payer ?",29,P["ink"],800)
            self.text(72,212,"Le moyen actif et le montant final sont confirmés avant validation.",11,P["muted"],450)
            self.pill(72,232,"✓  Panier",P["leaf"],P["forest"],104); self.pill(190,232,"✓  Livraison",P["leaf"],P["forest"],122); self.pill(326,232,"3  Paiement",P["forest"],P["white"],120)
            self.text(72,300,"Moyen de paiement",15,P["ink"],750)
            options=[("MVola","Paiement Mobile Money","Recommandé"),("Orange Money","Paiement Mobile Money","À confirmer"),("Paiement à la réception","Selon les options disponibles dans votre zone","À confirmer")]
            for i,(name,desc,badge) in enumerate(options):
                y=315+i*82; self.card(72,y,800,69,P["paper"],13,P["forest"] if i==0 else P["line"])
                self.rect(91,y+24,20,20,P["forest"] if i==0 else P["paper"],10,P["forest"] if i==0 else P["line"])
                if i==0:self.rect(97,y+30,8,8,P["white"],4)
                self.text(127,y+31,name,11,P["ink"],700); self.text(127,y+50,desc,9,P["muted"],450)
                self.pill(733,y+21,badge,P["leaf"] if i==0 else P["pending"],P["forest"] if i==0 else P["pendingText"],110)
            self.text(72,590,"Numéro Mobile Money (si applicable)",10,P["ink"],700)
            self.rect(72,601,800,48,P["white"],10,P["line"]); self.text(89,631,"+261 34 00 000 00",10,P["muted"],450)
            self.card(72,668,800,75,P["soft"],12,P["soft"]); self.text(91,697,"À savoir",10,P["forest"],750); self.text(91,720,"Les moyens de paiement et partenaires restent à confirmer avant le lancement.",10,P["forest"],500)
            self.card(925,300,443,347)
            self.text(955,335,"Résumé de la commande",17,P["ink"],750)
            self.image(955,356,55,55,"tomato",10); self.text(1023,378,"Tomates bien mûres · 2 kg",10,P["ink"],700); self.text(1337,384,"7 000 Ar",9,P["ink"],700,"end")
            self.image(955,420,55,55,"rice",10); self.text(1023,442,"Riz rouge · 1 sac",10,P["ink"],700); self.text(1337,448,"12 000 Ar",9,P["ink"],700,"end")
            self.line(955,488,1337,488); self.text(955,516,"Sous-total",10,P["muted"],450); self.text(1337,516,"19 000 Ar",10,P["ink"],700,"end"); self.text(955,545,"Livraison estimée",10,P["muted"],450); self.text(1337,545,"2 000 Ar",10,P["ink"],700,"end"); self.line(955,560,1337,560); self.text(955,588,"Total estimé",12,P["ink"],700); self.text(1337,588,"21 000 Ar",14,P["forest"],800,"end")
            self.button(925,666,443,49,"Confirmer la commande  →",size=11)
            self.text(1147,735,"Aucun paiement n’est prélevé par cette maquette.",9,P["muted"],450,"middle")

    def screen_tracking(self):
        self.start_screen(11, "Suivi de commande")
        if self.mobile:
            self.card(14,113,362,118,P["leaf"],16,P["leaf"])
            self.rect(27,128,36,36,P["forest"],18); self.text(45,153,"✓",17,P["white"],800,"middle")
            self.text(76,148,"Commande reçue !",16,P["forest"],800); self.text(76,168,"MAD-2026-1084 · paiement à vérifier",8,P["muted"],500)
            self.text(27,207,"Votre producteur prépare votre récolte.",9,P["ink"],500)
            self.text(18,261,"Suivi de la commande",16,P["ink"],750)
            self.card(14,278,362,287)
            items=[("✓","Commande confirmée","Aujourd’hui · 10:42",1),("2","Préparation producteur","En cours · Ferme RAKOTO",1),("3","Prise en charge livreur","À venir",0),("4","Livrée chez vous","Demain · 9 h–12 h",0)]
            for i,(icon,name,detail,active) in enumerate(items):
                y=299+i*63; self.rect(28,y,25,25,P["forest"] if active else P["soft"],13); self.text(40.5,y+17,icon,9,P["white"] if active else P["muted"],800,"middle")
                if i<3:self.line(40.5,y+25,40.5,y+62,P["line"],2)
                self.text(66,y+11,name,9,P["ink"],700); self.text(66,y+29,detail,8,P["forest"] if active else P["muted"],500)
            self.card(14,582,362,94)
            self.text(28,606,"Récapitulatif",11,P["ink"],750)
            self.text(28,630,"2 produits · Livraison demain",8,P["muted"],450)
            self.text(28,656,"MVola · en vérification",8,P["pendingText"],700)
            self.text(359,656,"21 000 Ar",10,P["forest"],800,"end")
            self.button(14,698,362,48,"Voir mes commandes",P["paper"],P["forest"],True,10)
            self.footer()
        else:
            self.card(72,164,1296,130,P["leaf"],19,P["leaf"])
            self.rect(102,198,50,50,P["forest"],25); self.text(127,231,"✓",24,P["white"],800,"middle")
            self.text(181,218,"Commande bien reçue !",25,P["forest"],800)
            self.text(181,248,"Votre producteur prépare votre récolte. Vous recevrez une mise à jour à chaque étape.",11,P["muted"],450)
            self.pill(1085,207,"MAD-2026-1084",P["paper"],P["forest"],230)
            self.text(72,348,"Suivi de la commande",20,P["ink"],750)
            self.text(72,371,"Mis à jour à l’instant",10,P["muted"],450)
            self.card(72,391,807,393)
            items=[("✓","Commande confirmée","Aujourd’hui · 10:42",1),("2","Préparation chez le producteur","En cours · Ferme RAKOTO",1),("3","Prise en charge par le livreur","À venir",0),("4","Livrée chez vous","Demain · 9 h–12 h",0)]
            for i,(icon,name,detail,active) in enumerate(items):
                y=420+i*82; self.rect(101,y,34,34,P["forest"] if active else P["soft"],17); self.text(118,y+22,icon,12,P["white"] if active else P["muted"],800,"middle")
                if i<3:self.line(118,y+34,118,y+81,P["line"],2)
                self.text(155,y+13,name,12,P["ink"],700); self.text(155,y+36,detail,10,P["forest"] if active else P["muted"],500)
            self.card(911,348,457,322)
            self.text(941,384,"Récapitulatif",16,P["ink"],750)
            self.text(941,431,"Produits",10,P["muted"],450); self.text(1338,431,"2 articles",10,P["ink"],700,"end")
            self.text(941,467,"Livraison",10,P["muted"],450); self.text(1338,467,"Demain · 9 h–12 h",10,P["ink"],650,"end")
            self.text(941,503,"Paiement",10,P["muted"],450); self.text(1338,503,"MVola · à vérifier",10,P["pendingText"],700,"end")
            self.line(941,525,1338,525); self.text(941,557,"Total estimé",11,P["ink"],700); self.text(1338,557,"21 000 Ar",14,P["forest"],800,"end")
            self.card(911,688,457,96)
            self.text(937,719,"Besoin d’aide ?",13,P["ink"],750); self.text(937,742,"Contactez-nous avec votre numéro de commande.",9,P["muted"],450); self.button(1212,708,132,47,"Support",P["paper"],P["forest"],True,10)

    def screen_orders(self):
        self.start_screen(12, "Mes commandes")
        if self.mobile:
            self.text(18,135,"Mes commandes",22,P["ink"],800)
            self.text(18,159,"Historique et suivi de vos achats.",9,P["muted"],450)
            rows=[("MAD-2026-1084","Aujourd’hui","En préparation","21 000 Ar","pending"),("MAD-2026-0961","12 oct. 2026","Livrée","8 000 Ar","ok"),("MAD-2026-0872","04 oct. 2026","Livrée","12 500 Ar","ok")]
            for i,(order,date,status,total,cls) in enumerate(rows):
                y=191+i*132; self.card(14,y,362,116)
                self.text(29,y+28,order,10,P["ink"],750); self.text(360,y+28,total,10,P["forest"],750,"end")
                self.text(29,y+50,date,8,P["muted"],450)
                self.pill(29,y+67,status,P["pending"] if cls=="pending" else P["leaf"],P["pendingText"] if cls=="pending" else P["forest"],110)
                self.text(360,y+92,"Détails  →",9,P["forest"],700,"end")
            self.button(14,604,362,44,"Continuer mes achats",P["leaf"],P["forest"],False,10)
            self.footer()
        else:
            self.text(72,186,"Mes commandes",30,P["ink"],800)
            self.text(72,212,"Retrouvez l’historique et suivez vos achats auprès des producteurs.",11,P["muted"],450)
            self.card(72,253,1296,516)
            self.rect(72,253,1296,50,P["soft"],16,P["soft"])
            headers=[("COMMANDE",98),("DATE",325),("PRODUCTEURS",500),("TOTAL ESTIMÉ",930),("STATUT",1095),("",1300)]
            for name,x in headers:self.text(x,284,name,9,P["muted"],700)
            rows=[("MAD-2026-1084","Aujourd’hui","Ferme RAKOTO + Vary Tsara","21 000 Ar","En préparation"),("MAD-2026-0961","12 oct. 2026","Ferme Soa","8 000 Ar","Livrée"),("MAD-2026-0872","04 oct. 2026","Potager de Lalao","12 500 Ar","Livrée")]
            for i,row in enumerate(rows):
                y=340+i*98
                for k,(val,x) in enumerate(zip(row[:4],[98,325,500,930])):self.text(x,y,val,10,P["ink"] if k!=1 else P["muted"],650)
                self.pill(1094,y-19,row[4],P["pending"] if i==0 else P["leaf"],P["pendingText"] if i==0 else P["forest"],120)
                self.text(1300,y,"Détails →",9,P["forest"],700)
                self.line(98,y+28,1340,y+28)
            self.text(72,825,"Besoin d’aide avec une commande ?",12,P["ink"],700)
            self.text(72,849,"Contactez notre équipe en précisant le numéro de commande.",10,P["muted"],450)
            self.button(1125,814,243,47,"Continuer mes achats",P["paper"],P["forest"],True,10)

    def screen_seller(self):
        self.start_screen(13, "Espace producteur")
        if self.mobile:
            self.text(18,135,"Bonjour, RAKOTO",21,P["ink"],800)
            self.text(18,158,"Votre activité cette semaine",9,P["muted"],450)
            for i,(label,value) in enumerate([("À préparer","4"),("Produits publiés","12"),("Ventes estimées","128 500 Ar")]):
                x=14+(i%2)*184; y=181+(i//2)*94
                self.card(x,y,174,78); self.text(x+13,y+27,label,8,P["muted"],600); self.text(x+13,y+59,value,17,P["forest"],800)
            self.text(18,389,"Commandes récentes",14,P["ink"],750)
            rows=[("MAD-2026-1084","Tomates · 2 kg","À préparer"),("MAD-2026-1072","Bananes · 1 régime","Prête"),("MAD-2026-1058","Tomates · 5 kg","Livrée")]
            for i,(a,b,c) in enumerate(rows):
                y=406+i*82; self.card(14,y,362,68)
                self.text(27,y+25,a,9,P["ink"],700); self.text(27,y+46,b,8,P["muted"],450)
                self.pill(282,y+21,c,P["pending"] if i==0 else P["leaf"],P["pendingText"] if i==0 else P["forest"],82)
            self.button(14,684,362,44,"Gérer mes produits  →",size=10)
            self.footer()
        else:
            self.text(72,186,"Bonjour, Ferme RAKOTO",29,P["ink"],800)
            self.text(72,212,"Suivez vos récoltes, vos commandes et vos acheteurs.",11,P["muted"],450)
            metrics=[("Commandes à préparer","4","2 à confirmer aujourd’hui"),("Produits publiés","12","3 bientôt indisponibles"),("Ventes estimées","128 500 Ar","Cette semaine"),("Note moyenne","4,9 / 5","28 avis acheteurs")]
            for i,(name,value,desc) in enumerate(metrics):
                x=72+i*326
                self.card(x,253,302,115)
                self.text(x+18,281,name,9,P["muted"],600); self.text(x+18,319,value,22,P["forest"],800); self.text(x+18,347,desc,9,P["muted"],450)
            self.card(72,392,800,408)
            self.text(97,428,"Commandes récentes",15,P["ink"],750)
            self.text(845,428,"Voir tout →",10,P["forest"],700,"end")
            self.line(97,449,846,449)
            self.text(97,476,"COMMANDE",8,P["muted"],700); self.text(307,476,"PRODUITS",8,P["muted"],700); self.text(595,476,"STATUT",8,P["muted"],700); self.text(829,476,"TOTAL",8,P["muted"],700,"end")
            rows=[("MAD-2026-1084","Tomates · 2 kg","À préparer","7 000 Ar"),("MAD-2026-1072","Bananes · 1 régime","Prête","4 000 Ar"),("MAD-2026-1058","Tomates · 5 kg","Livrée","17 500 Ar")]
            for i,row in enumerate(rows):
                y=522+i*71
                self.text(97,y,row[0],9,P["ink"],700); self.text(307,y,row[1],9,P["muted"],500); self.pill(595,y-19,row[2],P["pending"] if i==0 else P["leaf"],P["pendingText"] if i==0 else P["forest"],94); self.text(829,y,row[3],9,P["ink"],700,"end"); self.line(97,y+24,846,y+24)
            self.card(900,392,468,408)
            self.text(927,428,"Mes produits",15,P["ink"],750); self.button(1232,408,108,36,"+ Ajouter",P["leaf"],P["forest"],False,9)
            for i,(key,title,price) in enumerate([("tomato","Tomates bien mûres","3 500 Ar / kg"),("eggplant","Aubergines du jardin","2 500 Ar / kg"),("banana","Bananes mûres","4 000 Ar / régime")]):
                y=466+i*96; self.image(927,y,66,65,key,10); self.text(1007,y+25,title,10,P["ink"],700); self.text(1007,y+46,price,9,P["muted"],500); self.pill(1251,y+16,"Publié",P["leaf"],P["forest"],82)

    def screen_admin(self):
        self.start_screen(14, "Back-office / Modération")
        if self.mobile:
            self.text(18,135,"Back-office",21,P["ink"],800)
            self.text(18,158,"Modération du marché",9,P["muted"],450)
            for i,(label,value) in enumerate([("Producteurs","3"),("Produits","7"),("Réclamations","2")]):
                x=14+i*120; self.card(x,180,110,75); self.text(x+10,207,label,7,P["muted"],600); self.text(x+10,239,value,19,P["forest"],800)
            self.text(18,292,"Produits à examiner",14,P["ink"],750)
            rows=[("eggplant","Aubergines du jardin","Ferme RAKOTO"),("banana","Bananes mûres","Ferme Soa"),("greens","Brèdes mafana","Potager de Lalao")]
            for i,(key,title,seller) in enumerate(rows):
                y=307+i*108; self.card(14,y,362,94)
                self.image(24,y+10,70,72,key,9); self.text(105,y+37,title,9,P["ink"],700); self.text(105,y+57,seller,8,P["muted"],450)
                self.button(105,y+65,104,26,"Examiner",P["leaf"],P["forest"],False,8); self.text(344,y+82,"Refuser",8,"#a75b49",650,"end")
            self.text(18,656,"Producteurs à vérifier · 3 demandes",9,P["forest"],700)
            self.footer()
        else:
            self.text(72,186,"Back-office",29,P["ink"],800)
            self.text(72,212,"Vérifiez les producteurs, les produits et les commandes signalées.",11,P["muted"],450)
            for i,(name,value,desc) in enumerate([("Producteurs à vérifier","3","Demandes en attente"),("Produits à examiner","7","Nouvelles publications"),("Réclamations ouvertes","2","À traiter")]):
                x=72+i*433
                self.card(x,253,406,101)
                self.text(x+20,282,name,10,P["muted"],600); self.text(x+20,321,value,23,P["forest"],800); self.text(x+83,318,desc,9,P["muted"],450)
            self.card(72,380,800,457)
            self.text(98,417,"Fiches produits en attente",15,P["ink"],750); self.pill(719,397,"7 à examiner",P["pending"],P["pendingText"],122)
            self.line(98,438,846,438)
            rows=[("eggplant","Aubergines du jardin","Ferme RAKOTO · 2 500 Ar / kg"),("banana","Bananes mûres","Ferme Soa · 4 000 Ar / régime"),("greens","Brèdes mafana","Potager de Lalao · 2 000 Ar / botte")]
            for i,(key,title,desc) in enumerate(rows):
                y=458+i*107; self.image(98,y,76,76,key,11); self.text(191,y+26,title,11,P["ink"],700); self.text(191,y+48,desc,9,P["muted"],450); self.pill(191,y+59,"En attente",P["pending"],P["pendingText"],88)
                self.button(608,y+14,100,36,"Examiner",P["leaf"],P["forest"],False,9); self.button(718,y+14,117,36,"Refuser",P["paper"],"#a75b49",True,9); self.line(191,y+91,846,y+91)
            self.card(900,380,468,457)
            self.text(927,417,"Vérification producteur",15,P["ink"],750)
            for i,(avatar,name,desc) in enumerate([("LV","La ferme verte","Identité et zone à confirmer"),("MT","Mamy Tsara","Documents à compléter"),("RA","Rakoto Andry","Nouvelle demande")]):
                y=456+i*83; self.rect(927,y,40,40,P["leaf"],20); self.text(947,y+25,avatar,10,P["forest"],800,"middle"); self.text(981,y+18,name,10,P["ink"],700); self.text(981,y+38,desc,8,P["muted"],450); self.text(1338,y+25,"Ouvrir →",9,P["forest"],700,"end"); self.line(981,y+55,1338,y+55)
            self.card(927,723,414,81,P["soft"],12,P["soft"]); self.text(945,751,"Paiement et livraison",10,P["forest"],700); self.text(945,774,"Partenaires à confirmer avant activation.",9,P["muted"],450)

    def screen_signup(self):
        self.start_screen(3, "Créer un compte")
        if self.mobile:
            self.text(18,135,"Rejoignez le marché local",20,P["ink"],800)
            self.text(18,157,"Achetez ou vendez en toute simplicité.",9,P["muted"],450)
            self.card(14,174,362,568,P["paper"],18)
            self.input(30,200,330,"Nom complet","Ex. Fara Rakoto")
            self.input(30,272,330,"Téléphone","+261 34 00 000 00")
            self.input(30,344,330,"Adresse e-mail","nom@email.com")
            self.input(30,416,330,"Mot de passe","8 caractères minimum")
            self.text(30,500,"Je souhaite utiliser MadaAgri comme",9,P["ink"],700)
            self.button(30,514,155,36,"Acheteur",P["forest"],P["white"],False,9)
            self.button(197,514,163,36,"Producteur",P["white"],P["forest"],True,9)
            self.rect(30,574,16,16,P["forest"],4); self.rect(34,578,8,8,P["white"],2)
            self.text(54,586,"J’accepte les conditions d’utilisation.",8,P["muted"],450)
            self.button(30,612,330,45,"Créer mon compte  →",size=10)
            self.text(195,694,"Déjà un compte ?  Se connecter",9,P["forest"],700,"middle")
            self.footer()
        else:
            self.image(72,170,625,710,"market",22)
            self.rect(72,170,625,710,P["forest"],22,opacity=.70)
            self.text(112,253,"UNE COMMUNAUTÉ, UN MARCHÉ",10,"#deead4",750,letter=1)
            self.text(112,320,"Vendez au plus près.",35,P["white"],800)
            self.text(112,364,"Achetez plus juste.",35,P["white"],800)
            self.text(112,420,"Des récoltes locales, un lien direct et des paiements",12,"#e6eee2",450)
            self.text(112,443,"adaptés aux habitudes de chaque région.",12,"#e6eee2",450)
            self.pill(112,488,"✓  Inscription gratuite",P["leaf"],P["forest"],188)
            self.card(751,170,617,710)
            self.text(801,228,"Créer votre compte",28,P["ink"],800)
            self.text(801,255,"Quelques informations pour commencer.",12,P["muted"],450)
            self.input(801,286,245,"Nom","Fara")
            self.input(1071,286,245,"Prénom","Rakoto")
            self.input(801,366,515,"Téléphone","+261 34 00 000 00")
            self.input(801,446,515,"Adresse e-mail","nom@email.com")
            self.input(801,526,515,"Mot de passe","8 caractères minimum")
            self.text(801,617,"Votre profil",10,P["ink"],700)
            self.button(801,630,247,39,"Acheteur",P["forest"],P["white"],False,10)
            self.button(1069,630,247,39,"Producteur",P["white"],P["forest"],True,10)
            self.rect(801,689,16,16,P["forest"],4); self.rect(805,693,8,8,P["white"],2)
            self.text(826,701,"J’accepte les conditions d’utilisation et la politique de confidentialité.",8,P["muted"],450)
            self.button(801,725,515,45,"Créer mon compte  →",size=11)
            self.text(1058,814,"Déjà inscrit ?  Se connecter",10,P["forest"],700,"middle")

    def screen_recovery(self):
        self.start_screen(4, "Mot de passe oublié")
        if self.mobile:
            self.card(14,146,362,590,P["paper"],18)
            self.rect(30,174,48,48,P["leaf"],16)
            self.text(54,207,"↗",20,P["forest"],800,"middle")
            self.text(30,258,"Mot de passe oublié ?",21,P["ink"],800)
            self.text(30,283,"Saisissez votre e-mail ou téléphone pour recevoir",9,P["muted"],450)
            self.text(30,300,"un lien sécurisé de réinitialisation.",9,P["muted"],450)
            self.input(30,336,330,"E-mail ou téléphone","nom@email.com")
            self.button(30,419,330,45,"Recevoir le lien  →",size=10)
            self.card(30,488,330,74,P["soft"],12,P["soft"])
            self.text(46,515,"Vérifiez aussi votre dossier courrier indésirable.",8,P["forest"],600)
            self.text(46,538,"Le lien expirera après 30 minutes.",8,P["muted"],450)
            self.text(195,618,"← Retour à la connexion",9,P["forest"],700,"middle")
            self.footer()
        else:
            self.image(72,170,625,710,"market",22)
            self.rect(72,170,625,710,P["forest"],22,opacity=.72)
            self.text(112,282,"VOTRE COMPTE",10,"#deead4",750,letter=1)
            self.text(112,350,"On vous aide à",38,P["white"],800)
            self.text(112,395,"revenir au marché.",38,P["white"],800)
            self.text(112,445,"Un lien de réinitialisation vous sera envoyé",12,"#e6eee2",450)
            self.text(112,468,"sur le canal associé à votre compte.",12,"#e6eee2",450)
            self.card(751,170,617,710)
            self.text(801,262,"Réinitialiser le mot de passe",25,P["ink"],800)
            self.text(801,292,"E-mail ou téléphone",10,P["muted"],450)
            self.input(801,325,515,"E-mail ou téléphone","nom@email.com ou +261 34 00 000 00")
            self.button(801,410,515,49,"Recevoir le lien sécurisé  →")
            self.card(801,488,515,88,P["soft"],13,P["soft"])
            self.text(822,519,"Le lien expire après 30 minutes.",10,P["forest"],700)
            self.text(822,545,"Vérifiez aussi votre dossier courrier indésirable.",9,P["muted"],450)
            self.text(1058,632,"← Retour à la connexion",11,P["forest"],700,"middle")

    def screen_verify(self):
        self.start_screen(5, "Vérification du compte")
        if self.mobile:
            self.card(14,146,362,590,P["paper"],18)
            self.rect(30,174,48,48,P["leaf"],16)
            self.text(54,207,"✓",20,P["forest"],800,"middle")
            self.text(30,258,"Vérifiez votre numéro",21,P["ink"],800)
            self.text(30,283,"Un code à 6 chiffres a été envoyé au",9,P["muted"],450)
            self.text(30,300,"+261 34 •• •• 28.",9,P["muted"],700)
            for i in range(6):
                x=30+i*54; self.rect(x,335,46,52,P["white"],10,P["forest"] if i==0 else P["line"])
                if i==0:self.text(x+23,367,"•",18,P["forest"],800,"middle")
            self.text(30,418,"Le code expire dans",8,P["muted"],450)
            self.text(144,418,"04:58",8,P["forest"],700)
            self.button(30,447,330,45,"Vérifier mon numéro  →",size=10)
            self.text(195,528,"Vous n’avez rien reçu ?",9,P["muted"],450,"middle")
            self.text(195,550,"Renvoyer un code",9,P["forest"],700,"middle")
            self.card(30,593,330,62,P["soft"],12,P["soft"])
            self.text(46,618,"Votre numéro reste privé et sert au suivi",8,P["forest"],600)
            self.text(46,638,"des commandes et à la sécurité du compte.",8,P["muted"],450)
            self.text(195,694,"Modifier mon numéro",9,P["forest"],700,"middle")
            self.footer()
        else:
            self.image(72,170,625,710,"market",22)
            self.rect(72,170,625,710,P["forest"],22,opacity=.72)
            self.text(112,282,"VOTRE COMPTE, EN SÉCURITÉ",10,"#deead4",750,letter=1)
            self.text(112,350,"Un dernier pas",38,P["white"],800)
            self.text(112,395,"avant le marché.",38,P["white"],800)
            self.text(112,445,"Nous vérifions votre numéro pour protéger",12,"#e6eee2",450)
            self.text(112,468,"vos commandes et votre espace producteur.",12,"#e6eee2",450)
            self.card(751,170,617,710)
            self.text(801,262,"Vérifiez votre numéro",25,P["ink"],800)
            self.text(801,292,"Code envoyé au +261 34 •• •• 28",11,P["muted"],450)
            for i in range(6):
                x=801+i*84; self.rect(x,335,68,72,P["white"],12,P["forest"] if i==0 else P["line"])
                if i==0:self.text(x+34,380,"•",22,P["forest"],800,"middle")
            self.text(801,442,"Le code expire dans",10,P["muted"],450); self.text(916,442,"04:58",10,P["forest"],700)
            self.button(801,474,515,49,"Vérifier mon numéro  →")
            self.text(1058,562,"Vous n’avez rien reçu ?  Renvoyer un code",10,P["forest"],700,"middle")
            self.card(801,620,515,75,P["soft"],13,P["soft"])
            self.text(822,650,"Votre numéro reste privé.",10,P["forest"],700)
            self.text(822,675,"Il sert uniquement à la sécurité et au suivi.",9,P["muted"],450)
            self.text(1058,752,"← Modifier mon numéro",10,P["forest"],700,"middle")

    def screen_confirmation(self):
        self.start_screen(10, "Commande confirmée")
        if self.mobile:
            self.rect(14,130,362,214,P["leaf"],20)
            self.rect(157,151,76,76,P["forest"],38)
            self.text(195,201,"✓",35,P["white"],800,"middle")
            self.text(195,262,"Commande confirmée !",18,P["ink"],800,"middle")
            self.text(195,286,"Merci d’encourager les producteurs locaux.",9,P["muted"],450,"middle")
            self.pill(128,306,"N° MA-2026-1048",P["paper"],P["forest"],134)
            self.card(14,363,362,201)
            self.text(30,392,"Résumé de votre commande",11,P["ink"],750)
            self.text(30,425,"2 articles · 1 producteur",9,P["muted"],450)
            self.text(359,425,"19 000 Ar",10,P["ink"],700,"end")
            self.text(30,456,"Livraison estimée",9,P["muted"],450)
            self.text(359,456,"Demain, 9h–12h",9,P["forest"],700,"end")
            self.line(30,474,359,474)
            self.text(30,511,"Total payé / à régler",10,P["ink"],700)
            self.text(359,511,"21 000 Ar",12,P["forest"],800,"end")
            self.button(14,583,362,47,"Suivre ma commande  →",size=10)
            self.button(14,642,362,43,"Retour au marché",P["white"],P["forest"],True,10)
            self.text(195,711,"Un reçu sera envoyé sur votre téléphone.",8,P["muted"],450,"middle")
            self.footer()
        else:
            self.rect(72,170,1296,280,P["leaf"],22)
            self.rect(642,198,80,80,P["forest"],40)
            self.text(682,252,"✓",37,P["white"],800,"middle")
            self.text(720,335,"Commande confirmée !",31,P["ink"],800,"middle")
            self.text(720,365,"Merci d’encourager les producteurs locaux.",12,P["muted"],450,"middle")
            self.pill(646,390,"N° MA-2026-1048",P["paper"],P["forest"],148)
            self.card(72,482,800,282)
            self.text(100,520,"Votre commande",16,P["ink"],750)
            self.image(100,545,60,60,"tomato",10); self.text(174,568,"Tomates bien mûres · 2 kg",11,P["ink"],700); self.text(843,568,"7 000 Ar",10,P["ink"],700,"end")
            self.image(100,619,60,60,"rice",10); self.text(174,642,"Riz rouge · 1 sac de 5 kg",11,P["ink"],700); self.text(843,642,"12 000 Ar",10,P["ink"],700,"end")
            self.line(100,697,843,697); self.text(100,729,"Livraison estimée · Demain, 9h–12h",10,P["muted"],450); self.text(843,729,"Total  21 000 Ar",13,P["forest"],800,"end")
            self.card(900,482,468,282)
            self.text(928,520,"Prochaine étape",16,P["ink"],750)
            self.text(928,561,"Le producteur prépare votre panier.",10,P["muted"],450)
            self.pill(928,585,"Paiement à confirmer selon le moyen choisi",P["pending"],P["pendingText"],326)
            self.button(928,642,412,46,"Suivre ma commande  →",size=11)
            self.text(1134,720,"Un reçu sera envoyé sur votre téléphone.",9,P["muted"],450,"middle")

    def screen_admin_orders(self):
        self.start_screen(15, "BO / Gestion des commandes")
        if self.mobile:
            self.text(18,135,"Commandes",20,P["ink"],800)
            self.text(18,158,"Suivez les paiements et les livraisons.",9,P["muted"],450)
            self.pill(14,175,"Toutes · 12",P["forest"],P["white"],95); self.pill(117,175,"À traiter · 4",P["leaf"],P["forest"],108); self.pill(233,175,"En route · 3",P["leaf"],P["forest"],106)
            rows=[("MA-1048","Fara R.","21 000 Ar","À confirmer","pending"),("MA-1047","Lova A.","12 500 Ar","À préparer","pending"),("MA-1046","Mamy T.","8 000 Ar","En livraison","leaf"),("MA-1045","Soa M.","17 500 Ar","Terminée","leaf")]
            for i,(code,buyer,total,status,tone) in enumerate(rows):
                y=218+i*128; self.card(14,y,362,112)
                self.text(28,y+27,code,10,P["forest"],750); self.pill(268,y+12,status,P[tone],P["pendingText"] if tone=="pending" else P["forest"],92)
                self.text(28,y+54,buyer+" · 2 articles",8,P["muted"],450); self.text(358,y+54,total,9,P["ink"],700,"end")
                self.line(28,y+69,358,y+69); self.text(28,y+94,"Mise à jour du statut",8,P["forest"],700); self.text(358,y+94,"Ouvrir →",8,P["forest"],700,"end")
            self.footer()
        else:
            self.text(72,186,"Commandes",29,P["ink"],800)
            self.text(72,212,"Suivez chaque paiement, préparation et livraison.",11,P["muted"],450)
            for i,(label,value) in enumerate([("À traiter","4"),("En livraison","3"),("Terminées aujourd’hui","8")]):
                x=72+i*433; self.card(x,250,406,85); self.text(x+20,281,label,10,P["muted"],600); self.text(x+20,318,value,22,P["forest"],800)
            self.card(72,363,1296,472)
            self.text(98,401,"Toutes les commandes",15,P["ink"],750); self.pill(1192,379,"12 commandes",P["leaf"],P["forest"],142)
            self.line(98,423,1342,423)
            for x,label in [(98,"N° COMMANDE"),(260,"ACHETEUR"),(475,"DATE"),(625,"TOTAL"),(790,"PAIEMENT"),(980,"STATUT")]:self.text(x,449,label,8,P["muted"],750,letter=.5)
            rows=[("MA-2026-1048","Fara Rakoto","13 oct. · 09:42","21 000 Ar","MVola","À confirmer"),("MA-2026-1047","Lova Andri","13 oct. · 08:15","12 500 Ar","À la réception","À préparer"),("MA-2026-1046","Mamy Tsara","12 oct. · 16:08","8 000 Ar","Orange Money","En livraison"),("MA-2026-1045","Soa Miora","12 oct. · 14:31","17 500 Ar","MVola","Terminée")]
            for i,row in enumerate(rows):
                y=491+i*75; self.text(98,y,row[0],9,P["forest"],700); self.text(260,y,row[1],9,P["ink"],600); self.text(475,y,row[2],8,P["muted"],450); self.text(625,y,row[3],9,P["ink"],700); self.text(790,y,row[4],8,P["muted"],450); self.pill(980,y-18,row[5],P["pending"] if i<2 else P["leaf"],P["pendingText"] if i<2 else P["forest"],117); self.text(1335,y,"Ouvrir →",9,P["forest"],700,"end"); self.line(98,y+25,1342,y+25)
            self.text(98,809,"Les paiements et statuts restent indicatifs tant que les partenaires ne sont pas confirmés.",9,P["muted"],450)

    def screen_admin_products(self):
        self.start_screen(16, "BO / Catalogue produits")
        if self.mobile:
            self.text(18,135,"Catalogue",20,P["ink"],800)
            self.text(18,158,"Validez les fiches avant publication.",9,P["muted"],450)
            self.button(250,124,126,32,"+ Ajouter",size=8)
            self.pill(14,175,"En attente · 7",P["forest"],P["white"],112); self.pill(134,175,"En ligne · 34",P["leaf"],P["forest"],116); self.pill(258,175,"Refusés · 2",P["leaf"],P["forest"],104)
            rows=[("eggplant","Aubergines du jardin","Ferme RAKOTO","2 500 Ar / kg","Stock : 18 kg"),("banana","Bananes mûres","Ferme Soa","4 000 Ar / régime","Stock : 12 régimes"),("greens","Brèdes mafana","Potager de Lalao","2 000 Ar / botte","Stock : 25 bottes"),("tomato","Tomates bien mûres","La ferme verte","3 500 Ar / kg","Stock : 9 kg")]
            for i,(key,title,seller,price,stock) in enumerate(rows):
                y=218+i*128; self.card(14,y,362,112)
                self.image(24,y+11,72,72,key,10); self.text(106,y+30,title,8,P["ink"],700); self.text(106,y+49,seller,7,P["muted"],450); self.text(106,y+69,price,8,P["forest"],700); self.text(106,y+91,stock,7,P["muted"],450); self.text(356,y+99,"Examiner →",7,P["forest"],700,"end")
            self.footer()
        else:
            self.text(72,186,"Catalogue produits",29,P["ink"],800)
            self.text(72,212,"Gérez les prix, stocks, photos et publications du marché.",11,P["muted"],450)
            self.button(1177,170,191,43,"+  Ajouter un produit",size=10)
            self.pill(72,244,"À valider · 7",P["forest"],P["white"],115); self.pill(197,244,"En ligne · 34",P["leaf"],P["forest"],116); self.pill(323,244,"Refusés · 2",P["leaf"],P["forest"],105)
            self.card(72,289,1296,520)
            self.text(98,328,"Fiches produits",15,P["ink"],750); self.text(1328,328,"Filtrer par producteur  ⌄",9,P["muted"],500,"end")
            self.line(98,350,1342,350)
            for x,label in [(98,"PRODUIT"),(405,"PRODUCTEUR"),(700,"PRIX"),(850,"STOCK"),(1000,"STATUT")]:self.text(x,375,label,8,P["muted"],750,letter=.5)
            rows=[("eggplant","Aubergines du jardin","Ferme RAKOTO","2 500 Ar / kg","18 kg","À valider"),("banana","Bananes mûres","Ferme Soa","4 000 Ar / régime","12 régimes","À valider"),("greens","Brèdes mafana","Potager de Lalao","2 000 Ar / botte","25 bottes","En ligne"),("tomato","Tomates bien mûres","La ferme verte","3 500 Ar / kg","9 kg","En ligne")]
            for i,(key,title,seller,price,stock,status) in enumerate(rows):
                y=407+i*93; self.image(98,y-10,56,56,key,9); self.text(170,y+10,title,9,P["ink"],700); self.text(405,y+10,seller,9,P["muted"],500); self.text(700,y+10,price,9,P["ink"],600); self.text(850,y+10,stock,9,P["ink"],500); self.pill(1000,y-7,status,P["pending"] if status=="À valider" else P["leaf"],P["pendingText"] if status=="À valider" else P["forest"],105); self.text(1332,y+10,"Modifier  ⋯",8,P["forest"],700,"end"); self.line(170,y+36,1342,y+36)
            self.card(72,827,1296,40,P["soft"],11,P["soft"]); self.text(92,852,"Chaque annonce affiche une unité, une zone de livraison et un stock à jour.",9,P["forest"],600)

    def compose_screen(self, idx, name):
        funcs={1:self.screen_home,2:self.screen_login,3:self.screen_signup,4:self.screen_recovery,5:self.screen_verify,6:self.screen_product,7:self.screen_cart,8:self.screen_delivery,9:self.screen_payment,10:self.screen_confirmation,11:self.screen_tracking,12:self.screen_orders,13:self.screen_seller,14:self.screen_admin,15:self.screen_admin_orders,16:self.screen_admin_products}
        funcs[idx]()
        self.add('</g>')

    def build(self, out_path):
        cols=4
        names=["Marché","Connexion","Créer un compte","Mot de passe oublié","Vérification du compte","Fiche produit","Panier","Livraison","Paiement","Commande confirmée","Suivi commande","Mes commandes","Espace producteur","Back-office","BO commandes","BO catalogue"]
        rows=(len(names)+cols-1)//cols
        board_w=self.margin*2+cols*self.w+(cols-1)*self.gap_x
        board_h=self.margin*2+rows*(self.title_h+self.h)+(rows-1)*self.gap_y
        self.parts=[f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{board_w}" height="{board_h}" viewBox="0 0 {board_w} {board_h}">']
        self.parts.append(f'<defs><linearGradient id="hero-gradient" x1="0" x2="1"><stop offset="0" stop-color="{P["forest"]}" stop-opacity=".98"/><stop offset=".59" stop-color="{P["forest"]}" stop-opacity=".76"/><stop offset="1" stop-color="{P["forest"]}" stop-opacity=".08"/></linearGradient></defs>')
        self.parts.append(f'<rect width="{board_w}" height="{board_h}" fill="#eeede7"/>')
        for idx,name in enumerate(names,1):
            row=(idx-1)//cols
            col=(idx-1)%cols
            x=self.margin+col*(self.w+self.gap_x)
            y=self.margin+row*(self.title_h+self.h+self.gap_y)
            self.parts.append(f'<text x="{x}" y="{y+22}" fill="{P["forest"]}" font-family="Inter,Arial,sans-serif" font-size="14" font-weight="700">{idx:02d}  {html.escape(name)}{" · Mobile" if self.mobile else " · Desktop"}</text>')
            self.parts.append(f'<g id="{"mobile" if self.mobile else "desktop"}-{idx:02d}-{name.lower().replace(" ","-")} " transform="translate({x},{y+self.title_h})">')
            self.compose_screen(idx,name)
        self.parts.append('</svg>')
        out_path.write_text("\n".join(self.parts),encoding="utf-8")
        return board_w,board_h,out_path.stat().st_size

desktop=Board(False).build(OUT/"MadaAgri-Desktop.svg")
mobile=Board(True).build(OUT/"MadaAgri-Mobile.svg")
print(f"Desktop SVG: {desktop[0]}x{desktop[1]}, {desktop[2]:,} bytes")
print(f"Mobile SVG: {mobile[0]}x{mobile[1]}, {mobile[2]:,} bytes")

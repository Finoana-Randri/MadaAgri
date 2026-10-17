# MadaAgri Market

Application web locale pour le marché de produits agricoles malgaches.

L’interface est en **React 19 + Tailwind CSS 4** (dossier `frontend/`, outillage Vite). Le serveur Python (`server.py`) fournit l’API JSON sous `/api`, les photos sous `/assets` et sert l’interface compilée.

## Lancer l’application

Il faut Python 3 et Node.js 20 ou plus. Compiler l’interface une première fois, puis après chaque modification du dossier `frontend/` :

    cd frontend
    npm install
    npm run build
    cd ..

Puis lancer le serveur depuis ce dossier :

    python server.py --demo

Puis ouvrir http://127.0.0.1:8000. Pour choisir un autre port :

    python server.py --demo --port 8765

Le mode démo crée ces comptes locaux :

- Acheteur : acheteur@madaagri.test / acheteur123
- Producteur : producteur@madaagri.test / producteur123
- Coopérative : coop@madaagri.test / coop12345
- Productrice : lalao@madaagri.test / lalao12345
- Ferme Soa : soa@madaagri.test / fermesoa123
- Administration : admin@madaagri.test / admin123

Il ajoute aussi, une seule fois, trois fiches produits et trois comptes producteurs en attente de vérification, pour que le back-office ait des éléments à traiter.

Pour développer l’interface avec rechargement instantané, laisser le serveur Python tourner sur le port 8765 et lancer dans un second terminal `npm run dev` depuis `frontend/`, puis ouvrir http://localhost:5173 (les appels `/api` et `/assets` sont relayés vers le port 8765).

Les données sont conservées dans madaagri.sqlite3, dans ce dossier. Les comptes créés depuis l’application sont enregistrés localement.

## Fonctions incluses

- Catalogue responsive avec recherche, filtres, tri et fiches produits illustrées.
- Comptes acheteur et producteur, vérification du numéro de téléphone par code à 6 chiffres (écran 05), panier, demande de commande, suivi et notifications.
- Cycle de livraison complet depuis le suivi de commande : le producteur propose les frais, l’acheteur les accepte ou refuse, puis préparation, départ en livraison et remise.
- Espace producteur (tableau de bord, commandes récentes, fiches ajoutées ou modifiées dans une fenêtre dédiée).
- Ajout de photos PNG, JPEG ou WebP (2 Mo maximum), correction du stock, modification et désactivation des produits.
- Administration des profils (validation, suspension, recherche), des catégories, unités, zones et frais, avec modération des fiches produits, réclamations et export CSV.
- Avis et réclamations après livraison.
- Statuts de commande et de paiement séparés, confirmation manuelle du paiement avec référence de reçu, et historique des décisions.

## Vérifier

    python -m unittest discover -s tests -v
    npm --prefix frontend run build

Les 16 écrans suivent les planches de `figma-import/` (1440 × 960 et 390 × 844), avec une URL par écran : `/`, `/connexion`, `/inscription`, `/mot-de-passe`, `/verification`, `/produit/:id`, `/panier`, `/livraison`, `/paiement`, `/confirmation/:id`, `/commandes/:id`, `/commandes`, `/producteur`, `/admin`, `/admin/commandes`, `/admin/catalogue`, `/admin/parametres`. Les couleurs et points de rupture de la maquette sont dans `frontend/src/index.css` (thème Tailwind) ; les écrans sont dans `frontend/src/pages/`.

Le serveur ne publie que l’interface compilée et le dossier `assets/` : la base SQLite et le code source ne sont pas accessibles par le navigateur. L’ancienne interface sans framework est conservée dans `legacy-vanilla/` pour référence ; elle n’est plus servie.

Les tests HTTP utilisent une base SQLite temporaire. La démonstration sur `http://127.0.0.1:8765/` est actuellement démarrée sur ce poste.

Le paiement en ligne, les SMS, l’envoi d’e-mails et les frais de livraison automatiques ne sont pas configurés. Une commande est une demande au producteur ; aucun montant n’est débité sur le site. Les frais éventuels et le montant final sont confirmés avant l’engagement définitif. Le code de réinitialisation du mot de passe et le code de vérification du téléphone sont affichés uniquement en mode démo ; hors démo, ces envois renvoient une erreur tant qu’aucun prestataire e-mail/SMS n’est configuré. Avant une exploitation publique, il faut configurer HTTPS, les courriels, les conditions d’utilisation, la confidentialité, les modalités de livraison et les accords avec les prestataires de paiement.

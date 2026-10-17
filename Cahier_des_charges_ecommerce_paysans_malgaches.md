# Cahier des charges fonctionnel

## Plateforme e-commerce pour les agriculteurs malgaches

**Nom provisoire du projet :** MadaAgri Market\
**Version :** 1.0 --- 9 octobre 2026\
**Statut :** Proposition de cadrage à valider

> Le nom, la zone pilote, les moyens de paiement et les partenaires de
> livraison restent à confirmer.

------------------------------------------------------------------------

## 1. Présentation du projet

### 1.1 Contexte et problématique

De nombreux producteurs agricoles ont des difficultés à trouver
régulièrement des acheteurs, à faire connaître leurs produits et à
obtenir une visibilité claire sur les prix. De leur côté, les ménages,
épiceries, restaurants, hôtels et entreprises peuvent perdre du temps à
chercher des produits disponibles, à comparer les prix et à organiser le
transport.

Le projet consiste à créer un site e-commerce adapté au contexte
malgache, permettant aux producteurs de publier leurs produits et aux
acheteurs de commander directement. La plateforme facilite la commande,
la communication, le paiement et la livraison, sans garantir à elle
seule la qualité des récoltes ni remplacer les contrôles nécessaires.

### 1.2 Vision

Créer une place de marché simple, fiable et accessible qui aide les
agriculteurs malgaches à vendre leurs produits et permet aux acheteurs
de s'approvisionner plus facilement.

### 1.3 Objectifs

-   Donner aux producteurs une vitrine numérique simple à utiliser, même
    avec une connexion limitée.
-   Permettre aux acheteurs de rechercher des produits par catégorie,
    zone, prix et disponibilité.
-   Faciliter les commandes au détail et en gros, avec des unités
    adaptées : kg, sac, caisse ou tonne.
-   Améliorer la transparence des prix, des quantités, des frais de
    livraison et du statut des commandes.
-   Tester le modèle dans une seule zone géographique avant une
    extension progressive.
-   Créer un modèle économique viable grâce à une commission sur les
    ventes et, éventuellement, des services complémentaires.

## 2. Périmètre du projet

### 2.1 Version MVP (première version)

La première version doit rester simple et concentrée sur les fonctions
indispensables :

-   Site web responsive, utilisable sur ordinateur et téléphone.
-   Comptes acheteurs et producteurs, avec validation des profils
    producteurs par l'administration.
-   Catalogue de produits, photos, prix, unité de vente, stock estimé et
    zone de disponibilité.
-   Recherche et filtres, fiche produit, panier et création de commande.
-   Choix du mode de paiement parmi les moyens réellement disponibles et
    confirmés au lancement.
-   Gestion des commandes, statuts et notifications simples.
-   Gestion manuelle ou semi-manuelle de la livraison par zone.
-   Espace administrateur pour gérer les comptes, produits, commandes,
    litiges et commissions.

### 2.2 Fonctions prévues pour une version ultérieure

-   Application mobile Android dédiée ou Progressive Web App (PWA)
    enrichie.
-   Précommandes de récoltes et commandes groupées entre plusieurs
    acheteurs.
-   Tableau de bord avancé pour producteurs : ventes, revenus, produits
    les plus demandés.
-   Gestion automatisée des transporteurs et suivi GPS, si les
    partenaires le permettent.
-   Offres B2B, abonnements professionnels et services premium.
-   Conseils agricoles ou informations de marché, uniquement après
    validation de leur fiabilité.

### 2.3 Hors périmètre initial

-   Octroi de crédits aux producteurs ou acheteurs.
-   Garantie automatique de la qualité, de l'origine ou de la
    certification d'un produit sans contrôle.
-   Gestion complète des stocks physiques des exploitations.
-   Livraison nationale immédiate dès le lancement.
-   Intégration de moyens de paiement ou de transporteurs avant accord
    contractuel.

## 3. Utilisateurs et rôles

  -----------------------------------------------------------------------
  Rôle                    Besoins principaux      Droits principaux
  ----------------------- ----------------------- -----------------------
  Visiteur                Découvrir les produits  Consulter le catalogue
                          et comprendre le        public et les pages
                          fonctionnement          d'information

  Acheteur                Trouver, comparer et    Gérer son profil,
                          commander des produits  panier, commandes, avis
                                                  et demandes
                                                  d'assistance

  Producteur              Publier ses produits et Gérer ses produits,
                          recevoir des commandes  prix, quantités
                                                  disponibles et
                                                  commandes reçues

  Administrateur          Assurer le bon          Valider les
                          fonctionnement de la    producteurs, modérer
                          plateforme              les annonces, gérer les
                                                  commandes, litiges et
                                                  paramètres

  Gestionnaire logistique Organiser les           Consulter les
  (optionnel)             livraisons              livraisons qui lui sont
                                                  attribuées et mettre à
                                                  jour leur statut
  -----------------------------------------------------------------------

## 4. Fonctionnalités détaillées

### 4.1 Inscription et connexion

**Objectif :** permettre à chaque utilisateur d'accéder aux fonctions
correspondant à son rôle.

**Fonctionnement :** inscription par téléphone ou e-mail selon le choix
retenu, vérification du contact, connexion sécurisée, réinitialisation
du mot de passe et acceptation des conditions d'utilisation.

**Résultat attendu :** chaque compte est identifiable et les accès sont
limités selon le rôle.

**Règle :** un compte producteur reste non publié tant que les
informations nécessaires n'ont pas été vérifiées par l'administration.

### 4.2 Profil producteur et vérification

**Objectif :** renforcer la confiance entre vendeurs et acheteurs.

**Fonctionnement :** le producteur renseigne son nom ou nom
d'exploitation, sa commune/région, ses coordonnées, les types de
produits vendus et les modalités de retrait/livraison. L'administrateur
examine les informations et accepte, refuse ou demande des corrections.

**Résultat attendu :** les acheteurs peuvent consulter des profils avec
un statut de vérification clairement indiqué.

### 4.3 Catalogue et fiches produits

**Objectif :** présenter les produits disponibles avec des informations
compréhensibles.

Chaque fiche produit contient :

-   Nom du produit, catégorie, description et photos.
-   Prix et devise affichés clairement, par exemple Ariary (Ar).
-   Unité de vente : kg, sac, caisse, litre, pièce ou tonne, selon le
    produit.
-   Quantité disponible estimée, quantité minimale et possibilité de
    vente en gros.
-   Localisation approximative, période de disponibilité et date de mise
    à jour.
-   Conditions de retrait ou de livraison et informations utiles sur le
    conditionnement.

**Règle :** un produit épuisé ou désactivé ne peut pas être commandé. Le
producteur doit pouvoir corriger rapidement le stock et le prix.

### 4.4 Recherche et filtres

Les acheteurs peuvent rechercher par mot-clé et filtrer par catégorie,
zone géographique, fourchette de prix, disponibilité et type de vente
(détail/gros). Les résultats indiquent clairement le prix et l'unité
correspondante.

### 4.5 Panier et commande

L'acheteur sélectionne un produit, choisit la quantité, vérifie le
récapitulatif et indique les informations nécessaires à la livraison ou
au retrait. Avant validation, il voit le sous-total, les frais connus,
le total estimé et les conditions de commande.

Une commande peut être composée de produits d'un seul producteur au MVP.
Les commandes multi-producteurs pourront être ajoutées après étude des
impacts logistiques.

### 4.6 Paiement

Le MVP doit proposer uniquement les moyens de paiement effectivement
disponibles, testés et autorisés pour le projet. Les options possibles à
étudier comprennent le paiement à la livraison, le virement et les
services de mobile money locaux, sous réserve d'accords et
d'intégration.

Le système enregistre le mode choisi et le statut du paiement : en
attente, confirmé, échoué, remboursé ou non applicable. Il ne doit
jamais afficher un paiement comme confirmé sans preuve ou confirmation
fiable.

### 4.7 Livraison et retrait

Au lancement, la livraison peut être organisée manuellement par l'équipe
ou par des partenaires locaux. La commande précise l'adresse ou le point
de retrait, les frais estimés, le responsable de la livraison et le
statut : à organiser, confirmée, en cours, livrée ou échec de livraison.

Les délais et tarifs doivent être communiqués avant la confirmation de
commande lorsqu'ils sont connus. Si le coût dépend du poids, de la
distance ou du volume, le site doit l'expliquer et demander confirmation
avant validation définitive.

### 4.8 Notifications et communication

L'acheteur et le producteur reçoivent une notification lors des
événements importants : nouvelle commande, acceptation ou refus,
modification de statut, annulation et livraison. Le MVP peut commencer
par des notifications dans le site et par e-mail ou SMS selon le coût et
la disponibilité.

### 4.9 Avis et réclamations

Après une commande livrée, l'acheteur peut laisser une note et un
commentaire. Les avis doivent être rattachés à une commande réelle. Un
formulaire de réclamation permet de signaler un produit non conforme,
une quantité manquante, un retard ou un problème de paiement.
L'administrateur suit le traitement.

### 4.10 Administration

L'administrateur peut :

-   Consulter, rechercher, activer ou suspendre des comptes.
-   Valider les profils producteurs et modérer les produits publiés.
-   Consulter les commandes et modifier les statuts selon les droits
    définis.
-   Gérer les catégories, unités de vente, zones desservies et frais de
    service.
-   Traiter les réclamations, annulations et demandes de remboursement.
-   Consulter des indicateurs : nombre d'inscrits, commandes, ventes,
    commissions et produits actifs.
-   Exporter les données utiles en CSV, avec accès réservé aux personnes
    autorisées.

## 5. Parcours utilisateurs

### 5.1 Parcours d'un acheteur

1.  Il ouvre le site et choisit sa zone ou saisit le produit recherché.
2.  Il compare les offres, les prix par unité, la disponibilité et les
    informations du producteur.
3.  Il ouvre une fiche produit, choisit une quantité et l'ajoute au
    panier.
4.  Il confirme ses coordonnées, son mode de retrait/livraison et le
    mode de paiement disponible.
5.  Il vérifie le total et confirme la commande.
6.  Il reçoit un numéro de commande et consulte l'évolution de son
    statut.
7.  Après réception, il peut laisser un avis ou déposer une réclamation.

### 5.2 Parcours d'un producteur

1.  Il crée son compte et complète son profil.
2.  L'administration vérifie le profil et l'autorise à publier.
3.  Il ajoute un produit avec photos, prix, unité, quantité estimée et
    zone.
4.  Il reçoit une notification lorsqu'une commande arrive.
5.  Il accepte ou refuse la commande selon la disponibilité et les
    règles de la plateforme.
6.  Il prépare les produits et coordonne le retrait ou la livraison.
7.  Il met à jour le stock et consulte l'historique de ses commandes.

### 5.3 Parcours de traitement d'une commande

  -----------------------------------------------------------------------
  Statut                              Signification
  ----------------------------------- -----------------------------------
  En attente de confirmation          Commande créée, réponse du
                                      producteur attendue

  Acceptée                            Producteur confirme la
                                      disponibilité

  Paiement en attente / confirmé      État du paiement selon le mode
                                      choisi

  À préparer                          Produits en préparation

  En livraison / prête au retrait     Commande transmise au mode de
                                      remise choisi

  Livrée / retirée                    Acheteur ou responsable confirme la
                                      réception

  Annulée / échec                     Commande interrompue avec motif
                                      enregistré

  Réclamation ouverte                 Un problème est en cours de
                                      traitement
  -----------------------------------------------------------------------

## 6. Règles de gestion

-   Les prix sont associés à une unité explicite ; aucun prix au kg ne
    doit être présenté comme un prix par sac.
-   Le producteur est responsable de l'exactitude des informations qu'il
    publie et doit actualiser ses disponibilités.
-   Une commande n'est confirmée côté producteur qu'après acceptation
    explicite ou règle équivalente définie.
-   Les frais et le total connus sont affichés avant l'engagement de
    l'acheteur.
-   Toute annulation doit comporter un motif et conserver une trace dans
    l'historique.
-   Les remboursements et litiges suivent une procédure publiée et
    validée avant le lancement.
-   Les avis ne sont autorisés qu'après une commande réelle et ne
    peuvent être modifiés par l'administration que selon une politique
    de modération.
-   Les données personnelles ne sont accessibles qu'aux rôles qui en ont
    besoin.
-   La commission de la plateforme doit être affichée dans les
    conditions destinées aux producteurs et calculée selon une règle
    transparente.

## 7. Exigences non fonctionnelles

  -----------------------------------------------------------------------
  Domaine                             Exigence
  ----------------------------------- -----------------------------------
  Ergonomie                           Interface simple, claire,
                                      mobile-first, libellés
                                      compréhensibles et formulaires
                                      courts.

  Connexion limitée                   Pages légères, images optimisées,
                                      limitation des scripts lourds et
                                      messages d'erreur utiles.

  Compatibilité                       Navigateurs récents sur Android,
                                      Windows et appareils courants ;
                                      tests sur petits écrans.

  Performance                         Objectif initial : pages
                                      principales utilisables en quelques
                                      secondes sur une connexion moyenne
                                      ; mesurer avant de fixer un SLA.

  Sécurité                            HTTPS, mots de passe hachés,
                                      contrôle des rôles, validation des
                                      entrées, protection contre les
                                      attaques courantes et sauvegardes.

  Confidentialité                     Collecter uniquement les données
                                      nécessaires, expliquer leur usage
                                      et limiter leur accès.

  Disponibilité                       Surveillance des erreurs et
                                      procédure de restauration après
                                      incident.

  Évolutivité                         Architecture permettant d'ajouter
                                      des catégories, zones, paiements et
                                      fonctions sans réécrire toute
                                      l'application.

  Traçabilité                         Historique des changements
                                      importants : statut de commande,
                                      paiement, prix et actions
                                      administrateur.
  -----------------------------------------------------------------------

## 8. Proposition technique initiale

Cette proposition est indicative et devra être validée selon les
compétences de l'équipe, le budget, l'hébergement et les moyens de
paiement retenus.

  -----------------------------------------------------------------------
  Élément                 Proposition             Raison
  ----------------------- ----------------------- -----------------------
  Interface               Laravel Blade +         Livrer une interface
                          Tailwind CSS, ou React  responsive sans
                          si l'équipe le maîtrise complexité excessive

  Backend / API           Laravel (PHP)           Gestion des comptes,
                                                  règles métier,
                                                  commandes et
                                                  administration

  Base de données         MySQL ou PostgreSQL     Stockage structuré des
                                                  utilisateurs, produits,
                                                  commandes et paiements

  Images                  Stockage objet ou       Optimisation et gestion
                          stockage serveur        des photos produits
                          sécurisé avec           
                          sauvegarde              

  Hébergement             Hébergement Linux ou    Déploiement maintenable
                          cloud avec HTTPS,       et restauration
                          sauvegardes et          possible
                          monitoring              

  Notifications           E-mail au départ ;      Limiter les coûts du
                          SMS/mobile money selon  MVP
                          intégrations            
                          disponibles             

  Tests                   Tests automatisés       Réduire les régressions
                          backend + tests         avant mise en
                          fonctionnels navigateur production

  Déploiement             Environnements          Tester les changements
                          développement, test et  avant leur publication
                          production séparés      
  -----------------------------------------------------------------------

### 8.1 Principales entités de données

-   **Utilisateur :** identifiant, nom, téléphone/e-mail, rôle, statut
    et date de création.
-   **Profil producteur :** utilisateur associé, zone, description,
    statut de vérification.
-   **Produit :** producteur, nom, catégorie, description, unité, prix,
    quantité, photos, statut.
-   **Commande :** acheteur, producteur, lignes de commande, total,
    livraison, paiement et statut.
-   **Ligne de commande :** produit, quantité, prix unitaire enregistré
    au moment de la commande.
-   **Paiement :** mode, référence externe si applicable, montant et
    statut.
-   **Livraison :** adresse ou point de retrait, frais, responsable et
    statut.
-   **Avis et réclamation :** commande associée, contenu, statut de
    traitement et historique.
-   **Journal d'audit :** action, auteur, date et objet concerné.

## 9. Sécurité et protection des données

-   Forcer HTTPS et ne jamais stocker les mots de passe en clair.
-   Mettre en place des rôles et permissions côté serveur, pas seulement
    dans l'interface.
-   Valider les fichiers téléversés (type, taille, extension) et les
    entrées utilisateur.
-   Protéger les formulaires contre les attaques courantes et limiter
    les tentatives de connexion.
-   Sauvegarder la base de données et tester régulièrement la
    restauration.
-   Éviter de stocker des données bancaires sensibles ; utiliser les
    mécanismes du prestataire de paiement.
-   Prévoir une politique de confidentialité, des conditions
    d'utilisation et une procédure de suppression/correction des données
    conforme aux règles applicables.

## 10. Critères d'acceptation du MVP

  -----------------------------------------------------------------------
  ID                                  Critère vérifiable
  ----------------------------------- -----------------------------------
  CA-01                               Un visiteur peut consulter le
                                      catalogue sans créer de compte.

  CA-02                               Un acheteur peut créer un compte,
                                      se connecter et réinitialiser son
                                      accès.

  CA-03                               Un producteur non validé ne peut
                                      pas publier de produit visible
                                      publiquement.

  CA-04                               Un producteur validé peut créer,
                                      modifier, désactiver et mettre à
                                      jour la quantité d'un produit.

  CA-05                               La fiche produit affiche le prix,
                                      l'unité, la disponibilité et la
                                      zone.

  CA-06                               Un acheteur peut ajouter un produit
                                      disponible au panier et modifier la
                                      quantité.

  CA-07                               Le système affiche le récapitulatif
                                      et les frais connus avant
                                      confirmation.

  CA-08                               Une commande créée possède un
                                      numéro unique et apparaît dans les
                                      espaces concernés.

  CA-09                               Les statuts de commande et de
                                      paiement sont distincts et
                                      cohérents.

  CA-10                               L'administrateur peut traiter une
                                      réclamation et consulter son
                                      historique.

  CA-11                               Les pages principales sont
                                      utilisables sur téléphone et les
                                      erreurs sont compréhensibles.

  CA-12                               Les tests de permissions empêchent
                                      un utilisateur d'accéder aux
                                      données privées d'un autre.
  -----------------------------------------------------------------------

## 11. Plan de tests QA

-   Tests d'inscription, connexion, déconnexion et récupération de
    compte.
-   Tests de rôles : acheteur, producteur, administrateur et accès
    interdit.
-   Tests de création de produit, stock nul, prix invalide, unité
    manquante et photo trop volumineuse.
-   Tests du panier : quantité minimale, modification de prix, produit
    désactivé et stock insuffisant.
-   Tests de commande : acceptation, refus, annulation, livraison et
    réclamation.
-   Tests de paiement : succès, échec, attente et absence de
    confirmation fiable.
-   Tests responsive sur téléphone, tablette et ordinateur.
-   Tests de performance sur connexion lente et avec plusieurs photos.
-   Tests de sauvegarde, restauration et journalisation des actions
    sensibles.

## 12. Modèle économique

Hypothèse de départ à tester auprès des producteurs et acheteurs :

-   **Commission sur les ventes :** hypothèse de 5 à 10 %, à négocier et
    à valider selon les coûts réels.
-   **Frais de livraison :** facturés séparément lorsque la plateforme
    organise ou coordonne la livraison.
-   **Services B2B ultérieurs :** outils ou accompagnement pour
    acheteurs professionnels, sans bloquer l'accès de base aux
    producteurs.
-   **Options premium ultérieures :** mise en avant ou outils de
    gestion, uniquement si les utilisateurs démontrent une réelle
    volonté de payer.

Avant de fixer la commission, calculer les coûts de paiement,
assistance, acquisition des utilisateurs, retours, remboursements et
opérations logistiques. Le modèle doit être testé sur un petit nombre de
transactions réelles.

## 13. Indicateurs de réussite

-   Nombre de producteurs inscrits, vérifiés et actifs.
-   Nombre de produits disponibles et taux de mise à jour des stocks.
-   Nombre de commandes créées, acceptées, livrées et annulées.
-   Valeur totale des ventes et revenu net de la plateforme.
-   Délai moyen de réponse des producteurs et délai de livraison.
-   Taux de réclamation, taux de remboursement et satisfaction des
    acheteurs.
-   Part des acheteurs qui commandent à nouveau.

## 14. Planning indicatif

  ------------------------------------------------------------------------
  Phase                   Travaux                  Livrable indicatif
  ----------------------- ------------------------ -----------------------
  1\. Cadrage             Entretiens               Périmètre validé et
                          producteurs/acheteurs,   maquettes simples
                          choix zone pilote,       
                          catégories et règles     

  2\. Conception          Parcours, écrans, modèle Maquettes et
                          de données et            spécifications
                          architecture             techniques

  3\. Développement MVP   Comptes, catalogue,      Version de test
                          commandes,               utilisable
                          administration           

  4\. Paiement/livraison  Intégrations confirmées  Flux de commande
                          ou processus manuel      complet
                          documenté                

  5\. QA et pilote        Tests, correction,       Rapport de tests et
                          formation et test avec   version pilote
                          petit groupe             

  6\. Lancement           Mise en production,      MVP lancé dans une zone
                          suivi des indicateurs et définie
                          assistance               
  ------------------------------------------------------------------------

Durée indicative : à estimer après confirmation du périmètre, de la
taille de l'équipe et des intégrations. Ne pas annoncer de date ferme
avant le cadrage.

## 15. Risques et mesures de réduction

  -----------------------------------------------------------------------
  Risque                              Mesure proposée
  ----------------------------------- -----------------------------------
  Stocks ou prix non actualisés       Rappel de mise à jour, date de
                                      dernière modification et
                                      désactivation des annonces
                                      anciennes.

  Connexion Internet faible           Pages légères, images compressées
                                      et parcours de commande court.

  Transport difficile ou coûteux      Commencer dans une zone limitée et
                                      publier les frais avant
                                      confirmation.

  Manque de confiance                 Vérification des producteurs, avis
                                      liés aux commandes et procédure de
                                      réclamation.

  Faible adoption numérique           Interface simple, démonstrations,
                                      assistance et possibilité
                                      d'accompagnement local.

  Paiements non intégrables           Démarrer avec un mode opérationnel
                                      confirmé et documenter les étapes
                                      manuelles.

  Marge insuffisante                  Tester la commission, suivre les
                                      coûts par commande et ajuster après
                                      le pilote.
  -----------------------------------------------------------------------

## 16. Décisions à valider avant le développement

-   Nom définitif de la plateforme et identité visuelle.
-   Zone géographique pilote et communes réellement desservies.
-   Premières catégories agricoles (par exemple riz, légumes, fruits ou
    épices), selon les producteurs disponibles.
-   Cible prioritaire : ménages, épiceries, restaurants/hôtels, ou
    combinaison progressive.
-   Vente au détail, en gros, ou les deux dès le MVP.
-   Modes de paiement confirmés avec les prestataires et règles de
    remboursement.
-   Organisation de la livraison, frais, responsabilité et preuve de
    réception.
-   Commission, calendrier de versement aux producteurs et gestion des
    litiges.
-   Langues de l'interface : français, malagasy, ou les deux.
-   Budget, équipe, calendrier et niveau de support après lancement.

## 17. Conclusion

MadaAgri Market est une proposition de place de marché numérique reliant
les agriculteurs malgaches aux acheteurs. Pour limiter les risques, il
est recommandé de lancer un MVP dans une zone restreinte, avec quelques
catégories de produits, un processus de commande simple et une
logistique maîtrisée. Les décisions commerciales et opérationnelles
listées dans ce document doivent être validées avec de vrais producteurs
et acheteurs avant le développement complet.

### Validation du projet

  Partie prenante                                       Nom / signature   Date
  ----------------------------------------------------- ----------------- ------
  Porteur du projet                                                       
  Référent technique                                                      
  Représentant des producteurs / utilisateurs pilotes                     

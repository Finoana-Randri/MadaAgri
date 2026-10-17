# Plan de développement MadaAgri

Références : `Cahier_des_charges_ecommerce_paysans_malgaches.md` (copie identique au document de `Documents/madagreen`) et les 16 écrans desktop + 16 écrans mobile dans `figma-import/`.

## Étapes

1. **Cadrage et correspondance des écrans** : critères CA-01 à CA-12, règles de gestion, 16 écrans desktop et 16 écrans mobile relevés dans les fichiers Figma (1440 × 960 et 390 × 844). Réalisé.
2. **Socle fonctionnel** : serveur Python, SQLite, comptes et rôles, catalogue, panier, demande de commande, statuts distincts, vérification et modération. Réalisé pour le MVP local.
3. **Interfaces** : écrans acheteur, producteur et administration, avec états vides et données de l’API. Alignement sur les maquettes aux dimensions de référence ; mise en page tablette et tailles intermédiaires. Réalisé pour le MVP local.
4. **Sécurité et exploitation** : validation serveur, droits par rôle, limitation des tentatives de connexion, journaux des décisions et photos contrôlées. Réalisé localement ; le déploiement public reste à configurer.
5. **Vérification** : tests HTTP des parcours critiques et navigation réelle sur mobile et desktop. Réalisé ; cinq tests automatisés passent.

## Écarts relevés dans le MVP

- Le paiement par prestataire, les frais et zones de livraison, les remboursements réels, l’envoi d’e-mails et les textes juridiques dépendent de choix et accords commerciaux extérieurs au code. Le parcours local prend une demande de commande, sans débit.
- Les frais de livraison ne sont pas chiffrés tant qu’un tarif n’est pas fourni ; ils sont annoncés comme « à confirmer » avant tout engagement définitif.
- Avant mise en production : HTTPS, sauvegardes planifiées, surveillance, configuration des e-mails et conditions/confidentialité validées.

Le suivi de ces points se fait dans le code et les vérifications, pas dans des chiffres de maquette figés.

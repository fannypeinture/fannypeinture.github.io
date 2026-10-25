# Fanny Peinture

Site vitrine de Fanny Marescaux : peinture intérieure, enduits, décoration, fibre et papier peint. Intervention en Moselle.

Site : https://fannypeinture.montironi.fr/ — GitHub Pages, branche `main`, racine du dépôt.

## Contenu livré

- Accueil, prestations détaillées et galerie filtrable.
- Swiper 14.3.0 : fondu, mouvement doux, pause, navigation tactile et prise en compte de la réduction des animations.
- PhotoSwipe 5.4.4 : agrandissement, zoom, navigation et photos non recadrées dans la visionneuse.
- Contact avec liens préremplis depuis les prestations, téléphone facultatif, commune et traitement des erreurs d’envoi.
- Form.taxi `https://form.taxi/s/lp2ujynn`. Envoi AJAX avec vérification explicite du succès avant la page `merci.html`. Sans JavaScript, le POST natif utilise la confirmation Form.taxi.
- Mentions légales, confidentialité, crédits et page 404.
- Photos, polices et modules publics hébergés dans le dépôt. Aucune mesure d’audience.

## Photos et gestion

Les quatre photos initiales proviennent de Pexels. Elles sont marquées comme illustrations et ne représentent pas les travaux de Fanny. Sources : `credits.html`. Ne pas les présenter comme des chantiers de l’entreprise.

La galerie utilise `content/gallery.json`, lu directement par la page : les publications du CMS sont répercutées après le déploiement GitHub Pages, sans compilation.

L’espace Sveltia CMS est disponible à `/admin/`. Configuration du compte et du dépôt en place ; collections par chantier, catégories multiples, couverture, photos ordonnées, publication et sélection dans l’accueil. Conversion WebP et redimensionnement maximal de 2400 px configurés à l’envoi.

**À terminer pour Fanny : connexion OAuth simplifiée.** Créer une application OAuth GitHub et déployer Sveltia CMS Authenticator sur Cloudflare Workers, puis renseigner `backend.base_url` dans `admin/config.yml`. Documentation : https://sveltiacms.app/en/docs/backends/github. Ne pas laisser la connexion par défaut Netlify comme solution finale. Un jeton personnel peut servir à un test technique, mais ce n’est pas le parcours souhaité pour Fanny. Aucun secret ne doit être enregistré dans le dépôt.

Raccourci téléphone : ouvrir `https://fannypeinture.montironi.fr/admin/` puis « Ajouter à l’écran d’accueil », nom « Gérer mon site ».

## Téléphone protégé

Le numéro réel est volontairement absent du dépôt public. Un lien fonctionnel « Demander à être rappelé » est affiché tant que le service sécurisé n’est pas configuré.

Le Worker `backend/phone-worker.mjs` est prêt à déployer. Renseigner les secrets `TURNSTILE_SECRET`, `PHONE_NUMBER` au format E.164 et éventuellement `PHONE_DISPLAY`. Utiliser `ALLOWED_ORIGIN=https://fannypeinture.montironi.fr`. Ajouter un binding Cloudflare Rate Limiting nommé `PHONE_RATE_LIMITER`, par exemple 5 demandes par minute et par adresse IP.

Créer un widget Turnstile géré pour le domaine. Ajouter ensuite uniquement les valeurs publiques `phoneEndpoint` et `turnstileSiteKey` dans `content/site-settings.json`. Le script `assets/phone.js` active le bouton d’affichage une fois ces deux valeurs renseignées. Il vérifie le jeton côté serveur, le domaine et l’action, limite les demandes et ne met pas la réponse en cache. La configuration absente ferme l’accès au numéro. Compléter la politique de confidentialité lors de cette activation.

## Points à confirmer par l’entreprise

- Réception effective du formulaire et adresse destinataire : aucun vrai message de test n’a été envoyé automatiquement.
- Régime TVA : ne pas ajouter la franchise de TVA de DM par analogie.
- Médiateur de la consommation désigné : fournir ses coordonnées pour compléter les mentions applicables. Aucun médiateur ni assurance n’a été inventé.
- Remplacer les photos d’illustration par les réalisations originales et compléter les crédits si nécessaire.

## Maintenance

`scripts/generate.py` a servi à générer la première version des pages ; il contient le contenu initial. Ne pas le relancer après des changements de galerie ou de pages sans reporter les modifications. Le fonctionnement normal est statique et ne dépend pas de Python.

Licence des bibliothèques et des polices : `assets/vendor/*LICENSE.txt`.

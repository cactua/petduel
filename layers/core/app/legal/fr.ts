import type { LegalTexts } from './types'

export default {
  updated: 'Dernière mise à jour : {date}',
  missing: 'à compléter',
  seeAlso: 'Voir aussi',
  docs: {
    privacy: {
      title: 'Politique de confidentialité',
      intro: 'Nous expliquons ici quelles données {site} collecte, pourquoi, qui peut les voir et comment tu peux les contrôler. Nous essayons de ne collecter que ce qui est vraiment utile.',
      sections: [
        {
          h: 'Responsable du traitement',
          p: ['Le responsable du traitement est {owner}. Pour toute question sur la confidentialité ou pour exercer tes droits, écris à {email}.'],
        },
        {
          h: 'Les données que nous collectons',
          list: [
            'Compte : e-mail, nom d\'utilisateur et mot de passe. Le mot de passe n\'est conservé que chiffré : personne ne peut le lire, pas même nous. Nous ne t\'écrivons que pour confirmer ton adresse, pour réinitialiser ton mot de passe et pour te donner le résultat de tes signalements.',
            'Profil : bio, pronoms, avatar et image de couverture, si tu les ajoutes.',
            { only: ['pets'], t: 'Animaux et photos : nom, espèce, race, ville et les photos que tu publies.' },
            { only: ['furry'], t: 'Personnages et dessins : nom, espèce, la fiche du personnage (pronoms, couleurs, règles pour qui le dessine) et les images que tu publies, avec le nom et le lien de l\'artiste si tu les indiques.' },
            { only: ['moto'], t: 'Motos et photos : nom, type de moto, marque et modèle, ville et les photos que tu publies.' },
            { only: ['artists'], t: 'Profil d\'artiste : si tu t\'indiques comme artiste, les liens vers tes pages, l\'état de tes commandes et les images où d\'autres personnes t\'indiquent comme auteur.' },
            'Votes : les images que tu as choisies dans les duels. Avec un compte, le vote est lié à ton profil ; sans compte, à un code anonyme conservé dans un cookie technique.',
            'Activité sur le site : qui tu suis, tes favoris, les compliments que tu fais et les personnes que tu bloques.',
            'Signalements : le motif et le texte que tu écris. Si tu signales sans compte, aussi l\'e-mail que tu laisses pour recevoir la réponse.',
            { only: ['shelters'], t: 'Refuges : nom, ville, description, site, numéro fiscal, e-mail et téléphone de contact, et coordonnées de don (IBAN et lien). Le numéro fiscal, l\'e-mail et le téléphone de contact ne sont vus que par les modérateurs et le refuge lui-même.' },
            { only: ['shelters'], t: 'Demandes d\'adoption : le message et le téléphone (facultatif) que tu envoies à un refuge.' },
            'Alertes et notifications : les alertes de la cloche. Si tu actives les notifications push, nous conservons l\'adresse que ton navigateur nous donne pour son service de notifications et la langue de réception.',
            'Données techniques : langue du navigateur et position approximative (pays et ville) que le réseau qui protège le site déduit de l\'adresse IP. Nous ne conservons jamais l\'adresse IP en clair : seulement une empreinte chiffrée qui ne permet pas de retrouver l\'adresse, pour limiter les votes automatiques, les inscriptions en série et les tentatives de connexion.',
            'Publicités : quand tu vois ou cliques une publicité, nous enregistrons l\'événement avec une empreinte chiffrée de ton code de vote ou de ton compte, le pays, la ville et la langue, pour compter les vues, les clics et le nombre de fois par jour où tu vois la même publicité.',
          ],
        },
        {
          h: 'Pourquoi nous les utilisons',
          list: [
            { only: ['pets'], t: 'Pour te permettre d\'utiliser le service : compte, animaux, duels, classements, défis et adoptions (exécution du contrat).' },
            { only: ['furry'], t: 'Pour te permettre d\'utiliser le service : compte, personnages, duels, classements, défis et crédits aux artistes (exécution du contrat).' },
            { only: ['moto'], t: 'Pour te permettre d\'utiliser le service : compte, motos, duels, classements et défis (exécution du contrat).' },
            'Pour la sécurité : bloquer les bots, les faux votes, les comptes en série et les contenus interdits, modérer les images, traiter les signalements et garder une trace des actions des modérateurs (intérêt légitime et obligations du règlement européen sur les services numériques).',
            'Pour afficher les publicités de nos propres annonceurs choisies selon la zone, la langue et l\'heure, sans te profiler (intérêt légitime).',
            'Pour afficher les publicités Google qui utilisent des cookies, seulement si tu acceptes dans le bandeau (consentement).',
            'Pour t\'envoyer des notifications push, seulement si tu les actives (consentement, que tu retires en les désactivant).',
            { only: ['shelters'], t: 'Pour vérifier les refuges et leurs coordonnées de don avant de les rendre publics (intérêt légitime et protection des animaux et des donateurs).' },
          ],
        },
        {
          h: 'Ce que les autres voient',
          p: [
            { only: ['pets'], t: 'Sont publics ton nom d\'utilisateur, ton profil (bio, pronoms, avatar), tes animaux avec nom, race et ville, les photos approuvées, le nombre de votes que tu as donnés (pas lesquels) et, si tu gères un refuge vérifié, sa page publique avec ses coordonnées de don.' },
            { only: ['furry'], t: 'Sont publics ton nom d\'utilisateur, ton profil (bio, pronoms, avatar), tes personnages avec leur fiche, les images approuvées avec le nom de l\'artiste, ton profil d\'artiste si tu l\'actives et le nombre de votes que tu as donnés (pas lesquels).' },
            { only: ['moto'], t: 'Sont publics ton nom d\'utilisateur, ton profil (bio, pronoms, avatar), tes motos avec marque, modèle et ville, les photos approuvées et le nombre de votes que tu as donnés (pas lesquels).' },
            'Ne sont pas publics ton e-mail, les images pour lesquelles tu as voté, tes signalements, les personnes que tu bloques et les cœurs reçus par tes participants hors du top 5.',
          ],
        },
        {
          h: 'Avec qui nous les partageons',
          list: [
            'Les prestataires qui hébergent le site, la base de données et les images, et celui qui protège le site des attaques, qui traitent les données uniquement pour notre compte.',
            'Le prestataire qui envoie nos e-mails (confirmation de l\'adresse, nouveau mot de passe, résultat des signalements) : il reçoit ton adresse et le texte de l\'e-mail.',
            'Le service de notifications de ton navigateur (Google, Mozilla, Apple ou Microsoft), seulement si tu actives les notifications push : il reçoit les notifications chiffrées pour les livrer.',
            { only: ['shelters'], t: 'Le refuge à qui tu envoies une demande d\'adoption : il reçoit le message, ton nom d\'utilisateur, ton e-mail pour te répondre et ton téléphone si tu l\'indiques.' },
            { only: ['shelters'], t: 'OpenStreetMap : la carte des refuges charge les images de la carte depuis ses serveurs, qui voient ton adresse IP. Quand un refuge cherche son adresse, le texte recherché passe par le service de recherche d\'OpenStreetMap.' },
            'Google, seulement si tu acceptes les publicités Google : Google utilise alors ses propres cookies, comme l\'explique sa politique (policies.google.com/privacy).',
          ],
          p: ['Nous ne vendons tes données à personne.'],
        },
        {
          h: 'Données hors de l\'Union européenne',
          p: ['Si tu acceptes les publicités Google ou actives les notifications push, certaines données peuvent arriver aux États-Unis (Google, Apple, Microsoft). Ces prestataires adhèrent au cadre de protection des données UE-États-Unis ou utilisent les clauses contractuelles types approuvées par la Commission européenne.'],
        },
        {
          h: 'Combien de temps',
          p: [
            { only: ['pets'], t: 'Nous conservons les données du compte tant qu\'il existe. Quand tu le supprimes, nous effaçons aussitôt profil, animaux, photos (fichiers compris), refuge, demandes d\'adoption, signalements envoyés, alertes et abonnements push.' },
            { only: ['furry', 'moto'], t: 'Nous conservons les données du compte tant qu\'il existe. Quand tu le supprimes, nous effaçons aussitôt profil, participants, images (fichiers compris), signalements envoyés, alertes et abonnements push.' },
            'Les votes que tu as donnés restent, mais sans plus aucun lien avec toi : ils évitent de fausser les classements des autres. Il en va de même pour les comptages des publicités.',
            'Les empreintes chiffrées de l\'IP utilisées contre les abus s\'effacent toutes seules après un jour au plus ; celles liées à une alerte de votes suspects restent avec l\'alerte, que les modérateurs utilisent pour repérer les abus répétés. Les liens envoyés par e-mail valent une heure (nouveau mot de passe) ou 48 heures (confirmation de l\'e-mail). Les signalements faits sans compte sont conservés le temps nécessaire pour les traiter et répondre à d\'éventuelles contestations.',
          ],
        },
        {
          h: 'Tes droits',
          list: [
            'Voir et télécharger tes données : depuis la page « Ton compte », tu télécharges un fichier avec tout ce qui te concerne.',
            'Les corriger : le profil et les participants se modifient sur le site ; pour le reste, écris-nous.',
            'Les effacer : depuis la page « Ton compte », tu supprimes ton compte quand tu veux.',
            'T\'opposer au traitement ou le limiter, retirer ton consentement aux publicités Google depuis le menu, rubrique « Cookies et publicités », et désactiver les notifications push depuis ton profil ou le navigateur.',
            'Déposer une réclamation auprès d\'une autorité de protection des données : en Italie, le Garante per la protezione dei dati personali (garanteprivacy.it).',
          ],
        },
        {
          h: 'Âge minimum',
          p: ['Pour créer un compte, tu dois avoir au moins 14 ans, et nous te demandons de le confirmer à l\'inscription. Si tu es plus jeune, demande à un parent de créer le compte pour toi. Si nous découvrons qu\'un compte appartient à une personne de moins de 14 ans, nous le supprimons.'],
        },
        {
          h: 'Modifications',
          p: ['Si nous modifions cette politique, nous mettons à jour la date en haut. Pour les changements importants, nous te prévenons par une alerte sur le site.'],
        },
      ],
    },
    cookie: {
      title: 'Politique relative aux cookies',
      intro: 'Les cookies sont de petits fichiers que le site enregistre dans ton navigateur. {site} en utilise peu, et presque tous servent seulement à le faire fonctionner.',
      sections: [
        {
          h: 'Cookies techniques',
          p: ['Ils sont nécessaires au fonctionnement du site et ne demandent pas ton consentement. Nous ne les utilisons pas pour te suivre sur d\'autres sites.'],
          table: {
            head: ['Nom', 'À quoi il sert', 'Durée'],
            rows: [
              ['nuxt-session', 'Te garder connecté et retenir ton code de vote anonyme si tu n\'as pas de compte (chiffré)', '30 jours'],
              ['lang', 'Retenir la langue choisie', '1 an'],
              ['theme', 'Retenir le thème clair ou sombre', '1 an'],
              ['a11y-motion, a11y-contrast, a11y-haptics', 'Retenir tes préférences d\'accessibilité : moins d\'animations, contraste élevé, vibration désactivée', '1 an'],
              ['consent', 'Retenir ton choix sur les publicités Google', '6 mois'],
            ],
          },
        },
        {
          h: 'Autres données enregistrées dans le navigateur',
          p: ['En plus des cookies, le site enregistre dans le navigateur quelques informations techniques qui ne quittent pas ton appareil :'],
          list: [
            '« petduel:nudge-closed » (stockage local) : retient que tu as fermé le conseil sous les duels. Il reste jusqu\'à ce que tu effaces les données du site.',
            'Une copie du site pour l\'application installable (service worker et cache) : le site s\'ouvre plus vite et tu peux recevoir des notifications push, si tu les actives.',
          ],
        },
        {
          h: 'Cookies des publicités Google',
          p: [
            'Seulement si tu acceptes dans le bandeau, nous chargeons les publicités Google AdSense. Google utilise ses propres cookies pour afficher, mesurer et personnaliser les publicités selon ton activité.',
            'Si tu refuses, le script de Google n\'est pas chargé du tout : tu ne vois que les publicités de nos propres annonceurs, qui n\'utilisent pas de cookies.',
            'Comment Google utilise les données : policies.google.com/technologies/partner-sites.',
          ],
        },
        {
          h: 'Pas de services externes sans raison',
          p: [
            'Les polices du site sont servies par le site lui-même : ouvrir une page n\'envoie pas ton adresse IP à des services de polices externes.',
            { only: ['shelters'], t: 'La carte des refuges charge ses images depuis OpenStreetMap, qui n\'utilise pas de cookies mais voit ton adresse IP.' },
          ],
        },
        {
          h: 'Changer d\'avis',
          p: [
            'Tu peux changer ton choix à tout moment depuis le menu en haut à droite, rubrique « Cookies et publicités ».',
            'Tu peux aussi supprimer les cookies dans les réglages du navigateur. Si tu supprimes les cookies techniques, tu devras te reconnecter.',
          ],
        },
        {
          h: 'Contact',
          p: ['Pour toute question sur les cookies, écris à {email}.'],
        },
      ],
    },
    terms: {
      title: 'Conditions d\'utilisation',
      intro: [
        { only: ['pets'], t: 'En utilisant {site}, tu acceptes ces règles. Elles servent à garder le site agréable, juste et sûr pour les personnes et les animaux.' },
        { only: ['furry', 'moto'], t: 'En utilisant {site}, tu acceptes ces règles. Elles servent à garder le site agréable, juste et sûr pour tout le monde.' },
      ],
      sections: [
        {
          h: 'Le service',
          p: [
            { only: ['pets'], t: '{site} est un site gratuit où l\'on vote pour des photos d\'animaux deux par deux, où l\'on participe à des défis à thème et où l\'on découvre des animaux qui cherchent un foyer. Il est géré par {owner}.' },
            { only: ['furry'], t: '{site} est un site gratuit où l\'on vote deux par deux pour des dessins de personnages furry, où l\'on participe à des défis à thème et où l\'on crédite les artistes. Il est géré par {owner}.' },
            { only: ['moto'], t: '{site} est un site gratuit où l\'on vote deux par deux pour des photos de motos, classées par type, et où l\'on participe à des défis à thème. Il est géré par {owner}.' },
            'Pour nous contacter, y compris en tant qu\'autorité ou pour des questions relevant du règlement européen sur les services numériques, écris à {email}, en italien ou en anglais.',
          ],
        },
        {
          h: 'Ton compte',
          list: [
            'Tu dois avoir au moins 14 ans.',
            'Un compte par personne. Garde ton mot de passe secret : tu es responsable de ce qui se passe avec ton compte. Si tu l\'oublies, tu peux en choisir un nouveau avec le lien « Mot de passe oublié ? ».',
            'Ton nom d\'utilisateur ne doit pas imiter d\'autres personnes ni être offensant.',
          ],
        },
        {
          h: 'Les images que tu publies',
          list: [
            { only: ['pets'], t: 'Ne publie que des photos que tu as prises ou que tu as le droit d\'utiliser, et seulement d\'animaux qui sont à toi ou dont tu t\'occupes.' },
            { only: ['furry'], t: 'Ne publie que tes propres dessins, ou ceux d\'autres artistes qui t\'ont donné leur accord : dans ce cas, indique l\'artiste. Les images générées par intelligence artificielle sont interdites, même retouchées.' },
            { only: ['moto'], t: 'Ne publie que des photos que tu as prises ou que tu as le droit d\'utiliser. Cache les plaques d\'immatriculation et ne montre pas de personnes reconnaissables sans leur accord.' },
            'Sont interdits les contenus violents, cruels, sexuels ou haineux, les données personnelles d\'autrui, la publicité et tout contenu illégal.',
            'Tes images restent à toi. En les publiant, tu nous permets de les montrer sur {site}, dans les duels, les classements, les défis et les cartes à partager, jusqu\'à ce que tu les supprimes.',
            'Chaque image est vérifiée par un modérateur avant d\'être publique.',
          ],
        },
        {
          h: 'Signalements et modération',
          list: [
            'Tout le monde, même sans compte, peut signaler une image ou un profil avec le bouton « Signaler », en expliquant ce qui ne va pas. Qui signale sans compte laisse un e-mail, et nous lui écrivons le résultat.',
            'Les modérateurs sont des personnes, qui décident selon ces conditions, les règles de la communauté et la loi. Nous n\'utilisons pas de systèmes automatiques pour décider des contenus.',
            'Si nous retirons ou refusons une de tes images, nous t\'en donnons la raison. Si nous suspendons ton compte, tu le verras en essayant de te connecter, et tu peux nous demander pourquoi à {email}. Si tu n\'es pas d\'accord avec une décision, écris-nous : une autre personne la réexaminera. Les voies de recours prévues par la loi restent toujours ouvertes.',
            'Qui publie souvent des contenus manifestement illégaux, ou envoie souvent des signalements manifestement infondés, peut être suspendu.',
          ],
        },
        {
          h: 'Droit d\'auteur',
          p: [
            'Si un contenu utilise ton œuvre sans autorisation, signale-le avec « Signaler » en choisissant « Publiée sans autorisation », ou écris à {email} avec le lien et la raison pour laquelle l\'œuvre est à toi. Nous la retirons dès vérification.',
            { only: ['artists'], t: 'Si quelqu\'un t\'indique comme auteur d\'un dessin que tu n\'as pas fait, tu peux retirer ton nom depuis la page de ton profil (« Ce n\'est pas moi »). Si le dessin est à toi mais que tu n\'avais pas donné ton accord, signale-le depuis cette page : les signalements des artistes sont traités en priorité.' },
            { only: ['pets', 'moto'], t: 'Les photos d\'exemple viennent de Wikimedia Commons, sous leurs licences libres : auteurs et licences sont sur la page des crédits.' },
          ],
        },
        {
          h: 'Des votes honnêtes',
          p: ['Les bots, les votes automatiques, les comptes multiples et toute astuce pour gonfler les cœurs d\'un participant sont interdits. Dans ce cas, nous pouvons annuler les votes, retirer le participant des classements ou suspendre le compte.'],
        },
        {
          h: 'Refuges, adoptions et dons',
          only: ['shelters'],
          list: [
            'Les refuges doivent donner des informations vraies sur eux-mêmes et sur les animaux. Nous les vérifions avant de les rendre publics, et nous contrôlons chaque nouvel IBAN ou lien de don avant de l\'afficher.',
            'Les adoptions se font directement entre toi et le refuge. {site} vous met en relation mais ne participe pas à l\'adoption et ne répond pas des accords conclus.',
            'Les dons vont directement au refuge : {site} ne les reçoit pas, ne garde rien et ne peut pas les rembourser. Avant de donner, tu peux vérifier le refuge sur ses canaux officiels.',
          ],
        },
        {
          h: 'Publicités',
          p: ['Le site vit grâce à des publicités affichées entre les duels, toujours signalées comme publicité. Nous ne sommes pas responsables des produits et des sites des annonceurs.'],
        },
        {
          h: 'Suspension et suppression',
          p: ['Tu peux supprimer ton compte à tout moment depuis la page « Ton compte ». Nous pouvons suspendre ou supprimer les comptes qui enfreignent ces règles ; dans ce cas, nous t\'en donnons la raison si tu la demandes.'],
        },
        {
          h: 'Responsabilité',
          p: ['Nous faisons de notre mieux pour que le site fonctionne bien, mais il peut connaître des interruptions ou des erreurs. Dans les limites prévues par la loi, nous ne répondons pas des dommages indirects liés à l\'utilisation du site. Tes droits légaux de consommateur restent toujours valables.'],
        },
        {
          h: 'Modifications et droit applicable',
          p: [
            'Si nous modifions ces conditions, nous mettons à jour la date en haut et, pour les changements importants, nous te prévenons sur le site.',
            'Le droit italien s\'applique. Pour toute question, écris à {email}.',
          ],
        },
      ],
    },
    accessibility: {
      title: 'Déclaration d\'accessibilité',
      intro: 'Nous voulons que {site} soit facile à utiliser pour tout le monde, y compris avec un lecteur d\'écran, uniquement au clavier, avec un agrandissement ou en cas de difficulté avec les gestes précis.',
      sections: [
        {
          h: 'Objectif',
          p: ['Nous suivons les WCAG 2.2 niveau AA et la norme européenne EN 301 549, comme le demande l\'Acte européen sur l\'accessibilité (directive UE 2019/882).'],
        },
        {
          h: 'État de conformité',
          p: ['{site} est partiellement conforme : la plupart des pages respectent les exigences, mais les limites ci-dessous demeurent.'],
        },
        {
          h: 'Ce que nous avons fait',
          list: [
            'Tu peux voter avec le bouton « Choisir », sans glisser ; au clavier, les flèches suffisent.',
            'Lien « Aller au contenu », ordre de tabulation logique et focus bien visible.',
            'Textes et boutons avec un contraste d\'au moins 4,5:1 et boutons d\'au moins 44 pixels.',
            'Dans le menu, tu peux choisir moins d\'animations, un contraste élevé, un thème clair ou sombre et couper la vibration.',
            'Le site fonctionne avec le zoom du navigateur jusqu\'à 200 % et en 5 langues.',
          ],
        },
        {
          h: 'Limites connues',
          list: [
            'Les images envoyées par les utilisateurs sont décrites par le nom et les informations saisies, pas par une description complète de leur contenu.',
            'Les publicités viennent de tiers et peuvent ne pas respecter toutes les exigences.',
          ],
        },
        {
          h: 'Comment nous l\'avons vérifié',
          p: ['Par une évaluation interne, avec des contrôles automatiques et des tests manuels au clavier et au lecteur d\'écran.'],
        },
        {
          h: 'Signaler un problème',
          p: ['Si une partie du site t\'est inaccessible, écris-nous à {email} : nous répondons sous 30 jours et, si possible, te fournissons le contenu autrement.', 'Si la réponse ne te satisfait pas, tu peux t\'adresser à l\'autorité de surveillance de ton pays.'],
        },
      ],
    },
  },
} satisfies LegalTexts

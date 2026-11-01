import type { LegalTexts } from './types'

export default {
  updated: 'Dernière mise à jour : {date}',
  missing: 'à compléter',
  seeAlso: 'Voir aussi',
  docs: {
    privacy: {
      title: 'Politique de confidentialité',
      intro: 'Ici nous expliquons quelles données {site} collecte, pourquoi, qui peut les voir et comment tu peux les contrôler. Nous essayons de ne collecter que le strict nécessaire.',
      sections: [
        {
          h: 'Responsable du traitement',
          p: ['Le responsable du traitement est {owner}. Pour toute question sur la confidentialité ou pour exercer tes droits, écris à {email}.'],
        },
        {
          h: 'Les données collectées',
          list: [
            'Compte : email, nom d\'utilisateur et mot de passe. Le mot de passe est enregistré uniquement sous forme chiffrée : personne ne peut le lire, pas même nous.',
            'Animaux et photos : nom, espèce, race, ville et les photos que tu publies.',
            'Votes : les photos que tu as choisies dans les duels. Avec un compte, le vote est lié à ton profil ; sans compte, à un code anonyme conservé dans un cookie technique.',
            'Refuges : nom, ville, description, site, numéro d\'identification fiscale, email et téléphone de contact. Le numéro fiscal, l\'email et le téléphone ne sont vus que par les modérateurs et le refuge lui-même.',
            'Demandes d\'adoption : le message et le téléphone (facultatif) que tu envoies à un refuge.',
            'Alertes : les notifications affichées sous la cloche.',
            'Données techniques : langue du navigateur et position approximative (pays et ville) déduite de l\'adresse IP. Nous utilisons l\'adresse IP un instant pour limiter les votes automatiques et les abus, et nous ne la conservons pas.',
            'Publicités : quand tu vois ou cliques sur une publicité, nous enregistrons l\'événement avec un code anonyme, le pays, la ville et la langue, pour compter les vues et les clics.',
          ],
        },
        {
          h: 'Pourquoi nous les utilisons',
          list: [
            'Pour te fournir le service : compte, animaux, duels, classements, défis et adoptions (exécution du contrat).',
            'Pour la sécurité : bloquer les bots, les faux votes et les contenus interdits, et modérer les photos (intérêt légitime).',
            'Pour afficher les publicités de nos annonceurs choisies selon la zone, la langue et l\'heure, sans profilage (intérêt légitime).',
            'Pour afficher des publicités Google qui utilisent des cookies, seulement si tu acceptes dans le bandeau (consentement).',
            'Pour vérifier les refuges avant de les rendre publics (intérêt légitime et protection des animaux).',
          ],
        },
        {
          h: 'Ce que les autres voient',
          p: [
            'Sont publics : ton nom d\'utilisateur, tes animaux avec nom, race et ville, les photos approuvées et, si tu gères un refuge vérifié, sa page publique.',
            'Ne sont pas publics : ton email, les votes que tu donnes et les cœurs que reçoivent tes animaux hors du top 5. Toi seul les vois.',
          ],
        },
        {
          h: 'Avec qui nous les partageons',
          list: [
            'Le prestataire qui héberge le site et la base de données, qui traite les données uniquement pour notre compte.',
            'Le refuge à qui tu envoies une demande d\'adoption : il reçoit le message, ton nom d\'utilisateur, ton email pour te répondre et ton téléphone si tu l\'indiques.',
            'Google, seulement si tu acceptes les publicités Google : Google utilise alors ses propres cookies, comme l\'explique sa politique (policies.google.com/privacy).',
          ],
          p: ['Nous ne vendons jamais tes données.'],
        },
        {
          h: 'Données hors de l\'Union européenne',
          p: ['Si tu acceptes les publicités Google, certaines données peuvent être transférées aux États-Unis. Google adhère au cadre de protection des données UE-États-Unis et utilise les clauses contractuelles types approuvées par la Commission européenne.'],
        },
        {
          h: 'Durée de conservation',
          p: [
            'Nous conservons les données du compte tant que le compte existe. Quand tu le supprimes, nous effaçons immédiatement profil, animaux, photos (fichiers compris), refuge, demandes d\'adoption et alertes.',
            'Les votes que tu as donnés restent, mais sans aucun lien avec toi : ils évitent de fausser les classements des autres. Il en va de même pour les statistiques des publicités.',
          ],
        },
        {
          h: 'Tes droits',
          list: [
            'Voir et télécharger tes données : sur la page «Ton compte» tu télécharges un fichier avec tout ce qui te concerne.',
            'Les corriger : nom, race et ville des animaux se modifient depuis le profil ; pour le reste, écris-nous.',
            'Les effacer : supprime ton compte à tout moment depuis la page «Ton compte».',
            'T\'opposer au traitement ou le limiter, et retirer ton consentement aux publicités Google depuis le menu, rubrique «Cookies et publicités».',
            'Porter plainte auprès d\'une autorité de protection des données, par exemple celle de ton pays (en France, la CNIL).',
          ],
        },
        {
          h: 'Âge minimum',
          p: ['Pour créer un compte tu dois avoir au moins 14 ans. Si tu es plus jeune, demande à un parent de le créer pour toi.'],
        },
        {
          h: 'Modifications',
          p: ['Si nous modifions cette politique, nous mettons à jour la date en haut. Pour les changements importants, nous te prévenons sur le site.'],
        },
      ],
    },
    cookie: {
      title: 'Politique cookies',
      intro: 'Les cookies sont de petits fichiers que le site enregistre dans ton navigateur. {site} en utilise peu, et presque tous servent seulement à le faire fonctionner.',
      sections: [
        {
          h: 'Cookies techniques',
          p: ['Ils sont nécessaires au fonctionnement du site et ne demandent pas ton consentement. Nous ne les utilisons pas pour te suivre sur d\'autres sites.'],
          table: {
            head: ['Nom', 'À quoi il sert', 'Durée'],
            rows: [
              ['nuxt-session', 'Te garder connecté et retenir le code anonyme de vote si tu n\'as pas de compte (chiffré)', '30 jours'],
              ['lingua', 'Retenir la langue choisie', '1 an'],
              ['tema', 'Retenir le thème clair ou sombre', '1 an'],
              ['consenso', 'Retenir ton choix sur les publicités Google', '6 mois'],
            ],
          },
        },
        {
          h: 'Cookies des publicités Google',
          p: [
            'Seulement si tu acceptes dans le bandeau, nous chargeons les publicités Google AdSense. Google utilise ses propres cookies pour afficher, mesurer et personnaliser les publicités selon ton activité.',
            'Si tu refuses, le script de Google n\'est pas chargé du tout : tu vois seulement les publicités de nos annonceurs, qui n\'utilisent pas de cookies.',
            'Comment Google utilise les données : policies.google.com/technologies/partner-sites.',
          ],
        },
        {
          h: 'Changer d\'avis',
          p: [
            'Tu peux changer ton choix à tout moment depuis le menu en haut à droite, rubrique «Cookies et publicités».',
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
      intro: 'En utilisant {site} tu acceptes ces règles. Elles servent à garder le site agréable, juste et sûr pour les personnes et les animaux.',
      sections: [
        {
          h: 'Le service',
          p: ['{site} est un site gratuit où l\'on vote pour des photos d\'animaux deux par deux, où l\'on participe à des défis à thème et où l\'on découvre des animaux qui cherchent une famille. Il est géré par {owner}.'],
        },
        {
          h: 'Ton compte',
          list: [
            'Tu dois avoir au moins 14 ans.',
            'Un compte par personne. Garde ton mot de passe secret : tu es responsable de ce qui se passe avec ton compte.',
            'Le nom d\'utilisateur ne doit pas usurper l\'identité d\'autrui ni être offensant.',
          ],
        },
        {
          h: 'Les photos que tu publies',
          list: [
            'Publie seulement des photos que tu as prises ou que tu as le droit d\'utiliser, et seulement d\'animaux qui sont à toi ou dont tu t\'occupes.',
            'Sont interdites les photos avec des personnes reconnaissables, les contenus violents, cruels ou sexuels, les animaux maltraités ou en danger, la publicité et les textes offensants.',
            'Tes photos restent à toi. En les publiant, tu nous permets de les afficher sur {site}, dans les duels, les classements, les défis et les cartes à partager, jusqu\'à ce que tu les supprimes.',
            'Chaque photo est vérifiée avant d\'être publique. Nous pouvons refuser ou retirer une photo qui ne respecte pas ces règles.',
          ],
        },
        {
          h: 'Des votes honnêtes',
          p: ['Les bots, les votes automatiques, les comptes multiples et toute astuce pour gonfler les cœurs d\'un animal sont interdits. Dans ce cas nous pouvons annuler des votes, retirer l\'animal des classements ou suspendre le compte.'],
        },
        {
          h: 'Refuges et adoptions',
          list: [
            'Les refuges doivent donner des informations vraies sur eux-mêmes et sur les animaux. Nous les vérifions avant de les rendre publics.',
            'Les adoptions se font directement entre toi et le refuge. {site} vous met en contact mais ne participe pas à l\'adoption et ne répond pas des accords conclus.',
          ],
        },
        {
          h: 'Publicités',
          p: ['Le site est financé par des publicités affichées entre les duels. Nous ne sommes pas responsables des produits ni des sites des annonceurs.'],
        },
        {
          h: 'Suspension et suppression',
          p: ['Tu peux supprimer ton compte à tout moment depuis la page «Ton compte». Nous pouvons suspendre ou supprimer les comptes qui ne respectent pas ces règles.'],
        },
        {
          h: 'Responsabilité',
          p: ['Nous faisons de notre mieux pour que le site fonctionne bien, mais il peut connaître des interruptions ou des erreurs. Dans les limites prévues par la loi, nous ne répondons pas des dommages indirects liés à l\'utilisation du site. Les droits que la loi reconnaît aux consommateurs restent toujours valables.'],
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
  },
} satisfies LegalTexts

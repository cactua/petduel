import type { LegalTexts } from './types'

export default {
  updated: 'Last updated: {date}',
  missing: 'to be completed',
  seeAlso: 'See also',
  docs: {
    privacy: {
      title: 'Privacy policy',
      intro: 'This page explains what data {site} collects, why, who can see it and how you can control it. We try to collect only what we really need.',
      sections: [
        {
          h: 'Who is responsible',
          p: ['The data controller is {owner}. For any privacy question, or to exercise your rights, write to {email}.'],
        },
        {
          h: 'What we collect',
          list: [
            'Account: email, username and password. The password is only stored encrypted: nobody can read it, not even us. We only email you to confirm your address, to reset your password and to tell you the outcome of your reports.',
            'Profile: bio, pronouns, avatar and cover image, if you add them.',
            { only: ['pets'], t: 'Pets and photos: name, species, breed, city and the photos you upload.' },
            { only: ['furry'], t: 'Characters and artwork: name, species, the character sheet (pronouns, colours, rules for artists) and the images you upload, with the artist\'s name and link if you add them.' },
            { only: ['moto'], t: 'Bikes and photos: name, type of bike, make and model, city and the photos you upload.' },
            { only: ['artists'], t: 'Artist profile: if you mark yourself as an artist, the links to your pages, your commission status and the images where other people credit you as the author.' },
            'Votes: which images you picked in duels. With an account the vote is linked to your profile; without one, to an anonymous code kept in a technical cookie.',
            'Activity on the site: who you follow, your favourites, the compliments you give and the people you block.',
            'Reports: the reason and the text you write. If you report without an account, also the email you leave to get an answer.',
            { only: ['shelters'], t: 'Shelters: name, city, description, website, tax code, contact email and phone, and donation details (IBAN and link). Tax code, contact email and phone are only seen by moderators and the shelter itself.' },
            { only: ['shelters'], t: 'Adoption requests: the message and (optional) phone number you send to a shelter.' },
            'Alerts and notifications: the alerts under the bell. If you turn on push notifications, we store the address your browser gives us for its notification service and the language to send them in.',
            'Technical data: browser language and approximate location (country and city) that the network protecting the site derives from your IP address. We never store your IP address in plain form: we only keep an encrypted fingerprint that cannot be turned back into the address, to limit automated votes, mass sign-ups and login attempts.',
            'Ads: when you see or click an ad we record the event with an encrypted fingerprint of your voting code or account, plus country, city and language, to count views and clicks and how many times a day you see the same ad.',
          ],
        },
        {
          h: 'Why we use it',
          list: [
            { only: ['pets'], t: 'To let you use the service: account, pets, duels, leaderboards, challenges and adoptions (performance of a contract).' },
            { only: ['furry'], t: 'To let you use the service: account, characters, duels, leaderboards, challenges and artist credits (performance of a contract).' },
            { only: ['moto'], t: 'To let you use the service: account, bikes, duels, leaderboards and challenges (performance of a contract).' },
            'For safety: blocking bots, fake votes, mass accounts and forbidden content, moderating images, handling reports and keeping a record of moderator actions (legitimate interest and obligations under the EU Digital Services Act).',
            'To show ads from our own advertisers chosen by area, language and time of day, without profiling you (legitimate interest).',
            'To show Google ads that use cookies, only if you accept in the banner (consent).',
            'To send you push notifications, only if you turn them on (consent, which you withdraw by turning them off).',
            { only: ['shelters'], t: 'To verify shelters and their donation details before making them public (legitimate interest and protection of animals and donors).' },
          ],
        },
        {
          h: 'What others can see',
          p: [
            { only: ['pets'], t: 'Public: your username, your profile (bio, pronouns, avatar), your pets with name, breed and city, approved photos, how many votes you have cast (not which) and, if you run a verified shelter, its public page with its donation details.' },
            { only: ['furry'], t: 'Public: your username, your profile (bio, pronouns, avatar), your characters with their sheet, approved images with the artist\'s name, your artist profile if you turn it on, and how many votes you have cast (not which).' },
            { only: ['moto'], t: 'Public: your username, your profile (bio, pronouns, avatar), your bikes with make, model and city, approved photos and how many votes you have cast (not which).' },
            'Not public: your email, which images you voted for, the reports you make, who you block and the hearts your entries get outside the top 5.',
          ],
        },
        {
          h: 'Who we share it with',
          list: [
            'The providers that host the site, the database and the images, and the one that protects the site from attacks, which process data only on our behalf.',
            'The provider that sends our emails (address confirmation, new password, report outcomes): it receives your address and the text of the email.',
            'Your browser\'s notification service (Google, Mozilla, Apple or Microsoft), only if you turn on push notifications: it receives the notifications in encrypted form to deliver them.',
            { only: ['shelters'], t: 'The shelter you send an adoption request to: it gets the message, your username, your email so it can reply, and your phone number if you add it.' },
            { only: ['shelters'], t: 'OpenStreetMap: the shelter map loads map images from its servers, which see your IP address. When a shelter looks up its address, the search text goes to OpenStreetMap\'s search service.' },
            'Google, only if you accept Google ads: Google then uses its own cookies, as explained in its policy (policies.google.com/privacy).',
          ],
          p: ['We never sell your data.'],
        },
        {
          h: 'Data outside the European Union',
          p: ['If you accept Google ads or turn on push notifications, some data may reach the United States (Google, Apple, Microsoft). These providers take part in the EU-US Data Privacy Framework or use the standard contractual clauses approved by the European Commission.'],
        },
        {
          h: 'How long we keep it',
          p: [
            { only: ['pets'], t: 'We keep account data as long as the account exists. When you delete it we immediately erase your profile, pets, photos (including the files), shelter, adoption requests, reports made, notifications and push subscriptions.' },
            { only: ['furry', 'moto'], t: 'We keep account data as long as the account exists. When you delete it we immediately erase your profile, entries, images (including the files), reports made, notifications and push subscriptions.' },
            'The votes you cast remain, but no longer linked to you in any way: they keep other people\'s leaderboards fair. The same goes for ad counts.',
            'The encrypted IP fingerprints used against abuse delete themselves after one day at most; those attached to a suspicious-votes alert stay with the alert, which moderators use to spot repeated abuse. Email links are valid for one hour (new password) or 48 hours (email confirmation). Reports made without an account are kept as long as needed to handle them and to answer any appeal.',
          ],
        },
        {
          h: 'Your rights',
          list: [
            'See and download your data: from the "Your account" page you can download a file with everything about you.',
            'Correct it: profile and entries can be edited on the site; for anything else, write to us.',
            'Delete it: you can delete your account at any time from the "Your account" page.',
            'Object to or restrict processing, withdraw consent to Google ads from the menu under "Cookies and ads", and turn off push notifications from your profile or your browser.',
            'Complain to a data protection authority: in Italy, the Garante per la protezione dei dati personali (garanteprivacy.it).',
          ],
        },
        {
          h: 'Minimum age',
          p: ['You must be at least 14 to create an account, and we ask you to confirm it when you sign up. If you are younger, ask a parent to create the account for you. If we find out an account belongs to someone under 14, we delete it.'],
        },
        {
          h: 'Changes',
          p: ['If we change this policy we update the date at the top. For important changes we will let you know with a notice on the site.'],
        },
      ],
    },
    cookie: {
      title: 'Cookie policy',
      intro: 'Cookies are small files the site stores in your browser. {site} uses only a few, and almost all of them are needed just to make it work.',
      sections: [
        {
          h: 'Technical cookies',
          p: ['They are needed for the site to work and do not require your consent. We do not use them to follow you on other sites.'],
          table: {
            head: ['Name', 'Purpose', 'Duration'],
            rows: [
              ['nuxt-session', 'Keep you logged in and remember your anonymous voting code if you have no account (encrypted)', '30 days'],
              ['lang', 'Remember the language you chose', '1 year'],
              ['theme', 'Remember the light or dark theme', '1 year'],
              ['a11y-motion, a11y-contrast, a11y-haptics', 'Remember your accessibility choices: less motion, high contrast, vibration off', '1 year'],
              ['consent', 'Remember your choice about Google ads', '6 months'],
            ],
          },
        },
        {
          h: 'Other data stored in your browser',
          p: ['Besides cookies, the site stores a few technical details in your browser that never leave your device:'],
          list: [
            '"petduel:nudge-closed" (local storage): remembers that you closed the tip below the duels. It stays until you clear the site\'s data.',
            'A copy of the site for the installable app (service worker and cache): makes the site open faster and lets you receive push notifications, if you turn them on.',
          ],
        },
        {
          h: 'Google ad cookies',
          p: [
            'Only if you accept in the banner do we load Google AdSense ads. Google uses its own cookies to show, measure and personalise ads based on your activity.',
            'If you decline, the Google script is not loaded at all: you only see ads from our own advertisers, which use no cookies.',
            'How Google uses data: policies.google.com/technologies/partner-sites.',
          ],
        },
        {
          h: 'No outside services without a reason',
          p: [
            'The site\'s fonts are served by the site itself: opening a page does not send your IP address to outside font services.',
            { only: ['shelters'], t: 'The shelter map loads images from OpenStreetMap, which uses no cookies but sees your IP address.' },
          ],
        },
        {
          h: 'Changing your mind',
          p: [
            'You can change your choice at any time from the menu at the top right, under "Cookies and ads".',
            'You can also delete cookies in your browser settings. If you delete technical cookies you will need to log in again.',
          ],
        },
        {
          h: 'Contact',
          p: ['For questions about cookies, write to {email}.'],
        },
      ],
    },
    terms: {
      title: 'Terms of use',
      intro: [
        { only: ['pets'], t: 'By using {site} you accept these rules. They are meant to keep the site fun, fair and safe for people and animals.' },
        { only: ['furry', 'moto'], t: 'By using {site} you accept these rules. They are meant to keep the site fun, fair and safe for everyone.' },
      ],
      sections: [
        {
          h: 'The service',
          p: [
            { only: ['pets'], t: '{site} is a free site where you vote on pairs of animal photos, join themed challenges and discover animals looking for a home. It is run by {owner}.' },
            { only: ['furry'], t: '{site} is a free site where you vote on pairs of drawings of furry characters, join themed challenges and give credit to artists. It is run by {owner}.' },
            { only: ['moto'], t: '{site} is a free site where you vote on pairs of motorcycle photos, grouped by type, and join themed challenges. It is run by {owner}.' },
            'To contact us, including as an authority or for matters under the EU Digital Services Act, write to {email} in Italian or English.',
          ],
        },
        {
          h: 'Your account',
          list: [
            'You must be at least 14.',
            'One account per person. Keep your password secret: you are responsible for what happens with your account. If you forget it, you can choose a new one with the "Forgot your password?" link.',
            'Your username must not impersonate others or be offensive.',
          ],
        },
        {
          h: 'The images you upload',
          list: [
            { only: ['pets'], t: 'Only upload photos you took or have the right to use, and only of animals that are yours or that you care for.' },
            { only: ['furry'], t: 'Only upload your own drawings, or drawings by other artists who gave you permission: in that case, credit the artist. AI-generated images are not allowed, even if retouched.' },
            { only: ['moto'], t: 'Only upload photos you took or have the right to use. Cover licence plates and do not show recognisable people without their consent.' },
            'Violent, cruel, sexual or hateful content, other people\'s personal data, advertising and any illegal content are not allowed.',
            'Your images stay yours. By uploading them you let us show them on {site}, in duels, leaderboards, challenges and share cards, until you delete them.',
            'Every image is checked by a moderator before it goes public.',
          ],
        },
        {
          h: 'Reports and moderation',
          list: [
            'Anyone, even without an account, can report an image or a profile with the "Report" button, explaining what is wrong. People reporting without an account leave an email, and we write to them with the outcome.',
            'Moderators are people, and they decide based on these terms, the community rules and the law. We do not use automated systems to decide on content.',
            'If we remove or reject one of your images we tell you why. If we suspend your account you will see it when you try to log in, and you can ask us why at {email}. If you disagree with a decision, write to us: another person will review it. Legal remedies always remain available.',
            'People who often post clearly illegal content, or often send clearly unfounded reports, may be suspended.',
          ],
        },
        {
          h: 'Copyright',
          p: [
            'If content uses your work without permission, report it with "Report" and choose "Posted without permission", or write to {email} with the link and why the work is yours. We remove it as soon as it is verified.',
            { only: ['artists'], t: 'If someone credits you for a drawing you did not make, you can remove your name from your profile page ("Not me"). If the drawing is yours but you did not give permission, report it from there: reports from artists are handled first.' },
            { only: ['pets', 'moto'], t: 'The sample photos come from Wikimedia Commons under their free licences: authors and licences are on the credits page.' },
          ],
        },
        {
          h: 'Fair votes',
          p: ['Bots, automated votes, multiple accounts and any trick to inflate an entry\'s hearts are forbidden. If it happens we may cancel the votes, remove the entry from leaderboards or suspend the account.'],
        },
        {
          h: 'Shelters, adoptions and donations',
          only: ['shelters'],
          list: [
            'Shelters must give true information about themselves and their animals. We verify them before making them public, and we check every new IBAN or donation link before showing it.',
            'Adoptions happen directly between you and the shelter. {site} puts you in touch but does not take part in the adoption and is not responsible for any agreements made.',
            'Donations go directly to the shelter: {site} does not receive them, keeps nothing and cannot refund them. Before donating you can check the shelter on its official channels.',
          ],
        },
        {
          h: 'Ads',
          p: ['The site is supported by ads shown between duels, always marked as advertising. We are not responsible for advertisers\' products or websites.'],
        },
        {
          h: 'Suspension and deletion',
          p: ['You can delete your account at any time from the "Your account" page. We may suspend or delete accounts that break these rules; if that happens, we tell you why when you ask.'],
        },
        {
          h: 'Liability',
          p: ['We do our best to keep the site working well, but it may have outages or errors. To the extent allowed by law, we are not liable for indirect damages arising from using the site. Your statutory consumer rights always remain.'],
        },
        {
          h: 'Changes and governing law',
          p: [
            'If we change these terms we update the date at the top and, for important changes, let you know on the site.',
            'Italian law applies. For questions, write to {email}.',
          ],
        },
      ],
    },
    accessibility: {
      title: 'Accessibility statement',
      intro: 'We want {site} to be easy for everyone to use, including people who use a screen reader, only a keyboard, magnification, or who find precise movements difficult.',
      sections: [
        {
          h: 'Goal',
          p: ['We follow WCAG 2.2 level AA and the European standard EN 301 549, as required by the European Accessibility Act (EU Directive 2019/882).'],
        },
        {
          h: 'Compliance status',
          p: ['{site} is partially compliant: most pages meet the requirements, but the limitations listed below remain.'],
        },
        {
          h: 'What we have done',
          list: [
            'You can vote with the "Pick" button, without dragging; on a keyboard the arrow keys are enough.',
            '"Skip to content" link, a logical tab order and a clearly visible focus outline.',
            'Text and buttons with at least 4.5:1 contrast, and buttons at least 44 pixels in size.',
            'From the menu you can choose less motion, high contrast, a light or dark theme, and turn off vibration.',
            'The site works with browser zoom up to 200% and in 5 languages.',
          ],
        },
        {
          h: 'Known limitations',
          list: [
            'Images uploaded by users are described by the name and details they entered, not by a full description of what they show.',
            'Ads come from third parties and may not meet every requirement.',
          ],
        },
        {
          h: 'How we checked',
          p: ['With an internal assessment, using automated checks and manual testing with a keyboard and a screen reader.'],
        },
        {
          h: 'Report a problem',
          p: ['If you find a part of the site you cannot use, write to {email}: we reply within 30 days and, where possible, provide the content another way.', 'If you are not satisfied with the answer, you can contact the market surveillance authority in your country.'],
        },
      ],
    },
  },
} satisfies LegalTexts

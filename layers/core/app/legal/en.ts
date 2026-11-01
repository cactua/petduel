import type { LegalTexts } from './types'

export default {
  updated: 'Last updated: {date}',
  missing: 'to be completed',
  seeAlso: 'See also',
  docs: {
    privacy: {
      title: 'Privacy policy',
      intro: 'This page explains what data PetDuel collects, why, who can see it and how you can control it. We try to collect only what we really need.',
      sections: [
        {
          h: 'Who is responsible',
          p: ['The data controller is {owner}. For any privacy question, or to exercise your rights, write to {email}.'],
        },
        {
          h: 'What we collect',
          list: [
            'Account: email, username and password. The password is only stored encrypted: nobody can read it, not even us.',
            'Pets and photos: name, species, breed, city and the photos you upload.',
            'Votes: which photos you picked in duels. With an account the vote is linked to your profile; without one, to an anonymous code kept in a technical cookie.',
            'Shelters: name, city, description, website, tax code, contact email and phone. Tax code, email and phone are only seen by moderators and the shelter itself.',
            'Adoption requests: the message and (optional) phone number you send to a shelter.',
            'Notifications: the alerts we show you under the bell.',
            'Technical data: browser language and approximate location (country and city) derived from your IP address. We use the IP address for a moment to limit automated votes and abuse, and we do not store it.',
            'Ads: when you see or click an ad we record the event with an anonymous code, country, city and language, to count views and clicks.',
          ],
        },
        {
          h: 'Why we use it',
          list: [
            'To provide the service: account, pets, duels, rankings, challenges and adoptions (performance of a contract).',
            'For security: blocking bots, fake votes and forbidden content, and moderating photos (legitimate interest).',
            'To show ads from our advertisers chosen by area, language and time of day, without profiling you (legitimate interest).',
            'To show Google ads that use cookies, only if you accept in the banner (consent).',
            'To verify shelters before they go public (legitimate interest and animal welfare).',
          ],
        },
        {
          h: 'What others can see',
          p: [
            'Public: your username, your pets with name, breed and city, approved photos and, if you run a verified shelter, its public page.',
            'Not public: your email, the votes you cast and the hearts your pets receive outside the top 5. Only you can see those.',
          ],
        },
        {
          h: 'Who we share it with',
          list: [
            'The provider hosting the site and database, which processes data only on our behalf.',
            'The shelter you send an adoption request to: it receives the message, your username, your email so it can reply, and your phone if you give it.',
            'Google, only if you accept Google ads: Google then uses its own cookies, as described in its policy (policies.google.com/privacy).',
          ],
          p: ['We never sell your data.'],
        },
        {
          h: 'Data outside the European Union',
          p: ['If you accept Google ads, some data may be transferred to the United States. Google takes part in the EU-US Data Privacy Framework and uses the standard contractual clauses approved by the European Commission.'],
        },
        {
          h: 'How long we keep it',
          p: [
            'We keep account data for as long as the account exists. When you delete it we immediately erase your profile, pets, photos (files included), shelter, adoption requests and notifications.',
            'The votes you cast remain, but with no link to you: they keep other people\'s rankings fair. The same applies to ad counts.',
          ],
        },
        {
          h: 'Your rights',
          list: [
            'See and download your data: on the «Your account» page you can download a file with everything about you.',
            'Correct it: pet name, breed and city can be edited from your profile; for anything else, write to us.',
            'Erase it: delete your account at any time from the «Your account» page.',
            'Object to or restrict processing, and withdraw consent to Google ads from the menu, under «Cookies and ads».',
            'Complain to a data protection authority, such as the one in your country.',
          ],
        },
        {
          h: 'Minimum age',
          p: ['You must be at least 14 to create an account. If you are younger, ask a parent to create it for you.'],
        },
        {
          h: 'Changes',
          p: ['If we change this policy we update the date at the top. For important changes we will tell you with a notice on the site.'],
        },
      ],
    },
    cookie: {
      title: 'Cookie policy',
      intro: 'Cookies are small files the site stores in your browser. PetDuel uses only a few, and almost all of them are needed just to make it work.',
      sections: [
        {
          h: 'Technical cookies',
          p: ['They keep the site working and do not need your consent. We never use them to follow you on other sites.'],
          table: {
            head: ['Name', 'Purpose', 'Duration'],
            rows: [
              ['nuxt-session', 'Keep you signed in and remember the anonymous voting code if you have no account (encrypted)', '30 days'],
              ['lingua', 'Remember the language you chose', '1 year'],
              ['tema', 'Remember the light or dark theme', '1 year'],
              ['consenso', 'Remember your choice about Google ads', '6 months'],
            ],
          },
        },
        {
          h: 'Google ad cookies',
          p: [
            'Only if you accept in the banner do we load Google AdSense ads. Google uses its own cookies to show, measure and personalise ads based on your activity.',
            'If you reject, Google\'s script is not loaded at all: you only see ads from our own advertisers, which use no cookies.',
            'How Google uses data: policies.google.com/technologies/partner-sites.',
          ],
        },
        {
          h: 'Changing your mind',
          p: [
            'You can change your choice at any time from the menu at the top right, under «Cookies and ads».',
            'You can also delete cookies in your browser settings. If you delete technical cookies you will need to sign in again.',
          ],
        },
        {
          h: 'Contact',
          p: ['For questions about cookies write to {email}.'],
        },
      ],
    },
    terms: {
      title: 'Terms of use',
      intro: 'By using PetDuel you accept these rules. They are meant to keep the site fun, fair and safe for people and animals.',
      sections: [
        {
          h: 'The service',
          p: ['PetDuel is a free site where you vote on pairs of animal photos, join themed challenges and discover animals looking for a home. It is run by {owner}.'],
        },
        {
          h: 'Your account',
          list: [
            'You must be at least 14 years old.',
            'One account per person. Keep your password secret: you are responsible for what happens with your account.',
            'Your username must not impersonate others or be offensive.',
          ],
        },
        {
          h: 'The photos you upload',
          list: [
            'Only upload photos you took or have the right to use, and only of animals that are yours or in your care.',
            'Not allowed: photos with recognisable people, violent, cruel or sexual content, mistreated or endangered animals, advertising and offensive text.',
            'Your photos remain yours. By uploading them you let us show them on PetDuel, in duels, rankings, challenges and share cards, until you delete them.',
            'Every photo is checked before going public. We may reject or remove a photo that breaks these rules.',
          ],
        },
        {
          h: 'Fair votes',
          p: ['Bots, automated votes, multiple accounts and any trick to inflate a pet\'s hearts are forbidden. If it happens we may cancel votes, remove the pet from rankings or suspend the account.'],
        },
        {
          h: 'Shelters and adoptions',
          list: [
            'Shelters must give true information about themselves and their animals. We verify them before they go public.',
            'Adoptions happen directly between you and the shelter. PetDuel puts you in touch but is not part of the adoption and is not responsible for any agreement made.',
          ],
        },
        {
          h: 'Ads',
          p: ['The site is funded by ads shown between duels. We are not responsible for advertisers\' products or websites.'],
        },
        {
          h: 'Suspension and deletion',
          p: ['You can delete your account at any time from the «Your account» page. We may suspend or delete accounts that break these rules.'],
        },
        {
          h: 'Liability',
          p: ['We do our best to keep the site working well, but it may have interruptions or errors. To the extent permitted by law we are not liable for indirect damage caused by using the site. The rights the law gives consumers always remain valid.'],
        },
        {
          h: 'Changes and governing law',
          p: [
            'If we change these terms we update the date at the top and, for important changes, tell you on the site.',
            'Italian law applies. For questions write to {email}.',
          ],
        },
      ],
    },
  },
} satisfies LegalTexts

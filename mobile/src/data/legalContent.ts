// Standard-form legal boilerplate drafted for PBGearbag's launch. This is
// NOT a substitute for review by a licensed attorney — the placeholders
// below (governing-law jurisdiction, dispute resolution, business entity
// details) need real legal input before this should be treated as final.
export const LAST_UPDATED = "July 2026";

export interface LegalDoc {
  key: string;
  title: string;
  sections: { heading: string; body: string }[];
}

export const LEGAL_DOCS: LegalDoc[] = [
  {
    key: "terms",
    title: "Terms of Service",
    sections: [
      {
        heading: "1. Agreement",
        body: "By creating an account or using PBGearbag, you agree to these Terms of Service. If you do not agree, do not use the platform. PBGearbag is operated by ArandMedia (\"we\", \"us\", \"the Company\").",
      },
      {
        heading: "2. Eligibility",
        body: "You must meet the minimum age required in your location to create an account, and you confirm this when registering. You're responsible for the accuracy of the information you provide and for keeping your login credentials secure.",
      },
      {
        heading: "3. Your Account",
        body: "You're responsible for all activity under your account. Notify us immediately if you suspect unauthorized access. We may suspend or terminate accounts that violate these Terms, the Community Code, or the Marketplace Rules.",
      },
      {
        heading: "4. Your Content",
        body: "You retain ownership of the content you post (photos, listings, posts, profile information). By posting, you grant PBGearbag a non-exclusive, worldwide, royalty-free license to host, display, and distribute that content on the platform for the purpose of operating the service. You're responsible for content you post and confirm you have the rights to share it.",
      },
      {
        heading: "5. Marketplace",
        body: "PBGearbag provides a platform for players to list and discover gear. Transactions occur directly between buyers and sellers — PBGearbag is not a party to any sale, does not hold funds in escrow, and does not guarantee the condition, safety, or legality of any listed item. See the Marketplace Rules for details.",
      },
      {
        heading: "6. Subscriptions & Billing",
        body: "PBGearbag Pro is a paid subscription billed monthly or yearly through Stripe. Subscriptions renew automatically until canceled. You can manage or cancel your subscription at any time from your account's billing portal. Refunds are handled on a case-by-case basis by contacting support.",
      },
      {
        heading: "7. Prohibited Conduct",
        body: "You agree not to: use the platform for anything illegal; harass, threaten, or abuse other users; post false, misleading, or fraudulent listings; attempt to circumvent security measures; scrape or misuse platform data; or impersonate another person or entity.",
      },
      {
        heading: "8. Termination",
        body: "You may delete your account at any time from Account Settings. We may suspend or terminate your access for violating these Terms, at our discretion, with or without notice depending on severity.",
      },
      {
        heading: "9. Disclaimers",
        body: "PBGearbag is provided \"as is\" without warranties of any kind. We do not guarantee the platform will be uninterrupted, error-free, or secure. Paintball is a physical sport with inherent risk — PBGearbag is not responsible for injuries, disputes, or incidents that occur at fields, events, or in connection with gear purchased through the marketplace.",
      },
      {
        heading: "10. Limitation of Liability",
        body: "To the maximum extent permitted by law, PBGearbag and ArandMedia are not liable for indirect, incidental, or consequential damages arising from your use of the platform, including disputes between users or issues with marketplace transactions.",
      },
      {
        heading: "11. Governing Law",
        body: "[Placeholder — to be finalized with legal counsel] These Terms are governed by the laws of the jurisdiction in which ArandMedia is registered, without regard to conflict-of-law principles.",
      },
      {
        heading: "12. Changes",
        body: "We may update these Terms from time to time. Continued use of the platform after changes take effect constitutes acceptance of the updated Terms.",
      },
      {
        heading: "13. Contact",
        body: "Questions about these Terms can be sent to support@arandmedia.com.",
      },
    ],
  },
  {
    key: "privacy",
    title: "Privacy Policy",
    sections: [
      {
        heading: "1. What We Collect",
        body: "Account information (email, username, password — stored hashed, never in plain text); profile information you choose to add (name, bio, location, playstyle, avatar/banner images); content you post (listings, posts, comments, messages); and usage data (device/browser info, IP address, log data).",
      },
      {
        heading: "2. What We Don't Store",
        body: "We never store your payment card details. Subscription billing is handled entirely by Stripe, a PCI-compliant payment processor — PBGearbag only receives confirmation of subscription status, not card numbers.",
      },
      {
        heading: "3. How We Use Your Data",
        body: "To operate and improve the platform, to show your public profile and listings to other users, to send transactional emails (verification, password resets, notifications), and to enforce our Terms and Community Code.",
      },
      {
        heading: "4. Third-Party Services",
        body: "We use Stripe for payment processing, Cloudflare R2 for file storage (photos you upload), and Resend for transactional email delivery. Each of these processes data only as needed to provide their service to us.",
      },
      {
        heading: "5. What's Public",
        body: "Your username, display name, bio, avatar, banner, city/region, playstyle, and public posts/listings are visible to other users and, unless you configure privacy settings otherwise, to the public. Your email address and password are never shown to other users.",
      },
      {
        heading: "6. Your Choices",
        body: "You can edit or remove most profile information from Edit Profile, control who can message you and manage blocked users from Account Settings, and permanently delete your account and associated data from Account Settings at any time.",
      },
      {
        heading: "7. Data Retention",
        body: "We retain your data for as long as your account is active. When you delete your account, your profile, listings, and posts are removed. Some records may be retained where required for legal, security, or fraud-prevention purposes.",
      },
      {
        heading: "8. Children's Privacy",
        body: "PBGearbag is not directed at children under the minimum age required in their jurisdiction, and we rely on the age confirmation given at registration.",
      },
      {
        heading: "9. Changes",
        body: "We may update this Privacy Policy from time to time. Material changes will be reflected by an updated date at the top of this page.",
      },
      {
        heading: "10. Contact",
        body: "Questions about this Privacy Policy, or requests regarding your data, can be sent to support@arandmedia.com.",
      },
    ],
  },
  {
    key: "marketplace",
    title: "Marketplace Rules",
    sections: [
      {
        heading: "1. Peer-to-Peer Marketplace",
        body: "PBGearbag's marketplace connects buyers and sellers directly. We are not a party to any transaction, do not process payments between buyers and sellers, and do not take a commission on sales unless explicitly stated otherwise in the future.",
      },
      {
        heading: "2. Listing Standards",
        body: "Listings must accurately describe the item's condition, be items you actually own and have the right to sell, and use real photos of the actual item (not stock photos, unless clearly disclosed for a new/unused item).",
      },
      {
        heading: "3. Prohibited Items",
        body: "You may not list: stolen goods, counterfeit gear, firearms or firearm parts, items that violate local laws, or anything unrelated to the paintball/airsoft/adjacent hobby community.",
      },
      {
        heading: "4. Payments & Shipping",
        body: "Payment and shipping/pickup arrangements happen directly between buyer and seller, outside of PBGearbag. We strongly recommend never wiring money or paying outside of a traceable, buyer-protected payment method, and agreeing on inspection/return terms in writing before completing a sale.",
      },
      {
        heading: "5. Disputes",
        body: "PBGearbag does not mediate disputes between buyers and sellers. If a user violates these rules (fraud, misrepresentation, non-delivery), report it — we may remove listings and suspend accounts, but cannot guarantee recovery of funds or items.",
      },
      {
        heading: "6. Reporting",
        body: "Use the Report action on a listing or profile to flag suspected fraud, counterfeit items, or rule violations. Reports are reviewed by our moderation team.",
      },
    ],
  },
  {
    key: "community",
    title: "Community Code",
    sections: [
      {
        heading: "1. Be a Good Teammate",
        body: "Treat other players the way you'd want to be treated on the field — with respect, fairness, and good sportsmanship, whether you're posting, messaging, buying, or selling.",
      },
      {
        heading: "2. Not Allowed",
        body: "Harassment, hate speech, threats, or discrimination of any kind; sharing another player's private information without consent; posting graphic violence, illegal activity, or explicit content; spam, scams, or repeated unsolicited promotion.",
      },
      {
        heading: "3. Field & Event Safety",
        body: "PBGearbag surfaces field and event information from the community, but does not guarantee its accuracy. Always follow the safety rules and staff instructions of the actual field or event you attend.",
      },
      {
        heading: "4. Enforcement",
        body: "Violations may result in content removal, a warning, temporary suspension, or a permanent ban, at our discretion, depending on severity. Serious or repeated violations may be reported to law enforcement where appropriate.",
      },
      {
        heading: "5. Reporting & Blocking",
        body: "You can report any post, listing, or profile that violates this Code, and block any user you don't want to interact with — blocking prevents them from following or messaging you.",
      },
    ],
  },
];

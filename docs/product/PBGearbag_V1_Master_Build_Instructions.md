# PBGearbag V1 Master Build Instructions

**Document status:** Implementation directive  
**Version:** 1.0  
**Product:** PBGearbag  
**Primary domain:** `pbgearbag.com`  
**Repository baseline:** `claude/paintball-community-app-01DDH3Bp4mbfDFiyKzv5EnZY`  
**Build objective:** Launch a trustworthy, mobile-first paintball community platform and marketplace on a free-to-start infrastructure, then scale only when usage requires paid services.

---

## 0. Executive order to the development team

Do not restart this project. Do not replace NestJS or Expo merely to match a preferred stack. The existing repository contains usable authentication, users, marketplace CRUD, shared types, mobile screens, Docker configuration, and deployment documentation. Preserve working code, correct the architectural inconsistencies, and evolve the application in controlled increments.

PBGearbag is not merely a social feed. It is a service platform for the whole paintball ecosystem:

- New, casual, recreational, scenario, woodsball, pump, mechanical, magfed, speedball, tournament, and professional players
- Teams, captains, coaches, referees, photographers, creators, collectors, technicians, and volunteers
- Fields, event producers, leagues, pro shops, manufacturers, airsmiths, hydro-test providers, media outlets, and other vendors

The V1 launch must provide an excellent version of a focused core. It must not attempt to ship every long-term idea at once.

### V1 product promise

A person can create a paintball identity, discover people/teams/fields/events, show their gear, safely list gear for sale or trade, communicate about listings, and build a persistent history in the sport.

### V1 launch pillars

1. Identity and onboarding
2. Player profiles and digital gearbags
3. Marketplace and trust
4. Fields and events discovery
5. Teams and recruiting
6. Messaging and notifications
7. Moderation and administration
8. Search and discovery

Media publishing, courses, live streaming, payments, tournament brackets, advanced rankings, and advertising remain post-launch unless specifically required to complete a core V1 flow.

---

# 1. Honest repository audit

## 1.1 What exists and should be retained

- npm workspaces for `backend`, `mobile`, and `shared`
- NestJS backend
- Expo / React Native application with web export capability
- TypeScript throughout
- TypeORM entities and migrations tooling
- JWT authentication foundation
- User registration and login screens
- User profile editing
- Marketplace listing entity, controller, service, DTOs, and screens
- Shared user, team, and marketplace types
- Upload service abstraction
- Docker and NGINX files
- Existing architecture, database, deployment, and testing documents

## 1.2 Material gaps and contradictions

These are not optional cleanup items. Resolve them before expanding the product.

1. **Database mismatch:** documentation describes PostgreSQL, while `backend/src/app.module.ts` configures TypeORM as MySQL and `backend/package.json` includes `mysql2`.
2. **Architecture overstatement:** the documentation depicts GraphQL, Elasticsearch, complete events/social/rankings/streaming/brands services, but several of those modules contain no implementation beyond module files.
3. **No dedicated SEO web application:** the current client is Expo-first. It can export to web, but a public discovery platform will eventually benefit from a dedicated SSR/SEO web surface.
4. **No complete role/permission system:** identity and moderation cannot safely scale without RBAC and ownership checks.
5. **No production-grade token/session model:** refresh-token storage on the user record is insufficient for multiple devices, rotation, revocation, and compromise detection.
6. **No migrations-first discipline:** development synchronization is enabled. Production must never use schema synchronization.
7. **Marketplace trust is incomplete:** no offers, favorites, conversations, reports, reviews, transaction records, or listing moderation workflow.
8. **Uploads require hardening:** media validation, object ownership, quotas, image processing, and malware safeguards are not fully specified.
9. **No centralized notification, audit, analytics, feature-flag, or moderation systems.
10. **Tests are not broad enough to support rapid AI-generated development safely.

## 1.3 Required architectural decision

Migrate the backend from MySQL configuration to PostgreSQL before adding major schema breadth.

Reasons:

- The existing documentation and long-term data model already assume PostgreSQL.
- PostgreSQL supports JSONB, arrays, geospatial extensions, robust full-text search, constraints, and indexing patterns useful to PBGearbag.
- A free-to-start hosted Postgres service is available.
- Performing the migration now is much cheaper than after more modules are built.

Do not attempt to support both MySQL and PostgreSQL. PostgreSQL becomes the single source of truth.

---

# 2. Free-to-start deployment architecture

“Free” means no recurring infrastructure charge while the project remains inside provider free allowances. It does not mean unlimited production capacity. The system must fail safely when limits are approached and must expose usage metrics so the company can upgrade deliberately.

## 2.1 Launch topology

```text
Users
  |
  v
Cloudflare DNS, CDN, TLS, bot protection
  |
  +--> pbgearbag.com          Expo web/PWA static export on Cloudflare Pages
  +--> www.pbgearbag.com      redirect to apex
  +--> api.pbgearbag.com      NestJS API on Render free web service
  +--> media.pbgearbag.com    Cloudflare R2 public/custom media domain

NestJS API
  +--> Neon PostgreSQL free plan
  +--> Upstash Redis free plan
  +--> Cloudflare R2 object storage free allowance
  +--> Resend free allowance for transactional email, or SMTP provider configured by owner
  +--> Expo push notification service for mobile notifications
```

## 2.2 Provider assignments

### Cloudflare

Use for:

- DNS
- SSL/TLS
- CDN
- caching of public media and static assets
- Pages hosting for the web/PWA build
- R2 for user-uploaded images
- rate-limit and firewall rules available on the selected plan

### Render

Use one free web service for the NestJS API during private beta and early public beta.

Expected limitation: free services may sleep when inactive and cold starts may be noticeable. Do not describe the free service as high-availability production infrastructure. Add a visible status system and health checks.

### Neon PostgreSQL

Use one production project and one optional development branch/project within free allowances. Enable SSL and use the pooled connection string where recommended.

### Upstash Redis

Use for:

- rate-limit counters
- short-lived cache entries
- distributed locks
- background-job deduplication
- websocket presence only if usage permits

Do not make the application dependent on Redis for durable business data.

### Cloudflare R2

Use private buckets and signed upload/download URLs where possible. Public profile and listing images may be served through a controlled public media domain after moderation checks.

### Expo

Use Expo for local development and limited cloud builds/updates under the free plan. The first public launch should be a PWA. Native store distribution is a separate release track because app-store accounts are not universally free.

## 2.3 Costs that cannot honestly be promised as free

- `pbgearbag.com` registration/renewal, unless already paid
- Apple App Store distribution, normally requiring an annual Apple Developer Program membership
- Google Play developer registration, where applicable
- Stripe processing fees once real payments are enabled
- SMS delivery
- high-volume transactional email
- video transcoding/streaming
- infrastructure after free quotas are exceeded

V1 can launch publicly as a web/PWA product without paying app-store distribution fees.

---

# 3. Target repository structure

Retain the workspace and evolve it without a disruptive rewrite.

```text
pbgearbag/
├── backend/
│   ├── src/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── profiles/
│   │   ├── roles/
│   │   ├── gearbags/
│   │   ├── marketplace/
│   │   ├── messaging/
│   │   ├── teams/
│   │   ├── fields/
│   │   ├── events/
│   │   ├── search/
│   │   ├── notifications/
│   │   ├── media/
│   │   ├── reviews/
│   │   ├── reports/
│   │   ├── moderation/
│   │   ├── admin/
│   │   ├── audit/
│   │   ├── analytics/
│   │   ├── feature-flags/
│   │   ├── health/
│   │   ├── common/
│   │   └── config/
│   ├── migrations/
│   └── test/
├── mobile/
│   ├── src/
│   │   ├── components/
│   │   ├── features/
│   │   ├── navigation/
│   │   ├── screens/
│   │   ├── services/
│   │   ├── store/
│   │   ├── theme/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── accessibility/
│   └── assets/
├── shared/
│   └── src/
│       ├── contracts/
│       ├── enums/
│       ├── schemas/
│       ├── types/
│       └── constants/
├── docs/
│   ├── adr/
│   ├── api/
│   ├── product/
│   ├── operations/
│   ├── security/
│   └── runbooks/
├── .github/
│   └── workflows/
├── render.yaml
├── wrangler.toml
└── package.json
```

Do not split into microservices in V1. Use a modular monolith. Domain boundaries are required; separate network services are not.

---

# 4. Engineering standards

## 4.1 TypeScript

- Enable strict mode in every package.
- Do not use `any` without a documented waiver.
- Prefer shared API contracts and schemas over duplicated interfaces.
- Never expose TypeORM entities directly as API responses.
- Map entities to response DTOs.

## 4.2 Backend

- Controllers handle transport only.
- Services own business logic.
- Repositories/data access remain isolated.
- DTO validation is mandatory.
- Every write endpoint requires authorization and ownership checks.
- Use database transactions for multi-step state changes.
- Use idempotency keys for sensitive repeated writes.
- Use cursor pagination for feeds and messages; offset pagination is acceptable for small admin tables.
- Use UTC in storage and ISO 8601 in APIs.
- Money is stored as integer minor units, never floating point.

## 4.3 Frontend

- One visual design system.
- Mobile-first breakpoints.
- Every screen implements loading, empty, error, retry, offline, and permission-denied states where relevant.
- All destructive actions require confirmation.
- Optimistic updates only where rollback is reliable.
- Store authentication secrets only in secure storage on native platforms; use secure, HttpOnly cookies for a later SSR web client.
- Never place privileged authorization logic solely in the client.

## 4.4 Accessibility

Meet WCAG 2.2 AA where applicable:

- keyboard navigability on web
- visible focus
- labels for every control
- minimum touch target sizing
- color contrast
- reduced-motion support
- semantic heading order
- screen-reader announcements for errors and status changes
- captions/transcripts for platform-produced video when media is introduced

## 4.5 Git and pull requests

Branches:

```text
feat/<ticket>-<slug>
fix/<ticket>-<slug>
chore/<ticket>-<slug>
release/v1.x.x
```

Each PR must include:

- problem statement
- implementation summary
- screenshots for UI work
- schema/migration impact
- security impact
- test evidence
- rollback notes
- documentation changes

No direct commits to `main`. Require passing CI and one review, human or designated review agent.

---

# 5. Environment model

Create separate environments:

- local
- preview/test
- production

Required environment variables:

```dotenv
NODE_ENV=development
PORT=3000
APP_NAME=PBGearbag
APP_URL=http://localhost:8081
API_URL=http://localhost:3000
API_PREFIX=api/v1

DATABASE_URL=postgresql://...
DATABASE_SSL=true
DB_POOL_MAX=5

JWT_ACCESS_SECRET=replace-with-strong-secret
JWT_ACCESS_TTL=15m
JWT_REFRESH_SECRET=replace-with-different-strong-secret
JWT_REFRESH_TTL=30d

REDIS_URL=rediss://...

R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=pbg-media
R2_PUBLIC_BASE_URL=https://media.pbgearbag.com

EMAIL_FROM=no-reply@pbgearbag.com
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=

EXPO_ACCESS_TOKEN=
SENTRY_DSN=

CORS_ORIGINS=http://localhost:8081,https://pbgearbag.com
RATE_LIMIT_TTL_SECONDS=60
RATE_LIMIT_MAX=100
MAX_UPLOAD_BYTES=10485760
```

Never commit production secrets. Remove the existing committed `.env.production` files from version control and rotate every secret they contain, even if they appear unused.

---

# 6. Foundation migration tasks

Complete these in order.

## 6.1 Security cleanup

1. Remove tracked production environment files.
2. Add `.env*` to `.gitignore`, preserving only `.env.example`.
3. Rotate JWT, database, storage, email, Stripe, and other credentials.
4. Enable secret scanning in GitHub.
5. Add dependency auditing to CI.

## 6.2 PostgreSQL migration

1. Remove `mysql2`.
2. Install `pg`.
3. Change TypeORM to `type: 'postgres'`.
4. Replace MySQL-specific column behavior.
5. Replace `simple-array` with Postgres arrays or normalized join tables.
6. Use `jsonb` for structured preference blobs only when the values do not require frequent relational querying.
7. Create an initial migration representing the actual V1 schema.
8. Disable `synchronize` in every environment except disposable local experimentation; preferred setting is false everywhere.
9. Run migrations in CI and deployment.

Example TypeORM configuration requirements:

```ts
{
  type: 'postgres',
  url: config.getOrThrow<string>('DATABASE_URL'),
  ssl: config.get<boolean>('DATABASE_SSL')
    ? { rejectUnauthorized: false }
    : false,
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  synchronize: false,
  logging: config.get('NODE_ENV') === 'development',
  extra: { max: Number(config.get('DB_POOL_MAX') ?? 5) },
}
```

## 6.3 API conventions

All successful responses:

```json
{
  "data": {},
  "meta": {},
  "requestId": "uuid"
}
```

All errors:

```json
{
  "error": {
    "code": "LISTING_NOT_FOUND",
    "message": "The requested listing could not be found.",
    "details": []
  },
  "requestId": "uuid",
  "timestamp": "2026-07-10T12:00:00.000Z"
}
```

Use stable machine-readable error codes. Do not leak stack traces or SQL errors.

## 6.4 Health and readiness

Implement:

- `GET /health/live`
- `GET /health/ready`
- database connectivity check
- optional Redis connectivity indicator that does not fail readiness if Redis is configured as noncritical
- build version and commit SHA in protected diagnostics

---

# 7. Identity, authentication, and onboarding

## 7.1 Account model

Separate account credentials from player/profile presentation.

### `users`

- id UUID
- email CITEXT unique
- username CITEXT unique
- password_hash
- status: pending, active, suspended, banned, deleted
- email_verified_at
- last_login_at
- created_at
- updated_at
- deleted_at

### `profiles`

- user_id PK/FK
- display_name
- bio
- avatar_media_id
- banner_media_id
- city
- region
- country_code
- latitude/longitude optional and private by default
- experience_started_year
- skill_level
- profile_visibility
- created_at
- updated_at

### Supporting tables

- play_styles
- user_play_styles
- interests
- user_interests
- roles
- permissions
- user_roles
- role_permissions
- sessions
- email_verification_tokens
- password_reset_tokens
- user_blocks
- privacy_settings
- notification_preferences

## 7.2 Authentication requirements

V1:

- email/password registration
- email verification
- login
- access token
- rotating refresh token per device/session
- logout current session
- logout all sessions
- password reset
- rate limiting
- secure password hashing using Argon2id or bcrypt with reviewed cost

Post-V1:

- Google and Apple OAuth
- passkeys
- TOTP 2FA

Do not add five OAuth providers before the core account lifecycle is reliable.

## 7.3 Registration flow

1. Enter email, username, password, and age confirmation.
2. Accept Terms, Privacy Policy, Marketplace Rules, and Community Code.
3. Verify email.
4. Choose display name.
5. Select one or more play styles.
6. Select experience level.
7. Select general location, not an exact home address.
8. Select interests.
9. Optionally choose home field.
10. Add avatar or skip.
11. Land on a personalized “Start Here” dashboard.

Allow onboarding to be resumed. Never trap the user because an optional field is missing.

## 7.4 Age handling

Because PBGearbag may serve minors:

- establish a minimum account age appropriate to legal review and jurisdiction
- do not collect unnecessary birthdate data
- restrict exact location visibility
- prevent adult-oriented direct-contact patterns from being promoted to minors
- create reporting categories for grooming, exploitation, threats, and unsafe meetups
- show prominent safety advice for local pickup and event meetups

A lawyer must review the final youth/privacy policy before public launch.

---

# 8. Player profile and Paintball Passport

## 8.1 Public profile

Required:

- avatar and banner
- username and display name
- verification badges
- short bio
- general location
- play styles
- years playing
- home field link
- teams
- gearbag preview
- marketplace reputation
- event attendance preview
- badges/achievements preview
- report and block controls

Do not expose email, phone, exact address, private gear serial numbers, or private purchase data.

## 8.2 Passport

The Passport is a curated paintball history, not a surveillance feed.

Record types:

- account milestone
- field visit/check-in
- event attendance
- team membership
- verified tournament result
- badge/achievement
- gear ownership milestone
- completed sale/trade
- course/certification later
- volunteer/referee contribution

Every record has:

- source type and source id
- title and summary
- occurred_at
- verification status
- visibility
- media attachments
- created_by
- correction/dispute status

Users may hide records from public display. Administrators may correct false records through an audited workflow. Financial and private moderation events never appear in the Passport.

---

# 9. Digital Gearbag

## 9.1 Purpose

Let players catalog, display, maintain, compare, and optionally list their equipment.

## 9.2 Entities

### `gearbags`

- id
- owner_user_id
- name
- description
- visibility
- is_primary
- created_at
- updated_at

### `gear_items`

- id
- gearbag_id
- category_id
- manufacturer_id nullable
- product_id nullable
- custom_brand_text nullable
- custom_model_text nullable
- nickname
- condition
- colorway
- purchase_date private
- purchase_price_cents private
- estimated_value_cents private
- serial_number_encrypted private
- notes private
- public_description
- is_for_sale
- created_at
- updated_at
- archived_at

### Supporting

- gear_categories
- manufacturers
- products
- gear_item_media
- gear_item_upgrades
- maintenance_records
- loadouts
- loadout_items

## 9.3 V1 screens

- My Gearbag
- Public Gearbag
- Add Gear Item
- Edit Gear Item
- Gear Item Detail
- Create Loadout
- Share Loadout
- Convert Gear Item to Marketplace Draft

## 9.4 UX requirements

- Manual entry must always work even if a product catalog record does not exist.
- Never require a serial number.
- Serial numbers default to private and encrypted.
- A listing created from a gear item copies public data but does not expose private notes or purchase price.
- Archived gear remains in private history for Passport use.

---

# 10. Marketplace V1

## 10.1 Scope

V1 supports discovery and communication for:

- For Sale
- Trade
- For Sale or Trade
- Wanted

V1 does not process money or hold funds. Transactions happen outside the platform during beta, accompanied by clear fraud warnings. Stripe Connect is a later release after legal, tax, dispute, refund, and seller-onboarding work is complete.

## 10.2 Categories

- Markers
- Masks
- Loaders
- Tanks and regulators
- Barrels and inserts
- Packs and pods
- Soft goods
- Protective gear
- Apparel
- Parts and upgrades
- Tools and tech equipment
- Complete setups
- Collectibles and vintage
- Services
- Wanted

Paint sales require special policy review because shipping compressed containers, paint, and related items may have carrier restrictions.

## 10.3 Listing schema

- id
- seller_id
- listing_type
- title
- slug
- description
- category_id
- manufacturer_id nullable
- model
- year nullable
- condition
- price_cents nullable
- currency
- negotiable
- accepts_trades
- location_city
- location_region
- country_code
- shipping_available
- local_pickup
- status: draft, pending_review, active, reserved, sold, traded, expired, removed
- moderation_status
- published_at
- expires_at
- sold_at
- created_at
- updated_at

Supporting tables:

- listing_media
- listing_favorites
- listing_questions
- listing_offers
- listing_views aggregated
- listing_reports
- listing_status_history
- marketplace_conversations
- marketplace_outcomes
- reviews

## 10.4 Listing creation flow

1. Choose listing type.
2. Choose category.
3. Add at least three recommended photos; one minimum.
4. Add title and detailed description.
5. Select condition using a defined rubric.
6. Add price if applicable.
7. Choose shipping/local pickup.
8. Add general location.
9. Review safety checklist.
10. Preview.
11. Submit for automated checks and publication/moderation.

## 10.5 Trust and safety

Display:

- account age
- email verification
- optional identity/business verification later
- completed marketplace outcomes
- seller response rate
- reviews
- moderation warnings only when policy permits

Prevent:

- duplicate spam listings
- stolen photos when detectable
- off-platform phishing links
- weapons/non-paintball weapon listings
- unsafe compressed-air tank claims
- counterfeit goods
- prohibited services

Provide:

- report listing
- report user
- block user
- safe local meetup guidance
- no-wire-transfer warning
- immutable moderation audit trail

## 10.6 Marketplace acceptance criteria

A verified user can create, edit, publish, expire, mark reserved, mark sold/traded, and archive a listing. Another user can search, filter, favorite, ask a question, make a nonbinding offer, message the seller, report the listing, and leave a review only after both parties confirm an outcome.

---

# 11. Messaging

## 11.1 Conversation types

- direct
- marketplace
- team
- event organizer inquiry
- moderation support

## 11.2 Requirements

- participant membership checks on every read/write
- unread counts
- pagination
- delivery timestamp
- read timestamp
- attachments through media service
- blocking enforcement
- report conversation/message
- edit window for plain messages
- soft deletion for user view, retained according to moderation/legal policy
- no end-to-end encryption claim

## 11.3 Realtime approach

Start with polling or Socket.IO on the existing API if reliable on the selected host. Realtime is an enhancement, not a requirement for correctness. Messages must persist before being emitted.

---

# 12. Teams

## 12.1 Team types

- speedball/tournament
- scenario
- magfed
- woodsball/recreational
- pump/mechanical collective
- school/college club
- field team

## 12.2 Roles

- owner
- manager
- captain
- coach
- player
- substitute
- media
- alumni

## 12.3 V1 features

- create team
- team profile
- logo/banner
- roster
- invite/apply workflow
- role management
- recruiting status
- home field
- play styles/divisions
- upcoming events
- announcement posts
- public contact controls

Do not build complex tournament statistics before verified result ingestion exists.

---

# 13. Fields and vendors

## 13.1 Organization model

Use a generalized `organizations` table with typed profiles:

- field
- retailer/pro shop
- manufacturer
- airsmith/repair
- hydro testing
- event producer
- league
- media/creator business
- photographer/videographer
- jersey/apparel provider
- travel/lodging partner
- other paintball service

An organization can have multiple locations and multiple user managers.

## 13.2 Field profile

- name and slug
- verified owner claim status
- description
- address and map coordinates
- contact channels
- website/social links
- hours
- admission/rental/air/paint pricing fields
- BYOP policy
- air fill types/pressure
- play formats
- amenities
- food/camping/parking
- waiver link
- safety/rules link
- events
- photos
- reviews

## 13.3 Claim workflow

1. Any user can suggest a field.
2. Suggested records remain unverified.
3. Owner can request claim.
4. Admin verifies through business email, phone, public records, or provided documents.
5. Claim approval grants organization manager role.
6. Every claim decision is audited.

---

# 14. Events

## 14.1 Event types

- open play
- tournament
- scenario/big game
- magfed event
- pump/mechanical event
- clinic/training
- tryout
- practice
- charity event
- trade show/expo
- private event

## 14.2 V1 features

- create and edit event
- draft/publish/cancel lifecycle
- location/field link
- start/end time and timezone
- description and rules
- external registration URL
- cost display
- capacity display
- individual RSVP: interested/going
- team RSVP
- organizer contact
- banner/gallery
- attendee privacy controls
- event reminders
- post-event result/media links

V1 should link to external ticketing/registration rather than processing registration payments.

## 14.3 Safety

- cancellation prominently displayed
- weather/emergency updates
- age restrictions
- mask/safety requirements
- waiver requirements
- organizer verification status

---

# 15. Search and discovery

## 15.1 V1 search technology

Use PostgreSQL full-text search and trigram indexes first. Do not add Elasticsearch solely because an old diagram mentions it.

Search domains:

- users/profiles
- teams
- organizations/fields/vendors
- events
- marketplace listings
- gear catalog

## 15.2 Search behavior

- typo tolerance through trigram similarity
- filters by domain
- location radius where coordinates exist
- play style
- category
- price range
- condition
- date range
- verified status
- sort by relevance, newest, distance, price

## 15.3 Ranking safeguards

- sponsored placement must be labeled
- do not allow follower count alone to dominate
- suppress removed, expired, blocked, and hidden content
- incorporate freshness and relevance
- add anti-spam penalties

---

# 16. Notifications

## 16.1 Channels

V1:

- in-app
- email for account/security and important marketplace events
- Expo push when native builds are available

Later:

- SMS
- Discord webhook

## 16.2 Event matrix

Notify for:

- email verification and password reset
- new message
- marketplace question/offer
- listing status change
- team invite/application response
- event reminder/change/cancellation
- organization claim decision
- report resolution when appropriate
- security login alert

Each notification stores actor, recipient, type, entity reference, payload snapshot, read_at, and created_at.

Users control promotional and social notifications. Security notifications cannot be fully disabled.

---

# 17. Reviews and reputation

Keep reputation explainable.

## 17.1 Review contexts

- marketplace outcome
- field experience
- organization service
- event experience later

## 17.2 Rules

- one review per verified relationship/outcome
- no anonymous public reviews
- rating plus optional text
- edit window
- right of reply for organizations/sellers
- report and moderation workflow
- no paid removal of legitimate negative reviews
- do not combine unrelated ratings into a mysterious single “trust score”

Show separate marketplace, field, and community signals.

---

# 18. Moderation and administration

## 18.1 Reports

Reportable entities:

- user
- profile
- listing
- message
- team
- organization
- event
- review
- media

Reasons:

- spam
- fraud/scam
- harassment
- hate/abuse
- impersonation
- stolen goods
- prohibited item
- unsafe conduct
- child safety
- privacy/doxxing
- intellectual property
- other

## 18.2 Moderation states

- open
- triaged
- investigating
- actioned
- dismissed
- appealed
- closed

## 18.3 Actions

- no action
- content warning
- content removal
- temporary restriction
- listing freeze
- messaging restriction
- suspension
- ban
- verification revoked
- refer to emergency/legal process

Every action records moderator, reason code, notes, evidence references, timestamps, and appeal status.

## 18.4 Admin console

Required dashboards:

- platform health
- new users
- active listings
- report queue
- flagged uploads
- organization claims
- event moderation
- audit log
- feature flags
- email failures
- usage against free quotas

Use existing app UI for admin initially behind strict roles. A separate admin app is not required for V1.

---

# 19. Media service

## 19.1 Upload workflow

1. Client requests upload intent.
2. API validates user, purpose, MIME type, count, and size.
3. API returns signed R2 upload URL and media record id.
4. Client uploads directly.
5. Client confirms completion.
6. Background process validates object metadata and image decodability.
7. Generate normalized variants if available within free compute constraints.
8. Mark media ready.
9. Entity references ready media only.

## 19.2 Limits

Initial limits:

- JPEG, PNG, WebP
- 10 MB original maximum
- no arbitrary executable/document uploads
- listing: up to 12 images
- profile avatar: 1
- banner: 1
- gear item: up to 8
- event/field gallery quotas configurable

Strip EXIF location data by default. Never expose original file names or bucket keys as authorization mechanisms.

---

# 20. Analytics, audit, and feature flags

## 20.1 Product analytics

Track privacy-conscious events:

- registration_started/completed
- onboarding_completed
- profile_completed
- gear_item_added
- listing_created/published/favorited
- message_sent
- team_created/joined
- event_viewed/rsvp
- field_viewed/claimed
- search_performed

Do not record message bodies, passwords, private notes, precise location, or payment data in analytics.

## 20.2 Audit log

Audit:

- authentication/security changes
- role/permission changes
- moderation actions
- organization claims
- listing state changes
- sensitive profile changes
- admin exports

Audit records are append-only to normal application roles.

## 20.3 Feature flags

Support:

- global enable/disable
- environment
- user allowlist
- percentage rollout later

Initial flags:

- marketplace_offers
- team_applications
- field_claims
- event_creation
- native_push
- public_passport
- reviews

---

# 21. API surface

Prefix every endpoint with `/api/v1`.

## 21.1 Auth

```text
POST   /auth/register
POST   /auth/verify-email
POST   /auth/resend-verification
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout
POST   /auth/logout-all
POST   /auth/forgot-password
POST   /auth/reset-password
GET    /auth/sessions
DELETE /auth/sessions/:id
```

## 21.2 Me/profile

```text
GET    /me
PATCH  /me/profile
PATCH  /me/privacy
PATCH  /me/notifications
GET    /me/passport
GET    /me/dashboard
POST   /me/avatar/upload-intent
POST   /me/banner/upload-intent
```

## 21.3 Public profiles

```text
GET    /players
GET    /players/:username
GET    /players/:username/gearbag
GET    /players/:username/passport
POST   /players/:id/follow        # post-V1 optional
POST   /players/:id/block
DELETE /players/:id/block
POST   /players/:id/report
```

## 21.4 Gearbag

```text
GET    /gearbags/me
POST   /gearbags
PATCH  /gearbags/:id
DELETE /gearbags/:id
POST   /gearbags/:id/items
GET    /gear-items/:id
PATCH  /gear-items/:id
DELETE /gear-items/:id
POST   /gear-items/:id/archive
POST   /gear-items/:id/create-listing-draft
```

## 21.5 Marketplace

```text
GET    /marketplace/listings
POST   /marketplace/listings
GET    /marketplace/listings/:idOrSlug
PATCH  /marketplace/listings/:id
DELETE /marketplace/listings/:id
POST   /marketplace/listings/:id/publish
POST   /marketplace/listings/:id/reserve
POST   /marketplace/listings/:id/complete
POST   /marketplace/listings/:id/favorite
DELETE /marketplace/listings/:id/favorite
POST   /marketplace/listings/:id/questions
POST   /marketplace/listings/:id/offers
POST   /marketplace/listings/:id/report
GET    /marketplace/me/listings
GET    /marketplace/me/favorites
```

## 21.6 Messages

```text
GET    /conversations
POST   /conversations
GET    /conversations/:id
GET    /conversations/:id/messages
POST   /conversations/:id/messages
PATCH  /messages/:id
DELETE /messages/:id
POST   /messages/:id/report
```

## 21.7 Teams

```text
GET    /teams
POST   /teams
GET    /teams/:slug
PATCH  /teams/:id
POST   /teams/:id/invites
POST   /teams/:id/applications
PATCH  /teams/:id/members/:userId
DELETE /teams/:id/members/:userId
POST   /teams/:id/report
```

## 21.8 Organizations/fields

```text
GET    /organizations
POST   /organizations/suggestions
GET    /organizations/:slug
PATCH  /organizations/:id
POST   /organizations/:id/claim
POST   /organizations/:id/reviews
POST   /organizations/:id/report
GET    /fields
GET    /fields/:slug
```

## 21.9 Events

```text
GET    /events
POST   /events
GET    /events/:slug
PATCH  /events/:id
POST   /events/:id/publish
POST   /events/:id/cancel
POST   /events/:id/rsvp
DELETE /events/:id/rsvp
POST   /events/:id/report
```

## 21.10 Search, notifications, reports

```text
GET    /search
GET    /notifications
POST   /notifications/read-all
PATCH  /notifications/:id/read
POST   /reports
GET    /admin/reports
PATCH  /admin/reports/:id
GET    /admin/audit
GET    /admin/claims
PATCH  /admin/claims/:id
```

Document all endpoints through Swagger/OpenAPI and commit the generated schema or validate it in CI.

---

# 22. Screen inventory

## Public

- Landing
- Explore
- Marketplace Search
- Listing Detail
- Fields Search/Map
- Field Detail
- Events Search
- Event Detail
- Teams Search
- Team Detail
- Player Profile
- Gearbag View
- Sign In
- Register
- Terms
- Privacy
- Community Code
- Marketplace Safety

## Authenticated

- Start/Dashboard
- Notifications
- Conversations
- Conversation
- My Profile
- Edit Profile
- Privacy Settings
- Notification Settings
- Security/Sessions
- My Passport
- My Gearbag
- Gear Item Editor
- Create Listing
- Edit Listing
- My Listings
- Favorites
- Offers
- Create Team
- Team Management
- Create/Suggest Field or Vendor
- Claim Organization
- Create Event
- RSVP Management
- Reports/Support

## Admin

- Admin Overview
- Report Queue
- Report Detail
- User Detail
- Listing Moderation
- Organization Claims
- Event Moderation
- Audit Log
- Feature Flags
- System Health
- Usage/Quota Dashboard

---

# 23. Design system

## 23.1 Brand direction

PBGearbag should feel like durable equipment, organized staging areas, motorsport telemetry, and modern outdoor culture. Avoid toy-like neon overload and generic military cosplay.

## 23.2 Tokens

Create semantic tokens rather than hardcoded values:

- background
- surface
- surfaceElevated
- textPrimary
- textSecondary
- border
- brand
- brandStrong
- success
- warning
- danger
- info
- focus

Support dark and light themes, with dark as default only if user research supports it. Respect system preference.

## 23.3 Components

- AppShell
- TopNav
- BottomTabBar
- SideNav
- Button
- IconButton
- TextField
- TextArea
- Select
- Checkbox
- Radio
- Switch
- SearchInput
- Card
- EntityCard
- PlayerCard
- TeamCard
- FieldCard
- EventCard
- ListingCard
- GearItemCard
- Badge
- Avatar
- MediaGallery
- Price
- Rating
- Tabs
- FilterSheet
- Modal
- ConfirmationDialog
- Toast
- Pagination/CursorLoader
- Skeleton
- EmptyState
- ErrorState
- OfflineBanner
- ReportDialog
- VerificationMark

Every component gets examples and accessibility behavior documented.

---

# 24. Testing strategy

## Unit tests

- services
- policy/permission rules
- DTO validation
- mappers
- reputation calculations
- listing state machine

## Integration tests

- authentication lifecycle
- refresh rotation and revocation
- profile privacy
- marketplace ownership
- blocking enforcement
- team role permissions
- organization claims
- event lifecycle
- reports and moderation actions

## End-to-end tests

Critical journeys:

1. Register, verify, onboard, log in.
2. Add gear item and create listing draft.
3. Publish listing, favorite it from another account, message seller, complete outcome, review.
4. Create team, invite player, accept invite.
5. Suggest field, claim it, admin approves.
6. Create event and RSVP.
7. Report listing, moderator removes it, seller appeals.

## Security tests

- IDOR/ownership bypass
- role escalation
- refresh-token reuse
- file type spoofing
- oversized uploads
- brute-force login
- CORS
- injection
- mass assignment
- blocked-user messaging

CI must run lint, type checking, unit tests, integration tests, build, migration validation, and dependency audit.

---

# 25. Deployment instructions

## 25.1 Prepare GitHub

1. Push cleaned repository to private GitHub repo.
2. Protect `main`.
3. Add Dependabot.
4. Add GitHub Actions.
5. Store only non-provider secrets in GitHub encrypted secrets when needed.

## 25.2 Create Neon database

1. Create project named `pbgearbag-production`.
2. Copy pooled PostgreSQL connection string.
3. Require SSL.
4. Add `DATABASE_URL` to Render.
5. Run migrations during deployment.
6. Seed only reference data, never demo users in production.

## 25.3 Create Upstash Redis

1. Create one free Redis database in a region near API/database.
2. Copy TLS URL.
3. Add `REDIS_URL` to Render.
4. Application must degrade gracefully if Redis is temporarily unavailable.

## 25.4 Create Cloudflare R2

1. Create `pbg-media-prod` bucket.
2. Create least-privilege API token.
3. Configure CORS for approved origins.
4. Configure `media.pbgearbag.com` when ready.
5. Never expose R2 credentials to clients.

## 25.5 Deploy API to Render

Suggested settings:

```text
Root directory: backend
Build command: npm ci && npm run build
Start command: npm run migration:run && npm run start:prod
Health path: /health/ready
Node version: supported current LTS selected by repository .nvmrc
```

A safer deployment uses a release/predeploy command for migrations if the host supports it, rather than running migrations on every horizontally scaled process start.

Create `render.yaml` after validating current Render schema. Set secrets through dashboard, not YAML.

## 25.6 Deploy web/PWA to Cloudflare Pages

Use Expo static web export for V1:

```bash
cd mobile
npm ci
npx expo export --platform web
```

Configure the output directory generated by the installed Expo version, usually `dist`.

Set:

```dotenv
EXPO_PUBLIC_API_URL=https://api.pbgearbag.com/api/v1
EXPO_PUBLIC_ENV=production
```

Add custom domains:

- `pbgearbag.com`
- `www.pbgearbag.com` redirect

Add SPA fallback routing. Verify direct navigation to every public route.

## 25.7 DNS

At Cloudflare:

- apex to Pages project
- `www` redirect to apex
- `api` CNAME to Render-provided host
- `media` to R2 custom domain
- SPF/DKIM/DMARC for transactional email

## 25.8 Native builds

After PWA beta proves retention:

- update Expo to a currently supported SDK in a dedicated migration PR
- configure EAS project
- build Android/iOS using free monthly build allowance where available
- distribute internal previews
- public store launch only after developer-account fees and policy requirements are accepted

---

# 26. CI/CD workflow

Pull request workflow:

```text
checkout
setup Node LTS
npm ci
lint
format check
type check
unit tests
integration tests with temporary Postgres service
build backend
build/export web
validate migrations
upload test artifacts
```

Main branch workflow:

- repeat all checks
- deploy preview or production according to branch/tag policy
- run smoke tests
- notify maintainers on failure

Never deploy a failed test build.

---

# 27. Release roadmap

## Sprint 0: Correct and stabilize

- secrets cleanup
- PostgreSQL migration
- migration framework
- API response/error standards
- health checks
- CI
- logging/request IDs
- RBAC foundation
- audit foundation
- media upload intent foundation
- design tokens

Exit gate: existing auth/profile/marketplace flows work against PostgreSQL in local and preview environments.

## Sprint 1: Identity and onboarding

- account lifecycle
- email verification/reset
- sessions and refresh rotation
- profiles
- play styles/interests
- privacy
- onboarding
- public player profile

## Sprint 2: Gearbag

- gear taxonomy
- gearbag CRUD
- gear item media
- loadout basics
- public/private visibility
- create-listing-from-item

## Sprint 3: Marketplace trust

- listing lifecycle
- favorites
- offers
- listing conversations
- status history
- reports
- outcome confirmation
- reviews
- safety copy

## Sprint 4: Fields and organizations

- organization model
- field discovery
- field details
- suggestion/claim workflow
- organization management
- reviews

## Sprint 5: Events

- event CRUD/lifecycle
- field association
- discovery/filtering
- RSVP
- reminders
- cancellation updates

## Sprint 6: Teams

- team profiles
- roster roles
- invites/applications
- recruiting
- event links
- announcements

## Sprint 7: Unified discovery and notifications

- Postgres search
- search UX
- recommendation-lite rules
- in-app notification center
- transactional email
- push preparation

## Sprint 8: Moderation, admin, and launch hardening

- complete report queue
- admin controls
- feature flags
- rate limits
- backups/export procedures
- accessibility review
- performance review
- security review
- legal pages
- launch analytics

---

# 28. V1 launch gates

Do not launch publicly until all are true:

## Product

- registration and onboarding complete
- public profile complete
- gearbag complete
- listing creation/discovery/message flow complete
- fields and events have seed coverage in launch geography
- teams can create profiles and recruit
- notification center works

## Trust

- report/block flows work
- admin queue works
- marketplace safety guidance visible
- moderation policy published
- privacy and terms published
- organization claim process works

## Engineering

- migrations reproducible from empty database
- no production secrets in Git history without rotation
- backups/export tested
- critical E2E tests passing
- error monitoring enabled
- health checks enabled
- rate limits enabled
- upload limits enabled
- dependency vulnerabilities reviewed

## UX

- keyboard navigation tested
- screen readers tested on critical flows
- mobile web tested on current Safari and Chrome
- slow-network behavior tested
- empty states contain useful next actions
- no dead-end navigation

## Operations

- incident runbook
- moderation escalation runbook
- data export/deletion process
- provider quota alerts
- status page or status notice process
- support email monitored

---

# 29. Seed and launch strategy

A community platform with empty pages feels haunted. Seed useful public data before inviting users.

1. Launch in one concentrated region first, such as Chicagoland/Midwest.
2. Add verified public information for fields and major events with attribution.
3. Invite field owners to claim pages.
4. Recruit 10–25 teams.
5. Recruit trusted sellers and creators.
6. Publish beginner guides and marketplace safety content.
7. Create founder badges that do not imply artificial reputation.
8. Avoid fake profiles, fake reviews, fake attendance, and fake marketplace activity.

Core activation metrics:

- onboarding completion
- profile completion
- first gear item added
- first listing viewed/favorited
- first message
- first event RSVP
- first team join/application
- seven-day return rate

---

# 30. Deferred features

Do not allow these to delay V1:

- integrated marketplace checkout/escrow
- livestreaming
- long-form course platform
- advanced tournament brackets/scoring
- national ranking engine
- ad marketplace
- AI gear valuations
- voice/video calls
- full manufacturer product catalog ingestion
- native store release
- microservices
- Kubernetes
- Elasticsearch

Design clean extension points, then leave the dragons asleep.

---

# 31. Definition of done

A feature is done only when:

- acceptance criteria pass
- permissions and ownership are enforced server-side
- schema migration exists
- API is documented
- analytics event exists where appropriate
- audit event exists where appropriate
- loading/empty/error/offline states exist
- accessibility is tested
- unit/integration/E2E coverage is added according to risk
- logs contain request id and useful context without sensitive data
- documentation is updated
- rollback path is known
- preview deployment is reviewed

---

# 32. First developer assignment

Open a single epic named:

**PBG-V1-000: Foundation Correction and Free Deployment**

Create child tickets in this order:

1. Remove and rotate committed secrets.
2. Add `.nvmrc` and pin a current supported Node LTS after dependency compatibility testing.
3. Upgrade dependencies only enough to remove unsupported/security-critical versions; do not combine a major Expo upgrade with database migration in one PR.
4. Convert backend MySQL configuration to PostgreSQL.
5. Create baseline migrations and seed reference taxonomies.
6. Implement global validation, response interceptor, exception filter, request IDs, and structured logs.
7. Implement health/readiness endpoints.
8. Implement roles, permissions, policy helpers, and ownership guards.
9. Implement session table and rotating refresh tokens.
10. Implement media upload intents for R2.
11. Add GitHub Actions.
12. Provision Neon, Upstash, R2, Render, and Cloudflare Pages preview environments.
13. Deploy existing working flows.
14. Run smoke tests and document gaps.
15. Begin Sprint 1 only after the foundation exit gate is signed off.

The developer must provide a completion report containing:

- changed architecture
- migrations added
- endpoints added/changed
- environment variables required
- tests run and results
- preview URLs
- unresolved risks
- recommended next ticket

---

# 33. Non-negotiable product rules

1. No user should need to understand paintball jargon to join.
2. Every paintball format is first-class. Speedball is not the default center of the universe.
3. Businesses and fields are participants, not ad inventory.
4. Marketplace trust outranks listing volume.
5. Exact personal location is private by default.
6. Minors require stronger privacy and safety defaults.
7. Reputation must be explainable and contestable.
8. No fake engagement.
9. No paid suppression of legitimate reviews.
10. The platform must preserve history without making private behavior public.
11. Free infrastructure is a launch constraint, not a fantasy of infinite scale.
12. Upgrade infrastructure when real usage proves the need.

---

# 34. Final instruction

Build the smallest coherent PBGearbag that makes the sport easier to enter, safer to trade within, and richer to participate in. Preserve the existing code that works. Replace contradictions with explicit architecture. Ship the PWA first. Measure actual use. Then widen the platform one reliable domain at a time.

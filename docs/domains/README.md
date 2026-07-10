# PBGearbag Core Domains

Required bounded domains are authentication, users, players, teams, fields, marketplace, businesses, manufacturers, events, media, learning, messaging, notifications, reviews, gearbag, achievements, badges, analytics, admin, and search.

Every domain must include:
- Purpose
- Dependencies
- API
- Database
- Permissions
- Acceptance Criteria
- Future Expansion

Existing production modules remain in place while new modules are added under `backend/src/domains` until their implementation is promoted into production routes.

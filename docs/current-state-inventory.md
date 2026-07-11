# PBGearbag current-state inventory

Audited 2026-07-10 against the imported repository baseline.

| Area | State | Evidence / limitation |
| --- | --- | --- |
| Authentication | Partial implementation | Registration, login, JWT, refresh, logout; refresh token is still user-scoped rather than per-device. |
| User profiles | Implemented baseline | Read, update, avatar/banner upload, and user search. |
| Marketplace | Implemented baseline | Listing CRUD, ownership checks, filters, image upload, and sold status. Trust workflows are absent. |
| Mobile/PWA | Implemented baseline | Auth, profile, marketplace feed/detail/create/my-listings screens. |
| Shared contracts | Partial implementation | User, team, and marketplace types; no runtime schemas. |
| Teams | Placeholder | Empty NestJS module and shared types only. |
| Events | Placeholder | Empty NestJS module. |
| Social | Placeholder | Empty NestJS module. |
| Rankings | Placeholder | Empty NestJS module. |
| Brands | Placeholder | Empty NestJS module. |
| Streaming | Placeholder and out of V1 scope | Empty NestJS module; must not be expanded in V1. |
| PostgreSQL | Foundation corrected | PostgreSQL-only TypeORM configuration and initial migration. |
| Operations | Foundation baseline | Request IDs, stable error envelope, liveness/readiness endpoints, and CI. |

## Immediate risks

Per-device refresh sessions and RBAC are not yet implemented. API entities are also returned directly in several controllers and must be mapped to response DTOs before the foundation exit gate. Cloud previews require owner-controlled provider accounts and secrets.

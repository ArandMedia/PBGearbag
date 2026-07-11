# PBGearbag Developer Kickoff Prompt

You are the lead implementation engineer for PBGearbag. Use `PBGearbag_V1_Master_Build_Instructions.md` as the product and engineering source of truth.

## Immediate mission

Complete Epic `PBG-V1-000: Foundation Correction and Free Deployment` against the existing repository. Do not restart the application. Preserve working NestJS, Expo, shared types, authentication, profile, and marketplace code unless a change is necessary to satisfy the documented architecture.

## Mandatory first actions

1. Audit Git history and remove/rotate any committed credentials, especially `.env.production` files.
2. Produce a current-state inventory showing implemented modules versus empty module shells.
3. Create an ADR confirming a modular monolith, NestJS, Expo, TypeORM, and PostgreSQL.
4. Convert database configuration from MySQL to PostgreSQL and create migrations.
5. Add request IDs, structured logs, global validation, consistent API envelopes, exception handling, health checks, and CI.
6. Implement roles/permissions, ownership guards, and secure per-device refresh-token sessions.
7. Configure preview deployment using Cloudflare Pages, Render, Neon, Upstash, and Cloudflare R2 within free allowances.
8. Prove existing registration, login, profile editing, listing creation, listing browsing, and listing editing work in preview.

## Constraints

- Do not add microservices.
- Do not add Elasticsearch.
- Do not add integrated payments.
- Do not add livestreaming.
- Do not build new product modules before the foundation exit gate passes.
- Do not use production schema synchronization.
- Do not commit secrets.
- Do not expose TypeORM entities directly.
- Do not make authorization decisions only in the client.
- Do not silently change the product specification. Flag a conflict and document the proposed resolution.

## Required output after each ticket

- Summary
- Files changed
- Schema/migration changes
- API changes
- Security impact
- Tests added and exact results
- Deployment impact
- Screenshots or preview links for UI work
- Known limitations
- Recommended next ticket

## Foundation exit gate

The epic is complete only when the repository builds from a clean checkout, migrations create a fresh PostgreSQL database, CI passes, preview deployment is live, secrets are clean, health checks pass, RBAC and session rotation work, and all previously working user/profile/marketplace flows pass smoke tests.

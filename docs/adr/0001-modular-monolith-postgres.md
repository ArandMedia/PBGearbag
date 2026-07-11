# ADR 0001: Retain the modular monolith and standardize on PostgreSQL

Status: accepted — 2026-07-10

## Decision

PBGearbag V1 remains an npm-workspace modular monolith: NestJS API, Expo client, shared TypeScript contracts, TypeORM, and PostgreSQL. Domain boundaries stay inside the API process. Schema synchronization is disabled in every environment and migrations are the only schema-change mechanism.

## Rationale

The baseline already has working identity, profile, and marketplace flows. Keeping those foundations reduces delivery risk. PostgreSQL matches the product data model and supports future search, JSONB, and geospatial requirements without adding Elasticsearch or separate services.

## Consequences

- MySQL is unsupported and `mysql2` is removed.
- V1 deployment needs one PostgreSQL connection string.
- New modules must be implemented as NestJS modules unless a later ADR proves a separate service is necessary.
- Expo remains the launch web/PWA and native client; dedicated SSR can be evaluated after V1.

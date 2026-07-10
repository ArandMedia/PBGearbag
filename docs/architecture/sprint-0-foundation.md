# PBGearbag Core Sprint 0 Foundation

## Purpose
PBGearbag Core is the production foundation for the paintball operating system. It preserves existing authentication, API, marketplace, events, teams, Docker, and shared types while introducing the architectural seams required for future domains.

## Domain Rules
Each bounded domain owns controllers, services, DTOs, models, validation, tests, and documentation. Domains must use public services or contracts instead of manipulating another domain's internals.

## Platform Services
- Notification Service: single notification engine for marketplace, messages, teams, events, reviews, achievements, and admin.
- Permission Service: centralized RBAC/authorization decisions.
- Audit Logging: critical action records for authentication, marketplace, admin, moderation, reports, purchases, and listing edits.
- Feature Flags: environment-controlled feature rollout without deployment.
- Media Service: shared upload registration and future thumbnail, optimization, storage, and video processing.
- Search Service: implementation-neutral abstraction compatible with Meilisearch or Elasticsearch.

## API Standards
All APIs use a `{ success, data }` success envelope and a consistent `{ success, error, path, timestamp }` error envelope. Global validation remains enabled with whitelist and transform behavior.

## Pull Request Readiness Questions
Every PR must answer:
1. What problem does this solve?
2. Why is this the chosen solution instead of alternatives?
3. Does it reuse existing platform services?
4. Does it introduce technical debt?
5. How will this scale to 1 million users?
6. What tests were added?
7. What documentation was updated?
8. What future features does this enable?

# Reviews Domain

## Purpose
Owns reviews platform capabilities within PBGearbag Core.

## Dependencies
Uses shared platform services for permissions, notifications, audit logging, feature flags, media, and search.

## API
Domain APIs must use standardized PBGearbag Core responses.

## Database
Domain models and migrations belong to this bounded context.

## Permissions
All authorization must go through the centralized Permission Service.

## Acceptance Criteria
- Controllers, services, DTOs, models, validation, tests, and docs remain domain-owned.
- No direct manipulation of another domain's internals.

## Future Expansion
Designed for independent expansion without restructuring other domains.

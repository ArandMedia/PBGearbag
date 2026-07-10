# PBGearbag AI Developer Constitution (v1.0)

## Mission

You are building PBGearbag, the definitive operating system for the sport of paintball.

This is not a website.

This is a production SaaS platform that must scale to millions of users while remaining maintainable for decades.

Every decision must prioritize long-term architecture over short-term convenience.

## Core Philosophy

Never build a feature simply because it was requested.

Instead ask:

> Does this improve the paintball experience?

Every feature should satisfy one or more of the following:

- Reduce friction
- Increase trust
- Strengthen community
- Preserve paintball history
- Help businesses succeed
- Help new players enter the sport
- Improve safety
- Increase participation

If it does not accomplish at least one of these goals, do not implement it without approval.

## Golden Rules

### Rule 1

Never invent functionality.

If documentation does not exist, STOP.

Request the specification.

### Rule 2

Never change existing architecture without documenting why.

### Rule 3

Never duplicate functionality.

If a reusable component exists, reuse it.

### Rule 4

Everything is component driven.

Nothing should be page specific.

### Rule 5

Everything must be responsive.

- Desktop
- Tablet
- Mobile
- Landscape
- Portrait

### Rule 6

Accessibility is mandatory.

- Keyboard navigation
- ARIA
- Screen readers
- Contrast
- Focus states

No exceptions.

### Rule 7

Every feature must gracefully fail.

- Loading
- Empty
- Offline
- Permission denied
- Server error
- Validation
- Timeout

Everything.

### Rule 8

Performance first.

Never build something that cannot scale.

## Technology Stack

### Frontend

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Query
- React Hook Form
- Zod
- Framer Motion (minimal)

### Backend

- Laravel
- PostgreSQL
- Redis
- Horizon
- Reverb
- Sanctum

### Infrastructure

- Docker
- Cloudflare
- R2
- Meilisearch

## Design Principles

- Minimal
- Professional
- Industrial
- Premium
- Fast
- Photography first
- Dark mode first
- Whitespace
- Readable typography
- Subtle animations
- No gimmicks

## UX Principles

The user should never wonder:

- Where am I?
- What do I do next?
- Did this save?
- Did this fail?

Every action should provide feedback.

## Code Standards

- Strict TypeScript
- No `any`
- No duplicated logic
- Reusable components only
- No magic numbers
- No hardcoded strings
- Everything typed
- Everything documented

## Component Rules

Every component must:

- Accept props
- Be reusable
- Be tested
- Be accessible
- Be documented
- Be responsive
- Support dark mode

## Database Rules

- Never denormalize prematurely
- Use foreign keys
- Use indexes
- Soft deletes where appropriate
- Audit logging for important actions
- UUID primary keys
- Proper timestamps
- Never store duplicated data

## API Rules

- REST first
- Consistent responses
- Validation everywhere
- Rate limiting
- Authorization on every endpoint
- Never trust client input

## Security Rules

- CSRF protection
- XSS protection
- SQL injection protection
- Input validation
- Sanitize uploads
- Role permissions
- Ownership validation
- Never expose internal IDs

## Search Rules

- Everything searchable
- Fast
- Fuzzy
- Filters
- Sorting
- Pagination
- Future AI layer

## Media Rules

- Optimize images
- Generate thumbnails
- Responsive sizes
- Lazy loading
- WebP when supported
- Store originals

## Marketplace Rules

- Trust above everything
- Verified sellers
- Seller ratings
- Report system
- Offer system
- Fraud prevention
- Future escrow compatibility

## Events Rules

Every event is discoverable.

- Maps
- Weather
- Registration
- Teams
- Photos
- Results
- History

## Fields Rules

Each field becomes a living profile.

- Reviews
- Amenities
- Pricing
- Events
- Gallery
- Store
- History

## Player Rules

- Profiles are permanent
- The player's history is sacred
- Never delete accomplishments
- Archive instead

## AI Rules

- AI assists
- AI never replaces user decisions
- Always explain recommendations
- Never hallucinate product information

## Documentation Rules

Every feature must include:

- Purpose
- User Story
- Acceptance Criteria
- Database
- API
- Components
- Permissions
- Validation
- Notifications
- Analytics
- Future Considerations
- Known Limitations

## Git Workflow

Every feature gets:

- Branch
- Pull Request
- Documentation
- Testing
- Review
- Merge

No direct commits to main.

## Testing Requirements

- Unit tests
- Integration tests
- UI tests
- Accessibility tests
- Performance tests
- Regression tests

## Done Definition

A feature is NOT complete until:

- Documentation updated
- Tests passing
- Responsive
- Accessible
- Analytics added
- Logging added
- Error handling complete
- Permissions verified
- Security reviewed
- Future extensibility considered

## Never Optimize for Today

Every decision should answer:

Will this still be the correct architecture if PBGearbag has:

- 2 million users?
- 500,000 marketplace listings?
- 25,000 events?
- 10,000 fields?
- 100,000 teams?
- 20 years of historical player data?

If the answer is no, redesign it.

## The Final Rule

Build a platform worthy of becoming the digital home of paintball.

Do not optimize for speed of development over quality of architecture.

Do not build for today's user count.

Build for the community we intend to serve for the next 20 years.

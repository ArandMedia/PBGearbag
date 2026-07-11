# System Architecture

## Overview

The Paintball Community App follows a modern, scalable microservices-inspired architecture with a mobile-first approach.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Mobile Apps                              │
│              (iOS & Android - React Native)                  │
└────────────┬────────────────────────────────────────────────┘
             │
             │ HTTPS/WSS
             │
┌────────────▼────────────────────────────────────────────────┐
│                    API Gateway / Load Balancer              │
└────────────┬────────────────────────────────────────────────┘
             │
             │
    ┌────────┴────────┬──────────────┬──────────────┐
    │                 │              │              │
┌───▼────┐   ┌───────▼──────┐  ┌───▼─────┐  ┌────▼──────┐
│  Auth  │   │   REST API   │  │GraphQL  │  │ WebSocket │
│Service │   │   (NestJS)   │  │   API   │  │  Server   │
└───┬────┘   └───────┬──────┘  └───┬─────┘  └────┬──────┘
    │                │              │              │
    └────────────────┴──────┬───────┴──────────────┘
                            │
                   ┌────────▼────────┐
                   │   Core Services  │
                   │                  │
                   │ • Users          │
                   │ • Teams          │
                   │ • Marketplace    │
                   │ • Events         │
                   │ • Social         │
                   │ • Rankings       │
                   │ • Brands         │
                   └────────┬─────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
   ┌────▼─────┐      ┌─────▼──────┐     ┌─────▼──────┐
   │PostgreSQL│      │   Redis    │     │Elasticsearch│
   │ (Primary)│      │  (Cache)   │     │  (Search)   │
   └──────────┘      └────────────┘     └────────────┘
```

## Key Components

### 1. Mobile Application Layer

**Technology**: React Native with Expo

**Responsibilities**:
- User interface and experience
- Local state management
- API communication
- Push notification handling
- Media capture and playback
- Offline functionality (limited)

**Key Features**:
- Cross-platform (iOS & Android)
- Hot reloading for rapid development
- Native performance for critical features
- Responsive design for tablets

### 2. API Gateway & Load Balancer

**Technology**: NGINX / AWS ALB / Cloudflare

**Responsibilities**:
- Route requests to appropriate services
- SSL/TLS termination
- Rate limiting and DDoS protection
- Request/response transformation
- Load balancing across service instances

### 3. Backend Services

#### Authentication Service
- User registration and login
- JWT token generation and validation
- OAuth integration (Google, Apple, Facebook)
- Password reset and email verification
- Session management

#### User Service
- Profile management
- User preferences and settings
- Player statistics and achievements
- Privacy controls
- Blocking and reporting

#### Team Service
- Team creation and management
- Roster management
- Team communication (integrated with messaging)
- Rankings and statistics
- Recruitment and invitations

#### Marketplace Service
- Listing creation, editing, deletion
- Search and filtering
- Category management
- Image upload and processing
- Transaction handling (with Stripe)
- Buyer/seller ratings and reviews
- Fraud detection

#### Event Service
- Event creation and management
- Registration and ticketing
- Bracket generation and management
- Scheduling and calendar
- Check-in and attendance
- Collaboration with co-organizers
- Waiver management

#### Social Service
- Posts and activity feed
- Comments and reactions
- Following and followers
- Communities (speedball, recball, etc.)
- Content moderation
- Hashtags and mentions

#### Streaming Service
- Live stream ingestion
- Stream distribution
- VOD encoding and storage
- Playback authentication
- Chat and real-time interactions
- Analytics and viewer statistics

#### Rankings Service
- Player rankings calculation
- Tournament results processing
- Division management
- Leaderboards
- Historical statistics

#### Brand Partnership Service
- Brand profiles and verification
- Sponsored content management
- Advertising campaigns
- Analytics and reporting
- Sponsorship matching

#### Notification Service
- Push notifications
- Email notifications
- In-app notifications
- Notification preferences
- Real-time delivery via WebSocket

### 4. Data Layer

#### PostgreSQL (Primary Database)
**Schema Design**:

```sql
-- Users
users: id, email, username, password_hash, profile_data, created_at

-- Teams
teams: id, name, division, region, logo_url, created_at
team_members: id, team_id, user_id, role, joined_at

-- Marketplace
listings: id, seller_id, title, description, price, category, condition, images, status, created_at
transactions: id, listing_id, buyer_id, seller_id, amount, status, created_at
reviews: id, transaction_id, reviewer_id, rating, comment, created_at

-- Events
events: id, organizer_id, name, type, description, location, start_date, end_date, registration_fee
event_registrations: id, event_id, user_id, team_id, status, paid, created_at
brackets: id, event_id, type, teams, matches, created_at

-- Social
posts: id, user_id, content, media_urls, community_id, created_at
comments: id, post_id, user_id, content, created_at
follows: id, follower_id, following_id, created_at

-- Brands
brands: id, name, description, logo_url, verified, created_at
sponsorships: id, brand_id, team_id, status, terms, created_at

-- Rankings
rankings: id, user_id, division, points, rank, season, updated_at
```

#### Redis (Caching & Real-time)
- Session storage
- API response caching
- Real-time feed updates
- Leaderboard caching
- Rate limiting counters
- Pub/Sub for real-time features

#### Elasticsearch (Search Engine)
- Marketplace product search
- User and team search
- Event discovery
- Full-text search across content
- Fuzzy matching and autocomplete

### 5. Media & Storage

#### AWS S3 / Cloudflare R2
- User profile pictures
- Marketplace listing images
- Post media (photos, videos)
- Event banners and media
- Brand logos and assets

#### Video Streaming Infrastructure
- **Ingest**: RTMP/WebRTC for live stream input
- **Transcoding**: Multi-bitrate adaptive streaming (HLS/DASH)
- **CDN**: Global distribution for low latency
- **Storage**: VOD archive in S3

**Recommended Providers**:
- AWS IVS (Interactive Video Service)
- Mux
- Cloudflare Stream
- Custom with AWS MediaLive/MediaPackage

### 6. External Integrations

#### Payment Processing
- **Stripe**: Marketplace transactions, event registration
- **Stripe Connect**: Marketplace seller payouts
- **Subscription billing**: Premium features (future)

#### Push Notifications
- **Firebase Cloud Messaging**: iOS and Android push notifications
- **APNs**: iOS notifications (via FCM or direct)
- **FCM**: Android notifications

#### Email Service
- **SendGrid / AWS SES**: Transactional emails
- Email verification, password reset, notifications

#### Analytics
- **Mixpanel / Amplitude**: User behavior analytics
- **Google Analytics**: Mobile app analytics
- **Custom**: Business-specific metrics

## Security Architecture

### Authentication Flow
1. User registers/logs in via mobile app
2. Backend validates credentials
3. JWT token issued (short-lived access token + refresh token)
4. Access token stored securely on device (Keychain/Keystore)
5. Refresh token used to obtain new access tokens

### API Security
- HTTPS/TLS 1.3 for all communications
- JWT validation on all protected endpoints
- Rate limiting per user/IP
- Input validation and sanitization
- SQL injection prevention (ORM parameterized queries)
- XSS protection on user-generated content
- CSRF protection

### Data Privacy
- Encrypted data at rest (database encryption)
- Encrypted data in transit (TLS)
- PII data handling compliance
- User data deletion upon request
- Privacy controls (block, hide profile, etc.)

### Payment Security
- PCI DSS compliance via Stripe
- No credit card data stored in our systems
- Tokenized payment methods
- Secure checkout flow

## Scalability Strategy

### Horizontal Scaling
- Stateless API servers (scale horizontally)
- Load balancer distributes traffic
- Database read replicas for read-heavy operations
- Microservices can scale independently

### Caching Strategy
- Redis for frequently accessed data
- API response caching (CDN for static assets)
- Database query result caching
- Client-side caching for mobile app

### Database Optimization
- Indexing on frequently queried fields
- Partitioning for large tables (events, posts, transactions)
- Read replicas for analytics and reporting
- Connection pooling

### CDN Usage
- Static assets (images, videos, CSS, JS)
- Global distribution for low latency
- Reduced load on origin servers

## Monitoring & Observability

### Application Monitoring
- **Sentry**: Error tracking and reporting
- **DataDog / New Relic**: Application performance monitoring
- Custom metrics and dashboards

### Infrastructure Monitoring
- Server health and resource usage
- Database performance metrics
- API response times and error rates
- Network latency and throughput

### Logging
- Centralized logging (ELK stack or CloudWatch)
- Structured logging (JSON format)
- Log retention policies
- Audit logs for sensitive operations

## Deployment Strategy

### Environments
1. **Development**: Local development environment
2. **Staging**: Pre-production testing
3. **Production**: Live environment

### CI/CD Pipeline
1. Code push to GitHub
2. Automated tests run (unit, integration, e2e)
3. Build Docker images
4. Deploy to staging for QA
5. Manual approval for production
6. Blue-green deployment to production
7. Health checks and monitoring
8. Rollback capability if issues detected

### Mobile App Deployment
- **iOS**: TestFlight for beta, App Store for production
- **Android**: Internal testing, beta track, production on Play Store
- Over-the-air updates for minor changes (Expo Updates / CodePush)

## Disaster Recovery

### Backup Strategy
- Automated daily database backups
- Point-in-time recovery capability
- Backup retention: 30 days
- Backups stored in separate region

### High Availability
- Multi-AZ deployment for critical services
- Database replication across availability zones
- Automated failover for database
- Health checks and auto-recovery

### Incident Response
- On-call rotation for critical issues
- Incident runbooks and playbooks
- Post-mortem analysis for outages
- Regular disaster recovery drills

## Future Considerations

### Phase 2 Enhancements
- **GraphQL Federation**: Split GraphQL schema across services
- **Message Queue**: RabbitMQ/Kafka for async processing
- **Machine Learning**: Content recommendations, fraud detection
- **Mobile App**: Native modules for performance-critical features
- **Web App**: React web app for desktop users
- **Admin Dashboard**: Internal tools for moderation and analytics

### Geographic Expansion
- Multi-region deployment
- Data residency compliance (GDPR, etc.)
- Localization and internationalization

### Advanced Features
- AR features for field visualization
- AI-powered coaching and analysis
- Blockchain for tournament verification (optional)
- Gamification and achievement system

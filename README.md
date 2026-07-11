# PBGearbag

## Test the current SaaS MVP

Requirements: Node.js 20 or newer. Docker is not required.

```bash
npm install
npm run dev
```

Open `http://localhost:8081`. The first run creates a private PostgreSQL cluster under `.local/`, applies migrations, and seeds demo data.

Demo account:

- Email: `demo@pbgearbag.com`
- Password: `Paintball123!`

Testable flows include account creation, login/logout, persistent browser authentication, profile editing, marketplace browsing/search, listing creation, editing, sold state, deletion, ownership enforcement, and session rotation/revocation. API documentation is at `http://localhost:3000/api/docs`; readiness is at `http://localhost:3000/api/v1/health/ready`.

The current build is the identity/profile/marketplace SaaS core. Teams, persistent event management, messaging, notifications, reviews, reports, and administration remain later V1 modules; the static Events screen is explicitly a discovery preview.

---

# Archived baseline overview

A comprehensive social platform and marketplace for the paintball industry, connecting players, teams, organizers, and brands.

## Vision

Create a unified platform that grows the paintball sport by:
- Connecting players across all play styles (speedball, recball, beginners)
- Providing a massive marketplace for gear (Buy/Sell/Trade)
- Empowering tournament teams with dedicated collaboration spaces
- Streaming tournaments and creating entertainment value
- Facilitating brand partnerships and sponsorships
- Enabling event planning and management
- Growing the market size and community engagement

## Core Features

### 1. Social Platform
- **Multi-Style Communities**: Dedicated spaces for speedball, recball, scenario, and beginner players
- **User Profiles**: Customizable profiles with play style, experience level, and achievements
- **Activity Feed**: Posts, photos, videos, and updates from the community
- **Messaging**: Direct messages and group chats
- **Player Discovery**: Find players nearby or by skill level

### 2. Marketplace (BST - Buy/Sell/Trade)
- **Listings**: Create detailed product listings with photos and descriptions
- **Categories**: Markers, masks, tanks, loaders, apparel, accessories
- **Search & Filter**: Advanced search by brand, condition, price, location
- **Ratings & Reviews**: Seller/buyer rating system
- **Secure Transactions**: In-app payment processing and escrow
- **Shipping Integration**: Shipping label generation and tracking

### 3. Team Management
- **Team Spaces**: Private team hubs for communication and planning
- **Roster Management**: Team member roles and positions
- **Practice Scheduling**: Calendar and event planning for teams
- **Strategy Board**: Play diagrams and strategy sharing
- **Team Rankings**: Division rankings and tournament performance
- **Recruitment**: Team finder for players and teams looking for members

### 4. Tournament & Event System
- **Event Creation**: Host tournaments, practice sessions, scenario games
- **Registration**: Player and team registration with payment
- **Brackets & Scheduling**: Automated bracket generation
- **Live Scoring**: Real-time score updates
- **Event Collaboration**: Co-host with other organizers
- **Attendee Management**: Check-in, waivers, communication

### 5. Live Streaming & Entertainment
- **Tournament Streaming**: Live video streaming from events
- **VOD Library**: Video on demand for past tournaments
- **Commentary & Analysis**: Multi-camera angles and professional commentary
- **Highlights**: Automated highlight reels and clips
- **Watch Parties**: Community viewing experiences

### 6. Brand Partnerships
- **Sponsored Content**: Featured posts and product showcases
- **Brand Profiles**: Official brand pages with products and updates
- **Team Sponsorships**: Connect brands with teams
- **Advertising Platform**: Targeted ads to relevant audiences
- **Analytics Dashboard**: Engagement metrics for brands

### 7. Player Rankings & Stats
- **Personal Rankings**: Tournament performance and division rankings
- **Statistics**: Win/loss records, tournament history
- **Achievements**: Badges and milestones
- **Leaderboards**: Regional and national rankings

## Technology Stack

### Mobile Application
- **Framework**: React Native with Expo
- **Language**: TypeScript
- **State Management**: Redux Toolkit / Zustand
- **Navigation**: React Navigation
- **UI Components**: React Native Paper / NativeBase
- **Forms**: React Hook Form
- **API Client**: Axios / React Query

### Backend
- **Runtime**: Node.js
- **Framework**: NestJS (scalable, modular architecture)
- **Language**: TypeScript
- **API**: RESTful + GraphQL
- **Real-time**: Socket.io / WebSockets
- **Authentication**: JWT + OAuth 2.0

### Database
- **Primary DB**: PostgreSQL
- **ORM**: Prisma / TypeORM
- **Cache**: Redis
- **Search**: Elasticsearch (for marketplace and user search)

### Media & Storage
- **File Storage**: AWS S3 / Cloudflare R2
- **CDN**: CloudFront / Cloudflare CDN
- **Image Processing**: Sharp / ImageMagick
- **Video Streaming**: AWS IVS / Mux / Cloudflare Stream

### Infrastructure
- **Hosting**: AWS / Google Cloud / Digital Ocean
- **Container**: Docker
- **Orchestration**: Kubernetes (for scale)
- **CI/CD**: GitHub Actions
- **Monitoring**: DataDog / Sentry

### Payment Processing
- **Provider**: Stripe
- **Features**: Marketplace payments, event registration, subscriptions

### Push Notifications
- **Service**: Firebase Cloud Messaging
- **Use Cases**: Messages, event updates, marketplace activity

## Project Structure

```
paintball-community-app/
├── mobile/                  # React Native mobile app
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── screens/        # App screens
│   │   ├── navigation/     # Navigation configuration
│   │   ├── services/       # API services
│   │   ├── store/          # State management
│   │   ├── hooks/          # Custom React hooks
│   │   ├── utils/          # Utility functions
│   │   └── types/          # TypeScript types
│   ├── assets/             # Images, fonts, etc.
│   └── package.json
├── backend/                # NestJS backend API
│   ├── src/
│   │   ├── auth/           # Authentication module
│   │   ├── users/          # User management
│   │   ├── teams/          # Team features
│   │   ├── marketplace/    # BST marketplace
│   │   ├── events/         # Event management
│   │   ├── streaming/      # Video streaming
│   │   ├── social/         # Social features
│   │   ├── rankings/       # Player rankings
│   │   ├── brands/         # Brand partnerships
│   │   └── common/         # Shared utilities
│   └── package.json
├── database/               # Database schemas and migrations
│   ├── migrations/
│   └── seeds/
├── shared/                 # Shared code between mobile and backend
│   └── types/              # Shared TypeScript types
├── docs/                   # Documentation
│   ├── api/               # API documentation
│   ├── architecture/      # System architecture
│   └── user-guides/       # User documentation
└── infrastructure/         # DevOps and infrastructure
    ├── docker/
    ├── kubernetes/
    └── terraform/
```

## Development Phases

### Phase 1: Foundation (Months 1-2)
- Project setup and infrastructure
- Authentication and user profiles
- Basic social features (posts, comments)
- Mobile app navigation and core UI

### Phase 2: Marketplace (Months 3-4)
- Marketplace listing creation
- Search and filtering
- Payment integration
- Rating system

### Phase 3: Team Features (Month 5)
- Team creation and management
- Team communication
- Rankings integration

### Phase 4: Events (Month 6)
- Event creation and management
- Registration and payments
- Scheduling and brackets

### Phase 5: Streaming (Months 7-8)
- Video streaming infrastructure
- Live tournament broadcasts
- VOD library

### Phase 6: Brand Partnerships (Month 9)
- Brand profiles and sponsored content
- Advertising platform
- Analytics dashboard

### Phase 7: Polish & Launch (Months 10-12)
- Performance optimization
- Beta testing
- Marketing and community building
- App store submission

## Getting Started

(To be updated once development begins)

## Contributing

(To be updated)

## License

(To be determined)

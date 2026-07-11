# Database Schema

## Overview

This document describes the PostgreSQL database schema for the Paintball Community App.

## Entity Relationship Diagram

```
Users ──┬─── Posts
        ├─── Comments
        ├─── TeamMembers ─── Teams
        ├─── EventRegistrations ─── Events
        ├─── Listings (as seller)
        ├─── Transactions (as buyer/seller)
        ├─── Rankings
        ├─── Follows
        └─── BrandSponsors

Teams ──┬─── TeamMembers
        ├─── EventRegistrations
        ├─── Sponsorships
        └─── Rankings

Events ──┬─── EventRegistrations
         ├─── Brackets
         └─── Streams

Listings ─── Transactions ─── Reviews

Brands ─── Sponsorships
       └─── SponsoredContent
```

## Tables

### Users

Core user information and authentication.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,

    -- Profile Information
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    display_name VARCHAR(100),
    bio TEXT,
    avatar_url VARCHAR(500),
    banner_url VARCHAR(500),

    -- Location
    country VARCHAR(100),
    state_province VARCHAR(100),
    city VARCHAR(100),

    -- Paintball Profile
    play_style VARCHAR(50)[], -- ['speedball', 'recball', 'scenario', 'magfed']
    skill_level VARCHAR(20), -- 'beginner', 'intermediate', 'advanced', 'pro'
    home_field VARCHAR(200),
    favorite_position VARCHAR(50),

    -- Settings
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    privacy_settings JSONB DEFAULT '{}',
    notification_settings JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE,

    -- Indexes
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
```

### Teams

Team information for tournament and recreational play.

```sql
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,

    -- Team Info
    description TEXT,
    logo_url VARCHAR(500),
    banner_url VARCHAR(500),

    -- Classification
    division VARCHAR(50), -- 'D1', 'D2', 'D3', 'D4', 'D5', 'Open', 'Amateur'
    team_type VARCHAR(50), -- 'tournament', 'recreational', 'scenario'
    region VARCHAR(100),

    -- Contact
    email VARCHAR(255),
    website_url VARCHAR(500),
    social_links JSONB DEFAULT '{}',

    -- Settings
    is_recruiting BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_teams_division ON teams(division);
CREATE INDEX idx_teams_region ON teams(region);
CREATE INDEX idx_teams_created_at ON teams(created_at);
```

### Team Members

Relationship between users and teams.

```sql
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Role
    role VARCHAR(50) NOT NULL, -- 'owner', 'captain', 'co-captain', 'member', 'substitute'
    position VARCHAR(50), -- 'front', 'mid', 'back', 'snake', 'dorito'
    jersey_number INTEGER,

    -- Status
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'pending'

    -- Timestamps
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT unique_user_team UNIQUE(team_id, user_id)
);

CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
```

### Events

All types of paintball events (tournaments, practices, scenarios).

```sql
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id UUID NOT NULL REFERENCES users(id),

    -- Event Details
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    description TEXT,
    event_type VARCHAR(50) NOT NULL, -- 'tournament', 'practice', 'scenario', 'training'

    -- Format
    format VARCHAR(50), -- '3-man', '5-man', '7-man', '10-man', 'xball', 'race-to'
    division VARCHAR(50)[],

    -- Location
    venue_name VARCHAR(200),
    address TEXT,
    city VARCHAR(100),
    state_province VARCHAR(100),
    country VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),

    -- Timing
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    registration_deadline TIMESTAMP WITH TIME ZONE,

    -- Registration
    registration_fee DECIMAL(10, 2) DEFAULT 0,
    max_teams INTEGER,
    max_players INTEGER,

    -- Media
    banner_url VARCHAR(500),
    images JSONB DEFAULT '[]',

    -- Status
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'published', 'registration_open', 'in_progress', 'completed', 'cancelled'

    -- Settings
    requires_waiver BOOLEAN DEFAULT TRUE,
    is_public BOOLEAN DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_events_organizer_id ON events(organizer_id);
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_location ON events(city, state_province, country);
```

### Event Registrations

Team and individual registrations for events.

```sql
CREATE TABLE event_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,

    -- Registrant (either user or team)
    user_id UUID REFERENCES users(id),
    team_id UUID REFERENCES teams(id),

    -- Registration Details
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'confirmed', 'cancelled', 'waitlist'

    -- Payment
    payment_status VARCHAR(20) DEFAULT 'unpaid', -- 'unpaid', 'paid', 'refunded'
    payment_amount DECIMAL(10, 2),
    payment_id VARCHAR(255),

    -- Additional Info
    roster JSONB DEFAULT '[]', -- For team registrations
    waiver_signed BOOLEAN DEFAULT FALSE,
    waiver_signed_at TIMESTAMP WITH TIME ZONE,
    emergency_contact JSONB,

    -- Timestamps
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT either_user_or_team CHECK (
        (user_id IS NOT NULL AND team_id IS NULL) OR
        (user_id IS NULL AND team_id IS NOT NULL)
    )
);

CREATE INDEX idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX idx_event_registrations_user_id ON event_registrations(user_id);
CREATE INDEX idx_event_registrations_team_id ON event_registrations(team_id);
```

### Marketplace Listings

Buy/Sell/Trade listings for paintball gear.

```sql
CREATE TABLE listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES users(id),

    -- Listing Details
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'marker', 'mask', 'tank', 'loader', 'apparel', 'accessory', 'complete_setup'
    subcategory VARCHAR(50),

    -- Product Details
    brand VARCHAR(100),
    model VARCHAR(100),
    year INTEGER,
    condition VARCHAR(20) NOT NULL, -- 'new', 'like_new', 'excellent', 'good', 'fair', 'parts'

    -- Pricing
    price DECIMAL(10, 2) NOT NULL,
    original_price DECIMAL(10, 2),
    is_negotiable BOOLEAN DEFAULT TRUE,
    accepts_trades BOOLEAN DEFAULT FALSE,

    -- Media
    images JSONB NOT NULL DEFAULT '[]',
    videos JSONB DEFAULT '[]',

    -- Location
    city VARCHAR(100),
    state_province VARCHAR(100),
    country VARCHAR(100),
    shipping_available BOOLEAN DEFAULT TRUE,
    local_pickup BOOLEAN DEFAULT TRUE,

    -- Status
    status VARCHAR(20) DEFAULT 'active', -- 'draft', 'active', 'pending', 'sold', 'removed'

    -- Visibility
    views INTEGER DEFAULT 0,
    favorites INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sold_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_listings_seller_id ON listings(seller_id);
CREATE INDEX idx_listings_category ON listings(category);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_price ON listings(price);
CREATE INDEX idx_listings_created_at ON listings(created_at DESC);
CREATE INDEX idx_listings_location ON listings(country, state_province, city);
```

### Transactions

Marketplace transactions between buyers and sellers.

```sql
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES listings(id),
    buyer_id UUID NOT NULL REFERENCES users(id),
    seller_id UUID NOT NULL REFERENCES users(id),

    -- Transaction Details
    amount DECIMAL(10, 2) NOT NULL,
    shipping_cost DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,

    -- Payment
    payment_intent_id VARCHAR(255),
    payment_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'refunded'

    -- Shipping
    shipping_address JSONB,
    tracking_number VARCHAR(100),
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,

    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid', 'shipped', 'delivered', 'completed', 'disputed', 'cancelled'

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_transactions_listing_id ON transactions(listing_id);
CREATE INDEX idx_transactions_buyer_id ON transactions(buyer_id);
CREATE INDEX idx_transactions_seller_id ON transactions(seller_id);
CREATE INDEX idx_transactions_status ON transactions(status);
```

### Reviews

Buyer and seller reviews for marketplace transactions.

```sql
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transactions(id),
    reviewer_id UUID NOT NULL REFERENCES users(id),
    reviewee_id UUID NOT NULL REFERENCES users(id),

    -- Review Content
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,

    -- Review Type
    review_type VARCHAR(10) NOT NULL, -- 'buyer', 'seller'

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_review UNIQUE(transaction_id, reviewer_id)
);

CREATE INDEX idx_reviews_reviewee_id ON reviews(reviewee_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
```

### Posts

Social feed posts.

```sql
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Content
    content TEXT,
    media_urls JSONB DEFAULT '[]',

    -- Classification
    community_id UUID, -- Reference to community/group
    post_type VARCHAR(20) DEFAULT 'general', -- 'general', 'event', 'marketplace', 'team'

    -- Engagement
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,

    -- Visibility
    visibility VARCHAR(20) DEFAULT 'public', -- 'public', 'friends', 'private'

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_community_id ON posts(community_id);
```

### Comments

Comments on posts.

```sql
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,

    -- Content
    content TEXT NOT NULL,

    -- Engagement
    likes_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_comment_id);
```

### Follows

User follow relationships.

```sql
CREATE TABLE follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_follow UNIQUE(follower_id, following_id),
    CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_following_id ON follows(following_id);
```

### Rankings

Player rankings and statistics.

```sql
CREATE TABLE rankings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,

    -- Classification
    division VARCHAR(50) NOT NULL,
    region VARCHAR(100),
    season VARCHAR(20), -- '2024-spring', '2024-summer', etc.

    -- Ranking
    points INTEGER DEFAULT 0,
    rank INTEGER,
    previous_rank INTEGER,

    -- Statistics
    tournaments_played INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    win_percentage DECIMAL(5, 2),

    -- Timestamps
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT either_user_or_team_rank CHECK (
        (user_id IS NOT NULL AND team_id IS NULL) OR
        (user_id IS NULL AND team_id IS NOT NULL)
    )
);

CREATE INDEX idx_rankings_user_id ON rankings(user_id);
CREATE INDEX idx_rankings_team_id ON rankings(team_id);
CREATE INDEX idx_rankings_division_season ON rankings(division, season);
CREATE INDEX idx_rankings_rank ON rankings(rank);
```

### Brands

Brand and business profiles.

```sql
CREATE TABLE brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Brand Details
    name VARCHAR(200) UNIQUE NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(50)[], -- ['marker', 'apparel', 'field', 'paint', etc.]

    -- Media
    logo_url VARCHAR(500),
    banner_url VARCHAR(500),

    -- Contact
    email VARCHAR(255),
    phone VARCHAR(50),
    website_url VARCHAR(500),
    social_links JSONB DEFAULT '{}',

    -- Verification
    is_verified BOOLEAN DEFAULT FALSE,
    verification_date TIMESTAMP WITH TIME ZONE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_brands_slug ON brands(slug);
```

### Sponsorships

Brand sponsorships of teams or players.

```sql
CREATE TABLE sponsorships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,

    -- Sponsored Entity
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    -- Sponsorship Details
    type VARCHAR(20) NOT NULL, -- 'gear', 'financial', 'paint', 'entry_fees'
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'pending'

    -- Terms
    start_date DATE,
    end_date DATE,
    terms TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT either_team_or_user_sponsor CHECK (
        (team_id IS NOT NULL AND user_id IS NULL) OR
        (team_id IS NULL AND user_id IS NOT NULL)
    )
);

CREATE INDEX idx_sponsorships_brand_id ON sponsorships(brand_id);
CREATE INDEX idx_sponsorships_team_id ON sponsorships(team_id);
CREATE INDEX idx_sponsorships_user_id ON sponsorships(user_id);
```

### Streams

Live streams and VODs.

```sql
CREATE TABLE streams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    streamer_id UUID NOT NULL REFERENCES users(id),

    -- Stream Details
    title VARCHAR(200) NOT NULL,
    description TEXT,

    -- Stream Type
    stream_type VARCHAR(20) DEFAULT 'live', -- 'live', 'vod'

    -- Technical
    stream_key VARCHAR(255) UNIQUE,
    playback_url VARCHAR(500),
    rtmp_url VARCHAR(500),

    -- Status
    status VARCHAR(20) DEFAULT 'offline', -- 'offline', 'live', 'ended'

    -- Analytics
    viewer_count INTEGER DEFAULT 0,
    peak_viewers INTEGER DEFAULT 0,
    total_views INTEGER DEFAULT 0,

    -- Media
    thumbnail_url VARCHAR(500),

    -- Timestamps
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_streams_event_id ON streams(event_id);
CREATE INDEX idx_streams_streamer_id ON streams(streamer_id);
CREATE INDEX idx_streams_status ON streams(status);
```

### Notifications

User notifications.

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Notification Content
    type VARCHAR(50) NOT NULL, -- 'follow', 'like', 'comment', 'message', 'event', 'transaction'
    title VARCHAR(200),
    body TEXT,

    -- Reference
    reference_type VARCHAR(50), -- 'post', 'comment', 'event', 'listing', etc.
    reference_id UUID,

    -- Actor
    actor_id UUID REFERENCES users(id) ON DELETE CASCADE,

    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
```

## Views

### User Statistics View

```sql
CREATE VIEW user_statistics AS
SELECT
    u.id,
    u.username,
    COUNT(DISTINCT p.id) as posts_count,
    COUNT(DISTINCT f1.id) as followers_count,
    COUNT(DISTINCT f2.id) as following_count,
    COUNT(DISTINCT l.id) as listings_count,
    COUNT(DISTINCT er.id) as events_attended_count,
    AVG(r.rating) as seller_rating,
    COUNT(DISTINCT r.id) as review_count
FROM users u
LEFT JOIN posts p ON u.id = p.user_id
LEFT JOIN follows f1 ON u.id = f1.following_id
LEFT JOIN follows f2 ON u.id = f2.follower_id
LEFT JOIN listings l ON u.id = l.seller_id
LEFT JOIN event_registrations er ON u.id = er.user_id
LEFT JOIN reviews r ON u.id = r.reviewee_id AND r.review_type = 'seller'
GROUP BY u.id, u.username;
```

## Indexes Summary

Key indexes for performance:
- User lookups (email, username)
- Timeline queries (posts by date)
- Marketplace searches (category, price, location)
- Event discovery (date, location, status)
- Rankings (division, season, rank)
- Social graph (follows, likes)

## Data Retention

- User data: Retained until account deletion
- Posts/Comments: Retained indefinitely (or per user request)
- Transactions: Retained for 7 years (compliance)
- Notifications: 90 days
- Logs: 30 days

## Migration Strategy

Use Prisma Migrate or TypeORM migrations for schema changes.

1. Create migration file
2. Test in development
3. Review migration SQL
4. Apply to staging
5. Verify data integrity
6. Apply to production during maintenance window
7. Monitor for issues

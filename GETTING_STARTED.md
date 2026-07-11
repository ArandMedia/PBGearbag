# Getting Started

This guide will help you set up the Paintball Community App development environment.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (v9 or higher) - Comes with Node.js
- **Git** - [Download](https://git-scm.com/)
- **Docker Desktop** (optional, for containerized development) - [Download](https://www.docker.com/products/docker-desktop)

### Mobile Development Prerequisites

For iOS development:
- **macOS** (required for iOS development)
- **Xcode** (latest version) - [Download from App Store](https://apps.apple.com/us/app/xcode/id497799835)
- **CocoaPods** - Install via: `sudo gem install cocoapods`

For Android development:
- **Android Studio** - [Download](https://developer.android.com/studio)
- **Android SDK** (API Level 33 or higher)
- **Java Development Kit (JDK)** 11 or higher

For Expo development (recommended for beginners):
- **Expo CLI** - Will be installed with the project
- **Expo Go app** on your iOS/Android device - [iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/ArandMedia/PBG.git
cd PBG
```

### 2. Install Dependencies

Install all dependencies for the monorepo:

```bash
npm run install:all
```

Or install individually:

```bash
# Root dependencies
npm install

# Mobile app dependencies
cd mobile && npm install

# Backend dependencies
cd ../backend && npm install

# Shared package dependencies
cd ../shared && npm install
```

### 3. Set Up Environment Variables

#### Backend

Copy the example environment file and update with your values:

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and update:
- Database credentials
- JWT secrets (use a strong random string)
- AWS credentials (if using S3)
- Stripe keys (if testing payments)
- Email service credentials

#### Mobile

```bash
cd mobile
cp .env.example .env
```

Update the API URL if needed (default is `http://localhost:3000/api/v1`).

### 4. Start Development Services

You have two options:

#### Option A: Using Docker (Recommended)

Start all services (PostgreSQL, Redis, Elasticsearch) with Docker:

```bash
docker-compose up -d
```

This will start:
- PostgreSQL on `localhost:5432`
- Redis on `localhost:6379`
- Elasticsearch on `localhost:9200`
- pgAdmin on `localhost:5050` (admin interface)

#### Option B: Local Installation

Install and run PostgreSQL, Redis, and Elasticsearch locally:

**PostgreSQL:**
```bash
# macOS
brew install postgresql
brew services start postgresql

# Create database
createdb pbg_dev
```

**Redis:**
```bash
# macOS
brew install redis
brew services start redis
```

**Elasticsearch (optional):**
```bash
# macOS
brew install elasticsearch
brew services start elasticsearch
```

### 5. Run Database Migrations

```bash
cd backend
npm run migration:run
```

### 6. Start the Backend

```bash
cd backend
npm run start:dev
```

The backend API will be available at:
- API: http://localhost:3000/api/v1
- API Docs (Swagger): http://localhost:3000/api/docs

### 7. Start the Mobile App

In a new terminal:

```bash
cd mobile
npm start
```

This will start the Expo development server. You can then:
- Press `i` to open iOS simulator
- Press `a` to open Android emulator
- Scan the QR code with Expo Go app on your physical device

## Development Workflow

### Running the Full Stack

For the best development experience, run these in separate terminal windows:

```bash
# Terminal 1: Backend
cd backend && npm run start:dev

# Terminal 2: Mobile app
cd mobile && npm start
```

### Building the Shared Package

If you make changes to the shared package:

```bash
cd shared
npm run build
```

The mobile app and backend will automatically pick up the changes.

### Code Quality

#### Linting

```bash
# Lint all packages
npm run lint

# Lint specific package
cd backend && npm run lint
cd mobile && npm run lint
```

#### Formatting

```bash
# Format all files
npm run format
```

#### Type Checking

```bash
# Backend
cd backend && npm run build

# Mobile
cd mobile && npm run type-check
```

### Testing

```bash
# Run all tests
npm run test

# Backend tests
cd backend && npm run test

# Backend tests with coverage
cd backend && npm run test:cov

# E2E tests
cd backend && npm run test:e2e
```

## Project Structure

```
PBG/
├── mobile/              # React Native mobile app
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── screens/     # App screens
│   │   ├── navigation/  # Navigation setup
│   │   ├── services/    # API services
│   │   └── store/       # State management
│   └── App.tsx          # App entry point
├── backend/             # NestJS backend
│   ├── src/
│   │   ├── auth/        # Authentication
│   │   ├── users/       # User management
│   │   ├── teams/       # Team features
│   │   ├── marketplace/ # Marketplace
│   │   ├── events/      # Events
│   │   └── ...
│   └── main.ts          # Backend entry point
├── shared/              # Shared types and utilities
│   └── src/types/       # TypeScript types
└── docs/                # Documentation
```

## Useful Commands

### Development

```bash
# Start backend in development mode
npm run backend

# Start mobile app
npm run mobile

# Start mobile app on iOS
npm run mobile:ios

# Start mobile app on Android
npm run mobile:android
```

### Database

```bash
# Generate a new migration
cd backend
npm run migration:generate -- -n MigrationName

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```

### Docker

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild services
docker-compose up -d --build
```

## Common Issues

### Issue: Cannot connect to database

**Solution:** Ensure PostgreSQL is running and the credentials in `.env` are correct.

```bash
# Check if PostgreSQL is running
docker-compose ps
# or
brew services list
```

### Issue: Metro bundler cache issues

**Solution:** Clear the React Native cache:

```bash
cd mobile
rm -rf node_modules
npm install
npx expo start -c
```

### Issue: iOS build fails

**Solution:** Clean and rebuild:

```bash
cd mobile/ios
pod install
cd ..
npx expo run:ios
```

### Issue: Android build fails

**Solution:**

1. Ensure Android SDK is properly configured
2. Set `ANDROID_HOME` environment variable
3. Clear Gradle cache:

```bash
cd mobile/android
./gradlew clean
cd ..
npx expo run:android
```

## API Documentation

Once the backend is running, you can access the interactive API documentation at:

http://localhost:3000/api/docs

This Swagger UI allows you to:
- Browse all API endpoints
- Test endpoints directly from the browser
- View request/response schemas
- See authentication requirements

## Database Management

### pgAdmin (Docker)

If you're using Docker, you can access pgAdmin at:

http://localhost:5050

Login credentials:
- Email: `admin@pbg.local`
- Password: `admin`

Add a new server connection:
- Host: `postgres` (or `localhost` if not using Docker network)
- Port: `5432`
- Database: `pbg_dev`
- Username: `postgres`
- Password: `password`

## Next Steps

1. **Review the Documentation**
   - Read [README.md](./README.md) for project overview
   - Check [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
   - Review [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) for data models

2. **Start Building Features**
   - Begin with authentication module
   - Implement user profiles
   - Build marketplace features
   - Add team management

3. **Join the Development**
   - Create a new branch for your feature
   - Write tests for your code
   - Submit a pull request
   - Follow the code review process

## Getting Help

- Check the [documentation](./docs/)
- Review [existing issues](https://github.com/ArandMedia/PBG/issues)
- Create a new issue for bugs or feature requests

## Resources

### Expo & React Native
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)

### NestJS
- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)

### Database
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)

### Payment Processing
- [Stripe Documentation](https://stripe.com/docs)

### Deployment
- [Expo Application Services (EAS)](https://docs.expo.dev/eas/)
- [AWS Documentation](https://docs.aws.amazon.com/)

---

Happy coding! 🎨🔫

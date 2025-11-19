# Testing Authentication System

This guide will help you test the authentication system end-to-end.

## Prerequisites

- PostgreSQL running on port 5432
- Node.js 18+ installed
- Expo Go app on your mobile device (or iOS Simulator/Android Emulator)

## Setup

### 1. Start the Database

If using Docker:
```bash
docker-compose up -d postgres redis
```

Or start PostgreSQL locally:
```bash
# macOS
brew services start postgresql

# Create the database
createdb pbg_dev
```

### 2. Configure Environment

Backend `.env` file should have:
```bash
NODE_ENV=development
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_DATABASE=pbg_dev

JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRATION=7d
REFRESH_TOKEN_SECRET=your-super-secret-refresh-token-key
REFRESH_TOKEN_EXPIRATION=30d
```

Mobile `.env` file (if testing on physical device, replace localhost with your computer's IP):
```bash
API_URL=http://localhost:3000/api/v1
# OR for physical device:
# API_URL=http://192.168.1.XXX:3000/api/v1
```

### 3. Start the Backend

```bash
cd backend
npm install
npm run start:dev
```

You should see:
```
🚀 Server running on http://localhost:3000
📚 API docs available at http://localhost:3000/api/docs
```

### 4. Start the Mobile App

In a new terminal:
```bash
cd mobile
npm install
npm start
```

Scan the QR code with Expo Go app or press:
- `i` for iOS Simulator
- `a` for Android Emulator

## Testing Steps

### Test 1: User Registration

1. App should open to the **Login Screen**
2. Tap **"Create Account"**
3. Fill in the registration form:
   - Email: `test@example.com`
   - Username: `testuser`
   - First Name: `Test` (optional)
   - Last Name: `User` (optional)
   - Password: `TestPass123`
   - Confirm Password: `TestPass123`
4. Tap **"Create Account"**

**Expected Result:**
- Loading indicator appears
- User is automatically logged in
- App navigates to the Main Tab Navigator
- Profile tab shows user information

### Test 2: Logout

1. Navigate to the **Profile** tab
2. Scroll down and tap **"Logout"**
3. Confirm logout in the alert dialog

**Expected Result:**
- User is logged out
- App returns to Login Screen
- Stored tokens are cleared

### Test 3: Login

1. On the **Login Screen**, enter:
   - Username or Email: `testuser` (or `test@example.com`)
   - Password: `TestPass123`
2. Tap **"Login"**

**Expected Result:**
- Loading indicator appears
- User is logged in
- App navigates to Main Tab Navigator
- Profile shows user data

### Test 4: Edit Profile

1. Navigate to **Profile** tab
2. Tap **"Edit Profile"**
3. Update profile information:
   - Display Name: `Test Player`
   - Bio: `Love playing speedball!`
   - Select Play Styles: `speedball`, `recball`
   - Select Skill Level: `intermediate`
   - Home Field: `Paintball Paradise`
   - City: `Los Angeles`
   - State: `California`
   - Country: `USA`
4. Tap **"Save Changes"**

**Expected Result:**
- Loading indicator appears
- Success alert shows
- Profile screen updates with new information
- Data persists after app restart

### Test 5: Upload Avatar

1. Navigate to **Profile** tab
2. Tap **"Edit Profile"**
3. Tap on the **Avatar** placeholder
4. Select an image from your library
5. Tap **"Save Changes"**

**Expected Result:**
- Image picker opens
- Selected image appears in preview
- Image uploads to server
- Avatar displays on profile screen
- Avatar URL is stored in database

### Test 6: Upload Banner

1. In Edit Profile screen
2. Tap on the **Banner** placeholder
3. Select an image
4. Tap **"Save Changes"**

**Expected Result:**
- Banner image uploads
- Banner displays on profile screen

### Test 7: Token Persistence

1. Log in to the app
2. Close the app completely
3. Reopen the app

**Expected Result:**
- App automatically logs you in
- No need to enter credentials again
- Profile data loads immediately

### Test 8: API Error Handling

#### Invalid Credentials
1. Try to login with wrong password
2. Username: `testuser`
3. Password: `WrongPassword123`

**Expected Result:**
- Error alert: "Invalid credentials"
- User stays on login screen

#### Duplicate Username
1. Try to register with existing username
2. Username: `testuser`
3. Email: `another@example.com`

**Expected Result:**
- Error alert: "Username already exists"

#### Weak Password
1. Try to register with weak password
2. Password: `weak`

**Expected Result:**
- Error alert about password requirements

## Testing with API Docs (Swagger)

Visit http://localhost:3000/api/docs

### Test Registration via Swagger

1. Find **POST /api/v1/auth/register**
2. Click "Try it out"
3. Enter request body:
```json
{
  "email": "swagger@example.com",
  "username": "swaggeruser",
  "password": "SwaggerTest123"
}
```
4. Click "Execute"

**Expected Result:**
- Status: 201 Created
- Response body contains:
  - `user` object
  - `accessToken`
  - `refreshToken`

### Test Login via Swagger

1. Find **POST /api/v1/auth/login**
2. Click "Try it out"
3. Enter credentials:
```json
{
  "usernameOrEmail": "swaggeruser",
  "password": "SwaggerTest123"
}
```

**Expected Result:**
- Status: 200 OK
- Response with tokens

### Test Protected Endpoints

1. Copy the `accessToken` from login response
2. Click "Authorize" button at top of Swagger UI
3. Enter: `Bearer <your-access-token>`
4. Try **GET /api/v1/auth/me**

**Expected Result:**
- Status: 200 OK
- Returns current user data

### Test Profile Update

1. Authorize with Bearer token
2. Find **PUT /api/v1/users/profile**
3. Update profile:
```json
{
  "firstName": "Updated",
  "bio": "Testing from Swagger",
  "skillLevel": "pro"
}
```

**Expected Result:**
- Status: 200 OK
- Returns updated user object

## Database Verification

### Check User in Database

```bash
psql -d pbg_dev
```

```sql
-- View all users
SELECT id, email, username, first_name, last_name, created_at
FROM users;

-- View specific user
SELECT * FROM users WHERE username = 'testuser';

-- Check if password is hashed
SELECT password FROM users WHERE username = 'testuser';
-- Should see a bcrypt hash like: $2b$10$...
```

### Verify Refresh Tokens

```sql
-- Tokens should be hashed
SELECT refresh_token FROM users WHERE username = 'testuser';
```

## Troubleshooting

### Mobile app can't connect to API

**Problem:** Network request failed

**Solutions:**
1. If using physical device, update `API_URL` to your computer's IP:
   ```bash
   # Find your IP
   ipconfig getifaddr en0  # macOS
   ip addr show  # Linux
   ```
2. Update mobile/.env:
   ```bash
   API_URL=http://192.168.1.XXX:3000/api/v1
   ```
3. Restart Expo: Press `r` in terminal or shake device and reload

### Database Connection Error

**Problem:** Backend can't connect to PostgreSQL

**Solutions:**
1. Check if PostgreSQL is running:
   ```bash
   docker-compose ps  # if using Docker
   brew services list  # if using Homebrew
   ```
2. Verify database exists:
   ```bash
   psql -l | grep pbg_dev
   ```
3. Check credentials in backend/.env

### TypeORM Synchronization Issues

**Problem:** Entities not syncing to database

**Solution:**
1. Set `synchronize: true` in development (already set)
2. Or manually create tables:
   ```bash
   npm run migration:run
   ```

### Image Upload Fails

**Problem:** Avatar/banner upload returns error

**Solutions:**
1. Check `uploads` directory exists in backend:
   ```bash
   ls -la backend/uploads
   ```
2. Verify file permissions
3. Check file size (max 5MB for avatar, 10MB for banner)
4. Verify image format (jpg, png, webp only)

### Token Expired

**Problem:** 401 Unauthorized after token expiry

**Solution:**
- App should automatically refresh token
- If not working, logout and login again
- Check refresh token expiration (30 days by default)

## Success Criteria

✅ User can register a new account
✅ User can login with username or email
✅ User can logout
✅ Profile displays user information
✅ User can edit profile information
✅ User can upload avatar image
✅ User can upload banner image
✅ Tokens are stored securely
✅ App remembers logged-in user
✅ API endpoints are protected
✅ Passwords are hashed in database
✅ Refresh tokens work automatically
✅ Error messages are user-friendly

## Next Steps

Once authentication is working:
1. Build marketplace features
2. Add social feed
3. Implement team management
4. Add event system

---

**Need Help?**
Check the logs:
- Backend: Terminal running `npm run start:dev`
- Mobile: Expo DevTools or device logs
- Database: `psql -d pbg_dev`

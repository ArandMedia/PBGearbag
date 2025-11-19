# PBG Testing Guide

## Quick Start (5 Minutes)

### 1. Start the Backend

```bash
# Terminal 1: Start database
docker-compose up -d postgres redis

# Terminal 2: Start backend API
cd backend
npm install
npm run start:dev
```

You should see:
```
🚀 Server running on http://localhost:3000
📚 API docs available at http://localhost:3000/api/docs
```

### 2. Start the Mobile App

```bash
# Terminal 3: Start mobile app
cd mobile
npm install
npm start
```

Then:
- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- OR scan QR code with Expo Go app

### 3. Test Authentication (2 minutes)

**Register:**
1. App opens to Login screen
2. Tap "Create Account"
3. Fill in:
   - Email: `test@pbg.social`
   - Username: `testplayer`
   - Password: `PBG2025!`
4. Tap "Create Account"
5. ✅ Should auto-login and show tabs

**Profile:**
1. Tap "Profile" tab
2. Tap "Edit Profile"
3. Add your info:
   - Display Name: `Test Player`
   - Play Styles: Select `speedball`, `recball`
   - Skill Level: `intermediate`
   - Home Field: `Your Local Field`
4. Tap "Save Changes"
5. ✅ Profile updates immediately

**Upload Images:**
1. In Edit Profile
2. Tap avatar placeholder
3. Select an image from your library
4. Tap "Save Changes"
5. ✅ Avatar appears on profile

### 4. Test Marketplace (5 minutes)

**Create Listing:**
1. Tap "Marketplace" tab
2. Tap "+" button (bottom right)
3. Add photos (tap + box)
4. Fill in:
   - Title: `Planet Eclipse CS2 Pro`
   - Description: `Excellent condition, barely used`
   - Category: Select `Marker`
   - Brand: `Planet Eclipse`
   - Model: `CS2 Pro`
   - Condition: Select `Excellent`
   - Price: `1200`
   - Check "Price is negotiable"
   - Check "Shipping available"
5. Tap "Create Listing"
6. ✅ Shows listing detail page

**Browse Listings:**
1. Go back to Marketplace tab
2. See your listing in feed
3. Tap different categories (chips at top)
4. Use search bar
5. Pull down to refresh
6. ✅ Everything updates instantly

**View Details:**
1. Tap any listing
2. Swipe through images
3. See all details
4. ✅ View count increments

**Manage Listings:**
1. Tap "My Listings" tab
2. See all your listings
3. Tap one to view
4. Tap "Edit" or "Mark as Sold"
5. ✅ Updates work perfectly

## API Testing (Swagger)

Visit: **http://localhost:3000/api/docs**

### Test Endpoints:

1. **Register User**
   - POST `/auth/register`
   - Try it out with test data
   - Copy the `accessToken`

2. **Authorize**
   - Click green "Authorize" button
   - Paste: `Bearer <your-access-token>`
   - Click "Authorize"

3. **Create Listing**
   - POST `/marketplace`
   - Fill in sample data
   - Execute
   - ✅ Returns new listing

4. **Browse Listings**
   - GET `/marketplace`
   - Add filters in parameters
   - Execute
   - ✅ Returns filtered results

## Database Verification

```bash
# Connect to database
docker exec -it pbg-postgres psql -U postgres -d pbg_dev

# Check users
SELECT id, username, email, created_at FROM users;

# Check listings
SELECT id, title, price, category, status FROM listings;

# Check images
SELECT title, images FROM listings WHERE images IS NOT NULL;

# Exit
\q
```

## Feature Checklist

### ✅ Authentication
- [ ] Register new user
- [ ] Login with username
- [ ] Login with email
- [ ] Edit profile
- [ ] Upload avatar
- [ ] Upload banner
- [ ] Logout
- [ ] Auto-login on app restart

### ✅ Marketplace
- [ ] Create listing with images
- [ ] Browse all listings
- [ ] Filter by category
- [ ] Search listings
- [ ] View listing details
- [ ] See image gallery
- [ ] Edit own listing
- [ ] Delete listing
- [ ] Mark as sold
- [ ] View counter works
- [ ] My Listings shows your items

## Common Issues & Fixes

### Backend won't start
```bash
# Make sure database is running
docker-compose up -d postgres

# Check logs
docker-compose logs postgres

# Restart backend
cd backend
npm run start:dev
```

### Mobile app can't connect
```bash
# Update API URL for physical device
# Edit mobile/.env
API_URL=http://YOUR_COMPUTER_IP:3000/api/v1

# Get your IP:
ipconfig getifaddr en0  # macOS
ip addr show  # Linux

# Restart Expo
npm start
```

### Images not uploading
```bash
# Check uploads directory exists
ls -la backend/uploads

# Create if missing
mkdir -p backend/uploads/avatars backend/uploads/banners backend/uploads/listings

# Check permissions
chmod -R 755 backend/uploads
```

## What to Test

### User Experience
1. **Speed** - Everything should load quickly
2. **Smoothness** - No lag when scrolling
3. **Errors** - Try invalid inputs
4. **Edge Cases** - Empty states, no images, etc.

### Features
1. **Search** - Find specific items
2. **Filters** - Category, price, location
3. **Images** - Upload, view, gallery
4. **Forms** - Validation, error messages

### Mobile UI
1. **Dark Theme** - Consistent colors
2. **Navigation** - Easy to find things
3. **Buttons** - All clickable
4. **Text** - Readable sizes

## Success Metrics

After testing, you should be able to:
- ✅ Create account in < 30 seconds
- ✅ Post listing in < 2 minutes
- ✅ Find listings by search/filter
- ✅ Upload 10 images per listing
- ✅ Edit profile with avatar
- ✅ Browse marketplace smoothly

## Next Steps

Once testing is good:
1. Deploy to staging server
2. Test on real devices
3. Invite beta testers
4. Gather feedback
5. Iterate and improve

## For pbg.social Deployment

When ready to deploy:

### Backend (API)
- Host at: `api.pbg.social`
- Update CORS to allow `pbg.social`
- Set up SSL certificate
- Configure production database

### Mobile Web (Future)
- Host at: `pbg.social`
- PWA for mobile browsers
- Same dark theme
- Responsive design

### Mobile Apps
- iOS: TestFlight → App Store
- Android: Internal testing → Play Store
- Deep linking: `pbg://` URLs

---

**You now have a working BST marketplace!** 🎉

The foundation is solid for pbg.social to become the go-to platform for paintball gear trading.

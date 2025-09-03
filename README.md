# Location Tracker App

A React Native app built with Expo that provides location tracking and map visualization capabilities.

## Features

### 🎯 **First Functionality: Location Tracking**
- **Firebase Authentication**: Google Sign-in integration
- **Real-time Location Tracking**: Track user location with start/stop controls
- **Firebase Realtime Database**: Store tracked location data
- **User-controlled Tracking**: Users specify when to start and stop tracking

### 🗺️ **Second Functionality: Map View**
- **DynamoDB Integration**: Fetch coordinates from specified DynamoDB tables
- **Interactive Map Display**: Display coordinates as pins on maps
- **Cross-platform Support**: Web shows clickable coordinate list, mobile shows native maps
- **Google Maps Integration**: Tap coordinates to open in Google Maps

## Tech Stack

### Frontend
- **React Native** with Expo Router
- **TypeScript** for type safety
- **Expo Location** for GPS tracking
- **Firebase SDK** for authentication and database
- **React Native Maps** for mobile map display
- **AWS SDK** integration for DynamoDB

### Backend
- **FastAPI** Python web framework
- **AWS DynamoDB** integration with boto3
- **CORS enabled** for cross-origin requests
- **Comprehensive error handling**

### Database
- **Firebase Realtime Database**: Location tracking data
- **AWS DynamoDB**: Coordinate data with titles

## Project Structure

```
app/
├── frontend/                   # React Native Expo app
│   ├── app/                   # Expo Router pages
│   │   ├── index.tsx         # Location Tracking screen
│   │   ├── map.tsx           # Map View screen
│   │   └── _layout.tsx       # Tab navigation layout
│   ├── contexts/             # React contexts
│   │   └── AuthContext.tsx   # Firebase auth context
│   ├── lib/                  # Utilities
│   │   └── firebase.ts       # Firebase configuration
│   └── package.json          # Dependencies
├── backend/                   # FastAPI server
│   ├── server.py             # Main API endpoints
│   └── requirements.txt      # Python dependencies
└── README.md                 # This file
```

## API Endpoints

### Health Check
- `GET /api/health` - Check API and AWS connectivity status

### Coordinates Management
- `GET /api/coordinates/{table_name}` - Fetch coordinates from DynamoDB table
- `POST /api/test-data/{table_name}` - Create test coordinate data

## Configuration

### Environment Variables

#### Frontend (.env)
```env
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# Google Maps API Key
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

#### Backend (.env)
```env
# AWS Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
DYNAMODB_TABLE_NAME=your-table-name
```

### Firebase Setup
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Authentication with Google Sign-in
3. Enable Realtime Database
4. Get your project configuration keys
5. Update the frontend .env file

### AWS DynamoDB Setup
1. Create an AWS account and configure IAM user
2. Create a DynamoDB table with the following structure:
   - **Primary Key**: `id` (String)
   - **Attributes**: `title` (String), `latitude` (Number), `longitude` (Number)
3. Update the backend .env file with your credentials

### Google Maps Setup
1. Create a Google Cloud project
2. Enable Maps SDK for Android/iOS
3. Create an API key
4. Update the frontend .env file

## Installation & Development

### Prerequisites
- Node.js 18+ and Yarn
- Python 3.8+
- Expo CLI
- Firebase project
- AWS account with DynamoDB access
- Google Maps API key

### Setup
1. **Clone and install dependencies**:
   ```bash
   cd frontend && yarn install
   cd ../backend && pip install -r requirements.txt
   ```

2. **Configure environment variables** (see Configuration section above)

3. **Start development servers**:
   ```bash
   # Backend
   cd backend && python server.py

   # Frontend
   cd frontend && expo start
   ```

## Usage

### Authentication Flow
1. **Open the app** - Authentication screen appears first
2. **Sign in with Google** - Required to access all features
3. **Grant permissions** when prompted for location access

### Map View (Main Tab)
1. **Automatically opens** after authentication as the main screen
2. Enter a DynamoDB table name in the input field
3. Tap "Fetch" to load coordinates from the specified table
4. **On web**: Click coordinates to open in Google Maps
5. **On mobile**: View pins on native map with full interaction

### Location Tracking
1. Switch to the "Location Tracking" tab 
2. Tap "Start Tracking" to begin real-time location recording
3. Location data is automatically saved to Firebase every 10 seconds
4. View current tracking status and recent location data
5. Tap "Stop Tracking" to end the session

### User Flow
```
Authentication Required → Map View (Main) → Location Tracking (Secondary)
```

All features require Google authentication for security and data association.

## Testing

The backend API includes comprehensive error handling and has been tested with:
- ✅ Health check endpoints
- ✅ DynamoDB integration with proper error responses
- ✅ CORS configuration
- ✅ Invalid table name handling
- ✅ AWS credential validation

## Cross-Platform Support

### Web
- Clean coordinate list interface
- Click to open locations in Google Maps
- Responsive design

### Mobile (iOS/Android)
- Native map integration with React Native Maps
- GPS location tracking
- Native authentication flows
- Push notifications ready

## Security Features

- Firebase Authentication for secure user management
- Environment variable protection for API keys
- CORS properly configured for cross-origin requests
- AWS credential validation and error handling

## Future Enhancements

- Offline location tracking capability
- Location history visualization
- Geofencing alerts
- Export location data
- Social sharing features
- Advanced map filtering options

---

**Ready to use!** Replace the dummy credentials in the .env files with your actual Firebase, AWS, and Google Maps credentials to start tracking locations.

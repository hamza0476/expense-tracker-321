# Mobile App Setup Guide

This guide will help you convert ExpenseWiz to a native mobile application using Capacitor.

## Prerequisites

- Node.js installed
- Git installed
- For iOS: Mac with Xcode installed
- For Android: Android Studio installed

## Step 1: Export to GitHub

1. Click the "Export to GitHub" button in Lovable
2. Clone your repository locally:
   ```bash
   git clone <your-repo-url>
   cd expense-wiz-38
   ```

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Add Native Platforms

Add iOS (Mac only):
```bash
npx cap add ios
```

Add Android:
```bash
npx cap add android
```

## Step 4: Update Native Dependencies

For iOS:
```bash
npx cap update ios
```

For Android:
```bash
npx cap update android
```

## Step 5: Build the Web App

```bash
npm run build
```

## Step 6: Sync with Native Platforms

```bash
npx cap sync
```

**Important**: Run `npx cap sync` after every git pull to sync changes to native platforms.

## Step 7: Run on Device/Emulator

For iOS (Mac only):
```bash
npx cap run ios
```

For Android:
```bash
npx cap run android
```

## Features Available in Mobile App

### Camera Integration
- Take photos of receipts (planned feature)
- Upload receipt images

### Push Notifications
- Budget alerts when approaching spending limits
- Recurring expense reminders

### Offline Support
- View expense history offline
- Sync when connection is restored

## Hot Reload During Development

The app is configured for hot reload from the Lovable sandbox:
- URL: `https://2501b755-5345-424a-95a1-88fce5ad97c5.lovableproject.com?forceHideBadge=true`
- Changes in Lovable will reflect in your mobile app automatically

## Troubleshooting

### iOS Build Issues
- Ensure Xcode is updated to the latest version
- Open the iOS project in Xcode and check for signing issues
- Run `pod install` in the `ios/App` directory if needed

### Android Build Issues
- Ensure Android Studio is properly configured
- Check that ANDROID_HOME environment variable is set
- Update Gradle if prompted

### Sync Issues
- Always run `npx cap sync` after pulling changes
- Clean build folders if needed:
  - iOS: Delete `ios/App/build` folder
  - Android: Delete `android/app/build` folder

## Publishing to App Stores

### Apple App Store
1. Configure signing in Xcode
2. Archive the app in Xcode
3. Upload to App Store Connect
4. Submit for review

### Google Play Store
1. Generate a signed APK/AAB in Android Studio
2. Create a listing in Google Play Console
3. Upload the APK/AAB
4. Submit for review

## Need Help?

For more information:
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [iOS Deployment Guide](https://capacitorjs.com/docs/ios)
- [Android Deployment Guide](https://capacitorjs.com/docs/android)

# Mobile OAuth Setup Guide (Android)

This guide explains how to configure Google OAuth for your Capacitor Android app with proper in-app authentication flow.

## Important Note

OAuth with Google on Capacitor requires **native configuration**. The current implementation uses web-based OAuth which opens in an external browser. For true in-app OAuth, follow these steps:

## Prerequisites

1. Android Studio installed
2. Google Cloud Console project configured
3. SHA-1 fingerprint from your Android app

## Step 1: Get Your SHA-1 Fingerprint

### Debug Keystore (for testing):
```bash
cd android
./gradlew signingReport
```

Look for the SHA-1 under the `debug` variant.

### Release Keystore (for production):
```bash
keytool -list -v -keystore your-release-key.keystore -alias your-key-alias
```

## Step 2: Configure Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth Client ID"
5. Choose "Android" as application type
6. Enter your details:
   - **Name**: ExpenseWiz Android
   - **Package name**: `com.hamza.expensetracker.v2`
   - **SHA-1 fingerprint**: Paste the SHA-1 from Step 1

## Step 3: Configure Supabase/Lovable Cloud

1. Open your Lovable project dashboard
2. Click "View Backend"
3. Navigate to: Authentication > Auth Settings > Google Settings
4. Add the following redirect URLs:
   - `https://yhgvveoyxfacgjootirh.supabase.co/auth/v1/callback`
   - `com.hamza.expensetracker.v2:/oauth2redirect`

## Step 4: Update Android Manifest

Add the following to `android/app/src/main/AndroidManifest.xml` inside the `<application>` tag:

```xml
<activity
    android:name="com.getcapacitor.BridgeActivity"
    android:exported="true">
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="com.hamza.expensetracker.v2" />
    </intent-filter>
</activity>
```

## Step 5: Install Google Auth Plugin (Recommended)

For better mobile OAuth experience, install the Capacitor Google Auth plugin:

```bash
npm install @codetrix-studio/capacitor-google-auth
npx cap sync
```

Then update your code to use the native plugin instead of web OAuth.

## Step 6: Sync and Build

```bash
npx cap sync android
npx cap open android
```

## Testing OAuth Flow

1. Build and run your app on a physical device or emulator
2. Tap "Continue with Google"
3. You should see:
   - Native Google account picker (in-app)
   - Account selection
   - Permission consent
   - Redirect back to your app

## Troubleshooting

### "redirect_uri_mismatch" Error
- Verify package name matches exactly: `com.hamza.expensetracker.v2`
- Verify SHA-1 fingerprint is correct
- Make sure you're using the right keystore (debug vs release)

### OAuth Opens in Browser
- You're still using web OAuth. Install `@codetrix-studio/capacitor-google-auth`
- Make sure the plugin is properly synced with `npx cap sync`

### "Developer Error" in Google Sign-In
- SHA-1 fingerprint doesn't match
- Package name doesn't match
- OAuth client not properly configured in Google Cloud Console

## Alternative: Web OAuth (Current Implementation)

The current implementation uses web-based OAuth which will:
1. Open in external browser
2. Complete authentication
3. Return to the app via deep link

This works but provides a less seamless user experience. For production apps, we recommend implementing the native plugin approach above.

## Deep Link Configuration

The app is configured with the following deep link scheme:
- **Scheme**: `com.hamza.expensetracker.v2`
- **Host**: `oauth2redirect`

This allows the browser to redirect back to your app after OAuth completion.

## Need Help?

- [Capacitor Google Auth Plugin](https://github.com/CodetrixStudio/CapacitorGoogleAuth)
- [Google OAuth for Android](https://developers.google.com/identity/sign-in/android/start)
- [Supabase Auth with Mobile](https://supabase.com/docs/guides/auth/social-login/auth-google)

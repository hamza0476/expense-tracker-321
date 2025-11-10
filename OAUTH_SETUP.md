# OAuth Setup Guide

This guide will help you configure Google and Facebook OAuth authentication for ExpenseWiz.

## Prerequisites

- Google Cloud Console account for Google OAuth
- Meta for Developers account for Facebook OAuth

## Google OAuth Setup

### 1. Create OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth Client ID"
5. Configure the OAuth consent screen:
   - Add your app name: "ExpenseWiz"
   - Add your app logo
   - Add authorized domains: `lovableproject.com` and your custom domain (if any)

### 2. Configure OAuth Client

1. Application type: "Web application"
2. Name: "ExpenseWiz Web Client"
3. Authorized JavaScript origins:
   - `https://2501b755-5345-424a-95a1-88fce5ad97c5.lovableproject.com`
   - Your deployed URL (if any)
   - For mobile: Your app's deep link URL
4. Authorized redirect URIs:
   - `https://yhgvveoyxfacgjootirh.supabase.co/auth/v1/callback`
   - Your custom domain callback (if any)

### 3. Configure in Lovable Cloud

1. Click "View Backend" in your Lovable project
2. Navigate to Authentication > Auth Settings > Google Settings
3. Enable Google provider
4. Paste your Client ID and Client Secret from Google Cloud Console
5. Save settings

## Facebook OAuth Setup

### 1. Create a Facebook App

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Click "My Apps" > "Create App"
3. Select "Consumer" as app type
4. Add app name: "ExpenseWiz"
5. Add contact email

### 2. Configure Facebook Login

1. In your app dashboard, add "Facebook Login" product
2. Go to Facebook Login > Settings
3. Add Valid OAuth Redirect URIs:
   - `https://yhgvveoyxfacgjootirh.supabase.co/auth/v1/callback`
   - Your custom domain callback (if any)

### 3. Get App Credentials

1. Go to Settings > Basic
2. Copy your App ID and App Secret

### 4. Configure in Lovable Cloud

1. Click "View Backend" in your Lovable project
2. Navigate to Authentication > Auth Settings > Facebook Settings
3. Enable Facebook provider
4. Paste your App ID and App Secret
5. Save settings

## Email Verification Setup

The app is configured to send email verification links when users sign up.

### Configure Email Settings

1. Click "View Backend" in your Lovable project
2. Navigate to Authentication > Auth Settings > Email Settings
3. Enable "Confirm email" for production environments
4. For development, you can disable this for faster testing
5. Configure email templates (optional):
   - Customize the verification email template
   - Add your app branding

## Mobile App Deep Links (For Native Apps)

When you build the native mobile app with Capacitor:

### iOS Deep Links

1. Add URL scheme in `Info.plist`:
   ```xml
   <key>CFBundleURLTypes</key>
   <array>
     <dict>
       <key>CFBundleURLSchemes</key>
       <array>
         <string>com.hamza.expensetracker</string>
       </array>
     </dict>
   </array>
   ```

### Android Deep Links

1. Add intent filter in `AndroidManifest.xml`:
   ```xml
   <intent-filter>
     <action android:name="android.intent.action.VIEW" />
     <category android:name="android.intent.category.DEFAULT" />
     <category android:name="android.intent.category.BROWSABLE" />
     <data android:scheme="com.hamza.expensetracker" />
   </intent-filter>
   ```

2. Update OAuth providers with mobile redirect URLs:
   - Google: `com.hamza.expensetracker://oauth`
   - Facebook: `com.hamza.expensetracker://oauth`

## Testing OAuth

1. **Development**: Test using the Lovable preview URL
2. **Production**: Test using your deployed URL
3. **Mobile**: Test using either:
   - Capacitor's live reload with preview URL
   - Built native app with deep links

## Troubleshooting

### Common Issues

1. **"redirect_uri_mismatch" error**
   - Verify all redirect URIs are correctly configured in Google/Facebook
   - Ensure URLs match exactly (including https://)

2. **Email verification not sending**
   - Check email settings in Lovable Cloud
   - Verify SMTP configuration if using custom email provider

3. **OAuth popup blocked**
   - Ensure user interaction triggers OAuth flow
   - Check browser popup blocker settings

4. **Mobile deep links not working**
   - Verify URL schemes are correctly configured
   - Test deep links using platform-specific tools

## Security Best Practices

1. **Never commit credentials**: Keep API keys and secrets secure
2. **Use environment variables**: Store sensitive data in environment variables
3. **Enable CORS**: Configure allowed origins in Lovable Cloud
4. **Validate tokens**: Always verify OAuth tokens on the backend
5. **Use HTTPS**: Ensure all OAuth flows use secure connections

## Need Help?

For more information:
- [Lovable Cloud Documentation](https://docs.lovable.dev/features/cloud)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Facebook OAuth Documentation](https://developers.facebook.com/docs/facebook-login)

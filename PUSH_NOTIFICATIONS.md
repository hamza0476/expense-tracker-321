# 🔔 Push Notifications Setup Guide

This guide covers the push notification implementation for budget alerts in ExpenseWiz.

## Features

- **Budget Alerts**: Get notified when approaching or exceeding budget limits
- **Real-time Notifications**: Instant alerts when adding expenses that trigger thresholds
- **Customizable Thresholds**: Set custom percentage thresholds (default 80%)
- **Smart Throttling**: Notifications throttled to once per 24 hours per category

## How It Works

### 1. Automatic Checks
The app automatically checks budget alerts:
- When you add a new expense
- When navigating the app (periodic checks)
- Through the edge function `check-budget-alerts`

### 2. Notification Triggers
Notifications are triggered when:
- You reach 80% of your budget (warning)
- You reach 90% of your budget (urgent warning)
- You exceed 100% of your budget (exceeded alert)

### 3. Mobile App Integration
For native mobile apps (via Capacitor):
- **iOS**: Uses Apple Push Notification Service (APNS)
- **Android**: Uses Firebase Cloud Messaging (FCM)
- **Web**: Falls back to browser toast notifications

## Setup for Mobile

### Prerequisites
1. Complete the mobile setup from `MOBILE_SETUP.md`
2. Have iOS and/or Android project configured

### iOS Setup
1. Create an Apple Developer account
2. Generate an APNs certificate or key
3. Configure in Xcode:
   - Enable Push Notifications capability
   - Add Background Modes capability
   - Enable "Remote notifications"

### Android Setup
1. Create a Firebase project
2. Add your app to Firebase
3. Download `google-services.json`
4. Place it in `android/app/`
5. Configure Firebase Cloud Messaging

## Configuration

### Enable Budget Alerts
Budget alerts are managed through the Budgets page:
1. Navigate to the Budgets page
2. Set a budget for a category
3. Alert is automatically created with 80% threshold
4. Modify threshold in the Budget Alerts section

### Customize Thresholds
You can customize alert thresholds per category:
- **Low**: 50% of budget (early warning)
- **Medium**: 80% of budget (standard)
- **High**: 95% of budget (last chance)

## Testing Notifications

### Web/PWA Testing
```bash
# Run the app
npm run dev

# Add expenses close to your budget limit
# Notifications will appear as toast messages
```

### Mobile Testing
```bash
# iOS
npx cap run ios

# Android  
npx cap run android

# Test by:
# 1. Set a low budget (e.g., $10)
# 2. Add expenses totaling $8-$9
# 3. Watch for notifications
```

## Edge Function

The `check-budget-alerts` edge function:
- Runs serverless on Supabase
- Checks budgets vs actual spending
- Returns notification objects
- Updates last triggered timestamp

### Manual Testing
```bash
# Call the edge function directly
curl -X POST \
  https://YOUR_PROJECT.supabase.co/functions/v1/check-budget-alerts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"userId": "user-id", "category": "Food"}'
```

## Troubleshooting

### Notifications Not Appearing

**Web/PWA:**
- Check browser notification permissions
- Ensure app has focus or is in foreground
- Check browser console for errors

**Mobile:**
- Verify push notification permissions granted
- Check device notification settings
- Ensure background modes are enabled (iOS)
- Verify FCM configuration (Android)

### Permission Issues
```typescript
// Request permissions manually
import { PushNotifications } from '@capacitor/push-notifications';

const checkPermissions = async () => {
  const status = await PushNotifications.checkPermissions();
  console.log('Permission status:', status);
  
  if (status.receive !== 'granted') {
    await PushNotifications.requestPermissions();
  }
};
```

### Debug Mode
Enable detailed logging:
```typescript
// In src/services/pushNotifications.ts
console.log('Push notifications initialized');
console.log('Device token:', token);
console.log('Budget alert triggered:', notification);
```

## Best Practices

1. **Respect User Preferences**
   - Allow users to disable notifications
   - Provide granular control per category
   - Honor system "Do Not Disturb" modes

2. **Avoid Notification Spam**
   - Use 24-hour throttling
   - Batch similar notifications
   - Only send meaningful alerts

3. **Clear Messaging**
   - Use emoji for visual clarity (💸, ⚠️, 📊)
   - Include actionable information
   - Provide context (amount, percentage)

4. **Testing**
   - Test on real devices
   - Test different budget scenarios
   - Test notification appearance in different states

## Privacy & Security

- **No External Services**: Uses only Supabase edge functions
- **User Data**: Notification data never leaves your infrastructure
- **Tokens**: Device tokens stored securely (if implemented)
- **Permissions**: Always request explicit user consent

## Future Enhancements

Potential improvements:
- Recurring expense reminders
- Bill due date notifications
- Spending pattern insights
- Monthly summary notifications
- Goal achievement celebrations

## Need Help?

- Check the [Capacitor Push Notifications docs](https://capacitorjs.com/docs/apis/push-notifications)
- Review Supabase edge function logs
- Test with smaller budgets for faster iterations

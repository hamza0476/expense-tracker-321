import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export class PushNotificationService {
  private static instance: PushNotificationService;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Request permission
      const permStatus = await PushNotifications.requestPermissions();
      
      if (permStatus.receive === 'granted') {
        // Register with Apple / Google
        await PushNotifications.register();
        
        // Listeners
        await PushNotifications.addListener('registration', (token) => {
          console.log('Push registration success:', token.value);
          this.saveDeviceToken(token.value);
        });

        await PushNotifications.addListener('registrationError', (error) => {
          console.error('Push registration error:', error);
        });

        await PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('Push received:', notification);
          toast.info(notification.title || 'New notification', {
            description: notification.body
          });
        });

        await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
          console.log('Push action performed:', action);
          // Handle notification tap - navigate to relevant screen
          if (action.notification.data?.route) {
            window.location.href = action.notification.data.route;
          }
        });

        this.isInitialized = true;
        console.log('Push notifications initialized');
      } else {
        console.log('Push notification permission denied');
      }
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  }

  private async saveDeviceToken(token: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Store token in your database (you'll need to create this table)
      // For now, just log it
      console.log('Device token:', token);
      localStorage.setItem('push_token', token);
    } catch (error) {
      console.error('Error saving device token:', error);
    }
  }

  async checkBudgetAlerts(category?: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const response = await supabase.functions.invoke('check-budget-alerts', {
        body: { userId: user.id, category }
      });

      if (response.error) throw response.error;

      const { notifications } = response.data;
      
      // Show local notifications for budget alerts
      if (notifications && notifications.length > 0) {
        for (const notif of notifications) {
          await this.showLocalNotification(notif.title, notif.body);
        }
      }
    } catch (error) {
      console.error('Error checking budget alerts:', error);
    }
  }

  async showLocalNotification(title: string, body: string) {
    // Use toast for notifications in web/PWA mode
    // In native mobile app, this would be replaced with native notifications
    toast(title, { description: body, duration: 5000 });
  }

  async unregister() {
    try {
      await PushNotifications.removeAllListeners();
      this.isInitialized = false;
    } catch (error) {
      console.error('Error unregistering push notifications:', error);
    }
  }
}

export const pushNotificationService = PushNotificationService.getInstance();
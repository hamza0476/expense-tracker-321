import { CapacitorConfig } from '@capacitor/core';

const config: CapacitorConfig = {
  appId: 'com.hamza.expensetracker.v2',
  appName: 'ExpenseWiz',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true
  },
  plugins: {
    Camera: {
      saveToGallery: true,
      allowEditing: true,
      resultType: 'uri'
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
};

export default config;

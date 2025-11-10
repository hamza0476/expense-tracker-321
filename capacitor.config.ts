import { CapacitorConfig } from '@capacitor/core';

const config: CapacitorConfig = {
appId: 'com.hamza.expensetracker.v2'
  appName: 'ExpenseWiz',
  webDir: 'dist',
  server: {
    url: 'https://2501b755-5345-424a-95a1-88fce5ad97c5.lovableproject.com?forceHideBadge=true',
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

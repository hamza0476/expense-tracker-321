import { CapacitorConfig } from '@capacitor/core';

const config: CapacitorConfig = {
  appId: 'app.lovable.2501b7555345424a95a188fce5ad97c5',
  appName: 'expense-wiz-38',
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

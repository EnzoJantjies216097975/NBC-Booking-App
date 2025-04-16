export default {
    name: "NBC-Booking-App",
    slug: "NBC-Booking-App",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      }
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "expo-router"
    ],
    extra: {
      firebaseApiKey: "AIzaSyBvtk_-n-GkX6yO5O9xfBi5o41q8hUGXBA",
      firebaseAuthDomain: "bookingapp-429d2.firebaseapp.com",
      firebaseDatabaseUrl: "https://bookingapp-429d2-default-rtdb.europe-west1.firebasedatabase.app",
      firebaseProjectId: "bookingapp-429d2",
      firebaseStorageBucket: "bookingapp-429d2.firebasestorage.app",
      firebaseMessagingSenderId: "853797141233",
      firebaseAppId: "1:853797141233:web:cf9715f6b7b6a622e18750",
      firebaseMeasurementId: "G-1V32L44QX1",
      eas: {
        projectId: "your-eas-project-id"
      }
    }
  };
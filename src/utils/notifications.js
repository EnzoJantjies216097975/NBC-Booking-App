// src/utils/notifications.js

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// Register for push notifications and return the token
export async function registerForPushNotificationsAsync() {
  let token;
  
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    
    // Get the token that uniquely identifies this device
    token = (await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig.extra.eas.projectId,
    })).data;
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

// Save the push token to Firestore
export async function savePushToken(userId) {
  try {
    const token = await registerForPushNotificationsAsync();
    
    if (token) {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        pushToken: token
      });
    }
  } catch (error) {
    console.error('Error saving push token:', error);
  }
}

// Schedule a local notification
export async function scheduleLocalNotification(title, body, trigger, data = {}) {
  return await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
    },
    trigger,
  });
}

// Send immediate local notification
export async function sendImmediateNotification(title, body, data = {}) {
  return await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
    },
    trigger: null,
  });
}

// Schedule production reminders (60min, 30min, 10min)
export async function scheduleProductionReminders(production) {
  try {
    // Convert Firestore timestamps to JavaScript Date objects
    const startTime = production.startTime.toDate();
    
    // Schedule 60-minute reminder
    const sixtyMinBefore = new Date(startTime);
    sixtyMinBefore.setMinutes(startTime.getMinutes() - 60);
    
    if (sixtyMinBefore > new Date()) {
      await scheduleLocalNotification(
        `Reminder: ${production.name}`,
        `Production starts in 60 minutes at ${formatTime(startTime)}`,
        { date: sixtyMinBefore },
        { productionId: production.id, type: 'reminder' }
      );
    }
    
    // Schedule 30-minute reminder
    const thirtyMinBefore = new Date(startTime);
    thirtyMinBefore.setMinutes(startTime.getMinutes() - 30);
    
    if (thirtyMinBefore > new Date()) {
      await scheduleLocalNotification(
        `Reminder: ${production.name}`,
        `Production starts in 30 minutes at ${formatTime(startTime)}`,
        { date: thirtyMinBefore },
        { productionId: production.id, type: 'reminder' }
      );
    }
    
    // Schedule 10-minute reminder
    const tenMinBefore = new Date(startTime);
    tenMinBefore.setMinutes(startTime.getMinutes() - 10);
    
    if (tenMinBefore > new Date()) {
      await scheduleLocalNotification(
        `Reminder: ${production.name}`,
        `Production starts in 10 minutes at ${formatTime(startTime)}`,
        { date: tenMinBefore },
        { productionId: production.id, type: 'reminder' }
      );
    }
  } catch (error) {
    console.error('Error scheduling reminders:', error);
  }
}

// Cancel all scheduled notifications
export async function cancelAllScheduledNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Helper function to format time
function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
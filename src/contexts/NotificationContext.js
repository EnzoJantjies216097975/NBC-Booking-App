// src/contexts/NotificationContext.js

import React, { createContext, useState, useEffect, useContext } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export function useNotifications() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  // Load notifications from Firestore
  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setNotifications(notificationsList);
      setUnreadCount(notificationsList.filter(n => !n.read).length);
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser]);

  // Mark notification as read
  async function markAsRead(notificationId) {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true
      });
      return { success: true };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  // Mark all notifications as read
  async function markAllAsRead() {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      
      const updatePromises = unreadNotifications.map(notification => {
        const notificationRef = doc(db, 'notifications', notification.id);
        return updateDoc(notificationRef, { read: true });
      });
      
      await Promise.all(updatePromises);
      return { success: true };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  const value = {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
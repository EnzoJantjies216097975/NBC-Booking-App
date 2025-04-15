import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';

// Define types
type Notification = {
  id: string;
  userId: string;
  productionId?: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: Timestamp;
};

type NotificationContextType = {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (notificationId: string) => Promise<{ success: boolean; error?: string }>;
  markAllAsRead: () => Promise<{ success: boolean; error?: string }>;
};

// Create the context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Custom hook to use the notification context
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

type NotificationProviderProps = {
  children: ReactNode;
};

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
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
      } as Notification));
      
      setNotifications(notificationsList);
      setUnreadCount(notificationsList.filter(n => !n.read).length);
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser]);

  // Mark notification as read
  async function markAsRead(notificationId: string) {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true
      });
      return { success: true };
    } catch (error: any) {
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
    } catch (error: any) {
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
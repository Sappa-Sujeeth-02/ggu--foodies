import React, { useEffect } from 'react';
import { messaging, getToken } from '../firebase.js';
import axios from 'axios';
import { useRestaurantContext } from '../context/RestaurantContext';

const PushNotificationSetUp = ({ userId }) => {
  const { rToken, restaurant, backendURL } = useRestaurantContext();
  const isRestaurantUser = !!rToken; // Check if the user is a restaurant

  useEffect(() => {
    const requestPermissionAndSendToken = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const token = await getToken(messaging, {
            vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
          });
          console.log('FCM Token:', token);

          if (isRestaurantUser && restaurant?._id) {
            // Send token to restaurant endpoint
            await axios.post(
              `${backendURL}/api/restaurant/save-fcm-token`,
              { fcmToken: token },
              { headers: { rtoken: rToken } }
            );
            console.log('Restaurant FCM token sent to server');
          } else if (userId) {
            // Send token to user endpoint
            await axios.post(`${backendURL}/api/notifications/save-fcm-token`, {
              userId,
              fcmToken: token,
            });
            console.log('User FCM token sent to server');
          }
        } else {
          console.warn('Notification permission denied');
        }
      } catch (err) {
        console.error('Error getting token or sending to server:', err);
      }
    };

    if (userId || (isRestaurantUser && restaurant?._id)) {
      requestPermissionAndSendToken();
    }
  }, [userId, rToken, restaurant, backendURL]);

  return null;
};

export default PushNotificationSetUp;
import React, { useEffect } from 'react';
import { messaging, onMessage } from '../firebase.js';

const NotificationHandler = () => {
  useEffect(() => {
    const listenForMessages = () => {
      onMessage(messaging, (payload) => {
        console.log('Message received:', payload);

        new Notification(payload.notification.title, {
          body: payload.notification.body,
          icon: 'https://cdn-icons-png.flaticon.com/512/1827/1827392.png',
        });
      });
    };

    listenForMessages();
  }, []);

  return null;
};

export default NotificationHandler;
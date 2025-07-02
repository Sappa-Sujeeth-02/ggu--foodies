importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAtEq7n76bsl2APZX0HkFokU3roQ-_OI0I",
  authDomain: "ggufoodies.firebaseapp.com",
  projectId: "ggufoodies",
  storageBucket: "ggufoodies.appspot.com",
  messagingSenderId: "400975402617",
  appId: "1:400975402617:web:2fceccb45b87b5da2fa6a8",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);
  const { title, body } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon: 'https://cdn-icons-png.flaticon.com/512/1827/1827392.png',
  });
});
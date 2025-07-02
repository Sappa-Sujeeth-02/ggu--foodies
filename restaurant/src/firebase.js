// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyAtEq7n76bsl2APZX0HkFokU3roQ-_OI0I",
  authDomain: "ggufoodies.firebaseapp.com",
  projectId: "ggufoodies",
  storageBucket: "ggufoodies.appspot.com",
  messagingSenderId: "400975402617",
  appId: "1:400975402617:web:2fceccb45b87b5da2fa6a8",
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export { messaging, getToken, onMessage };

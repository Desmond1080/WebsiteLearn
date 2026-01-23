// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAu1GtE8POWcXCgrkVVPYdjxTZ3ANoNdIw",
  authDomain: "websitetest1-20372.firebaseapp.com",
  projectId: "websitetest1-20372",
  storageBucket: "websitetest1-20372.firebasestorage.app",
  messagingSenderId: "990270998475",
  appId: "1:990270998475:web:6397f4ba210f64d234584e",
  measurementId: "G-ZB12X1QX20"
};
// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const analytics = firebase.analytics();
const messaging = firebase.messaging();

//request permission and get token
function requestPermissionAndGetToken() {
  Notification.requestPermission().then((permission) => {
    if(permission === 'granted') {
      getToken(messaging, {vapidKey: 'BJ3U4UwVjO2xNajVuWQ4xByc67YuJH0qmPi9-CFODOlb6xnr-3NKMYUkmA5jvXNH63nSbHfBedFVsgq9eJanPA8'}).then((currentToken) => {
        if(currentToken) {
          console.log('Token received: ', currentToken);
        } else {
          console.log('No registration token available. Request permission to generate one.');
        }
      });
    }
  });
}


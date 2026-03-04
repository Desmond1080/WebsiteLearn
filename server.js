const express = require('express');
const compression = require('compression');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(compression());

// Add caching middleware for static files
app.use((req, res, next) => {
  // Cache static assets for 1 week (604800 seconds)
  if (req.url.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    res.set('Cache-Control', 'public, max-age=604800, immutable');
  }
  // Cache HTML files for 1 hour
  else if (req.url.match(/\.html$/)) {
    res.set('Cache-Control', 'public, max-age=3600');
  }
  // No cache for API responses
  else if (req.url.match(/^\/api\//)) {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
  next();
});

app.use(express.static('.'));

function initAdmin() {
  if (admin.apps.length) {
    return;
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    return;
  }

  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

initAdmin();

async function verifyAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : null;

    if (!token) {
      return res.status(401).json({ error: 'Missing auth token.' });
    }

    const decoded = await admin.auth().verifyIdToken(token);
    const userDoc = await admin.firestore().collection('Users').doc(decoded.uid).get();
    const role = userDoc.exists ? userDoc.data().role : null;

    if (role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required.' });
    }

    req.adminUid = decoded.uid;
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid auth token.' });
  }
}

app.post('/api/admin/create-doctor', verifyAdmin, async (req, res) => {
  try {
    const {
      name,
      username,
      specialization,
      description,
      room,
      gender,
      phoneNumber,
      email,
      password,
    } = req.body;

    if (!name || !username || !specialization || !gender || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });

    const userId = userRecord.uid;
    const firestore = admin.firestore();

    await firestore.collection('Users').doc(userId).set({
      name,
      username,
      description: description || '',
      gender,
      email,
      role: 'doctor',
      imageUrl: '',
      phoneNumber: phoneNumber || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await firestore.collection('Doctors').doc(userId).set({
      userId,
      name,
      specialization,
      room: room || '',
      imageUrl: '',
      description: description || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.json({ success: true, uid: userId });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
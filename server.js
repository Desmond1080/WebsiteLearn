const express = require('express');
const compression = require('compression');
const cors = require('cors');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());
app.use(cors());

// store otp temporarily in memory (consider using a database for production)
const otpStore = new Map();

// configure email transport using gmail SMTP (or use environment variables for better security)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Generate a 6-digit OTP
function generateOTP(){
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// send otp endpoint 
app.post('/api/send-otp', async (req, res) => {
  try{
    const { email } = req.body;

    // check if user exists in firebase 
    const usersSnapshot = await db.collection('Users').where('email', '==', email).get();
    if(usersSnapshot.empty){
      return res.status(404).json({ error: 'User not found.' });
    }
    
    //generate otp 
    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000; // OTP valid for 5 minutes
    
    // store otp 
    otpStore.set(email, { otp, expiresAt });

    // semd email 
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset OTP',
      html: `
      <h2>Password Reset OTP</h2>
      <p>Your OTP for password reset is: <strong>${otp}</strong></p>
      <p>This OTP is valid for 5 minutes.</p>
      `
    });

    res.json({ success: true, message: 'OTP sent to email.' });
  } catch(error){
    console.error('Error sending OTP:', error);
    res.status(500).json({ error: 'Failed to send OTP.' });
  }
});

// verify otp endpoint
app.post('/api/verify-otp', async(req, res) => {
  try{
    const { email, otp } = req.body;
    
    const stored = otpStore.get(email);

    if(!stored){
      return res.status(400).json({
        error: 'No OTP found for this email. Please request a new one.'
      })
    }

    if(Date.now() > stored.expiresAt){
      otpStore.delete(email);
      return res.status(400).json({error: 'OTP has expired. Please request a new one.'});
    }

    if(stored.otp != otp){
      return res.status(400).json({error: 'Invalid OTP. Please try again.'});
    }

    // otp verified - generate reset token 
    const resetToken = Math.random().toString(36).substr(2);
    otpStore.set(email, { resetToken, expiresAt: Date.now() + 15 * 60 * 1000 }); // reset token valid for 15 minutes

    res.json({ success: true, resetToken });

  } catch(error){
    console.error('Error verifying OTP:', error);
    res.status(500).json({ error: 'Failed to verify OTP.' });
  }
});

// reset password endpoint 
app.post('/api/reset-password', async(req, res) => {
  try{
    const { email, resetToken, newPassword } = req.body;

    const stored = otpStore.get(email);

    if(!stored || stored.resetToken !== resetToken){
      return res.status(400).json({ error: 'Invalid or expired reset token.' });
    }

    if(Date.now() > stored.expiresAt){
      otpStore.delete(email);
      return res.status(400).json({ error: 'Reset token has expired. Please request a new one.' });
    }

    // get user from firestore 
    const usersSnapshot = await db.collection('Users').where('email', '==', email).get();

    if(usersSnapshot.empty){
      return res.status(404).json({ error: 'User not found.' });
    }

    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;
    
    // update password in firebase auth
    await admin.auth().updateUser(userId, { password: newPassword });

    // clean up otp store
    otpStore.delete(email);

    res.json({ success: true, message: 'Password has been reset successfully.' });
  } catch(error){
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Failed to reset password.' });
  }
});

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

// Initialize Firestore database reference
const db = admin.firestore();

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
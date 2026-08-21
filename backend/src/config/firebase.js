const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');
const fs = require('fs');

let serviceAccount = null;

// 1. Try environment variables (JSON string or base64)
const envCredentials =
  process.env.FIREBASE_SERVICE_ACCOUNT ||
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
  process.env.FIREBASE_CREDENTIALS ||
  process.env.FIREBASE_CONFIG;

if (envCredentials) {
  try {
    serviceAccount = JSON.parse(envCredentials);
  } catch {
    try {
      const decoded = Buffer.from(envCredentials, 'base64').toString('utf-8');
      serviceAccount = JSON.parse(decoded);
    } catch (parseErr) {
      console.warn('Could not parse Firebase credentials from environment:', parseErr.message);
    }
  }
}

// 2. Try disk paths
if (!serviceAccount) {
  const possiblePaths = [
    path.join(__dirname, '../../firebase.json'),
    path.join(process.cwd(), 'firebase.json'),
    path.join(__dirname, '../../firebase-service-account.json'),
    path.join(process.cwd(), 'firebase-service-account.json'),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        serviceAccount = require(p);
        break;
      } catch (e) {
        console.warn(`Could not load credentials from ${p}:`, e.message);
      }
    }
  }
}

let app;
if (getApps().length === 0) {
  if (serviceAccount) {
    app = initializeApp({
      credential: cert(serviceAccount),
    });
  } else {
    app = initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  }
} else {
  app = getApps()[0];
}

const db = getFirestore(app);

module.exports = { app, db };
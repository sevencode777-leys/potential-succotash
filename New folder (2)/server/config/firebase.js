const admin = require('firebase-admin');

// Check for required environment variables
const projectId = process.env.FIREBASE_PROJECT_ID;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

if (!projectId || !privateKey || !clientEmail) {
  throw new Error('Missing Firebase Admin SDK credentials. Please set FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL environment variables.');
}

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: projectId,
    privateKey: privateKey.replace(/\\n/g, '\n'), // Handle escaped newlines in private key
    clientEmail: clientEmail,
  }),
});

// Helper function to verify ID tokens
async function verifyIdToken(token) {
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    throw new Error('Invalid or expired token: ' + error.message);
  }
}

module.exports = {
  admin,
  verifyIdToken,
};
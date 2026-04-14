const admin = require('firebase-admin');

let firebaseApp = null;

function getFirebaseAdmin() {
    if (!firebaseApp) {
        const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
        if (!privateKey || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PROJECT_ID) {
            throw new Error('Missing Firebase Admin environment variables');
        }
        firebaseApp = admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey,
            }),
        });
    }
    return firebaseApp;
}

async function verifyFirebaseToken(idToken) {
    const app = getFirebaseAdmin();
    return admin.auth(app).verifyIdToken(idToken);
}

module.exports = { verifyFirebaseToken };

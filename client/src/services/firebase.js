import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

const firebaseConfig = {
    apiKey: 'AIzaSyDk9UpUZvAwpZ2eWqclnWMVPBnoPhrZNjY',
    authDomain: 'shoghli-886e8.firebaseapp.com',
    projectId: 'shoghli-886e8',
    storageBucket: 'shoghli-886e8.firebasestorage.app',
    messagingSenderId: '350958501471',
    appId: '1:350958501471:web:0ad8e134602d32b2e665ea',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth, RecaptchaVerifier, signInWithPhoneNumber };

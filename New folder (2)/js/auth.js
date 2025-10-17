// js/auth.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, signInWithPopup, signInWithRedirect, GoogleAuthProvider, RecaptchaVerifier, signInWithPhoneNumber, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import config from './config.js';

// Initialize Firebase
const app = initializeApp(config.firebaseConfig);
const auth = getAuth(app);

// Language handling
let currentLang = localStorage.getItem('nibrasLang') || 'ar';

const errorMessages = {
  ar: {
    googleSignInError: 'فشل في تسجيل الدخول باستخدام Google.',
    phoneSignInError: 'فشل في إرسال رمز التحقق.',
    confirmCodeError: 'رمز التحقق غير صحيح.',
    signOutError: 'فشل في تسجيل الخروج.',
    networkError: 'خطأ في الشبكة.',
    invalidPhone: 'رقم الهاتف غير صحيح.',
  },
  en: {
    googleSignInError: 'Google sign-in failed.',
    phoneSignInError: 'Failed to send verification code.',
    confirmCodeError: 'Invalid verification code.',
    signOutError: 'Sign-out failed.',
    networkError: 'Network error.',
    invalidPhone: 'Invalid phone number.',
  },
  tr: {
    googleSignInError: 'Google giriş başarısız.',
    phoneSignInError: 'Doğrulama kodu gönderilemedi.',
    confirmCodeError: 'Geçersiz doğrulama kodu.',
    signOutError: 'Çıkış başarısız.',
    networkError: 'Ağ hatası.',
    invalidPhone: 'Geçersiz telefon numarası.',
  }
};

function getErrorMessage(key) {
  return errorMessages[currentLang][key] || 'خطأ غير معروف';
}

// Auth state listener and UI update
function initAuth() {
  onAuthStateChanged(auth, (user) => {
    const authStatus = document.getElementById('authStatus');
    const signOutBtn = document.getElementById('signOutBtn');
    const googleSignInBtn = document.getElementById('googleSignInBtn');
    const phoneSignInForm = document.getElementById('phoneSignInForm');
    if (user) {
      authStatus.textContent = user.email || user.phoneNumber || 'مستخدم';
      signOutBtn.style.display = 'block';
      if (googleSignInBtn) googleSignInBtn.style.display = 'none';
      if (phoneSignInForm) phoneSignInForm.style.display = 'none';
    } else {
      authStatus.textContent = '';
      signOutBtn.style.display = 'none';
      if (googleSignInBtn) googleSignInBtn.style.display = 'block';
      if (phoneSignInForm) phoneSignInForm.style.display = 'block';
    }
  });
}

// Google Sign-In
async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    if (error.code === 'auth/popup-blocked') {
      // Fallback to redirect for mobile or blocked popup
      await signInWithRedirect(auth, provider);
    } else {
      alert(getErrorMessage('googleSignInError') + ' ' + error.message);
    }
  }
}

// Phone Sign-In
let confirmationResult = null;

async function signInWithPhone(phoneNumber) {
  // Format to E.164 if not already
  if (!phoneNumber.startsWith('+')) {
    alert(getErrorMessage('invalidPhone'));
    return;
  }
  try {
    // Create invisible reCAPTCHA
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'phoneSubmitBtn', {
        size: 'invisible',
      });
    }
    confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier);
    return confirmationResult;
  } catch (error) {
    alert(getErrorMessage('phoneSignInError') + ' ' + error.message);
  }
}

// Confirm Phone Code
async function confirmPhoneCode(code) {
  if (!confirmationResult) {
    alert(getErrorMessage('confirmCodeError'));
    return;
  }
  try {
    await confirmationResult.confirm(code);
  } catch (error) {
    alert(getErrorMessage('confirmCodeError') + ' ' + error.message);
  }
}

// Sign Out
async function signOutUser() {
  try {
    await signOut(auth);
  } catch (error) {
    alert(getErrorMessage('signOutError') + ' ' + error.message);
  }
}

// Export
export { auth, initAuth, signInWithGoogle, signInWithPhone, confirmPhoneCode, signOutUser };
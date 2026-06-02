import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { sendLoginEmail } from '../utils/email';
import { SEO } from '../components/SEO';
import { useAuthStore } from '../store/authStore';
import { Eye, EyeOff } from 'lucide-react';
import { executeRecaptcha } from '../utils/recaptcha';

export const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Default to signup mode first to make it big and visible
  const initialMode = searchParams.get('mode') || 'signup';
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [showOtpField, setShowOtpField] = useState(false);
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Clear err/msg states beautifully on toggles to prevent stale cached error residuals
  const handleToggleMode = (loginMode: boolean) => {
    setIsLogin(loginMode);
    setError('');
    setMessage('');
    setShowPassword(false);
  };

  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'login') {
      setIsLogin(true);
    } else if (mode === 'signup') {
      setIsLogin(false);
    }
    setError('');
    setMessage('');
  }, [searchParams]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);
    
    try {
      // Execute Google reCAPTCHA Enterprise
      const recaptchaToken = await executeRecaptcha(isLogin ? 'LOGIN' : 'SIGNUP');
      if (recaptchaToken) {
        console.log(`[reCAPTCHA] Token executed successfully for ${isLogin ? 'LOGIN' : 'SIGNUP'}:`, recaptchaToken);
      }

      if (isLogin) {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        
        const userEmail = (cred.user.email || email).toLowerCase().trim();
        const isAdmin = userEmail === 'webhub2811@gmail.com' || userEmail === 'prime.elitestore02@gmail.com' || userEmail === 'primeelitestore02@gmail.com';

        let userDoc;
        try {
          userDoc = await getDoc(doc(db, 'users', cred.user.uid));
        } catch (fErr) {
          handleFirestoreError(fErr, OperationType.GET, `users/${cred.user.uid}`);
        }

        const userData = userDoc.exists() ? userDoc.data() : null;
        const phone = userData?.phone || userData?.phoneNumber || '';

        if (isAdmin) {
          try {
            await setDoc(doc(db, 'users', cred.user.uid), {
              role: 'admin',
              profileCompleted: true,
              email: userEmail,
              name: userData?.name || cred.user.displayName || 'Admin User'
            }, { merge: true });
          } catch (fErr) {
            handleFirestoreError(fErr, OperationType.WRITE, `users/${cred.user.uid}`);
          }
          
          navigate('/admin');
          return;
        }

        if (phone) {
          sendLoginEmail(userData?.name || cred.user.displayName || 'Customer', userEmail, phone).catch(emailErr => {
            console.error('[Email] Background sign-in email dispatch failed:', emailErr);
          });
          const redirect = searchParams.get('redirect');
          if (redirect) {
            navigate(redirect.startsWith('/') ? redirect : `/${redirect}`);
          } else {
            navigate('/');
          }
        } else {
          navigate('/');
        }
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        
        const userEmail = email.toLowerCase().trim();
        const isAdmin = userEmail === 'webhub2811@gmail.com' || userEmail === 'prime.elitestore02@gmail.com' || userEmail === 'primeelitestore02@gmail.com';

        if (isAdmin) {
          try {
            await setDoc(doc(db, 'users', cred.user.uid), {
              email: userEmail,
              name,
              provider: 'email',
              role: 'admin',
              profileCompleted: true,
              createdAt: new Date().toISOString()
            });
          } catch (fErr) {
            handleFirestoreError(fErr, OperationType.WRITE, `users/${cred.user.uid}`);
          }
          navigate('/admin');
        } else {
          try {
            await setDoc(doc(db, 'users', cred.user.uid), {
              email: userEmail,
              name,
              phoneNumber: '',
              phoneVerified: false,
              provider: 'email',
              role: 'customer',
              profileCompleted: false,
              createdAt: new Date().toISOString()
            });
          } catch (fErr) {
            handleFirestoreError(fErr, OperationType.WRITE, `users/${cred.user.uid}`);
          }
          navigate('/');
        }
      }
    } catch (err: any) {
      console.error("Auth process error:", err);
      let displayMessage = err?.message || '';
      if (err?.code === 'auth/operation-not-allowed' || displayMessage.includes('auth/operation-not-allowed') || displayMessage.includes('operation-not-allowed')) {
        displayMessage = "Email/Password sign-up is not enabled in your Firebase project yet.\n\nTo enable manual registration:\n1. Open your Firebase Console\n2. Go to 'Authentication' > 'Sign-in method'\n3. Click 'Add new provider'\n4. Select 'Email/Password', toggle 'Enable', and click 'Save'.";
      } else {
        try {
          if (displayMessage.startsWith('{')) {
            const parsed = JSON.parse(displayMessage);
            displayMessage = parsed.error || 'Firestore connection issue.';
          }
        } catch (_) {}
      }
      setError(displayMessage || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError('');
    setIsSubmitting(true);
    
    // Execute Google reCAPTCHA Enterprise
    const recaptchaToken = await executeRecaptcha('GOOGLE_LOGIN');
    if (recaptchaToken) {
      console.log('[reCAPTCHA] Token executed successfully for GOOGLE_LOGIN:', recaptchaToken);
    }

    const provider = new GoogleAuthProvider();
    try {
      const cred = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(cred);
      if (credential?.accessToken) {
        useAuthStore.getState().setAccessToken(credential.accessToken);
      }
      
      const userEmail = (cred.user.email || '').toLowerCase().trim();
      const isAdmin = userEmail === 'webhub2811@gmail.com' || userEmail === 'prime.elitestore02@gmail.com' || userEmail === 'primeelitestore02@gmail.com';

      let userDoc;
      try {
        userDoc = await getDoc(doc(db, 'users', cred.user.uid));
      } catch (fErr) {
        handleFirestoreError(fErr, OperationType.GET, `users/${cred.user.uid}`);
      }
      
      if (isAdmin) {
        try {
          await setDoc(doc(db, 'users', cred.user.uid), {
            email: userEmail,
            name: cred.user.displayName || 'Admin User',
            provider: 'google',
            role: 'admin',
            profileCompleted: true,
            createdAt: new Date().toISOString()
          }, { merge: true });
        } catch (fErr) {
          handleFirestoreError(fErr, OperationType.WRITE, `users/${cred.user.uid}`);
        }
        
        navigate('/admin');
        return;
      }

      let isCompleted = false;
      let phoneNum = '';

      if (userDoc.exists()) {
        const userData = userDoc.data();
        phoneNum = userData?.phone || userData?.phoneNumber || '';
        isCompleted = userData?.profileCompleted || (!!phoneNum);
      }

      if (isCompleted && phoneNum) {
        sendLoginEmail(cred.user.displayName || 'Customer', userEmail, phoneNum).catch(emailErr => {
          console.error('[Email] Background Google sign-in email dispatch failed:', emailErr);
        });
        
        const redirect = searchParams.get('redirect');
        if (redirect) {
          navigate(redirect.startsWith('/') ? redirect : `/${redirect}`);
        } else {
          navigate('/');
        }
      } else {
        if (!userDoc.exists()) {
          try {
            await setDoc(doc(db, 'users', cred.user.uid), {
              email: userEmail,
              name: cred.user.displayName || 'Customer',
              phoneNumber: '',
              phoneVerified: false,
              provider: 'google',
              role: 'customer',
              profileCompleted: false,
              createdAt: new Date().toISOString()
            });
          } catch (fErr) {
            handleFirestoreError(fErr, OperationType.CREATE, `users/${cred.user.uid}`);
          }
        }
        navigate('/');
      }
    } catch (err: any) {
      console.error("Google Auth error:", err);
      let displayMessage = err?.message || '';
      if (displayMessage.includes('auth/popup-closed-by-user') || displayMessage.includes('popup-closed-by-user') || err?.code === 'auth/popup-closed-by-user') {
        displayMessage = "Google session setup was closed before completing. Please try continuing again or fill in the forms manually.";
      } else {
        try {
          if (displayMessage.startsWith('{')) {
            const parsed = JSON.parse(displayMessage);
            displayMessage = parsed.error || 'Google Authentication failed.';
          }
        } catch (_) {}
      }
      setError(displayMessage || 'Google Authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    setError('');
    setMessage('');
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Password reset email sent! Check your inbox.');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="pt-32 min-h-screen flex items-center justify-center px-6 pb-20 bg-black">
      <SEO 
        title={isLogin ? 'Login | Prime Elite Store' : 'Signup | Prime Elite Store'}
        description="Login or create an account at Prime Elite Store to discover our luxury collection and manage your premium orders."
        url="https://primeelitestore.netlify.app/login"
      />
      <div className="w-full max-w-lg bg-zinc-950/80 p-8 md:p-10 rounded-2xl border border-white/10 backdrop-blur-md">
        
        {/* Toggle Option Tabs - Big and Prominent */}
        <div className="flex bg-black/50 p-1 rounded-xl border border-white/10 mb-8 select-none">
          <button 
            type="button" 
            onClick={() => handleToggleMode(false)}
            className={`flex-1 py-4.5 rounded-lg text-sm tracking-widest uppercase font-bold transition-all text-center ${
              !isLogin 
                ? 'gold-gradient-bg text-black shadow-lg scale-100 font-extrabold' 
                : 'text-gray-400 hover:text-white hover:scale-95'
            }`}
            style={{ fontSize: '13px' }}
          >
            Create Account (Signup)
          </button>
          <button 
            type="button" 
            onClick={() => handleToggleMode(true)}
            className={`flex-1 py-4.5 rounded-lg text-sm tracking-widest uppercase font-bold transition-all text-center ${
              isLogin 
                ? 'gold-gradient-bg text-black shadow-lg scale-100 font-extrabold' 
                : 'text-gray-400 hover:text-white hover:scale-95'
            }`}
            style={{ fontSize: '13px' }}
          >
            Sign In (Login)
          </button>
        </div>

        <h1 className="text-2xl md:text-3xl font-display font-light text-center mb-6 text-white uppercase tracking-wider">
          {isLogin ? (
            <>Welcome <span className="font-bold gold-gradient-text">Back</span></>
          ) : (
            <>Join the <span className="font-bold gold-gradient-text">Elite Club</span></>
          )}
        </h1>

        <p className="text-gray-400 text-xs md:text-sm text-center -mt-3 mb-8">
          {isLogin 
            ? 'Sign in to manage your luxury credentials and orders' 
            : 'Register today to explore our handpicked private catalog'
          }
        </p>
        
        <form onSubmit={handleAuth} className="flex flex-col gap-5">
          {!isLogin && (
            <div>
              <label className="block text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-2">Full Name</label>
              <input 
                type="text" 
                placeholder="e.g. John Doe" 
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="bg-black border border-white/10 p-4 rounded text-sm focus:border-gold-500/50 outline-none w-full text-white transition-all uppercase tracking-wider font-mono" 
              />
            </div>
          )}
          
          <div>
            <label className="block text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-2">Email Address</label>
            <input 
              type="email" 
              placeholder="e.g. name@domain.com"
              required 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="bg-black border border-white/10 p-4 rounded text-sm focus:border-gold-500/50 outline-none w-full text-white transition-all font-mono" 
            />
          </div>
          
          <div>
            <label className="block text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-2">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'} 
                placeholder="••••••••••••" 
                required={!isLogin || password.length > 0}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="bg-black border border-white/10 p-4 pr-12 rounded text-sm focus:border-gold-500/50 outline-none w-full text-white transition-all font-mono" 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors cursor-pointer select-none focus:outline-none"
                tabIndex={-1}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-950/40 border border-red-500/30 text-red-400 text-xs py-4 px-5 rounded-lg text-left font-mono whitespace-pre-line leading-relaxed">
              {error}
            </div>
          )}
          {message && (
            <div className="bg-green-950/40 border border-green-500/30 text-green-400 text-xs py-3 px-4 rounded-lg text-center font-mono">
              {message}
            </div>
          )}
          
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="gold-gradient-bg text-black font-extrabold uppercase tracking-widest py-4.5 rounded mt-4 hover:scale-[1.01] active:translate-y-[1px] transition-transform shadow-lg disabled:opacity-50 select-none cursor-pointer"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                Processing...
              </span>
            ) : (
              isLogin ? 'Sign In' : 'Register Now'
            )}
          </button>
        </form>

        <div className="mt-4">
          <button 
            type="button" 
            disabled={isSubmitting}
            onClick={handleGoogleAuth}
            className="w-full bg-white text-black font-extrabold uppercase tracking-widest py-4.5 rounded hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 border border-white select-none cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69a5.59 5.59 0 01-2.42 3.7v3.08h3.91c2.28-2.1 3.56-5.17 3.56-8.63z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.91-3.08c-1.08.72-2.48 1.16-4.05 1.16-3.11 0-5.74-2.11-6.68-4.96H1.21v3.19C3.18 21.88 7.31 24 12 24z" />
              <path fill="#FBBC05" d="M5.32 14.21A7.16 7.16 0 014.9 12c0-.77.13-1.52.32-2.21V6.6H1.21A11.94 11.94 0 000 12c0 1.92.45 3.79 1.21 5.4l4.11-3.19z" />
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.96 1.19 15.24 0 12 0 7.31 0 3.18 2.11 1.21 5.4l4.11 3.19c.94-2.85 3.57-4.96 6.68-4.96z" />
            </svg>
            Continue with Google
          </button>
        </div>

        {isLogin && (
          <div className="mt-6 text-center select-none">
            <button onClick={handleForgotPassword} className="text-xs text-gray-400 hover:text-white transition-colors underline uppercase tracking-widest font-mono">
              Forgot Password?
            </button>
          </div>
        )}
        
        <div className="mt-8 pt-6 border-t border-white/5 text-center text-xs text-gray-500 select-none">
          {isLogin ? "Don't have an eye-safe premium account? " : "Already registered as an elite club peer? "}
          <button 
            type="button"
            onClick={() => handleToggleMode(!isLogin)} 
            className="text-gold-500 hover:underline hover:text-gold-400 font-bold ml-1 uppercase font-mono tracking-wider"
          >
            {isLogin ? 'Create Account' : 'Log In Instead'}
          </button>
        </div>
      </div>
    </div>
  );
};

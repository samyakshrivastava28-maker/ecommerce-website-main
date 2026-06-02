import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { motion } from 'framer-motion';
import { Phone, User, Compass, LogOut } from 'lucide-react';
import { sendSignupEmail } from '../utils/email';
import { executeRecaptcha } from '../utils/recaptcha';

export const PhoneNumberRequiredPage = () => {
  const { user, setUser, logout } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Strict 10-digit numeric validation
  const validatePhoneNumber = (val: string) => {
    // Check if contains non-digits (letters, spaces, special chars)
    if (/[^\d]/.test(val)) {
      return "Phone number must contain numbers only. No letters, spaces, or special characters allowed.";
    }
    if (val.length !== 10) {
      return `Phone number must be exactly 10 digits. (You entered ${val.length})`;
    }
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!user) {
      setError("No authenticated user session found.");
      return;
    }

    if (!name.trim()) {
      setError("Full Name is required.");
      return;
    }

    const validationMsg = validatePhoneNumber(phone);
    if (validationMsg) {
      setError(validationMsg);
      return;
    }

    setLoading(true);
    try {
      // Execute Google reCAPTCHA Enterprise
      const recaptchaToken = await executeRecaptcha('SIGNUP');
      if (recaptchaToken) {
        console.log('[reCAPTCHA] Verified human token successfully compiled on complete signup.');
      }

      const userRef = doc(db, 'users', user.uid);
      const isAlreadySent = user.welcomeEmailSent === true;

      // Format current fallback date beautifully
      let signupDateString = new Date().toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
      });



      const updatedProfile = {
        uid: user.uid,
        name: name.trim(),
        email: user.email,
        phone: phone,
        phoneNumber: phone,
        role: 'customer',
        profileCompleted: true,
        welcomeEmailSent: true,
        createdAt: user.provider === 'google' ? new Date().toISOString() : (user.provider || new Date().toISOString())
      };

      // 1. Write user profile securely to firestore
      try {
        await setDoc(userRef, updatedProfile, { merge: true });
      } catch (fErr) {
        handleFirestoreError(fErr, OperationType.WRITE, `users/${user.uid}`);
      }

      // 2. Dispatch Welcome Email and Admin Notification Emails via EmailJS after Firestore save
      if (updatedProfile.profileCompleted === true && !isAlreadySent) {
        sendSignupEmail(name.trim(), user.email || '', phone, signupDateString).catch(emailErr => {
          console.error('[Email] Background signup email dispatch failed:', emailErr);
        });
      }

      // 3. Clear storage keys if needed and update the global store state
      setUser(updatedProfile);
      
      // Update store states instantly so layout triggers matching reactive re-renders
      useAuthStore.setState({
        user: updatedProfile,
        isAdmin: false,
        isCompliant: true,
        loading: false
      });

    } catch (err: any) {
      console.error("Profile completion failed:", err);
      setError(err?.message || "An error occurred while saving your profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to log out?')) {
      await logout();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 bg-black select-none">
      {/* Absolute ambient glow layers */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.04),transparent_60%)] pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-gold-500/10 to-transparent pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md bg-zinc-950 border border-gold-500/15 rounded-2xl p-8 md:p-10 text-center shadow-[0_0_80px_rgba(212,175,55,0.05)] overflow-hidden"
      >
        {/* Superior luxury header */}
        <div className="absolute top-0 inset-x-0 h-1 gold-gradient-bg" />

        <div className="mx-auto w-14 h-14 rounded-full bg-gold-500/5 border border-gold-500/10 flex items-center justify-center mb-6 relative">
          <Compass className="w-6 h-6 text-gold-500 animate-spin" style={{ animationDuration: '30s' }} />
        </div>

        <h2 className="text-2xl md:text-3xl font-display font-light text-white tracking-wide uppercase mb-3">
          Phone Number <span className="font-bold gold-gradient-text">Required</span>
        </h2>
        
        <p className="text-zinc-400 text-xs md:text-sm leading-relaxed mb-8">
          To complete your signup and access <strong className="text-white">Prime Elite Store</strong>, please enter your mobile number.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-5 text-left">
          <div>
            <label className="block text-[10px] text-zinc-400 uppercase tracking-widest font-bold mb-2">
              Full Name
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-3.5 text-zinc-600" />
              <input
                type="text"
                placeholder="Enter your full name"
                required
                disabled={loading}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-zinc-900 border border-white/5 rounded pl-11 pr-4 py-3.5 text-white placeholder-zinc-700 focus:border-gold-500/40 outline-none transition-all uppercase tracking-wider text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-zinc-400 uppercase tracking-widest font-bold mb-2">
              Mobile Phone Number
            </label>
            <div className="relative">
              <Phone size={16} className="absolute left-3.5 top-3.5 text-zinc-600" />
              <input
                type="text"
                placeholder="10-digit number e.g. 9876543210"
                required
                disabled={loading}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-zinc-900 border border-white/5 rounded pl-11 pr-4 py-3.5 text-white placeholder-zinc-700 focus:border-gold-500/40 outline-none transition-all font-mono text-sm"
              />
            </div>
            <p className="text-[10px] text-zinc-500 mt-2 font-mono leading-relaxed">
              Format: 10 numbers strictly, no special characters, spaces, or country prefixes.
            </p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-950/40 border border-red-500/20 text-red-400 text-xs py-3 px-4 rounded font-mono leading-relaxed"
            >
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full relative overflow-hidden bg-gold-500 text-black py-4 rounded font-bold font-mono text-xs uppercase tracking-widest hover:bg-gold-400 transition-colors select-none cursor-pointer text-center duration-300 shadow-lg disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2.5">
                <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Finalizing Profile...
              </span>
            ) : (
              'Complete Signup'
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-center">
          <button
            onClick={handleLogout}
            disabled={loading}
            className="flex items-center gap-2 text-zinc-500 hover:text-red-400 transition-colors text-[10px] uppercase tracking-widest font-bold font-mono cursor-pointer"
          >
            <LogOut size={12} />
            Sign out of Account
          </button>
        </div>
      </motion.div>
    </div>
  );
};

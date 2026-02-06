import React, { useState } from 'react';
import { auth, db } from '../App'; 
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const Register = ({ setIsRegistering }) => {
  // Local state to manage form inputs
  const [data, setData] = useState({ 
    email: '', 
    password: '', 
    name: '', 
    branch: 'CSE', 
    year: 1 
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    // Validation: Ensure it is a college email
    if (!data.email.toLowerCase().endsWith('@srit.ac.in')) {
      setError('Registration restricted to @srit.ac.in domain only!');
      return;
    }

    setLoading(true);
    try {
      // 1. Create User in Firebase Auth
      const userCred = await createUserWithEmailAndPassword(auth, data.email, data.password);
      
      // 2. Create User Profile in Firestore
      await setDoc(doc(db, "users", userCred.user.uid), {
        uid: userCred.user.uid,
        name: data.name,
        email: data.email.toLowerCase(),
        branch: data.branch,
        year: Number(data.year),
        totalPoints: 0,
        isSenior: Number(data.year) > 2,
        createdAt: serverTimestamp() 
      });
      
      alert("Account Created Successfully!");
      
      // 3. IMPORTANT: This line sends the user back to the Login screen
      if (typeof setIsRegistering === 'function') {
        setIsRegistering(false);
      }
      
    } catch (err) {
      // Friendly error handling
      if (err.code === 'auth/email-already-in-use') {
        setError("This email is already registered.");
      } else if (err.code === 'auth/weak-password') {
        setError("Password should be at least 6 characters.");
      } else {
        setError(`Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f3f2ef] p-6 font-sans">
      {/* Main Professional Card Container */}
      <div className="max-w-xl w-full bg-white shadow-2xl rounded-3xl overflow-hidden border border-gray-100">
        
        {/* Professional Header Section (The Colored Box) */}
        <div className="bg-indigo-700 p-8 text-center text-white">
          <h2 className="text-3xl font-bold tracking-tight">SRIT Career Connect</h2>
          <p className="text-indigo-100 mt-1 opacity-80 uppercase text-xs tracking-widest font-semibold">
            Join the Campus Network
          </p>
        </div>
        
        <form onSubmit={handleRegister} className="p-8 space-y-5">
          {/* Error Message Display */}
          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-4 rounded-xl border border-red-100 font-bold animate-pulse">
              ⚠️ {error}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name Input */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Full Name</label>
              <input 
                className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all" 
                placeholder="Ex: John Doe" 
                onChange={(e) => setData({...data, name: e.target.value})} 
                required 
              />
            </div>
            {/* Email Input */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">College Email</label>
              <input 
                className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all" 
                type="email" 
                placeholder="id@srit.ac.in" 
                onChange={(e) => setData({...data, email: e.target.value})} 
                required 
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Password</label>
            <input 
              className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all" 
              type="password" 
              placeholder="Minimum 6 characters" 
              onChange={(e) => setData({...data, password: e.target.value})} 
              required 
            />
          </div>
          
          <div className="flex gap-4">
            {/* Branch Dropdown */}
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Branch</label>
              <select 
                className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer" 
                onChange={(e) => setData({...data, branch: e.target.value})}
              >
                <option value="CSE">CSE</option>
                <option value="ECE">ECE</option>
                <option value="EEE">EEE</option>
                <option value="ME">Mech</option>
              </select>
            </div>
            {/* Year Dropdown */}
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Current Year</label>
              <select 
                className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer" 
                onChange={(e) => setData({...data, year: e.target.value})}
              >
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>
          </div>
          
          {/* Main Submit Button */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 text-white p-4 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 disabled:bg-gray-400 active:scale-95"
          >
            {loading ? 'Processing...' : 'Create My Account'}
          </button>

          {/* Navigation Button (Back to Login) */}
          <div className="text-center pt-2">
            <button 
              type="button"
              onClick={() => setIsRegistering(false)}
              className="text-indigo-600 text-sm font-bold hover:underline transition-all"
            >
              Already have an account? Sign In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
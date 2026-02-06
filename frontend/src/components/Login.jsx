import React, { useState } from 'react';
import { auth } from '../App';
import { signInWithEmailAndPassword } from 'firebase/auth';

const Login = ({ setIsRegistering }) => { 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError("Invalid credentials. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 font-sans">
      {/* Dialogue Box: Changed to Muted Beige [#F5F5DC] */}
      <div className="w-full max-w-md bg-[#F5F5DC] rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
        
        {/* Header: Changed to Maroon [#800000] */}
        <div className="bg-[#800000] p-10 text-center text-white">
          {/* Title: Forced to all UPPERCASE */}
          <h1 className="text-4xl font-black uppercase tracking-tighter">SRIT CONNECT</h1>
          <p className="text-gray-300 text-xs mt-2 uppercase tracking-widest font-bold opacity-80">
            Advance Your Career
          </p>
        </div>

        <form onSubmit={handleLogin} className="p-8 space-y-6">
          {error && (
            <div className="text-red-700 bg-red-100 p-3 rounded-lg text-xs font-bold border border-red-200">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <input 
              type="email" 
              placeholder="College Email"
              className="w-full p-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#800000] outline-none transition-all"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input 
              type="password" 
              placeholder="Password"
              className="w-full p-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#800000] outline-none transition-all"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Main Button: Maroon [#800000] */}
          <button 
            type="submit" 
            className="w-full bg-[#800000] hover:bg-[#600000] text-white font-bold py-4 rounded-xl shadow-lg transition transform active:scale-95 uppercase tracking-wide"
          >
            Sign In
          </button>

          <div className="text-center pt-4 border-t border-gray-300">
            <p className="text-gray-600 text-sm mb-3">New here?</p>
            <button 
              type="button"
              onClick={() => setIsRegistering(true)} 
              className="w-full border-2 border-[#800000] text-[#800000] font-bold py-3 rounded-xl hover:bg-[#800000] hover:text-white transition uppercase text-sm tracking-tight"
            >
              Join Now / Create Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { 
  getFirestore, doc, onSnapshot, collection, 
  query, where 
} from "firebase/firestore"; 
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Component Imports
import Navbar from './components/Navbar';
import PostFeed from './components/PostFeed';
import CreatePost from './components/CreatePost';
import Login from './components/Login';
import Register from './components/Register';
import LeaderboardPage from './components/LeaderboardPage';
import ProfilePage from './components/ProfilePage'; // Added for search redirection

const firebaseConfig = {
  apiKey: "AIzaSyCGdbWnzQlsBnrej9_VFScQo78wkLEe6sI",
  authDomain: "mini-project-39d3a.firebaseapp.com",
  projectId: "mini-project-39d3a",
  storageBucket: "mini-project-39d3a.firebasestorage.app",
  messagingSenderId: "905270142803",
  appId: "1:905270142803:web:29b54cf9b86326605ca3a6",
  measurementId: "G-4VWQ7QLDCQ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [notifications, setNotifications] = useState([]); 
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      let unsubUser = () => {};
      let unsubNotify = () => {};

      if (currentUser) {
        setUser(currentUser);

        // 1. Real-time User Data
        const userRef = doc(db, "users", currentUser.uid);
        unsubUser = onSnapshot(userRef, (snapshot) => {
          if (snapshot.exists()) {
            setUserData({ ...snapshot.data(), uid: currentUser.uid });
          }
          setLoading(false);
        }, (err) => {
          console.error(err);
          setLoading(false);
        });

        // 2. Real-time Notifications
        const q = query(
          collection(db, "notifications"),
          where("recipientId", "==", currentUser.uid),
          where("read", "==", false)
        );
        unsubNotify = onSnapshot(q, (snapshot) => {
          setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

      } else {
        setUser(null);
        setUserData(null);
        setNotifications([]);
        setLoading(false);
      }

      return () => {
        unsubUser();
        unsubNotify();
      };
    });

    return () => unsubscribeAuth();
  }, []);

  if (loading) return (
    <div className="flex h-screen items-center justify-center font-bold text-[#800000] bg-[#F5F5DC]">
      Loading SRIT Connect...
    </div>
  );

  if (!user) {
    return isRegistering ? (
      <Register setIsRegistering={setIsRegistering} />
    ) : (
      <Login setIsRegistering={setIsRegistering} />
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-[#F5F5DC]">
        {/* Navbar contains search, leaderboard, and follow stats */}
        <Navbar user={userData} notifications={notifications} />
        
        <Routes>
          <Route path="/" element={
            <div className="max-w-4xl mx-auto pt-6 px-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* User Profile Sidebar */}
                <aside className="md:col-span-4 hidden md:block">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sticky top-24">
                    <div className="w-16 h-16 bg-[#800000] rounded-full mx-auto mb-3 flex items-center justify-center text-white text-xl font-bold uppercase shadow-md">
                      {userData?.name?.[0]}
                    </div>
                    <h2 className="text-center font-black text-gray-800 uppercase tracking-tight">
                      {userData?.name}
                    </h2>
                    <p className="text-center text-[10px] text-gray-500 font-bold uppercase mt-1">
                      {userData?.branch} • Year {userData?.year}
                    </p>

                    <div className="flex justify-around mt-5 py-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="text-center">
                        <p className="text-[9px] font-black text-gray-400 uppercase">Followers</p>
                        <p className="text-sm font-black text-[#800000]">{userData?.followers?.length || 0}</p>
                      </div>
                      <div className="w-[1px] bg-gray-200"></div>
                      <div className="text-center">
                        <p className="text-[9px] font-black text-gray-400 uppercase">Following</p>
                        <p className="text-sm font-black text-[#800000]">{userData?.following?.length || 0}</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-bold uppercase text-[9px]">Contribution</span>
                      <span className="text-[#800000] font-black">{userData?.totalPoints || 0} Pts</span>
                    </div>
                  </div>
                </aside>

                <main className="md:col-span-8 space-y-4">
                  <CreatePost user={userData} />
                  <PostFeed user={userData} />
                </main>
              </div>
            </div>
          } />

          <Route path="/leaderboard" element={<LeaderboardPage />} />
          
          {/* Requirement: Profile redirection route */}
          <Route path="/profile/:profileId" element={<ProfilePage currentUser={userData} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
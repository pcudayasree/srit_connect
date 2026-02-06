import React, { useState, useEffect } from 'react';
import { auth, db } from '../App';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';

const Navbar = ({ user, notifications = [] }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetch users once to allow for fast local filtering
  useEffect(() => {
    const fetchUsers = async () => {
      const querySnapshot = await getDocs(collection(db, "users"));
      const usersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAllUsers(usersData);
    };
    fetchUsers();
  }, []);

  // Filter list as user types
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredUsers([]);
      setShowDropdown(false);
      return;
    }

    const matches = allUsers.filter(u => 
      u.name?.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 5); // Limit to top 5 results for cleanliness

    setFilteredUsers(matches);
    setShowDropdown(true);
  }, [searchTerm, allUsers]);

  const handleSelectUser = (userId) => {
    navigate(`/profile/${userId}`);
    setSearchTerm("");
    setShowDropdown(false);
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        
        {/* LEFT: LOGO */}
        <div className="flex items-center gap-2 cursor-pointer shrink-0" onClick={() => navigate('/')}>
          <div className="bg-[#800000] text-white p-2 rounded-lg font-black text-xl">SCC</div>
          <span className="text-xl font-black text-gray-800 hidden lg:block uppercase tracking-tighter">
            SRIT <span className="text-[#800000]">CONNECT</span>
          </span>
        </div>

        {/* MIDDLE: SEARCH BAR WITH DROPDOWN */}
        <div className="flex-1 flex justify-center max-w-xl relative">
          <div className="w-full relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#800000] transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)} // Delay to allow click
              className="w-full bg-gray-50 border border-gray-200 rounded-full py-2.5 px-11 text-xs font-bold focus:outline-none focus:border-[#800000] focus:bg-white transition-all"
            />

            {/* DROPDOWN LIST */}
            {showDropdown && filteredUsers.length > 0 && (
              <div className="absolute top-12 left-0 w-full bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden z-50">
                {filteredUsers.map((person) => (
                  <div 
                    key={person.id}
                    onClick={() => handleSelectUser(person.id)}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0"
                  >
                    <div className="w-8 h-8 bg-[#800000] rounded-full flex items-center justify-center text-white text-[10px] font-bold uppercase shrink-0">
                      {person.name?.[0]}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-800">{person.name}</p>
                      <p className="text-[9px] text-gray-500 font-bold uppercase">{person.branch} • Year {person.year}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: ACTIONS */}
        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={() => navigate('/leaderboard')}
            className="hidden xl:flex items-center gap-2 bg-[#F5F5DC] px-3 py-1.5 rounded-lg border border-[#800000]/20 hover:bg-[#ebebca] transition-all"
          >
            <span className="text-[9px] font-black text-[#800000] uppercase">🏆 Leaders</span>
          </button>

          <button onClick={() => navigate('/followers')} className="hidden sm:flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 text-[9px] font-black text-gray-500 uppercase">
            Followers <span className="text-[#800000]">{user?.followers?.length || 0}</span>
          </button>

          <button onClick={() => navigate('/following')} className="hidden sm:flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 text-[9px] font-black text-gray-500 uppercase">
            Following <span className="text-[#800000]">{user?.following?.length || 0}</span>
          </button>

          <div className="relative text-xl cursor-pointer px-1 hover:scale-110 transition" onClick={() => navigate('/notifications')}>
             🔔 {notifications.length > 0 && (
               <span className="absolute -top-1 right-0 bg-red-600 text-white text-[9px] px-1.5 rounded-full border-2 border-white font-bold animate-pulse">
                 {notifications.length}
               </span>
             )}
          </div>

          <div className="text-right hidden sm:block border-l pl-3 border-gray-200 ml-1">
            <p className="text-[11px] font-black text-gray-900 uppercase leading-none mb-1">{user?.name}</p>
            <p className="text-[9px] text-[#800000] font-bold uppercase leading-none">{user?.totalPoints || 0} Pts</p>
          </div>
          
          <button onClick={() => signOut(auth)} className="ml-2 text-[#800000] font-bold text-[10px] px-4 py-2 rounded-lg border border-[#800000]/10 hover:bg-[#800000]/5 transition uppercase">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
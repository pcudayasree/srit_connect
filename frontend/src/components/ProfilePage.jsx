import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../App';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

const ProfilePage = ({ currentUser }) => {
  const { profileId } = useParams();
  const [profileData, setProfileData] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const docRef = doc(db, "users", profileId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProfileData(docSnap.data());
        // Check if current user is already following this profile
        setIsFollowing(currentUser?.following?.includes(profileId));
      }
    };
    fetchProfile();
  }, [profileId, currentUser]);

  const handleFollow = async () => {
    const targetRef = doc(db, "users", profileId);
    const selfRef = doc(db, "users", currentUser.uid);

    if (isFollowing) {
      await updateDoc(targetRef, { followers: arrayRemove(currentUser.uid) });
      await updateDoc(selfRef, { following: arrayRemove(profileId) });
    } else {
      await updateDoc(targetRef, { followers: arrayUnion(currentUser.uid) });
      await updateDoc(selfRef, { following: arrayUnion(profileId) });
    }
    setIsFollowing(!isFollowing);
  };

  if (!profileData) return <div className="p-10 text-center font-bold">Loading Profile...</div>;

  return (
    <div className="max-w-4xl mx-auto pt-10 px-4">
      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col items-center">
        <div className="w-24 h-24 bg-[#800000] rounded-full flex items-center justify-center text-white text-4xl font-black mb-4">
          {profileData.name?.[0].toUpperCase()}
        </div>
        <h2 className="text-2xl font-black text-gray-800 uppercase">{profileData.name}</h2>
        <p className="text-gray-500 font-bold text-sm mb-6">{profileData.branch} • YEAR {profileData.year}</p>
        
        <div className="flex gap-10 border-y border-gray-50 w-full justify-center py-4 mb-6">
          <div className="text-center">
            <p className="text-[10px] font-black text-gray-400 uppercase">Followers</p>
            <p className="text-lg font-black text-[#800000]">{profileData.followers?.length || 0}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-black text-gray-400 uppercase">Following</p>
            <p className="text-lg font-black text-[#800000]">{profileData.following?.length || 0}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-black text-gray-400 uppercase">Points</p>
            <p className="text-lg font-black text-[#800000]">{profileData.totalPoints || 0}</p>
          </div>
        </div>

        {/* Action Button */}
        {currentUser.uid !== profileId && (
          <button 
            onClick={handleFollow}
            className={`px-10 py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all ${
              isFollowing 
              ? 'bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500' 
              : 'bg-[#800000] text-white hover:bg-[#600000] shadow-lg shadow-[#800000]/20'
            }`}
          >
            {isFollowing ? 'Unfollow' : 'Follow'}
          </button>
        )}
      </div>

      {/* User's Posts Section */}
      <div className="mt-8 text-center text-gray-400 font-bold uppercase text-xs tracking-widest">
        User Activity coming soon...
      </div>
    </div>
  );
};

export default ProfilePage;
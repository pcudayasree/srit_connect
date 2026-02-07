import React, { useState } from 'react';
import { db, auth } from '../App';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';

const CreatePost = ({ user }) => {
  const [content, setContent] = useState('');
  const [media, setMedia] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      setMedia(file);
      setMediaType(type);
    }
  };

  const handlePost = async () => {
    if (!content && !media) return;
    if (!auth.currentUser) return;
    
    setIsUploading(true);

    try {
      let finalMediaUrl = null;

      // 1. Upload to Cloudinary if media exists
      if (media) {
        const formData = new FormData();
        formData.append("file", media);
        formData.append("upload_preset", "srit_connect"); 

        const res = await fetch("https://api.cloudinary.com/v1_1/dablxxzsi/auto/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (data.secure_url) {
          finalMediaUrl = data.secure_url;
        }
      }

      // 2. Points Logic: Get current points and prepare update
      const userRef = doc(db, "users", auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      let currentPoints = 0;
      if (userSnap.exists()) {
        currentPoints = userSnap.data().totalPoints || 0;
      }

      // 3. Save to Firebase Firestore
      await addDoc(collection(db, "posts"), {
        authorId: auth.currentUser.uid,
        authorName: user?.name || auth.currentUser.displayName || "Student",
        authorBranch: user?.branch || "General",
        authorYear: user?.year || "1st",
        content,
        mediaUrl: finalMediaUrl,
        mediaType,
        createdAt: serverTimestamp(),
        likes: [],
        comments: []
      });

      // 4. Update Points in Firestore (+2 Pts)
      await updateDoc(userRef, {
        totalPoints: currentPoints + 2
      });

      // 5. Send Notifications to Followers
      if (user?.followers && user.followers.length > 0) {
        const notificationPromises = user.followers.map(followerId => 
          addDoc(collection(db, "notifications"), {
            recipientId: followerId,
            senderId: auth.currentUser.uid,
            senderName: user.name || "A student",
            type: "new_post",
            message: `${user.name || "Someone"} shared a new post.`,
            read: false,
            createdAt: serverTimestamp()
          })
        );
        await Promise.all(notificationPromises);
      }

      // 6. Reset Form
      setContent('');
      setMedia(null);
      setMediaType(null);
      setIsModalOpen(false);
      
    } catch (err) {
      console.error("Error creating post:", err);
      alert("Failed to post. Check internet connection.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 mb-6 mx-2 sm:mx-0">
      {/* Trigger Bar */}
      <div className="flex gap-4 items-center">
        <div className="w-12 h-12 bg-[#800000] rounded-full flex items-center justify-center text-white font-black uppercase shrink-0 shadow-sm border-2 border-white ring-1 ring-gray-100">
          {user?.name?.charAt(0) || auth.currentUser?.displayName?.charAt(0)}
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex-1 text-left px-6 py-3 bg-gray-50 border border-gray-100 rounded-full text-gray-400 hover:bg-gray-100 text-[14px] font-medium transition-all"
        >
          Share an update or ask a question...
        </button>
      </div>

      <div className="flex justify-around mt-4 pt-3 border-t border-gray-50">
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 hover:bg-gray-50 px-5 py-2.5 rounded-2xl text-gray-500 font-black text-[10px] uppercase tracking-widest transition">
          <span className="text-xl">🖼️</span> Photo
        </button>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 hover:bg-gray-50 px-5 py-2.5 rounded-2xl text-gray-500 font-black text-[10px] uppercase tracking-widest transition">
          <span className="text-xl">🎥</span> Video
        </button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#800000]/10 backdrop-blur-md p-4">
          <div className="bg-white w-full max-w-xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col border border-white/20">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center">
              <h3 className="text-[16px] font-black text-gray-900 uppercase tracking-tight">Create Post</h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition"
              >✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-[#800000] rounded-full flex items-center justify-center text-white font-black uppercase shadow-inner">
                  {user?.name?.charAt(0)}
                </div>
                <div>
                  <p className="font-black text-sm uppercase text-gray-900">{user?.name}</p>
                  <p className="text-[9px] text-[#800000] font-black uppercase tracking-widest">Campus Feed • +2 Points</p>
                </div>
              </div>

              <textarea 
                className="w-full min-h-[150px] text-lg outline-none resize-none placeholder-gray-300 font-medium text-gray-700"
                placeholder="What's on your mind, scholar?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                autoFocus
              />
              
              {media && (
                <div className="relative border rounded-2xl overflow-hidden my-4 bg-gray-50 shadow-inner">
                  <button 
                    onClick={() => {setMedia(null); setMediaType(null);}} 
                    className="absolute top-3 right-3 bg-black/50 backdrop-blur-md text-white rounded-full w-8 h-8 flex items-center justify-center text-xs z-10 hover:bg-red-500 transition"
                  >✕</button>
                  {mediaType === 'image' ? (
                    <img src={URL.createObjectURL(media)} alt="Preview" className="w-full max-h-80 object-contain" />
                  ) : (
                    <video src={URL.createObjectURL(media)} className="w-full max-h-80" controls />
                  )}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-50 bg-gray-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <label className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-white hover:shadow-sm cursor-pointer transition text-2xl group relative">
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'image')} />
                  🖼️
                </label>
                <label className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-white hover:shadow-sm cursor-pointer transition text-2xl">
                  <input type="file" className="hidden" accept="video/*" onChange={(e) => handleFileChange(e, 'video')} />
                  📽️
                </label>
              </div>
              <button 
                onClick={handlePost}
                disabled={(!content && !media) || isUploading}
                className="bg-[#800000] text-white px-10 py-3.5 rounded-full font-black text-[11px] uppercase tracking-[0.1em] disabled:opacity-30 hover:bg-[#600000] transition-all shadow-xl active:scale-95"
              >
                {isUploading ? "Uploading..." : "Post & Earn"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatePost;
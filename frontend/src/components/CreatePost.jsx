import React, { useState } from 'react'; // Removed unused useRef
import { db, auth } from '../App';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const CreatePost = ({ user }) => {
  const [content, setContent] = useState('');
  const [media, setMedia] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      setMedia(file);
      setMediaType(type);
    }
  };

  const handlePost = async () => {
    if (!content && !media) return;
    try {
      // Removed 'const postRef =' because the variable was never used
      await addDoc(collection(db, "posts"), {
        authorId: auth.currentUser.uid,
        authorName: user?.name || "User",
        authorBranch: user?.branch || "General",
        authorYear: user?.year || "1st",
        content,
        mediaUrl: media ? URL.createObjectURL(media) : null,
        mediaType,
        createdAt: serverTimestamp(),
        likes: [],
        comments: []
      });

      if (user?.followers && user.followers.length > 0) {
        const notificationPromises = user.followers.map(followerId => 
          addDoc(collection(db, "notifications"), {
            recipientId: followerId,
            senderId: auth.currentUser.uid,
            senderName: user.name,
            type: "new_post",
            message: `${user.name} shared a new post.`,
            read: false,
            createdAt: serverTimestamp()
          })
        );
        await Promise.all(notificationPromises);
      }

      setContent('');
      setMedia(null);
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error creating post/notifications:", err);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
      <div className="flex gap-3 items-center">
        <div className="w-10 h-10 bg-[#800000] rounded-full flex items-center justify-center text-white font-bold uppercase shrink-0">
          {user?.name?.charAt(0)}
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex-1 text-left px-5 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-gray-500 hover:bg-gray-100 text-sm font-medium transition"
        >
          Start a post...
        </button>
      </div>

      <div className="flex justify-around mt-3 pt-2 border-t border-gray-50">
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 hover:bg-gray-50 px-4 py-2 rounded-lg text-gray-600 font-bold text-xs transition">
          <span className="text-blue-500 text-base">🖼️</span> Photo
        </button>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 hover:bg-gray-50 px-4 py-2 rounded-lg text-gray-600 font-bold text-xs transition">
          <span className="text-green-500 text-base">📽️</span> Video
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">Create a post</h3>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500">✕</button>
            </div>
            
            <div className="p-4 overflow-y-auto">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#800000] rounded-full flex items-center justify-center text-white font-bold uppercase">{user?.name?.charAt(0)}</div>
                <div>
                  <p className="font-bold text-sm">{user?.name}</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase">Posting to Campus Feed</p>
                </div>
              </div>

              <textarea 
                className="w-full min-h-[150px] text-base outline-none resize-none placeholder-gray-400"
                placeholder="What's on your mind, scholar?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                autoFocus
              />
              
              {media && (
                <div className="relative border rounded-lg overflow-hidden my-4 bg-gray-50">
                  <button onClick={() => setMedia(null)} className="absolute top-2 right-2 bg-black/70 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs z-10">✕</button>
                  {mediaType === 'image' ? (
                    <img 
                      src={URL.createObjectURL(media)} 
                      alt="User upload preview" // Added alt prop to fix ESLint warning
                      className="w-full max-h-72 object-contain" 
                    />
                  ) : (
                    <video src={URL.createObjectURL(media)} className="w-full max-h-72" controls />
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="p-2 rounded-full hover:bg-gray-200 cursor-pointer transition text-xl">
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'image')} />
                  🖼️
                </label>
                <label className="p-2 rounded-full hover:bg-gray-200 cursor-pointer transition text-xl">
                  <input type="file" className="hidden" accept="video/*" onChange={(e) => handleFileChange(e, 'video')} />
                  📽️
                </label>
              </div>
              <button 
                onClick={handlePost}
                disabled={!content && !media}
                className="bg-[#800000] text-white px-8 py-2 rounded-full font-black text-xs uppercase tracking-wider disabled:opacity-40 hover:bg-[#600000] transition-all shadow-md active:scale-95"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatePost;
import React, { useEffect, useState, useRef } from 'react';
import { db, auth } from '../App';
import { 
  collection, query, orderBy, onSnapshot, 
  doc, updateDoc, arrayUnion, arrayRemove, deleteDoc, getDoc,
  where, limit, writeBatch, addDoc
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const PostFeed = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // --- ALL ORIGINAL STATES PRESERVED ---
  const [posts, setPosts] = useState([]);
  const [commentText, setCommentText] = useState({});
  const [replyText, setReplyText] = useState({}); 
  const [activeReplyId, setActiveReplyId] = useState(null); 
  const [following, setFollowing] = useState([]);
  const [showComments, setShowComments] = useState({});
  const [postContent, setPostContent] = useState(""); 
  const [selectedFile, setSelectedFile] = useState(null);
  
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  // --- DERIVED STATE ---
  const unreadCount = notifications.filter(n => !n.read).length;

  // --- ORIGINAL USEEFFECT (NOTIFS + POSTS + USER) ---
  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsubPosts = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    if (auth.currentUser) {
      const userRef = doc(db, "users", auth.currentUser.uid);
      const unsubUser = onSnapshot(userRef, (doc) => {
        if (doc.exists()) setFollowing(doc.data().following || []);
      });

      const notifQ = query(
        collection(db, "notifications"),
        where("recipientId", "==", auth.currentUser.uid),
        orderBy("createdAt", "desc"),
        limit(15)
      );
      const unsubNotifs = onSnapshot(notifQ, (snapshot) => {
        setNotifications(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      return () => { unsubPosts(); unsubUser(); unsubNotifs(); };
    }
    return () => unsubPosts();
  }, []);

  // --- ORIGINAL NOTIFICATION BATCH UPDATE LOGIC ---
  const handleToggleNotifications = async () => {
    setShowNotifDropdown(!showNotifDropdown);
    if (!showNotifDropdown && unreadCount > 0) {
      try {
        const batch = writeBatch(db);
        notifications.forEach((n) => {
          if (!n.read) {
            const nRef = doc(db, "notifications", n.id);
            batch.update(nRef, { read: true });
          }
        });
        await batch.commit();
      } catch (error) {
        console.error("Error clearing notifications:", error);
      }
    }
  };

  // --- NEW MEDIA HANDLERS ---
  const handleFileClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // --- MERGED POST SUBMIT (POINTS + DATA) ---
  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!postContent.trim() || !auth.currentUser) return;

    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      
      let currentPoints = 0;
      let realName = auth.currentUser.displayName || "Student";

      if (userSnap.exists()) {
        const userData = userSnap.data();
        currentPoints = userData.totalPoints || 0;
        realName = userData.authorName || userData.userName || userData.name || realName;
      }

      // Create Post
      await addDoc(collection(db, "posts"), {
        content: postContent,
        authorId: auth.currentUser.uid,
        authorName: realName, 
        createdAt: new Date(),
        likes: [],
        comments: [],
        mediaUrl: null, // Placeholder for Storage URL
        mediaType: selectedFile ? (selectedFile.type.startsWith('video') ? 'video' : 'image') : 'text'
      });

      // Award Points: +5 Welcome + 2 for Post if first time, else just +2
      const updatedPoints = currentPoints === 0 ? 7 : currentPoints + 2;
      await updateDoc(userRef, { totalPoints: updatedPoints });

      setPostContent(""); 
      setSelectedFile(null);
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  // --- ORIGINAL COMMENT LOGIC PRESERVED ---
  const handleAddComment = async (postId, parentCommentId = null) => {
    const text = parentCommentId ? replyText[parentCommentId] : commentText[postId];
    if (!text?.trim() || !auth.currentUser) return;

    try {
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      let realName = "User";
      
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        realName = userData.authorName || userData.userName || userData.name || "User";
      }

      const postRef = doc(db, "posts", postId);
      const newComment = {
        id: Date.now().toString(),
        userId: auth.currentUser.uid,
        userName: realName,
        text: text,
        parentCommentId: parentCommentId,
        createdAt: new Date().toISOString()
      };

      await updateDoc(postRef, { comments: arrayUnion(newComment) });

      if (parentCommentId) {
        setReplyText(prev => ({ ...prev, [parentCommentId]: "" }));
        setActiveReplyId(null);
      } else {
        setCommentText(prev => ({ ...prev, [postId]: "" }));
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const handleDeleteComment = async (postId, commentObject) => {
    if (window.confirm("Delete this comment permanently?")) {
      try {
        const postRef = doc(db, "posts", postId);
        await updateDoc(postRef, { comments: arrayRemove(commentObject) });
      } catch (error) {
        console.error("Error deleting comment:", error);
      }
    }
  };

  // --- ORIGINAL LIKE LOGIC (WITH PT 10 MILESTONE) ---
  const handleLike = async (postId, likes = [], postAuthorId) => {
    if (!auth.currentUser) return;
    const postRef = doc(db, "posts", postId);
    const userId = auth.currentUser.uid;
    const isLiked = likes.includes(userId);

    await updateDoc(postRef, {
      likes: isLiked ? arrayRemove(userId) : arrayUnion(userId)
    });

    if (postAuthorId) {
      const newLikeCount = isLiked ? likes.length - 1 : likes.length + 1;
      const authorRef = doc(db, "users", postAuthorId);
      const authorSnap = await getDoc(authorRef);

      if (authorSnap.exists()) {
        const currentPoints = authorSnap.data().totalPoints || 0;
        if (newLikeCount === 10) {
          await updateDoc(authorRef, { totalPoints: currentPoints + 3 });
        } else if (newLikeCount === 9 && isLiked) {
          await updateDoc(authorRef, { totalPoints: Math.max(0, currentPoints - 3) });
        }
      }
    }
  };

  // --- ORIGINAL FOLLOW/DELETE LOGIC ---
  const handleFollow = async (targetUserId) => {
    if (!auth.currentUser || targetUserId === auth.currentUser.uid) return;
    const currentUserRef = doc(db, "users", auth.currentUser.uid);
    const targetUserRef = doc(db, "users", targetUserId);
    const isFollowing = following.includes(targetUserId);

    await updateDoc(currentUserRef, {
      following: isFollowing ? arrayRemove(targetUserId) : arrayUnion(targetUserId)
    });
    await updateDoc(targetUserRef, {
      followers: isFollowing ? arrayRemove(auth.currentUser.uid) : arrayUnion(auth.currentUser.uid)
    });
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm("Delete this post permanently?")) {
      try {
        await deleteDoc(doc(db, "posts", postId));
        const userRef = doc(db, "users", auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const currentPoints = userSnap.data().totalPoints || 0;
          await updateDoc(userRef, { totalPoints: Math.max(0, currentPoints - 2) });
        }
      } catch (error) {
        console.error("Error deleting post:", error);
      }
    }
  };

  const toggleComments = (postId) => {
    setShowComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

return (
    <div className="max-w-2xl mx-auto space-y-4 pb-20 bg-[#F9F9F7] min-h-screen">
      
      {/* 🟢 FEED SECTION */}
      <div className="px-2 sm:px-0 space-y-6 mt-6">
        {posts.map(post => {
          const isLiked = post.likes?.includes(auth.currentUser?.uid);
          const postOwnerId = post.authorId || post.userId;
          const isFollowing = following.includes(postOwnerId);
          const isMyPost = auth.currentUser?.uid === postOwnerId;

          return (
            <div key={post.id} className="bg-white rounded-[32px] border border-gray-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
              
              {/* Post Header */}
              <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    onClick={() => navigate(`/profile/${postOwnerId}`)}
                    className="w-11 h-11 rounded-full bg-[#800000] flex items-center justify-center font-bold text-white uppercase cursor-pointer hover:opacity-90 transition-all shadow-md"
                  >
                    {(post.authorName || post.userName)?.[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 
                        onClick={() => navigate(`/profile/${postOwnerId}`)}
                        className="text-sm font-black text-gray-900 uppercase cursor-pointer hover:text-[#800000] transition-colors"
                      >
                        {post.authorName || post.userName}
                      </h4>
                      {!isMyPost && (
                        <button 
                          onClick={() => handleFollow(postOwnerId)}
                          className={`text-[9px] font-bold px-2.5 py-1 rounded-full border transition-all ${isFollowing ? 'bg-gray-100 text-gray-500' : 'border-[#800000] text-[#800000] hover:bg-[#800000] hover:text-white uppercase'}`}
                        >
                          {isFollowing ? 'Following' : 'Follow'}
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                      {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString() : "Posted Today"}
                    </p>
                  </div>
                </div>
                {isMyPost && (
                  <button 
                    onClick={() => handleDeletePost(post.id)}
                    className="text-gray-300 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-red-50"
                  >
                    <span className="text-[10px] uppercase font-black tracking-widest">Delete</span>
                  </button>
                )}
              </div>

              {/* Post Content */}
              <div className="px-6 pb-4">
                <p className="text-[15px] text-gray-800 leading-relaxed font-medium">{post.content}</p>
              </div>

              {/* Post Media */}
              {(post.mediaUrl || post.media) && (
                <div className="px-4 pb-4">
                  {post.mediaType === 'video' ? (
                    <video 
                      src={post.mediaUrl || post.media} 
                      controls 
                      className="w-full rounded-2xl border border-gray-100 shadow-sm max-h-[480px] bg-black"
                    />
                  ) : (
                    <img 
                      src={post.mediaUrl || post.media} 
                      alt="Post content" 
                      className="w-full rounded-2xl border border-gray-100 shadow-sm max-h-[550px] object-cover"
                    />
                  )}
                </div>
              )}

              {/* Interaction Bar */}
              <div className="px-6 py-4 flex items-center justify-around border-t border-gray-50 bg-gray-50/40">
                <button 
                  onClick={() => handleLike(post.id, post.likes, postOwnerId)}
                  className={`flex flex-col items-center gap-1 text-[10px] font-black uppercase transition-all hover:scale-110 ${isLiked ? 'text-red-500' : 'text-gray-400'}`}
                >
                  <span className="text-2xl">{isLiked ? '❤️' : '🤍'}</span>
                  {post.likes?.length || 0} Likes
                </button>

                <button 
                  onClick={() => toggleComments(post.id)}
                  className={`flex flex-col items-center gap-1 text-[10px] font-black uppercase transition-all hover:scale-110 ${showComments[post.id] ? 'text-[#800000]' : 'text-gray-400'}`}
                >
                  <span className="text-2xl">💬</span>
                  {post.comments?.length || 0} Comments
                </button>

                <button className="flex flex-col items-center gap-1 text-[10px] font-black uppercase text-gray-300 cursor-not-allowed group">
                  <span className="text-2xl opacity-40">📤</span>
                  Send
                </button>
              </div>

              {/* Comments Section */}
              {showComments[post.id] && (
                <div className="px-5 py-5 bg-gray-50/50 border-t border-gray-100">
                  <div className="space-y-5">
                    {post.comments?.filter(c => !c.parentCommentId).map((comment) => (
                      <div key={comment.id} className="space-y-2">
                        <div className="flex gap-3 items-start">
                          <div className="w-9 h-9 rounded-full bg-[#800000] flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
                            {comment.userName?.[0]}
                          </div>
                          <div className="flex-1 group">
                            <div className="bg-white border border-gray-200 p-3.5 rounded-2xl inline-block min-w-[160px] shadow-sm relative transition-all">
                              <p className="text-[10px] font-black text-[#800000] uppercase mb-1 tracking-tight">{comment.userName}</p>
                              <p className="text-[13px] text-gray-700 font-medium leading-snug">{comment.text}</p>
                              
                              {comment.userId === auth.currentUser?.uid && (
                                <button 
                                  onClick={() => handleDeleteComment(post.id, comment)}
                                  className="absolute -right-8 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                                >
                                  🗑️
                                </button>
                              )}
                            </div>
                            
                            <div className="flex gap-4 mt-2 ml-3">
                              <button 
                                onClick={() => setActiveReplyId(comment.id)}
                                className="text-[9px] font-black text-gray-400 uppercase hover:text-[#800000] tracking-widest"
                              >
                                Reply
                              </button>
                            </div>

                            {/* Reply Input */}
                            {activeReplyId === comment.id && (
                              <div className="mt-3 flex gap-2">
                                <input 
                                  type="text" 
                                  className="flex-1 text-[11px] border border-gray-200 rounded-full px-3 py-1 outline-none"
                                  placeholder={`Reply to ${comment.userName}...`}
                                  value={replyText[comment.id] || ""}
                                  onChange={(e) => setReplyText(prev => ({ ...prev, [comment.id]: e.target.value }))}
                                />
                                <button onClick={() => handleAddComment(post.id, comment.id)} className="text-[#800000] font-black text-[10px] uppercase">Send</button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Main Comment Input */}
                  <div className="flex gap-3 mt-6 items-center">
                    <div className="w-9 h-9 rounded-full bg-[#800000] flex items-center justify-center text-white text-xs font-bold uppercase shadow-md">
                      {auth.currentUser?.displayName?.[0] || "U"}
                    </div>
                    <div className="flex-1 relative">
                      <input 
                        type="text"
                        placeholder="Write a comment..."
                        value={commentText[post.id] || ""}
                        onChange={(e) => setCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                        className="w-full border border-gray-200 rounded-full px-5 py-3 text-xs focus:ring-1 focus:ring-[#800000] bg-white shadow-inner outline-none"
                      />
                      <button 
                        onClick={() => handleAddComment(post.id)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#800000] font-black text-[11px] uppercase tracking-widest"
                      >
                        Post
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default PostFeed;
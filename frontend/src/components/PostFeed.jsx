import React, { useEffect, useState } from 'react';
import { db, auth } from '../App';
import { 
  collection, query, orderBy, onSnapshot, 
  doc, updateDoc, arrayUnion 
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const PostFeed = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [commentText, setCommentText] = useState({});
  const [replyText, setReplyText] = useState({}); 
  const [activeReplyId, setActiveReplyId] = useState(null); 

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);

  const handleAddComment = async (postId, parentCommentId = null) => {
    const text = parentCommentId ? replyText[parentCommentId] : commentText[postId];
    if (!text?.trim() || !auth.currentUser) return;

    const postRef = doc(db, "posts", postId);
    const newComment = {
      id: Date.now().toString(),
      userId: auth.currentUser.uid,
      userName: auth.currentUser.displayName || "Student",
      text: text,
      parentCommentId: parentCommentId,
      createdAt: new Date().toISOString()
    };

    await updateDoc(postRef, {
      comments: arrayUnion(newComment)
    });

    if (parentCommentId) {
      setReplyText(prev => ({ ...prev, [parentCommentId]: "" }));
      setActiveReplyId(null);
    } else {
      setCommentText(prev => ({ ...prev, [postId]: "" }));
    }
  };

  return (
    <div className="space-y-4">
      {posts.map(post => (
        <div key={post.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          
          {/* POST HEADER */}
          <div className="p-4 flex items-center gap-3">
            <div 
              onClick={() => navigate(`/profile/${post.userId}`)}
              className="w-10 h-10 rounded-full bg-[#800000] flex items-center justify-center font-bold text-white uppercase cursor-pointer hover:opacity-80 transition-all shadow-sm"
            >
              {post.authorName?.[0] || post.userName?.[0]}
            </div>
            <div>
              <h4 
                onClick={() => navigate(`/profile/${post.userId}`)}
                className="text-sm font-black text-gray-900 uppercase cursor-pointer hover:text-[#800000] transition-colors"
              >
                {post.authorName || post.userName}
              </h4>
              <p className="text-[10px] text-gray-400 font-bold uppercase">
                {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString() : "Just now"}
              </p>
            </div>
          </div>

          {/* POST CONTENT */}
          <div className="px-4 pb-4">
            <p className="text-[14px] text-gray-800 leading-relaxed">{post.content}</p>
          </div>

          {/* COMMENT SECTION */}
          <div className="px-4 py-3 bg-gray-50/50 border-t border-gray-100">
            <div className="space-y-4 mt-2">
              {post.comments?.filter(c => !c.parentCommentId).map((comment) => (
                <div key={comment.id} className="space-y-2">
                  <div className="flex gap-2 items-start">
                    {/* Commenter Avatar */}
                    <div 
                      onClick={() => navigate(`/profile/${comment.userId}`)}
                      className="w-8 h-8 rounded-full bg-[#800000]/10 flex items-center justify-center text-[#800000] font-bold text-[10px] cursor-pointer shrink-0"
                    >
                      {comment.userName?.[0]}
                    </div>
                    <div className="flex-1">
                      <div className="bg-white border border-gray-200 p-2.5 rounded-2xl inline-block min-w-[120px] shadow-sm">
                        <p 
                          onClick={() => navigate(`/profile/${comment.userId}`)}
                          className="text-[10px] font-black text-gray-900 uppercase cursor-pointer hover:text-[#800000]"
                        >
                          {comment.userName}
                        </p>
                        <p className="text-[12px] text-gray-700 mt-0.5">{comment.text}</p>
                      </div>
                      
                      <div className="flex gap-3 mt-1 ml-2">
                        <button 
                          onClick={() => setActiveReplyId(comment.id)}
                          className="text-[10px] font-black text-gray-400 uppercase hover:text-[#800000]"
                        >
                          Reply
                        </button>
                      </div>

                      {/* REPLIES */}
                      <div className="ml-6 mt-3 space-y-3 border-l-2 border-gray-200 pl-4">
                        {post.comments?.filter(r => r.parentCommentId === comment.id).map(reply => (
                          <div key={reply.id} className="flex gap-2 items-start">
                            <div 
                              onClick={() => navigate(`/profile/${reply.userId}`)}
                              className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[8px] font-bold cursor-pointer"
                            >
                              {reply.userName?.[0]}
                            </div>
                            <div className="bg-white border border-gray-100 p-2 rounded-xl flex-1 shadow-sm">
                              <p 
                                onClick={() => navigate(`/profile/${reply.userId}`)}
                                className="text-[9px] font-black text-gray-900 uppercase cursor-pointer hover:text-[#800000]"
                              >
                                {reply.userName} 
                                {reply.userId === post.userId && <span className="text-[#800000] ml-1">[Author]</span>}
                              </p>
                              <p className="text-[11px] text-gray-700">{reply.text}</p>
                            </div>
                          </div>
                        ))}

                        {activeReplyId === comment.id && (
                          <div className="flex gap-2 mt-2">
                            <input 
                              type="text"
                              placeholder="Write a reply..."
                              value={replyText[comment.id] || ""}
                              onChange={(e) => setReplyText(prev => ({ ...prev, [comment.id]: e.target.value }))}
                              className="flex-1 border border-gray-200 rounded-full px-4 py-1.5 text-[11px] focus:outline-none focus:border-[#800000] bg-white"
                            />
                            <button 
                              onClick={() => handleAddComment(post.id, comment.id)}
                              className="text-[#800000] font-black text-[10px] uppercase px-2"
                            >
                              Post
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* MAIN COMMENT INPUT */}
            <div className="flex gap-3 mt-5 items-center">
              <div className="w-8 h-8 rounded-full bg-[#800000] flex items-center justify-center text-white text-[10px] font-bold uppercase">
                {auth.currentUser?.displayName?.[0] || "U"}
              </div>
              <div className="flex-1 relative">
                <input 
                  type="text"
                  placeholder="Add a comment..."
                  value={commentText[post.id] || ""}
                  onChange={(e) => setCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                  className="w-full border border-gray-200 rounded-full px-5 py-2 text-xs focus:outline-none focus:border-[#800000] bg-white shadow-inner"
                />
                <button 
                  onClick={() => handleAddComment(post.id)}
                  className="absolute right-4 top-2 text-[#800000] font-black text-[10px] uppercase tracking-wider"
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PostFeed;
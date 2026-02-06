import React, { useState, useEffect } from 'react';
// FIX: Import from App instead of firebaseConfig
import { db, auth } from '../App'; 
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';

const Comments = ({ postId }) => {
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);

  useEffect(() => {
    // Reference to the sub-collection: posts -> {postId} -> comments
    const q = query(
      collection(db, "posts", postId, "comments"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, [postId]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      await addDoc(collection(db, "posts", postId, "comments"), {
        text: commentText,
        // Using auth.currentUser.email as a fallback if name isn't set yet
        authorName: auth.currentUser.displayName || auth.currentUser.email.split('@')[0],
        authorId: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });
      setCommentText('');
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Discussion</h4>
      
      {/* List of Comments */}
      <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-2">
        {comments.map(comment => (
          <div key={comment.id} className="bg-gray-50 p-3 rounded-xl border border-gray-100">
            <p className="text-[10px] font-black text-indigo-600 uppercase mb-1">{comment.authorName}</p>
            <p className="text-sm text-gray-700 leading-relaxed">{comment.text}</p>
          </div>
        ))}
      </div>

      {/* Input Field */}
      <form onSubmit={handleCommentSubmit} className="flex gap-2">
        <input 
          type="text" 
          className="flex-1 p-3 text-sm bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          placeholder="Ask a question or thank the senior..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
        />
        <button 
          type="submit" 
          className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-md active:scale-95 transition-all"
        >
          Reply
        </button>
      </form>
    </div>
  );
};

export default Comments;
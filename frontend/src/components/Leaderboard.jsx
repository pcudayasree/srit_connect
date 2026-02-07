import React, { useState, useEffect } from 'react';
import { db } from '../App'; 
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

const Leaderboard = () => {
  const [topStudents, setTopStudents] = useState([]);

  useEffect(() => {
    // Queries the users collection by 'totalPoints' updated in your PostFeed
    const q = query(
      collection(db, "users"),
      orderBy("totalPoints", "desc"),
      limit(10) 
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTopStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
      <div className="mb-6">
        <h3 className="text-xl font-black text-gray-900 flex items-center gap-2 uppercase tracking-tighter">
          <span className="text-2xl">🏆</span> Campus Achievement Rankings
        </h3>
        <p className="text-[10px] font-bold text-[#800000] uppercase tracking-widest mt-1">
          Base: 5 pts • High Engagement (10+ Likes): +3 pts
        </p>
      </div>

      <div className="space-y-3">
        {topStudents.length > 0 ? (
          topStudents.map((student, index) => (
            <div 
              key={student.id} 
              className={`flex items-center justify-between p-3 rounded-2xl transition-all ${
                index === 0 ? 'bg-yellow-50/50 border border-yellow-100' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className={`w-8 text-center font-black text-sm ${
                  index === 0 ? 'text-yellow-600 text-lg' : 
                  index === 1 ? 'text-gray-500' : 
                  index === 2 ? 'text-orange-500' : 'text-gray-300'
                }`}>
                  #{index + 1}
                </span>
                
                <div className="w-10 h-10 rounded-full bg-[#800000] flex items-center justify-center text-white font-bold shadow-sm">
                  {student.authorName?.[0] || student.name?.[0] || student.userName?.[0] || 'U'}
                </div>

                <div>
                  <p className="text-sm font-black text-gray-800 uppercase tracking-tight">
                    {student.authorName || student.name || student.userName || "Anonymous Student"}
                  </p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">{student.branch || "STUDENT"} • YEAR {student.year || "1"}</p>
                </div>
              </div>

              <div className="text-right">
                <div className="flex flex-col items-end">
                  <span className={`text-xs font-black px-3 py-1 rounded-full ${
                    index === 0 ? 'bg-yellow-500 text-white' : 'bg-[#800000]/10 text-[#800000]'
                  }`}>
                    {student.totalPoints || 0} PTS
                  </span>
                  
                  {/* Bonus logic based on the points you set in PostFeed */}
                  {student.totalPoints >= 8 && (
                    <span className="text-[8px] font-black text-green-500 uppercase mt-1">🔥 Viral Bonus</span>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10">
            <p className="text-3xl mb-2">🎓</p>
            <p className="text-xs font-bold text-gray-400 uppercase">Calculating Rankings...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
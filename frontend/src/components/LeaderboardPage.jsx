import React, { useState, useEffect } from 'react';
import { db } from '../App';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

const LeaderboardPage = () => {
  const [allLeaders, setAllLeaders] = useState([]);

  useEffect(() => {
    // orderBy desc ensures people change places based on points
    const q = query(collection(db, "users"), orderBy("totalPoints", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAllLeaders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-[#F9F9F7] p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-[#800000] uppercase tracking-tighter flex items-center gap-3">
            <span className="bg-[#800000] text-white p-2 rounded-xl">🏆</span> 
            Campus Achievement Rankings
          </h1>
          <div className="flex gap-2 mt-3">
            <span className="text-[9px] font-black bg-white border px-3 py-1 rounded-full uppercase text-gray-400">1st Post: 5+2 PTS</span>
            <span className="text-[9px] font-black bg-white border px-3 py-1 rounded-full uppercase text-gray-400">Each Post: +2 PTS</span>
            <span className="text-[9px] font-black bg-green-50 border border-green-100 px-3 py-1 rounded-full uppercase text-green-600">10+ Likes: +3 PTS</span>
          </div>
        </div>
        
        <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Rank</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Student Developer</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Branch</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Contribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {allLeaders.map((student, index) => (
                <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-6">
                    <span className={`text-lg font-black ${index < 3 ? 'text-[#800000]' : 'text-gray-300'}`}>
                      #{index + 1}
                    </span>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#800000] text-white flex items-center justify-center font-black uppercase">
                        {(student.authorName || student.userName || student.name || 'U')[0]}
                      </div>
                      <div>
                        <p className="font-black text-sm uppercase text-gray-900">
                          {student.authorName || student.userName || student.name || "Anonymous Student"}
                        </p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Year {student.year || "3"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6 text-center">
                    <span className="bg-white text-[#800000] text-[10px] font-black px-3 py-1 rounded-full border border-[#800000]/20 uppercase">
                      {student.branch || "CSE"}
                    </span>
                  </td>
                  <td className="p-6 text-right font-black text-[#800000] text-xl tracking-tighter">
                    {student.totalPoints || 0} <span className="text-[10px] text-gray-400 uppercase">Pts</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
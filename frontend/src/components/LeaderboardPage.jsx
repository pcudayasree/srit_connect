import React, { useState, useEffect } from 'react';
import { db } from '../App';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

const LeaderboardPage = () => {
  const [allLeaders, setAllLeaders] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("totalPoints", "desc"));
    return onSnapshot(q, (snapshot) => {
      setAllLeaders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F5DC] p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-black text-[#800000] uppercase mb-6 flex items-center gap-2">
          🏆 Campus Achievement Rankings
        </h1>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 text-[10px] font-black text-gray-400 uppercase">Rank</th>
                <th className="p-4 text-[10px] font-black text-gray-400 uppercase">Student</th>
                <th className="p-4 text-[10px] font-black text-gray-400 uppercase text-center">Branch</th>
                <th className="p-4 text-[10px] font-black text-gray-400 uppercase text-right">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {allLeaders.map((student, index) => (
                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <span className={`font-bold ${index < 3 ? 'text-[#800000]' : 'text-gray-400'}`}>
                      #{index + 1}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#800000] text-white flex items-center justify-center text-xs font-bold">
                        {student.name?.[0]}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{student.name}</p>
                        <p className="text-[10px] text-gray-500 uppercase">{student.year} Year</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className="bg-[#F5F5DC] text-[#800000] text-[10px] font-bold px-2 py-1 rounded border border-[#800000]/10">
                      {student.branch}
                    </span>
                  </td>
                  <td className="p-4 text-right font-black text-[#800000]">
                    {student.totalPoints}
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
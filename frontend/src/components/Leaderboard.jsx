import React, { useState, useEffect } from 'react';
// FIX: Pulling db from App instead of the old config file
import { db } from '../App'; 
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

const Leaderboard = () => {
  const [topStudents, setTopStudents] = useState([]);

  useEffect(() => {
    // Query: Get users, sort by points (high to low), limit to top 5
    const q = query(
      collection(db, "users"),
      orderBy("totalPoints", "desc"),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTopStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        🏆 Campus Leaders
      </h3>
      <div className="space-y-4">
        {topStudents.length > 0 ? (
          topStudents.map((student, index) => (
            <div key={student.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`font-bold text-sm ${
                  index === 0 ? 'text-yellow-500' : 
                  index === 1 ? 'text-gray-500' : 
                  index === 2 ? 'text-orange-400' : 'text-gray-300'
                }`}>
                  #{index + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-700">{student.name}</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">{student.branch}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                  {student.totalPoints} pts
                </span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-xs text-center text-gray-400 py-2">No leaders yet. Be the first!</p>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
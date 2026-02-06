import React, { useState, useEffect } from 'react';
import { db } from '../App';
import { doc, getDoc } from 'firebase/firestore';

const UserListPage = ({ type, user }) => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const ids = type === 'followers' ? user?.followers : user?.following;
      if (ids && ids.length > 0) {
        const results = await Promise.all(
          ids.map(async (id) => {
            const d = await getDoc(doc(db, "users", id));
            return d.exists() ? { id, ...d.data() } : null;
          })
        );
        setList(results.filter(r => r !== null));
      }
      setLoading(false);
    };
    fetchData();
  }, [type, user]);

  return (
    <div className="max-w-2xl mx-auto pt-10 px-4">
      <h2 className="text-2xl font-black text-[#800000] uppercase mb-6">
        {type === 'followers' ? 'People Following You' : 'People You Follow'}
      </h2>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <p className="p-10 text-center text-gray-400 font-bold uppercase">Loading list...</p>
        ) : list.length === 0 ? (
          <p className="p-10 text-center text-gray-400 font-bold uppercase italic">No users found</p>
        ) : (
          list.map(u => (
            <div key={u.id} className="flex items-center gap-4 p-4 border-b last:border-0 hover:bg-gray-50">
              <div className="w-12 h-12 bg-[#800000] rounded-full flex items-center justify-center text-white font-bold uppercase">
                {u.name?.[0]}
              </div>
              <div>
                <p className="font-bold text-gray-800">{u.name}</p>
                <p className="text-xs text-gray-500 font-bold uppercase">{u.branch} • Year {u.year}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UserListPage;
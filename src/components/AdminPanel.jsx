import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  orderBy,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import { db } from '../firebase';

const HOLIDAY_TYPES = [
  { id: 'V', label: 'Vormittag (V)' },
  { id: 'N', label: 'Nachmittag (N)' },
];

export default function AdminPanel({ user }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedType, setSelectedType] = useState('V');
  const [holidayRequests, setHolidayRequests] = useState([]);
  const [limits, setLimits] = useState({ V: 2, N: 3 });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // その日の希望を取得
  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const dateStr = selectedDate.toISOString().split('T')[0];
        const q = query(
          collection(db, 'holidays'),
          where('date', '==', dateStr),
          where('type', '==', selectedType),
          orderBy('timestamp', 'asc')
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc, idx) => ({
          id: doc.id,
          rank: idx + 1,
          ...doc.data(),
        }));
        setHolidayRequests(data);
      } catch (err) {
        console.error('Error fetching holidays:', err);
      }
    };
    fetchHolidays();
  }, [selectedDate, selectedType]);

  // 設定を取得
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'limits');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setLimits(docSnap.data());
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      }
    };
    fetchSettings();
  }, []);

  const handleApprove = async (holidayId, rank) => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'holidays', holidayId), {
        approved: true,
      });

      setMessage(`✅ ${rank}位を承認しました`);

      // 最新のデータを再取得
      const dateStr = selectedDate.toISOString().split('T')[0];
      const q = query(
        collection(db, 'holidays'),
        where('date', '==', dateStr),
        where('type', '==', selectedType),
        orderBy('timestamp', 'asc')
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc, idx) => ({
        id: doc.id,
        rank: idx + 1,
        ...doc.data(),
      }));
      setHolidayRequests(data);
    } catch (err) {
      setMessage('❌ エラー: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (holidayId, rank) => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'holidays', holidayId), {
        approved: false,
        rejected: true,
      });

      setMessage(`❌ ${rank}位を拒否しました`);

      // 最新のデータを再取得
      const dateStr = selectedDate.toISOString().split('T')[0];
      const q = query(
        collection(db, 'holidays'),
        where('date', '==', dateStr),
        where('type', '==', selectedType),
        orderBy('timestamp', 'asc')
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc, idx) => ({
        id: doc.id,
        rank: idx + 1,
        ...doc.data(),
      }));
      setHolidayRequests(data);
    } catch (err) {
      setMessage('❌ エラー: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLimits = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, 'settings', 'limits'), limits);
      setMessage('✅ 設定を保存しました');
    } catch (err) {
      setMessage('❌ エラー: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAll = async () => {
    setLoading(true);
    try {
      for (let i = 0; i < Math.min(limits[selectedType], holidayRequests.length); i++) {
        await updateDoc(doc(db, 'holidays', holidayRequests[i].id), {
          approved: true,
        });
      }
      setMessage(`✅ 最初の ${Math.min(limits[selectedType], holidayRequests.length)} 件を承認しました`);

      // 最新のデータを再取得
      const dateStr = selectedDate.toISOString().split('T')[0];
      const q = query(
        collection(db, 'holidays'),
        where('date', '==', dateStr),
        where('type', '==', selectedType),
        orderBy('timestamp', 'asc')
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc, idx) => ({
        id: doc.id,
        rank: idx + 1,
        ...doc.data(),
      }));
      setHolidayRequests(data);
    } catch (err) {
      setMessage('❌ エラー: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const approvedCount = holidayRequests.filter((h) => h.approved).length;
  const capacity = limits[selectedType] || 2;
  const availableSlots = Math.max(0, capacity - approvedCount);

  return (
    <div className="space-y-8">
      {/* 設定パネル */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">⚙️ Einstellungen</h2>

        <div className="grid grid-cols-2 gap-4 mb-4">
          {HOLIDAY_TYPES.map((type) => (
            <div key={type.id}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {type.label} - Tägliches Limit
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={limits[type.id] || 2}
                onChange={(e) =>
                  setLimits({ ...limits, [type.id]: parseInt(e.target.value) })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>

        <button
          onClick={handleSaveLimits}
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-400"
        >
          {loading ? 'Speichern...' : 'Einstellungen speichern'}
        </button>
      </div>

      {/* 日付・タイプ選択 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">📅 Genehmigungen verwalten</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Datum</label>
            <input
              type="date"
              value={selectedDate.toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Urlaubstyp</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              {HOLIDAY_TYPES.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <div className="w-full bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">Verfügbare Plätze</p>
              <p className="text-2xl font-bold text-blue-600">{availableSlots}</p>
              <p className="text-xs text-gray-500">von {capacity}</p>
            </div>
          </div>
        </div>

        {message && (
          <div className={`px-4 py-3 rounded mb-4 text-sm ${
            message.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message}
          </div>
        )}

        {/* 希望リスト */}
        <div className="space-y-2 mb-6">
          {holidayRequests.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Keine Wünsche für diesen Tag</p>
          ) : (
            holidayRequests.map((holiday, idx) => {
              const isApproved = holiday.approved;
              const isRejected = holiday.rejected;
              const isWithinLimit = idx < capacity;

              return (
                <div
                  key={holiday.id}
                  className={`p-4 rounded border-l-4 ${
                    isRejected
                      ? 'bg-red-50 border-red-400'
                      : isApproved
                      ? 'bg-green-50 border-green-400'
                      : isWithinLimit
                      ? 'bg-blue-50 border-blue-400'
                      : 'bg-yellow-50 border-yellow-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <span className="font-bold text-lg w-6 text-center">{idx + 1}</span>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {holiday.userEmail.split('@')[0]}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(holiday.timestamp?.toDate?.() || 0).toLocaleTimeString('de-DE')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {isApproved && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">
                          ✅ Genehmigt
                        </span>
                      )}
                      {isRejected && (
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-semibold">
                          ❌ Abgelehnt
                        </span>
                      )}
                      {!isApproved && !isRejected && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApprove(holiday.id, idx + 1)}
                            disabled={loading}
                            className="px-3 py-1 bg-green-600 text-white rounded text-xs font-semibold hover:bg-green-700 transition disabled:bg-gray-400"
                          >
                            ✅ OK
                          </button>
                          <button
                            onClick={() => handleReject(holiday.id, idx + 1)}
                            disabled={loading}
                            className="px-3 py-1 bg-red-600 text-white rounded text-xs font-semibold hover:bg-red-700 transition disabled:bg-gray-400"
                          >
                            ❌ Nein
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 一括承認ボタン */}
        {holidayRequests.some((h) => !h.approved && !h.rejected) && (
          <button
            onClick={handleApproveAll}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400"
          >
            {loading ? 'Verarbeitung...' : `Erste ${Math.min(capacity, holidayRequests.length)} genehmigen`}
          </button>
        )}
      </div>
    </div>
  );
}

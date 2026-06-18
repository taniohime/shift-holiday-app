import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, where, getDocs, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import Calendar from './Calendar';

const HOLIDAY_TYPES = [
  { id: 'V', label: 'Vormittag (V)', color: 'bg-blue-100 text-blue-800' },
  { id: 'N', label: 'Nachmittag (N)', color: 'bg-green-100 text-green-800' },
  { id: 'G', label: 'Ganztags (G)', color: 'bg-purple-100 text-purple-800' },
  { id: 'U', label: 'Unbezahlte Urlaub (U)', color: 'bg-red-100 text-red-800' },
];

export default function EmployeeView({ user }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedType, setSelectedType] = useState('V');
  const [userHolidays, setUserHolidays] = useState([]);
  const [allHolidays, setAllHolidays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // ユーザーの希望を取得
  useEffect(() => {
    const fetchUserHolidays = async () => {
      try {
        const q = query(
          collection(db, 'holidays'),
          where('userId', '==', user.uid)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setUserHolidays(data);
      } catch (err) {
        console.error('ユーザーの希望取得エラー:', err);
      }
    };
    fetchUserHolidays();
  }, [user.uid]);

  // その日の全ての希望を取得してランキング表示
  useEffect(() => {
    const fetchDayHolidays = async () => {
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
        setAllHolidays(data);
      } catch (err) {
        console.error('その日の希望取得エラー:', err);
      }
    };
    fetchDayHolidays();
  }, [selectedDate, selectedType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const dateStr = selectedDate.toISOString().split('T')[0];

      // 既に同じ日付・タイプで希望していないか確認
      const existing = userHolidays.find(
        (h) => h.date === dateStr && h.type === selectedType
      );
      if (existing) {
        setMessage('この日付・タイプは既に希望送信済みです');
        setLoading(false);
        return;
      }

      await addDoc(collection(db, 'holidays'), {
        userId: user.uid,
        userEmail: user.email,
        date: dateStr,
        type: selectedType,
        timestamp: serverTimestamp(),
        approved: selectedType === 'U', // U は自動承認
      });

      setMessage('✅ 希望を送信しました');
      setSelectedType('V');

      // 最新のデータを再取得
      const q = query(
        collection(db, 'holidays'),
        where('userId', '==', user.uid)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setUserHolidays(data);
    } catch (err) {
      setMessage('❌ エラーが発生しました: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const dateStr = selectedDate.toISOString().split('T')[0];
  const userSubmitted = userHolidays.some(
    (h) => h.date === dateStr && h.type === selectedType
  );

  return (
    <div className="space-y-8">
      {/* カレンダー */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">📅 Kalender</h2>
        <Calendar
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          userHolidays={userHolidays}
        />
      </div>

      {/* 希望入力フォーム */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 入力パネル */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">
            Urlaubswunsch für {selectedDate.toLocaleDateString('de-DE')}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Urlaubstyp
              </label>
              <div className="space-y-2">
                {HOLIDAY_TYPES.map((type) => (
                  <label key={type.id} className="flex items-center">
                    <input
                      type="radio"
                      name="type"
                      value={type.id}
                      checked={selectedType === type.id}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="ml-3 text-sm text-gray-700">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {message && (
              <div className={`px-4 py-2 rounded text-sm ${
                message.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || userSubmitted}
              className={`w-full py-2 rounded font-semibold transition ${
                userSubmitted
                  ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {loading ? 'Sende...' : userSubmitted ? '✅ Bereits eingereicht' : 'Wunsch einreichen'}
            </button>
          </form>
        </div>

        {/* ランキング表示 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Ranking für {selectedType} am {selectedDate.toLocaleDateString('de-DE')}
          </h2>

          {allHolidays.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Keine Wünsche für diesen Tag</p>
          ) : (
            <div className="space-y-2">
              {allHolidays.map((holiday, idx) => {
                const isCurrentUser = holiday.userId === user.uid;
                const isApproved = holiday.approved;

                return (
                  <div
                    key={holiday.id}
                    className={`p-3 rounded border-l-4 ${
                      isCurrentUser ? 'bg-yellow-50 border-yellow-400' : 'bg-gray-50 border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="font-bold text-lg w-6 text-center">{idx + 1}</span>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {holiday.userEmail.split('@')[0]}
                            {isCurrentUser && ' (Du)'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(holiday.timestamp?.toDate?.() || 0).toLocaleTimeString('de-DE')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {isApproved ? (
                          <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">
                            ✅ Genehmigt
                          </span>
                        ) : (
                          <span className="inline-block bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-semibold">
                            ⏳ Warteschlange
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

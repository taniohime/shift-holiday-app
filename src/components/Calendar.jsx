import React from 'react';

export default function Calendar({ selectedDate, onSelectDate, userHolidays }) {
  const [displayMonth, setDisplayMonth] = React.useState(new Date(selectedDate));

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    // getDay() は日曜=0 を返すため、月曜=0 になるよう変換
    return (new Date(date.getFullYear(), date.getMonth(), 1).getDay() + 6) % 7;
  };

  const days = [];
  const daysInMonth = getDaysInMonth(displayMonth);
  const firstDay = getFirstDayOfMonth(displayMonth);

  // 前月の日付を埋める
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // 当月の日付
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const handlePrevMonth = () => {
    setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1));
  };

  const hasHoliday = (day) => {
    if (!day) return false;
    const dateStr = new Date(
      displayMonth.getFullYear(),
      displayMonth.getMonth(),
      day
    ).toISOString().split('T')[0];
    return userHolidays.some((h) => h.date === dateStr);
  };

  const isSelected = (day) => {
    if (!day) return false;
    const dateStr = new Date(
      displayMonth.getFullYear(),
      displayMonth.getMonth(),
      day
    ).toISOString().split('T')[0];
    const selectedStr = selectedDate.toISOString().split('T')[0];
    return dateStr === selectedStr;
  };

  const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  return (
    <div className="space-y-4">
      {/* 月選択 */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevMonth}
          className="p-2 hover:bg-gray-100 rounded"
        >
          ◀
        </button>
        <h3 className="text-lg font-bold">
          {displayMonth.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
        </h3>
        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-gray-100 rounded"
        >
          ▶
        </button>
      </div>

      {/* カレンダーグリッド */}
      <div className="grid grid-cols-7 gap-1">
        {/* 曜日ヘッダー */}
        {weekDays.map((day) => (
          <div key={day} className="text-center font-semibold text-gray-600 py-2 text-sm">
            {day}
          </div>
        ))}

        {/* 日付セル */}
        {days.map((day, idx) => (
          <button
            key={idx}
            onClick={() => {
              if (day) {
                const newDate = new Date(
                  displayMonth.getFullYear(),
                  displayMonth.getMonth(),
                  day
                );
                onSelectDate(newDate);
              }
            }}
            disabled={!day}
            className={`aspect-square p-1 rounded text-sm font-semibold transition ${
              !day
                ? 'bg-gray-50 text-gray-300 cursor-default'
                : isSelected(day)
                ? 'bg-blue-600 text-white'
                : hasHoliday(day)
                ? 'bg-green-200 text-green-900 hover:bg-green-300'
                : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      <div className="text-xs text-gray-500 space-y-1 mt-4 pt-4 border-t">
        <p>🟦 = Ausgewähltes Datum</p>
        <p>🟩 = Urlaubswunsch eingereicht</p>
      </div>
    </div>
  );
}

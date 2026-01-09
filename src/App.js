import React, { useState, useEffect } from "react";
import "./App.css";

function getMonthWeeks(year, month) {
  const weeks = [];

  let current = new Date(Date.UTC(year, month, 1));
  while (current.getUTCDay() !== 1) { // 1 = Monday
    current.setUTCDate(current.getUTCDate() + 1);
  }

  while (current.getUTCMonth() === month) {
    const week = [];

    for (let i = 0; i < 5; i++) {
      if (current.getUTCMonth() === month) {
        const dateStr = current.toISOString().slice(0, 10);
        week.push(dateStr);
      }
      current.setUTCDate(current.getUTCDate() + 1);
    }

    if (week.length > 0) {
      weeks.push(week);
    }

    current.setUTCDate(current.getUTCDate() + 2);
  }

  return weeks;
}


function parseTime(time) {
  const [h, m] = time.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function calculateWorkedHours(day) {
  if (!day.workStart || !day.workEnd) return 0;
  const start = parseTime(day.workStart).getTime();
  const end = parseTime(day.workEnd).getTime();
  let totalMs = end - start;
  (day.pauses || []).forEach((p) => {
    if (p.pauseStart && p.pauseEnd) {
      totalMs -= parseTime(p.pauseEnd).getTime() - parseTime(p.pauseStart).getTime();
    }
  });
  return totalMs / (1000 * 60 * 60);
}

function exportToExcel(workDays, weeks, monthName) {
  let csv = "Date,Day,Start,End,Pauses,Time Off (h),Worked (h),Status\n";

  weeks.forEach(week => {
    week.forEach(date => {
      const day = workDays[date] || {};
      // Parse date as UTC to avoid timezone issues
      const [year, month, dayNum] = date.split('-').map(Number);
      const dateObj = new Date(Date.UTC(year, month - 1, dayNum));
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
      const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

      if (day.isVacation) {
        csv += `${formattedDate},${dayName},-,-,-,-,-,Full Day Off\n`;
      } else {
        const pauses = (day.pauses || [])
          .map(p => `${p.pauseStart}-${p.pauseEnd}`)
          .join('; ') || '-';
        const worked = calculateWorkedHours(day).toFixed(2);
        const timeOff = day.timeOffHours || '-';
        csv += `${formattedDate},${dayName},${day.workStart || '-'},${day.workEnd || '-'},"${pauses}",${timeOff},${worked},Worked\n`;
      }
    });
  });

  // Add summary
  const allDays = weeks.flat();
  const totalHours = allDays.reduce((sum, d) => {
    const day = workDays[d] || {};
    return day.isVacation ? sum : sum + calculateWorkedHours(day);
  }, 0);
  const totalTimeOff = allDays.reduce((sum, d) => {
    const day = workDays[d] || {};
    if (day.isVacation) return sum + 8;
    return sum + parseFloat(day.timeOffHours || 0);
  }, 0);

  csv += `\nSummary\n`;
  csv += `Total Hours Worked,${totalHours.toFixed(2)}\n`;
  csv += `Total Time Off (h),${totalTimeOff.toFixed(2)}\n`;

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `work-hours-${monthName}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function App() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [weeks, setWeeks] = useState([]);
  const [workDays, setWorkDays] = useState({});

  useEffect(() => {
    setWeeks(getMonthWeeks(currentYear, currentMonth));
  }, [currentMonth, currentYear]);

  useEffect(() => {
    const stored = localStorage.getItem("workDays");
    if (stored) setWorkDays(JSON.parse(stored));
  }, []);

  useEffect(() => {
    localStorage.setItem("workDays", JSON.stringify(workDays));
  }, [workDays]);

  const updateDay = (date, field, value) => {
    setWorkDays((prev) => ({
      ...prev,
      [date]: {
        ...prev[date],
        [field]: value,
        pauses: prev[date]?.pauses || [],
      },
    }));
  };

  const addPause = (date) => {
    setWorkDays((prev) => ({
      ...prev,
      [date]: {
        ...prev[date],
        pauses: [...(prev[date]?.pauses || []), { pauseStart: "", pauseEnd: "" }],
      },
    }));
  };

  const updatePause = (date, index, field, value) => {
    const newPauses = [...(workDays[date]?.pauses || [])];
    newPauses[index][field] = value;
    setWorkDays((prev) => ({
      ...prev,
      [date]: {
        ...prev[date],
        pauses: newPauses,
      },
    }));
  };

  const toggleVacation = (date) => {
    setWorkDays((prev) => ({
      ...prev,
      [date]: {
        ...prev[date],
        isVacation: !prev[date]?.isVacation,
        pauses: prev[date]?.pauses || [],
      },
    }));
  };

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToCurrentMonth = () => {
    const today = new Date();
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  const handleExport = () => {
    const monthName = new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    exportToExcel(workDays, weeks, monthName.replace(' ', '-'));
  };

  const allDays = weeks.flat();
  const totalMonthHours = allDays.reduce((sum, d) => {
    const day = workDays[d] || {};
    return day.isVacation ? sum : sum + calculateWorkedHours(day);
  }, 0);

  const totalTimeOffHours = allDays.reduce((sum, d) => {
    const day = workDays[d] || {};
    if (day.isVacation) return sum + 8;
    return sum + parseFloat(day.timeOffHours || 0);
  }, 0);

  const workedDays = allDays.filter(d => {
    const day = workDays[d] || {};
    return !day.isVacation && calculateWorkedHours(day) > 0;
  }).length;

  const avgHoursPerDay = workedDays > 0 ? totalMonthHours / workedDays : 0;

  // Calculate weekly totals
  const weeklyStats = weeks.map((weekDays, index) => {
    const weekHours = weekDays.reduce((sum, date) => {
      const day = workDays[date] || {};
      return day.isVacation ? sum : sum + calculateWorkedHours(day);
    }, 0);
    const weekTimeOff = weekDays.reduce((sum, date) => {
      const day = workDays[date] || {};
      if (day.isVacation) return sum + 8;
      return sum + parseFloat(day.timeOffHours || 0);
    }, 0);
    return { weekNumber: index + 1, hours: weekHours, timeOff: weekTimeOff };
  });

  const monthName = new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
      <div className="container">
        <div className="header">
          <h1>Work Hours Tracker</h1>
          <div className="month-nav">
            <button onClick={goToPreviousMonth}>←</button>
            <h2>{monthName}</h2>
            <button onClick={goToNextMonth}>→</button>
            <button className="today-btn" onClick={goToCurrentMonth}>Today</button>
          </div>
          <button className="export-btn" onClick={handleExport}>Download Excel</button>
        </div>

        {weeks.map((weekDays, weekIndex) => (
          <div key={weekIndex} className="week-section">
            <h3 className="week-label">Week {weekIndex + 1}</h3>
            <div className="week-grid">
              {weekDays.map((date) => {
                const day = workDays[date] || {};
                // Parse date as UTC to avoid timezone issues
                const [year, month, dayNum] = date.split('-').map(Number);
                const dateObj = new Date(Date.UTC(year, month - 1, dayNum));
                return (
                    <div key={date} className={`day-card ${day.isVacation ? 'vacation' : ''}`}>
                      <h3>{dateObj.toLocaleDateString('en-US', { weekday: "short", month: "short", day: "numeric", timeZone: 'UTC' })}</h3>

                      <label className="vacation-toggle">
                        <input type="checkbox" checked={day.isVacation || false} onChange={() => toggleVacation(date)} />
                        <span>Full Day Off</span>
                      </label>

                      {!day.isVacation && (
                        <>
                          <label>
                            Start:
                            <input type="text" placeholder="9:00" value={day.workStart || ""} onChange={(e) => updateDay(date, "workStart", e.target.value)} />
                          </label>
                          <label>
                            End:
                            <input type="text" placeholder="17:00" value={day.workEnd || ""} onChange={(e) => updateDay(date, "workEnd", e.target.value)} />
                          </label>
                          <div className="pauses">
                            {(day.pauses || []).map((p, i) => (
                                <div key={i} className="flex-row">
                                  <input type="text" placeholder="12:00" value={p.pauseStart} onChange={(e) => updatePause(date, i, "pauseStart", e.target.value)} />
                                  <input type="text" placeholder="13:00" value={p.pauseEnd} onChange={(e) => updatePause(date, i, "pauseEnd", e.target.value)} />
                                </div>
                            ))}
                            <button className="add-btn" onClick={() => addPause(date)}>+ Pause</button>
                          </div>
                          <label>
                            Time Off (hours):
                            <input type="text" placeholder="0" value={day.timeOffHours || ""} onChange={(e) => updateDay(date, "timeOffHours", e.target.value)} />
                          </label>
                          <div className="day-summary">
                            <p><strong>Worked: {calculateWorkedHours(day).toFixed(2)}h</strong></p>
                            {day.timeOffHours && parseFloat(day.timeOffHours) > 0 && (
                              <p className="time-off-hours"><strong>Time Off: {parseFloat(day.timeOffHours || 0).toFixed(2)}h</strong></p>
                            )}
                          </div>
                        </>
                      )}
                      {day.isVacation && <p className="vacation-text">Full Day Off</p>}
                    </div>
                );
              })}
            </div>
          </div>
        ))}

        <div className="weekly-analytics">
          <h2>Weekly Breakdown</h2>
          <div className="weekly-grid">
            {weeklyStats.map((week) => (
              <div key={week.weekNumber} className={`weekly-stat ${week.hours >= 40 ? 'target-met' : ''}`}>
                <div className="weekly-header">Week {week.weekNumber}</div>
                <div className="weekly-hours">{week.hours.toFixed(1)}h</div>
                <div className="weekly-target">
                  {week.hours >= 40 ? '✓ Target Met' : `${(40 - week.hours).toFixed(1)}h to 40h`}
                </div>
                {week.timeOff > 0 && (
                  <div className="weekly-timeoff">{week.timeOff.toFixed(1)}h time off</div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="analytics">
          <h2>Month Summary</h2>
          <div className="stats-grid">
            <div className="stat">
              <div className="stat-value">{totalMonthHours.toFixed(1)}h</div>
              <div className="stat-label">Total Hours</div>
            </div>
            <div className="stat">
              <div className="stat-value">{workedDays}</div>
              <div className="stat-label">Days Worked</div>
            </div>
            <div className="stat">
              <div className="stat-value">{avgHoursPerDay.toFixed(1)}h</div>
              <div className="stat-label">Avg per Day</div>
            </div>
            <div className="stat">
              <div className="stat-value">{totalTimeOffHours.toFixed(1)}h</div>
              <div className="stat-label">Time Off</div>
            </div>
          </div>
        </div>
      </div>
  );
}

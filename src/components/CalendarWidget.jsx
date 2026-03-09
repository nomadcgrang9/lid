import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import './CalendarWidget.css'

// "4월3일" + year → Date 파싱
function parseScheduleDate(dateStr, year) {
  if (!dateStr || !year) return null
  const match = dateStr.match(/(\d+)월\s*(\d+)일/)
  if (!match) return null
  const month = parseInt(match[1], 10) - 1
  const day = parseInt(match[2], 10)
  if (month < 0 || month > 11 || day < 1 || day > 31) return null
  return new Date(year, month, day)
}

function CalendarWidget({ schedules = [] }) {
  const navigate = useNavigate()
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState(null)

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  // 일정을 날짜별로 매핑
  const scheduleMap = useMemo(() => {
    const map = {}
    schedules.forEach(s => {
      const d = parseScheduleDate(s.date, s.year)
      if (!d) return
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      if (!map[key]) map[key] = []
      map[key].push(s)
    })
    return map
  }, [schedules])

  // 다가오는 일정 (오늘 이후, 최대 3개)
  const upcomingSchedules = useMemo(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return schedules
      .map(s => ({ ...s, _parsed: parseScheduleDate(s.date, s.year) }))
      .filter(s => s._parsed && s._parsed >= now)
      .sort((a, b) => a._parsed - b._parsed)
      .slice(0, 4)
  }, [schedules])

  // 선택된 날짜의 일정
  const selectedSchedules = useMemo(() => {
    if (!selectedDate) return []
    const key = `${selectedDate.getFullYear()}-${selectedDate.getMonth()}-${selectedDate.getDate()}`
    return scheduleMap[key] || []
  }, [selectedDate, scheduleMap])

  // 표시할 일정: 선택된 날짜가 있으면 그 일정, 없으면 다가오는 일정
  const displaySchedules = selectedDate ? selectedSchedules : upcomingSchedules
  const displayTitle = selectedDate
    ? `${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일 일정`
    : '다가오는 일정'

  // 달력 그리드 생성
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells = []
  for (let i = 0; i < firstDay; i++) {
    cells.push({ day: null, key: `empty-${i}` })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${year}-${month}-${d}`
    const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d
    const hasSchedule = !!scheduleMap[dateKey]
    const isSelected = selectedDate &&
      selectedDate.getFullYear() === year &&
      selectedDate.getMonth() === month &&
      selectedDate.getDate() === d
    cells.push({ day: d, key: `day-${d}`, isToday, hasSchedule, isSelected, dateKey })
  }

  const prevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1))
    setSelectedDate(null)
  }
  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1))
    setSelectedDate(null)
  }

  const handleDayClick = (cell) => {
    if (!cell.day) return
    const clicked = new Date(year, month, cell.day)
    if (selectedDate && selectedDate.getTime() === clicked.getTime()) {
      setSelectedDate(null)
    } else {
      setSelectedDate(clicked)
    }
  }

  const dayLabels = ['일', '월', '화', '수', '목', '금', '토']

  return (
    <div className="calendar-widget">
      {/* 캘린더 영역 */}
      <div className="calendar-card">
        <div className="cal-header">
          <button className="cal-nav-btn" onClick={prevMonth}>
            <ChevronLeft size={16} />
          </button>
          <span className="cal-title">{year}년 {month + 1}월</span>
          <button className="cal-nav-btn" onClick={nextMonth}>
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="cal-grid cal-weekdays">
          {dayLabels.map((label, i) => (
            <div
              key={label}
              className={`cal-weekday ${i === 0 ? 'sunday' : ''} ${i === 6 ? 'saturday' : ''}`}
            >
              {label}
            </div>
          ))}
        </div>

        <div className="cal-grid cal-days">
          {cells.map((cell) => (
            <div
              key={cell.key}
              className={[
                'cal-day',
                !cell.day ? 'empty' : '',
                cell.isToday ? 'today' : '',
                cell.isSelected ? 'selected' : '',
                cell.hasSchedule ? 'has-schedule' : ''
              ].filter(Boolean).join(' ')}
              onClick={() => cell.day && handleDayClick(cell)}
            >
              {cell.day && (
                <>
                  <span className="cal-day-num">{cell.day}</span>
                  {cell.hasSchedule && <span className="cal-dot" />}
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 일정 프리뷰 - 같은 카드 내 구분선 아래 */}
      <div className="cal-preview">
        {displaySchedules.length > 0 ? (
          <ul className="cal-preview-list">
            {displaySchedules.map((s, i) => {
              const parsed = s._parsed || parseScheduleDate(s.date, s.year)
              const isPast = parsed && parsed < today
              return (
                <li key={s.id || i} className={`cal-preview-item ${isPast ? 'past' : 'upcoming'}`}>
                  <span className="cal-preview-dot" />
                  <div className="cal-preview-content">
                    <span className="cal-preview-date">
                      {s.date} - 제{s.round}회
                    </span>
                    <span className="cal-preview-topic">
                      {s.topic?.split('\n')[0]?.substring(0, 24)}
                      {s.topic?.split('\n')[0]?.length > 24 ? '...' : ''}
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="cal-preview-empty">
            {selectedDate ? '등록된 일정이 없습니다.' : '다가오는 일정이 없습니다.'}
          </p>
        )}
        <button className="cal-view-all" onClick={() => navigate('/schedule')}>
          전체 일정 보기 →
        </button>
      </div>
    </div>
  )
}

export default CalendarWidget

import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Lock, 
  X, 
  CheckCircle2, 
  Flame,
  Sparkles
} from 'lucide-react';
import { getToday, getYesterday, parseLocalDateString, getLocalDateString, offsetDateString } from '@/utils/date';
import { triggerHaptic } from '@/utils/haptics';

interface CalendarDatePickerProps {
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
  className?: string;
  badgeLabel?: string;
}

export const CalendarDatePicker: React.FC<CalendarDatePickerProps> = ({
  selectedDate,
  onSelectDate,
  className = '',
  badgeLabel
}) => {
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const todayStr = getToday();

  // Viewing month in the calendar modal (defaults to selectedDate or today)
  const [viewYear, setViewYear] = useState(() => parseLocalDateString(selectedDate).getFullYear());
  const [viewMonth, setViewMonth] = useState(() => parseLocalDateString(selectedDate).getMonth()); // 0-11

  const isToday = selectedDate === todayStr;
  const isNextDisabled = selectedDate >= todayStr;

  const handlePrevDay = () => {
    triggerHaptic('light');
    const prev = offsetDateString(selectedDate, -1);
    onSelectDate(prev);
  };

  const handleNextDay = () => {
    if (isNextDisabled) return;
    triggerHaptic('light');
    const next = offsetDateString(selectedDate, 1);
    if (next <= todayStr) {
      onSelectDate(next);
    }
  };

  const handleOpenModal = () => {
    triggerHaptic('medium');
    const d = parseLocalDateString(selectedDate);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    setIsCalendarModalOpen(true);
  };

  const handleSelectCalendarDay = (dateStr: string) => {
    if (dateStr > todayStr) return; // Locked
    triggerHaptic('light');
    onSelectDate(dateStr);
    setIsCalendarModalOpen(false);
  };

  // Format label for display
  const formattedDateLabel = useMemo(() => {
    if (selectedDate === todayStr) return 'Today';
    if (selectedDate === getYesterday()) return 'Yesterday';
    const d = parseLocalDateString(selectedDate);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });
  }, [selectedDate, todayStr]);

  // Calendar Grid generation
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    const lastDayOfMonth = new Date(viewYear, viewMonth + 1, 0);

    // Days in current month
    const totalDays = lastDayOfMonth.getDate();

    // Day of week index (Monday = 0, Sunday = 6)
    let startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;

    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean; isFuture: boolean; isToday: boolean; isSelected: boolean }[] = [];

    // Prev month padding
    const prevMonthLastDay = new Date(viewYear, viewMonth, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(viewYear, viewMonth - 1, prevMonthLastDay - i);
      const str = getLocalDateString(d);
      days.push({
        dateStr: str,
        dayNum: prevMonthLastDay - i,
        isCurrentMonth: false,
        isFuture: str > todayStr,
        isToday: str === todayStr,
        isSelected: str === selectedDate
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(viewYear, viewMonth, i);
      const str = getLocalDateString(d);
      days.push({
        dateStr: str,
        dayNum: i,
        isCurrentMonth: true,
        isFuture: str > todayStr,
        isToday: str === todayStr,
        isSelected: str === selectedDate
      });
    }

    // Next month padding to fill grid to 35 or 42
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(viewYear, viewMonth + 1, i);
      const str = getLocalDateString(d);
      days.push({
        dateStr: str,
        dayNum: i,
        isCurrentMonth: false,
        isFuture: str > todayStr,
        isToday: str === todayStr,
        isSelected: str === selectedDate
      });
    }

    return days;
  }, [viewYear, viewMonth, todayStr, selectedDate]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    // Only allow advancing if not past current year/month
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    if (viewYear > currentYear || (viewYear === currentYear && viewMonth >= currentMonth)) {
      return; // Locked for future months
    }

    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const isNextMonthDisabled = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    return viewYear > currentYear || (viewYear === currentYear && viewMonth >= currentMonth);
  }, [viewYear, viewMonth]);

  return (
    <>
      {/* 1. Sleek Date Capsule Pill with Calendar Button & Future Lock */}
      <div className={`inline-flex items-center gap-1.5 bg-[#0A0E1A]/95 p-1 rounded-2xl border border-white/10 shadow-lg ${className}`}>
        {/* Previous Day Button */}
        <button
          type="button"
          onClick={handlePrevDay}
          className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors pressable"
          title="Previous Day"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Center Interactive Calendar Modal Trigger */}
        <button
          type="button"
          onClick={handleOpenModal}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all pressable group"
          title="Open interactive calendar"
        >
          <CalendarIcon className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-mono font-bold text-white tracking-tight">
            {formattedDateLabel}
          </span>
          {badgeLabel && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
              {badgeLabel}
            </span>
          )}
        </button>

        {/* Next Day Button (LOCKED when today) */}
        <button
          type="button"
          onClick={handleNextDay}
          disabled={isNextDisabled}
          className={`p-1.5 rounded-xl transition-all ${
            isNextDisabled
              ? 'text-slate-600 opacity-40 cursor-not-allowed'
              : 'text-slate-400 hover:text-white hover:bg-white/10 pressable'
          }`}
          title={isNextDisabled ? 'Future dates are locked' : 'Next Day'}
        >
          {isNextDisabled ? (
            <Lock className="w-3.5 h-3.5 text-slate-600" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* 2. Interactive Calendar Modal with Locked Future Days */}
      {isCalendarModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-sm bg-[#090E1A] border border-emerald-500/30 rounded-3xl p-6 shadow-2xl overflow-hidden animate-scale-up">
            {/* Ambient Background Glow */}
            <div className="absolute -top-16 -right-16 w-36 h-36 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-teal-500/15 rounded-full blur-2xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 relative z-10">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider font-heading">
                    Select Training Date
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Future dates are locked
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCalendarModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors pressable"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Month Stepper Header */}
            <div className="flex items-center justify-between py-3.5 relative z-10">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors pressable"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-sm font-bold font-heading text-white">
                {monthNames[viewMonth]} {viewYear}
              </span>

              <button
                type="button"
                onClick={handleNextMonth}
                disabled={isNextMonthDisabled}
                className={`p-1.5 rounded-xl transition-colors ${
                  isNextMonthDisabled 
                    ? 'text-slate-600 opacity-40 cursor-not-allowed' 
                    : 'text-slate-400 hover:text-white hover:bg-white/10 pressable'
                }`}
                title={isNextMonthDisabled ? 'Future months locked' : 'Next Month'}
              >
                {isNextMonthDisabled ? (
                  <Lock className="w-3.5 h-3.5 text-slate-600" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Weekday Labels (Mon-Sun) */}
            <div className="grid grid-cols-7 gap-1 text-center py-1 text-[11px] font-mono font-bold text-slate-400">
              <span>M</span>
              <span>T</span>
              <span>W</span>
              <span>T</span>
              <span>F</span>
              <span>S</span>
              <span>S</span>
            </div>

            {/* Calendar Days Grid */}
            <div className="grid grid-cols-7 gap-1.5 pt-2 relative z-10">
              {calendarDays.map((day, idx) => {
                const isSelected = day.isSelected;
                const isDayToday = day.isToday;
                const isLocked = day.isFuture;

                return (
                  <button
                    key={`${day.dateStr}-${idx}`}
                    type="button"
                    disabled={isLocked}
                    onClick={() => handleSelectCalendarDay(day.dateStr)}
                    className={`h-9 rounded-xl flex flex-col items-center justify-center relative transition-all text-xs font-mono font-semibold ${
                      isSelected
                        ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black shadow-[0_0_12px_rgba(16,185,129,0.5)] scale-105 z-10'
                        : isDayToday
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : isLocked
                        ? 'bg-white/[0.01] text-slate-600 cursor-not-allowed opacity-40'
                        : day.isCurrentMonth
                        ? 'text-slate-200 hover:bg-white/10 active:scale-95'
                        : 'text-slate-400 hover:bg-white/5'
                    }`}
                    title={isLocked ? 'Future date is locked' : day.dateStr}
                  >
                    <span>{day.dayNum}</span>
                    {isLocked && (
                      <Lock className="w-2.5 h-2.5 text-slate-600 absolute bottom-0.5" />
                    )}
                    {isDayToday && !isSelected && (
                      <span className="w-1 h-1 rounded-full bg-emerald-400 absolute bottom-1" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick Jumps */}
            <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between gap-2 relative z-10">
              <button
                type="button"
                onClick={() => handleSelectCalendarDay(todayStr)}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-mono font-bold transition-all ${
                  selectedDate === todayStr 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                Today
              </button>

              <button
                type="button"
                onClick={() => handleSelectCalendarDay(getYesterday())}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-mono font-bold transition-all ${
                  selectedDate === getYesterday() 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                Yesterday
              </button>

              <button
                type="button"
                onClick={() => handleSelectCalendarDay(offsetDateString(todayStr, -7))}
                className="flex-1 py-1.5 px-2 rounded-xl text-xs font-mono font-bold bg-white/5 text-slate-300 hover:bg-white/10 transition-all"
              >
                -7 Days
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

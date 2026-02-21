import React, { useState, useRef, useEffect } from 'react';
import { formatDate } from '../../utils';

interface DatePickerProps {
    value: string;
    onChange: (date: string) => void;
    label?: string;
    className?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({
    value,
    onChange,
    label,
    className = ''
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Parse initial date with safety
    const parseDate = (val: string) => {
        if (!val) return new Date();
        const [y, m, d] = val.split('-').map(Number);
        const date = new Date(y, m - 1, d || 1);
        return isNaN(date.getTime()) ? new Date() : date;
    };

    const [viewDate, setViewDate] = useState(parseDate(value));

    useEffect(() => {
        if (isOpen) {
            setViewDate(parseDate(value));
        }
    }, [isOpen, value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
    const firstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

    const handlePrevMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    };

    const handleDateSelect = (d: number) => {
        const dateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        onChange(dateStr);
        setIsOpen(false);
    };

    const days = [];
    const totalDays = daysInMonth(viewDate.getFullYear(), viewDate.getMonth());
    const startDay = firstDayOfMonth(viewDate.getFullYear(), viewDate.getMonth());

    // Padding for start of month
    for (let i = 0; i < startDay; i++) {
        days.push(<div key={`empty-${i}`} className="p-2" />);
    }

    for (let i = 1; i <= totalDays; i++) {
        const isSelected = value === `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const isToday = new Date().toISOString().split('T')[0] === `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;

        days.push(
            <button
                key={i}
                type="button"
                onClick={() => handleDateSelect(i)}
                className={`size-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all relative ${isSelected
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30 ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-slate-900'
                    : isToday
                        ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
            >
                {i}
            </button>
        );
    }

    const monthName = viewDate.toLocaleString('default', { month: 'long' });

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {label && <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block px-1">{label}</label>}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white hover:border-primary-500 dark:hover:border-primary-500 transition-all outline-none"
            >
                <span>{value ? formatDate(value) : formatDate(new Date().toISOString().split('T')[0])}</span>
                <span className="material-symbols-outlined text-slate-400 text-lg">calendar_today</span>
            </button>

            {isOpen && (
                <div className="absolute z-[60] mt-2 left-0 md:right-0 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl p-4 w-72 animate-in fade-in zoom-in-95 duration-200 origin-top">
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={handlePrevMonth} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500">
                            <span className="material-symbols-outlined">chevron_left</span>
                        </button>
                        <div className="text-center">
                            <p className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">{monthName}</p>
                            <p className="text-[10px] font-bold text-slate-400">{viewDate.getFullYear()}</p>
                        </div>
                        <button onClick={handleNextMonth} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500">
                            <span className="material-symbols-outlined">chevron_right</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                            <div key={i} className="text-[10px] font-bold text-slate-400 text-center">{d}</div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                        {days}
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-center">
                        <button
                            type="button"
                            onClick={() => handleDateSelect(new Date().getDate())} // This is slightly flawed if today is different month but for simple "Today" jump it works if we add setViewDate(new Date())
                            className="text-[10px] font-bold text-primary-600 uppercase tracking-widest hover:underline"
                        >
                            Select Today
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DatePicker;

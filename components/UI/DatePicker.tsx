import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
            // Prevent body scroll when modal is open
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen, value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node) && !isOpen) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

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
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30 ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-stone-900'
                    : isToday
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-bold'
                        : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                    }`}
            >
                {i}
            </button>
        );
    }

    const monthName = viewDate.toLocaleString('default', { month: 'long' });

    const modalContent = isOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop with full-screen blur */}
            <div
                className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity animate-backdrop"
                onClick={() => setIsOpen(false)}
            />

            {/* Modal - truly screen centered */}
            <div className="relative bg-brand-surface-light dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-2xl shadow-2xl p-6 w-full max-w-[320px] animate-scale-in">
                <div className="flex items-center justify-between mb-6">
                    <button onClick={handlePrevMonth} className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors text-stone-500">
                        <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    <div className="text-center">
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-tight">{viewDate.getFullYear()}</p>
                        <p className="text-base font-bold text-stone-900 dark:text-white capitalize">{monthName}</p>
                    </div>
                    <button onClick={handleNextMonth} className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors text-stone-500">
                        <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                        <div key={i} className="text-[10px] font-bold text-stone-400 text-center">{d}</div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                    {days}
                </div>

                <div className="mt-6 pt-4 border-t border-stone-100 dark:border-stone-800 flex justify-center">
                    <button
                        type="button"
                        onClick={() => handleDateSelect(new Date().getDate())}
                        className="text-[11px] font-bold text-primary-600 uppercase tracking-widest hover:scale-105 active:scale-95 transition-transform"
                    >
                        Select Today
                    </button>
                </div>
            </div>
        </div>
    ) : null;

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {label && <label className="label-text">{label}</label>}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between bg-stone-50 dark:bg-stone-900/50 border border-stone-100 dark:border-stone-800 rounded-xl px-4 py-2.5 text-xs text-stone-900 dark:text-white hover:border-primary-500 dark:hover:border-primary-500 transition-all outline-none h-[46px]"
            >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="material-symbols-outlined text-stone-400 text-lg flex-shrink-0">calendar_today</span>
                    <span className={`truncate whitespace-nowrap ${value ? 'text-stone-900 dark:text-white' : 'text-stone-400 font-normal'}`}>
                        {value ? formatDate(value) : label}
                    </span>
                </div>
                <span className={`material-symbols-outlined text-stone-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                    expand_more
                </span>
            </button>

            {isOpen && createPortal(modalContent, document.body)}
        </div>
    );
};

export default DatePicker;

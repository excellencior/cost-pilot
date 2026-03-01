import React, { useState, useMemo } from 'react';
import { Transaction, Category } from '../../entities/types';
import { formatCompactNumber } from '../../entities/financial';


interface CalendarViewProps {
    transactions: Transaction[];
    categories: Category[];
    currencySymbol: string;
    onTransactionClick: (t: Transaction) => void;
    initialDate?: Date;
    typeFilter?: 'all' | 'income' | 'expense';
}

const CalendarView: React.FC<CalendarViewProps> = ({
    transactions,
    categories,
    currencySymbol,
    onTransactionClick,
    initialDate,
    typeFilter = 'all'
}) => {
    const [currentDate, setCurrentDate] = useState(initialDate || new Date());

    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const calendarData = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const numDays = daysInMonth(year, month);
        const startDay = firstDayOfMonth(year, month);

        const days = [];
        // padding for previous month
        for (let i = 0; i < startDay; i++) {
            days.push({ day: null, transactions: [] });
        }

        for (let d = 1; d <= numDays; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const dayTransactions = transactions.filter(t => {
                const matchesDate = t.date === dateStr;
                const matchesType = typeFilter === 'all' || t.type === typeFilter;
                return matchesDate && matchesType;
            });
            days.push({ day: d, date: dateStr, transactions: dayTransactions });
        }

        return days;
    }, [currentDate, transactions, typeFilter]);

    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const [animationDirection, setAnimationDirection] = useState<'left' | 'right' | null>(null);

    // Minimum distance for a swipe to be recognized
    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            changeMonth(1);
        } else if (isRightSwipe) {
            changeMonth(-1);
        }
    };

    const changeMonth = (offset: number) => {
        setAnimationDirection(offset > 0 ? 'right' : 'left');
        const nextDate = new Date(currentDate);
        nextDate.setMonth(currentDate.getMonth() + offset);
        setCurrentDate(nextDate);
    };

    const monthName = currentDate.toLocaleString('default', { month: 'long' });
    const year = currentDate.getFullYear();

    const getDayStats = (dayTransactions: Transaction[]) => {
        const income = dayTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expense = dayTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        return { income, expense };
    };

    return (
        <div
            className="space-y-4 animate-in fade-in duration-500 overflow-hidden"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            <div className="flex items-center justify-between bg-brand-surface-light dark:bg-brand-surface-dark p-1 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm relative z-10">
                <button
                    onClick={() => changeMonth(-1)}
                    className="size-9 flex items-center justify-center rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400 transition-colors"
                >
                    <span className="material-symbols-outlined text-lg">chevron_left</span>
                </button>
                <div className="text-center flex items-baseline justify-center gap-2">
                    <h3 className="text-sm font-black text-stone-900 dark:text-white uppercase tracking-widest">{monthName}</h3>
                    <p className="text-[15px] font-bold text-stone-400">{year}</p>
                </div>
                <button
                    onClick={() => changeMonth(1)}
                    className="size-9 flex items-center justify-center rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400 transition-colors"
                >
                    <span className="material-symbols-outlined text-lg">chevron_right</span>
                </button>
            </div>

            <div
                key={`${year}-${monthName}`}
                className={`grid grid-cols-7 gap-0.5 md:gap-1.5 transition-all duration-300 ${animationDirection === 'right' ? 'animate-slide-in-right' :
                        animationDirection === 'left' ? 'animate-slide-in-left' : ''
                    }`}
            >

                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
                    <div key={d} className="text-center py-2 text-[15px] font-black text-stone-400 tracking-widest">{d}</div>
                ))}
                {calendarData.map((data, idx) => {
                    const stats = data.day ? getDayStats(data.transactions) : null;
                    const isToday = data.day && new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), data.day).toDateString();

                    return (
                        <div
                            key={idx}
                            className={`min-h-[60px] md:min-h-[80px] bg-brand-surface-light dark:bg-brand-surface-dark rounded-lg border border-stone-100 dark:border-stone-800 p-0.5 flex flex-col justify-between transition-all ${!data.day ? 'opacity-20 grayscale' : 'hover:border-primary-200 dark:hover:border-primary-900/50'} ${isToday ? 'ring-1 ring-primary-500/30 border-primary-500/40 bg-primary-50/5 dark:bg-primary-900/5' : ''}`}

                        >
                            {data.day && (
                                <>
                                    <div className="flex items-center justify-between px-0.5">
                                        <span className={`text-[15px] font-black ${isToday ? 'bg-primary-500 text-white size-5 rounded-full flex items-center justify-center' : 'text-stone-500'}`}>
                                            {data.day}
                                        </span>
                                        {data.transactions.length > 0 && (
                                            <div className="flex gap-0.5">
                                                {stats!.income > 0 && <div className="size-1 rounded-full bg-green-500"></div>}
                                                {stats!.expense > 0 && <div className="size-1 rounded-full bg-rose-500"></div>}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 flex flex-col justify-end gap-0.5 px-1 pb-1">
                                        {(typeFilter === 'all' || typeFilter === 'income') && stats!.income > 0 && (
                                            <p className="text-[10px] md:text-[15px] font-black text-green-600 dark:text-green-400 leading-none truncate">
                                                +{formatCompactNumber(stats!.income)}
                                            </p>
                                        )}
                                        {(typeFilter === 'all' || typeFilter === 'expense') && stats!.expense > 0 && (
                                            <p className="text-[10px] md:text-[15px] font-black text-rose-600 dark:text-rose-400 leading-none truncate">
                                                -{formatCompactNumber(stats!.expense)}
                                            </p>
                                        )}

                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CalendarView;

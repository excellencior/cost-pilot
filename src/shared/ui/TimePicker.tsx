import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { createPortal } from 'react-dom';

export interface TimePickerHandle {
    open: () => void;
}

interface TimePickerProps {
    value: string; // HH:mm format (24h)
    onChange: (time: string) => void;
}

const TimePicker = forwardRef<TimePickerHandle, TimePickerProps>(({ value, onChange }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState<'hours' | 'minutes'>('hours');

    useImperativeHandle(ref, () => ({
        open: () => setIsOpen(true),
    }));

    // Parse Initial Time
    const [hour, setHour] = useState(12);
    const [minute, setMinute] = useState(0);
    const [period, setPeriod] = useState<'AM' | 'PM'>('AM');

    useEffect(() => {
        if (value) {
            const [h, m] = value.split(':').map(Number);
            setMinute(m || 0);
            if (h >= 12) {
                setPeriod('PM');
                setHour(h === 12 ? 12 : h - 12);
            } else {
                setPeriod('AM');
                setHour(h === 0 ? 12 : h);
            }
        }
    }, [value, isOpen]);

    const handleConfirm = () => {
        let h24 = hour;
        if (period === 'PM' && hour !== 12) h24 += 12;
        if (period === 'AM' && hour === 12) h24 = 0;

        const formatter = (n: number) => n.toString().padStart(2, '0');
        onChange(`${formatter(h24)}:${formatter(minute)}`);
        setIsOpen(false);
    };

    const handleClockClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
        if (angle < 0) angle += 360;

        if (mode === 'hours') {
            let selectedHour = Math.round(angle / 30);
            if (selectedHour === 0) selectedHour = 12;
            setHour(selectedHour);
            // Auto switch to minutes after selecting hour
            setTimeout(() => setMode('minutes'), 300);
        } else {
            let selectedMinute = Math.round(angle / 6) % 60;
            setMinute(selectedMinute);
        }
    };

    const renderClockNumbers = () => {
        const numbers = mode === 'hours' ? [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] : [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
        return numbers.map((num, i) => {
            const isSelected = mode === 'hours' ? hour === (num || 12) : minute === num;
            const angle = (i * 30 - 90) * (Math.PI / 180);
            const radius = 100; // clock radius
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);

            return (
                <div
                    key={i}
                    className={`absolute flex items-center justify-center size-8 -ml-4 -mt-4 rounded-full text-sm font-medium transition-colors ${isSelected
                            ? 'bg-[#AF8F42] text-white shadow-md'
                            : 'text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                        }`}
                    style={{ transform: `translate(${x + 128}px, ${y + 128}px)` }}
                >
                    {mode === 'minutes' ? num.toString().padStart(2, '0') : num}
                </div>
            );
        });
    };

    // Calculate hand rotation
    const handAngle = mode === 'hours' ? hour * 30 : minute * 6;

    const modalContent = isOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
                onClick={() => setIsOpen(false)}
            />

            <div className="relative bg-brand-surface-light dark:bg-brand-surface-dark border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl p-6 w-full max-w-xs animate-in zoom-in-95 duration-200">
                {/* Header (Digital Display) */}
                <div className="flex justify-between items-center mb-6 bg-stone-100 dark:bg-stone-800/50 p-4 rounded-2xl">
                    <div className="flex gap-1 text-4xl font-light text-stone-900 dark:text-white items-baseline">
                        <button
                            className={`hover:opacity-80 transition-opacity ${mode === 'hours' ? 'text-[#AF8F42] font-medium' : ''}`}
                            onClick={() => setMode('hours')}
                        >
                            {hour.toString().padStart(2, '0')}
                        </button>
                        <span className="opacity-50">:</span>
                        <button
                            className={`hover:opacity-80 transition-opacity ${mode === 'minutes' ? 'text-[#AF8F42] font-medium' : ''}`}
                            onClick={() => setMode('minutes')}
                        >
                            {minute.toString().padStart(2, '0')}
                        </button>
                    </div>

                    <div className="flex flex-col gap-1">
                        <button
                            className={`text-xs font-bold px-2 py-1 rounded transition-colors ${period === 'AM' ? 'bg-[#AF8F42] text-white' : 'text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-700'}`}
                            onClick={() => setPeriod('AM')}
                        >
                            AM
                        </button>
                        <button
                            className={`text-xs font-bold px-2 py-1 rounded transition-colors ${period === 'PM' ? 'bg-[#AF8F42] text-white' : 'text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-700'}`}
                            onClick={() => setPeriod('PM')}
                        >
                            PM
                        </button>
                    </div>
                </div>

                {/* Analog Clock Face */}
                <div className="relative mx-auto size-64 bg-stone-100 dark:bg-stone-800 rounded-full mb-6 cursor-pointer touch-none select-none"
                    onMouseDown={(e) => {
                        const handleMove = (ev: MouseEvent) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = ev.clientX - rect.left - rect.width / 2;
                            const y = ev.clientY - rect.top - rect.height / 2;
                            let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
                            if (angle < 0) angle += 360;
                            if (mode === 'hours') setHour(Math.round(angle / 30) || 12);
                            else setMinute(Math.round(angle / 6) % 60);
                        };
                        const handleUp = () => {
                            window.removeEventListener('mousemove', handleMove);
                            window.removeEventListener('mouseup', handleUp);
                        };
                        window.addEventListener('mousemove', handleMove);
                        window.addEventListener('mouseup', handleUp);
                        handleClockClick(e);
                    }}
                >
                    {renderClockNumbers()}

                    {/* Clock Hand */}
                    <div
                        className="absolute top-1/2 left-1/2 w-0.5 bg-[#AF8F42] origin-bottom rounded-full transition-transform duration-200 ease-out pointer-events-none"
                        style={{
                            height: mode === 'hours' ? '70px' : '90px',
                            transform: `translate(-50%, -100%) rotate(${handAngle}deg)`
                        }}
                    >
                        {/* Hand tip circle */}
                        <div className="absolute -top-1.5 -left-1.5 size-3.5 bg-[#AF8F42] rounded-full" />
                    </div>
                    {/* Center dot */}
                    <div className="absolute top-1/2 left-1/2 -mt-1 -ml-1 size-2 bg-[#AF8F42] rounded-full" />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2">
                    <button
                        className="px-4 py-2 text-sm font-bold text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
                        onClick={() => setIsOpen(false)}
                    >
                        CANCEL
                    </button>
                    <button
                        className="px-4 py-2 text-sm font-bold text-[#AF8F42] hover:bg-[#AF8F42]/10 rounded-lg transition-colors"
                        onClick={handleConfirm}
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    ) : null;

    // Format display for the trigger button
    const dispH = parseInt(value?.split(':')[0] || '12');
    const dispM = value?.split(':')[1] || '00';
    const dispPeriod = dispH >= 12 ? 'PM' : 'AM';
    const dispHour12 = dispH % 12 || 12;

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="flex items-center text-white transition-colors group whitespace-nowrap"
            >
                <span className="font-mono text-xs tracking-wider whitespace-nowrap text-stone-300">
                    {dispHour12.toString().padStart(2, '0')}:{dispM} {dispPeriod}
                </span>
            </button>
            {createPortal(modalContent, document.body)}
        </>
    );
});

export default TimePicker;

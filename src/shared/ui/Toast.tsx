import React, { useEffect, useState } from 'react';

interface ToastProps {
    message: string;
    isOpen: boolean;
    onClose: () => void;
    duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, isOpen, onClose, duration = 1200 }) => {
    const [isExiting, setIsExiting] = useState(false);
    const [internalOpen, setInternalOpen] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setInternalOpen(true);
            setIsExiting(false);
            const timer = setTimeout(() => {
                setIsExiting(true);
                setTimeout(() => {
                    setInternalOpen(false);
                    onClose();
                }, 400); // Animation duration
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [isOpen, duration, onClose]);

    if (!internalOpen) return null;

    return (
        <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 sm:left-6 sm:translate-x-0 z-[100] transition-all duration-300 ease-in-out ${isExiting
            ? 'opacity-0 translate-y-4 sm:translate-y-0 sm:-translate-x-full'
            : 'opacity-100 translate-y-0'
            } ${!isExiting ? 'animate-in fade-in slide-in-from-bottom-full sm:slide-in-from-left-full' : ''}`}
            role="alert"
        >
            <div className="bg-stone-900 dark:bg-brand-surface-dark text-white px-4 py-2 rounded-lg shadow-xl border border-white/10 flex items-center gap-3 backdrop-blur-md">
                <div className="size-6 rounded bg-primary-500/20 flex items-center justify-center text-primary-400">
                    <span className="material-symbols-outlined text-base">info</span>
                </div>
                <p className="text-xs font-bold tracking-tight">{message}</p>
            </div>
        </div>
    );
};

export default Toast;

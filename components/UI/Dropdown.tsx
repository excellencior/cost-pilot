import React, { useState, useRef, useEffect } from 'react';

interface DropdownOption {
    id: string;
    name: string;
}

interface DropdownProps {
    options: DropdownOption[];
    value: string;
    onChange: (id: string) => void;
    label?: string;
    placeholder?: string;
    className?: string;
}

const Dropdown: React.FC<DropdownProps> = ({
    options,
    value,
    onChange,
    label,
    placeholder = 'Select an option',
    className = ''
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(o => o.id === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {label && <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block px-1">{label}</label>}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white hover:border-primary-500 dark:hover:border-primary-500 transition-all focus:ring-2 focus:ring-primary-500/10 outline-none shadow-sm"
            >
                <span className={selectedOption ? '' : 'text-slate-400 font-normal'}>
                    {selectedOption ? selectedOption.name : placeholder}
                </span>
                <span className={`material-symbols-outlined text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                    expand_more
                </span>
            </button>

            {isOpen && (
                <div className="absolute z-[60] mt-2 w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-2xl py-2 animate-in fade-in zoom-in-95 duration-200 origin-top">
                    <div className="max-h-60 overflow-y-auto hide-scrollbar">
                        {options.map((option) => (
                            <button
                                key={option.id}
                                type="button"
                                onClick={() => {
                                    onChange(option.id);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center justify-between ${value === option.id ? 'text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-900/10' : 'text-slate-700 dark:text-slate-300'
                                    }`}
                            >
                                <span>{option.name}</span>
                                {value === option.id && (
                                    <span className="material-symbols-outlined text-base">check</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dropdown;

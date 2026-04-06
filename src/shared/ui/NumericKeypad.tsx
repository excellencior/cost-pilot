import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface NumericKeypadProps {
    isOpen: boolean;
    value: string;
    onChange: (value: string) => void;     // called on Apply with final evaluated number
    onExprChange?: (expr: string) => void; // called on every keystroke for live display
    onClose: () => void;
}

const safeEval = (expr: string): number | null => {
    if (!expr || !/^[\d+\-*/.() ]+$/.test(expr)) return null;
    try {
        // eslint-disable-next-line no-new-func
        const result = new Function(`return (${expr})`)();
        if (typeof result === 'number' && isFinite(result) && !isNaN(result) && result >= 0) {
            return Math.round(result * 100) / 100;
        }
        return null;
    } catch {
        return null;
    }
};

const hasOperator = (expr: string) => /[+\-*/]/.test(expr);

const ROWS = [
    ['7', '8', '9', '⌫'],
    ['4', '5', '6', '÷'],
    ['1', '2', '3', '×'],
    ['.', '0', '−', '+'],
];

const NumericKeypad: React.FC<NumericKeypadProps> = ({ isOpen, value, onChange, onExprChange, onClose }) => {
    const [expr, setExpr] = useState('');
    const [displayExpr, setDisplayExpr] = useState('');

    useEffect(() => {
        if (isOpen) {
            const init = value || '';
            setExpr(init);
            setDisplayExpr(init);
            onExprChange?.(init);
        }
    }, [isOpen, value]);

    const toDisplay = (evalExpr: string) =>
        evalExpr.replace(/\//g, '÷').replace(/\*/g, '×').replace(/-/g, '−');

    const updateExpr = (nextEval: string) => {
        setExpr(nextEval);
        const disp = toDisplay(nextEval);
        setDisplayExpr(disp);
        onExprChange?.(disp);
    };

    const preview = useMemo(() => {
        if (!hasOperator(expr)) return null;
        const r = safeEval(expr);
        return r !== null ? r.toString() : null;
    }, [expr]);

    const handleKey = (key: string) => {
        switch (key) {
            case '⌫':
                // Remove last char from eval expr (operators are single char)
                updateExpr(expr.slice(0, -1));
                break;

            case '=': {
                if (hasOperator(expr)) {
                    const result = safeEval(expr);
                    if (result !== null) updateExpr(result.toString());
                }
                break;
            }

            case 'apply': {
                if (hasOperator(expr)) {
                    const result = safeEval(expr);
                    if (result !== null) {
                        onChange(result.toString());
                        onExprChange?.(result.toString());
                    }
                } else if (expr) {
                    const n = parseFloat(expr);
                    if (!isNaN(n) && n >= 0) onChange(expr);
                }
                onClose();
                break;
            }

            case '÷':
            case '×':
            case '−':
            case '+': {
                if (!expr || /[+\-*/]$/.test(expr)) break;
                const op = key === '÷' ? '/' : key === '×' ? '*' : key === '−' ? '-' : '+';
                updateExpr(expr + op);
                break;
            }

            case '.': {
                const parts = expr.split(/[+\-*/]/);
                const current = parts[parts.length - 1];
                if (current.includes('.')) break;
                updateExpr(expr === '' ? '0.' : expr + '.');
                break;
            }

            default:
                updateExpr(expr + key);
        }
    };

    if (!isOpen) return null;

    const content = (
        <div className="fixed inset-0 z-[300] flex flex-col justify-end">
            <div className="absolute inset-0" onClick={onClose} />

            <div
                className="relative bg-stone-100 dark:bg-stone-950 border-t border-stone-200 dark:border-stone-800 rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom-4 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Drag handle */}
                <div className="flex justify-center pt-2.5 pb-3">
                    <div className="w-9 h-1 bg-stone-300 dark:bg-stone-700 rounded-full" />
                </div>

                {/* Key grid */}
                <div className="px-3 space-y-2">
                    {ROWS.map((row, ri) => (
                        <div key={ri} className="grid grid-cols-4 gap-2">
                            {row.map((key) => {
                                const isOperator = ['÷', '×', '−', '+'].includes(key);
                                const isBackspace = key === '⌫';
                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => handleKey(key)}
                                        className={`h-12 rounded-xl text-lg font-bold transition-all active:scale-[0.93] flex items-center justify-center select-none
                                            ${isBackspace
                                                ? 'bg-stone-200 dark:bg-stone-800 text-rose-500 dark:text-rose-400 active:bg-rose-100 dark:active:bg-rose-900/30'
                                                : isOperator
                                                    ? 'bg-stone-200 dark:bg-stone-800 text-[#AF8F42] active:bg-stone-300 dark:active:bg-stone-700'
                                                    : 'bg-stone-200 dark:bg-stone-800 text-stone-900 dark:text-white active:bg-stone-300 dark:active:bg-stone-700'
                                            }`}
                                    >
                                        {isBackspace
                                            ? <span className="material-symbols-outlined text-[20px]">backspace</span>
                                            : key}
                                    </button>
                                );
                            })}
                        </div>
                    ))}

                    {/* Bottom row: Apply (left) + = (right) */}
                    <div className="grid grid-cols-2 gap-2">
                        {/* Apply — evaluates and closes */}
                        <button
                            type="button"
                            onClick={() => handleKey('apply')}
                            className="h-12 rounded-xl bg-[#AF8F42] hover:bg-[#c9a84c] text-white dark:text-stone-900 text-xl font-black transition-all active:scale-[0.98] flex items-center justify-center select-none"
                        >
                            <span className="material-symbols-outlined text-[22px]">check</span>
                        </button>

                        {/* = — evaluates and shows result, stays open */}
                        <button
                            type="button"
                            onClick={() => handleKey('=')}
                            className="h-12 rounded-xl bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-[#AF8F42] text-xl font-black transition-all active:scale-[0.93] flex items-center justify-center select-none"
                        >
                            =
                        </button>
                    </div>
                </div>

                <div className="pb-8" />
            </div>
        </div>
    );

    return createPortal(content, document.body);
};

export default NumericKeypad;

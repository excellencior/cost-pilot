import React, { useState, useEffect } from 'react';

interface SplashScreenProps {
    onFinished: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinished }) => {
    const [fadeOut, setFadeOut] = useState(false);

    useEffect(() => {
        const fadeTimer = setTimeout(() => setFadeOut(true), 1800);
        const exitTimer = setTimeout(() => onFinished(), 2400);
        return () => {
            clearTimeout(fadeTimer);
            clearTimeout(exitTimer);
        };
    }, [onFinished]);

    return (
        <div
            className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950 transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
        >
            <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-700">
                <img
                    src="/costpilot_logo.png"
                    alt="CostPilot"
                    className="w-24 h-24 rounded-3xl shadow-2xl shadow-primary-500/30"
                />
                <h1 className="text-3xl font-bold text-white tracking-tight">CostPilot</h1>
            </div>

            <div className="absolute bottom-16 flex flex-col items-center gap-1 animate-in fade-in duration-1000 delay-500">
                <p className="text-slate-500 text-xs font-medium tracking-wider">© Apurbo</p>
                <p className="text-slate-600 text-[11px] italic">Dedicated to my Father</p>
            </div>
        </div>
    );
};

export default SplashScreen;

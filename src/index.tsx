import '@fontsource/chau-philomene-one/400.css';
import '@fontsource/chau-philomene-one/400-italic.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/700.css';
import React, { useState, useCallback, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './app/App';
import './index.css';
import { Capacitor } from '@capacitor/core';
import { SplashScreen as CapSplashScreen } from '@capacitor/splash-screen';
const Root: React.FC = () => {
    // Dismiss native Capacitor splash once React app mounts
    useEffect(() => {
        if (Capacitor.isNativePlatform()) {
            CapSplashScreen.hide();
        }
    }, []);

    return <App />;
};

const rootElement = document.getElementById('root');
if (!rootElement) {
    throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
    <React.StrictMode>
        <BrowserRouter>
            <Root />
        </BrowserRouter>
    </React.StrictMode>
);

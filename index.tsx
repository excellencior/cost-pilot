import '@fontsource/outfit/300.css';
import '@fontsource/outfit/400.css';
import '@fontsource/outfit/500.css';
import '@fontsource/outfit/600.css';
import '@fontsource/outfit/700.css';
import '@fontsource/outfit/800.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/700.css';
import 'material-symbols';
import React, { useState, useCallback, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import './index.css';
import { AuthProvider } from './components/AuthContext';
import AuthCallback from './components/AuthCallback';
import SplashScreen from './components/SplashScreen';
import { Capacitor } from '@capacitor/core';
import { SplashScreen as CapSplashScreen } from '@capacitor/splash-screen';

const Root: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);

  // Dismiss native Capacitor splash once React app mounts
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      CapSplashScreen.hide();
    }
  }, []);

  const handleSplashFinished = useCallback(() => {
    setShowSplash(false);
  }, []);

  return (
    <>
      {showSplash && <SplashScreen onFinished={handleSplashFinished} />}
      <App />
    </>
  );
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/auth" element={<AuthCallback />} />
          <Route path="*" element={<Root />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);


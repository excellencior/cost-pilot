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
import React, { useState, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { AuthProvider } from './components/AuthContext';
import SplashScreen from './components/SplashScreen';

const Root: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashFinished = useCallback(() => {
    setShowSplash(false);
  }, []);

  return (
    <React.StrictMode>
      <AuthProvider>
        {showSplash && <SplashScreen onFinished={handleSplashFinished} />}
        <App />
      </AuthProvider>
    </React.StrictMode>
  );
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(<Root />);

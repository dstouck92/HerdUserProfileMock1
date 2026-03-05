import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext.jsx';
import App from './App.jsx';
import PublicProfile from './PublicProfile.jsx';
import UpdatePasswordScreen from './components/UpdatePasswordScreen.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/update-password" element={<UpdatePasswordScreen />} />
          <Route path="/u/:username" element={<PublicProfile />} />
        </Routes>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);

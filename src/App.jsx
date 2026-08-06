// SAHAY\src\App.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Chatbot from './components/Chatbot';
import LoginRegister from './components/LoginRegister';
import Dashboard from './components/Dashboard';
import Home from './components/Home';
import Logo from './components/Logo';
import { Bell } from 'lucide-react';
import ProfileMenu from "./components/ProfileMenu";
import { apiFetch } from './utils/api';

export default function App() {
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState(null);
  const [currentTab, setCurrentTab] = useState('home');

  // This acts as your reactive global language variable
  const currentLanguage = i18n.language || 'en'; 

  useEffect(() => {
    const savedUser = localStorage.getItem('username');
    if (savedUser) setUser(savedUser);
  }, []);

  const handleLogout = async () => {
    const token = localStorage.getItem("token");

    try {
      if (token) {
        await apiFetch("/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (err) {
      console.error("Logout request failed:", err);
    }

    localStorage.removeItem("token");
    localStorage.removeItem("username");

    setUser(null);
    setCurrentTab("home");
  };

  // --- Sliding Toggle Handler ---
  const toggleLanguage = () => {
    const newLang = currentLanguage.startsWith('en') ? 'mr' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-left" onClick={() => setCurrentTab('home')} style={{ cursor: 'pointer' }}>
          <Logo size={36} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="header-title">SAH.ai</span>
              <span className="header-badge">AI Portal</span>
            </div>
          </div>
        </div>

        <nav className="header-nav">
          <button onClick={() => setCurrentTab('home')} className={currentTab === 'home' ? 'active' : ''}>
            {t('nav.home', 'Home')}
          </button>
          <button onClick={() => setCurrentTab('chatbot')} className={currentTab === 'chatbot' ? 'active' : ''}>
            {t('nav.chatbot', 'Chatbot')}
          </button>
          <button onClick={() => setCurrentTab('dashboard')} className={currentTab === 'dashboard' ? 'active' : ''}>
            {t('nav.dashboard', 'Document Dashboard')}
          </button>
          <button onClick={() => alert('Help section ready')}>
            {t('nav.help', 'Help')}
          </button>
        </nav>

        <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          
          {/* --- Custom Sliding Language Toggle --- */}
          <div 
            onClick={toggleLanguage}
            style={{
              display: 'flex',
              alignItems: 'center',
              position: 'relative',
              width: '90px',
              height: '32px',
              backgroundColor: 'var(--bg-secondary, #e2e8f0)',
              borderRadius: '20px',
              cursor: 'pointer',
              padding: '3px',
              userSelect: 'none'
            }}
          >
            {/* Sliding White Pill */}
            <div 
              style={{
                position: 'absolute',
                top: '3px',
                bottom: '3px',
                width: '42px',
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                left: currentLanguage.startsWith('en') ? '3px' : '45px',
                transition: 'left 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)' // Smooth glide
              }}
            />
            
            {/* EN Label */}
            <span style={{ 
              flex: 1, 
              textAlign: 'center', 
              fontSize: '0.75rem', 
              fontWeight: 700, 
              zIndex: 1, 
              transition: 'color 0.3s',
              color: currentLanguage.startsWith('en') ? '#0f172a' : '#94a3b8' 
            }}>
              EN
            </span>
            
            {/* Marathi Label */}
            <span style={{ 
              flex: 1, 
              textAlign: 'center', 
              fontSize: '0.75rem', 
              fontWeight: 700, 
              zIndex: 1, 
              transition: 'color 0.3s',
              color: currentLanguage.startsWith('en') ? '#94a3b8' : '#0f172a' 
            }}>
              मराठी
            </span>
          </div>

          <button className="icon-btn"><Bell size={16} /></button>
          
          {user ? (
            <ProfileMenu
              user={user}
              onLogout={handleLogout}
            />
          ) : (
            <button onClick={() => setCurrentTab('auth')} className="btn-action-solid" style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}>
              {t('nav.signin', 'Sign In')}
            </button>
          )}
        </div>
      </header>

      <main style={{ flex: 1 }}>
        {/* Passed currentLanguage as a prop to components below if needed */}
        {!user && currentTab === 'auth' ? (
          <LoginRegister onAuthSuccess={(username) => { setUser(username); setCurrentTab('chatbot'); }} />
        ) : !user ? (
          <Home onNavigate={(tab) => setCurrentTab(tab)} currentLanguage={currentLanguage} />
        ) : (
          currentTab === 'home' ? <Home onNavigate={(tab) => setCurrentTab(tab)} currentLanguage={currentLanguage} /> :
          currentTab === 'chatbot' ? <Chatbot user={user} onLogout={handleLogout} currentLanguage={currentLanguage} /> :
          <Dashboard currentLanguage={currentLanguage} />
        )}
      </main>
    </div>
  );
}
// SAHAY\src\App.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Chatbot from './components/Chatbot';
import LoginRegister from './components/LoginRegister';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import TranslationWorkspace from './components/TranslationWorkspace';
import ReviewWorkspace from './components/ReviewWorkspace';
import Home from './components/Home';
import Logo from './components/Logo';
import { Bell, CheckCircle } from 'lucide-react';
import ProfileMenu from "./components/ProfileMenu";
import { apiFetch } from './utils/api';

export default function App() {
  const { t, i18n } = useTranslation();
  const validTabs = ['home', 'chatbot', 'dashboard', 'translation', 'review', 'admin', 'auth'];
  const getTabFromHash = () => {
    const hash = window.location.hash.replace('#', '');
    return validTabs.includes(hash) ? hash : 'home';
  };

  const [user, setUser] = useState(() => localStorage.getItem('username'));
  const [userRole, setUserRole] = useState(() => localStorage.getItem('userRole'));
  const [accessibleServices, setAccessibleServices] = useState(['chatbot', 'dashboard', 'translation', 'review']);
  const [currentTab, setCurrentTab] = useState(getTabFromHash);
  const [toast, setToast] = useState(null);

  const currentLanguage = i18n.language || 'en'; 

  const fetchUserPermissions = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('http://localhost:8000/auth/services/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUserRole(data.role);
        setAccessibleServices(data.services || []);
      }
    } catch (err) {
      console.error('Failed to fetch user service permissions:', err);
    }
  };

  useEffect(() => {
    if (localStorage.getItem('token')) {
      fetchUserPermissions();
    }
  }, []);

  useEffect(() => {
    window.location.hash = currentTab;
  }, [currentTab]);

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentTab(getTabFromHash());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
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
    localStorage.removeItem("userRole");

    setUser(null);
    setUserRole(null);
    setCurrentTab("home");

    setToast('You have been logged out successfully.');
    setTimeout(() => setToast(null), 3000);
  };

  const navigateTab = (tab) => {
    const protectedTabs = ['chatbot', 'dashboard', 'translation', 'review', 'admin'];
    if (!user && protectedTabs.includes(tab)) {
      setCurrentTab('auth');
    } else {
      setCurrentTab(tab);
    }
  };

  const toggleLanguage = () => {
    const newLang = currentLanguage.startsWith('en') ? 'mr' : 'en';
    i18n.changeLanguage(newLang);
  };

  const normRole = (userRole || '').toLowerCase();
  const showChatbot = normRole === 'admin' || accessibleServices.includes('chatbot');
  const showDashboard = normRole === 'admin' || accessibleServices.includes('dashboard');
  const showTranslation = normRole === 'admin' || normRole === 'translator' || accessibleServices.includes('translation');
  const showReview = normRole === 'admin' || normRole === 'reviewer' || accessibleServices.includes('review');
  const showAdmin = normRole === 'admin';

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
          
          {showChatbot && (
            <button onClick={() => navigateTab('chatbot')} className={currentTab === 'chatbot' ? 'active' : ''}>
              {t('nav.chatbot', 'Chatbot')}
            </button>
          )}
          
          {showDashboard && (
            <button onClick={() => navigateTab('dashboard')} className={currentTab === 'dashboard' ? 'active' : ''}>
              {t('nav.dashboard', 'Document Dashboard')}
            </button>
          )}

          {showTranslation && (
            <button onClick={() => navigateTab('translation')} className={currentTab === 'translation' ? 'active' : ''}>
              {t('nav.translation', 'Translation Workspace')}
            </button>
          )}

          {showReview && (
            <button onClick={() => navigateTab('review')} className={currentTab === 'review' ? 'active' : ''}>
              {t('nav.review', 'Review Workspace')}
            </button>
          )}

          {showAdmin && (
            <button onClick={() => navigateTab('admin')} className={currentTab === 'admin' ? 'active' : ''}>
              {t('nav.adminConsole', 'Admin Console')}
            </button>
          )}

          <button>
            {t('nav.help', 'Help')}
          </button>
        </nav>

        <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          
          {/* Custom Sliding Language Toggle */}
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
                transition: 'left 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)'
              }}
            />
            
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
        {!user && currentTab === 'auth' ? (
          <LoginRegister onAuthSuccess={(username, role) => { 
            setUser(username); 
            setUserRole(role);
            fetchUserPermissions();
            if (role && role.toLowerCase() === 'admin') {
              setCurrentTab('admin');
            } else {
              setCurrentTab('chatbot');
            }
          }} />
        ) : !user ? (
          <Home onNavigate={(tab) => navigateTab(tab)} currentLanguage={currentLanguage} />
        ) : (
          currentTab === 'home' ? <Home onNavigate={(tab) => navigateTab(tab)} currentLanguage={currentLanguage} /> :
          currentTab === 'admin' && showAdmin ? <AdminDashboard /> :
          currentTab === 'chatbot' && showChatbot ? <Chatbot user={user} currentLanguage={currentLanguage} /> :
          currentTab === 'dashboard' && showDashboard ? <Dashboard currentLanguage={currentLanguage} /> :
          currentTab === 'translation' && showTranslation ? <TranslationWorkspace /> :
          currentTab === 'review' && showReview ? <ReviewWorkspace /> :
          <Home onNavigate={(tab) => navigateTab(tab)} currentLanguage={currentLanguage} />
        )}
      </main>

      {toast && (
        <div className="toast-notification">
          <CheckCircle size={16} />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
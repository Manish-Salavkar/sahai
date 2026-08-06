// SAHAY\src\components\Home.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Bot, Database, BarChart3, ShieldCheck, Sparkles } from 'lucide-react';
import Logo from './Logo';
import '../home.css';

export default function Home({ onNavigate }) {
  const { t } = useTranslation();

  return (
    <div className="home-container">
      <div className="home-wrapper">
        
        {/* Hero Section */}
        <div className="hero-card">
          <div className="hero-content">
            <div className="hero-tag">
              <Sparkles size={14} /> {t('home.hero_tag')}
            </div>
            <h1 className="hero-title">
              {t('home.hero_title')}
            </h1>
            <p className="hero-description">
              {t('home.hero_desc')}
            </p>
            <div className="hero-actions">
              <button onClick={() => onNavigate('chatbot')} className="btn-hero-primary">
                {t('home.open_chat')} <ArrowRight size={16} />
              </button>
              <button onClick={() => onNavigate('dashboard')} className="btn-hero-secondary">
                {t('home.browse_docs')}
              </button>
            </div>
          </div>

          <div className="hero-stats-panel">
            <div className="stat-item">
              <div className="stat-value">100k+</div>
              <div className="stat-label">{t('home.docs_indexed')}</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">24/7</div>
              <div className="stat-label">{t('home.assistance_avail')}</div>
            </div>
            <div className="stat-item" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1rem' }}>
              <Logo size={48} />
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-main)' }}>{t('home.engine_name')}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('home.policy_retrieval')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Core Capabilities */}
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--text-main)' }}>
            {t('home.core_cap')}
          </h2>
          <div className="features-grid">
            <div className="feature-card" onClick={() => onNavigate('chatbot')} style={{ cursor: 'pointer' }}>
              <div className="feature-icon-box">
                <Bot size={24} />
              </div>
              <h3 className="feature-title">{t('home.ai_chatbot')}</h3>
              <p className="feature-desc">
                {t('home.ai_chatbot_desc')}
              </p>
            </div>

            <div className="feature-card" onClick={() => onNavigate('dashboard')} style={{ cursor: 'pointer' }}>
              <div className="feature-icon-box">
                <Database size={24} />
              </div>
              <h3 className="feature-title">{t('home.doc_repo')}</h3>
              <p className="feature-desc">
                {t('home.doc_repo_desc')}
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box">
                <BarChart3 size={24} />
              </div>
              <h3 className="feature-title">{t('home.live_updates')}</h3>
              <p className="feature-desc">
                {t('home.live_updates_desc')}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
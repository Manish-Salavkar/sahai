// SAHAY\src\components\Chatbot.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Send, FileText, Settings, LogOut, User, Sparkles, Bot, Layers, Eye, Star, ThumbsUp, ThumbsDown, Check, ChevronDown, ChevronUp, MessageSquarePlus } from 'lucide-react';
import DocumentModal from './DocumentModal';
import TransliterationInput from './TransliterationInput';
import { apiFetch } from '../utils/api';

const calculateConfidence = (rawScore) => {
  if (rawScore === undefined || rawScore === null) return null;
  return Math.round((1 / (1 + Math.exp(-rawScore))) * 100);
};

function formatMessageContent(content) {
  if (!content) return null;

  const lines = content.split('\n');
  let elements = [];
  let currentList = [];

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} style={{ margin: '0.5rem 0 0.5rem 1.25rem', paddingLeft: '0.5rem', listStyleType: 'disc' }}>
          {[...currentList]}
        </ul>
      );
      currentList = [];
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(
        <h4 key={idx} style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-main)', marginTop: '1rem', marginBottom: '0.35rem' }}>
          {trimmed.replace('### ', '')}
        </h4>
      );
      return;
    }
    if (trimmed.startsWith('#### ')) {
      flushList();
      elements.push(
        <h5 key={idx} style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--text-secondary)', marginTop: '0.75rem', marginBottom: '0.25rem' }}>
          {trimmed.replace('#### ', '')}
        </h5>
      );
      return;
    }

    if (trimmed === '---') {
      flushList();
      elements.push(<hr key={idx} style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '1rem 0' }} />);
      return;
    }

    if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      const itemText = trimmed.substring(2);
      const parts = itemText.split(/\*\*(.*?)\*\*/g);
      
      currentList.push(
        <li key={`li-${idx}`} style={{ marginBottom: '0.35rem', lineHeight: '1.4' }}>
          {parts.map((part, i) => (i % 2 === 1 ? <strong key={i} style={{ fontWeight: '700', color: 'var(--text-main)' }}>{part}</strong> : part))}
        </li>
      );
      return;
    }

    flushList();
    if (trimmed !== '') {
      const parts = trimmed.split(/\*\*(.*?)\*\*/g);
      elements.push(
        <p key={idx} style={{ marginBottom: '0.5rem', lineHeight: '1.5' }}>
          {parts.map((part, i) => (i % 2 === 1 ? <strong key={i} style={{ fontWeight: '700', color: 'var(--text-main)' }}>{part}</strong> : part))}
        </p>
      );
    }
  });

  flushList();
  return elements;
}

// ---------------- Collapsible Feedback Dropdown Component ----------------
function MessageFeedbackDropdown({ messageId, sessionId }) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [answered, setAnswered] = useState(null); // 'yes' | 'no'
  const [accuracy, setAccuracy] = useState(0);    // 1 - 5
  const [citationsRelevant, setCitationsRelevant] = useState(null); // 'yes' | 'partially' | 'no'
  const [comments, setComments] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const token = localStorage.getItem('token');

    const feedbackPayload = {
      message_id: messageId || null,
      session_id: sessionId || null,
      answered,
      accuracy,
      citations_relevant: citationsRelevant,
      comments
    };

    try {
      const response = await apiFetch('/chatbot/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(feedbackPayload)
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        console.error("Failed to submit feedback");
      }
    } catch (err) {
      console.error("Error submitting feedback:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
      {/* Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          background: 'none',
          border: 'none',
          color: 'var(--text-secondary)',
          fontSize: '0.75rem',
          cursor: 'pointer',
          padding: '0',
          fontWeight: '600'
        }}
      >
        <MessageSquarePlus size={13} />
        {submitted ? t('chatbot.feedback.submitted_label') : t('chatbot.feedback.toggle_label')}
        {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>

      {/* Collapsible Content */}
      {isOpen && (
        <div style={{ marginTop: '0.5rem' }}>
          {submitted ? (
            <div style={{ padding: '0.4rem 0', fontSize: '0.75rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
              <Check size={14} /> {t('chatbot.feedback.thank_you')}
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem', background: 'var(--bg-card, rgba(0,0,0,0.02))', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              
              {/* 1. Was your question answered? */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: '500', fontSize: '0.75rem' }}>{t('chatbot.feedback.question_answered')}</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setAnswered('yes')}
                    style={{
                      padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border-color)',
                      background: answered === 'yes' ? '#2563eb' : 'transparent',
                      color: answered === 'yes' ? '#fff' : 'var(--text-main)', cursor: 'pointer', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '3px'
                    }}
                  >
                    <ThumbsUp size={10} /> {t('chatbot.feedback.yes')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnswered('no')}
                    style={{
                      padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border-color)',
                      background: answered === 'no' ? '#ef4444' : 'transparent',
                      color: answered === 'no' ? '#fff' : 'var(--text-main)', cursor: 'pointer', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '3px'
                    }}
                  >
                    <ThumbsDown size={10} /> {t('chatbot.feedback.no')}
                  </button>
                </div>
              </div>

              {/* 2. Response Accuracy Stars */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: '500', fontSize: '0.75rem' }}>{t('chatbot.feedback.accuracy')}</span>
                <div style={{ display: 'flex', gap: '2px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={14}
                      style={{ cursor: 'pointer', fill: star <= accuracy ? '#f59e0b' : 'none', color: star <= accuracy ? '#f59e0b' : 'var(--text-muted)' }}
                      onClick={() => setAccuracy(star)}
                    />
                  ))}
                </div>
              </div>

              {/* 3. Citations Relevant */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: '500', fontSize: '0.75rem' }}>{t('chatbot.feedback.citations_relevant')}</span>
                <div style={{ display: 'flex', gap: '3px' }}>
                  {[
                    { key: 'yes', label: t('chatbot.feedback.yes') },
                    { key: 'partially', label: t('chatbot.feedback.partially') },
                    { key: 'no', label: t('chatbot.feedback.no') }
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setCitationsRelevant(item.key)}
                      style={{
                        padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)',
                        background: citationsRelevant === item.key ? '#2563eb' : 'transparent',
                        color: citationsRelevant === item.key ? '#fff' : 'var(--text-main)', cursor: 'pointer', fontSize: '0.68rem'
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Comments Textarea */}
              <textarea
                rows="2"
                placeholder={t('chatbot.feedback.comments_placeholder')}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                style={{
                  width: '100%', padding: '5px', borderRadius: '4px', border: '1px solid var(--border-color)',
                  background: 'var(--bg-input, #fff)', color: 'var(--text-main)', fontSize: '0.72rem', resize: 'vertical'
                }}
              />

              <button
                type="submit"
                disabled={submitting}
                style={{
                  alignSelf: 'flex-end', padding: '3px 10px', fontSize: '0.7rem', fontWeight: '600',
                  background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer',
                  opacity: submitting ? 0.7 : 1
                }}
              >
                {submitting ? t('common.submitting', 'Submitting...') : t('chatbot.feedback.submit')}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export default function Chatbot({ user, onLogout, currentLanguage }) {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: t('chatbot.welcome_msg'),
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [citations, setCitations] = useState([]);
  const [activeTab, setActiveTab] = useState('citations');
  const [selectedCitationForModal, setSelectedCitationForModal] = useState(null);

  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await apiFetch('/chatbot/sessions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      }
    } catch (err) {
      console.error("Failed to fetch sessions", err);
    }
  };

  const loadSession = async (id) => {
    const token = localStorage.getItem('token');
    setLoading(true);
    try {
      const response = await apiFetch(`/chatbot/sessions/${id}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
        setSessionId(id);
        
        const lastMsg = data[data.length - 1];
        if (lastMsg && lastMsg.role === 'assistant' && lastMsg.citations) {
          setCitations(lastMsg.citations);
        } else {
          setCitations([]);
        }
      }
    } catch (err) {
      console.error("Failed to load session messages", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputQuery.trim() || loading) return;

    const userText = inputQuery.trim();
    setInputQuery('');
    setMessages((prev) => [...prev, { role: 'user', content: userText }]);
    setLoading(true);

    const token = localStorage.getItem('token');

    try {
      const response = await apiFetch('/chatbot/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: userText,
          session_id: sessionId,
          language: currentLanguage && currentLanguage.startsWith("mr") ? "mr" : "en",
          top_chunks_k: 50,
          final_rerank_k: 3,
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();

      if (data.session_id) {
          setSessionId(data.session_id);
      }

      setMessages((prev) => [
          ...prev,
          {
              role: "assistant",
              content: data.answer,
              citations: data.citations || [],
          }
      ]);

      setCitations(data.citations || []);

      if (!sessionId) {
          fetchSessions();
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: t('chatbot.error_msg') },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = () => {
    setMessages([{ role: 'assistant', content: t('chatbot.new_chat_started') }]);
    setCitations([]);
    setSessionId(null);
  };

  const calculateNormalizedConfidence = (score) => {
    if (score == null) return null;
    const min = 2.0;
    const max = 6.0;
    const normalized = Math.max(0, Math.min(1, (score - min) / (max - min)));
    return Math.round(normalized * 100);
  };

  const uniqueSources = Object.values(
    citations.reduce((acc, curr) => {
      if (!acc[curr.pdf_name]) {
        acc[curr.pdf_name] = {
          ...curr,
          pages: [],
          bestScore: curr.relevance_score,
        };
      }

      acc[curr.pdf_name].pages.push(curr.page_number || curr.page);

      if (curr.relevance_score > acc[curr.pdf_name].bestScore) {
        acc[curr.pdf_name].bestScore = curr.relevance_score;
      }

      return acc;
    }, {})
  );

  const displayList = activeTab === 'sources' ? uniqueSources : citations;

  return (
    <div className="chat-container">
      {/* ---------------- Left Sidebar: Sessions ---------------- */}
      <div className="panel sidebar-panel">
        <div className="sidebar-header">
          <span className="section-label">{t('chatbot.conversations')}</span>
          <h2 className="sidebar-title">{t('chatbot.my_chats')}</h2>
        </div>

        <button onClick={startNewChat} className="btn-new-chat">
          <Plus size={16} /> {t('chatbot.new_chat')}
        </button>

        <div className="search-wrapper">
          <Search />
          <input type="text" placeholder={t('chatbot.search_chats')} className="search-input" />
        </div>

        <div className="history-list">
          <div className="history-group">
            <span className="section-label">{t('chatbot.recent')}</span>
            {sessions.length === 0 ? (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', padding: '0.5rem' }}>
                {t('chatbot.no_past_chats')}
              </div>
            ) : (
              sessions.map((session) => (
                <div 
                  key={session.id} 
                  className={`history-item ${sessionId === session.id ? 'active' : ''}`}
                  onClick={() => loadSession(session.id)}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {session.title || t('chatbot.new_chat')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="sidebar-footer">
          <button className="footer-btn"><User size={14} /> {t('common.profile')}</button>
          <button className="footer-btn"><Settings size={14} /> {t('common.settings')}</button>
          <button onClick={onLogout} className="footer-btn logout"><LogOut size={14} /> {t('common.logout')}</button>
        </div>
      </div>

      {/* ---------------- Main Chat Panel ---------------- */}
      <div className="panel chat-main-panel">
        <div className="chat-header">
          <div>
            <div className="chat-ai-label"><Sparkles size={12} /> {t('chatbot.ai_assistant')}</div>
            <h1 className="chat-header-title">{t('chatbot.gov_res_chat')}</h1>
          </div>
          <span className="status-pill">
            <div className="status-dot"></div> {t('chatbot.active')}
          </span>
        </div>

        <div className="message-feed">
          {messages.map((msg, index) => (
            <div key={index} className={`msg-wrapper ${msg.role}`}>
              <span className="msg-role">{msg.role === 'user' ? t('chatbot.role_user') : t('chatbot.role_assistant')}</span>
              <div className="msg-bubble">
                {msg.role === 'assistant' ? formatMessageContent(msg.content) : msg.content}
                
                {msg.role === 'assistant' && msg.citations && msg.citations.length > 0 && (
                  <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                    <button 
                      onClick={() => setCitations(msg.citations)}
                      style={{ 
                        display: 'flex', alignItems: 'center', gap: '4px', background: 'none', 
                        border: 'none', color: '#38BDF8', fontSize: '0.75rem', 
                        cursor: 'pointer', padding: '0', fontWeight: '600'
                      }}
                    >
                      <Layers size={12} /> {t('chatbot.view_sources', { count: msg.citations.length })}
                    </button>
                  </div>
                )}

                {/* --- Collapsible Feedback Dropdown --- */}
                {msg.role === 'assistant' && (
                  <MessageFeedbackDropdown messageId={msg.id} sessionId={sessionId} />
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="msg-wrapper assistant">
              <span className="msg-role">{t('chatbot.role_assistant')}</span>
              <div className="msg-bubble msg-loading">
                <Bot size={16} /> {t('chatbot.analyzing')}
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="chat-input-form">
          <div className="input-group">
            <TransliterationInput
              value={inputQuery}
              onChangeText={setInputQuery}
              placeholder={t('chatbot.type_message')}
              className="chat-input"
            />
            <button type="submit" disabled={loading || !inputQuery.trim()} className="btn-send">
              {t('chatbot.send')} <Send size={14} />
            </button>
          </div>
        </form>
      </div>

      {/* ---------------- Right Reference Panel ---------------- */}
      <div className="panel ref-panel">
        <div className="ref-header">
          <span className="ref-title">{t('chatbot.ref_panel')}</span>
          <div className="tabs">
            <button onClick={() => setActiveTab('sources')} className={`tab-btn ${activeTab === 'sources' ? 'active' : ''}`}>{t('chatbot.sources')}</button>
            <button onClick={() => setActiveTab('citations')} className={`tab-btn ${activeTab === 'citations' ? 'active' : ''}`}>{t('chatbot.citations')}</button>
          </div>
        </div>

        <div className="citations-list">
          {displayList.length === 0 ? (
            <div className="empty-citations">
              <Layers size={32} />
              <p>{t('chatbot.empty_citations')}</p>
            </div>
          ) : (
            displayList.map((item, idx) => {
              const confidence = calculateNormalizedConfidence(
                activeTab === "sources" ? item.bestScore : item.relevance_score
              );

              if (activeTab === "citations") {
                return (
                  <div key={idx} style={{ padding: "1rem", borderBottom: "1px solid var(--border-color)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: ".5rem", fontSize: ".75rem", color: "var(--text-muted)" }}>
                      <span>{t('chatbot.page', { number: item.page_number })}</span>
                      {confidence != null && (
                        <span>{t('chatbot.match', { confidence })}</span>
                      )}
                    </div>
                    <div style={{ fontSize: ".82rem", lineHeight: 1.6, color: "var(--text-main)", whiteSpace: "pre-wrap" }}>
                      {item.text}
                    </div>
                  </div>
                );
              }

              return (
                <div key={idx} className="citation-card">
                  <div className="citation-top">
                    <div className="citation-icon">
                      <FileText size={16}/>
                    </div>
                    <div>
                      <h4 className="citation-name">{item.pdf_name}</h4>
                      <span className="citation-sub">{t('chatbot.gov_res')}</span>
                    </div>
                  </div>
                  <div className="citation-meta">
                    <span>{t('chatbot.pages_label', { pages: item.pages.join(", ") })}</span>
                  </div>
                  <button className="btn-preview" onClick={() => setSelectedCitationForModal(item)}>
                    <Eye size={12}/> {t('common.preview')}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ---------------- PDF Preview Modal ---------------- */}
      {selectedCitationForModal && (
        <DocumentModal 
          citation={selectedCitationForModal} 
          onClose={() => setSelectedCitationForModal(null)} 
        />
      )}
    </div>
  );
}
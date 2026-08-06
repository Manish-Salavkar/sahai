import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../utils/api';
import {
  CheckSquare,
  FileText,
  ArrowLeft,
  Search,
  CheckCircle2,
  Clock,
  ExternalLink,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  MessageSquare,
  Eye,
  ShieldCheck,
  Languages
} from 'lucide-react';

const convertMarkdownToHtml = (text) => {
  if (!text) return '';
  if (/<[a-z][\s\S]*>/i.test(text)) return text;

  return text
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
    .replace(/\*(.*?)\*/g, '<i>$1</i>')
    .replace(/\n/g, '<br/>');
};

export default function ReviewWorkspace() {
  const { t } = useTranslation();
  const [documents, setDocuments] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [underReviewCount, setUnderReviewCount] = useState(0);
  const [reworkCount, setReworkCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected Document for Review
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [translatedTitle, setTranslatedTitle] = useState('');
  const [translatedContent, setTranslatedContent] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
      });
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }
      if (statusFilter && statusFilter !== 'ALL') {
        params.append('status', statusFilter);
      }

      const res = await apiFetch(`/translation/documents?${params.toString()}`);
      if (!res || !res.ok) throw new Error('Failed to load documents for review workspace');
      const data = await res.json();
      setDocuments(data.items || []);
      setTotalCount(data.total || 0);
      setTotalPages(data.total_pages || 1);
      setPendingCount(data.pending_count || 0);
      setUnderReviewCount(data.under_review_count || 0);
      setReworkCount(data.rework_count || 0);
      setApprovedCount(data.approved_count || 0);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [page, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchDocuments();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleOpenReview = async (doc) => {
    try {
      const res = await apiFetch(`/translation/documents/${encodeURIComponent(doc.pdf_name)}`);
      if (res && res.ok) {
        const detail = await res.json();
        setSelectedDoc(detail);
        setTranslatedTitle(detail.translated_title || '');
        const html = convertMarkdownToHtml(detail.translated_content || '');
        setTranslatedContent(html);
        setReviewNote(detail.review_note || '');
      } else {
        setSelectedDoc(doc);
        setTranslatedTitle(doc.translated_title || '');
        const html = convertMarkdownToHtml(doc.translated_content || '');
        setTranslatedContent(html);
        setReviewNote(doc.review_note || '');
      }
    } catch (err) {
      console.error(err);
      setSelectedDoc(doc);
      setTranslatedTitle(doc.translated_title || '');
      const html = convertMarkdownToHtml(doc.translated_content || '');
      setTranslatedContent(html);
      setReviewNote(doc.review_note || '');
    }
  };

  const handleSaveReview = async (action) => {
    if (!selectedDoc) return;
    setSubmitting(true);
    setToastMessage('');

    try {
      const res = await apiFetch(`/translation/documents/${encodeURIComponent(selectedDoc.pdf_name)}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: action,
          review_note: reviewNote
        })
      });

      if (!res || !res.ok) {
        const errData = res ? await res.json() : {};
        throw new Error(errData.detail || 'Failed to submit review. Server error.');
      }

      const updated = await res.json();
      setSelectedDoc(prev => ({
        ...prev,
        translation_status: updated.translation_status,
        review_note: updated.review_note,
        reviewer_name: updated.reviewer_name
      }));

      setDocuments(prevDocs =>
        prevDocs.map(d =>
          d.pdf_name === selectedDoc.pdf_name
            ? { ...d, translation_status: updated.translation_status, review_note: updated.review_note }
            : d
        )
      );

      const msg = action === 'APPROVE'
        ? 'Translation Approved successfully!'
        : 'Status updated to Needs Rework. Feedback sent to translator.';
      setToastMessage(t('reviewWorkspace.reviewSuccess', msg));
      setTimeout(() => setToastMessage(''), 4000);
      fetchDocuments();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Review submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStatusBadge = (statusVal) => {
    if (statusVal === 'Approved') {
      return (
        <span className="status-badge status-approved">
          <CheckCircle2 size={13} /> {t('reviewWorkspace.statusApproved', 'Approved')}
        </span>
      );
    }
    if (statusVal === 'Under Review') {
      return (
        <span className="status-badge status-review">
          <Clock size={13} /> {t('reviewWorkspace.statusUnderReview', 'Under Review')}
        </span>
      );
    }
    if (statusVal === 'Needs Rework' || statusVal === 'Rework') {
      return (
        <span className="status-badge status-rework">
          <RotateCcw size={13} /> {t('reviewWorkspace.statusNeedsRework', 'Needs Rework')}
        </span>
      );
    }
    return (
      <span className="status-badge status-pending">
        <AlertCircle size={13} /> {t('reviewWorkspace.statusPending', 'Translation Pending')}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="translation-container loading-state">
        <div className="spinner"></div>
        <p>Loading documents for review workspace...</p>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: SPLIT-SCREEN REVIEW WORKSPACE (PDF ON LEFT, REVIEW PANEL ON RIGHT)
  // =========================================================================
  if (selectedDoc) {
    return (
      <div className="translation-workspace-screen">
        {/* Reviewer Header */}
        <header className="workspace-header">
          <div className="workspace-header-left">
            <button className="back-btn" onClick={() => setSelectedDoc(null)}>
              <ArrowLeft size={18} />
              <span>{t('reviewWorkspace.backToList', 'Back to Review List')}</span>
            </button>
            <div className="workspace-doc-meta">
              <h2 className="workspace-doc-title">{selectedDoc.title || selectedDoc.pdf_name}</h2>
              <span className="pdf-name-pill">{selectedDoc.pdf_name}</span>
              {renderStatusBadge(selectedDoc.translation_status)}
            </div>
          </div>

          <div className="workspace-header-right">
            {toastMessage && <div className="toast-banner">{toastMessage}</div>}
          </div>
        </header>

        {/* Split Screen Container */}
        <div className="split-workspace-container">
          {/* LEFT PANEL: ORIGINAL PDF VIEWER */}
          <div className="split-panel pdf-panel">
            <div className="panel-subhead">
              <div className="subhead-title">
                <FileText size={16} />
                <span>{t('reviewWorkspace.originalDoc', 'Original PDF Document')}</span>
              </div>
              <a
                href={`http://localhost:8000/chatbot/documents/${encodeURIComponent(selectedDoc.pdf_name)}`}
                target="_blank"
                rel="noreferrer"
                className="open-external-link"
              >
                <ExternalLink size={14} /> Full Screen
              </a>
            </div>

            <div className="pdf-frame-wrapper">
              <iframe
                src={`http://localhost:8000/chatbot/documents/${encodeURIComponent(selectedDoc.pdf_name)}#toolbar=1`}
                title="Original PDF Document"
                className="pdf-iframe"
              />
            </div>
          </div>

          {/* RIGHT PANEL: TRANSLATION REVIEW EVALUATION */}
          <div className="split-panel editor-panel">
            <div className="panel-subhead">
              <div className="subhead-title">
                <ShieldCheck size={16} />
                <span>{t('reviewWorkspace.reviewPanelTitle', 'Translation Verification & Evaluation')}</span>
              </div>
            </div>

            <div className="editor-inputs-body">
              <div className="form-field">
                <label className="field-label">Translated Title (भाषांतरित शीर्षक):</label>
                <input
                  type="text"
                  className="translation-title-input"
                  value={translatedTitle}
                  readOnly
                  placeholder="No translated title provided yet..."
                />
              </div>

              <div className="form-field flex-grow-field">
                <label className="field-label">Translated Content Preview (भाषांतरित शासन निर्णय):</label>
                <div
                  className="translation-rich-editor"
                  style={{ background: '#f8fafc', cursor: 'default' }}
                  dangerouslySetInnerHTML={{ __html: translatedContent || '<p style="color:#94a3b8; font-style:italic;">No translation draft content provided yet.</p>' }}
                />
              </div>

              {/* REVIEWER FEEDBACK NOTE & ACTION CARD */}
              <div className="reviewer-feedback-box">
                <label className="field-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <MessageSquare size={15} />
                  Reviewer Notes & Feedback Suggestions for Translator:
                </label>
                <textarea
                  className="reviewer-note-textarea"
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="Type feedback, suggestions, or corrections for the translator..."
                />
                <div className="reviewer-actions-row">
                  <button
                    type="button"
                    className="btn-rework"
                    onClick={() => handleSaveReview('REWORK')}
                    disabled={submitting}
                  >
                    <RotateCcw size={15} />
                    <span>{submitting ? 'Updating...' : 'Need Rework'}</span>
                  </button>
                  <button
                    type="button"
                    className="btn-approve"
                    onClick={() => handleSaveReview('APPROVE')}
                    disabled={submitting}
                  >
                    <CheckCircle2 size={15} />
                    <span>{submitting ? 'Approving...' : 'Approve Translation'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 1: REVIEW DASHBOARD LIST
  // =========================================================================
  return (
    <div className="translation-workspace-page">
      {/* Header Banner */}
      <header className="translation-page-header">
        <div className="header-left">
          <div className="header-icon-box" style={{ background: '#e0f2fe', color: '#0284c7' }}>
            <CheckSquare size={24} />
          </div>
          <div>
            <h1 className="header-title">{t('reviewWorkspace.title', 'Review Workspace')}</h1>
            <p className="header-subtitle">{t('reviewWorkspace.subtitle', 'Review submitted translations, provide revision notes, and approve or send back for rework')}</p>
          </div>
        </div>
      </header>

      {/* Search & Filter Controls Card */}
      <div className="translation-controls-card">
        <div className="search-input-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input-field"
            placeholder="Search documents by title, PDF name, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="status-filter-pills">
          <button
            className={`filter-pill ${statusFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => { setStatusFilter('ALL'); setPage(1); }}
          >
            All Documents ({pendingCount + underReviewCount + reworkCount + approvedCount})
          </button>
          <button
            className={`filter-pill ${statusFilter === 'Under Review' ? 'active' : ''}`}
            onClick={() => { setStatusFilter('Under Review'); setPage(1); }}
          >
            Under Review ({underReviewCount})
          </button>
          <button
            className={`filter-pill ${statusFilter === 'Needs Rework' ? 'active' : ''}`}
            onClick={() => { setStatusFilter('Needs Rework'); setPage(1); }}
          >
            Needs Rework ({reworkCount})
          </button>
          <button
            className={`filter-pill ${statusFilter === 'Approved' ? 'active' : ''}`}
            onClick={() => { setStatusFilter('Approved'); setPage(1); }}
          >
            Approved ({approvedCount})
          </button>
          <button
            className={`filter-pill ${statusFilter === 'Translation Pending' ? 'active' : ''}`}
            onClick={() => { setStatusFilter('Translation Pending'); setPage(1); }}
          >
            Pending ({pendingCount})
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Documents Table */}
      <div className="documents-table-card">
        <table className="translation-table">
          <thead>
            <tr>
              <th>{t('reviewWorkspace.colDoc', 'Document Title / PDF')}</th>
              <th>{t('reviewWorkspace.colDept', 'Department')}</th>
              <th>{t('reviewWorkspace.colStatus', 'Translation Status')}</th>
              <th className="text-right">{t('reviewWorkspace.colAction', 'Action')}</th>
            </tr>
          </thead>
          <tbody>
            {documents.length === 0 ? (
              <tr>
                <td colSpan={4} className="empty-table-cell">
                  No documents found matching review search criteria.
                </td>
              </tr>
            ) : (
              documents.map((doc) => (
                <tr key={doc.pdf_name}>
                  <td>
                    <div className="doc-title-cell">
                      <FileText size={18} className="doc-icon" />
                      <div>
                        <div className="doc-main-title">{doc.title || doc.pdf_name}</div>
                        <div className="doc-sub-info">
                          <span>{doc.pdf_name}</span>
                          {doc.date && <span className="dot-sep">• {doc.date}</span>}
                          {doc.number_of_pages && <span className="dot-sep">• {doc.number_of_pages} Pages</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="dept-pill">{doc.department || 'General Administration'}</span>
                  </td>
                  <td>{renderStatusBadge(doc.translation_status)}</td>
                  <td className="text-right">
                    <button
                      className="action-translate-btn action-review-btn"
                      onClick={() => handleOpenReview(doc)}
                    >
                      <Eye size={14} />
                      <span>Review Translation</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="dash-pagination" style={{ marginTop: '1rem' }}>
        <div className="page-info">
          {t('dashboard.showing', 'Showing')} <span>{totalCount > 0 ? (page - 1) * pageSize + 1 : 0}</span> {t('dashboard.to', 'to')} <span>{Math.min(page * pageSize, totalCount)}</span> {t('dashboard.of', 'of')} <span>{totalCount}</span> {t('dashboard.results', 'results')}
        </div>

        <div className="page-controls">
          <button
            className="btn-page"
            onClick={() => setPage(prev => Math.max(prev - 1, 1))}
            disabled={page <= 1 || loading}
          >
            <ChevronLeft size={16} /> {t('dashboard.previous', 'Previous')}
          </button>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)', padding: '0 0.5rem' }}>
            {t('dashboard.page_of', { current: page, total: totalPages || 1 })}
          </span>
          <button
            className="btn-page"
            onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
            disabled={page >= totalPages || loading}
          >
            {t('dashboard.next', 'Next')} <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

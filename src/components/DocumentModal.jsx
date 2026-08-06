import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, ZoomIn, ZoomOut, Download, ExternalLink, FileText, Loader2 } from 'lucide-react';

export default function DocumentModal({ citation, onClose }) {
  const { t } = useTranslation();
  const [zoom, setZoom] = useState(100);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const pdfName = citation?.pdf_name || 'document.pdf';
  const pdfUrl = `http://localhost:8000/chatbot/documents/${pdfName}`;
  const pageNum = citation?.page_number || citation?.page || 1;

  const calculateConfidence = (score) => {
      if (score == null) return null;

      const min = 2.0;
      const max = 6.0;

      const normalized = Math.max(
          0,
          Math.min(1, (score - min) / (max - min))
      );

      return Math.round(normalized * 100);
  };

  useEffect(() => {
    let isMounted = true;
    let objectUrl = null;

    const loadPdfBlob = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(pdfUrl, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!res.ok) {
          throw new Error(t('modal.fetchError', 'Failed to fetch PDF document'));
        }

        const blob = await res.blob();
        // Force MIME type to application/pdf
        const pdfBlob = new Blob([blob], { type: 'application/pdf' });
        objectUrl = URL.createObjectURL(pdfBlob);

        if (isMounted) {
          setPdfBlobUrl(objectUrl);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    loadPdfBlob();

    // Clean up local memory URL when modal unmounts
    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [pdfUrl, t]);

  if (!citation) return null;

  const confidence = calculateConfidence(citation.relevance_score);

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-wrapper">
            <span className="modal-title-label">{t('modal.preview', 'Document Preview')}</span>
            <h3 className="modal-title">
              <FileText size={16} color="#2563eb" />
              {pdfName}
              {pageNum && (
                <span className="modal-page-badge">{t('modal.page', 'Page')} {pageNum}</span>
              )}
            </h3>
          </div>

          <div className="modal-actions">
            <div className="zoom-controls">
              <button onClick={() => setZoom((prev) => Math.max(50, prev - 10))} className="zoom-btn" title={t('modal.zoomOut', 'Zoom Out')}>
                <ZoomOut size={14} />
              </button>
              <span className="zoom-level">{zoom}%</span>
              <button onClick={() => setZoom((prev) => Math.min(200, prev + 10))} className="zoom-btn" title={t('modal.zoomIn', 'Zoom In')}>
                <ZoomIn size={14} />
              </button>
            </div>

            <a href={pdfUrl} download={pdfName} className="btn-modal-action light">
              <Download size={14} /> {t('modal.download', 'Download')}
            </a>
            <a href={pdfUrl} target="_blank" rel="noreferrer" className="btn-modal-action dark">
              <ExternalLink size={14} /> {t('modal.openFull', 'Open Full')}
            </a>
            <button onClick={onClose} className="btn-close">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="modal-body">
          <div className="modal-left">
            <h4 className="modal-left-title">{t('modal.citedText', 'Cited Text Segment')}</h4>
            <div className="modal-snippet">"{citation.text}"</div>
            <div className="modal-conf">
              {t('modal.confidence', 'Confidence Match:')} <strong>{confidence}%</strong>
            </div>
          </div>

          <div className="modal-right">
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                {t('modal.loadingPdf', 'Loading PDF Preview...')}
              </div>
            ) : error ? (
              <div style={{ color: '#e11d48', fontSize: '0.875rem' }}>
                {t('modal.errorPdf', 'Failed to load PDF preview:')} {error}
              </div>
            ) : (
              <div className="pdf-frame-wrapper" style={{ transform: `scale(${zoom / 100})` }}>
                <iframe
                  src={`${pdfBlobUrl}#page=${pageNum}`}
                  title="PDF Viewer"
                  width="100%"
                  height="100%"
                />
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
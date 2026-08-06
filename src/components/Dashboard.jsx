import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Filter, Search, LayoutGrid, List, 
  ChevronLeft, ChevronRight, Plus, Loader2, X, Network, FileText, Eye 
} from 'lucide-react';
import DocumentModal from './DocumentModal';
import '../dashboard.css';
import { apiFetch } from '../utils/api';

export default function Dashboard() {
  const { t } = useTranslation();
  const [documents, setDocuments] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [sortOrder, setSortOrder] = useState('newest');
  
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  
  const [availableFilters, setAvailableFilters] = useState({ filter_fields: [], options: {} });
  const [selectedFilters, setSelectedFilters] = useState({});
  const [tempFilters, setTempFilters] = useState({});

  const [selectedDoc, setSelectedDoc] = useState(null);
  const [relationsData, setRelationsData] = useState(null);
  const [loadingRelations, setLoadingRelations] = useState(false);

  const [previewCitation, setPreviewCitation] = useState(null);

  const parseDateFromFilename = (pdfName) => {
    if (pdfName && typeof pdfName === 'string' && pdfName.length >= 8 && /^\d{8}/.test(pdfName)) {
      const year = pdfName.substring(0, 4);
      const month = pdfName.substring(4, 6);
      const day = pdfName.substring(6, 8);
      return `${year}-${month}-${day}`;
    }
    return 'N/A';
  };

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await apiFetch('/dashboard/filters', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAvailableFilters(data);
        }
      } catch (err) {
        console.error("Failed to load filter options", err);
      }
    };
    fetchFilterOptions();
  }, []);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        page,
        page_size: pageSize,
        search_query: searchQuery || null,
        filters: selectedFilters,
        sort_order: sortOrder
      };

      const res = await apiFetch('/dashboard/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents);
        setTotalCount(data.total_count);
        setTotalPages(data.total_pages);
      }
    } catch (err) {
      console.error("Failed to fetch documents", err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchQuery, selectedFilters, sortOrder]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleSelectDocument = async (doc) => {
    setSelectedDoc(doc);
    setLoadingRelations(true);
    try {
      const token = localStorage.getItem('token');
      const res = await apiFetch(`/chatbot/document/${doc.pdf_name}/relations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRelationsData(data);
      }
    } catch (err) {
      console.error("Failed to fetch document relations", err);
      setRelationsData({ current_pdf: doc.pdf_name, related_documents: [] });
    } finally {
      setLoadingRelations(false);
    }
  };

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter') {
      setPage(1);
      setSearchQuery(searchInput);
    }
  };

  const toggleTempFilter = (column, value) => {
    setTempFilters(prev => {
      const current = prev[column] || [];
      if (current.includes(value)) {
        return { ...prev, [column]: current.filter(v => v !== value) };
      }
      return { ...prev, [column]: [...current, value] };
    });
  };

  const applyFilters = () => {
    setSelectedFilters(tempFilters);
    setPage(1);
  };

  const resetFilters = () => {
    setTempFilters({});
    setSelectedFilters({});
    setPage(1);
  };

  const getStatusClass = (status) => {
    if (!status) return 'inactive';
    const s = status.toLowerCase();
    if (s.includes('active') || s.includes('approved')) return 'approved';
    if (s.includes('pending') || s.includes('draft')) return 'pending';
    return 'archived';
  };

  const activeFilterCount = Object.values(selectedFilters).reduce((acc, curr) => acc + curr.length, 0);

  return (
    <div className="dashboard-container">
      
      {/* Sidebar Filters */}
      <aside className="dash-sidebar">
        <div className="sidebar-header">
          <h3 className="sidebar-title">
            <Filter size={18} /> {t('dashboard.filters')}
            {activeFilterCount > 0 && <span className="filter-badge">{activeFilterCount}</span>}
          </h3>
        </div>
        
        <div className="sidebar-content">
          {availableFilters.filter_fields.map(field => {
            const options = availableFilters.options[field] || [];
            if (options.length === 0) return null;

            return (
              <div key={field} className="filter-group">
                <span className="filter-group-title">{field.replace('_', ' ')}</span>
                {options.map(opt => (
                  <label key={opt} className="checkbox-label">
                    <input 
                      type="checkbox"
                      checked={(tempFilters[field] || []).includes(opt)}
                      onChange={() => toggleTempFilter(field, opt)}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            );
          })}
        </div>

        <div className="sidebar-footer">
          <button className="btn-reset" onClick={resetFilters}>{t('dashboard.reset')}</button>
          <button className="btn-apply" onClick={applyFilters}>{t('dashboard.apply_filters')}</button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="dash-main">
        <div className="dash-toolbar">
          <div className="dash-toolbar-left">
            <div className="dash-stats">
              {t('dashboard.documents')} <span>{t('dashboard.total_results', { count: totalCount })}</span>
            </div>
            <div className="dash-search">
              <Search size={16} />
              <input 
                type="text" 
                placeholder={t('dashboard.search_placeholder')} 
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchSubmit}
              />
            </div>
          </div>

          <div className="dash-toolbar-right">
            <div className="view-toggles">
              <button 
                className={`btn-icon-outline ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                <List size={16} />
              </button>
              <button 
                className={`btn-icon-outline ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid size={16} />
              </button>
            </div>
            
            <select 
              className="sort-dropdown" 
              value={sortOrder} 
              onChange={(e) => { setSortOrder(e.target.value); setPage(1); }}
            >
              <option value="newest">{t('dashboard.newest_first')}</option>
              <option value="oldest">{t('dashboard.oldest_first')}</option>
            </select>

            <button className="btn-action-solid">
              <Plus size={14} /> {t('dashboard.new_review')}
            </button>
          </div>
        </div>

        <div className="content-area">
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-light)', gap: '1rem' }}>
              <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
              <p>{t('dashboard.loading')}</p>
            </div>
          ) : documents.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '4rem' }}>
              {t('dashboard.no_docs')}
            </div>
          ) : (
            viewMode === 'list' ? (
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>{t('dashboard.col_doc')}</th>
                    <th>{t('dashboard.col_dept')}</th>
                    <th>{t('dashboard.col_type')}</th>
                    <th>{t('dashboard.col_year')}</th>
                    <th>{t('common.status')}</th>
                    <th>{t('common.date')}</th>
                    <th style={{ textAlign: 'right' }}>{t('common.action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc, idx) => {
                    const derivedDate = parseDateFromFilename(doc.pdf_name);
                    return (
                      <tr 
                        key={doc.id || idx} 
                        onClick={() => handleSelectDocument(doc)}
                        style={{ cursor: 'pointer', backgroundColor: selectedDoc?.pdf_name === doc.pdf_name ? '#eff6ff' : 'transparent' }}
                      >
                        <td>
                          <div className="doc-cell">
                            <span className="doc-icon">PDF</span>
                            <div className="doc-info">
                              <span className="doc-title" title={doc.pdf_name}>{doc.pdf_name}</span>
                              <span className="doc-subtitle" title={doc.title}>{doc.title || t('dashboard.no_title')}</span>
                            </div>
                          </div>
                        </td>
                        <td className="meta-cell">{doc.department || '-'}</td>
                        <td className="meta-cell">{doc.document_type || '-'}</td>
                        <td className="meta-cell">{doc.academic_year || '-'}</td>
                        <td>
                          <span className={`status-badge ${getStatusClass(doc.status)}`}>
                            {doc.status || t('dashboard.unknown')}
                          </span>
                        </td>
                        <td className="meta-cell">{derivedDate}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setPreviewCitation({ pdf_name: doc.pdf_name, text: doc.title || 'Government Resolution Document' }); }}
                            className="btn-preview" 
                            style={{ width: 'auto', padding: '0.25rem 0.5rem', display: 'inline-flex' }}
                          >
                            <Eye size={12} /> {t('common.preview')}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="grid-view">
                 {/* Assume Grid View Logic Render Goes Here */}
              </div>
            )
          )}
        </div>
      </main>
      
      {/* ---------------- PDF Preview Modal ---------------- */}
      {previewCitation && (
        <DocumentModal 
          citation={previewCitation} 
          onClose={() => setPreviewCitation(null)} 
        />
      )}
    </div>
  );
}
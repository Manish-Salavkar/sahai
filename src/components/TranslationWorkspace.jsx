import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../utils/api';
import {
  Languages,
  FileText,
  Save,
  ArrowLeft,
  Search,
  CheckCircle2,
  Clock,
  ExternalLink,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Copy,
  Sparkles,
  BookOpen,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Undo,
  Redo,
  Indent,
  Outdent,
  Table,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Plus,
  Trash2
} from 'lucide-react';

const GOVT_TERMINOLOGY_SHORTCUTS = [
  { label: 'Government Resolution', mr: 'शासन निर्णय' },
  { label: 'School Education & Sports Dept', mr: 'शालेय शिक्षण व क्रीडा विभाग' },
  { label: 'Finance Department', mr: 'वित्त विभाग' },
  { label: 'General Administration Dept', mr: 'सामान्य प्रशासन विभाग' },
  { label: 'Financial Sanction', mr: 'वित्तीय प्रशासकीय मान्यता' },
  { label: 'Executive Order', mr: 'कार्यासन आदेश' },
  { label: 'Circular', mr: 'परिपत्रक' },
  { label: 'Notification', mr: 'अधिसूचना' }
];

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

export default function TranslationWorkspace() {
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

  // Selection & Split-Screen View
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [translatedTitle, setTranslatedTitle] = useState('');
  const [translatedContent, setTranslatedContent] = useState('');
  const [translationStatus, setTranslationStatus] = useState('Under Review');
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const editorRef = useRef(null);
  const tablePickerRef = useRef(null);
  const tableContextMenuRef = useRef(null);
  const savedRangeRef = useRef(null);

  const [showTablePicker, setShowTablePicker] = useState(false);
  const [gridHover, setGridHover] = useState({ rows: 1, cols: 1 });

  const [tableContextMenu, setTableContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    targetCell: null,
  });

  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    h1: false,
    h2: false,
    ul: false,
    ol: false,
    alignLeft: false,
    alignCenter: false,
    alignRight: false,
    fontSize: '3',
  });

  const saveCurrentSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current && editorRef.current.contains(sel.anchorNode)) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const updateActiveFormats = () => {
    try {
      const formatBlock = (document.queryCommandValue('formatBlock') || '').toLowerCase();
      const currentFontSize = document.queryCommandValue('fontSize') || '3';
      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        h1: formatBlock === 'h1' || formatBlock === 'header1',
        h2: formatBlock === 'h2' || formatBlock === 'header2',
        ul: document.queryCommandState('insertUnorderedList'),
        ol: document.queryCommandState('insertOrderedList'),
        alignLeft: document.queryCommandState('justifyLeft'),
        alignCenter: document.queryCommandState('justifyCenter'),
        alignRight: document.queryCommandState('justifyRight'),
        fontSize: currentFontSize.toString(),
      });
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    const handleSelectionChange = () => {
      if (editorRef.current && document.activeElement && editorRef.current.contains(document.activeElement)) {
        updateActiveFormats();
        saveCurrentSelection();
      }
    };
    const handleClickOutside = (e) => {
      if (tablePickerRef.current && !tablePickerRef.current.contains(e.target)) {
        setShowTablePicker(false);
      }
      if (tableContextMenuRef.current && !tableContextMenuRef.current.contains(e.target)) {
        setTableContextMenu((prev) => ({ ...prev, visible: false }));
      }
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
      if (!res || !res.ok) throw new Error('Failed to load documents for translation workspace');
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

  useEffect(() => {
    if (selectedDoc && editorRef.current) {
      const rawContent = selectedDoc.translated_content || '';
      const initialHtml = convertMarkdownToHtml(rawContent);
      editorRef.current.innerHTML = initialHtml;
      setTranslatedContent(initialHtml);
    }
  }, [selectedDoc]);

  const handleOpenWorkspace = async (doc) => {
    try {
      const res = await apiFetch(`/translation/documents/${encodeURIComponent(doc.pdf_name)}`);
      if (res && res.ok) {
        const detail = await res.json();
        setSelectedDoc(detail);
        setTranslatedTitle(detail.translated_title || '');
        const html = convertMarkdownToHtml(detail.translated_content || '');
        setTranslatedContent(html);
        setTranslationStatus(
          detail.translation_status === 'Translation Pending' ? 'Under Review' : detail.translation_status
        );
      } else {
        setSelectedDoc(doc);
        setTranslatedTitle(doc.translated_title || '');
        const html = convertMarkdownToHtml(doc.translated_content || '');
        setTranslatedContent(html);
        setTranslationStatus('Under Review');
      }
    } catch (err) {
      console.error(err);
      setSelectedDoc(doc);
      setTranslatedTitle(doc.translated_title || '');
      const html = convertMarkdownToHtml(doc.translated_content || '');
      setTranslatedContent(html);
      setTranslationStatus('Under Review');
    }
  };

  const handleSaveTranslation = async () => {
    if (!selectedDoc) return;
    setSaving(true);
    setToastMessage('');

    const currentHtml = editorRef.current ? editorRef.current.innerHTML : translatedContent;
    const targetStatus = selectedDoc.translation_status === 'Approved' ? 'Approved' : 'Under Review';

    try {
      const res = await apiFetch(`/translation/documents/${encodeURIComponent(selectedDoc.pdf_name)}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          translated_title: translatedTitle,
          translated_content: currentHtml,
          translation_status: targetStatus
        })
      });

      if (!res || !res.ok) {
        const errData = res ? await res.json() : {};
        throw new Error(errData.detail || 'Failed to save translation');
      }

      const updated = await res.json();
      setSelectedDoc(prev => ({
        ...prev,
        translation_status: updated.translation_status,
        translated_title: updated.translated_title,
        translated_content: updated.translated_content
      }));

      setDocuments(prevDocs =>
        prevDocs.map(d =>
          d.pdf_name === selectedDoc.pdf_name
            ? { ...d, translation_status: updated.translation_status, translated_title: updated.translated_title }
            : d
        )
      );

      setToastMessage(t('translationWorkspace.savedSuccess', 'Translation saved successfully! Status updated to Under Review.'));
      setTimeout(() => setToastMessage(''), 4000);
      fetchDocuments();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  // Editor Formatting Helper Functions
  const executeEditorCommand = (command, value = null) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    document.execCommand(command, false, value);
    setTranslatedContent(editor.innerHTML);
    updateActiveFormats();
  };

  const toggleHeading = (tag) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();

    if (tag === '<h1>' && activeFormats.h1) {
      document.execCommand('formatBlock', false, '<p>');
    } else if (tag === '<h2>' && activeFormats.h2) {
      document.execCommand('formatBlock', false, '<p>');
    } else {
      document.execCommand('formatBlock', false, tag);
    }
    setTranslatedContent(editor.innerHTML);
    updateActiveFormats();
  };

  const createTableGrid = (rows, cols) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();

    if (savedRangeRef.current) {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }

    let tableHtml = '<table style="width: 100%; border-collapse: collapse; margin: 0.75rem 0; border: 1px solid #cbd5e1;">';
    
    // Header Row
    tableHtml += '<thead style="background-color: #f8fafc;"><tr>';
    for (let c = 1; c <= cols; c++) {
      tableHtml += `<th style="border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left;">Header ${c}</th>`;
    }
    tableHtml += '</tr></thead>';

    // Body Rows
    tableHtml += '<tbody>';
    const bodyRows = rows > 1 ? rows - 1 : 1;
    for (let r = 1; r <= bodyRows; r++) {
      tableHtml += '<tr>';
      for (let c = 1; c <= cols; c++) {
        tableHtml += `<td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Cell</td>`;
      }
      tableHtml += '</tr>';
    }
    tableHtml += '</tbody></table><p><br/></p>';

    document.execCommand('insertHTML', false, tableHtml);
    setTranslatedContent(editor.innerHTML);
    setShowTablePicker(false);
    updateActiveFormats();
  };

  // Table Right-Click Context Menu Handlers
  const handleEditorContextMenu = (e) => {
    const cell = e.target.closest('td, th');
    if (cell) {
      e.preventDefault();
      setTableContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        targetCell: cell,
      });
    } else {
      setTableContextMenu((prev) => ({ ...prev, visible: false }));
    }
  };

  const addRowAtBottom = () => {
    const cell = tableContextMenu.targetCell;
    if (!cell) return;
    const table = cell.closest('table');
    if (!table) return;

    const colsCount = table.rows[0] ? table.rows[0].cells.length : 3;
    const tbody = table.querySelector('tbody') || table;
    
    const tr = document.createElement('tr');
    for (let i = 0; i < colsCount; i++) {
      const td = document.createElement('td');
      td.style.cssText = 'border: 1px solid #cbd5e1; padding: 8px 12px;';
      td.innerHTML = 'Cell';
      tr.appendChild(td);
    }
    tbody.appendChild(tr);

    if (editorRef.current) {
      setTranslatedContent(editorRef.current.innerHTML);
    }
    setTableContextMenu({ visible: false, x: 0, y: 0, targetCell: null });
  };

  const addColumnAtRight = () => {
    const cell = tableContextMenu.targetCell;
    if (!cell) return;
    const table = cell.closest('table');
    if (!table) return;

    Array.from(table.rows).forEach((row) => {
      const isHeader = row.parentNode && row.parentNode.tagName.toLowerCase() === 'thead';
      const newCell = isHeader ? document.createElement('th') : document.createElement('td');
      newCell.style.cssText = 'border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left;';
      if (isHeader) newCell.style.backgroundColor = '#f8fafc';
      newCell.innerHTML = isHeader ? 'Header' : 'Cell';
      row.appendChild(newCell);
    });

    if (editorRef.current) {
      setTranslatedContent(editorRef.current.innerHTML);
    }
    setTableContextMenu({ visible: false, x: 0, y: 0, targetCell: null });
  };

  const deleteRow = () => {
    const cell = tableContextMenu.targetCell;
    if (!cell) return;
    const tr = cell.closest('tr');
    const table = cell.closest('table');
    if (tr) tr.remove();
    if (table && table.rows.length === 0) {
      table.remove();
    }
    if (editorRef.current) {
      setTranslatedContent(editorRef.current.innerHTML);
    }
    setTableContextMenu({ visible: false, x: 0, y: 0, targetCell: null });
  };

  const deleteColumn = () => {
    const cell = tableContextMenu.targetCell;
    if (!cell) return;
    const colIndex = cell.cellIndex;
    const table = cell.closest('table');
    if (!table || colIndex === undefined) return;

    Array.from(table.rows).forEach((row) => {
      if (row.cells[colIndex]) {
        row.deleteCell(colIndex);
      }
    });

    if (table.rows.length === 0 || table.rows[0].cells.length === 0) {
      table.remove();
    }

    if (editorRef.current) {
      setTranslatedContent(editorRef.current.innerHTML);
    }
    setTableContextMenu({ visible: false, x: 0, y: 0, targetCell: null });
  };

  const deleteTable = () => {
    const cell = tableContextMenu.targetCell;
    if (!cell) return;
    const table = cell.closest('table');
    if (table) table.remove();
    if (editorRef.current) {
      setTranslatedContent(editorRef.current.innerHTML);
    }
    setTableContextMenu({ visible: false, x: 0, y: 0, targetCell: null });
  };

  const insertShortcutTerm = (term) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    const htmlToInsert = ` <strong>${term.mr}</strong> (${term.label}) `;
    document.execCommand('insertHTML', false, htmlToInsert);
    setTranslatedContent(editor.innerHTML);
    updateActiveFormats();
  };

  const copyOriginalTitle = () => {
    if (selectedDoc && selectedDoc.title) {
      setTranslatedTitle(selectedDoc.title);
    }
  };

  const renderStatusBadge = (statusVal) => {
    if (statusVal === 'Approved') {
      return (
        <span className="status-badge status-approved">
          <CheckCircle2 size={13} /> {t('translationWorkspace.statusApproved', 'Approved')}
        </span>
      );
    }
    if (statusVal === 'Under Review') {
      return (
        <span className="status-badge status-review">
          <Clock size={13} /> {t('translationWorkspace.statusUnderReview', 'Under Review')}
        </span>
      );
    }
    if (statusVal === 'Needs Rework' || statusVal === 'Rework') {
      return (
        <span className="status-badge status-rework">
          <RotateCcw size={13} /> {t('translationWorkspace.statusNeedsRework', 'Needs Rework')}
        </span>
      );
    }
    return (
      <span className="status-badge status-pending">
        <AlertCircle size={13} /> {t('translationWorkspace.statusPending', 'Translation Pending')}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="translation-container loading-state">
        <div className="spinner"></div>
        <p>Loading documents for translation workspace...</p>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: SPLIT-SCREEN WORKSPACE (PDF ON LEFT, EDITOR ON RIGHT)
  // =========================================================================
  if (selectedDoc) {
    return (
      <div className="translation-workspace-screen">
        {/* Workspace Top Header Bar */}
        <header className="workspace-header">
          <div className="workspace-header-left">
            <button className="back-btn" onClick={() => setSelectedDoc(null)}>
              <ArrowLeft size={18} />
              <span>{t('translationWorkspace.backToList', 'Back to List')}</span>
            </button>
            <div className="workspace-doc-meta">
              <h2 className="workspace-doc-title">{selectedDoc.title || selectedDoc.pdf_name}</h2>
              <span className="pdf-name-pill">{selectedDoc.pdf_name}</span>
              {renderStatusBadge(selectedDoc.translation_status)}
            </div>
          </div>

          <div className="workspace-header-right">
            {toastMessage && <div className="toast-banner">{toastMessage}</div>}

            <button
              className="save-translation-btn"
              onClick={handleSaveTranslation}
              disabled={saving}
            >
              <Save size={16} />
              <span>{saving ? t('translationWorkspace.saving', 'Saving...') : t('translationWorkspace.saveBtn', 'Save & Submit')}</span>
            </button>
          </div>
        </header>

        {/* Split Screen Container */}
        <div className="split-workspace-container">
          {/* LEFT PANEL: PDF VIEWER */}
          <div className="split-panel pdf-panel">
            <div className="panel-subhead">
              <div className="subhead-title">
                <FileText size={16} />
                <span>{t('translationWorkspace.originalDoc', 'Original PDF Document')}</span>
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

          {/* RIGHT PANEL: RICH TRANSLATION EDITOR */}
          <div className="split-panel editor-panel">
            <div className="panel-subhead">
              <div className="subhead-title">
                <Languages size={16} />
                <span>{t('translationWorkspace.editorTitle', 'Translation Editor')}</span>
              </div>
              <button className="copy-title-btn" onClick={copyOriginalTitle} title="Copy original title">
                <Copy size={13} /> {t('translationWorkspace.insertOriginalTitle', 'Copy Original Title')}
              </button>
            </div>

            {/* If Reviewer Rework Note exists */}
            {selectedDoc.review_note && (
              <div className="reviewer-note-alert" style={{ margin: '0.75rem 1.25rem 0' }}>
                <div className="note-alert-header">
                  <RotateCcw size={15} />
                  <span>Reviewer Feedback & Rework Instructions ({selectedDoc.reviewer_name || 'Reviewer'}):</span>
                </div>
                <p className="note-alert-text">{selectedDoc.review_note}</p>
              </div>
            )}

            {/* Rich Editor Controls Toolbar */}
            <div className="editor-toolbar">
              {/* Group 1: Undo & Redo */}
              <div className="toolbar-group">
                <button
                  type="button"
                  className="toolbar-btn"
                  onClick={() => executeEditorCommand('undo')}
                  title="Undo (Ctrl+Z)"
                >
                  <Undo size={15} />
                </button>
                <button
                  type="button"
                  className="toolbar-btn"
                  onClick={() => executeEditorCommand('redo')}
                  title="Redo (Ctrl+Y)"
                >
                  <Redo size={15} />
                </button>
              </div>

              <div className="toolbar-divider"></div>

              {/* Group 2: Font Size Selector */}
              <div className="toolbar-group">
                <select
                  className="toolbar-font-size-select"
                  value={activeFormats.fontSize || '3'}
                  onChange={(e) => executeEditorCommand('fontSize', e.target.value)}
                  title="Font Size"
                >
                  <option value="1">10px - Smallest</option>
                  <option value="2">13px - Small</option>
                  <option value="3">16px - Normal</option>
                  <option value="4">18px - Medium</option>
                  <option value="5">24px - Large</option>
                  <option value="6">32px - Extra Large</option>
                </select>
              </div>

              <div className="toolbar-divider"></div>

              {/* Group 3: Text Formatting */}
              <div className="toolbar-group">
                <button
                  type="button"
                  className={`toolbar-btn ${activeFormats.bold ? 'active' : ''}`}
                  onClick={() => executeEditorCommand('bold')}
                  title="Bold (Ctrl+B)"
                >
                  <Bold size={15} />
                </button>
                <button
                  type="button"
                  className={`toolbar-btn ${activeFormats.italic ? 'active' : ''}`}
                  onClick={() => executeEditorCommand('italic')}
                  title="Italic (Ctrl+I)"
                >
                  <Italic size={15} />
                </button>
                <button
                  type="button"
                  className={`toolbar-btn ${activeFormats.underline ? 'active' : ''}`}
                  onClick={() => executeEditorCommand('underline')}
                  title="Underline (Ctrl+U)"
                >
                  <Underline size={15} />
                </button>
              </div>

              <div className="toolbar-divider"></div>

              {/* Group 4: Alignment & Indentation */}
              <div className="toolbar-group">
                <button
                  type="button"
                  className={`toolbar-btn ${activeFormats.alignLeft ? 'active' : ''}`}
                  onClick={() => executeEditorCommand('justifyLeft')}
                  title="Align Left"
                >
                  <AlignLeft size={15} />
                </button>
                <button
                  type="button"
                  className={`toolbar-btn ${activeFormats.alignCenter ? 'active' : ''}`}
                  onClick={() => executeEditorCommand('justifyCenter')}
                  title="Align Middle (Center)"
                >
                  <AlignCenter size={15} />
                </button>
                <button
                  type="button"
                  className={`toolbar-btn ${activeFormats.alignRight ? 'active' : ''}`}
                  onClick={() => executeEditorCommand('justifyRight')}
                  title="Align Right"
                >
                  <AlignRight size={15} />
                </button>
                <button
                  type="button"
                  className="toolbar-btn"
                  onClick={() => executeEditorCommand('outdent')}
                  title="Decrease Indent"
                >
                  <Outdent size={15} />
                </button>
                <button
                  type="button"
                  className="toolbar-btn"
                  onClick={() => executeEditorCommand('indent')}
                  title="Increase Indent"
                >
                  <Indent size={15} />
                </button>
              </div>

              <div className="toolbar-divider"></div>

              {/* Group 5: Headings & Lists */}
              <div className="toolbar-group">
                <button
                  type="button"
                  className={`toolbar-btn ${activeFormats.h1 ? 'active' : ''}`}
                  onClick={() => toggleHeading('<h1>')}
                  title="Heading 1 (Click again to revert)"
                >
                  <Heading1 size={15} />
                </button>
                <button
                  type="button"
                  className={`toolbar-btn ${activeFormats.h2 ? 'active' : ''}`}
                  onClick={() => toggleHeading('<h2>')}
                  title="Heading 2 (Click again to revert)"
                >
                  <Heading2 size={15} />
                </button>
                <button
                  type="button"
                  className={`toolbar-btn ${activeFormats.ul ? 'active' : ''}`}
                  onClick={() => executeEditorCommand('insertUnorderedList')}
                  title="Bullet List"
                >
                  <List size={15} />
                </button>
                <button
                  type="button"
                  className={`toolbar-btn ${activeFormats.ol ? 'active' : ''}`}
                  onClick={() => executeEditorCommand('insertOrderedList')}
                  title="Numbered List"
                >
                  <ListOrdered size={15} />
                </button>
              </div>

              <div className="toolbar-divider"></div>

              {/* Group 6: Interactive Table Grid Picker */}
              <div className="toolbar-group">
                <div className="table-picker-container" ref={tablePickerRef}>
                  <button
                    type="button"
                    className={`toolbar-btn ${showTablePicker ? 'active' : ''}`}
                    onClick={() => setShowTablePicker(prev => !prev)}
                    title="Insert Table Grid"
                  >
                    <Table size={15} />
                  </button>

                  {showTablePicker && (
                    <div className="table-grid-popover">
                      <div className="table-grid-header">
                        {gridHover.rows} × {gridHover.cols} Table
                      </div>
                      <div
                        className="table-grid-matrix"
                        onMouseLeave={() => setGridHover({ rows: 1, cols: 1 })}
                      >
                        {Array.from({ length: 8 }).map((_, rIndex) => (
                          <div key={rIndex} className="table-grid-row">
                            {Array.from({ length: 8 }).map((_, cIndex) => {
                              const isSelected = rIndex < gridHover.rows && cIndex < gridHover.cols;
                              return (
                                <div
                                  key={cIndex}
                                  className={`table-grid-cell ${isSelected ? 'selected' : ''}`}
                                  onMouseEnter={() => setGridHover({ rows: rIndex + 1, cols: cIndex + 1 })}
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => createTableGrid(rIndex + 1, cIndex + 1)}
                                />
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="toolbar-divider"></div>

              {/* Govt Terminology Quick Insert Shortcuts */}
              <div className="toolbar-shortcuts">
                <span className="shortcuts-label"><BookOpen size={13} /> Quick Terms:</span>
                <div className="shortcuts-pills">
                  {GOVT_TERMINOLOGY_SHORTCUTS.slice(0, 4).map((term, i) => (
                    <button
                      key={i}
                      type="button"
                      className="term-pill-btn"
                      onClick={() => insertShortcutTerm(term)}
                    >
                      {term.mr}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Translation Inputs */}
            <div className="editor-inputs-body">
              <div className="form-field">
                <label className="field-label">Translated Title (भाषांतरित शीर्षक):</label>
                <input
                  type="text"
                  className="translation-title-input"
                  value={translatedTitle}
                  onChange={(e) => setTranslatedTitle(e.target.value)}
                  placeholder="Enter Marathi / English translated resolution title..."
                />
              </div>

              <div className="form-field flex-grow-field">
                <label className="field-label">Translated Content (शासन निर्णयाचा भाषांतरित मजकूर):</label>
                <div
                  ref={editorRef}
                  className="translation-rich-editor"
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(e) => {
                    setTranslatedContent(e.currentTarget.innerHTML);
                    updateActiveFormats();
                  }}
                  onClick={updateActiveFormats}
                  onKeyUp={updateActiveFormats}
                  onFocus={updateActiveFormats}
                  onContextMenu={handleEditorContextMenu}
                  data-placeholder="Write or edit translated resolution content here..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Table Right-Click Context Menu Popover */}
        {tableContextMenu.visible && (
          <div
            ref={tableContextMenuRef}
            className="table-context-menu"
            style={{ top: `${tableContextMenu.y}px`, left: `${tableContextMenu.x}px` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="menu-header">Table Actions</div>
            <button type="button" className="context-menu-item" onClick={addRowAtBottom}>
              <Plus size={14} /> Add Row
            </button>
            <button type="button" className="context-menu-item" onClick={addColumnAtRight}>
              <Plus size={14} /> Add Column
            </button>
            <div className="context-menu-divider" />
            <button type="button" className="context-menu-item" onClick={deleteRow}>
              <Trash2 size={14} /> Delete Row
            </button>
            <button type="button" className="context-menu-item" onClick={deleteColumn}>
              <Trash2 size={14} /> Delete Column
            </button>
            <div className="context-menu-divider" />
            <button type="button" className="context-menu-item danger" onClick={deleteTable}>
              <Trash2 size={14} /> Delete Table
            </button>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW 1: TRANSLATION DOCUMENT LIST
  // =========================================================================
  return (
    <div className="translation-workspace-page">
      {/* Header Banner */}
      <header className="translation-page-header">
        <div className="header-left">
          <div className="header-icon-box">
            <Languages size={24} />
          </div>
          <div>
            <h1 className="header-title">{t('translationWorkspace.title', 'Translation Workspace')}</h1>
            <p className="header-subtitle">{t('translationWorkspace.subtitle', 'Translate Government Resolutions (GRs) and official documents with rich text tools')}</p>
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
            placeholder="Search by title, PDF name, or department..."
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
            className={`filter-pill ${statusFilter === 'Translation Pending' ? 'active' : ''}`}
            onClick={() => { setStatusFilter('Translation Pending'); setPage(1); }}
          >
            Pending ({pendingCount})
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
              <th>{t('translationWorkspace.colDoc', 'Document Title / PDF')}</th>
              <th>{t('translationWorkspace.colDept', 'Department')}</th>
              <th>{t('translationWorkspace.colStatus', 'Translation Status')}</th>
              <th className="text-right">{t('translationWorkspace.colAction', 'Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {documents.length === 0 ? (
              <tr>
                <td colSpan={4} className="empty-table-cell">
                  No documents found matching search criteria.
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
                      className="action-translate-btn"
                      onClick={() => handleOpenWorkspace(doc)}
                    >
                      <Sparkles size={14} />
                      <span>
                        {doc.translation_status === 'Needs Rework' || doc.translation_status === 'Rework'
                          ? 'Rework Translation'
                          : doc.translation_status === 'Translation Pending'
                          ? t('translationWorkspace.translateBtn', 'Translate Document')
                          : t('translationWorkspace.editBtn', 'Edit Translation')}
                      </span>
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

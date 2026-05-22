'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Mail,
  Building,
  UserCheck,
  UploadCloud,
  FileText,
  X,
  CheckCircle2,
  ChevronDown,
  Search,
  AlertCircle,
  Sparkles,
  Info,
  FileSpreadsheet,
  FileImage,
  FileCode,
  FileIcon,
  CloudLightning,
  Database
} from 'lucide-react';

interface UnitOption {
  id: string;
  nama: string;
  pic: string; // Hanya satu PIC per unit
}

export default function Home() {
  // Form State
  const [email, setEmail] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<UnitOption | null>(null);
  const [selectedPic, setSelectedPic] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  
  // UI Control State
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Custom Select Dropdown State
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [unitSearch, setUnitSearch] = useState('');

  // Submit Result State
  const [successData, setSuccessData] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const unitDropdownRef = useRef<HTMLDivElement>(null);

  const [tahun, setTahun] = useState<number>(2026);
  const [periode, setPeriode] = useState<number>(2);
  const [judulForm, setJudulForm] = useState<string>('Revisi RKAT Periode II 2026');
  const [waktuBuka, setWaktuBuka] = useState<string>('');
  const [waktuTutup, setWaktuTutup] = useState<string>('');
  const [r2Folder, setR2Folder] = useState<string>('');
  const [isFormOpen, setIsFormOpen] = useState<boolean>(true);

  // Load master data dari API route
  useEffect(() => {
    async function loadData() {
      try {
        const [resUnits, resSettings] = await Promise.all([
          fetch('/api/units'),
          fetch('/api/settings')
        ]);
        
        const unitsData = await resUnits.json();
        if (unitsData.success) {
          setUnits(unitsData.data);
        }

        const settingsData = await resSettings.json();
        if (settingsData.success && settingsData.data) {
          setJudulForm(settingsData.data.judul_form);
          setTahun(settingsData.data.tahun_aktif);
          setPeriode(settingsData.data.periode_aktif);
          setWaktuBuka(settingsData.data.waktu_buka);
          setWaktuTutup(settingsData.data.waktu_tutup);
          setR2Folder(settingsData.data.r2_folder);

          // Validasi Waktu
          const now = new Date();
          const openTime = new Date(settingsData.data.waktu_buka);
          const closeTime = new Date(settingsData.data.waktu_tutup);
          
          if (now < openTime || now > closeTime) {
            setIsFormOpen(false);
          } else {
            setIsFormOpen(true);
          }
        }
      } catch (err) {
        console.error('Failed to load data', err);
      } finally {
        setLoadingUnits(false);
      }
    }
    loadData();
  }, []);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (unitDropdownRef.current && !unitDropdownRef.current.contains(event.target as Node)) {
        setShowUnitDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset/Set PIC when Unit changes
  const handleUnitSelect = (unit: UnitOption) => {
    setSelectedUnit(unit);
    setSelectedPic(unit.pic); // Otomatis mengisi PIC dari lookup database unit
    setShowUnitDropdown(false);
    setUnitSearch('');
  };

  // Handle Drag & Drop Events
  const [dragActive, setDragActive] = useState(false);
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const newFiles = Array.from(e.dataTransfer.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  // Handle File Input Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Helper to format file size
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = 2;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Helper to get file icon
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return <FileText className="file-icon" size={20} style={{ color: '#f43f5e' }} />;
      case 'xls':
      case 'xlsx':
      case 'csv':
        return <FileSpreadsheet className="file-icon" size={20} style={{ color: '#10b981' }} />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
      case 'svg':
        return <FileImage className="file-icon" size={20} style={{ color: '#06b6d4' }} />;
      case 'zip':
      case 'rar':
      case '7z':
        return <FileIcon className="file-icon" size={20} style={{ color: '#f59e0b' }} />;
      case 'doc':
      case 'docx':
        return <FileText className="file-icon" size={20} style={{ color: '#3b82f6' }} />;
      case 'html':
      case 'css':
      case 'js':
      case 'ts':
      case 'json':
        return <FileCode className="file-icon" size={20} style={{ color: '#a78bfa' }} />;
      default:
        return <FileText className="file-icon" size={20} style={{ color: '#9ca3af' }} />;
    }
  };

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Email wajib diisi.');
      return;
    }
    if (!selectedUnit) {
      setErrorMsg('Unit wajib dipilih.');
      return;
    }
    if (!selectedPic) {
      setErrorMsg('PIC wajib ditentukan.');
      return;
    }
    if (files.length === 0) {
      setErrorMsg('Minimal harus mengunggah 1 file.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('tahun', tahun.toString());
      formData.append('periode', periode.toString());
      formData.append('r2_folder', r2Folder);
      formData.append('email', email);
      formData.append('unit', selectedUnit.nama);
      formData.append('pic', selectedPic);
      
      files.forEach((file) => {
        formData.append('files', file);
      });

      const response = await fetch('/api/submit', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setSuccessData(result);
        // Reset Form
        setEmail('');
        setSelectedUnit(null);
        setSelectedPic('');
        setFiles([]);
      } else {
        setErrorMsg(result.error || 'Gagal mengirimkan formulir.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Terjadi kesalahan jaringan atau server.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter Units based on search input
  const filteredUnits = units.filter((unit) =>
    unit.nama.toLowerCase().includes(unitSearch.toLowerCase())
  );

  return (
    <div className="app-container" style={{ animation: 'scaleUp 0.4s ease-out' }}>
      {!successData ? (
        <div className="glass-card">
          {/* Header Tagline */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="upload-icon-container" style={{ width: '32px', height: '32px', borderRadius: '8px' }}>
                <CloudLightning size={16} />
              </span>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#a78bfa' }}>
                PORTAL FORMULIR
              </span>
            </div>
            <div className="sim-badge" style={{ marginTop: 0 }}>
              Live System Ready
            </div>
          </div>
          
          <h1 className="card-title" style={{ fontSize: '2.5rem', marginBottom: '12px' }}>{judulForm}</h1>
          <p className="card-subtitle" style={{ marginBottom: '36px' }}>
            Unggah dokumen penunjang Anda.
          </p>

          {!isFormOpen ? (
            <div className="alert alert-danger" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '32px' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px', color: '#ef4444' }}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '12px' }}>Formulir Ditutup</h3>
              <p style={{ fontSize: '1rem', color: '#475569', lineHeight: 1.6 }}>
                Mohon maaf, pengisian form <strong>{judulForm}</strong> hanya dibuka dari tanggal<br/>
                <span style={{ color: '#1e293b', fontWeight: 600 }}>
                  {waktuBuka ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'full', timeStyle: 'short' }).format(new Date(waktuBuka)) : '...'}
                </span>
                <br/>sampai dengan<br/>
                <span style={{ color: '#1e293b', fontWeight: 600 }}>
                  {waktuTutup ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'full', timeStyle: 'short' }).format(new Date(waktuTutup)) : '...'}
                </span>
              </p>
            </div>
          ) : (
            <>
              {errorMsg && (
                <div className="alert alert-danger" style={{ animation: 'slideIn 0.3s ease-out' }}>
                  <AlertCircle size={20} style={{ flexShrink: 0 }} />
                  <div>{errorMsg}</div>
                </div>
              )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">
                  Tahun
                </label>
                <div className="input-container">
                  <input
                    type="text"
                    className="form-input"
                    value={tahun}
                    readOnly
                    style={{ background: '#f8fafc', color: '#64748b', cursor: 'not-allowed', paddingLeft: '16px' }}
                  />
                </div>
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">
                  Periode
                </label>
                <div className="input-container">
                  <input
                    type="text"
                    className="form-input"
                    value={periode}
                    readOnly
                    style={{ background: '#f8fafc', color: '#64748b', cursor: 'not-allowed', paddingLeft: '16px' }}
                  />
                </div>
              </div>
            </div>

            {/* 1. INPUT EMAIL */}
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Alamat Email Pengirim<span>*</span>
              </label>
              <div className="input-container">
                <input
                  type="email"
                  id="email"
                  className="form-input"
                  placeholder="masukkan.email@kantor.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                />
                <Mail className="input-icon" size={20} />
              </div>
            </div>

            {/* 2. INPUT UNIT (COMBOBOX DARI DB) */}
            <div className="form-group" ref={unitDropdownRef}>
              <label className="form-label">
                Pilih Unit Kerja (Combobox)<span>*</span>
              </label>
              <div className="custom-select-wrapper">
                <button
                  type="button"
                  className={`custom-select-trigger ${showUnitDropdown ? 'active' : ''}`}
                  onClick={() => !submitting && setShowUnitDropdown(!showUnitDropdown)}
                  disabled={submitting || loadingUnits}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <Building className="input-icon" size={20} style={{ left: '16px', position: 'static' }} />
                    {loadingUnits ? 'Menghubungkan ke database...' : (selectedUnit ? selectedUnit.nama : 'Pilih unit kerja...')}
                  </span>
                  <ChevronDown size={18} style={{ transform: showUnitDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>

                {showUnitDropdown && (
                  <div className="custom-select-dropdown" style={{ border: '1px solid rgba(167, 139, 250, 0.4)' }}>
                    <div className="select-search-box">
                      <input
                        type="text"
                        className="select-search-input"
                        placeholder="Ketik untuk mencari unit..."
                        value={unitSearch}
                        onChange={(e) => setUnitSearch(e.target.value)}
                        autoFocus
                      />
                    </div>
                    {filteredUnits.length > 0 ? (
                      filteredUnits.map((unit) => (
                        <div
                          key={unit.id}
                          className={`select-option ${selectedUnit?.id === unit.id ? 'selected' : ''}`}
                          onClick={() => handleUnitSelect(unit)}
                        >
                          {unit.nama}
                        </div>
                      ))
                    ) : (
                      <div className="select-no-results">Unit tidak ditemukan</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 3. INPUT PIC (OTOMATIS BERDASARKAN UNIT - READ ONLY) */}
            <div className="form-group">
              <label className="form-label">
                PIC<span>*</span>
              </label>
              
              {!selectedUnit ? (
                <div className="auto-field empty">
                  <UserCheck className="input-icon" size={20} />
                  Menunggu pemilihan Unit Kerja...
                </div>
              ) : (
                <div className="input-container">
                  <input
                    type="text"
                    className="form-input"
                    style={{ 
                      background: '#f8fafc', 
                      borderStyle: 'dashed', 
                      borderColor: '#cbd5e1',
                      color: '#6366f1',
                      fontWeight: 600,
                      cursor: 'not-allowed'
                    }}
                    value={selectedPic}
                    readOnly
                    required
                  />
                  <UserCheck className="input-icon" size={20} style={{ color: '#6366f1' }} />
                </div>
              )}
            </div>

            {/* 4. UPLOAD MULTI FILE */}
            <div className="form-group">
              <label className="form-label">
                Unggah Lampiran Berkas (Multi-File)<span>*</span>
              </label>
              
              <div 
                className={`upload-zone ${dragActive ? 'dragging' : ''}`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => !submitting && fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                  disabled={submitting}
                />
                
                <div className="upload-zone-content">
                  <div className="upload-icon-container" style={{ background: 'rgba(167, 139, 250, 0.1)', color: '#a78bfa' }}>
                    <UploadCloud size={32} />
                  </div>
                  <div className="upload-hint">
                    Seret & jatuhkan berkas di sini atau <span style={{ textDecoration: 'underline' }}>pilih berkas</span>
                  </div>
                  <div className="upload-limit">
                    Mendukung berkas PDF, Word, Excel, JPG/PNG (Maksimal 20MB per berkas)
                  </div>
                </div>
              </div>

              {files.length > 0 && (
                <div className="file-list" style={{ marginTop: '16px' }}>
                  {files.map((file, index) => (
                    <div className="file-item" key={index} style={{ border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <div className="file-info">
                        {getFileIcon(file.name)}
                        <div style={{ overflow: 'hidden' }}>
                          <div className="file-name" title={file.name} style={{ fontWeight: 600 }}>{file.name}</div>
                          <div className="file-size" style={{ color: '#9ca3af' }}>{formatBytes(file.size)}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="remove-file-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(index);
                        }}
                        disabled={submitting}
                        title="Hapus berkas"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 5. SUBMIT BUTTON */}
            <div style={{ marginTop: '40px' }}>
              <button
                type="submit"
                className="submit-btn"
                disabled={submitting || !email || !selectedUnit || !selectedPic || files.length === 0}
                style={{ height: '56px', fontSize: '1.1rem' }}
              >
                {submitting ? (
                  <>
                    <div className="spinner"></div>
                    Proses Menyimpan & Mengunggah...
                  </>
                ) : (
                  <>
                    Kirim Formulir Pengajuan
                  </>
                )}
              </button>
            </div>
          </form>
          </>
          )}
        </div>
      ) : (
        /* SUCCESS VIEW */
        <div className="glass-card success-card" style={{ animation: 'scaleUp 0.4s ease-out' }}>
          <div className="success-icon-container">
            <CheckCircle2 size={44} />
          </div>
          
          <h2 className="success-title">Pengajuan Terkirim!</h2>
          <p className="success-msg">
            Formulir telah sukses direkam. Email tanda terima telah dikirimkan ke 
            <strong> {successData.data?.email}</strong>.
          </p>

          <div className="summary-card">
            <h3 className="summary-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <Database size={16} style={{ color: '#a78bfa' }} /> Ringkasan Transaksi
            </h3>
            <div className="summary-row">
              <span className="summary-label">ID Transaksi</span>
              <span className="summary-val" style={{ color: '#a78bfa', fontFamily: 'monospace', fontSize: '0.95rem' }}>#{successData.data?.id}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Unit Kerja</span>
              <span className="summary-val">{successData.data?.unit}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">PIC Terkait</span>
              <span className="summary-val" style={{ color: '#06b6d4', fontWeight: 700 }}>{successData.data?.pic}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Jumlah File</span>
              <span className="summary-val">{successData.data?.files?.length} Berkas</span>
            </div>
            

          </div>

          {successData.data?.files && (
            <div style={{ textAlign: 'left', marginBottom: '32px' }}>
              <span className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                <Info size={16} style={{ color: '#a78bfa' }} /> Dokumen Terlampir di OneDrive:
              </span>
              <div className="file-list">
                {successData.data.files.map((file: any, index: number) => (
                  <div className="file-item" key={index} style={{ background: 'rgba(0, 0, 0, 0.2)' }}>
                    <div className="file-info" style={{ width: '100%' }}>
                      {getFileIcon(file.name)}
                      <div style={{ overflow: 'hidden', width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="file-name" style={{ maxWidth: '65%', fontWeight: 500 }} title={file.name}>{file.name}</span>
                          <a 
                            href={file.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            download
                            style={{ 
                              fontSize: '0.85rem', 
                              color: '#fff', 
                              background: 'var(--accent-gradient)',
                              padding: '6px 16px',
                              borderRadius: '20px',
                              textDecoration: 'none',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              boxShadow: '0 4px 10px rgba(99, 102, 241, 0.3)',
                              transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                            Unduh
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            className="back-btn"
            onClick={() => setSuccessData(null)}
            style={{ width: '100%', height: '48px', background: 'rgba(255,255,255,0.06)' }}
          >
            Kirim Pengajuan Baru
          </button>
        </div>
      )}
    </div>
  );
}

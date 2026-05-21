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

  // Fetch Units from API
  useEffect(() => {
    async function loadUnits() {
      try {
        const res = await fetch('/api/units');
        const data = await res.json();
        if (data.success) {
          setUnits(data.data);
        } else {
          setErrorMsg('Gagal memuat daftar unit.');
        }
      } catch (err) {
        console.error(err);
        setErrorMsg('Terjadi kesalahan saat memuat data unit.');
      } finally {
        setLoadingUnits(false);
      }
    }
    loadUnits();
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
                OneDrive Secure Portal
              </span>
            </div>
            <div className="sim-badge" style={{ marginTop: 0 }}>
              Live System Ready
            </div>
          </div>
          
          <h1 className="card-title" style={{ fontSize: '2.5rem', marginBottom: '12px' }}>Verifikasi Berkas</h1>
          <p className="card-subtitle" style={{ marginBottom: '36px' }}>
            Unggah dokumen penunjang Anda secara instan ke folder OneDrive. 
            Data Unit & PIC dibaca langsung dari database Supabase Anda.
          </p>

          {errorMsg && (
            <div className="alert alert-danger" style={{ animation: 'slideIn 0.3s ease-out' }}>
              <AlertCircle size={20} style={{ flexShrink: 0 }} />
              <div>{errorMsg}</div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
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
                PIC Unit (Otomatis Terisi dari Database)<span>*</span>
              </label>
              
              {!selectedUnit ? (
                <div className="auto-field empty" style={{ display: 'flex', alignItems: 'center' }}>
                  <UserCheck size={20} style={{ marginRight: '12px', color: '#9ca3af' }} />
                  Menunggu pemilihan Unit Kerja...
                </div>
              ) : (
                <div className="input-container">
                  <input
                    type="text"
                    className="form-input"
                    style={{ 
                      background: 'rgba(124, 58, 237, 0.05)', 
                      borderStyle: 'dashed', 
                      borderColor: 'rgba(167, 139, 250, 0.4)',
                      color: '#c084fc',
                      fontWeight: 600,
                      cursor: 'not-allowed'
                    }}
                    value={selectedPic}
                    readOnly
                    required
                  />
                  <UserCheck className="input-icon" size={20} style={{ color: '#c084fc' }} />
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
                            style={{ 
                              fontSize: '0.8rem', 
                              color: '#a78bfa', 
                              textDecoration: 'underline',
                              fontWeight: 600
                            }}
                          >
                            Buka Berkas &rarr;
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

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Plus, GripVertical, Image, Trash2, Save } from 'lucide-react';
import GlassModal from '../ui/GlassModal';
import GlassButton from '../ui/GlassButton';
import useToastStore from '../../store/useToastStore';
import {
  uploadImage,
  uploadMultipleImages
} from '../../services/cloudinary';
import { uploadToMega, formatFileSize, isMegaConfigured } from '../../services/megaStorage';
import { createApp, updateApp as updateFirebaseApp } from '../../firebase/appService';

const categories = ['Utility', 'Productivity', 'Tool', 'Game', 'Other'];
const PLATFORMS = [
  { id: 'windows', label: 'Windows', icon: '🪟' },
  { id: 'mac',     label: 'Mac',     icon: '🍎' },
  { id: 'linux',   label: 'Linux',   icon: '🐧' },
  { id: 'android', label: 'Android', icon: '🤖' },
  { id: 'ios',     label: 'iOS',     icon: '📱' },
  { id: 'web',     label: 'Web',     icon: '🌐' },
];

export default function AddEditAppModal({ isOpen, onClose, editingApp = null, onRefresh }) {
  const toast = useToastStore();
  const megaUploadAvailable = isMegaConfigured();

  const [form, setForm] = useState({
    name: '', shortDesc: '', longDesc: '', version: '1.0.0',
    category: 'Utility', platform: [], icon: '', iconPublicId: '',
    previewImages: [], fileData: null, fileHandle: null, downloadUrl: '',
    fileName: '', fileSize: '', showLikes: true, showComments: true,
    published: true, manualSteps: [], appFile: null
  });

  const [publishing, setPublishing] = useState(false);
  const [publishStep, setPublishStep] = useState('');
  const [iconProgress, setIconProgress] = useState(0);
  const [previewProgress, setPreviewProgress] = useState(0);
  const [fileProgress, setFileProgress] = useState(0);
  const [iconUploading, setIconUploading] = useState(false);
  const [previewUploading, setPreviewUploading] = useState(false);

  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedBytes, setUploadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('idle'); // 'idle' | 'preparing' | 'uploading' | 'done' | 'error'
  const [uploadError, setUploadError] = useState('');
  const [uploadMode, setUploadMode] = useState('url'); // 'file' or 'url'
  const [uploadedFileUrl, setUploadedFileUrl] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const iconInputRef = useRef(null);
  const previewInputRef = useRef(null);

  useEffect(() => {
    if (editingApp) {
      setForm({
        name: editingApp.name || '',
        shortDesc: editingApp.shortDesc || '',
        longDesc: editingApp.longDesc || '',
        version: editingApp.version || '1.0.0',
        category: editingApp.category || 'Utility',
        platform: editingApp.platform || [],
        icon: editingApp.iconUrl || editingApp.icon || '',
        iconPublicId: editingApp.iconPublicId || '',
        previewImages: (editingApp.previewUrls || editingApp.previewImages || [])
          .map((image) => (typeof image === 'string' ? { url: image } : image))
          .filter((image) => image?.url),
        fileData: editingApp.fileData || null,
        fileHandle: editingApp.fileHandle || null,
        downloadUrl: editingApp.downloadUrl || '',
        fileName: editingApp.fileName || '',
        fileSize: editingApp.fileSize || '',
        showLikes: editingApp.showLikes ?? true,
        showComments: editingApp.showComments ?? true,
        published: editingApp.published ?? true,
        manualSteps: editingApp.manualSteps || [],
        appFile: null
      });
      setUploadMode(editingApp.downloadUrl || !megaUploadAvailable ? 'url' : 'file');
      setExternalUrl(editingApp.downloadUrl || '');
      setUploadedFileUrl('');
      setUploadStatus('idle');
      setUploadError('');
      setUploadProgress(0);
      setUploadedBytes(0);
      setTotalBytes(0);
      setIconProgress(0);
      setPreviewProgress(0);
      setFileProgress(0);
    } else {
      // Reset ALL fields for new app
      setForm({
        name: '', shortDesc: '', longDesc: '', version: '1.0.0',
        category: 'Utility', platform: [], icon: '', iconPublicId: '',
        previewImages: [], fileData: null, fileHandle: null, downloadUrl: '',
        fileName: '', fileSize: '', showLikes: true, showComments: true,
        published: true, manualSteps: [], appFile: null
      });
      setExternalUrl('');
      setUploadedFileUrl('');
      setUploadStatus('idle');
      setUploadError('');
      setUploadProgress(0);
      setUploadedBytes(0);
      setTotalBytes(0);
      setIconProgress(0);
      setPreviewProgress(0);
      setFileProgress(0);
    }
  }, [editingApp, isOpen]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleIconUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    try {
      setIconUploading(true);
      setIconProgress(15);
      const result = await uploadImage(file, 'mrjk-mart/icons');
      setForm(prev => ({
        ...prev,
        icon: result.url,
        iconPublicId: result.publicId,
      }));
      setIconProgress(100);
      toast.success('Icon uploaded');
    } catch (err) {
      setIconProgress(0);
      toast.error(`Icon upload failed: ${err.message}`);
    } finally {
      setIconUploading(false);
    }
  };

  const handlePreviewUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    e.target.value = '';

    const availableSlots = Math.max(0, 10 - form.previewImages.length);
    const nextFiles = files.slice(0, availableSlots);

    if (!nextFiles.length) {
      toast.info('Maximum 10 preview images allowed');
      return;
    }

    try {
      setPreviewUploading(true);
      setPreviewProgress(5);
      const results = await uploadMultipleImages(
        nextFiles,
        'mrjk-mart/previews',
        (index, total) => {
          setPreviewProgress(Math.round(((index + 1) / total) * 100));
        }
      );
      setForm(prev => ({
        ...prev,
        previewImages: [
          ...prev.previewImages,
          ...results.map(result => ({ url: result.url, publicId: result.publicId })),
        ].slice(0, 10),
      }));
      setPreviewProgress(100);
      toast.success('Preview images uploaded');
    } catch (err) {
      setPreviewProgress(0);
      toast.error(`Preview upload failed: ${err.message}`);
    } finally {
      setPreviewUploading(false);
    }
  };

  const removePreview = (index) => {
    setForm(prev => ({
      ...prev,
      previewImages: prev.previewImages.filter((_, i) => i !== index),
    }));
  };





  // Manual Steps
  const [showStepForm, setShowStepForm] = useState(false);
  const [stepForm, setStepForm] = useState({ title: '', desc: '', imageBase64: '', videoUrl: '' });
  const [editingStepIndex, setEditingStepIndex] = useState(null);

  const handleAddStep = () => {
    if (!stepForm.title) return;
    const newStep = {
      id: Date.now().toString(),
      ...stepForm,
      order: editingStepIndex !== null ? form.manualSteps[editingStepIndex].order : form.manualSteps.length,
    };

    if (editingStepIndex !== null) {
      const updated = [...form.manualSteps];
      updated[editingStepIndex] = { ...updated[editingStepIndex], ...stepForm };
      handleChange('manualSteps', updated);
      setEditingStepIndex(null);
    } else {
      handleChange('manualSteps', [...form.manualSteps, newStep]);
    }
    setStepForm({ title: '', desc: '', imageBase64: '', videoUrl: '' });
    setShowStepForm(false);
  };

  const removeStep = (index) => {
    handleChange('manualSteps', form.manualSteps.filter((_, i) => i !== index));
  };

  const handleFileSelect = (file) => {
    setForm(prev => ({ ...prev, appFile: file }));
    setUploadStatus('idle');
    setUploadError('');
    setUploadedFileUrl('');
    setUploadProgress(0);
    setUploadedBytes(0);
    setTotalBytes(0);
    // Auto-fill filename and size
    handleChange('fileName', file.name);
    handleChange('fileSize', formatFileSize(file.size));
  };


  const uploadAppFileIfNeeded = async () => {
    if (uploadMode === 'url') {
      return externalUrl.trim() || null;
    }

    if (uploadStatus === 'done') {
      return uploadedFileUrl;
    }

    if (uploadMode === 'file' && !megaUploadAvailable) {
      throw new Error('Direct MEGA upload is unavailable on the live site. Use Paste URL with a MEGA share link.');
    }

    if (uploadMode === 'file' && form.appFile) {
      setUploadStatus('preparing');
      setUploadError('');
      setUploadProgress(0);
      setUploadedBytes(0);
      setTotalBytes(form.appFile.size);
      try {
        setPublishStep('Connecting to MEGA...');

        const result = await uploadToMega(
          form.appFile,
          (percent, loaded, total) => {
            setUploadStatus('uploading');
            setUploadProgress(percent);
            setUploadedBytes(loaded);
            setTotalBytes(total || form.appFile.size);
            setFileProgress(percent);

            if (percent < 20) {
              setPublishStep('Reading file...');
            } else if (percent < 95) {
              setPublishStep(`Uploading to MEGA... ${percent}%`);
            } else if (percent < 100) {
              setPublishStep('Generating secure link...');
            } else {
              setPublishStep('Upload complete!');
            }
          }
        );
        setUploadedFileUrl(result.url);
        setUploadStatus('done');
        setPublishStep('');
        if (!form.fileName) {
          handleChange('fileName', result.name);
        }
        if (!form.fileSize) {
          handleChange('fileSize', formatFileSize(result.size));
        }
        return result.url;
      } catch (err) {
        setUploadStatus('error');
        setUploadProgress(0);
        setFileProgress(0);
        setUploadError(err.message || 'Upload failed');
        setPublishStep('');
        throw new Error(`Upload failed: ${err.message}`);
      }
    }

    return null;
  };

  const editStep = (index) => {
    const step = form.manualSteps[index];
    setStepForm({ title: step.title, desc: step.desc, imageBase64: step.imageBase64 || '', videoUrl: step.videoUrl || '' });
    setEditingStepIndex(index);
    setShowStepForm(true);
  };

  const handleStepImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setStepForm(prev => ({ ...prev, imageBase64: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    const { 
      name: formName, 
      shortDesc: formShortDesc, 
      longDesc: formLongDesc, 
      version: formVersion, 
      category: formCategory, 
      platform: selectedPlatforms, 
      showLikes, 
      showComments, 
      published: isPublished, 
      manualSteps, 
      appFile,
      fileName: formFileName,
      fileSize: formFileSize
    } = form;

    if (!formName.trim()) {
      toast.error('App name required');
      return;
    }

    // Validate
    if (uploadMode === 'url' && !externalUrl.trim()) {
      toast.error('Please provide a download URL');
      return;
    }
    if (uploadMode === 'file' && !megaUploadAvailable) {
      setUploadMode('url');
      toast.error('Direct MEGA upload is unavailable on the live site. Use Paste URL with a MEGA share link.');
      return;
    }
    if (uploadMode === 'file' && !appFile && uploadStatus !== 'done') {
      toast.error('Please select a file to upload');
      return;
    }

    setPublishing(true);

    try {
      // Upload app file first if needed
      setPublishStep('Handling app file...');
      const downloadUrl = await uploadAppFileIfNeeded();
      
      if (!downloadUrl) {
        toast.error('Missing download source');
        setPublishing(false);
        return;
      }

      setPublishStep('Saving to database...');
      const iconUrl = form.icon || editingApp?.iconUrl || editingApp?.icon || null;
      const previewUrls = form.previewImages
        .map((preview) => preview?.url || preview)
        .filter(Boolean);

      const appData = {
        name:         formName.trim(),
        shortDesc:    formShortDesc.trim(),
        longDesc:     formLongDesc.trim(),
        version:      formVersion || '1.0.0',
        category:     formCategory,
        platform:     selectedPlatforms,
        iconUrl,
        icon:         iconUrl,
        iconPublicId: form.iconPublicId || editingApp?.iconPublicId || null,
        previewUrls,
        previewImages: previewUrls,
        downloadUrl,
        fileName:     formFileName?.trim() || null,
        fileSize:     formFileSize || null,
        showLikes:    showLikes,
        showComments: showComments,
        published:    isPublished,
        manualSteps:  manualSteps,
      };

      if (editingApp && editingApp.id) {
        // UPDATE existing — do NOT create new
        await updateFirebaseApp(editingApp.id, appData);
        toast.success('App updated! ✅');
      } else {
        // CREATE new
        await createApp(appData);
        toast.success('App published! 🚀');
      }

      if (onRefresh) {
        await onRefresh();
      }

      onClose();
    } catch (err) {
      console.error('Publish error:', err);
      toast.error(`Failed: ${err.message}`);
    } finally {
      setPublishing(false);
      setPublishStep('');
    }
  };

  return (
    <GlassModal isOpen={isOpen} onClose={onClose} title={editingApp ? 'Edit App' : 'Add New App'} maxWidth="600px">
      <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
        {/* Basic Info */}
        <div>
          <label className="block text-xs font-medium opacity-60 mb-1">App Name *</label>
          <input value={form.name} onChange={e => handleChange('name', e.target.value)} className="glass-input" placeholder="My Awesome App" />
        </div>

        <div>
          <label className="block text-xs font-medium opacity-60 mb-1">Short Description *</label>
          <input value={form.shortDesc} onChange={e => handleChange('shortDesc', e.target.value.slice(0, 100))} className="glass-input" placeholder="Brief description (100 chars max)" />
          <span className="text-xs opacity-40 mt-1">{form.shortDesc.length}/100</span>
        </div>

        <div>
          <label className="block text-xs font-medium opacity-60 mb-1">Long Description</label>
          <textarea value={form.longDesc} onChange={e => handleChange('longDesc', e.target.value)} className="glass-input" rows={4} placeholder="Detailed description (supports markdown)" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium opacity-60 mb-1">Version</label>
            <input value={form.version} onChange={e => handleChange('version', e.target.value)} className="glass-input" placeholder="1.0.0" />
          </div>
          <div>
            <label className="block text-xs font-medium opacity-60 mb-1">Category</label>
            <select value={form.category} onChange={e => handleChange('category', e.target.value)} className="glass-input">
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Platform Tags */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: '10px',
            fontSize: '14px',
            color: 'rgba(255,255,255,0.7)',
            fontWeight: '500'
          }}>
            Platforms
          </label>
          
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
          }}>
            {PLATFORMS.map(({ id, label, icon }) => {
              // Be flexible for old apps that might have saved 'Windows' vs 'windows'
              const isSelected = form.platform.includes(id) || form.platform.includes(label);
              
              const toggleSelected = () => {
                setForm(prev => {
                  const hasIt = prev.platform.includes(id) || prev.platform.includes(label);
                  return {
                    ...prev,
                    platform: hasIt
                      ? prev.platform.filter(x => x !== id && x !== label)
                      : [...prev.platform, id]
                  };
                });
              };

              return (
                <button
                  key={id}
                  type="button"
                  onClick={toggleSelected}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '999px',
                    border: isSelected
                      ? '2px solid #7c3aed'
                      : '1px solid rgba(255,255,255,0.2)',
                    background: isSelected
                      ? 'linear-gradient(135deg, rgba(124,58,237,0.35), rgba(6,182,212,0.25))'
                      : 'rgba(255,255,255,0.06)',
                    color: isSelected ? '#e2e8f0' : 'rgba(255,255,255,0.5)',
                    fontSize: '14px',
                    fontWeight: isSelected ? '600' : '400',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    backdropFilter: 'blur(8px)',
                    transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                    boxShadow: isSelected
                      ? '0 0 12px rgba(124,58,237,0.4)'
                      : 'none',
                  }}
                >
                  <span style={{ fontSize: '16px' }}>{icon}</span>
                  {label}
                  {isSelected && (
                    <span style={{
                      marginLeft: '2px',
                      fontSize: '12px',
                      color: '#06b6d4'
                    }}>✓</span>
                  )}
                </button>
              );
            })}
          </div>

          {form.platform.length > 0 && (
            <p style={{
              marginTop: '8px',
              fontSize: '12px',
              color: 'rgba(124,58,237,0.8)'
            }}>
              ✅ Selected: {form.platform.join(', ')}
            </p>
          )}
        </div>

        {/* Icon */}
        <div>
          <label className="block text-xs font-medium opacity-60 mb-2">App Icon</label>
          <div className="flex items-center gap-4">
            <div 
              onClick={() => iconInputRef.current?.click()}
              className="cursor-pointer"
            >
              {form.icon ? (
                <div className="relative">
                  <img src={form.icon} alt="Icon" className="w-20 h-20 rounded-2xl object-cover" />
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setForm(prev => ({ ...prev, icon: '', iconPublicId: '' }));
                    }} 
                    className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500 text-white"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-2xl glass flex items-center justify-center hover:bg-white/10 transition-colors">
                  {iconUploading ? (
                    <span className="text-[11px] opacity-70">Uploading...</span>
                  ) : (
                    <>
                      <Upload size={24} className="opacity-40" />
                      <span className="sr-only">Upload Icon</span>
                    </>
                  )}
                </div>
              )}
            </div>
            <input
              ref={iconInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleIconUpload}
            />
            {iconUploading && (
              <span className="text-xs opacity-60">{iconProgress}%</span>
            )}
          </div>
        </div>

        {/* Preview Images */}
        <div>
          <label className="block text-xs font-medium opacity-60 mb-2">Preview Images ({form.previewImages.length}/10)</label>
          <div className="flex gap-2 flex-wrap">
            {form.previewImages.map((img, i) => (
              <div key={i} className="relative">
                <img src={img.url || img} alt={`Preview ${i}`} className="w-20 h-20 rounded-xl object-cover" />
                <button onClick={() => removePreview(i)} className="absolute -top-1 -right-1 p-0.5 rounded-full bg-red-500 text-white">
                  <X size={10} />
                </button>
              </div>
            ))}
            {form.previewImages.length < 10 && (
              <>
                <button 
                  type="button"
                  onClick={() => previewInputRef.current?.click()}
                  className="w-20 h-20 rounded-xl glass flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition-colors"
                >
                  <Plus size={20} className="opacity-40" />
                  <span className="text-[10px] opacity-60 mt-1">
                    {previewUploading ? `${previewProgress}%` : 'Add Preview'}
                  </span>
                </button>
                <input
                  ref={previewInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handlePreviewUpload}
                />
              </>
            )}
          </div>
        </div>

        <div style={{
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '16px',
          overflow: 'hidden',
          background: 'rgba(255,255,255,0.03)',
        }}>
          
          {/* Tab switcher */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}>
            {[
              { id: 'file', label: '📁 Upload File' },
              { id: 'url',  label: '🔗 Paste URL' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setUploadMode(tab.id)}
                style={{
                  padding: '14px',
                  border: 'none',
                  background: uploadMode === tab.id
                    ? 'rgba(124,58,237,0.25)'
                    : 'transparent',
                  color: uploadMode === tab.id
                    ? '#a78bfa'
                    : 'rgba(255,255,255,0.4)',
                  fontSize: '14px',
                  fontWeight: uploadMode === tab.id ? '600' : '400',
                  cursor: 'pointer',
                  borderBottom: uploadMode === tab.id
                    ? '2px solid #7c3aed'
                    : '2px solid transparent',
                  transition: 'all 0.2s ease',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ padding: '20px' }}>
            
            {/* FILE UPLOAD TAB */}
            {uploadMode === 'file' && (
              <div>
                <p style={{
                  margin: '0 0 12px',
                  color: megaUploadAvailable
                    ? 'rgba(52,211,153,0.82)'
                    : 'rgba(251,191,36,0.9)',
                  fontSize: '12px',
                  fontWeight: 600,
                }}>
                  {megaUploadAvailable
                    ? 'MEGA cloud upload'
                    : 'Direct MEGA upload unavailable on GitHub Pages'}
                </p>

                {!megaUploadAvailable && (
                  <div style={{
                    padding: '12px 16px',
                    marginBottom: '12px',
                    background: 'rgba(251,191,36,0.1)',
                    border: '1px solid rgba(251,191,36,0.25)',
                    borderRadius: '12px',
                    color: '#fcd34d',
                    fontSize: '13px',
                    lineHeight: 1.5,
                  }}>
                    This site is a public static deployment, so browser-side MEGA credentials cannot be bundled safely.
                    Use <strong>Paste URL</strong> with a MEGA share link for live uploads.
                    <button
                      type="button"
                      onClick={() => setUploadMode('url')}
                      style={{
                        display: 'block',
                        marginTop: '10px',
                        background: 'rgba(251,191,36,0.18)',
                        border: '1px solid rgba(251,191,36,0.25)',
                        borderRadius: '8px',
                        color: '#fde68a',
                        padding: '6px 12px',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      Switch to Paste URL
                    </button>
                  </div>
                )}
                
                {/* Drop zone */}
                {uploadStatus === 'idle' && !form.appFile && megaUploadAvailable && (
                  <label style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    padding: '40px 20px',
                    border: '2px dashed rgba(124,58,237,0.4)',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    background: 'rgba(124,58,237,0.05)',
                    transition: 'all 0.2s',
                  }}
                  onDragOver={e => {
                    e.preventDefault();
                    e.currentTarget.style.borderColor = '#7c3aed';
                    e.currentTarget.style.background = 
                      'rgba(124,58,237,0.12)';
                  }}
                  onDragLeave={e => {
                    e.currentTarget.style.borderColor = 
                      'rgba(124,58,237,0.4)';
                    e.currentTarget.style.background = 
                      'rgba(124,58,237,0.05)';
                  }}
                  onDrop={e => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file) handleFileSelect(file);
                  }}
                  >
                    <div style={{ fontSize: '48px' }}>📦</div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ 
                        color: 'white', 
                        fontSize: '15px',
                        fontWeight: '500',
                        margin: '0 0 4px' 
                      }}>
                        Drop your app file here
                      </p>
                      <p style={{ 
                        color: 'rgba(255,255,255,0.4)', 
                        fontSize: '13px',
                        margin: 0
                      }}>
                        Any size • APK, EXE, ZIP, any format
                      </p>
                    </div>
                    <span style={{
                      padding: '8px 20px',
                      borderRadius: '8px',
                      background: 'rgba(124,58,237,0.3)',
                      color: '#a78bfa',
                      fontSize: '13px',
                      border: '1px solid rgba(124,58,237,0.4)',
                    }}>
                      Browse Files
                    </span>
                    <span style={{
                      color: '#fde68a',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}>
                      ⚡ MEGA Cloud • 20GB Free • No size limit
                    </span>
                    <input
                      type="file"
                      style={{ display: 'none' }}
                      accept="*/*"
                      onChange={e => {
                        if (e.target.files[0]) {
                          handleFileSelect(e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                )}

                {/* File selected — show info */}
                {form.appFile && uploadStatus === 'idle' && megaUploadAvailable && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}>
                    <div style={{ fontSize: '32px' }}>📦</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ 
                        color: 'white', 
                        fontSize: '14px',
                        fontWeight: '500',
                        margin: '0 0 2px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {form.appFile.name}
                      </p>
                      <p style={{ 
                        color: 'rgba(255,255,255,0.5)', 
                        fontSize: '12px',
                        margin: 0 
                      }}>
                        {formatFileSize(form.appFile.size)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setForm(p => ({ ...p, appFile: null }));
                        setUploadStatus('idle');
                        setUploadError('');
                        setUploadProgress(0);
                      }}
                      style={{
                        background: 'rgba(248,113,113,0.15)',
                        border: '1px solid rgba(248,113,113,0.3)',
                        borderRadius: '8px',
                        color: '#f87171',
                        padding: '6px 12px',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      ✕ Remove
                    </button>
                  </div>
                )}

                {/* Uploading state — progress bar */}
                {(uploadStatus === 'preparing' || uploadStatus === 'uploading') && (
                  <div style={{ padding: '8px 0' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '8px',
                    }}>
                      <span style={{ 
                        color: 'rgba(255,255,255,0.7)', 
                        fontSize: '13px' 
                      }}>
                        {uploadStatus === 'preparing'
                          ? '📖 Reading file...'
                          : uploadProgress >= 95
                            ? '🔗 Generating secure link...'
                            : `☁️ Uploading to MEGA... ${uploadProgress}%`}
                      </span>
                      <span style={{ 
                        color: '#a78bfa', 
                        fontSize: '13px',
                        fontWeight: '600',
                      }}>
                        {uploadStatus === 'preparing' ? '...' : `${uploadProgress}%`}
                      </span>
                    </div>
                    
                    {/* Progress bar */}
                    <div style={{
                      height: '8px',
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: '999px',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${uploadStatus === 'preparing' ? 8 : uploadProgress}%`,
                        background: 
                          'linear-gradient(90deg, #7c3aed, #06b6d4)',
                        borderRadius: '999px',
                        transition: 'width 0.3s ease',
                      }} />
                    </div>
                    
                    {/* Bytes transferred */}
                    <p style={{ 
                      color: 'rgba(255,255,255,0.4)',
                      fontSize: '12px',
                      marginTop: '6px',
                      textAlign: 'right',
                    }}>
                      {uploadStatus === 'preparing'
                        ? `Preparing upload / ${formatFileSize(totalBytes || form.appFile?.size)}`
                        : `${formatFileSize(uploadedBytes)} / ${formatFileSize(totalBytes || form.appFile?.size)}`}
                    </p>
                  </div>
                )}

                {/* Upload done */}
                {uploadStatus === 'done' && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 16px',
                    background: 'rgba(52,211,153,0.1)',
                    border: '1px solid rgba(52,211,153,0.3)',
                    borderRadius: '12px',
                  }}>
                    <span style={{ fontSize: '20px' }}>✅</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ 
                        color: '#34d399', 
                        fontSize: '13px',
                        fontWeight: '600',
                        margin: '0 0 2px',
                      }}>
                        ✅ Upload complete!
                      </p>
                      <p style={{ 
                        color: 'rgba(255,255,255,0.4)',
                        fontSize: '11px',
                        margin: 0,
                        wordBreak: 'break-all',
                      }}>
                        {uploadedFileUrl}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setForm(p => ({ ...p, appFile: null }));
                        setUploadStatus('idle');
                        setUploadError('');
                        setUploadedFileUrl('');
                        setUploadProgress(0);
                      }}
                      style={{
                        background: 'transparent',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '8px',
                        color: 'rgba(255,255,255,0.5)',
                        padding: '4px 10px',
                        fontSize: '11px',
                        cursor: 'pointer',
                      }}
                    >
                      Change
                    </button>
                  </div>
                )}

                {/* Upload error */}
                {uploadStatus === 'error' && (
                  <div style={{
                    padding: '12px 16px',
                    background: 'rgba(248,113,113,0.1)',
                    border: '1px solid rgba(248,113,113,0.3)',
                    borderRadius: '12px',
                    color: '#f87171',
                    fontSize: '13px',
                  }}>
                    ❌ {uploadError || 'MEGA upload failed. Check your MEGA email, password, and network connection.'}
                    <button
                      type="button"
                      onClick={() => {
                        setUploadStatus('idle');
                        setUploadError('');
                      }}
                      style={{
                        display: 'block',
                        marginTop: '8px',
                        background: 'rgba(248,113,113,0.2)',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#f87171',
                        padding: '4px 12px',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* URL TAB */}
            {uploadMode === 'url' && (
              <div>
                <input
                  type="url"
                  placeholder="https://mega.nz/file/your-shared-file"
                  value={externalUrl}
                  onChange={e => setExternalUrl(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: externalUrl.startsWith('https://')
                      ? '1px solid #7c3aed'
                      : '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(255,255,255,0.06)',
                    color: 'white',
                    fontSize: '14px',
                    marginBottom: '12px',
                    boxSizing: 'border-box',
                  }}
                />
                
                {externalUrl && (
                  <p style={{
                    fontSize: '12px',
                    color: externalUrl.startsWith('https://')
                      ? '#34d399' : '#f87171',
                    marginBottom: '12px',
                  }}>
                    {externalUrl.startsWith('https://')
                      ? '✅ Valid URL' : '⚠️ Must start with https://'}
                  </p>
                )}

                <div style={{
                  background: 'rgba(124,58,237,0.08)',
                  border: '1px solid rgba(124,58,237,0.2)',
                  borderRadius: '10px',
                  padding: '12px',
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.5)',
                }}>
                  <p style={{ 
                    color: '#a78bfa', 
                    fontWeight: '600',
                    marginBottom: '8px',
                    fontSize: '13px',
                  }}>
                    📌 Share-link workflow:
                  </p>
                  ☁️ MEGA → Upload file in MEGA → Copy public share link → Paste it here<br/>
                  ☁️ Google Drive → Upload → Share → Anyone with link<br/>
                  📁 MediaFire → mediafire.com → Upload → Direct link<br/>
                  🔥 Mega.nz → mega.nz → Upload → Get link
                </div>
              </div>
            )}

            {/* File name + size fields */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
              marginTop: '14px',
            }}>
              <input
                type="text"
                placeholder="File name (e.g. MyApp.exe)"
                value={form.fileName}
                onChange={e => handleChange('fileName', e.target.value)}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'white',
                  fontSize: '13px',
                }}
              />
              <input
                type="text"
                placeholder="Size (e.g. 45 MB)"
                value={form.fileSize}
                onChange={e => handleChange('fileSize', e.target.value)}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'white',
                  fontSize: '13px',
                }}
              />
            </div>
          </div>
        </div>

        {/* Visibility Toggles */}
        <div className="space-y-3 mt-8 pt-6 border-t border-white/10">
          <label className="block text-xs font-medium opacity-60 mb-3">Visibility</label>
          <ToggleRow label="Show like count" value={form.showLikes} onChange={v => handleChange('showLikes', v)} />
          <ToggleRow label="Show comment count" value={form.showComments} onChange={v => handleChange('showComments', v)} />
          <ToggleRow label="Published" value={form.published} onChange={v => handleChange('published', v)} />
        </div>

        {/* Manual Steps */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-medium opacity-60">User Manual Steps</label>
            <button onClick={() => { setShowStepForm(true); setEditingStepIndex(null); setStepForm({ title: '', desc: '', imageBase64: '', videoUrl: '' }); }} className="glass-pill text-xs gap-1 font-semibold hover:bg-white/10">
              <Plus size={14} /> Add Step
            </button>
          </div>
          <div className="space-y-2">
            {form.manualSteps.map((step, i) => (
              <div key={step.id || i} className="glass p-3 rounded-xl flex items-center gap-3 shadow-sm bg-white/5" style={{ borderRadius: 12 }}>
                <GripVertical size={14} className="opacity-30 cursor-move" />
                <span className="w-6 h-6 rounded-full gradient-bg flex items-center justify-center text-white text-xs font-bold">{i + 1}</span>
                <span className="flex-1 text-sm truncate font-medium">{step.title}</span>
                <button onClick={() => editStep(i)} className="p-1.5 hover:bg-white/10 rounded transition-colors"><Image size={14} /></button>
                <button onClick={() => removeStep(i)} className="p-1.5 hover:bg-red-500/20 rounded text-red-400 transition-colors"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>

          {showStepForm && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 glass p-5 rounded-xl space-y-4 border border-white/10">
              <input value={stepForm.title} onChange={e => setStepForm(p => ({ ...p, title: e.target.value }))} className="glass-input font-medium" placeholder="Step title" />
              <textarea value={stepForm.desc} onChange={e => setStepForm(p => ({ ...p, desc: e.target.value }))} className="glass-input" rows={3} placeholder="Step description" />
              <div className="flex gap-2">
                <label className="glass-pill text-xs cursor-pointer gap-2 font-medium hover:bg-white/10 transition-colors">
                  <Image size={14} /> Upload Image
                  <input type="file" accept="image/*" onChange={handleStepImageUpload} className="hidden" />
                </label>
                <input value={stepForm.videoUrl} onChange={e => setStepForm(p => ({ ...p, videoUrl: e.target.value }))} className="glass-input text-xs flex-1" placeholder="YouTube URL (optional)" />
              </div>
              {stepForm.imageBase64 && <img src={stepForm.imageBase64} alt="Step" className="w-full h-40 rounded-lg object-cover shadow-inner" />}
              <div className="flex gap-2 pt-2">
                <GlassButton onClick={handleAddStep} className="text-sm flex items-center gap-1.5 px-5">
                  <Save size={14} /> {editingStepIndex !== null ? 'Update Step' : 'Add Step'}
                </GlassButton>
                <GlassButton variant="glass" onClick={() => { setShowStepForm(false); setEditingStepIndex(null); }} className="text-sm px-4">Cancel</GlassButton>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <GlassButton onClick={handleSubmit} disabled={publishing} className="w-full mt-6 py-3.5 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl font-bold">
        {publishing ? (
          <div className="flex flex-col items-center gap-1 w-full relative">
            <span className="text-xs">{publishStep}</span>
            <div className="w-full bg-black/20 h-1.5 rounded-full overflow-hidden mt-1">
              <div 
                className="h-full gradient-bg transition-all duration-300" 
                style={{ width: `${Math.max(iconProgress, fileProgress, previewProgress)}%` }} 
              />
            </div>
          </div>
        ) : (
          <>{editingApp ? 'Update App' : 'Publish App'} 🚀</>
        )}
      </GlassButton>
    </GlassModal>
  );
}

function ToggleRow({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer" onClick={() => onChange(!value)}>
      <span className="text-sm font-medium">{label}</span>
      <button
        type="button"
        className={`w-12 h-6 rounded-full relative transition-colors shadow-inner ${value ? 'gradient-bg' : 'bg-gray-600'}`}
      >
        <motion.div
          className="w-5 h-5 rounded-full bg-white absolute top-0.5 shadow-sm"
          animate={{ left: value ? 26 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  );
}

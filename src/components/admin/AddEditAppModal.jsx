import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Plus, Link as LinkIcon, GripVertical, Image, Video, Trash2, Save, CheckCircle2 } from 'lucide-react';
import GlassModal from '../ui/GlassModal';
import GlassButton from '../ui/GlassButton';
import useAppStore from '../../store/useAppStore';
import useToastStore from '../../store/useToastStore';
import { uploadFileWithProgress, createApp, updateApp } from '../../firebase/appService';

const categories = ['Utility', 'Productivity', 'Tool', 'Game', 'Other'];
const PLATFORMS = [
  { id: 'windows', label: 'Windows', icon: '🪟' },
  { id: 'mac',     label: 'Mac',     icon: '🍎' },
  { id: 'linux',   label: 'Linux',   icon: '🐧' },
  { id: 'android', label: 'Android', icon: '🤖' },
  { id: 'ios',     label: 'iOS',     icon: '📱' },
  { id: 'web',     label: 'Web',     icon: '🌐' },
];

export default function AddEditAppModal({ isOpen, onClose, editApp = null }) {
  const addApp = useAppStore(s => s.addApp);
  const updateApp = useAppStore(s => s.updateApp);
  const toast = useToastStore();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: '', shortDesc: '', longDesc: '', version: '1.0.0',
    category: 'Utility', platform: [], icon: '',
    previewImages: [], fileData: null, fileHandle: null, downloadUrl: '',
    fileName: '', fileSize: '', showLikes: true, showComments: true,
    published: true, manualSteps: [],
    iconFile: null, appFile: null
  });

  const [publishing, setPublishing] = useState(false);
  const [publishStep, setPublishStep] = useState('');
  const [iconProgress, setIconProgress] = useState(0);
  const [previewProgress, setPreviewProgress] = useState(0);
  const [fileProgress, setFileProgress] = useState(0);

  const [uploadProgress, setUploadProgress] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('idle');
  const [fileTier, setFileTier] = useState(0);
  const urlInputRef = useRef(null);

  useEffect(() => {
    if (editApp) {
      setForm({
        name: editApp.name || '',
        shortDesc: editApp.shortDesc || '',
        longDesc: editApp.longDesc || '',
        version: editApp.version || '1.0.0',
        category: editApp.category || 'Utility',
        platform: editApp.platform || [],
        icon: editApp.icon || '',
        previewImages: editApp.previewImages || [],
        fileData: editApp.fileData || null,
        fileHandle: editApp.fileHandle || null,
        downloadUrl: editApp.downloadUrl || '',
        fileName: editApp.fileName || '',
        fileSize: editApp.fileSize || '',
        showLikes: editApp.showLikes !== false,
        showComments: editApp.showComments !== false,
        published: editApp.published !== false,
        manualSteps: editApp.manualSteps || [],
        iconFile: null, appFile: null
      });
      let initialTier = 0;
      if (editApp.downloadUrl) initialTier = 3;
      if (editApp.storagePath) initialTier = 1;
      setFileTier(initialTier);
    } else {
      setForm({
        name: '', shortDesc: '', longDesc: '', version: '1.0.0',
        category: 'Utility', platform: [], icon: '',
        previewImages: [], fileData: null, fileHandle: null, downloadUrl: '',
        fileName: '', fileSize: '', showLikes: true, showComments: true,
        published: true, manualSteps: [],
        iconFile: null, appFile: null
      });
      setFileTier(0);
    }
    setUploadProgress(null);
    setUploadStatus('idle');
  }, [editApp, isOpen]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleIconUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm(prev => ({ ...prev, iconFile: file }));
    const reader = new FileReader();
    reader.onload = () => handleChange('icon', reader.result);
    reader.readAsDataURL(file);
  };

  const handlePreviewUpload = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setForm(prev => ({
          ...prev,
          previewImages: [...prev.previewImages, { url: reader.result, file }].slice(0, 10),
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removePreview = (index) => {
    setForm(prev => ({
      ...prev,
      previewImages: prev.previewImages.filter((_, i) => i !== index),
    }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    handleChange('fileName', file.name);
    handleChange('fileSize', formatFileSize(file.size));
    
    // Tier 3: > 500MB
    if (file.size > 500 * 1024 * 1024) {
      setFileTier(3);
      setForm(p => ({ ...p, appFile: null, fileData: null }));
      setTimeout(() => urlInputRef.current?.focus(), 100);
      return;
    }
    
    setFileTier(1);
    setForm(p => ({ ...p, appFile: file, fileData: true }));
  };

  const removeFile = () => {
    setForm(prev => ({ ...prev, fileData: null, appFile: null, fileName: '', fileSize: '' }));
    setFileTier(0);
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
    const { name: formName, shortDesc: formShortDesc, longDesc: formLongDesc, version: formVersion, category: formCategory, platform: selectedPlatforms, showLikes, showComments, published: isPublished, manualSteps, iconFile, appFile, downloadUrl: externalUrl } = form;

    if (!formName.trim()) {
      toast.error('App name required'); 
      return;
    }
    setPublishing(true);
    const ts = Date.now();

    try {
      let iconUrl = editApp?.iconUrl || form.icon || null;
      let iconPath = editApp?.iconPath || null;
      let fileUrl = externalUrl?.trim() || null;
      let filePath = editApp?.filePath || null;
      let previewUrls = [];
      let previewPaths = [];

      if (iconFile instanceof File) {
        setPublishStep('Uploading icon...');
        const r = await uploadFileWithProgress(
          iconFile,
          `apps/${ts}/icon/${iconFile.name}`,
          p => setIconProgress(p)
        );
        iconUrl = r.url; iconPath = r.path;
      }

      for (let i = 0; i < form.previewImages.length; i++) {
        setPublishStep(`Uploading preview ${i+1}...`);
        const img = form.previewImages[i];
        if (img.file instanceof File) {
          const r = await uploadFileWithProgress(
            img.file,
            `apps/${ts}/previews/${i}_${img.file.name}`,
            p => setPreviewProgress(p)
          );
          previewUrls.push(r.url);
          previewPaths.push(r.path);
        } else {
          // It's a URL or base64 string from existing
          previewUrls.push(img.url || img);
          if (editApp?.previewPaths?.[i]) previewPaths.push(editApp.previewPaths[i]);
        }
      }

      if (appFile instanceof File && !externalUrl) {
        setPublishStep(`Uploading ${appFile.name}...`);
        const r = await uploadFileWithProgress(
          appFile,
          `apps/${ts}/file/${appFile.name}`,
          p => setFileProgress(p)
        );
        fileUrl = r.url; filePath = r.path;
      }

      setPublishStep('Saving to database...');
      const appData = {
        name:         formName.trim(),
        shortDesc:    formShortDesc.trim(),
        longDesc:     formLongDesc.trim(),
        version:      formVersion || '1.0.0',
        category:     formCategory,
        platform:     selectedPlatforms,
        iconUrl,      iconPath,
        previewUrls,  previewPaths,
        downloadUrl:  fileUrl,
        filePath,
        fileName:     appFile?.name || editApp?.fileName || null,
        fileSize:     appFile?.size || editApp?.fileSize || null,
        showLikes:    showLikes,
        showComments: showComments,
        published:    isPublished,
        manualSteps:  manualSteps,
      };

      if (editApp?.id) {
        await updateApp(editApp.id, appData);
        toast.success('App updated! ✅');
      } else {
        await createApp(appData);
        toast.success('App published! 🚀');
      }

      onClose();
    } catch (err) {
      console.error(err);
      toast.error(`Error: ${err.message}`);
    } finally {
      setPublishing(false);
      setPublishStep('');
    }
  };

  return (
    <GlassModal isOpen={isOpen} onClose={onClose} title={editApp ? 'Edit App' : 'Add New App'} maxWidth="600px">
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
            {form.icon ? (
              <div className="relative">
                <img src={form.icon} alt="Icon" className="w-20 h-20 rounded-2xl object-cover" />
                <button onClick={() => handleChange('icon', '')} className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500 text-white">
                  <X size={12} />
                </button>
              </div>
            ) : (
              <label className="w-20 h-20 rounded-2xl glass flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors">
                <Upload size={24} className="opacity-40" />
                <input type="file" accept="image/*" onChange={handleIconUpload} className="hidden" />
              </label>
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
              <label className="w-20 h-20 rounded-xl glass flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors">
                <Plus size={20} className="opacity-40" />
                <input type="file" accept="image/*" multiple onChange={handlePreviewUpload} className="hidden" />
              </label>
            )}
          </div>
        </div>

        {/* Tiered App File UI */}
        <div className="mt-6 border-t border-white/10 pt-6">
          <label className="block text-xs font-medium opacity-60 mb-2">App File</label>
          {form.fileData || form.fileHandle || form.fileName ? (
            <div className="glass p-4 rounded-xl relative overflow-hidden flex flex-col gap-2 shadow-inner bg-black/20" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              <div className="flex items-center justify-between z-10 w-full relative">
                 <div className="flex items-center gap-3">
                    <span className="text-3xl opacity-80">📦</span>
                    <div className="max-w-[180px] sm:max-w-[300px]">
                      <div className="text-sm font-semibold truncate">{form.fileName}</div>
                      <div className="text-xs opacity-60">Size: {form.fileSize}</div>
                    </div>
                 </div>
                 <button onClick={removeFile} className="hover:bg-red-500/20 text-red-400 p-2 rounded-lg transition-colors absolute right-0 top-0">
                   <X size={16} />
                 </button>
              </div>

              {/* Status Badge */}
              <div className="mt-2 z-10 flex flex-wrap gap-2">
                {fileTier === 1 && <span className="glass-pill bg-green-500/20 text-green-300 text-[10px] font-bold tracking-wide uppercase px-3">Stored locally</span>}
                {fileTier === 2 && <span className="glass-pill bg-yellow-500/20 text-yellow-300 text-[10px] font-bold tracking-wide uppercase px-3">Large file — use URL recommended</span>}
                {fileTier === 3 && <span className="glass-pill bg-red-500/20 text-red-300 text-[10px] font-bold tracking-wide uppercase px-3">Too large — URL required</span>}
                {form.compressed && (
                  <span className="glass-pill bg-blue-500/20 text-blue-300 text-[10px] font-bold px-3">
                    Original: {formatFileSize(form.originalSize)} → Stored: {formatFileSize(form.compressedSize)} (saved {form.compressionRatio}%)
                  </span>
                )}
              </div>

              {/* Animated Progress Bar */}
              {(uploadStatus === 'reading' || uploadStatus === 'compressing') && fileTier === 1 && (
                <div className="mt-3 z-10">
                  <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 relative">
                    {uploadStatus === 'reading' ? (
                      <motion.div 
                        className="h-full gradient-bg" 
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }} 
                        transition={{ ease: "easeOut", duration: 0.2 }}
                      />
                    ) : (
                      <motion.div 
                        className="h-full bg-blue-400 absolute left-0" 
                        initial={{ left: '-100%', width: '100%' }}
                        animate={{ left: '100%' }} 
                        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                      />
                    )}
                  </div>
                  <div className="text-xs opacity-60 mt-1.5 font-mono">
                    {uploadStatus === 'reading' ? `Reading file... ${Math.round(uploadProgress)}%` : 'Compressing file (gzip)...'}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <label className="glass p-6 rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-white/10 transition-all border border-dashed border-white/20 hover:border-white/40">
              <Upload size={28} className="opacity-40 mb-1" />
              <span className="text-sm font-semibold text-center">Choose your app file <span className="opacity-50 font-normal">(any size)</span></span>
              <span className="text-[11px] opacity-40 text-center uppercase tracking-wider max-w-[200px] leading-relaxed">
                Under 100MB stored locally • Larger files need an external URL
              </span>
              <input type="file" onChange={handleFileUpload} className="hidden" />
            </label>
          )}

          {/* Tier 3 Error Message */}
          <AnimatePresence>
            {fileTier === 3 && (
              <motion.div 
                initial={{ opacity: 0, height: 0, scale: 0.95 }}
                animate={{ opacity: 1, height: 'auto', scale: 1 }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 text-sm overflow-hidden"
              >
                <span className="text-xl">⚠️</span>
                <div className="text-red-200 opacity-90">
                  <p className="font-semibold mb-2">This file is too large for browser storage.</p>
                  <p className="text-xs opacity-80 leading-relaxed font-mono">
                    Please upload it to a file host and paste the download URL below.<br/><br/>
                    • github.com/YOUR_REPO/releases/new<br/>
                    • drive.google.com (set link to public)<br/>
                    • mediafire.com / mega.io
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* External Download URL Section */}
        <div className="mt-8 mb-4 p-4 rounded-xl bg-black/10 border border-white/5">
          <label className="block text-sm mb-3">
            <span className="opacity-50 text-xs uppercase tracking-wider mr-2 font-bold">OR</span>
            <span className="gradient-text font-semibold">Use External Download Link</span>
            <span className="text-xs opacity-40 ml-2 block sm:inline mt-1 sm:mt-0">(recommended for large files)</span>
          </label>
          <div className="flex items-center gap-2 relative">
            <LinkIcon size={16} className="opacity-40 absolute left-3 pointer-events-none" />
            <input 
              ref={urlInputRef}
              value={form.downloadUrl} 
              onChange={e => handleChange('downloadUrl', e.target.value)} 
              className="glass-input flex-1 pl-10 pr-10" 
              placeholder="https://..." 
              style={{ borderColor: form.downloadUrl.startsWith('https://') ? 'rgba(74, 222, 128, 0.4)' : '' }}
            />
            {form.downloadUrl.startsWith('https://') && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-3 text-green-400">
                <CheckCircle2 size={16} />
              </motion.div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mt-3 pl-1">
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-30 glass-pill px-2.5 py-1">GitHub</span>
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-30 glass-pill px-2.5 py-1">Drive</span>
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-30 glass-pill px-2.5 py-1">Mega</span>
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-30 glass-pill px-2.5 py-1">MediaFire</span>
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-30 glass-pill px-2.5 py-1 shadow-inner bg-white/5 border-white/10 text-white">Direct Link</span>
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
          <>{editApp ? 'Update App' : 'Publish App'} 🚀</>
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

function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

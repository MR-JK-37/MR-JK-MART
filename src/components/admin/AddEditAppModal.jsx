import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, X, Plus, Link as LinkIcon, GripVertical, Image, Video, Trash2, Save } from 'lucide-react';
import GlassModal from '../ui/GlassModal';
import GlassButton from '../ui/GlassButton';
import useAppStore from '../../store/useAppStore';
import useToastStore from '../../store/useToastStore';

const categories = ['Utility', 'Productivity', 'Tool', 'Game', 'Other'];
const platforms = ['Windows', 'Mac', 'Linux', 'Android', 'iOS', 'Web'];

export default function AddEditAppModal({ isOpen, onClose, editApp = null }) {
  const { addApp, updateApp } = useAppStore();
  const toast = useToastStore();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: '', shortDesc: '', longDesc: '', version: '1.0.0',
    category: 'Utility', platform: [], icon: '',
    previewImages: [], fileData: null, downloadUrl: '',
    fileName: '', fileSize: '', showLikes: true, showComments: true,
    published: true, manualSteps: [],
  });

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
        downloadUrl: editApp.downloadUrl || '',
        fileName: editApp.fileName || '',
        fileSize: editApp.fileSize || '',
        showLikes: editApp.showLikes !== false,
        showComments: editApp.showComments !== false,
        published: editApp.published !== false,
        manualSteps: editApp.manualSteps || [],
      });
    } else {
      setForm({
        name: '', shortDesc: '', longDesc: '', version: '1.0.0',
        category: 'Utility', platform: [], icon: '',
        previewImages: [], fileData: null, downloadUrl: '',
        fileName: '', fileSize: '', showLikes: true, showComments: true,
        published: true, manualSteps: [],
      });
    }
  }, [editApp, isOpen]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleIconUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
          previewImages: [...prev.previewImages, reader.result].slice(0, 10),
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

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File too large (>50MB). Use external URL instead.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      handleChange('fileData', reader.result);
      handleChange('fileName', file.name);
      handleChange('fileSize', formatFileSize(file.size));
    };
    reader.readAsDataURL(file);
  };

  const togglePlatform = (p) => {
    setForm(prev => ({
      ...prev,
      platform: prev.platform.includes(p)
        ? prev.platform.filter(x => x !== p)
        : [...prev.platform, p],
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
    if (!form.name || !form.shortDesc) {
      toast.error('Name and short description are required');
      return;
    }
    setLoading(true);
    try {
      if (editApp) {
        await updateApp(editApp.id, form);
        toast.success('App updated! ✨');
      } else {
        await addApp(form);
        toast.success('App published! 🚀');
      }
      onClose();
    } catch (err) {
      toast.error('Failed to save app');
    }
    setLoading(false);
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
          <label className="block text-xs font-medium opacity-60 mb-2">Platforms</label>
          <div className="flex flex-wrap gap-2">
            {platforms.map(p => (
              <button
                key={p}
                type="button"
                onClick={() => togglePlatform(p)}
                className={`glass-pill text-xs transition-all ${
                  form.platform.includes(p) ? 'gradient-bg text-white border-transparent' : ''
                }`}
              >
                {p}
              </button>
            ))}
          </div>
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
                <img src={img} alt={`Preview ${i}`} className="w-20 h-20 rounded-xl object-cover" />
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

        {/* App File */}
        <div>
          <label className="block text-xs font-medium opacity-60 mb-2">App File</label>
          {form.fileData ? (
            <div className="glass-pill flex items-center gap-2">
              <span className="text-xs">{form.fileName} ({form.fileSize})</span>
              <button onClick={() => { handleChange('fileData', null); handleChange('fileName', ''); handleChange('fileSize', ''); }}>
                <X size={14} />
              </button>
            </div>
          ) : (
            <label className="glass p-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer hover:bg-white/10 transition-colors">
              <Upload size={18} className="opacity-40" />
              <span className="text-sm opacity-60">Upload file (max 50MB)</span>
              <input type="file" onChange={handleFileUpload} className="hidden" />
            </label>
          )}
        </div>

        {/* External Download URL */}
        <div>
          <label className="block text-xs font-medium opacity-60 mb-1">External Download URL (optional)</label>
          <div className="flex items-center gap-2">
            <LinkIcon size={16} className="opacity-40" />
            <input value={form.downloadUrl} onChange={e => handleChange('downloadUrl', e.target.value)} className="glass-input" placeholder="https://github.com/..." />
          </div>
        </div>

        {/* Visibility Toggles */}
        <div className="space-y-3">
          <label className="block text-xs font-medium opacity-60 mb-2">Visibility</label>
          <ToggleRow label="Show like count" value={form.showLikes} onChange={v => handleChange('showLikes', v)} />
          <ToggleRow label="Show comment count" value={form.showComments} onChange={v => handleChange('showComments', v)} />
          <ToggleRow label="Published" value={form.published} onChange={v => handleChange('published', v)} />
        </div>

        {/* Manual Steps */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium opacity-60">User Manual Steps</label>
            <button onClick={() => { setShowStepForm(true); setEditingStepIndex(null); setStepForm({ title: '', desc: '', imageBase64: '', videoUrl: '' }); }} className="glass-pill text-xs gap-1">
              <Plus size={12} /> Add Step
            </button>
          </div>
          <div className="space-y-2">
            {form.manualSteps.map((step, i) => (
              <div key={step.id || i} className="glass p-3 rounded-xl flex items-center gap-3" style={{ borderRadius: 12 }}>
                <GripVertical size={14} className="opacity-30" />
                <span className="w-6 h-6 rounded-full gradient-bg flex items-center justify-center text-white text-xs font-bold">{i + 1}</span>
                <span className="flex-1 text-sm truncate">{step.title}</span>
                <button onClick={() => editStep(i)} className="p-1 hover:bg-white/10 rounded"><Image size={14} /></button>
                <button onClick={() => removeStep(i)} className="p-1 hover:bg-red-500/20 rounded text-red-400"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>

          {showStepForm && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 glass p-4 rounded-xl space-y-3" style={{ borderRadius: 14 }}>
              <input value={stepForm.title} onChange={e => setStepForm(p => ({ ...p, title: e.target.value }))} className="glass-input" placeholder="Step title" />
              <textarea value={stepForm.desc} onChange={e => setStepForm(p => ({ ...p, desc: e.target.value }))} className="glass-input" rows={3} placeholder="Step description" />
              <div className="flex gap-2">
                <label className="glass-pill text-xs cursor-pointer gap-1">
                  <Image size={12} /> Image
                  <input type="file" accept="image/*" onChange={handleStepImageUpload} className="hidden" />
                </label>
                <input value={stepForm.videoUrl} onChange={e => setStepForm(p => ({ ...p, videoUrl: e.target.value }))} className="glass-input text-xs flex-1" placeholder="YouTube URL (optional)" />
              </div>
              {stepForm.imageBase64 && <img src={stepForm.imageBase64} alt="Step" className="w-full h-32 rounded-lg object-cover" />}
              <div className="flex gap-2">
                <GlassButton onClick={handleAddStep} className="text-sm flex items-center gap-1">
                  <Save size={14} /> {editingStepIndex !== null ? 'Update' : 'Add'}
                </GlassButton>
                <GlassButton variant="glass" onClick={() => { setShowStepForm(false); setEditingStepIndex(null); }} className="text-sm">Cancel</GlassButton>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <GlassButton onClick={handleSubmit} disabled={loading} className="w-full mt-6 py-3 flex items-center justify-center gap-2">
        {loading ? <div className="loader-ring" style={{ width: 20, height: 20, borderWidth: 2 }} /> : (
          <>{editApp ? 'Update App' : 'Publish App'} 🚀</>
        )}
      </GlassButton>
    </GlassModal>
  );
}

function ToggleRow({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`w-12 h-6 rounded-full relative transition-colors ${value ? 'gradient-bg' : 'bg-gray-600'}`}
      >
        <motion.div
          className="w-5 h-5 rounded-full bg-white absolute top-0.5"
          animate={{ left: value ? 26 : 2 }}
          transition={{ type: 'spring', stiffness: 500 }}
        />
      </button>
    </div>
  );
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

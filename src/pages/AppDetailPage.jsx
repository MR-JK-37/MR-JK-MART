import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Heart, Share2, MessageCircle, Calendar, HardDrive, Monitor, Tag, X, Send } from 'lucide-react';
import DOMPurify from 'dompurify';
import useAppStore from '../store/useAppStore';
import useToastStore from '../store/useToastStore';
import { getAppById, incrementDownload, getComments, postComment as addComment, setCommentHidden as hideComment, deleteComment, toggleLike } from '../firebase/appService';
import { decompressFile } from '../utils/fileCompression';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import PreviewLightbox from '../components/apps/PreviewLightbox';
import UserManualSection from '../components/apps/UserManualSection';

export default function AppDetailPage() {
  const { appId } = useParams();
  const isAdmin = useAppStore(s => s.isAdmin);
  const toast = useToastStore();
  const previewStripRef = useRef(null);

  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState('idle'); // idle, preparing, decompressing, done
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [activePreview, setActivePreview] = useState(0);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [userName, setUserName] = useState(() => localStorage.getItem('mrjk_commenter_name') || '');
  const [commentText, setCommentText] = useState('');
  const [step, setStep] = useState(() => localStorage.getItem('mrjk_commenter_name') ? 'comment' : 'name');
  const [commentCount, setCommentCount] = useState(0);
  const iconUrl = app?.iconUrl || app?.icon || '';
  const previewUrls = useMemo(
    () => (app?.previewUrls || app?.previewImages || []).filter(Boolean),
    [app]
  );

  useEffect(() => {
    loadApp();
    loadLikeState();
    loadComments();
    const savedName = localStorage.getItem('mrjk_commenter_name');
    if (savedName) {
      setUserName(savedName);
      setStep('comment');
    } else {
      setUserName('');
      setStep('name');
    }
  }, [appId]);

  useEffect(() => {
    setActivePreview(0);
    setLightboxIndex(0);
  }, [previewUrls.length]);

  const getDateValue = (value) => {
    if (!value) return null;
    if (typeof value?.toDate === 'function') return value.toDate();
    if (typeof value?.seconds === 'number') return new Date(value.seconds * 1000);
    if (value instanceof Date) return value;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const formatDate = (value) => getDateValue(value)?.toLocaleDateString('en-IN') || 'N/A';

  const loadApp = async () => {
    setLoading(true);
    const data = await getAppById(appId);
    setApp(data);
    setLikeCount(data?.likeCount || 0);
    setLoading(false);
  };

  const loadLikeState = () => {
    const liked = localStorage.getItem(`like_${appId}`);
    setLiked(!!liked);
  };

  const loadComments = async () => {
    const list = await getComments(appId);
    // Show all comments to users, filter hidden for non-admin
    const visible = isAdmin 
      ? list 
      : list.filter(c => !c.hidden);
    setComments(visible);
    setCommentCount(list.filter(c => !c.hidden).length);
  };

  const handleDownload = async () => {
    if (!app) return;
    setDownloading(true);
    setDownloadStatus('preparing');

    if (app.downloadUrl) {
      window.open(app.downloadUrl, '_blank');
      await incrementDownload(app.id);
      setDownloading(false);
      setDownloadStatus('idle');
      return;
    }

    if (app.fileData instanceof ArrayBuffer) {
      let finalBuffer = app.fileData;
      if (app.compressed) {
        setDownloadStatus('decompressing');
        finalBuffer = await decompressFile(app.fileData);
      }
      
      const blob = new Blob([finalBuffer], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = app.fileName || `${app.name}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      
      await incrementDownload(app.id);
    } else if (typeof app.fileData === 'string' && app.fileData.startsWith('data:')) {
      const link = document.createElement('a');
      link.href = app.fileData;
      link.download = app.fileName || `${app.name}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      await incrementDownload(app.id);
    } else if (app.fileHandle) {
      try {
        const file = await app.fileHandle.getFile();
        const url = URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = url;
        link.download = app.fileName || file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        await incrementDownload(app.id);
      } catch (err) {
        toast.error('Failed to read from local file system handle.');
      }
    } else {
      toast.info('No download available for this app');
    }

    setDownloadStatus('done');
    setTimeout(() => {
      setDownloading(false);
      setDownloadStatus('idle');
      toast.success('Download started! 🎉');
    }, 1500);
  };

  const handleLike = async () => {
    const isLiked = localStorage.getItem(`like_${appId}`);
    if (!isLiked) {
      await toggleLike(appId, true);
      localStorage.setItem(`like_${appId}`, 'true');
      setLiked(true);
      setLikeCount(c => c + 1);
    } else {
      await toggleLike(appId, false);
      localStorage.removeItem(`like_${appId}`);
      setLiked(false);
      setLikeCount(c => Math.max(0, c - 1));
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: app?.name, text: app?.shortDesc, url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied! 🔗');
    }
  };

  const handleSetName = () => {
    if (!userName.trim()) return;
    const name = userName.trim();
    localStorage.setItem('mrjk_commenter_name', name);
    setUserName(name);
    setStep('comment');
  };

  const handlePostComment = async () => {
    if (!commentText.trim()) return;
    const name = userName.trim() || 'Anonymous';
    
    try {
      const sanitized = DOMPurify.sanitize(commentText.trim());
      await addComment(appId, name, sanitized);
      localStorage.setItem('mrjk_commenter_name', name);
      setCommentText('');
      await loadComments(); // refresh
      toast.success('Comment posted! 💬');
    } catch (err) {
      toast.error('Failed to post: ' + err.message);
    }
  };

  const handleHideComment = async (id) => {
    await hideComment(id, true);
    loadComments();
  };

  const handleDeleteComment = async (id) => {
    await deleteComment(id);
    loadComments();
    toast.info('Comment deleted');
  };

  const handlePreviewScroll = (event) => {
    if (!previewUrls.length) return;
    const container = event.currentTarget;
    const itemWidth = container.firstElementChild?.getBoundingClientRect().width || 1;
    const gap = 16;
    const nextIndex = Math.round(container.scrollLeft / (itemWidth + gap));
    setActivePreview(Math.max(0, Math.min(previewUrls.length - 1, nextIndex)));
  };

  const scrollToPreview = (index) => {
    const target = previewStripRef.current?.children?.[index];
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
    setActivePreview(index);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loader-ring" />
      </div>
    );
  }

  if (!app) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-6xl mb-4">😕</p>
        <p className="text-xl opacity-60">App not found</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Premium Back Header */}
      <div className="absolute top-0 left-0 right-0 h-[400px] overflow-hidden z-0">
        <div className="absolute inset-0 bg-black/60 z-10" />
        {iconUrl && (
          <img 
            src={iconUrl} 
            className="w-full h-full object-cover blur-3xl scale-150 opacity-40" 
            alt="" 
          />
        )}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black to-transparent z-20" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        className="max-w-5xl mx-auto px-4 md:px-8 pt-20 pb-16 relative z-10"
      >
        {/* App Hero Section */}
        <div className="flex flex-col items-center text-center mb-12">
          {/* Centralized Icon */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] overflow-hidden mb-6 glass-border shadow-2xl relative"
            style={{ 
              border: '4px solid rgba(255,255,255,0.1)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
             }}
          >
            {iconUrl ? (
              <img src={iconUrl} alt={app.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full gradient-bg flex items-center justify-center">
                <span className="text-5xl font-display font-bold">{app.name?.charAt(0)}</span>
              </div>
            )}
          </motion.div>

          <h1 className="font-display text-4xl md:text-6xl font-black mb-4 tracking-tight">{app.name}</h1>
          <p className="font-body text-lg md:text-xl opacity-60 mb-8 max-w-2xl mx-auto">{app.shortDesc}</p>

          {/* Platform & Version Badges */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            <span className="glass-pill text-xs font-bold px-4 py-1.5 uppercase tracking-wider bg-white/10">v{app.version || '1.0.0'}</span>
            {app.category && <span className="glass-pill text-xs font-bold px-4 py-1.5 uppercase tracking-wider bg-violet-500/20 text-violet-300">{app.category}</span>}
            {app.platform?.map(p => (
              <span key={p} className="glass-pill text-xs font-bold px-4 py-1.5 uppercase tracking-wider bg-white/5">{p}</span>
            ))}
          </div>

          {/* Primary Action Button */}
          <div className="flex flex-col items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05, filter: 'brightness(1.1)' }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDownload}
              disabled={downloading}
              className="relative group p-[2px] rounded-full overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-cyan-500 to-violet-600 animate-gradient-x" />
              <div className="relative px-12 py-4 bg-black/40 backdrop-blur-xl rounded-full flex items-center gap-4 transition-all duration-300 group-hover:bg-transparent">
                {downloadStatus === 'idle' ? (
                  <>
                    <Download size={24} className="text-white" />
                    <span className="text-lg font-bold text-white pr-4">Download Now</span>
                    {app.fileSize && (
                      <span className="pl-4 border-l border-white/20 text-sm font-medium opacity-60">{app.fileSize}</span>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="loader-ring w-5 h-5 border-2" />
                    <span className="text-lg font-bold text-white capitalize">{downloadStatus}...</span>
                  </div>
                )}
              </div>
            </motion.button>
            <p className="text-[10px] uppercase tracking-[0.2em] opacity-30 font-bold">Secure Verified Download</p>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-center gap-3 mb-12">
          {/* Like */}
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleLike}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl glass transition-all ${liked ? 'bg-red-500/20 border-red-500/40 text-red-400' : 'hover:bg-white/10'}`}
          >
            <Heart size={20} fill={liked ? 'currentColor' : 'none'} />
            <span className="font-bold text-sm">{app.showLikes !== false ? likeCount : 'Like'}</span>
          </motion.button>

          {/* Share */}
          <motion.button
             whileHover={{ y: -2 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleShare}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl glass hover:bg-white/10 transition-all"
          >
            <Share2 size={20} />
            <span className="font-bold text-sm">Share</span>
          </motion.button>

          {/* Comments */}
          <motion.button
             whileHover={{ y: -2 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setCommentsOpen(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl glass hover:bg-white/10 transition-all"
          >
            <MessageCircle size={20} />
            <span className="font-bold text-sm">{app.showComments !== false ? commentCount : 'Comments'}</span>
          </motion.button>
        </div>

      {/* Preview Images */}
      {previewUrls.length > 0 && (
        <div className="mb-12">
          <h2 className="font-display text-2xl font-bold mb-6 flex items-center gap-2">
            <HardDrive size={20} className="text-cyan-400" /> App Screenshots
          </h2>
          
          <div
            ref={previewStripRef}
            onScroll={handlePreviewScroll}
            style={{
              display: 'flex',
              gap: '16px',
              overflowX: 'auto',
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch',
              scrollBehavior: 'smooth',
              padding: '8px 4px 16px',
              msOverflowStyle: 'none',
              scrollbarWidth: 'none',
            }}
            className="hide-scrollbar"
          >
            {previewUrls.map((url, i) => (
              <motion.div
                key={i}
                style={{
                  flexShrink: 0,
                  scrollSnapAlign: 'start',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  width: 'clamp(240px, 70vw, 320px)',
                  aspectRatio: '9/16',
                  border: '1px solid rgba(255,255,255,0.1)',
                  cursor: 'pointer',
                  background: 'rgba(255,255,255,0.02)'
                }}
                whileHover={{ y: -5, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => {
                  setActivePreview(i);
                  setLightboxIndex(i);
                  setLightboxOpen(true);
                }}
              >
                <img
                  src={url}
                  alt={`Preview ${i + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                  loading="lazy"
                />
              </motion.div>
            ))}
          </div>

          {/* Dot indicators */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center',
            gap: '6px',
            marginTop: '8px',
          }}>
            {previewUrls.map((_, i) => (
              <div
                key={i}
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: i === activePreview
                    ? '#7c3aed'
                    : 'rgba(255,255,255,0.2)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                }}
                onClick={() => scrollToPreview(i)}
              />
            ))}
          </div>
        </div>
      )}

      {/* About */}
      <div className="mb-8">
        <h2 className="font-display text-2xl font-bold mb-4">About</h2>
        <div className="glass p-6 rounded-2xl">
          <p className="font-body opacity-80 whitespace-pre-wrap leading-relaxed">
            {app.longDesc || app.shortDesc}
          </p>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <InfoCard icon={<Tag size={18} />} label="Version" value={app.version || '1.0.0'} />
        <InfoCard icon={<HardDrive size={18} />} label="Size" value={app.fileSize || 'N/A'} />
        <InfoCard icon={<Monitor size={18} />} label="Platform" value={app.platform?.join(', ') || 'All'} />
        <InfoCard icon={<Calendar size={18} />} label="Updated" value={formatDate(app.updatedAt)} />
      </div>

      {/* User Manual */}
      {app.manualSteps && app.manualSteps.length > 0 && (
        <UserManualSection steps={app.manualSteps} />
      )}

      {/* Lightbox */}
      <PreviewLightbox
        images={previewUrls}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />

      {/* Comments Modal */}
      <CommentsModal
        isOpen={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        comments={comments}
        commentCount={commentCount}
        step={step}
        userName={userName}
        setUserName={setUserName}
        commentText={commentText}
        setCommentText={setCommentText}
        onSetName={handleSetName}
        onPost={handlePostComment}
        isAdmin={isAdmin}
        onHide={handleHideComment}
        onDelete={handleDeleteComment}
      />
      </motion.div>
    </div>
  );
}

function InfoCard({ icon, label, value }) {
  return (
    <div className="glass p-4 rounded-xl text-center">
      <div className="flex justify-center mb-2 opacity-50">{icon}</div>
      <p className="text-xs opacity-40 mb-1">{label}</p>
      <p className="text-sm font-semibold truncate">{value}</p>
    </div>
  );
}

function CommentsModal({ isOpen, onClose, comments, commentCount, step, userName, setUserName, commentText, setCommentText, onSetName, onPost, isAdmin, onHide, onDelete }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-end md:items-center justify-center"
          onClick={onClose}
        >
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.58)', backdropFilter: 'blur(24px)' }} />

          <motion.div
            initial={{ y: '100%', opacity: 0, scale: 0.92 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: '100%', opacity: 0, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative liquid-glass w-full md:max-w-lg md:rounded-2xl rounded-t-3xl overflow-hidden"
            style={{ maxHeight: '80vh' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <div className="flex items-center gap-2">
                <MessageCircle size={20} />
                <h3 className="font-display text-lg font-bold">Comments</h3>
                <span className="glass-pill text-xs">{commentCount}</span>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10">
                <X size={18} />
              </button>
            </div>

            {/* Input */}
            <div className="p-4 border-b border-white/10">
              {step === 'name' ? (
                <div className="flex gap-2">
                  <input
                    value={userName}
                    onChange={e => setUserName(e.target.value)}
                    className="glass-input flex-1"
                    placeholder="What's your name?"
                    onKeyDown={e => e.key === 'Enter' && onSetName()}
                  />
                  <GlassButton onClick={onSetName} className="px-4 text-sm">Continue</GlassButton>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs opacity-60">
                    <span>Commenting as {userName || 'Anonymous'}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setUserName('');
                        setStep('name');
                      }}
                      className="hover:opacity-100 opacity-70"
                    >
                      Change
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <textarea
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      className="glass-input flex-1 resize-none"
                      rows={2}
                      placeholder="Write a comment..."
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onPost(); } }}
                    />
                    <GlassButton onClick={onPost} className="px-3 self-end">
                      <Send size={16} />
                    </GlassButton>
                  </div>
                </div>
              )}
            </div>

            {/* Comments List */}
            <div className="p-4 overflow-y-auto" style={{ maxHeight: '50vh' }}>
              {comments.length === 0 ? (
                <p className="text-center opacity-40 py-8">No comments yet. Be the first! 💬</p>
              ) : (
                <div className="space-y-4">
                  {comments.map(comment => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      isAdmin={isAdmin}
                      onHide={onHide}
                      onDelete={onDelete}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CommentItem({ comment, isAdmin, onHide, onDelete }) {
  const [showMenu, setShowMenu] = useState(false);

  if (comment.hidden && !isAdmin) return null;

  const initial = comment.authorName?.charAt(0)?.toUpperCase() || '?';
  const createdAt =
    typeof comment.createdAt?.toDate === 'function'
      ? comment.createdAt.toDate()
      : typeof comment.createdAt?.seconds === 'number'
        ? new Date(comment.createdAt.seconds * 1000)
        : new Date(comment.createdAt);

  return (
    <div className={`flex gap-3 ${comment.hidden ? 'opacity-40' : ''}`}>
      <div className="w-9 h-9 rounded-full gradient-bg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
        {initial}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-semibold text-sm">{comment.authorName}</span>
          <span className="text-xs opacity-30">
            {Number.isNaN(createdAt.getTime()) ? '' : createdAt.toLocaleDateString('en-IN')}
          </span>
          {comment.hidden && <span className="text-xs text-yellow-500">(hidden)</span>}
        </div>
        <p className="text-sm opacity-70">{comment.text}</p>
      </div>
      {isAdmin && (
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="p-1 rounded hover:bg-white/10 text-xs opacity-40">⋮</button>
          {showMenu && (
            <div className="absolute right-0 top-full glass rounded-lg overflow-hidden min-w-[120px] z-10" style={{ padding: 2 }}>
              {!comment.hidden && (
                <button onClick={() => { onHide(comment.id); setShowMenu(false); }} className="w-full px-3 py-1.5 text-xs text-left hover:bg-white/10">Hide</button>
              )}
              <button onClick={() => { onDelete(comment.id); setShowMenu(false); }} className="w-full px-3 py-1.5 text-xs text-left hover:bg-red-500/20 text-red-400">Delete</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

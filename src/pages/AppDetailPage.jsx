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
    <div className="relative min-h-screen overflow-x-clip">
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
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 180, damping: 22 }}
          className="liquid-glass detail-hero-card relative overflow-hidden mb-12"
          style={{
            borderRadius: '32px',
            padding: 'clamp(20px, 4vw, 32px)',
            boxShadow: '0 30px 90px rgba(4, 10, 30, 0.34)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(circle at top left, rgba(167,139,250,0.2), transparent 34%), radial-gradient(circle at right, rgba(34,211,238,0.16), transparent 28%)',
              pointerEvents: 'none',
            }}
          />

          <div className="relative z-[1] flex flex-col gap-8">
            <div className="flex flex-col md:flex-row md:items-start gap-6 md:gap-7">
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-28 h-28 md:w-32 md:h-32 rounded-[28px] overflow-hidden flex-shrink-0"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25), 0 18px 40px rgba(2,6,23,0.28)',
                }}
              >
                {iconUrl ? (
                  <img src={iconUrl} alt={app.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full gradient-bg flex items-center justify-center">
                    <span className="text-4xl font-display font-bold">{app.name?.charAt(0)}</span>
                  </div>
                )}
              </motion.div>

              <div className="flex-1 min-w-0 text-left">
                <h1
                  className="font-display uppercase tracking-tight"
                  style={{
                    fontSize: 'clamp(2.2rem, 5.4vw, 4.25rem)',
                    fontWeight: 800,
                    lineHeight: 0.95,
                    letterSpacing: '-0.04em',
                    textWrap: 'balance',
                  }}
                >
                  {app.name}
                </h1>
                <p
                  className="font-body mt-4 max-w-3xl"
                  style={{
                    fontSize: 'clamp(1rem, 2.1vw, 1.25rem)',
                    color: 'rgba(226,232,240,0.62)',
                    lineHeight: 1.55,
                  }}
                >
                  {app.shortDesc}
                </p>

                <div className="flex flex-wrap gap-2 mt-5">
                  <span className="glass-pill text-xs font-semibold px-4 py-1.5">v{app.version || '1.0.0'}</span>
                  {app.category && (
                    <span className="glass-pill text-xs font-semibold px-4 py-1.5">
                      <Tag size={12} />
                      {app.category}
                    </span>
                  )}
                  {app.platform?.map((platform) => (
                    <span key={platform} className="glass-pill text-xs font-semibold px-4 py-1.5">
                      {platform}
                    </span>
                  ))}
                </div>

                <div className="mt-6 flex justify-start">
                  <motion.button
                    whileHover={{ scale: 1.02, filter: 'brightness(1.08)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDownload}
                    disabled={downloading}
                    className="relative overflow-hidden"
                    style={{
                      border: '1px solid rgba(104, 89, 255, 0.35)',
                      borderRadius: '18px',
                      background: 'linear-gradient(90deg, rgba(123,92,255,0.92) 0%, rgba(41,153,255,0.92) 55%, rgba(46,196,240,0.94) 100%)',
                      boxShadow: '0 18px 40px rgba(45, 120, 255, 0.2)',
                    }}
                  >
                    <div
                      className="flex items-center"
                      style={{
                        minHeight: '58px',
                        minWidth: 'min(78vw, 360px)',
                      }}
                    >
                      {downloadStatus === 'idle' ? (
                        <>
                          <div className="flex items-center gap-3 px-5 md:px-6 text-white font-semibold text-base">
                            <Download size={21} />
                            <span>Download v{app.version || '1.0.0'}</span>
                          </div>
                          {app.fileSize && (
                            <div
                              className="ml-auto px-5 md:px-6 text-sm font-medium text-white/85"
                              style={{
                                borderLeft: '1px solid rgba(255,255,255,0.24)',
                                minHeight: '58px',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                            >
                              {app.fileSize}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center gap-3 px-6 text-white font-semibold text-base">
                          <div className="loader-ring w-5 h-5 border-2" />
                          <span className="capitalize">{downloadStatus}...</span>
                        </div>
                      )}
                    </div>
                  </motion.button>
                </div>
              </div>
            </div>

            <div
              className="flex flex-wrap gap-3 pt-6"
              style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
            >
              <ActionChip
                onClick={handleLike}
                active={liked}
                icon={<Heart size={18} fill={liked ? 'currentColor' : 'none'} />}
                label={app.showLikes !== false ? likeCount : 'Like'}
              />
              <ActionChip
                onClick={handleShare}
                icon={<Share2 size={18} />}
                label="Share"
              />
              <ActionChip
                onClick={() => setCommentsOpen(true)}
                icon={<MessageCircle size={18} />}
                label={app.showComments !== false ? `${commentCount} Comments` : 'Comments'}
              />
            </div>
          </div>
        </motion.div>

      {/* Preview Images */}
      {previewUrls.length > 0 && (
        <div className="mb-12 max-w-[980px] mx-auto">
          <h2 className="font-display text-[clamp(2rem,4vw,2.7rem)] font-bold mb-6">
            Preview
          </h2>

          <div className="relative">
            <div
              className="preview-edge-fade pointer-events-none absolute inset-y-0 left-0 w-10 z-[1]"
              style={{ background: 'linear-gradient(90deg, rgba(10,14,26,0.95), transparent)' }}
            />
            <div
              className="preview-edge-fade pointer-events-none absolute inset-y-0 right-0 w-10 z-[1]"
              style={{ background: 'linear-gradient(270deg, rgba(10,14,26,0.95), transparent)' }}
            />

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
                padding: '8px 2px 18px',
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
                    scrollSnapAlign: 'center',
                    width: 'clamp(142px, 18vw, 178px)',
                    borderRadius: '24px',
                    padding: '6px',
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.11), rgba(255,255,255,0.04))',
                    border: '1px solid rgba(255,255,255,0.12)',
                    boxShadow: '0 18px 36px rgba(3, 8, 24, 0.24)',
                    cursor: 'pointer',
                  }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  onClick={() => {
                    setActivePreview(i);
                    setLightboxIndex(i);
                    setLightboxOpen(true);
                  }}
                >
                  <div
                    style={{
                      borderRadius: '20px',
                      overflow: 'hidden',
                      aspectRatio: '9 / 19',
                      background: '#0b1020',
                      border: '1px solid rgba(96,165,250,0.2)',
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
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '10px',
            }}
          >
            {previewUrls.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to preview ${i + 1}`}
                style={{
                  width: i === activePreview ? '18px' : '8px',
                  height: '8px',
                  borderRadius: '999px',
                  border: 'none',
                  background: i === activePreview
                    ? 'linear-gradient(135deg, #7c3aed, #38bdf8)'
                    : 'rgba(255,255,255,0.22)',
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

function ActionChip({ onClick, icon, label, active = false }) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="flex items-center gap-2.5 px-5 py-3 rounded-[18px] transition-all"
      style={{
        background: active ? 'rgba(248,113,113,0.15)' : 'rgba(255,255,255,0.08)',
        border: active ? '1px solid rgba(248,113,113,0.28)' : '1px solid rgba(255,255,255,0.12)',
        color: active ? '#fca5a5' : 'rgba(226,232,240,0.78)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.14)',
      }}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </motion.button>
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

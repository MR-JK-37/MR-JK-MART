import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Heart, Share2, MessageCircle, Calendar, HardDrive, Monitor, Tag, X, Send } from 'lucide-react';
import DOMPurify from 'dompurify';
import useAppStore from '../store/useAppStore';
import useToastStore from '../store/useToastStore';
import { getAppById, incrementDownload, getComments, addComment, hideComment, deleteComment } from '../firebase/services';
import { updateDoc, doc, increment } from 'firebase/firestore';
import { db } from '../firebase/config';
import { decompressFile } from '../utils/fileCompression';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import PreviewLightbox from '../components/apps/PreviewLightbox';
import UserManualSection from '../components/apps/UserManualSection';

export default function AppDetailPage() {
  const { appId } = useParams();
  const isAdmin = useAppStore(s => s.isAdmin);
  const toast = useToastStore();

  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState('idle'); // idle, preparing, decompressing, done
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentName, setCommentName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [nameSet, setNameSet] = useState(false);

  useEffect(() => {
    loadApp();
    loadLikeState();
    loadComments();
    const savedName = localStorage.getItem('mrjk-comment-name');
    if (savedName) {
      setCommentName(savedName);
      setNameSet(true);
    }
  }, [appId]);

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
    const data = await getComments(appId);
    setComments(data);
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
      await updateDoc(doc(db, 'apps', appId), {
        likeCount: increment(1)
      });
      localStorage.setItem(`like_${appId}`, 'true');
      setLiked(true);
      setLikeCount(c => c + 1);
    } else {
      await updateDoc(doc(db, 'apps', appId), {
        likeCount: increment(-1)
      });
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
    if (!commentName.trim()) return;
    localStorage.setItem('mrjk-comment-name', commentName.trim());
    setNameSet(true);
  };

  const handlePostComment = async () => {
    if (!commentText.trim()) return;
    const sanitized = DOMPurify.sanitize(commentText.trim());
    await addComment(appId, commentName, sanitized);
    setCommentText('');
    loadComments();
    toast.success('Comment posted! 💬');
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="max-w-5xl mx-auto px-4 md:px-8 pt-28 pb-16"
    >
      {/* Hero Section */}
      <div className="liquid-glass p-6 md:p-8 mb-8" style={{ borderRadius: 24 }}>
        <div className="flex flex-col md:flex-row items-start gap-6">
          {/* App Icon */}
          <div className="w-28 h-28 rounded-3xl overflow-hidden flex-shrink-0 glass flex items-center justify-center"
            style={{ border: '2px solid rgba(255,255,255,0.15)' }}>
            {app.icon ? (
              <img src={app.icon} alt={app.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl font-display font-bold gradient-text">{app.name?.charAt(0)}</span>
            )}
          </div>

          <div className="flex-1">
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">{app.name}</h1>
            <p className="font-body opacity-60 mb-3">{app.shortDesc}</p>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="glass-pill text-xs">v{app.version || '1.0.0'}</span>
              {app.category && <span className="glass-pill text-xs"><Tag size={12} /> {app.category}</span>}
              {app.platform?.map(p => (
                <span key={p} className="glass-pill text-xs">{p}</span>
              ))}
            </div>

            {/* Download Button */}
            <div className="flex items-center gap-4">
              <GlassButton
                onClick={handleDownload}
                disabled={downloading}
                className="flex items-center gap-3 text-base px-8 py-3"
              >
                {downloadStatus === 'preparing' && (
                  <>
                    <div className="loader-ring" style={{ width: 18, height: 18, borderWidth: 2 }} />
                    Preparing...
                  </>
                )}
                {downloadStatus === 'decompressing' && (
                  <>
                    <span className="animate-spin">🔄</span>
                    Decompressing...
                  </>
                )}
                {downloadStatus === 'done' && (
                  <>
                    <span>✅</span>
                    Downloaded!
                  </>
                )}
                {downloadStatus === 'idle' && (
                  <>
                    <div className="flex items-center gap-2">
                      <Download size={20} />
                      <span>Download v{app.version || '1.0.0'}</span>
                    </div>
                    {app.fileSize && (
                      <div className="flex items-center gap-3 pl-3 border-l border-white/20">
                        <span className="opacity-80 text-sm">{app.fileSize}</span>
                      </div>
                    )}
                  </>
                )}
              </GlassButton>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center gap-2 mt-6 pt-6 border-t border-white/10">
          {/* Like */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleLike}
            className={`glass-pill flex items-center gap-2 transition-colors ${liked ? 'text-red-400' : ''}`}
          >
            <motion.div animate={liked ? { scale: [1, 1.3, 1] } : {}} transition={{ type: 'spring' }}>
              <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
            </motion.div>
            {app.showLikes !== false && <span className="text-sm">{likeCount}</span>}
          </motion.button>

          {/* Share */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleShare}
            className="glass-pill flex items-center gap-2"
          >
            <Share2 size={18} />
            <span className="text-sm">Share</span>
          </motion.button>

          {/* Comments */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setCommentsOpen(true)}
            className="glass-pill flex items-center gap-2"
          >
            <MessageCircle size={18} />
            <span className="text-sm">{app.showComments !== false ? comments.filter(c => !c.hidden).length : ''} Comments</span>
          </motion.button>
        </div>
      </div>

      {/* Preview Images */}
      {app.previewImages && app.previewImages.length > 0 && (
        <div className="mb-8">
          <h2 className="font-display text-2xl font-bold mb-4">Preview</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
            {app.previewImages.map((img, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.02 }}
                className="flex-shrink-0 glass p-2 rounded-2xl cursor-pointer"
                onClick={() => { setLightboxIndex(i); setLightboxOpen(true); }}
              >
                <img src={img} alt={`Preview ${i + 1}`} className="h-48 md:h-64 rounded-xl object-cover" />
              </motion.div>
            ))}
          </div>
          <div className="flex justify-center gap-1.5 mt-2">
            {app.previewImages.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full ${i === 0 ? 'gradient-bg' : 'bg-white/20'}`} />
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
        <InfoCard icon={<Calendar size={18} />} label="Updated" value={app.updatedAt ? new Date(app.updatedAt).toLocaleDateString() : 'N/A'} />
      </div>

      {/* User Manual */}
      {app.manualSteps && app.manualSteps.length > 0 && (
        <UserManualSection steps={app.manualSteps} />
      )}

      {/* Lightbox */}
      <PreviewLightbox
        images={app.previewImages || []}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />

      {/* Comments Modal */}
      <CommentsModal
        isOpen={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        comments={comments}
        nameSet={nameSet}
        commentName={commentName}
        setCommentName={setCommentName}
        commentText={commentText}
        setCommentText={setCommentText}
        onSetName={handleSetName}
        onPost={handlePostComment}
        isAdmin={isAdmin}
        onHide={handleHideComment}
        onDelete={handleDeleteComment}
      />
    </motion.div>
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

function CommentsModal({ isOpen, onClose, comments, nameSet, commentName, setCommentName, commentText, setCommentText, onSetName, onPost, isAdmin, onHide, onDelete }) {
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
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)' }} />

          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
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
                <span className="glass-pill text-xs">{comments.filter(c => !c.hidden).length}</span>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10">
                <X size={18} />
              </button>
            </div>

            {/* Input */}
            <div className="p-4 border-b border-white/10">
              {!nameSet ? (
                <div className="flex gap-2">
                  <input
                    value={commentName}
                    onChange={e => setCommentName(e.target.value)}
                    className="glass-input flex-1"
                    placeholder="What's your name?"
                    onKeyDown={e => e.key === 'Enter' && onSetName()}
                  />
                  <GlassButton onClick={onSetName} className="px-4 text-sm">Continue</GlassButton>
                </div>
              ) : (
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

  return (
    <div className={`flex gap-3 ${comment.hidden ? 'opacity-40' : ''}`}>
      <div className="w-9 h-9 rounded-full gradient-bg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
        {initial}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-semibold text-sm">{comment.authorName}</span>
          <span className="text-xs opacity-30">
            {new Date(comment.createdAt).toLocaleDateString()}
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

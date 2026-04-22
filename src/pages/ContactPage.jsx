import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Linkedin, Github, Mail } from 'lucide-react';
import DOMPurify from 'dompurify';
import GlassButton from '../components/ui/GlassButton';
import GlassModal from '../components/ui/GlassModal';
import AdminGate from '../components/admin/AdminGate';
import useAppStore from '../store/useAppStore';
import useToastStore from '../store/useToastStore';
import { submitContact, getSettings, saveSettings } from '../firebase/appService';
import { useIsMobile } from '../hooks/useIsMobile';
import { glassStyle } from '../utils/glassStyle';

export default function ContactPage() {
  const isAdmin = useAppStore(s => s.isAdmin);
  const toast = useToastStore();
  const [showAdminGate, setShowAdminGate] = useState(false);
  const [showSocialEdit, setShowSocialEdit] = useState(false);

  const [form, setForm] = useState({ name: '', contact: '', message: '' });
  const [sending, setSending] = useState(false);

  const [social, setSocial] = useState({
    linkedin: 'https://linkedin.com/in/mrjk',
    github: 'https://github.com/MR1JK1',
    email: 'mrjk@email.com',
  });

  const [socialForm, setSocialForm] = useState({ ...social });
  const isMobile = useIsMobile();

  useEffect(() => {
    loadSocial();
  }, []);

  const loadSocial = async () => {
    const saved = await getSettings('social');
    if (saved) {
      setSocial(saved);
      setSocialForm(saved);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.contact.trim() || !form.message.trim()) {
      toast.error('All fields are required');
      return;
    }
    setSending(true);
    const sanitized = {
      name: DOMPurify.sanitize(form.name.trim()),
      contact: DOMPurify.sanitize(form.contact.trim()),
      message: DOMPurify.sanitize(form.message.trim()),
    };
    await submitContact(sanitized.name, sanitized.contact, sanitized.message);
    toast.success('Message sent! 🎉');
    setForm({ name: '', contact: '', message: '' });
    setSending(false);
  };

  const handleSaveSocial = async () => {
    await saveSettings('social', socialForm);
    setSocial(socialForm);
    setShowSocialEdit(false);
    toast.success('Social links updated! ✨');
  };

  return (
    <motion.div
      initial={isMobile ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={isMobile ? { duration: 0 } : undefined}
      exit={{ opacity: 0 }}
      className="max-w-2xl mx-auto px-4 md:px-8 pt-28 pb-16"
    >
      <motion.h1
        initial={isMobile ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-display text-4xl font-bold mb-3 text-center"
      >
        Get in <span className="gradient-text">Touch</span>
      </motion.h1>
      <motion.p
        initial={isMobile ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={isMobile ? { duration: 0 } : { delay: 0.1 }}
        className="text-center opacity-60 mb-10 font-body"
      >
        Have a suggestion or feedback? I'd love to hear from you!
      </motion.p>

      {/* Contact Form */}
      <motion.form
        initial={isMobile ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={isMobile ? { duration: 0 } : { delay: 0.2 }}
        onSubmit={handleSubmit}
        className="liquid-glass glass-card p-6 md:p-8 mb-10"
        style={{ ...glassStyle(isMobile), borderRadius: 24 }}
      >
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-medium opacity-60 mb-1.5">Full Name</label>
            <input
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              className="glass-input"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-xs font-medium opacity-60 mb-1.5">Contact (Email or Phone)</label>
            <input
              value={form.contact}
              onChange={e => setForm(p => ({ ...p, contact: e.target.value }))}
              className="glass-input"
              placeholder="email@example.com or +1234567890"
            />
          </div>
          <div>
            <label className="block text-xs font-medium opacity-60 mb-1.5">Message / Suggestion</label>
            <textarea
              value={form.message}
              onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
              className="glass-input"
              rows={4}
              placeholder="What's on your mind?"
            />
          </div>
          <GlassButton
            type="submit"
            disabled={sending}
            className="w-full py-3 flex items-center justify-center gap-2"
          >
            {sending ? (
              <div className="loader-ring" style={{ width: 18, height: 18, borderWidth: 2 }} />
            ) : (
              <>
                <Send size={18} />
                Send Message
              </>
            )}
          </GlassButton>
        </div>
      </motion.form>

      {/* Social Links */}
      <motion.div
        initial={isMobile ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={isMobile ? { duration: 0 } : { delay: 0.3 }}
        className="relative"
      >
        <h3 className="font-display text-lg font-bold text-center mb-4">Connect with me</h3>
        <div className="flex items-center justify-center gap-4">
          <SocialIcon
            icon={<Linkedin size={22} />}
            href={social.linkedin}
            tooltip="LinkedIn"
          />
          <SocialIcon
            icon={<Github size={22} />}
            href={social.github}
            tooltip="GitHub"
          />
          <SocialIcon
            icon={<Mail size={22} />}
            href={`mailto:${social.email}`}
            tooltip="Email"
          />
        </div>

        {isAdmin && (
          <button
            onClick={() => { setSocialForm({ ...social }); setShowSocialEdit(true); }}
            className="absolute top-0 right-0 glass-pill text-xs opacity-50 hover:opacity-100"
          >
            Edit Links
          </button>
        )}
      </motion.div>

      {/* Hidden Admin Trigger */}
      <div className="fixed bottom-4 right-4">
        <button
          onClick={() => setShowAdminGate(true)}
          className="wm-logo font-display text-xs opacity-[0.15] hover:opacity-[0.4] transition-opacity select-none"
          style={{ background: 'none', border: 'none', cursor: 'default' }}
        >
          MR!JK!
        </button>
      </div>

      {/* Admin Gate Modal */}
      <AdminGate isOpen={showAdminGate} onClose={() => setShowAdminGate(false)} />

      {/* Social Edit Modal */}
      <GlassModal isOpen={showSocialEdit} onClose={() => setShowSocialEdit(false)} title="Edit Social Links" maxWidth="420px">
        <div className="space-y-4">
          <div>
            <label className="block text-xs opacity-60 mb-1">LinkedIn URL</label>
            <input value={socialForm.linkedin} onChange={e => setSocialForm(p => ({ ...p, linkedin: e.target.value }))} className="glass-input" />
          </div>
          <div>
            <label className="block text-xs opacity-60 mb-1">GitHub URL</label>
            <input value={socialForm.github} onChange={e => setSocialForm(p => ({ ...p, github: e.target.value }))} className="glass-input" />
          </div>
          <div>
            <label className="block text-xs opacity-60 mb-1">Email</label>
            <input value={socialForm.email} onChange={e => setSocialForm(p => ({ ...p, email: e.target.value }))} className="glass-input" />
          </div>
          <GlassButton onClick={handleSaveSocial} className="w-full py-3">Save Links</GlassButton>
        </div>
      </GlassModal>
    </motion.div>
  );
}

function SocialIcon({ icon, href, tooltip }) {
  const isMobile = useIsMobile();

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={isMobile ? undefined : { scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className="w-14 h-14 rounded-2xl glass flex items-center justify-center transition-all hover:border-purple-500/30 group relative"
      title={tooltip}
    >
      <span className="opacity-60 group-hover:opacity-100 transition-opacity">{icon}</span>
      <span className="absolute -bottom-6 text-xs opacity-0 group-hover:opacity-60 transition-opacity font-body">
        {tooltip}
      </span>
    </motion.a>
  );
}

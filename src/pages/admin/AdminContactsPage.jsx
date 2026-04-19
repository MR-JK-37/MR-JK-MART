import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Trash2, X, Mail, Clock } from 'lucide-react';
import { getAllContacts, deleteContact, markContactRead } from '../../firebase/appService';
import GlassCard from '../../components/ui/GlassCard';
import GlassModal from '../../components/ui/GlassModal';
import GlassButton from '../../components/ui/GlassButton';
import useToastStore from '../../store/useToastStore';

export default function AdminContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState(null);
  const toast = useToastStore();

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    setLoading(true);
    const data = await getAllContacts();
    setContacts(data);
    setLoading(false);
  };

  const handleView = async (contact) => {
    setSelectedContact(contact);
    if (!contact.read) {
      await markContactRead(contact.id);
      loadContacts();
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this message?')) {
      await deleteContact(id);
      loadContacts();
      setSelectedContact(null);
      toast.info('Message deleted');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="max-w-5xl mx-auto px-4 md:px-8 pt-28 pb-16"
    >
      <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
        Contact <span className="gradient-text">Messages</span>
      </h1>
      <p className="opacity-60 font-body mb-8">View and manage contact form submissions</p>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="loader-ring" />
        </div>
      ) : contacts.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-xl opacity-60">No messages yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contacts.map((contact, i) => (
            <motion.div
              key={contact.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <GlassCard
                className={`p-4 md:p-5 flex items-start gap-4 ${!contact.read ? 'border-l-4 border-l-purple-500' : ''}`}
                hover
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-display font-bold text-base">{contact.name}</span>
                    {!contact.read && (
                      <span className="w-2 h-2 rounded-full gradient-bg" />
                    )}
                  </div>
                  <p className="text-sm opacity-50 mb-1 flex items-center gap-1">
                    <Mail size={12} /> {contact.contact}
                  </p>
                  <p className="text-sm opacity-70 line-clamp-2">{contact.message}</p>
                  <p className="text-xs opacity-30 mt-2 flex items-center gap-1">
                    <Clock size={10} /> {new Date(contact.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleView(contact)}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    title="View"
                  >
                    <Eye size={16} />
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleDelete(contact.id)}
                    className="p-2 rounded-lg hover:bg-red-500/20 transition-colors text-red-400"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </motion.button>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}

      {/* View Modal */}
      <GlassModal
        isOpen={!!selectedContact}
        onClose={() => setSelectedContact(null)}
        title="Message Details"
        maxWidth="500px"
      >
        {selectedContact && (
          <div className="space-y-4">
            <div>
              <label className="text-xs opacity-40">Name</label>
              <p className="font-semibold">{selectedContact.name}</p>
            </div>
            <div>
              <label className="text-xs opacity-40">Contact</label>
              <p>{selectedContact.contact}</p>
            </div>
            <div>
              <label className="text-xs opacity-40">Message</label>
              <p className="whitespace-pre-wrap opacity-80">{selectedContact.message}</p>
            </div>
            <div>
              <label className="text-xs opacity-40">Date</label>
              <p className="text-sm opacity-60">{new Date(selectedContact.createdAt).toLocaleString()}</p>
            </div>
            <GlassButton
              variant="glass"
              onClick={() => handleDelete(selectedContact.id)}
              className="w-full text-red-400 flex items-center justify-center gap-2"
            >
              <Trash2 size={16} /> Delete Message
            </GlassButton>
          </div>
        )}
      </GlassModal>
    </motion.div>
  );
}

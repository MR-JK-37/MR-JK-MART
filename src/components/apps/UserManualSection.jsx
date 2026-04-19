import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, X, MoreVertical, Edit, Trash2 } from 'lucide-react';
import useAppStore from '../../store/useAppStore';

export default function UserManualSection({ steps = [], onEdit, onDelete }) {
  const [selectedStep, setSelectedStep] = useState(null);
  const isAdmin = useAppStore(s => s.isAdmin);

  if (!steps || steps.length === 0) return null;

  const sorted = [...steps].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div className="mb-8">
      <h2 className="font-display text-2xl font-bold mb-6">User Manual</h2>
      <div className="space-y-3">
        {sorted.map((step, i) => (
          <StepItem
            key={step.id || i}
            step={step}
            index={i}
            onClick={() => setSelectedStep(i)}
            isAdmin={isAdmin}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>

      {/* Step Detail Modal */}
      <AnimatePresence>
        {selectedStep !== null && (
          <StepDetailModal
            steps={sorted}
            current={selectedStep}
            onClose={() => setSelectedStep(null)}
            onNext={() => setSelectedStep(p => Math.min(p + 1, sorted.length - 1))}
            onPrev={() => setSelectedStep(p => Math.max(p - 1, 0))}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function StepItem({ step, index, onClick, isAdmin, onEdit, onDelete }) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="glass p-4 flex items-center gap-4 group relative"
      style={{ cursor: 'pointer', borderRadius: 16 }}
      onClick={onClick}
    >
      <span className="flex-shrink-0 w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-white font-bold text-sm">
        {index + 1}
      </span>
      <div className="flex-1 min-w-0">
        <h4 className="font-display font-semibold text-sm">{step.title}</h4>
        <p className="text-xs opacity-50 truncate">{step.desc}</p>
      </div>
      <ChevronRight size={18} className="opacity-40 group-hover:opacity-100 transition-opacity" />

      {isAdmin && (
        <div className="absolute top-2 right-2">
          <button
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
            className="p-1 rounded-full hover:bg-white/10"
          >
            <MoreVertical size={14} />
          </button>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute right-0 top-full mt-1 glass rounded-xl overflow-hidden min-w-[130px] z-10"
              style={{ padding: 4 }}
            >
              <button
                onClick={(e) => { e.stopPropagation(); onEdit?.(step); setShowMenu(false); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs rounded-lg hover:bg-white/10 text-left"
              >
                <Edit size={12} /> Edit
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete?.(step); setShowMenu(false); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs rounded-lg hover:bg-red-500/20 text-left text-red-400"
              >
                <Trash2 size={12} /> Delete
              </button>
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
}

function StepDetailModal({ steps, current, onClose, onNext, onPrev }) {
  const step = steps[current];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)' }} />

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative liquid-glass w-full max-w-lg p-6 overflow-y-auto"
        style={{ maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10">
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <span className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-white font-bold text-sm">
            {current + 1}
          </span>
          <h3 className="font-display text-xl font-bold">{step.title}</h3>
        </div>

        {step.imageBase64 && (
          <img src={step.imageBase64} alt={step.title} className="w-full rounded-xl mb-4 object-cover max-h-64" />
        )}

        {step.videoUrl && (
          <div className="w-full rounded-xl overflow-hidden mb-4 aspect-video">
            <iframe
              src={step.videoUrl.replace('watch?v=', 'embed/')}
              className="w-full h-full"
              allowFullScreen
              title={step.title}
            />
          </div>
        )}

        <p className="font-body text-sm opacity-80 whitespace-pre-wrap">{step.desc}</p>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={onPrev}
            disabled={current === 0}
            className="btn-glass px-4 py-2 text-sm flex items-center gap-1 disabled:opacity-30"
          >
            <ChevronLeft size={16} /> Previous
          </button>
          <span className="text-xs opacity-40">{current + 1} / {steps.length}</span>
          <button
            onClick={onNext}
            disabled={current === steps.length - 1}
            className="btn-glass px-4 py-2 text-sm flex items-center gap-1 disabled:opacity-30"
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

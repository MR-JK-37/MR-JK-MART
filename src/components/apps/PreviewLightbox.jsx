import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function PreviewLightbox({ images = [], initialIndex = 0, isOpen, onClose }) {
  const [current, setCurrent] = useState(initialIndex);

  const next = (e) => {
    e?.stopPropagation();
    setCurrent((c) => (c + 1) % images.length);
  };
  
  const prev = (e) => {
    e?.stopPropagation();
    setCurrent((c) => (c - 1 + images.length) % images.length);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] flex items-center justify-center"
          onClick={onClose}
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)' }}
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 transition z-10"
          >
            <X size={24} className="text-white" />
          </button>

          {/* Nav arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 transition z-10"
              >
                <ChevronLeft size={24} className="text-white" />
              </button>
              <button
                onClick={next}
                className="absolute right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 transition z-10"
              >
                <ChevronRight size={24} className="text-white" />
              </button>
            </>
          )}

          {/* Image */}
          <motion.img
            key={current}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200 }}
            src={images[current]}
            alt={`Preview ${current + 1}`}
            className="max-w-[90vw] max-h-[80vh] rounded-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Dots */}
          {images.length > 1 && (
            <div className="absolute bottom-8 flex gap-2">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    i === current ? 'gradient-bg w-6' : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

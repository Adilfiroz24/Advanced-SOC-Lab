import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X } from 'lucide-react';
import AIChat from './AIChat';

export default function AIAssistantButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(p => !p)}
        style={{
          position:     'fixed',
          bottom:       24,
          right:        24,
          zIndex:       500,
          width:        50,
          height:       50,
          borderRadius: '50%',
          background:   open
            ? 'rgba(255,45,109,0.15)'
            : 'rgba(0,229,255,0.15)',
          border:       `2px solid ${open ? '#ff2d6d' : '#00e5ff'}`,
          boxShadow:    `0 0 20px ${open ? 'rgba(255,45,109,0.35)' : 'rgba(0,229,255,0.35)'}`,
          cursor:       'pointer',
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'center',
          transition:   'all 0.2s',
        }}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.18 }}>
              <X size={20} color="#ff2d6d" />
            </motion.div>
          ) : (
            <motion.div key="bot"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.18 }}>
              <Bot size={22} color="#00e5ff" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, scale: 0.92, y: 20, x: 20 }}
            animate={{ opacity: 1, scale: 1,    y: 0,  x: 0  }}
            exit={{   opacity: 0, scale: 0.92, y: 20, x: 20  }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            style={{
              position:     'fixed',
              bottom:       84,
              right:        24,
              zIndex:       499,
              width:        400,
              maxHeight:    '75vh',
              background:   'rgba(10,15,30,0.98)',
              border:       '1px solid rgba(0,229,255,0.25)',
              borderRadius: 16,
              boxShadow:    '0 12px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,229,255,0.10)',
              overflow:     'hidden',
              display:      'flex',
              flexDirection:'column',
            }}
          >
            <AIChat onClose={() => setOpen(false)} embedded />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
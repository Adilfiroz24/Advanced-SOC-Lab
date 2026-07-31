import React from 'react';
import { motion } from 'framer-motion';
import { ThreatHunting as ThreatHuntingFeature } from '../features/threat-hunting';

export default function ThreatHunting() {
  return (
    <motion.div
      key="threat-hunting-page"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <ThreatHuntingFeature />
    </motion.div>
  );
}
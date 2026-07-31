import React from 'react';
import { motion } from 'framer-motion';
import { AuditTrail as AuditTrailFeature } from '../features/audit-trail';

export default function AuditTrail() {
  return (
    <motion.div
      key="audit-trail-page"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <AuditTrailFeature />
    </motion.div>
  );
}
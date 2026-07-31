import React from 'react';
import { motion } from 'framer-motion';
import { ReportGenerator } from '../features/report-generator';

export default function Reports() {
  return (
    <motion.div
      key="reports-page"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <ReportGenerator />
    </motion.div>
  );
}
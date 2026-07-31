import React from 'react';
import { motion } from 'framer-motion';
import { AdvancedSearch } from '../features/advanced-search';

export default function Search() {
  return (
    <motion.div
      key="search-page"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <AdvancedSearch />
    </motion.div>
  );
}
import React from 'react';
import { motion } from 'framer-motion';
import { EndpointInventory as EndpointInventoryFeature } from '../features/endpoint-inventory';

export default function EndpointInventory() {
  return (
    <motion.div
      key="endpoint-inventory-page"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <EndpointInventoryFeature />
    </motion.div>
  );
}
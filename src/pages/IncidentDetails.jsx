import React from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { IncidentWorkspace } from '../features/incident-page';

export default function IncidentDetails() {
  const { id }     = useParams();
  const navigate   = useNavigate();

  return (
    <motion.div
      key={`incident-${id}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <IncidentWorkspace
        caseId={id}
        onBack={() => navigate('/cases')}
      />
    </motion.div>
  );
}
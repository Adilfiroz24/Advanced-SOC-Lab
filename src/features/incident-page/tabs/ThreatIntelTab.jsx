import React from 'react';
import { IOCPanel } from '../../ioc-pivoting';

export default function ThreatIntelTab({ caseData }) {
  const handlePivot = (ioc, action) => {
    console.log(`Pivoting on ${ioc.value} via ${action}`);
  };
  return <IOCPanel onPivot={handlePivot} />;
}
import React from 'react';
import { IncidentTimeline } from '../../incident-timeline';

export default function TimelineTab({ caseData }) {
  return <IncidentTimeline caseId={caseData.id} />;
}
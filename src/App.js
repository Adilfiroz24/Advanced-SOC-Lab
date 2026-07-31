// ============================================================
// Advanced SOC Lab — App.js
// All routes including original 21 + 6 new pages
// ============================================================

import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import Sidebar from './components/Sidebar';
import Navbar  from './components/Navbar';

// ── Core monitoring pages ────────────────────────────────
import Dashboard    from './pages/Dashboard';
import Alerts       from './pages/Alerts';
import Cases        from './pages/Cases';
import ThreatIntel  from './pages/ThreatIntel';
import Performance  from './pages/Performance';

// ── Detection pages ──────────────────────────────────────
import DetectionRules from './pages/DetectionRules';
import MITRE          from './pages/MITRE';
import NetworkIDS     from './pages/NetworkIDS';
import Sysmon         from './pages/Sysmon';

// ── Infrastructure pages ─────────────────────────────────
import SIEM            from './pages/SIEM';
import LogCollection   from './pages/LogCollection';
import Honeypot        from './pages/Honeypot';
import Vulnerabilities from './pages/Vulnerabilities';

// ── Automation pages ─────────────────────────────────────
import SOAR       from './pages/SOAR';
import PurpleTeam from './pages/PurpleTeam';
import Caldera    from './pages/Caldera';
import Compliance from './pages/Compliance';

// ── Management pages ─────────────────────────────────────
import Backup          from './pages/Backup';
import AttackSimulator from './pages/AttackSimulator';
import References      from './pages/References';
import Settings        from './pages/Settings';

// ── New enterprise pages ─────────────────────────────────
import IncidentDetails    from './pages/IncidentDetails';
import ThreatHunting      from './pages/ThreatHunting';
import EndpointInventory  from './pages/EndpointInventory';
import Reports            from './pages/Reports';
import AuditTrail         from './pages/AuditTrail';
import Search             from './pages/Search';

// ── AI Assistant (global floating button) ────────────────
import { AIAssistantButton } from './features/ai-assistant';

// ── App-wide context ──────────────────────────────────────
export const AppContext = createContext(null);
export function useAppContext() {
  return useContext(AppContext);
}

function AppShell() {
  const [liveAlertCount, setLiveAlertCount] = useState(12);
  const [notifications,  setNotifications]  = useState(3);

  // Simulate live alert ticker
  useEffect(() => {
    const t = setInterval(() => {
      if (Math.random() > 0.70) {
        setLiveAlertCount(p => p + 1);
        setNotifications(p => Math.min(p + 1, 99));
      }
    }, 8000);
    return () => clearInterval(t);
  }, []);

  return (
    <AppContext.Provider value={{
      liveAlertCount, setLiveAlertCount,
      notifications,  setNotifications,
    }}>
      {/* Cyber grid background */}
      <div className="cyber-grid-bg" />

      <div className="soc-layout" style={{ position: 'relative', zIndex: 1 }}>
        <Sidebar />

        <div className="soc-main">
          <Navbar />

          <div className="soc-content">
            <AnimatePresence mode="wait">
              <Routes>
                {/* ── Default redirect ──────────────────── */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />

                {/* ── Core monitoring ───────────────────── */}
                <Route path="/dashboard"    element={<Dashboard    />} />
                <Route path="/alerts"       element={<Alerts       />} />
                <Route path="/cases"        element={<Cases        />} />
                <Route path="/threat-intel" element={<ThreatIntel  />} />
                <Route path="/performance"  element={<Performance  />} />

                {/* ── Detection ─────────────────────────── */}
                <Route path="/detection-rules" element={<DetectionRules />} />
                <Route path="/mitre"           element={<MITRE          />} />
                <Route path="/network-ids"     element={<NetworkIDS     />} />
                <Route path="/sysmon"          element={<Sysmon         />} />

                {/* ── Infrastructure ────────────────────── */}
                <Route path="/siem"            element={<SIEM            />} />
                <Route path="/log-collection"  element={<LogCollection   />} />
                <Route path="/honeypot"        element={<Honeypot        />} />
                <Route path="/vulnerabilities" element={<Vulnerabilities />} />

                {/* ── Automation ────────────────────────── */}
                <Route path="/soar"        element={<SOAR       />} />
                <Route path="/purple-team" element={<PurpleTeam />} />
                <Route path="/caldera"     element={<Caldera    />} />
                <Route path="/compliance"  element={<Compliance />} />

                {/* ── Management ────────────────────────── */}
                <Route path="/backup"           element={<Backup          />} />
                <Route path="/attack-simulator" element={<AttackSimulator />} />
                <Route path="/references"       element={<References      />} />
                <Route path="/settings"         element={<Settings        />} />

                {/* ── New enterprise pages ──────────────── */}
                {/* Incident details — supports /incident/:id and bare /incident */}
                <Route path="/incident"     element={<IncidentDetails />} />
                <Route path="/incident/:id" element={<IncidentDetails />} />

                {/* Threat hunting */}
                <Route path="/threat-hunting" element={<ThreatHunting />} />

                {/* Endpoint inventory */}
                <Route path="/endpoints" element={<EndpointInventory />} />

                {/* Reports */}
                <Route path="/reports" element={<Reports />} />

                {/* Audit trail */}
                <Route path="/audit" element={<AuditTrail />} />

                {/* Advanced search */}
                <Route path="/search" element={<Search />} />

                {/* ── Catch-all ─────────────────────────── */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Global floating AI assistant button */}
      <AIAssistantButton />
    </AppContext.Provider>
  );
}

export default function App() {
  return (
    <Router>
      <AppShell />
    </Router>
  );
}
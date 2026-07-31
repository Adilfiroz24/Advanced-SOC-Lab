import React, { useEffect, useRef } from 'react';

/**
 * Renders an animated SVG arc from source → target with a
 * travelling dot to simulate an in-progress attack connection.
 * Coordinates are already projected to SVG pixel space.
 */
export default function AnimatedAttackLine({
  x1, y1, x2, y2,
  color = '#ff2d6d',
  duration = 2.5,
  active = true,
  opacity = 0.75,
}) {
  // Control point for the arc (curve upward)
  const dx  = x2 - x1;
  const dy  = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  // Perpendicular offset — scales with distance
  const offset = Math.min(len * 0.35, 120);
  const cx     = (x1 + x2) / 2 - (dy / len) * offset;
  const cy     = (y1 + y2) / 2 + (dx / len) * offset;

  const pathD = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
  const id    = `anim-${Math.round(x1)}-${Math.round(y1)}-${Math.round(x2)}-${Math.round(y2)}`.replace(/\./g,'');

  return (
    <g opacity={opacity}>
      {/* Static faint path */}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={1}
        strokeOpacity={0.28}
        strokeDasharray="4 4"
      />

      {/* Animated bright path — draw-on effect */}
      <path
        id={`path-${id}`}
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeOpacity={0.85}
        strokeLinecap="round"
      >
        <animate
          attributeName="stroke-dashoffset"
          from={len * 2} to={0}
          dur={`${duration}s`}
          repeatCount="indefinite"
        />
        <animate
          attributeName="stroke-dasharray"
          values={`0 ${len * 2};${len * 2} 0`}
          dur={`${duration}s`}
          repeatCount="indefinite"
        />
      </path>

      {/* Travelling dot */}
      {active && (
        <circle r={4} fill={color}
          style={{ filter: `drop-shadow(0 0 5px ${color})` }}>
          <animateMotion
            dur={`${duration}s`}
            repeatCount="indefinite"
            path={pathD}
          />
        </circle>
      )}

      {/* Target burst */}
      <circle cx={x2} cy={y2} r={5}
        fill="none" stroke={color} strokeWidth={1.5}
        strokeOpacity={0.6}
      >
        <animate attributeName="r"
          values="3;10;3" dur={`${duration}s`}
          repeatCount="indefinite" />
        <animate attributeName="stroke-opacity"
          values="0.8;0;0.8" dur={`${duration}s`}
          repeatCount="indefinite" />
      </circle>

      <circle cx={x2} cy={y2} r={3}
        fill={color} fillOpacity={0.9}
        style={{ filter: `drop-shadow(0 0 4px ${color})` }}
      />
    </g>
  );
}
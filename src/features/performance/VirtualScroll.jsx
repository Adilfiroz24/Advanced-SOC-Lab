import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';

/**
 * VirtualScroll
 *
 * Renders only the visible subset of a large list, keeping DOM node
 * count constant regardless of total item count.
 *
 * Props:
 *   items        array     Full data array
 *   itemHeight   number    Fixed row height in px (default: 48)
 *   containerH   number    Visible viewport height in px (default: 480)
 *   renderItem   fn        (item, index, style) => ReactNode
 *   overscan     number    Extra rows rendered above/below (default: 5)
 *   className    string    Optional class on container
 */
export default function VirtualScroll({
  items       = [],
  itemHeight  = 48,
  containerH  = 480,
  renderItem,
  overscan    = 5,
  className,
  style       = {},
}) {
  const containerRef = useRef(null);
  const [scrollTop,  setScrollTop]  = useState(0);

  const totalH     = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex   = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerH) / itemHeight) + overscan
  );

  const visibleItems = useMemo(
    () => items.slice(startIndex, endIndex + 1),
    [items, startIndex, endIndex]
  );

  const handleScroll = useCallback((e) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      onScroll={handleScroll}
      style={{
        height:     containerH,
        overflowY:  'auto',
        overflowX:  'hidden',
        position:   'relative',
        ...style,
      }}
    >
      {/* Total-height spacer */}
      <div style={{ height: totalH, position: 'relative' }}>
        {/* Visible items positioned absolutely */}
        {visibleItems.map((item, i) => {
          const absoluteIndex = startIndex + i;
          const itemStyle = {
            position:  'absolute',
            top:        absoluteIndex * itemHeight,
            left:       0,
            right:      0,
            height:     itemHeight,
            overflow:   'hidden',
          };
          return renderItem
            ? renderItem(item, absoluteIndex, itemStyle)
            : (
              <div key={absoluteIndex} style={itemStyle}>
                {String(item)}
              </div>
            );
        })}
      </div>
    </div>
  );
}
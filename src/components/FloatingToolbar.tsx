import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { AppState, AppAction } from '@/lib/cover-picker-types';
import { SelectionDock } from './SelectionDock';
import { RefineModeBar } from './RefineModeBar';

type SnapPosition = 'left' | 'center' | 'right';

type Props = {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
};

export const FloatingToolbar = ({ state, dispatch }: Props) => {
  const [snap, setSnap] = useState<SnapPosition>('center');
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef(0);
  const dragStartSnap = useRef<SnapPosition>('center');

  const getSnapStyle = (pos: SnapPosition): React.CSSProperties => {
    switch (pos) {
      case 'left':
        return { left: 24, right: 'auto', transform: 'none' };
      case 'right':
        return { right: 24, left: 'auto', transform: 'none' };
      case 'center':
      default:
        return { left: '50%', right: 'auto', transform: 'translateX(-50%)' };
    }
  };

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Don't start drag on buttons/inputs
    if ((e.target as HTMLElement).closest('button, input, textarea')) return;
    setIsDragging(true);
    dragStartX.current = e.clientX;
    dragStartSnap.current = snap;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [snap]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartX.current;
    const threshold = 100;

    if (dragStartSnap.current === 'center') {
      if (dx < -threshold) setSnap('left');
      else if (dx > threshold) setSnap('right');
      else setSnap('center');
    } else if (dragStartSnap.current === 'left') {
      if (dx > threshold) setSnap('center');
      if (dx > threshold * 2.5) setSnap('right');
    } else if (dragStartSnap.current === 'right') {
      if (dx < -threshold) setSnap('center');
      if (dx < -threshold * 2.5) setSnap('left');
    }
  }, [isDragging]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const style = getSnapStyle(snap);

  return (
    <motion.div
      ref={containerRef}
      layout
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed bottom-6 z-40"
      style={{
        ...style,
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {state.mode === 'refine' ? (
        <RefineModeBar state={state} dispatch={dispatch} />
      ) : (
        <SelectionDock state={state} dispatch={dispatch} />
      )}
    </motion.div>
  );
};

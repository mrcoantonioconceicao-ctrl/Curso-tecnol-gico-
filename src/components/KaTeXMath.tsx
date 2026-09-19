import React, { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface KaTeXMathProps {
  math: string;
  block?: boolean;
  displayMode?: boolean;
  className?: string;
}

export const KaTeXMath: React.FC<KaTeXMathProps> = ({ math, block = false, displayMode, className = '' }) => {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      try {
        katex.render(math, containerRef.current, {
          displayMode: displayMode !== undefined ? displayMode : block,
          throwOnError: false,
        });
      } catch (e) {
        console.error('KaTeX rendering error:', e);
      }
    }
  }, [math, block, displayMode]);

  return <span ref={containerRef} className={`inline-block ${className}`} />;
};

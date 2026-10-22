import React from 'react';
import { useInView } from '../hooks/useInView';

type InViewProps = React.HTMLAttributes<HTMLDivElement> & {
  /** 'items' = anak langsung .mo-item; 'line' = anak langsung .mo-line (garis timeline) */
  scope?: 'items' | 'line';
};

/** Wrapper div yang memberi data-inview="true" begitu terlihat (memakai hooks/useInView yang sudah ada). */
export const InView: React.FC<InViewProps> = ({ scope = 'items', className = '', children, ...rest }) => {
  const { ref, isInView } = useInView<HTMLDivElement>(0, '0px 0px 15% 0px');
  return (
    <div
      ref={ref}
      data-inview={isInView}
      className={`${scope === 'line' ? 'mo-scope-line' : 'mo-scope'} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
};

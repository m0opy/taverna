import type {ReactNode} from 'react';

import './centered-surface.css';

interface CenteredSurfaceProps {
  children: ReactNode;
  className?: string;
  panelClassName?: string;
  top?: ReactNode;
}

export function CenteredSurface({children, className, panelClassName, top}: CenteredSurfaceProps) {
  return (
    <main className={className ? `centered-page ${className}` : 'centered-page'}>
      {top}
      <section className={panelClassName ? `centered-surface__panel ${panelClassName}` : 'centered-surface__panel'}>{children}</section>
    </main>
  );
}

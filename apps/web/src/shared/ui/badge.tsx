import type {ReactNode} from 'react';

import './badge.css';

interface BadgeProps {
  children: ReactNode;
  size?: 'default' | 'small';
}

export function Badge({children, size = 'default'}: BadgeProps) {
  return <span className={`badge badge--${size}`}>{children}</span>;
}

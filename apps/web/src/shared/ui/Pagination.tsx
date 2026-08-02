import {Pagination as GravityPagination} from '@gravity-ui/uikit';
import type {PaginationProps as GravityPaginationProps} from '@gravity-ui/uikit';

export interface PaginationProps extends Omit<GravityPaginationProps, 'className'> {
  ariaLabel: string;
  className?: string | undefined;
}

export function Pagination({ariaLabel, className, ...props}: PaginationProps) {
  return (
    <nav aria-label={ariaLabel} className={className}>
      <GravityPagination {...props} />
    </nav>
  );
}

import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 overflow-hidden rounded-none bg-card p-4 text-xs/relaxed text-card-foreground ring-1 ring-foreground/10',
        className
      )}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: ComponentProps<'h2'>) {
  return <h2 className={cn('text-sm font-semibold', className)} {...props} />;
}

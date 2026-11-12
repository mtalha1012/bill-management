import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';
import { fieldClass } from './input';

export function Select({ className, ...props }: ComponentProps<'select'>) {
  return <select className={cn(fieldClass, 'cursor-pointer capitalize', className)} {...props} />;
}

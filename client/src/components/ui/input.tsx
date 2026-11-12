import { Input as InputPrimitive } from '@base-ui/react/input';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export const fieldClass =
  'h-8 w-full min-w-0 rounded-none border border-input bg-transparent px-2.5 py-1 text-xs transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30';

export function Input({ className, ...props }: ComponentProps<typeof InputPrimitive>) {
  return <InputPrimitive className={cn(fieldClass, className)} {...props} />;
}

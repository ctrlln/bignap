
import React from 'react';
import clsx from 'clsx';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: 'default' | 'secondary' | 'outline' | 'destructive';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
    return (
        <span
            className={clsx(
                'inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                {
                    'bg-primary text-primary-foreground hover:bg-primary/80': variant === 'default',
                    'bg-secondary text-secondary-foreground hover:bg-secondary/80': variant === 'secondary',
                    'text-foreground border border-input hover:bg-accent hover:text-accent-foreground': variant === 'outline',
                    'bg-red-500 text-white hover:bg-red-600': variant === 'destructive',
                },
                className
            )}
            {...props}
        />
    );
}

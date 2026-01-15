import React from 'react';
import { cn } from "../../lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function Button({ className, variant = 'default', size = 'default', ...props }: ButtonProps) {
    return (
        <button
            className={cn(
                'inline-flex items-center justify-center white-space-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ring-offset-background',
                {
                    'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'default',
                    'bg-secondary text-secondary-foreground hover:bg-secondary/80': variant === 'secondary',
                    'border border-input bg-background hover:bg-accent hover:text-accent-foreground': variant === 'outline',
                    'hover:bg-accent hover:text-accent-foreground': variant === 'ghost',
                    'text-primary underline-offset-4 hover:underline': variant === 'link',

                    'h-9 px-4 py-2': size === 'default',
                    'h-8 rounded-md px-3 text-xs': size === 'sm',
                    'h-10 rounded-md px-8': size === 'lg',
                    'h-9 w-9': size === 'icon',
                },
                className
            )}
            {...props}
        />
    );
}

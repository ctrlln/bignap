
import React from 'react';
import clsx from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

export function Card({ className, children, ...props }: CardProps) {
    return (
        <div
            className={clsx(
                'bg-card text-card-foreground rounded-lg border border-border shadow-sm',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

export function CardHeader({ className, children, ...props }: CardProps) {
    return (
        <div className={clsx('flex flex-col space-y-1.5 p-6', className)} {...props}>
            {children}
        </div>
    );
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    return (
        <h3 className={clsx('font-semibold leading-none tracking-tight', className)} {...props}>
            {children}
        </h3>
    );
}

export function CardContent({ className, children, ...props }: CardProps) {
    return (
        <div className={clsx('p-6 pt-0', className)} {...props}>
            {children}
        </div>
    );
}

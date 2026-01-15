import { Loader2 } from 'lucide-react';

export function LoadingState({ message = 'Loading...' }: { message?: string }) {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-muted-foreground animate-in fade-in duration-300">
            <Loader2 className="h-10 w-10 animate-spin mb-4 text-primary" />
            <p className="text-sm font-medium">{message}</p>
        </div>
    );
}

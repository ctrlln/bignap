
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export interface Comment {
    id: string;
    text: string;
    route: string;
    timestamp: string;
    author: string;
}

interface FeedbackContextType {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    comments: Comment[];
    addComment: (text: string) => void;
    currentRouteComments: Comment[];
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [comments, setComments] = useState<Comment[]>([]);
    const location = useLocation();

    // Load from local storage on mount
    useEffect(() => {
        const saved = localStorage.getItem('bignap_feedback');
        if (saved) {
            try {
                setComments(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse feedback:', e);
            }
        }
    }, []);

    // Save to local storage on change
    useEffect(() => {
        localStorage.setItem('bignap_feedback', JSON.stringify(comments));
    }, [comments]);

    const addComment = (text: string) => {
        const newComment: Comment = {
            id: crypto.randomUUID(),
            text,
            route: location.pathname,
            timestamp: new Date().toISOString(),
            author: 'Designer', // Hardcoded for now, could be dynamic later
        };
        setComments((prev) => [newComment, ...prev]);
    };

    const currentRouteComments = comments.filter((c) => c.route === location.pathname);

    return (
        <FeedbackContext.Provider
            value={{
                isOpen,
                setIsOpen,
                comments,
                addComment,
                currentRouteComments,
            }}
        >
            {children}
        </FeedbackContext.Provider>
    );
}

export function useFeedback() {
    const context = useContext(FeedbackContext);
    if (context === undefined) {
        throw new Error('useFeedback must be used within a FeedbackProvider');
    }
    return context;
}


import { MessageSquare, X } from 'lucide-react';
import { useFeedback } from '../../contexts/FeedbackContext';
import { Button } from '../ui/Button';

export function FeedbackTrigger() {
    const { isOpen, setIsOpen, comments } = useFeedback();

    return (
        <Button
            size="icon"
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-slate-800 hover:bg-slate-900 text-white border-2 border-slate-700"
            onClick={() => setIsOpen(!isOpen)}
        >
            {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
            {!isOpen && comments.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-slate-800">
                    {comments.length}
                </span>
            )}
        </Button>
    );
}

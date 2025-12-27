
import { useState } from 'react';
import { Send, User, ChevronDown, UserCog } from 'lucide-react';
import clsx from 'clsx';
import { useFeedback } from '../../contexts/FeedbackContext';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';


function PersonaSwitcher() {
    const { user, loginAsRole, availableRoles } = useAuth();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-slate-800 border border-slate-700 rounded p-2 flex items-center justify-between text-left hover:bg-slate-800/80 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <UserCog size={16} className="text-slate-400" />
                    <div>
                        <div className="text-[10px] text-slate-500 uppercase">Viewing As</div>
                        <div className="font-bold text-slate-200">{user ? user.role.replace('_', ' ') : 'Guest'}</div>
                    </div>
                </div>
                <ChevronDown size={14} className="text-slate-500" />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 w-full mt-1 bg-slate-800 border border-slate-700 rounded shadow-xl overflow-hidden z-50">
                    <div className="p-2 text-[10px] text-slate-500 uppercase border-b border-slate-700 bg-slate-900/50">Switch Role</div>
                    {availableRoles.map(role => (
                        <button
                            key={role}
                            onClick={() => {
                                loginAsRole(role);
                                setIsOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-emerald-500/20 hover:text-emerald-400 transition-colors capitalize text-slate-300"
                        >
                            {role.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export function FeedbackDrawer() {
    const { isOpen, currentRouteComments, comments, addComment } = useFeedback();
    const [newComment, setNewComment] = useState('');
    const [showAll, setShowAll] = useState(false);

    // if (!isOpen) return null; // We keep it rendered for transition but maybe hidden? No, existing logic was fine.
    // Actually the existing logic was `translate-x-full` so it's always rendered.
    // Wait, the original had `if (!isOpen) return null`? No, the original used transform.
    // Let's check the previous file content. 
    // Ah, line 56: `if (!isOpen) return null;`
    // BUT the transform class logic was `isOpen ? "translate-x-0" : "translate-x-full"`.
    // If it returns null, the transform transition won't work.
    // Ideally we remove that line so the drawer slides.
    // However, for now let's stick to the previous behavior if I can't be sure.
    // Looking at the view_file, line 56 is indeed `if (!isOpen) return null;`.
    // That means the slide-out effect was probably broken or instant.
    // I will REMOVE that line to enable the slide effect properly, as that's a UI improvement.

    const displayComments = showAll ? comments : currentRouteComments;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newComment.trim()) {
            addComment(newComment);
            setNewComment('');
        }
    };

    return (
        <div
            className={clsx(
                "fixed top-0 right-0 h-full w-full md:w-80 bg-slate-900 text-slate-100 shadow-2xl z-40 transform transition-transform duration-300 ease-in-out border-l border-slate-700 flex flex-col font-mono text-sm",
                isOpen ? "translate-x-0" : "translate-x-full"
            )}
        >
            <div className="p-4 border-b border-slate-700 bg-slate-950/50">
                <h2 className="font-bold flex items-center gap-2 text-emerald-400 uppercase tracking-wider text-xs mb-3">
                    Design Inspector
                </h2>

                {/* Persona Switcher */}
                <PersonaSwitcher />
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {displayComments.length === 0 ? (
                    <div className="text-center text-slate-500 py-8 italic">
                        No comments yet on this page.
                    </div>
                ) : (
                    displayComments.map((comment) => (
                        <div key={comment.id} className="bg-slate-800/50 p-3 rounded border border-slate-700/50">
                            <div className="flex justify-between items-start mb-1 text-xs text-slate-400">
                                <span className="flex items-center gap-1 font-bold text-slate-300">
                                    <User size={12} /> {comment.author}
                                </span>
                                <span>{new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="text-slate-200 leading-relaxed">{comment.text}</p>
                            {showAll && (
                                <div className="mt-2 text-[10px] text-slate-500 uppercase">
                                    Page: {comment.route}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            <div className="p-4 border-t border-slate-700 bg-slate-950/30">
                <div className="flex items-center justify-between mb-4 text-xs">
                    <span className="text-slate-400">Filter:</span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowAll(false)}
                            className={clsx("px-2 py-1 rounded transition-colors", !showAll ? "bg-slate-700 text-white" : "text-slate-500 hover:text-slate-300")}
                        >
                            Current Page
                        </button>
                        <button
                            onClick={() => setShowAll(true)}
                            className={clsx("px-2 py-1 rounded transition-colors", showAll ? "bg-slate-700 text-white" : "text-slate-500 hover:text-slate-300")}
                        >
                            All
                        </button>
                    </div>
                </div>
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Type a comment..."
                        className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                    />
                    <Button type="submit" size="icon" className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white border-none">
                        <Send size={16} />
                    </Button>
                </form>
            </div>
        </div>
    );
}

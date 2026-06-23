const Toast = ({ message, actionLabel, onAction }) => {
    if (!message) return null;

    return (
        <div className="fixed right-4 top-24 z-50 flex max-w-xs items-center gap-3 rounded-3xl border border-emerald-500/20 bg-slate-950/95 px-4 py-3 text-sm text-emerald-200 shadow-2xl backdrop-blur-xl">
            <span>{message}</span>
            {actionLabel && onAction && (
                <button
                    type="button"
                    onClick={onAction}
                    className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-300/20 focus:outline-none focus:ring-2 focus:ring-emerald-200/35"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
};

export default Toast;

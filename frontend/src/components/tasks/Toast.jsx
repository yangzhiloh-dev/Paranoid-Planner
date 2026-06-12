const Toast = ({ message }) => {
    if (!message) return null;

    return (
        <div className="fixed right-4 top-24 z-50 max-w-xs rounded-3xl border border-emerald-500/20 bg-slate-950/95 px-4 py-3 text-sm text-emerald-200 shadow-2xl backdrop-blur-xl">
            {message}
        </div>
    );
};

export default Toast;

const Toast = ({ message }) => {
    if (!message) return null;

    return (
        <div className="fixed right-4 top-24 z-50 max-w-xs rounded-2xl bg-emerald-600 px-4 py-3 text-sm text-white shadow-xl">
            {message}
        </div>
    );
};

export default Toast;

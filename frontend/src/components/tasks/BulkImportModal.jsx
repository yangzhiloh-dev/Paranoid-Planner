const BulkImportModal = ({ bulkImportText, setBulkImportText, onClose, onSubmit, feedback }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="w-full max-w-2xl rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-glow backdrop-blur-2xl text-slate-100">
            <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-semibold text-white">Bulk Import Tasks</h2>
                    <p className="mt-1 text-sm text-slate-400">
                        Paste one task per line. If module code is present it will be used, otherwise first module is fallback.
                    </p>
                </div>

                <button type="button" onClick={onClose} className="rounded-full bg-white/10 px-3 py-2 text-xl text-slate-100 transition hover:bg-white/15">
                    ✕
                </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
                <textarea
                    rows="8"
                    value={bulkImportText}
                    onChange={(e) => setBulkImportText(e.target.value)}
                    placeholder="CS2030 Assignment 1 - Friday\nST2334 Quiz - Sunday"
                    className="glass-input w-full min-h-[220px]"
                />

                {feedback && (
                    <p className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-200">
                        {feedback}
                    </p>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                        Cancel
                    </button>
                    <button type="submit" className="rounded-full bg-amber-300 px-6 py-3 text-sm font-semibold text-slate-950 shadow-md transition hover:bg-amber-400">
                        Import Tasks
                    </button>
                </div>
            </form>
        </div>
    </div>
);

export default BulkImportModal;

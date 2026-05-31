const BulkImportModal = ({ bulkImportText, setBulkImportText, onClose, onSubmit, feedback }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-2xl rounded-3xl bg-white p-8 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">📥 Bulk Import Tasks</h2>
                    <p className="mt-1 text-sm text-slate-600">
                        Paste one task per line. If module code is present it will be used, otherwise first module is fallback.
                    </p>
                </div>

                <button type="button" onClick={onClose} className="text-slate-400 text-xl">
                    ✕
                </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
                <textarea
                    rows="8"
                    value={bulkImportText}
                    onChange={(e) => setBulkImportText(e.target.value)}
                    placeholder="CS2030 Assignment 1 - Friday\nST2334 Quiz - Sunday"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4"
                />

                {feedback && (
                    <p className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700 border border-slate-200">
                        {feedback}
                    </p>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700"
                    >
                        Cancel
                    </button>
                    <button type="submit" className="rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white">
                        Import Tasks
                    </button>
                </div>
            </form>
        </div>
    </div>
);

export default BulkImportModal;

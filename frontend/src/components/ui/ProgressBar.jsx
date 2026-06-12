import React from 'react';

// ProgressBar: minimal, editorial style. Accepts `value` 0-100.
export default function ProgressBar({ value = 0, className = '' }) {
    const pct = Math.max(0, Math.min(100, Math.round(value)));

    return (
        <div className={`h-2 rounded-full bg-slate-700/40 overflow-hidden ${className}`} aria-hidden>
            <div
                style={{ width: `${pct}%` }}
                className="h-full bg-amber-500/80 transition-all duration-400 ease-out"
            />
        </div>
    );
}

import React from 'react';

// Badge: small, informative label used inline in cards and lists.
// Visual purpose: subtle background, small uppercase text, helps draw attention
// without heavy borders. Use `variant` to pick contextual colors.
export default function Badge({ children, variant = 'muted', className = '' }) {
    const base = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-widest';

    const variants = {
        muted:  'bg-white/8 text-slate-300 border border-white/10',
        warn:   'bg-amber-500/15 text-amber-200 border border-amber-400/15',
        high:   'bg-orange-600/20 text-orange-200 border border-orange-500/15',
        done:   'bg-emerald-800/30 text-emerald-300 border border-emerald-600/20',
        closed: 'bg-slate-700/40 text-slate-400 border border-slate-600/20',
    };

    return <span className={`${base} ${variants[variant] || variants.muted} ${className}`}>{children}</span>;
}

import React from 'react';

// Badge: small, informative label used inline in cards and lists.
// Visual purpose: subtle background, small uppercase text, helps draw attention
// without heavy borders. Use `variant` to pick contextual colors.
export default function Badge({ children, variant = 'muted', className = '' }) {
    const base = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-widest';

    const variants = {
        muted: 'bg-editorial-beige text-editorial-wood',
        warn: 'bg-editorial-terracotta/10 text-editorial-terracotta',
        high: 'bg-editorial-terracotta/20 text-editorial-wood',
    };

    return <span className={`${base} ${variants[variant] || variants.muted} ${className}`}>{children}</span>;
}

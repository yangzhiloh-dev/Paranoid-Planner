import React from 'react';

// EmptyState: decorative, friendly placeholder with light illustration.
// Keep simple SVG so it's lightweight in production.
export default function EmptyState({ title = 'Nothing here yet', subtitle = '', className = '' }) {
    return (
        <div className={`flex flex-col items-center gap-4 text-center text-editorial-muted ${className}`}>
            <svg width="96" height="64" viewBox="0 0 96 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <rect x="2" y="8" width="92" height="48" rx="8" fill="#F6EFE6" />
                <rect x="10" y="18" width="28" height="8" rx="2" fill="#E9DCC9" />
                <rect x="10" y="30" width="60" height="6" rx="2" fill="#E9DCC9" />
                <rect x="10" y="40" width="44" height="6" rx="2" fill="#E9DCC9" />
            </svg>
            <div>
                <p className="text-sm font-semibold text-editorial-ink">{title}</p>
                {subtitle && <p className="mt-1 text-xs">{subtitle}</p>}
            </div>
        </div>
    );
}

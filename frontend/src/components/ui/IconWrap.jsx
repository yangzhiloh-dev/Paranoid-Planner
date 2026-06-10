import React from 'react';

// IconWrap: subtle circular background for sidebar icons and inline icons.
export default function IconWrap({ children, className = '' }) {
    return (
        <span className={`inline-flex items-center justify-center h-8 w-8 rounded-md bg-editorial-beige text-editorial-wood ${className}`}>
            {children}
        </span>
    );
}

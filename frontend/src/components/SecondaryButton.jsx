import React from 'react';

const SecondaryButton = ({
  children,
  disabled = false,
  type = 'button',
  className = '',
  style = {},
  ...rest
}) => {
  const baseStyle = {
    minWidth: 'auto',
    color: '#F5F2EA',
    fontWeight: 700,
    padding: '12px 18px',
    borderRadius: '9999px',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.12)',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.72 : 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    transition: 'transform 200ms ease, box-shadow 200ms ease, opacity 200ms ease',
  };

  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 ${className}`}
      style={{ ...baseStyle, ...style }}
      {...rest}
    >
      {children}
    </button>
  );
};

export default SecondaryButton;

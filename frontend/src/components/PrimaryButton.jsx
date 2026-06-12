import React from 'react';

const PrimaryButton = ({
  children,
  loading = false,
  disabled = false,
  type = 'submit',
  variant = 'primary',
  className = '',
  style = {},
  ...rest
}) => {
  const common = {
    minWidth: 'auto',
    color: '#F5F2EA',
    fontWeight: 700,
    padding: '12px 18px',
    borderRadius: '9999px',
    cursor: loading || disabled ? 'not-allowed' : 'pointer',
    opacity: loading || disabled ? 0.72 : 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    textAlign: 'center',
    transition: 'transform 200ms ease, box-shadow 200ms ease, opacity 200ms ease',
  };

  const variants = {
    primary: {
      ...common,
      background: 'linear-gradient(135deg, #F59E0B, #D97706)',
      border: '1px solid rgba(255,255,255,0.10)',
      boxShadow: '0 16px 40px rgba(245,158,11,0.22)',
      color: '#0B0B0D',
    },
    secondary: {
      ...common,
      background: 'rgba(255,255,255,0.08)',
      border: '1px solid rgba(255,255,255,0.12)',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      color: '#F5F2EA',
    },
    danger: {
      ...common,
      background: '#EF4444',
      border: '1px solid rgba(239,68,68,0.18)',
      color: '#FFFFFF',
    },
    glass: {
      ...common,
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.12)',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      color: '#F5F2EA',
    },
  };

  const variantStyle = variants[variant] || variants.primary;

  const Spinner = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 50 50" fill="none" aria-hidden="true" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <circle cx="25" cy="25" r="20" stroke="rgba(255,255,255,0.35)" strokeWidth="5" strokeLinecap="round" />
      <path d="M45 25a20 20 0 0 1-20 20" stroke="#F59E0B" strokeWidth="5" strokeLinecap="round" fill="none">
        <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite" />
      </path>
    </svg>
  );

  return (
    <button
      type={type}
      disabled={loading || disabled}
      className={`inline-flex items-center justify-center gap-2 ${className}`}
      style={{ ...variantStyle, ...style }}
      {...rest}
    >
      {loading ? (
        <>
          <Spinner />
          {typeof children === 'string' ? children : 'Loading...'}
        </>
      ) : (
        children
      )}
    </button>
  );
};

export { PrimaryButton };
export default PrimaryButton;
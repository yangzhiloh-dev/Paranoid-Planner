import React from 'react';

//reusable button component to be used for consistent styling across the app
const PrimaryButton = ({ children, loading = false, disabled = false, type = 'submit', variant = 'glass', className = '', style = {}, ...rest }) => {
  const common = {
    width: '100%',
    color: '#000',
    fontWeight: 600,
    padding: '12px 16px',
    borderRadius: '12px',
    marginTop: '8px',
    cursor: loading || disabled ? 'not-allowed' : 'pointer',
    opacity: loading || disabled ? 0.7 : 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    textAlign: 'center'
  };

  const glassStyle = {
    ...common,
    background: 'linear-gradient(135deg, rgba(37,99,235,0.18), rgba(37,99,235,0.08))',
    border: '1px solid rgba(255,255,255,0.12)',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)'
  };

  const solidStyle = {
    ...common,
    backgroundColor: '#2563eb',
    border: 'none',
    display: 'block'
  };

  const baseStyle = variant === 'solid' ? solidStyle : glassStyle;

  const Spinner = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 50 50" fill="none" aria-hidden="true" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <circle cx="25" cy="25" r="20" stroke="rgba(0,0,0,0.12)" strokeWidth="6" strokeLinecap="round" />
      <path d="M45 25a20 20 0 0 1-20 20" stroke="rgba(0,0,0,0.9)" strokeWidth="6" strokeLinecap="round" fill="none">
        <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite" />
      </path>
    </svg>
  );

  return (
    <button type={type} disabled={loading || disabled} className={className} style={{ ...baseStyle, ...style }} {...rest}>
      {loading ? (<><Spinner />{typeof children === 'string' ? children : 'Loading...'}</>) : children}
    </button>
  );
};

export { PrimaryButton };
export default PrimaryButton;
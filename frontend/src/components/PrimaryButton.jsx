import React from 'react';

const PrimaryButton = ({ children, loading = false, disabled = false, type = 'submit', className = '', style = {}, ...rest }) => {
  const baseStyle = {
    width: '100%',
    backgroundColor: '#2563eb',
    color: '#000000',
    fontWeight: 600,
    padding: '12px 16px',
    borderRadius: '12px',
    border: 'none',
    marginTop: '8px',
    cursor: loading || disabled ? 'not-allowed' : 'pointer',
    opacity: loading || disabled ? 0.7 : 1,
    display: 'block',
  };

  return (
    <button
      type={type}
      disabled={loading || disabled}
      className={className}
      style={{ ...baseStyle, ...style }}
      {...rest}
    >
      {loading ? (typeof children === 'string' ? children : 'Loading...') : children}
    </button>
  );
};

export default PrimaryButton;
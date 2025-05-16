import React from "react";

const FLIPFLOP_LOGO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAALpJREFUWEftl8ENgDAIRdtVPLqgM7igR1fRxASjCLTfpKUHPDYf+H1FtDk5P9m5fhrewKEQ0oyj+iIBNCGqVw1ciaZtEQHs80rrRALV33lNlB4GzJ2QbZSAEfc5AtEAFSQiJQNc/9vAo5A2Ll49oIkM4zIBnkhIIDYhLRp6HmcbaNCEdQa0wm5NyI+k1IRaLwhxdW9BGOhJgGqhsx3Vj/stCAJBIAgEAT510d9sVD/uvaDblXH4u2FzEidM+r4hLxAZWgAAAABJRU5ErkJgggAA';

const poweredByStyle = {
  display: 'flex',
  padding: '0.5rem 0.75rem',
  fontSize: '0.75rem',
  backgroundColor: '#d1d5db',
  color: '#4b5563',
  borderRadius: '9999px',
  justifyContent: 'center',
  alignItems: 'center',
  width: 'fit-content',
};

const logoStyle = {
  height: '1rem',
  width: '1rem',
  marginLeft: '0.5rem',
  marginRight: '0.5rem',
  flexShrink: 0,
};

const linkStyle = {
  color: 'inherit',
  fontWeight: 'bold',
  textDecoration: 'none',
};

const FlipflopLogo = () => {
  return (
    <div style={poweredByStyle}>
      <div>Supported by</div>
      <img src={FLIPFLOP_LOGO} alt="FlipFlop" style={logoStyle} />
      <a href="https://flipflop.plus" target="_blank" rel="noopener noreferrer" style={linkStyle}>flipflop.plus</a>
    </div>
  );
}

export default FlipflopLogo;
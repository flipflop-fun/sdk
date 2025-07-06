import React, { JSX } from 'react';

type UrcButtonProps = {
  name: string;
};

const UrcButton = ({ name }: UrcButtonProps): JSX.Element => {
  return (
    <div className="greeting" style={{ padding: '10px', border: '1px solid #ccc' }}>
      <h1>Hello, {name || 'World'}! Welcome to flipflop sdk</h1>
    </div>
  );
};

export default UrcButton;
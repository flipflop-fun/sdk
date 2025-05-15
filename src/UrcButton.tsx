import React, { FC } from 'react';

type UrcButtonProps = {
  name: string;
};

const UrcButton: FC<UrcButtonProps> = ({ name }) => {
  return (
    <div className="greeting" style={{ padding: '10px', border: '1px solid #ccc' }}>
      <h1>Hello, {name || 'World'}! Welcome to flipflop sdk</h1>
    </div>
  );
};

export default UrcButton;
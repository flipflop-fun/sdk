import React from 'react';
import PropTypes from 'prop-types';

const GreetingComponent = ({ name }) => {
  return (
    <div className="greeting" style={{ padding: '10px', border: '1px solid #ccc' }}>
      <h1>Hello, {name || 'World'}!</h1>
    </div>
  );
};

GreetingComponent.propTypes = {
  name: PropTypes.string,
};

GreetingComponent.defaultProps = {
  name: '',
};

export default GreetingComponent;
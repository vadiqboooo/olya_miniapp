import React from 'react';
import './Loader.css';

const Loader = ({ size = 'medium' }) => {
  return (
    <div className={`loader-container loader-${size}`}>
      <div className="spinner"></div>
    </div>
  );
};

export default Loader;
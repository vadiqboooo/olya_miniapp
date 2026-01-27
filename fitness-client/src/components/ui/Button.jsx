import React from 'react';
import './Button.css'; // Мы создадим inline-стили или CSS модуль, но для простоты подключим файл

const Button = ({ children, onClick, disabled, isLoading, variant = 'primary', fullWidth = false }) => {
  return (
    <button
      className={`btn btn-${variant} ${fullWidth ? 'btn-full' : ''}`}
      onClick={onClick}
      disabled={disabled || isLoading}
    >
      {isLoading ? <span className="spinner"></span> : children}
    </button>
  );
};

export default Button;
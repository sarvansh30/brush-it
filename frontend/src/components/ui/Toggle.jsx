import React from 'react';

const Toggle = ({ 
  pressed = false, 
  onPressedChange, 
  children, 
  size = 'md', 
  className = '',
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 transform active:scale-95';
  
  const sizes = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-sm'
  };
  
  const stateClasses = pressed 
    ? 'bg-blue-500 text-white shadow-md' 
    : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50';
  
  return (
    <button
      className={`${baseClasses} ${sizes[size]} ${stateClasses} ${className}`}
      onClick={() => onPressedChange && onPressedChange(!pressed)}
      {...props}
    >
      {children}
    </button>
  );
};

export default Toggle;
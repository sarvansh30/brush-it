import React from 'react';

const Slider = ({ 
  value = [0], 
  onValueChange, 
  min = 0, 
  max = 100, 
  step = 1, 
  className = '' 
}) => {
  const handleChange = (e) => {
    const newValue = parseInt(e.target.value);
    onValueChange?.([newValue]);
  };
  
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value[0]}
      onChange={handleChange}
      className={`slider ${className}`}
      style={{
        background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((value[0] - min) / (max - min)) * 100}%, #e5e7eb ${((value[0] - min) / (max - min)) * 100}%, #e5e7eb 100%)`
      }}
    />
  );
};

export default Slider;
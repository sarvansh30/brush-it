const Separator = ({ orientation = 'horizontal', className = '' }) => {
  const classes = orientation === 'vertical' 
    ? 'w-px bg-gray-300' 
    : 'h-px bg-gray-300';
  
  return <div className={`${classes} ${className}`} />;
};

export default Separator ;
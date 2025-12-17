import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "py-4 px-6 rounded-2xl font-bold text-lg transition-all active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-orange-500/30",
    secondary: "bg-white text-gray-800 border-2 border-gray-100 hover:border-orange-200 shadow-gray-200/50",
    danger: "bg-red-500 text-white shadow-red-500/30",
    outline: "border-2 border-orange-500 text-orange-600 bg-transparent hover:bg-orange-50",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
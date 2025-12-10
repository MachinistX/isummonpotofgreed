import React from 'react';

export const Button = ({ children, variant = 'primary', className = '', ...props }) => {
    const baseStyles = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 active:scale-95",
        secondary: "bg-slate-700 hover:bg-slate-600 text-slate-100 active:scale-95",
        danger: "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/20 active:scale-95",
        ghost: "text-slate-400 hover:text-white hover:bg-slate-800",
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

import React from 'react';

export const Input = ({ className = '', ...props }) => {
    return (
        <input
            className={`bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-500 transition-all ${className}`}
            {...props}
        />
    );
};

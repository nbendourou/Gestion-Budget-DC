
import React from 'react';

export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
    const sizeClasses = {
        sm: 'h-5 w-5 border-2',
        md: 'h-8 w-8 border-4',
        lg: 'h-12 w-12 border-4',
    };

    return (
        <div className={`
            ${sizeClasses[size]}
            rounded-full border-slate-200 dark:border-slate-700 border-t-indigo-600 dark:border-t-indigo-400 animate-spin
        `}
        ></div>
    );
};

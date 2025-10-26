
import React from 'react';
import { ToastMessage } from '../types';
import { CheckCircleIcon, XCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ToastContainerProps {
    toasts: ToastMessage[];
    removeToast: (id: number) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
    return (
        <div className="fixed top-5 right-5 z-50 w-full max-w-xs space-y-3">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`
                        flex items-start p-4 rounded-lg shadow-lg text-white
                        ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}
                        animate-fade-in-right
                    `}
                >
                    <div className="flex-shrink-0">
                        {toast.type === 'success' ? (
                            <CheckCircleIcon className="h-6 w-6" />
                        ) : (
                            <XCircleIcon className="h-6 w-6" />
                        )}
                    </div>
                    <div className="ml-3 flex-1">
                        <p className="text-sm font-medium">{toast.message}</p>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex">
                        <button onClick={() => removeToast(toast.id)} className="inline-flex rounded-md text-white hover:text-gray-100 focus:outline-none">
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

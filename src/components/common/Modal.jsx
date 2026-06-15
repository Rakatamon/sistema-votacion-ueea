import React from 'react';
import { AlertTriangle } from 'lucide-react';

const Modal = ({ show, onClose, onConfirm, title, children, confirmText = "Confirmar", cancelText = "Cancelar", danger = false }) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className={`bg-white rounded-lg shadow-xl p-6 w-full max-w-sm transform transition-all`}>
                <div className="flex items-start">
                    <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${danger ? 'bg-red-100' : 'bg-blue-100'}`}>
                        <AlertTriangle className={`${danger ? 'text-red-600' : 'text-blue-600'}`} size={24} />
                    </div>
                    <div className="ml-4 text-left">
                        <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                            {title}
                        </h3>
                        <div className="mt-2">
                            <p className="text-sm text-gray-500">
                                {children}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <button
                        type="button"
                        onClick={onConfirm}
                        className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white ${danger ? `bg-red-600 hover:bg-red-700 focus:ring-red-500` : `bg-blue-600 hover:bg-blue-700 focus:ring-blue-500`} focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm`}
                    >
                        {confirmText}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                    >
                        {cancelText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Modal;

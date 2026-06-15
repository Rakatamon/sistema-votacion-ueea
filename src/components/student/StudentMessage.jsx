import React from 'react';
import { LogOut } from 'lucide-react';
import Messages from '../common/Messages';

const StudentMessage = ({ 
    title, 
    body, 
    icon, 
    handleLogout, 
    error, 
    success, 
    clearMessages 
}) => {
    return (
        <div className="container mx-auto p-4 md:p-6">
            <Messages error={error} success={success} clearMessages={clearMessages} />
            <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-lg mx-auto">
                {icon}
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">{title}</h2>
                <p className="text-gray-600 mb-6">{body}</p>
                <button
                    onClick={handleLogout}
                    className="bg-blue-800 hover:bg-blue-900 text-white font-semibold py-2 px-4 rounded-lg flex items-center mx-auto"
                >
                    <LogOut size={18} className="mr-2" /> Finalizar Sesión
                </button>
            </div>
        </div>
    );
};

export default StudentMessage;

import React from 'react';
import { Home } from 'lucide-react';
import Messages from '../common/Messages';

const AdminLogin = ({ 
    adminEmail, 
    setAdminEmail, 
    adminPassword, 
    setAdminPassword, 
    handleAdminLogin, 
    isLoading, 
    setView, 
    clearMessages,
    error,
    success
}) => {
    return (
        <div className="flex items-center justify-center min-h-full bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                <button 
                    onClick={() => { setView('loginChoice'); clearMessages(); }} 
                    className="mb-4 text-blue-600 hover:text-blue-800 font-semibold flex items-center"
                >
                    <Home size={18} className="mr-1"/> Volver
                </button>
                <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Login Administrador</h2>
                <form onSubmit={handleAdminLogin}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="adminEmail">Email</label>
                        <input 
                            type="email" 
                            id="adminEmail" 
                            value={adminEmail} 
                            onChange={(e) => setAdminEmail(e.target.value)} 
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                            required 
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="adminPassword">Contraseña</label>
                        <input 
                            type="password" 
                            id="adminPassword" 
                            value={adminPassword} 
                            onChange={(e) => setAdminPassword(e.target.value)} 
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline" 
                            required 
                        />
                    </div>
                    <Messages error={error} success={success} clearMessages={clearMessages} />
                    <button 
                        type="submit" 
                        disabled={isLoading} 
                        className="w-full bg-blue-800 hover:bg-blue-900 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
                    >
                        {isLoading ? 'Iniciando...' : 'Iniciar Sesión'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;

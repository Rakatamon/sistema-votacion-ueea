import React from 'react';
import { RefreshCw, CheckCircle } from 'lucide-react';
import { INSTITUTION_LOGO_URL } from '../../utils/constants';
import Messages from '../common/Messages';

const LoginChoice = ({ user, isLoading, studentId, setStudentId, handleStudentLogin, error, success, clearMessages }) => {
    return (
        <div className="w-full max-w-md text-center">
            {!user && (
                <div className="mb-4 p-3 bg-yellow-100 text-yellow-700 border border-yellow-300 rounded-md text-sm flex items-center justify-center">
                    <RefreshCw className="animate-spin mr-2" size={16} />
                    Conectando con el servidor...
                </div>
            )}
            {user && user.isAnonymous && (
                <div className="mb-4 p-3 bg-green-100 text-green-700 border border-green-300 rounded-md text-sm flex items-center justify-center">
                    <CheckCircle className="mr-2" size={16} />
                    Conectado al servidor
                </div>
            )}
            <div className="bg-white p-8 sm:p-12 rounded-xl shadow-2xl">
                <img 
                    src={INSTITUTION_LOGO_URL} 
                    alt="Logo Institución" 
                    className="h-24 w-24 mx-auto mb-6 rounded-full object-contain bg-gray-100 p-1" 
                    onError={(e) => { e.target.style.display = 'none'; }}
                />
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Sistema de Votación</h2>
                <p className="text-gray-600 mb-4 text-center">Ingresa tu código estudiantil o matrícula para votar.</p>
                <form onSubmit={handleStudentLogin}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="studentId">Código Estudiantil</label>
                        <input 
                            type="text" 
                            id="studentId" 
                            value={studentId} 
                            onChange={(e) => setStudentId(e.target.value)} 
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline disabled:bg-gray-100" 
                            required 
                            disabled={!user || isLoading}
                        />
                    </div>
                    <Messages error={error} success={success} clearMessages={clearMessages} />
                    <button 
                        type="submit" 
                        disabled={isLoading || !user} 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline disabled:opacity-50 text-lg transition-all flex items-center justify-center"
                    >
                        {isLoading ? (
                            <>
                                <RefreshCw className="animate-spin mr-2" size={18} />
                                Verificando...
                            </>
                        ) : !user ? (
                            <>
                                <RefreshCw className="animate-spin mr-2" size={18} />
                                Conectando...
                            </>
                        ) : 'Acceder para Votar'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginChoice;

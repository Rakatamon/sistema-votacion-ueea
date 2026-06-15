import React from 'react';
import { LogOut } from 'lucide-react';
import { INSTITUTION_LOGO_URL, colors } from '../../utils/constants';

const Header = ({ user, currentVoter, isAdmin, handleLogout }) => {
    return (
        <header className={`bg-${colors.primary} text-${colors.lightText} p-4 shadow-md sticky top-0 z-40`}>
            <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center">
                <div className="flex items-center mb-2 sm:mb-0">
                    <img 
                        src={INSTITUTION_LOGO_URL} 
                        alt="Logo Institución" 
                        className="h-10 w-10 mr-3 rounded-full object-contain bg-white p-0.5" 
                        onError={(e) => { e.target.style.display = 'none'; }} 
                    />
                    <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-center sm:text-left">
                        UNIDAD EDUCATIVA ECUATORIANA AUSTRIACA
                    </h1>
                </div>
                <div>
                {((user && !user.isAnonymous) || currentVoter) && (
                    <button
                        onClick={handleLogout}
                        className={`bg-${colors.danger} hover:bg-red-700 text-${colors.lightText} font-semibold py-2 px-4 rounded-lg flex items-center transition duration-150`}
                    >
                        <LogOut size={18} className="mr-2" /> {isAdmin ? 'Salir' : 'Finalizar Sesión'}
                    </button>
                )}
                </div>
            </div>
        </header>
    );
};

export default Header;

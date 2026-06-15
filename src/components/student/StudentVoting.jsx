import React from 'react';
import { Vote } from 'lucide-react';
import { getTextColorForBackground } from '../../utils/constants';
import Messages from '../common/Messages';

const StudentVoting = ({ 
    activeElectionForVoting, 
    currentVoter, 
    handleCastVote, 
    isLoading, 
    error, 
    success, 
    clearMessages 
}) => {
    const sortedOptions = activeElectionForVoting ? [...activeElectionForVoting.options].sort((a, b) => {
        const specialVotes = ['Voto en Blanco', 'Voto Nulo'];
        const aIsSpecial = specialVotes.includes(a.name);
        const bIsSpecial = specialVotes.includes(b.name);

        if (aIsSpecial && !bIsSpecial) return 1;
        if (!aIsSpecial && bIsSpecial) return -1;
        if (aIsSpecial && bIsSpecial) {
            return specialVotes.indexOf(a.name) - specialVotes.indexOf(b.name);
        }
        return 0;
    }) : [];

    const candidateOptions = sortedOptions.filter(opt => !['Voto en Blanco', 'Voto Nulo'].includes(opt.name));
    const specialOptions = sortedOptions.filter(opt => ['Voto en Blanco', 'Voto Nulo'].includes(opt.name));

    return (
        <div className="container mx-auto p-4 md:p-6">
            <Messages error={error} success={success} clearMessages={clearMessages} />
            {activeElectionForVoting ? (
                <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
                    <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-800 mb-2">Elección Activa: {activeElectionForVoting.name}</h2>
                    <p className="text-gray-600 mb-6 text-center">Hola <span className="font-semibold">{currentVoter?.fullName}</span>, por favor selecciona una opción.</p>
                    
                    <div className="flex flex-wrap justify-center items-stretch gap-6 mb-8">
                        {candidateOptions.map(option => (
                            <button
                                key={option.id}
                                onClick={() => handleCastVote(activeElectionForVoting.id, option.id)}
                                disabled={isLoading}
                                style={{ backgroundColor: option.color }}
                                className={`w-60 h-72 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col p-4 disabled:opacity-50 ${getTextColorForBackground(option.color)}`}
                            >
                                <div className="flex-grow flex items-center justify-center">
                                    {option.iconUrl ? (
                                        <img src={option.iconUrl} alt={`Icono ${option.name}`} className="h-32 w-32 rounded-full object-cover border-4 border-white shadow-md" onError={(e) => { e.target.src = 'https://placehold.co/128x128/FFFFFF/000000?text=Error'; }}/>
                                    ) : (
                                        <div className="h-32 w-32 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-5xl font-bold border-4 border-white shadow-md">
                                            {option.name.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div className="h-16 flex items-center justify-center mt-3">
                                    <span className="text-xl font-bold text-center">{option.name}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4 mt-6 border-t pt-6">
                            {specialOptions.map(option => (
                            <button
                                key={option.id}
                                onClick={() => handleCastVote(activeElectionForVoting.id, option.id)}
                                disabled={isLoading}
                                style={{ backgroundColor: option.color }}
                                className={`w-full sm:w-auto px-6 py-3 text-left font-semibold rounded-lg shadow-md hover:brightness-90 transition duration-150 ease-in-out flex items-center justify-center disabled:opacity-50 ${getTextColorForBackground(option.color)}`}
                            >
                                <Vote size={20} className="mr-2"/>
                                <span>{option.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            ) : ( 
                <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-lg mx-auto">
                    <h2 className="text-2xl font-semibold text-gray-700 mb-4">Procesando...</h2>
                    <p className="text-gray-600">Verificando estado de la votación.</p>
                </div>
            )}
        </div>
    );
};

export default StudentVoting;

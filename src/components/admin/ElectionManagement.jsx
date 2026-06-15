import React from 'react';
import { PlusCircle, ImagePlus, Trash2, CheckCircle, Settings, RefreshCw, Edit3, Eye, XCircle } from 'lucide-react';

const ElectionManagement = ({
    elections,
    newElectionName,
    setNewElectionName,
    electionOptions,
    handleElectionOptionChange,
    handleAddElectionOption,
    handleRemoveElectionOption,
    handleCreateElection,
    isLoading,
    handleResetVotes,
    handleOpenEditElectionModal,
    handleTogglePublishResults,
    handleToggleElectionStatus,
    handleDeleteElection
}) => {
    return (
        <div className="space-y-8">
            <div className="p-6 bg-white rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4 text-gray-700 flex items-center"><PlusCircle size={22} className="mr-2 text-indigo-600"/>Crear Nueva Elección</h3>
                <form onSubmit={handleCreateElection} className="space-y-4">
                    <div>
                        <label htmlFor="newElectionName" className="block text-sm font-medium text-gray-700">Nombre de la Elección:</label>
                        <input type="text" id="newElectionName" value={newElectionName} onChange={(e) => setNewElectionName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Opciones/Listas (se añadirán Voto en Blanco y Nulo):</label>
                        {electionOptions.map((option, index) => (
                            <div key={index} className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4 mt-2 p-2 border rounded-md">
                                <input type="text" value={option.name} placeholder={`Nombre Opción ${index + 1}`} onChange={(e) => handleElectionOptionChange(index, 'name', e.target.value)} className="flex-grow w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required />
                                <div className="flex items-center space-x-2 w-full md:w-auto">
                                    <input type="color" value={option.color} onChange={(e) => handleElectionOptionChange(index, 'color', e.target.value)} className="w-10 h-10 p-0.5 border border-gray-300 rounded-md cursor-pointer" title="Seleccionar color"/>
                                    <ImagePlus size={18} className="text-gray-400 flex-shrink-0"/>
                                    <input type="url" value={option.iconUrl} placeholder="URL del Icono (opcional)" onChange={(e) => handleElectionOptionChange(index, 'iconUrl', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                                    {electionOptions.length > 1 && (
                                        <button type="button" onClick={() => handleRemoveElectionOption(index)} className="text-red-600 hover:text-red-800 p-1 rounded-md hover:bg-red-50">
                                            <Trash2 size={18}/>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                        <button type="button" onClick={handleAddElectionOption} className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center">
                            <PlusCircle size={16} className="mr-1"/>Añadir Opción
                        </button>
                    </div>
                    <button type="submit" disabled={isLoading} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center">
                        <CheckCircle size={18} className="mr-2"/>{isLoading ? 'Creando...' : 'Crear Elección'}
                    </button>
                </form>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4 text-gray-700 flex items-center"><Settings size={22} className="mr-2 text-gray-500"/>Gestionar Elecciones</h3>
                {elections.length === 0 ? <p className="text-gray-500">No hay elecciones creadas.</p> :
                <ul className="space-y-3">
                    {elections.map(election => (
                        <li key={election.id} className="p-3 border rounded-md flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
                             <div className="flex-grow flex items-center">
                                {election.options?.[0]?.iconUrl && <img src={election.options[0].iconUrl} alt="icon" className="h-8 w-8 mr-2 rounded object-contain bg-gray-100 p-0.5" onError={(e)=>e.target.style.display='none'}/>}
                                <div>
                                    <span className={`font-medium ${election.isActive ? 'text-green-600' : 'text-gray-800'}`}>{election.name}</span>
                                    <span className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded-full ${election.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                        {election.isActive ? 'ACTIVA' : 'INACTIVA'}
                                    </span>
                                    <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                                        Opciones: {election.options?.map(o => o.name).join(', ') || 'N/A'}
                                    </div>
                                </div>
                            </div>
                            <div className="flex space-x-1 items-center flex-shrink-0 mt-2 sm:mt-0">
                                {election.isActive && (
                                    <button onClick={() => handleResetVotes(election.id)} className="p-2 text-yellow-600 hover:text-yellow-800 rounded-md hover:bg-yellow-50" title="Resetear Votos">
                                        <RefreshCw size={18}/>
                                    </button>
                                )}
                                <button onClick={() => handleOpenEditElectionModal(election)} className="p-2 text-blue-600 hover:text-blue-800 rounded-md hover:bg-blue-50" title="Editar Elección">
                                    <Edit3 size={18}/>
                                </button>
                                <button onClick={() => handleTogglePublishResults(election.id, election.resultsPublic)} className={`p-2 rounded-md hover:bg-gray-100 ${election.resultsPublic ? 'text-green-600' : 'text-gray-500'}`} title={election.resultsPublic ? 'Ocultar Resultados' : 'Publicar Resultados'}>
                                    <Eye size={18}/>
                                </button>
                                <button onClick={() => handleToggleElectionStatus(election.id, election.isActive)} className={`px-3 py-1 text-sm rounded-md font-medium flex items-center whitespace-nowrap ${election.isActive ? 'bg-yellow-500 hover:bg-yellow-600 text-gray-800' : 'bg-green-600 hover:bg-green-700 text-white'}`} title={election.isActive ? 'Desactivar' : 'Activar'}>
                                    {election.isActive ? <XCircle size={16} className="mr-1"/> : <CheckCircle size={16} className="mr-1"/>}
                                    {election.isActive ? 'Desactivar' : 'Activar'}
                                </button>
                                <button onClick={() => handleDeleteElection(election.id)} className="p-2 text-red-600 hover:text-red-800 rounded-md hover:bg-red-50" title="Eliminar Elección">
                                    <Trash2 size={18}/>
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>}
            </div>
        </div>
    );
};

export default ElectionManagement;

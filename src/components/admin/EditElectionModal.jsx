import React from 'react';
import { ImagePlus, Trash2, PlusCircle } from 'lucide-react';

const EditElectionModal = ({ editingElection, setEditingElection, handleUpdateElection, isLoading }) => {
    if (!editingElection) return null;

    const handleOptionChange = (index, field, value) => {
        const newOptions = [...editingElection.options];
        newOptions[index][field] = value;
        setEditingElection(prev => ({ ...prev, options: newOptions }));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl transform transition-all max-h-[90vh] flex flex-col">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Editar Elección</h3>
                <form onSubmit={handleUpdateElection} className="flex-grow overflow-y-auto pr-2">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nombre de la Elección:</label>
                            <input type="text" value={editingElection.name} onChange={(e) => setEditingElection({...editingElection, name: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Opciones:</label>
                            {editingElection.options.map((option, index) => (
                                <div key={option.id || index} className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4 mt-2 p-2 border rounded-md">
                                    <input type="text" value={option.name} placeholder={`Nombre Opción ${index + 1}`} onChange={(e) => handleOptionChange(index, 'name', e.target.value)} className="flex-grow w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required />
                                    <div className="flex items-center space-x-2 w-full md:w-auto">
                                        <input type="color" value={option.color} onChange={(e) => handleOptionChange(index, 'color', e.target.value)} className="w-10 h-10 p-0.5 border border-gray-300 rounded-md cursor-pointer"/>
                                        <ImagePlus size={18} className="text-gray-400 flex-shrink-0"/>
                                        <input type="url" value={option.iconUrl} placeholder="URL del Icono (opcional)" onChange={(e) => handleOptionChange(index, 'iconUrl', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                                        {editingElection.options.length > 1 && (
                                            <button type="button" onClick={() => setEditingElection(prev => ({...prev, options: prev.options.filter((_, i) => i !== index)}))} className="text-red-600 hover:text-red-800 p-1 rounded-md hover:bg-red-50">
                                                <Trash2 size={18}/>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <button type="button" onClick={() => setEditingElection(prev => ({...prev, options: [...prev.options, {id: 'opt_' + Date.now(), name: '', color: '#CBD5E1', iconUrl: ''}]}))} className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center">
                                <PlusCircle size={16} className="mr-1"/>Añadir Opción
                            </button>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                        <button type="button" onClick={() => setEditingElection(null)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                        <button type="submit" disabled={isLoading} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50">
                            {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditElectionModal;

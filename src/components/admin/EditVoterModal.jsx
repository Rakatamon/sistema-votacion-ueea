import React from 'react';

const EditVoterModal = ({ editingVoter, setEditingVoter, handleUpdateVoter, isLoading }) => {
    if (!editingVoter) return null;
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg transform transition-all">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Editar Votante</h3>
                <form onSubmit={handleUpdateVoter} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Código Estudiantil (No se puede cambiar)</label>
                        <input type="text" value={editingVoter.id} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100" readOnly />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nombre Completo:</label>
                        <input type="text" value={editingVoter.fullName} onChange={(e) => setEditingVoter({...editingVoter, fullName: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nivel Curso:</label>
                        <input type="text" value={editingVoter.courseLevel} onChange={(e) => setEditingVoter({...editingVoter, courseLevel: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nombre/Paralelo Curso:</label>
                        <input type="text" value={editingVoter.courseName} onChange={(e) => setEditingVoter({...editingVoter, courseName: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required />
                    </div>
                    <div className="flex justify-end space-x-3 mt-5">
                        <button type="button" onClick={() => setEditingVoter(null)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                        <button type="submit" disabled={isLoading} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50">
                            {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditVoterModal;

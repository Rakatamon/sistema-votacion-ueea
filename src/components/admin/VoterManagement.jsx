import React from 'react';
import { UserPlus, CheckCircle, UploadCloud, UserCheck, UserX, Trash2, Filter, Edit3, Printer } from 'lucide-react';
import jsPDF from 'jspdf';

const VoterManagement = ({
    newVoterId, setNewVoterId,
    newVoterName, setNewVoterName,
    newVoterCourseLevel, setNewVoterCourseLevel,
    newVoterCourseName, setNewVoterCourseName,
    handleCreateVoter,
    isLoading,
    handleDownloadTemplate,
    handleFileUpload,
    isImporting,
    voterListView, setVoterListView,
    courseFilter, setCourseFilter,
    uniqueCourses,
    filteredVoters, voters,
    handleDeleteCourseVoters,
    handleDeleteAllVoters,
    handleOpenEditVoterModal,
    handleDeleteVoter,
    missingVotersByCourse
}) => {
    const handleExportVotersPDF = () => {
        const doc = new jsPDF('p', 'mm', 'a4');
        const pageWidth = 210;
        const pageHeight = 297;
        const marginX = 10;
        const marginY = 20;
        const columns = 3;
        const cardWidth = (pageWidth - 2 * marginX) / columns;
        const cardHeight = 25;
        
        let x = marginX;
        let y = marginY;
        
        doc.setFontSize(16);
        doc.text(`Códigos de Votantes - ${courseFilter === 'all' ? 'Todos' : courseFilter}`, pageWidth/2, 12, { align: 'center' });
        
        const votersToExport = voterListView === 'all' ? filteredVoters : missingVotersByCourse.flatMap(c => c.voters);

        votersToExport.forEach((voter, index) => {
            if (y + cardHeight > pageHeight - marginY + 5) {
                doc.addPage();
                x = marginX;
                y = marginY;
                doc.setFontSize(16);
                doc.text(`Códigos de Votantes - ${courseFilter === 'all' ? 'Todos' : courseFilter}`, pageWidth/2, 12, { align: 'center' });
            }

            // Draw box
            doc.setDrawColor(150);
            doc.setLineWidth(0.3);
            doc.rect(x, y, cardWidth, cardHeight);
            
            // Text inside box
            doc.setFontSize(8);
            doc.setTextColor(100);
            const courseStr = `${voter.courseLevel} ${voter.courseName}`;
            doc.text(courseStr.substring(0, 35), x + 3, y + 6);
            
            doc.setFontSize(10);
            doc.setTextColor(0);
            doc.text(voter.fullName.substring(0, 30), x + 3, y + 12);
            
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text(`CÓDIGO: ${voter.id}`, x + 3, y + 20);
            doc.setFont("helvetica", "normal");
            
            x += cardWidth;
            if (x + cardWidth > pageWidth - 5) {
                x = marginX;
                y += cardHeight;
            }
        });
        
        doc.save(`Codigos_Votantes_${courseFilter.replace(/\s+/g, '_')}.pdf`);
    };

    return (
        <div className="space-y-8">
            <div className="p-6 bg-white rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4 text-gray-700 flex items-center"><UserPlus size={22} className="mr-2 text-indigo-600"/>Crear Nuevo Votante</h3>
                <form onSubmit={handleCreateVoter} className="space-y-4">
                    <div>
                        <label htmlFor="newVoterId" className="block text-sm font-medium text-gray-700">Código Estudiantil / Matrícula (Único):</label>
                        <input type="text" id="newVoterId" value={newVoterId} onChange={(e) => setNewVoterId(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required />
                    </div>
                    <div>
                        <label htmlFor="newVoterName" className="block text-sm font-medium text-gray-700">Nombre Completo:</label>
                        <input type="text" id="newVoterName" value={newVoterName} onChange={(e) => setNewVoterName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required />
                    </div>
                    <div>
                        <label htmlFor="newVoterCourseLevel" className="block text-sm font-medium text-gray-700">Nivel Curso (Ej: 3ero):</label>
                        <input type="text" id="newVoterCourseLevel" value={newVoterCourseLevel} onChange={(e) => setNewVoterCourseLevel(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required />
                    </div>
                    <div>
                        <label htmlFor="newVoterCourseName" className="block text-sm font-medium text-gray-700">Nombre/Paralelo Curso (Ej: Loja):</label>
                        <input type="text" id="newVoterCourseName" value={newVoterCourseName} onChange={(e) => setNewVoterCourseName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required />
                    </div>
                    <button type="submit" disabled={isLoading} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center">
                        <CheckCircle size={18} className="mr-2"/>{isLoading ? 'Creando...' : 'Crear Votante'}
                    </button>
                </form>
            </div>

            <div className="p-6 bg-white rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-2 text-gray-700 flex items-center"><UploadCloud size={22} className="mr-2 text-indigo-600"/>Importar Votantes desde Excel/CSV</h3>
                
                <div className="bg-indigo-50 border-l-4 border-indigo-400 p-4 mb-4 rounded-r-md">
                    <p className="text-sm text-indigo-800 font-medium mb-1">
                        Formato flexible: El sistema detectará automáticamente las siguientes columnas (no importa mayúsculas o tildes):
                    </p>
                    <ul className="text-sm text-indigo-700 list-disc list-inside space-y-1 mb-2">
                        <li><b>Código:</b> "Código", "Matrícula", "ID", "Cédula"</li>
                        <li><b>Nombre:</b> "Nombre Completo", "Estudiante", "Alumno"</li>
                        <li><b>Nivel:</b> "Nivel", "Grado", "Año"</li>
                        <li><b>Curso:</b> "Curso", "Paralelo", "Sección"</li>
                    </ul>
                    <p className="text-xs text-indigo-600">
                        Opcionalmente puedes descargar la plantilla con los nombres de columna estándar: 
                        <button
                            type="button"
                            onClick={handleDownloadTemplate}
                            className="text-xs text-indigo-800 font-semibold hover:underline ml-1 inline-block bg-transparent border-none p-0 cursor-pointer">
                            Descargar Plantilla CSV
                        </button>
                    </p>
                </div>
                
                <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} disabled={isImporting} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 transition-all mb-2 cursor-pointer" />
                {isImporting && <p className="text-sm font-medium text-indigo-600 animate-pulse mt-2 flex items-center"><UploadCloud className="animate-bounce mr-2" size={18}/> Procesando y guardando archivo, por favor espera...</p>}
            </div>

            <div className="p-6 bg-white rounded-lg shadow-md">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        <button
                            onClick={() => setVoterListView('all')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center ${voterListView === 'all' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                        >
                            <UserCheck size={16} className="mr-2"/> Todos los Votantes
                        </button>
                        <button
                            onClick={() => setVoterListView('missing')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center ${voterListView === 'missing' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                        >
                            <UserX size={16} className="mr-2"/> Faltan por Votar
                        </button>
                    </nav>
                </div>
                
                {voterListView === 'all' ? (
                    <div className="mt-6">
                        <div className="flex flex-col sm:flex-row justify-end items-center mb-4 gap-4">
                            <button onClick={handleExportVotersPDF} className="w-full sm:w-auto flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 shadow-sm transition-colors">
                                <Printer size={16} className="mr-2" /> Exportar Códigos PDF
                            </button>
                            {courseFilter !== 'all' ? (
                                <button onClick={() => handleDeleteCourseVoters(courseFilter)} className="w-full sm:w-auto flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700">
                                    <Trash2 size={16} className="mr-2" /> Borrar Curso: {courseFilter}
                                </button>
                            ) : (
                                <button onClick={handleDeleteAllVoters} className="w-full sm:w-auto flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-800 hover:bg-red-900">
                                    <Trash2 size={16} className="mr-2" /> Borrar Todos los Votantes
                                </button>
                            )}
                            <div className="flex items-center space-x-2 w-full sm:w-auto">
                                <Filter size={16} className="text-gray-500"/>
                                <select 
                                    value={courseFilter} 
                                    onChange={(e) => setCourseFilter(e.target.value)}
                                    className="block w-full sm:w-auto pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                >
                                    <option value="all">Todos los Cursos</option>
                                    {uniqueCourses.map(course => (
                                        <option key={course} value={course}>{course}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">Mostrando {filteredVoters.length} de {voters.length} votantes.</p>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código Estudiantil</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre Completo</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Curso</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {filteredVoters.length > 0 ? filteredVoters.map(voter => (
                                    <tr key={voter.id}>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{voter.id}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{voter.fullName}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{voter.courseLevel} {voter.courseName}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm flex items-center space-x-2">
                                            <button onClick={() => handleOpenEditVoterModal(voter)} className="p-1 text-blue-600 hover:text-blue-800 rounded-md hover:bg-blue-50">
                                                <Edit3 size={18}/>
                                            </button>
                                            <button onClick={() => handleDeleteVoter(voter.id)} className="p-1 text-red-600 hover:text-red-800 rounded-md hover:bg-red-50">
                                                <Trash2 size={18}/>
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="4" className="text-center py-4 text-gray-500">No hay votantes que coincidan con el filtro.</td></tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="mt-6">
                        {Object.keys(missingVotersByCourse).length === 0 ? (
                            <p className="text-center text-gray-500 py-4">¡Excelente! Todos los estudiantes han votado.</p>
                        ) : (
                           <div className="space-y-6">
                               {Object.entries(missingVotersByCourse).sort(([courseA], [courseB]) => courseA.localeCompare(courseB)).map(([course, students]) => (
                                   <div key={course} className="border rounded-lg">
                                       <h4 className="px-4 py-2 bg-gray-50 border-b font-semibold text-gray-700">{course} <span className="text-sm font-normal text-red-600">({students.length} faltantes)</span></h4>
                                       <ul className="divide-y divide-gray-200">
                                           {students.map(student => (
                                               <li key={student.id} className="px-4 py-2 flex justify-between items-center">
                                                   <span>{student.fullName}</span>
                                                   <span className="text-xs text-gray-500 font-mono">{student.id}</span>
                                               </li>
                                           ))}
                                       </ul>
                                   </div>
                               ))}
                           </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default VoterManagement;

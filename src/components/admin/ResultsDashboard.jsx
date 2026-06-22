import React, { useState, useRef } from 'react';
import { Download, Users, UserCheck, UserX, ChevronDown, FileText, RefreshCw } from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LabelList,
    PieChart, Pie,
    RadialBarChart, RadialBar, PolarAngleAxis
} from 'recharts';
import { colors } from '../../utils/constants';
import jsPDF from 'jspdf';
import * as htmlToImage from 'html-to-image';

const ResultsDashboard = ({
    isAdmin,
    elections,
    voteCounts,
    courseVoteCounts,
    dashboardStats,
    participationByCourse,
    handleExportResults
}) => {
    const [expandedCourse, setExpandedCourse] = useState(null);
    const [isExportingPDF, setIsExportingPDF] = useState(false);
    const dashboardRef = useRef(null);
    const election = elections.find(e => e.isActive);

    if (!election) {
        return (
             <div className="container mx-auto p-4">
                <div className="text-center text-gray-600 p-5 bg-white rounded-lg shadow">
                   "No hay una elección activa. Active una para ver resultados."
                </div>
            </div>
        );
    }

    const participationData = [{ name: 'Participación', value: dashboardStats.participation, fill: colors.accent }];

    const handleExportPDF = () => {
        if (!dashboardRef.current) return;
        setIsExportingPDF(true);
        
        setTimeout(async () => {
            try {
                // Use html-to-image to bypass html2canvas oklch parsing errors
                const width = dashboardRef.current.offsetWidth;
                const height = dashboardRef.current.offsetHeight;
                const imgData = await htmlToImage.toPng(dashboardRef.current, {
                    quality: 1.0,
                    backgroundColor: '#ffffff'
                });

                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (height * pdfWidth) / width;
                
                let heightLeft = pdfHeight;
                let position = 0;
                const pageHeight = pdf.internal.pageSize.getHeight();

                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
                heightLeft -= pageHeight;

                while (heightLeft >= 0) {
                    position = heightLeft - pdfHeight;
                    pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
                    heightLeft -= pageHeight;
                }
                pdf.save(`Resultados_${election.name.replace(/\s+/g, '_')}.pdf`);
            } catch (error) {
                console.error("Error generating PDF:", error);
                alert("Hubo un error generando el PDF.");
            }
            setIsExportingPDF(false);
        }, 500); // 500ms delay to allow graphs to expand and render
    };

    return (
        <div className="container mx-auto p-4 space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <h3 className="text-2xl font-semibold text-gray-800 mb-2 sm:mb-0">Resultados: {election.name}</h3>
                <div className="flex gap-2">
                    {isAdmin && (
                        <>
                            <button
                                onClick={handleExportPDF}
                                disabled={isExportingPDF || !voteCounts || !voteCounts.some(vc => vc.votes > 0)}
                                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isExportingPDF ? <RefreshCw className="animate-spin mr-2" size={18} /> : <FileText size={18} className="mr-2" />} 
                                {isExportingPDF ? 'Generando PDF...' : 'Exportar PDF'}
                            </button>
                            <button
                                onClick={handleExportResults}
                                disabled={!voteCounts || !voteCounts.some(vc => vc.votes > 0)}
                                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Download size={18} className="mr-2" /> Exportar Excel
                            </button>
                        </>
                    )}
                </div>
            </div>
            
            <div ref={dashboardRef} className="space-y-8 bg-gray-50 p-4 rounded-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total de Votantes</p>
                        <p className="text-3xl font-bold text-gray-800">{dashboardStats.totalVoters}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-500"/>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Votos Emitidos</p>
                        <p className="text-3xl font-bold text-gray-800">{dashboardStats.votedCount}</p>
                    </div>
                    <UserCheck className="h-8 w-8 text-green-500"/>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Faltan por Votar</p>
                        <p className="text-3xl font-bold text-gray-800">{dashboardStats.missingCount}</p>
                    </div>
                    <UserX className="h-8 w-8 text-red-500"/>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height={100}>
                         <RadialBarChart 
                            innerRadius="75%" 
                            outerRadius="100%" 
                            data={participationData} 
                            startAngle={90} 
                            endAngle={-270}
                        >
                            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                            <RadialBar background dataKey="value" cornerRadius={10} isAnimationActive={false} />
                            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-xl font-bold fill-gray-800">
                                {`${dashboardStats.participation.toFixed(1)}%`}
                            </text>
                        </RadialBarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="p-6 bg-white rounded-lg shadow-lg">
                <h4 className="text-xl font-semibold mb-4 text-gray-700">Resultados Generales por Opción</h4>
                {voteCounts && voteCounts.some(vc => vc.votes > 0) ? (
                    <ResponsiveContainer width="100%" height={380}>
                        <BarChart data={voteCounts} margin={{ top: 30, right: 20, left: 0, bottom: 90 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-35} textAnchor="end" interval={0} height={90} tick={{ fontSize: 12, dy: 15 }} />
                            <YAxis allowDecimals={false} />
                            <Tooltip cursor={{fill: 'transparent'}} />
                            <Legend wrapperStyle={{ top: 0, paddingBottom: '20px' }} verticalAlign="top" />
                            <Bar dataKey="votes" name="Votos" isAnimationActive={false}>
                                {voteCounts.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color || colors.accent} />
                                ))}
                                <LabelList dataKey="votes" position="top" />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : <p className="text-gray-500">Aún no hay votos registrados para esta elección.</p>}
            </div>

            <div className="p-6 bg-white rounded-lg shadow-lg">
                <h4 className="text-xl font-semibold mb-4 text-gray-700">Resultados Detallados por Curso</h4>
                <div className="space-y-2">
                    {participationByCourse && participationByCourse.map(courseData => {
                        const courseOptions = voteCounts.map(opt => {
                            const course = (courseVoteCounts || []).find(c => c.courseDisplayName === courseData.name);
                            const option = course ? course.options.find(o => o.id === opt.id) : null;
                            return {
                                name: opt.name,
                                value: option ? option.value : 0,
                                color: opt.color
                            }
                        });
                         const totalVotesInCourse = courseOptions.reduce((acc, opt) => acc + opt.value, 0);

                        return (
                            <div key={courseData.name} className="border rounded-lg">
                                <button onClick={() => setExpandedCourse(expandedCourse === courseData.name ? null : courseData.name)} className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100">
                                    <h5 className="text-lg font-bold text-gray-800">{courseData.name}</h5>
                                    <div className="flex items-center space-x-4">
                                        <span className="text-sm text-gray-600">{courseData['Votos Emitidos']} de {courseData.total} votaron</span>
                                        <ChevronDown className={`transform transition-transform ${(expandedCourse === courseData.name || isExportingPDF) ? 'rotate-180' : ''}`} />
                                    </div>
                                </button>
                                {(expandedCourse === courseData.name || isExportingPDF) && (
                                    <div className="p-4 border-t border-gray-200 bg-white">
                                        <div className="flex flex-col lg:flex-row gap-6">
                                            <div className="flex-1">
                                                <h6 className="text-md font-semibold text-gray-700 mb-2 text-center">Distribución de Votos</h6>
                                                {totalVotesInCourse > 0 ? (
                                                    <ResponsiveContainer width="100%" height={250}>
                                                        <PieChart>
                                                            <Pie
                                                                data={courseOptions.filter(opt => opt.value > 0)}
                                                                cx="50%"
                                                                cy="50%"
                                                                labelLine={true}
                                                                label={({ name, value, percent }) => `${name}: ${value} ${value === 1 ? 'voto' : 'votos'} (${(percent * 100).toFixed(1)}%)`}
                                                                outerRadius={80}
                                                                dataKey="value"
                                                                isAnimationActive={false}
                                                            >
                                                                {courseOptions.filter(opt => opt.value > 0).map((entry, index) => (
                                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                                ))}
                                                            </Pie>
                                                            <Tooltip />
                                                            <Legend />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                ) : <p className="text-center text-gray-500 py-10">No hay votos registrados para este curso.</p>}
                                            </div>
                                            <div className="flex-1 lg:border-l lg:pl-6">
                                                <h6 className="text-md font-semibold text-red-600 mb-2 flex items-center">
                                                    <UserX size={16} className="mr-1" /> Estudiantes que faltan votar ({courseData.missingVoters?.length || 0})
                                                </h6>
                                                {courseData.missingVoters && courseData.missingVoters.length > 0 ? (
                                                    <div className="max-h-60 overflow-y-auto bg-gray-50 rounded-md p-3 text-sm text-gray-600">
                                                        <ul className="list-disc pl-5 space-y-1">
                                                            {courseData.missingVoters.map((student, idx) => (
                                                                <li key={idx}>{student}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-green-600 bg-green-50 p-3 rounded-md">¡Todos los estudiantes de este curso han votado!</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
            </div>
        </div>
    );
};

export default ResultsDashboard;

import React, { useState } from 'react';
import { Download, Users, UserCheck, UserX, ChevronDown } from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LabelList,
    PieChart, Pie,
    RadialBarChart, RadialBar, PolarAngleAxis
} from 'recharts';
import { colors } from '../../utils/constants';

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

    return (
        <div className="container mx-auto p-4 space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <h3 className="text-2xl font-semibold text-gray-800 mb-2 sm:mb-0">Resultados: {election.name}</h3>
                {isAdmin && (
                    <button
                        onClick={handleExportResults}
                        disabled={!voteCounts || !voteCounts.some(vc => vc.votes > 0)}
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download size={18} className="mr-2" /> Exportar a Excel
                    </button>
                )}
            </div>
            
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
                            innerRadius="70%" 
                            outerRadius="90%" 
                            data={participationData} 
                            startAngle={90} 
                            endAngle={-270}
                        >
                            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                            <RadialBar background dataKey="value" cornerRadius={10} />
                            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-2xl font-bold fill-gray-800">
                                {`${dashboardStats.participation.toFixed(1)}%`}
                            </text>
                             <Tooltip content={<div className="bg-white p-2 border rounded-md shadow-lg text-sm">Participación</div>} />
                        </RadialBarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="p-6 bg-white rounded-lg shadow-lg">
                <h4 className="text-xl font-semibold mb-4 text-gray-700">Resultados Generales por Opción</h4>
                {voteCounts && voteCounts.some(vc => vc.votes > 0) ? (
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={voteCounts} margin={{ top: 20, right: 20, left: 0, bottom: 75 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-40} textAnchor="end" interval={0} height={90} style={{ fontSize: '0.8rem' }}/>
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Legend wrapperStyle={{paddingTop: '20px'}}/>
                            <Bar dataKey="votes" name="Votos">
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
                                        <ChevronDown className={`transform transition-transform ${expandedCourse === courseData.name ? 'rotate-180' : ''}`} />
                                    </div>
                                </button>
                                {expandedCourse === courseData.name && (
                                    <div className="p-4">
                                        {totalVotesInCourse > 0 ? (
                                            <ResponsiveContainer width="100%" height={250}>
                                                <PieChart>
                                                    <Pie
                                                        data={courseOptions.filter(opt => opt.value > 0)}
                                                        cx="50%"
                                                        cy="50%"
                                                        labelLine={false}
                                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                        outerRadius={80}
                                                        dataKey="value"
                                                    >
                                                        {courseOptions.filter(opt => opt.value > 0).map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip />
                                                    <Legend />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        ) : <p className="text-center text-gray-500">No hay votos registrados para este curso.</p>}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default ResultsDashboard;

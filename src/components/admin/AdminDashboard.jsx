import React from 'react';
import { BarChart3, ListPlus, Users } from 'lucide-react';
import Messages from '../common/Messages';
import ResultsDashboard from './ResultsDashboard';
import ElectionManagement from './ElectionManagement';
import VoterManagement from './VoterManagement';

const AdminDashboard = ({
    adminSection,
    setAdminSection,
    clearMessages,
    error,
    success,
    
    // ResultsDashboard props
    isAdmin, elections, voteCounts, courseVoteCounts, dashboardStats, participationByCourse, handleExportResults,
    
    // ElectionManagement props
    newElectionName, setNewElectionName, electionOptions, handleElectionOptionChange, handleAddElectionOption, handleRemoveElectionOption, handleCreateElection, isLoading, handleResetVotes, handleOpenEditElectionModal, handleTogglePublishResults, handleToggleElectionStatus, handleDeleteElection,
    
    // VoterManagement props
    newVoterId, setNewVoterId, newVoterName, setNewVoterName, newVoterCourseLevel, setNewVoterCourseLevel, newVoterCourseName, setNewVoterCourseName, handleCreateVoter, handleDownloadTemplate, handleFileUpload, isImporting, voterListView, setVoterListView, courseFilter, setCourseFilter, uniqueCourses, filteredVoters, voters, handleDeleteCourseVoters, handleDeleteAllVoters, handleOpenEditVoterModal, handleDeleteVoter, missingVotersByCourse
}) => {
    return (
        <div className="container mx-auto p-4">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Panel de Administrador</h2>
            <div className="flex flex-wrap space-x-0 sm:space-x-2 mb-6 border-b">
                <button onClick={() => { setAdminSection('dashboard'); clearMessages(); }} className={`py-2 px-3 sm:px-4 text-sm sm:text-base font-semibold ${adminSection === 'dashboard' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                    <BarChart3 size={18} className="inline mr-1" /> Resultados
                </button>
                <button onClick={() => { setAdminSection('elections'); clearMessages(); }} className={`py-2 px-3 sm:px-4 text-sm sm:text-base font-semibold ${adminSection === 'elections' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                    <ListPlus size={18} className="inline mr-1" /> Elecciones
                </button>
                <button onClick={() => { setAdminSection('voters'); clearMessages(); }} className={`py-2 px-3 sm:px-4 text-sm sm:text-base font-semibold ${adminSection === 'voters' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                    <Users size={18} className="inline mr-1" /> Votantes
                </button>
            </div>
            
            <Messages error={error} success={success} clearMessages={clearMessages} /> 
            
            {adminSection === 'dashboard' && (
                <ResultsDashboard 
                    isAdmin={isAdmin}
                    elections={elections}
                    voteCounts={voteCounts}
                    courseVoteCounts={courseVoteCounts}
                    dashboardStats={dashboardStats}
                    participationByCourse={participationByCourse}
                    handleExportResults={handleExportResults}
                />
            )}
            
            {adminSection === 'elections' && (
                <ElectionManagement 
                    elections={elections}
                    newElectionName={newElectionName}
                    setNewElectionName={setNewElectionName}
                    electionOptions={electionOptions}
                    handleElectionOptionChange={handleElectionOptionChange}
                    handleAddElectionOption={handleAddElectionOption}
                    handleRemoveElectionOption={handleRemoveElectionOption}
                    handleCreateElection={handleCreateElection}
                    isLoading={isLoading}
                    handleResetVotes={handleResetVotes}
                    handleOpenEditElectionModal={handleOpenEditElectionModal}
                    handleTogglePublishResults={handleTogglePublishResults}
                    handleToggleElectionStatus={handleToggleElectionStatus}
                    handleDeleteElection={handleDeleteElection}
                />
            )}
            
            {adminSection === 'voters' && (
                <VoterManagement 
                    newVoterId={newVoterId}
                    setNewVoterId={setNewVoterId}
                    newVoterName={newVoterName}
                    setNewVoterName={setNewVoterName}
                    newVoterCourseLevel={newVoterCourseLevel}
                    setNewVoterCourseLevel={setNewVoterCourseLevel}
                    newVoterCourseName={newVoterCourseName}
                    setNewVoterCourseName={setNewVoterCourseName}
                    handleCreateVoter={handleCreateVoter}
                    isLoading={isLoading}
                    handleDownloadTemplate={handleDownloadTemplate}
                    handleFileUpload={handleFileUpload}
                    isImporting={isImporting}
                    voterListView={voterListView}
                    setVoterListView={setVoterListView}
                    courseFilter={courseFilter}
                    setCourseFilter={setCourseFilter}
                    uniqueCourses={uniqueCourses}
                    filteredVoters={filteredVoters}
                    voters={voters}
                    handleDeleteCourseVoters={handleDeleteCourseVoters}
                    handleDeleteAllVoters={handleDeleteAllVoters}
                    handleOpenEditVoterModal={handleOpenEditVoterModal}
                    handleDeleteVoter={handleDeleteVoter}
                    missingVotersByCourse={missingVotersByCourse}
                />
            )}
        </div>
    );
};

export default AdminDashboard;

import re

with open('src/App.jsx', 'r') as f:
    content = f.read()

# Add imports at the top
imports = """import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, onSnapshot } from 'firebase/firestore';
import { signInAnonymously, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, db, appId } from './services/firebase';
import { AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';

// Components
import Header from './components/common/Header';
import Modal from './components/common/Modal';
import Messages from './components/common/Messages';
import LoginChoice from './components/auth/LoginChoice';
import AdminLogin from './components/auth/AdminLogin';
import StudentVoting from './components/student/StudentVoting';
import StudentMessage from './components/student/StudentMessage';
import AdminDashboard from './components/admin/AdminDashboard';
import EditVoterModal from './components/admin/EditVoterModal';
import EditElectionModal from './components/admin/EditElectionModal';
import { colors, getTextColorForBackground } from './utils/constants';

"""

# replace imports at top (from 'import React...' to 'import { colors...')
content = re.sub(r"import React.*?import \{ colors, getTextColorForBackground \} from '\./utils/constants';\n+", imports, content, flags=re.DOTALL)

# Delete render functions from `const renderHeader = () => (` to `    const renderEditElectionModal = () => { ... }`
# And replace the final return statement.

render_pattern = r"    const renderHeader = \(\) => \((.*?)(?=    return \()"
new_return = """    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            {view !== 'adminLogin' && (
                <Header 
                    user={user} 
                    currentVoter={currentVoter} 
                    isAdmin={isAdmin} 
                    handleLogout={handleLogout} 
                />
            )}
            
            <main className={`flex-grow flex flex-col justify-center ${view === 'loginChoice' || view === 'adminLogin' ? 'items-center' : ''}`}>
                {view === 'loginChoice' && (
                    <LoginChoice 
                        user={user}
                        isLoading={isLoading}
                        studentId={studentId}
                        setStudentId={setStudentId}
                        handleStudentLogin={handleStudentLogin}
                        error={error}
                        success={success}
                        clearMessages={clearMessages}
                    />
                )}
                {view === 'adminLogin' && (
                    <AdminLogin 
                        adminEmail={adminEmail}
                        setAdminEmail={setAdminEmail}
                        adminPassword={adminPassword}
                        setAdminPassword={setAdminPassword}
                        handleAdminLogin={handleAdminLogin}
                        isLoading={isLoading}
                        setView={setView}
                        clearMessages={clearMessages}
                        error={error}
                        success={success}
                    />
                )}
                {view === 'studentVoting' && (
                    <StudentVoting 
                        activeElectionForVoting={activeElectionForVoting}
                        currentVoter={currentVoter}
                        handleCastVote={handleCastVote}
                        isLoading={isLoading}
                        error={error}
                        success={success}
                        clearMessages={clearMessages}
                    />
                )}
                {view === 'studentVoted' && (
                    <StudentMessage 
                        title="¡Gracias por Votar!"
                        body="Tu voto ha sido registrado exitosamente y es anónimo."
                        handleLogout={handleLogout}
                        error={error}
                        success={success}
                        clearMessages={clearMessages}
                        icon={<div className="mx-auto text-green-500 mb-4 flex justify-center"><CheckCircle size={48} /></div>}
                    />
                )}
                {view === 'noActiveElection' && (
                    <StudentMessage 
                        title="Sistema Cerrado"
                        body="No hay ninguna elección activa en este momento para ti."
                        handleLogout={handleLogout}
                        error={error}
                        success={success}
                        clearMessages={clearMessages}
                        icon={<div className="mx-auto text-yellow-500 mb-4 flex justify-center"><AlertTriangle size={48} /></div>}
                    />
                )}
                {view === 'adminDashboard' && (
                    <AdminDashboard 
                        adminSection={adminSection} setAdminSection={setAdminSection} clearMessages={clearMessages} error={error} success={success}
                        isAdmin={isAdmin} elections={elections} voteCounts={voteCounts} courseVoteCounts={courseVoteCounts} dashboardStats={dashboardStats} participationByCourse={participationByCourse} handleExportResults={handleExportResults}
                        newElectionName={newElectionName} setNewElectionName={setNewElectionName} electionOptions={electionOptions} handleElectionOptionChange={handleElectionOptionChange} handleAddElectionOption={handleAddElectionOption} handleRemoveElectionOption={handleRemoveElectionOption} handleCreateElection={handleCreateElection} isLoading={isLoading} handleResetVotes={handleResetVotes} handleOpenEditElectionModal={handleOpenEditElectionModal} handleTogglePublishResults={handleTogglePublishResults} handleToggleElectionStatus={handleToggleElectionStatus} handleDeleteElection={handleDeleteElection}
                        newVoterId={newVoterId} setNewVoterId={setNewVoterId} newVoterName={newVoterName} setNewVoterName={setNewVoterName} newVoterCourseLevel={newVoterCourseLevel} setNewVoterCourseLevel={setNewVoterCourseLevel} newVoterCourseName={newVoterCourseName} setNewVoterCourseName={setNewVoterCourseName} handleCreateVoter={handleCreateVoter} handleDownloadTemplate={handleDownloadTemplate} handleFileUpload={handleFileUpload} isImporting={isImporting} voterListView={voterListView} setVoterListView={setVoterListView} courseFilter={courseFilter} setCourseFilter={setCourseFilter} uniqueCourses={uniqueCourses} filteredVoters={filteredVoters} voters={voters} handleDeleteCourseVoters={handleDeleteCourseVoters} handleDeleteAllVoters={handleDeleteAllVoters} handleOpenEditVoterModal={handleOpenEditVoterModal} handleDeleteVoter={handleDeleteVoter} missingVotersByCourse={missingVotersByCourse}
                    />
                )}
            </main>

            <footer className="bg-gray-800 text-gray-300 py-4 text-center mt-auto">
                <p>&copy; {new Date().getFullYear()} Unidad Educativa Ecuatoriana Austriaca. Todos los derechos reservados.</p>
            </footer>

            <EditVoterModal editingVoter={editingVoter} setEditingVoter={setEditingVoter} handleUpdateVoter={handleUpdateVoter} isLoading={isLoading} />
            <EditElectionModal editingElection={editingElection} setEditingElection={setEditingElection} handleUpdateElection={handleUpdateElection} isLoading={isLoading} />
            
            <Modal show={showDeleteElectionModal} onClose={() => setShowDeleteElectionModal(false)} onConfirm={confirmDeleteElection} title="Eliminar Elección" danger={true}>¿Estás seguro de que deseas eliminar esta elección? Esta acción no se puede deshacer y eliminará todos los votos asociados.</Modal>
            <Modal show={showResetVotesModal} onClose={() => setShowResetVotesModal(false)} onConfirm={confirmResetVotes} title="Resetear Votos" danger={true}>¿Estás seguro de que deseas resetear (borrar) todos los votos de esta elección? Esta acción no se puede deshacer.</Modal>
            <Modal show={showDeleteVoterModal} onClose={() => setShowDeleteVoterModal(false)} onConfirm={confirmDeleteVoter} title="Eliminar Votante" danger={true}>¿Estás seguro de que deseas eliminar a este votante?</Modal>
            <Modal show={showDeleteCourseVotersModal} onClose={() => setShowDeleteCourseVotersModal(false)} onConfirm={confirmDeleteCourseVoters} title="Borrar Votantes por Curso" danger={true}>¿Estás seguro de que deseas borrar a TODOS los votantes del curso <strong>{courseToDelete}</strong>?</Modal>
            <Modal show={showDeleteAllVotersModal} onClose={() => setShowDeleteAllVotersModal(false)} onConfirm={confirmDeleteAllVoters} title="Borrar Todos los Votantes" danger={true}>¿Estás seguro de que deseas borrar a <strong>TODOS</strong> los votantes registrados? Esta acción es irreversible.</Modal>
        </div>
    );
};

export default App;
"""

# We need to replace from `const renderHeader = () => (` until `export default App;` with our `new_return`
final_content = re.sub(r"    const renderHeader = \(\) => \(.*export default App;", new_return, content, flags=re.DOTALL)

with open('src/App.jsx', 'w') as f:
    f.write(final_content)

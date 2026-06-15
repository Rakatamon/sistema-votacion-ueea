/* global XLSX */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    signInAnonymously, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged
} from 'firebase/auth';
import { 
    getFirestore, 
    collection, 
    doc, 
    addDoc, 
    setDoc, 
    getDoc, 
    getDocs, 
    deleteDoc, 
    updateDoc, 
    onSnapshot,
    query,
    where,
    writeBatch,
    deleteField
} from 'firebase/firestore';
// TODO: Para la subida de imágenes, necesitarás importar estas funciones de Firebase Storage
// import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, RadialBarChart, RadialBar, PolarAngleAxis, LabelList } from 'recharts';
import { Users, ListPlus, Vote, BarChart3, LogIn, LogOut, UserPlus, Trash2, Edit3, ImagePlus, PlusCircle, CheckCircle, XCircle, Settings, Home, UploadCloud, Download, AlertTriangle, Filter, UserCheck, UserX, RefreshCw, Eye, ChevronDown } from 'lucide-react';

// Se espera que la librería XLSX (SheetJS) esté disponible globalmente a través de un CDN.
// <script src="https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js"></script>


// --- CONFIGURACIÓN ---
const INSTITUTION_LOGO_URL = 'https://i.imgur.com/cVBYyq3.png';

const colors = {
    primary: 'blue-800', 
    secondary: 'red-600',
    light: 'white',
    darkText: 'gray-800',
    lightText: 'white',
    accent: 'blue-600',
    danger: 'red-600',
    warning: 'yellow-500',
};

// Configuración de Firebase usando variables de entorno
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
// TODO: Inicializa Firebase Storage cuando estés listo para implementar la subida de archivos
// const storage = getStorage(app);

const appId = import.meta.env.VITE_APP_ID || 'voting-app-ueea';

// --- Funciones de Utilidad ---
const getTextColorForBackground = (hexColor) => {
    if (!hexColor || hexColor.length < 7) return 'text-white';
    try {
        const r = parseInt(hexColor.substr(1, 2), 16);
        const g = parseInt(hexColor.substr(3, 2), 16);
        const b = parseInt(hexColor.substr(5, 2), 16);
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return (yiq >= 128) ? 'text-black' : 'text-white';
    } catch (e) {
        return 'text-white';
    }
};

const DEFAULT_COLORS = ['#3182CE', '#38A169', '#DD6B20', '#805AD5', '#E53E3E'];

// --- Componente de Modal Genérico ---
const Modal = ({ show, onClose, onConfirm, title, children, confirmText = "Confirmar", cancelText = "Cancelar", danger = false }) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className={`bg-white rounded-lg shadow-xl p-6 w-full max-w-sm transform transition-all`}>
                <div className="flex items-start">
                    <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${danger ? 'bg-red-100' : 'bg-blue-100'}`}>
                        <AlertTriangle className={`${danger ? 'text-red-600' : 'text-blue-600'}`} size={24} />
                    </div>
                    <div className="ml-4 text-left">
                        <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                            {title}
                        </h3>
                        <div className="mt-2">
                            <p className="text-sm text-gray-500">
                                {children}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <button
                        type="button"
                        onClick={onConfirm}
                        className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white ${danger ? `bg-red-600 hover:bg-red-700 focus:ring-red-500` : `bg-blue-600 hover:bg-blue-700 focus:ring-blue-500`} focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm`}
                    >
                        {confirmText}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                    >
                        {cancelText}
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- Componente Principal ---
function App() {
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [view, setView] = useState('loginChoice');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [adminSection, setAdminSection] = useState('dashboard'); 
    const [studentId, setStudentId] = useState('');
    const [currentVoter, setCurrentVoter] = useState(null);
    const [activeElectionForVoting, setActiveElectionForVoting] = useState(null);
    const [elections, setElections] = useState([]);
    const [voters, setVoters] = useState([]);
    const [voteCounts, setVoteCounts] = useState([]);
    const [courseVoteCounts, setCourseVoteCounts] = useState([]);
    const [electionOptions, setElectionOptions] = useState([{ name: '', iconUrl: '', color: DEFAULT_COLORS[0] }]); 
    const [newElectionName, setNewElectionName] = useState('');
    const [newVoterId, setNewVoterId] = useState('');
    const [newVoterName, setNewVoterName] = useState('');
    const [newVoterCourseLevel, setNewVoterCourseLevel] = useState('');
    const [newVoterCourseName, setNewVoterCourseName] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const [editingVoter, setEditingVoter] = useState(null);
    const [editingElection, setEditingElection] = useState(null);
    const [modalState, setModalState] = useState({ show: false, title: '', message: '', onConfirm: () => {}, danger: false });
    const [courseFilter, setCourseFilter] = useState('all');
    const [voterListView, setVoterListView] = useState('all');
    const [expandedCourse, setExpandedCourse] = useState(null);
    
    const filteredVoters = useMemo(() => {
        if (courseFilter === 'all') {
            return voters;
        }
        return voters.filter(voter => `${voter.courseLevel} ${voter.courseName}` === courseFilter);
    }, [voters, courseFilter]);

    const uniqueCourses = useMemo(() => {
        const courseSet = new Set(voters.map(v => `${v.courseLevel} ${v.courseName}`));
        return Array.from(courseSet).sort();
    }, [voters]);

    const dashboardStats = useMemo(() => {
        const election = elections.find(e => e.isActive);
        if (!election) return { totalVoters: voters.length, votedCount: 0, missingCount: voters.length, participation: 0 };
        const votedCount = voters.filter(v => v.hasVoted && v.hasVoted[election.id]).length;
        const totalVoters = voters.length;
        const missingCount = totalVoters - votedCount;
        const participation = totalVoters > 0 ? (votedCount / totalVoters) * 100 : 0;
        return { totalVoters, votedCount, missingCount, participation };
    }, [voters, elections]);

    const participationByCourse = useMemo(() => {
        const election = elections.find(e => e.isActive);
        if (!election || voters.length === 0) return [];
        return uniqueCourses.map(courseName => {
            const courseVoters = voters.filter(v => `${v.courseLevel} ${v.courseName}` === courseName);
            const voted = courseVoters.filter(v => v.hasVoted && v.hasVoted[election.id] && `${v.courseLevel} ${v.courseName}` === courseName).length;
            return {
                name: courseName,
                "Votos Emitidos": voted,
                "Faltan por Votar": courseVoters.length - voted,
                total: courseVoters.length
            };
        });
    }, [voters, elections, uniqueCourses]);

    const missingVotersByCourse = useMemo(() => {
        const activeElection = elections.find(e => e.isActive);
        if (!activeElection) return {};

        const missing = voters.filter(
            voter => !voter.hasVoted || !voter.hasVoted[activeElection.id]
        );

        return missing.reduce((acc, voter) => {
            const courseKey = `${voter.courseLevel} ${voter.courseName}`;
            if (!acc[courseKey]) {
                acc[courseKey] = [];
            }
            acc[courseKey].push(voter);
            return acc;
        }, {});
    }, [voters, elections]);


    const showModal = ({ title, message, onConfirm, danger = false }) => {
        setModalState({ show: true, title, message, onConfirm, danger });
    };

    const hideModal = () => {
        setModalState({ show: false, title: '', message: '', onConfirm: () => {} });
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                const isAdminUser = !currentUser.isAnonymous && currentUser.providerData.some(p => p.providerId === 'password');
                setIsAdmin(isAdminUser);
                if (isAdminUser) {
                    setView('adminDashboard');
                }
                setIsLoading(false);
            } else {
                // Si no hay usuario, intentar autenticación anónima
                try {
                    setIsLoading(true);
                    await signInAnonymously(auth);
                    // El estado se actualizará automáticamente por onAuthStateChanged
                } catch (error) {
                    console.error("Error en autenticación anónima:", error);
                    setError(`Error de conexión: ${error.message}. Intenta recargar la página.`);
                    setIsLoading(false);
                }
                setIsAdmin(false);
                if (!currentUser) {
                    setView('loginChoice');
                }
            }
        });

        return () => unsubscribe();
    }, []);

    const handleAdminLogin = async (e) => {
        e.preventDefault();
        setError(''); setSuccess('');
        setIsLoading(true);
        try {
            await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
            setSuccess('Login de administrador exitoso.'); 
        } catch (error) {
            console.error("Error de login de administrador:", error);
            setError('Error al iniciar sesión. Verifique credenciales.');
        }
        setIsLoading(false);
    };

    const handleLogout = async () => {
        setError(''); 
        setSuccess('');
        
        if (user && !user.isAnonymous) {
            await signOut(auth);
        }
        
        setCurrentVoter(null);
        setActiveElectionForVoting(null);
        setStudentId('');
        setView('loginChoice');
    };

    const clearMessages = useCallback(() => {
        setError('');
        setSuccess('');
    }, []);
    
    const electionCollectionPath = `/artifacts/${appId}/public/data/elections`;

    useEffect(() => {
        if (!user) return; 

        const q = query(collection(db, electionCollectionPath));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const electionsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setElections(electionsData);
            
            if(view === 'studentVoting' && currentVoter) {
                const activeElec = electionsData.find(e => e.isActive);
                if (activeElec) {
                    if (currentVoter.hasVoted && currentVoter.hasVoted[activeElec.id]) {
                        setActiveElectionForVoting(null); 
                        setView('studentVoted');
                    } else {
                        setActiveElectionForVoting(activeElec);
                    }
                } else {
                    setActiveElectionForVoting(null);
                    setView('studentNoElection'); 
                }
            }
        }, (err) => {
            console.error("Error fetching elections: ", err);
            setError("Error al cargar elecciones. Verifique los permisos de la base de datos.");
        });
        return () => unsubscribe();
    }, [user, view, currentVoter]);

    const handleAddElectionOption = () => {
        const newColor = DEFAULT_COLORS[electionOptions.length % DEFAULT_COLORS.length];
        setElectionOptions([...electionOptions, { name: '', iconUrl: '', color: newColor }]);
    };

    const handleElectionOptionChange = (index, field, value) => {
        const newOptions = [...electionOptions];
        newOptions[index][field] = value;
        setElectionOptions(newOptions);
    };

    const handleRemoveElectionOption = (index) => {
        const newOptions = electionOptions.filter((_, i) => i !== index);
        setElectionOptions(newOptions);
    };
    
    const handleCreateElection = async (e) => {
        e.preventDefault();
        clearMessages();
        if (!newElectionName.trim() || electionOptions.some(opt => !opt.name.trim())) {
            setError("Nombre de elección y nombre de todas las opciones son requeridos.");
            return;
        }

        setIsLoading(true);
        try {
            const specialOptions = [
                { id: `opt${Date.now()}blank`, name: 'Voto en Blanco', iconUrl: '', color: '#A0AEC0' },
                { id: `opt${Date.now()}null`, name: 'Voto Nulo', iconUrl: '', color: '#4A5568' }
            ];

            const allOptions = [...electionOptions, ...specialOptions];

            const finalOptions = allOptions.map((opt, index) => ({ 
                id: opt.id || `opt${Date.now()}${index}`, 
                name: opt.name.trim(), 
                iconUrl: opt.iconUrl ? opt.iconUrl.trim() : '',
                color: opt.color || DEFAULT_COLORS[0]
            }));

            await addDoc(collection(db, electionCollectionPath), {
                name: newElectionName.trim(),
                options: finalOptions,
                isActive: false, 
                resultsPublic: false,
                createdAt: new Date(),
            });
            setSuccess(`Elección "${newElectionName}" creada exitosamente.`);
            setNewElectionName('');
            setElectionOptions([{ name: '', iconUrl: '', color: DEFAULT_COLORS[0] }]);
        } catch (err) {
            console.error("Error creando elección:", err);
            setError("Error al crear la elección.");
        }
        setIsLoading(false);
    };

    const handleOpenEditElectionModal = (election) => {
        setEditingElection({ ...election, options: [...election.options] });
    };

    const handleUpdateElection = async (e) => {
        e.preventDefault();
        clearMessages();

        if (!editingElection || !editingElection.name.trim() || editingElection.options.some(opt => !opt.name.trim())) {
            setError("El nombre de la elección y de todas sus opciones son requeridos.");
            return;
        }
        setIsLoading(true);
        try {
            const electionRef = doc(db, electionCollectionPath, editingElection.id);
            await updateDoc(electionRef, {
                name: editingElection.name,
                options: editingElection.options
            });
            setSuccess(`Elección "${editingElection.name}" actualizada exitosamente.`);
            setEditingElection(null);
        } catch (err) {
            console.error("Error actualizando elección:", err);
            setError("No se pudo actualizar la elección.");
        }
        setIsLoading(false);
    };

    const handleToggleElectionStatus = async (electionId, currentStatus) => {
        clearMessages();
        setIsLoading(true);
        const batch = writeBatch(db);
        try {
            if (!currentStatus) { 
                elections.forEach(election => {
                    if (election.id !== electionId && election.isActive) {
                        batch.update(doc(db, electionCollectionPath, election.id), { isActive: false });
                    }
                });
            }
            const electionRef = doc(db, electionCollectionPath, electionId);
            batch.update(electionRef, { isActive: !currentStatus });
            await batch.commit();
            setSuccess(`Estado de la elección actualizado.`);
        } catch (err) {
            console.error("Error actualizando estado de elección:", err);
            setError("Error al actualizar estado de la elección.");
        }
        setIsLoading(false);
    };

    const handleTogglePublishResults = async (electionId, currentStatus) => {
        clearMessages();
        setIsLoading(true);
        try {
            const batch = writeBatch(db);
            if (!currentStatus) {
                elections.forEach(election => {
                    if (election.id !== electionId && election.resultsPublic) {
                        batch.update(doc(db, electionCollectionPath, election.id), { resultsPublic: false });
                    }
                });
            }
            const electionRef = doc(db, electionCollectionPath, electionId);
            batch.update(electionRef, { resultsPublic: !currentStatus });
            await batch.commit();
            setSuccess(`Visibilidad de resultados actualizada.`);
        } catch (err) {
            console.error("Error publicando resultados:", err);
            setError("Error al cambiar la visibilidad de los resultados.");
        }
        setIsLoading(false);
    };
    
    const handleDeleteElection = (electionId) => {
        showModal({
            title: "Confirmar Eliminación",
            message: "¿Estás seguro de que quieres eliminar esta elección? Todos los votos asociados también serán borrados permanentemente.",
            danger: true,
            onConfirm: async () => {
                hideModal();
                clearMessages();
                setIsLoading(true);
                try {
                    const batch = writeBatch(db);
                    const votesPath = `/artifacts/${appId}/public/data/votes`;
                    const votesQuery = query(collection(db, votesPath), where("electionId", "==", electionId));
                    const votesSnapshot = await getDocs(votesQuery);
                    votesSnapshot.forEach(voteDoc => batch.delete(voteDoc.ref));
                    const electionDocRef = doc(db, electionCollectionPath, electionId);
                    batch.delete(electionDocRef);
                    await batch.commit();
                    setSuccess("Elección y votos asociados eliminados.");
                } catch (err) {
                    console.error("Error eliminando elección:", err);
                    setError("Error al eliminar la elección.");
                }
                setIsLoading(false);
            }
        });
    };

    const handleResetVotes = (electionId) => {
        showModal({
            title: "Resetear Votos",
            message: "Esta acción eliminará TODOS los votos de esta elección y permitirá que los estudiantes vuelvan a votar. Es irreversible. ¿Estás seguro?",
            danger: true,
            onConfirm: async () => {
                hideModal();
                setIsLoading(true);
                clearMessages();
                try {
                    const batch = writeBatch(db);
                    const votesQuery = query(collection(db, `/artifacts/${appId}/public/data/votes`), where("electionId", "==", electionId));
                    const votesSnapshot = await getDocs(votesQuery);
                    votesSnapshot.forEach(voteDoc => {
                        batch.delete(voteDoc.ref);
                    });

                    const votersQuery = query(collection(db, voterCollectionPath));
                    const votersSnapshot = await getDocs(votersQuery);
                    votersSnapshot.forEach(voterDoc => {
                        const fieldToUpdate = `hasVoted.${electionId}`;
                        batch.update(voterDoc.ref, { [fieldToUpdate]: deleteField() });
                    });

                    await batch.commit();
                    setSuccess("Los votos de la elección han sido reseteados exitosamente.");

                } catch (err) {
                    console.error("Error reseteando votos:", err);
                    setError("Ocurrió un error al resetear los votos.");
                }
                setIsLoading(false);
            }
        });
    };

    const voterCollectionPath = `/artifacts/${appId}/public/data/voters`;
    useEffect(() => {
        if (!isAdmin) return;
        const q = query(collection(db, voterCollectionPath));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const votersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setVoters(votersData);
        }, (err) => {
            console.error("Error fetching voters: ", err);
            setError("Error al cargar votantes.");
        });
        return () => unsubscribe();
    }, [isAdmin, db, appId]);
    
    const handleCreateVoter = async (e) => {
        e.preventDefault();
        clearMessages();
        if (!newVoterId.trim() || !newVoterName.trim() || !newVoterCourseLevel.trim() || !newVoterCourseName.trim()) {
            setError("Todos los campos del votante son requeridos.");
            return;
        }
        setIsLoading(true);
        try {
            const voterRef = doc(db, voterCollectionPath, newVoterId.trim());
            const voterSnap = await getDoc(voterRef);
            if (voterSnap.exists()) {
                setError(`El código estudiantil "${newVoterId.trim()}" ya existe.`);
                setIsLoading(false);
                return;
            }
            await setDoc(voterRef, {
                fullName: newVoterName.trim(),
                courseLevel: newVoterCourseLevel.trim(),
                courseName: newVoterCourseName.trim(),
                hasVoted: {} 
            });
            setSuccess(`Votante "${newVoterName.trim()}" creado.`);
            setNewVoterId('');
            setNewVoterName(''); 
            setNewVoterCourseLevel(''); 
            setNewVoterCourseName('');
        } catch (err) {
            console.error("Error creando votante:", err);
            setError("Error al crear el votante.");
        }
        setIsLoading(false);
    };
    const handleOpenEditVoterModal = (voter) => {
        setEditingVoter({ ...voter });
    };
    const handleUpdateVoter = async (e) => {
        e.preventDefault();
        clearMessages();
        const { id, fullName, courseLevel, courseName } = editingVoter;
        if (!fullName.trim() || !courseLevel.trim() || !courseName.trim()) {
            setError("Todos los campos del votante son requeridos para editar.");
            return;
        }
        
        setIsLoading(true);
        try {
            const voterRef = doc(db, voterCollectionPath, id);
            await updateDoc(voterRef, {
                fullName: fullName.trim(),
                courseLevel: courseLevel.trim(),
                courseName: courseName.trim(),
            });
            setSuccess(`Votante "${fullName}" actualizado exitosamente.`);
            setEditingVoter(null);
        } catch(err) {
            console.error("Error actualizando votante:", err);
            setError("Error al actualizar el votante.");
        }
        setIsLoading(false);
    };
    const handleDeleteVoter = (voterId) => {
        showModal({
            title: "Confirmar Eliminación",
            message: `¿Estás seguro de que quieres eliminar al votante con código "${voterId}"? Esta acción no se puede deshacer.`,
            danger: true,
            onConfirm: async () => {
                hideModal();
                clearMessages();
                setIsLoading(true);
                try {
                    await deleteDoc(doc(db, voterCollectionPath, voterId));
                    setSuccess("Votante eliminado exitosamente.");
                } catch (err) {
                    console.error("Error eliminando votante:", err);
                    setError("Error al eliminar el votante.");
                }
                setIsLoading(false);
            }
        });
    };

    const handleDeleteCourseVoters = (course) => {
        showModal({
            title: `Borrar Curso: ${course}`,
            message: `¿Estás seguro de que quieres eliminar a TODOS los votantes del curso "${course}"? Esta acción no se puede deshacer.`,
            danger: true,
            onConfirm: async () => {
                hideModal();
                setIsLoading(true);
                clearMessages();
                try {
                    const batch = writeBatch(db);
                    const votersToDelete = voters.filter(v => `${v.courseLevel} ${v.courseName}` === course);
                    votersToDelete.forEach(voter => {
                        batch.delete(doc(db, voterCollectionPath, voter.id));
                    });
                    await batch.commit();
                    setSuccess(`Todos los votantes del curso "${course}" han sido eliminados.`);
                } catch(err) {
                    console.error("Error borrando el curso:", err);
                    setError("No se pudieron eliminar los votantes del curso.");
                }
                setIsLoading(false);
            }
        });
    };
    
    const handleDeleteAllVoters = () => {
        showModal({
            title: "BORRAR TODOS LOS VOTANTES",
            message: `¡ACCIÓN PELIGROSA! ¿Estás absolutamente seguro de que quieres eliminar a TODOS los ${voters.length} votantes registrados? Esta acción es irreversible y no se podrá deshacer.`,
            danger: true,
            confirmText: "Sí, borrar todo",
            onConfirm: async () => {
                hideModal();
                setIsLoading(true);
                clearMessages();
                try {
                    const votersSnapshot = await getDocs(collection(db, voterCollectionPath));
                    const batches = [];
                    let currentBatch = writeBatch(db);
                    let operationCount = 0;

                    votersSnapshot.docs.forEach(doc => {
                        currentBatch.delete(doc.ref);
                        operationCount++;
                        if (operationCount === 499) {
                            batches.push(currentBatch);
                            currentBatch = writeBatch(db);
                            operationCount = 0;
                        }
                    });

                    if (operationCount > 0) {
                        batches.push(currentBatch);
                    }
                    await Promise.all(batches.map(b => b.commit()));

                    setSuccess(`Todos los ${voters.length} votantes han sido eliminados.`);
                } catch(err) {
                    console.error("Error borrando todos los votantes:", err);
                    setError("Ocurrió un error al eliminar a todos los votantes.");
                }
                setIsLoading(false);
            }
        });
    };

    const handleFileUpload = (event) => {
        clearMessages();
        const file = event.target.files[0];
        if (!file) return setError("No se seleccionó ningún archivo.");
        if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
            if (event.target) event.target.value = null; 
            return setError("Formato de archivo no soportado.");
        }
        if (typeof window.XLSX === 'undefined') return setError("La librería de lectura de Excel (XLSX) no está cargada.");
        
        setIsImporting(true);
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = e.target.result;
                const workbook = window.XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                
                const json = window.XLSX.utils.sheet_to_json(worksheet, { raw: false });
                if (json.length === 0) {
                     setError("El archivo está vacío o no tiene el formato esperado.");
                     setIsImporting(false);
                     if(event.target) event.target.value = null;
                     return;
                }
                
                const expectedHeaders = ["Código Estudiantil", "Nombre Completo", "Nivel Curso", "Nombre Curso"];
                const actualHeaders = Object.keys(json[0]);
                const missingHeaders = expectedHeaders.filter(h => !actualHeaders.includes(h));
                if (missingHeaders.length > 0) {
                    setError(`El archivo no contiene las columnas requeridas: ${missingHeaders.join(", ")}.`);
                    setIsImporting(false);
                    if(event.target) event.target.value = null;
                    return;
                }
                
                const batches = [];
                let currentBatch = writeBatch(db);
                let operationCount = 0;
                let processedCount = 0;

                for (const row of json) {
                    const studentId = row["Código Estudiantil"]?.toString().trim();
                    const fullName = row["Nombre Completo"]?.toString().trim();
                    const courseLevel = row["Nivel Curso"]?.toString().trim();
                    const courseName = row["Nombre Curso"]?.toString().trim();
                    
                    if (!studentId || !fullName || !courseLevel || !courseName) {
                        continue;
                    }

                    const voterRef = doc(db, voterCollectionPath, studentId);
                    currentBatch.set(voterRef, { fullName, courseLevel, courseName, hasVoted: {} });
                    operationCount++;
                    processedCount++;

                    if (operationCount === 499) {
                        batches.push(currentBatch);
                        currentBatch = writeBatch(db);
                        operationCount = 0;
                    }
                }

                if (operationCount > 0) {
                    batches.push(currentBatch);
                }

                if (batches.length > 0) {
                    await Promise.all(batches.map(batch => batch.commit()));
                    setSuccess(`${processedCount} registros de votantes procesados exitosamente.`);
                } else {
                    setError("No se encontraron votantes válidos para importar en el archivo.");
                }

            } catch (err) {
                console.error("Error importando votantes:", err);
                setError("Error al procesar el archivo. Verifique el formato y los datos.");
            } finally {
                setIsImporting(false);
                if(event.target) event.target.value = null; 
            }
        };
        reader.onerror = () => {
            setIsImporting(false);
            setError("Error al leer el archivo.");
            if(event.target) event.target.value = null;
        }
        reader.readAsBinaryString(file);
    };

    const handleDownloadTemplate = () => {
        const headers = ["Código Estudiantil", "Nombre Completo", "Nivel Curso", "Nombre Curso"];
        const exampleRow1 = ["12345678", "Estudiante Ejemplo 1", "1BGU", "A"];
        const exampleRow2 = ["87654321", "Estudiante Ejemplo 2", "2Bach", "B"];

        let csvContent = "\uFEFF";
        csvContent += headers.join(",") + "\r\n";
        csvContent += exampleRow1.join(",") + "\r\n";
        csvContent += exampleRow2.join(",") + "\r\n";

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) { 
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", "plantilla_votantes.csv");
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    };

    const handleStudentLogin = async (e) => {
        e.preventDefault();
        clearMessages();
        if (!studentId.trim()) return setError("Por favor, ingresa tu código estudiantil.");
        
        setIsLoading(true);
        try {
            // Asegurar que hay un usuario autenticado
            if (!auth.currentUser) {
                await signInAnonymously(auth);
                // Esperar un momento para que la autenticación se complete
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            const voterRef = doc(db, voterCollectionPath, studentId.trim());
            const voterSnap = await getDoc(voterRef);
            if (voterSnap.exists()) {
                const voterData = { id: voterSnap.id, ...voterSnap.data() };
                setCurrentVoter(voterData);
                setSuccess(`Bienvenido/a ${voterData.fullName}.`);
                setView('studentVoting'); 
            } else {
                setError("Código estudiantil no encontrado. Verifica tu código.");
                setCurrentVoter(null);
            }
        } catch (err) {
            console.error("Error en login de estudiante:", err);
            setError(`Error al verificar el código de estudiante: ${err.message}`);
        }
        setIsLoading(false);
    };



    const handleCastVote = (electionId, optionId) => {
        if (!currentVoter || !activeElectionForVoting || activeElectionForVoting.id !== electionId) return setError("Error: No se pudo identificar al votante o la elección.");
        if (currentVoter.hasVoted && currentVoter.hasVoted[electionId]) return setError("Ya has votado en esta elección.");
        const optionNameToConfirm = activeElectionForVoting.options.find(o => o.id === optionId)?.name;
        showModal({
            title: "Confirmar Voto",
            message: `¿Confirmas tu voto por "${optionNameToConfirm}"? Esta acción no se puede deshacer.`,
            onConfirm: async () => {
                hideModal();
                clearMessages();
                setIsLoading(true);
                try {
                    const voteData = { electionId, optionId, voterCode: currentVoter.id, courseLevel: currentVoter.courseLevel, courseName: currentVoter.courseName, timestamp: new Date() };
                    await addDoc(collection(db, `/artifacts/${appId}/public/data/votes`), voteData);
                    const voterRef = doc(db, voterCollectionPath, currentVoter.id);
                    const updatedHasVoted = { ...currentVoter.hasVoted, [electionId]: true };
                    await updateDoc(voterRef, { hasVoted: updatedHasVoted });
                    setCurrentVoter(prev => ({...prev, hasVoted: updatedHasVoted})); 
                    setSuccess("¡Voto registrado exitosamente! Gracias por participar.");
                    setView('studentVoted'); 
                } catch (err) {
                    console.error("Error al registrar el voto:", err);
                    setError("Ocurrió un error al registrar tu voto. Inténtalo de nuevo.");
                }
                setIsLoading(false);
            }
        });
    };
    useEffect(() => {
        if (!isAdmin || adminSection !== 'dashboard') return;
        const activeElection = elections.find(e => e.isActive);
        if (!activeElection) {
            setVoteCounts([]); setCourseVoteCounts([]); return;
        }
        const votesCollectionPath = `/artifacts/${appId}/public/data/votes`;
        const qVotes = query(collection(db, votesCollectionPath), where("electionId", "==", activeElection.id));
        const unsubscribe = onSnapshot(qVotes, (snapshot) => {
            const newVoteCounts = activeElection.options.map(opt => ({ name: opt.name, id: opt.id, votes: 0, color: opt.color }));
            const newCourseVoteCounts = {}; 
            snapshot.forEach(voteDoc => {
                const vote = voteDoc.data();
                const optionVoted = activeElection.options.find(opt => opt.id === vote.optionId);
                if (optionVoted) {
                    const targetOptionInGeneral = newVoteCounts.find(vc => vc.id === optionVoted.id);
                    if (targetOptionInGeneral) targetOptionInGeneral.votes += 1;
                    const courseKey = `${vote.courseLevel} ${vote.courseName}`;
                    if (!newCourseVoteCounts[courseKey]) {
                        newCourseVoteCounts[courseKey] = activeElection.options.reduce((acc, opt) => {
                            acc[opt.id] = { name: opt.name, votes: 0, color: opt.color };
                            return acc;
                        }, { courseDisplayName: courseKey });
                    }
                    if(newCourseVoteCounts[courseKey][optionVoted.id]) {
                        newCourseVoteCounts[courseKey][optionVoted.id].votes += 1;
                    }
                }
            });
            setVoteCounts(newVoteCounts);
            const courseVoteArray = Object.values(newCourseVoteCounts).map(course => ({
                courseDisplayName: course.courseDisplayName,
                options: activeElection.options.map(opt => ({
                    id: opt.id,
                    name: opt.name, 
                    value: course[opt.id] ? course[opt.id].votes : 0, 
                    color: opt.color
                }))
            }));
            setCourseVoteCounts(courseVoteArray);
        }, (err) => {
            console.error("Error fetching votes for dashboard: ", err);
            setError("Error al cargar los resultados.");
        });
        return () => unsubscribe();
    }, [isAdmin, adminSection, elections, db, appId]);
    
    const handleExportResults = () => {
        clearMessages();
        const activeElection = elections.find(e => e.isActive);
        if (!activeElection) return setError("No hay una elección activa para exportar resultados.");
        if (typeof window.XLSX === 'undefined') return setError("La librería de exportación a Excel (XLSX) no está cargada.");

        const generalResultsData = voteCounts.map(item => ({"Opción": item.name, "Total Votos": item.votes}));
        const courseResultsData = courseVoteCounts.map(course => {
            const row = { "Curso": course.courseDisplayName };
            course.options.forEach(option => { row[option.name] = option.value; });
            return row;
        });
        const participantsData = voters
            .filter(voter => voter.hasVoted && voter.hasVoted[activeElection.id])
            .map(voter => ({"Código Estudiantil": voter.id, "Nombre Completo": voter.fullName, "Curso": `${voter.courseLevel} ${voter.courseName}`}));
        const totalVotersCount = voters.length;
        const votedCount = participantsData.length;
        const participationPercentage = totalVotersCount > 0 ? ((votedCount / totalVotersCount) * 100).toFixed(2) : 0;
        const participationSummaryData = [
            { "Métrica": "Total de Votantes Habilitados", "Valor": totalVotersCount },
            { "Métrica": "Total de Votos Emitidos", "Valor": votedCount },
            { "Métrica": "Porcentaje de Participación (%)", "Valor": participationPercentage },
        ];
        const wb = XLSX.utils.book_new();
        const wsGeneral = XLSX.utils.json_to_sheet(generalResultsData);
        const wsCourses = XLSX.utils.json_to_sheet(courseResultsData);
        const wsParticipants = XLSX.utils.json_to_sheet(participantsData);
        const wsParticipation = XLSX.utils.json_to_sheet(participationSummaryData);
        wsGeneral['!cols'] = [{ wch: 30 }, { wch: 15 }];
        wsCourses['!cols'] = [{ wch: 25 }, ...activeElection.options.map(o => ({ wch: o.name.length > 15 ? o.name.length : 15 }))];
        wsParticipants['!cols'] = [{ wch: 20 }, { wch: 30 }, { wch: 20 }];
        wsParticipation['!cols'] = [{ wch: 40 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, wsGeneral, "Resumen General");
        XLSX.utils.book_append_sheet(wb, wsCourses, "Resultados por Curso");
        XLSX.utils.book_append_sheet(wb, wsParticipants, "Lista de Participantes");
        XLSX.utils.book_append_sheet(wb, wsParticipation, "Resumen de Participación");
        XLSX.writeFile(wb, `Resultados_${activeElection.name.replace(/\s+/g, '_')}.xlsx`);
        setSuccess("Reporte exportado exitosamente.");
    };

    if (isLoading) { 
        return <div className={`flex justify-center items-center h-screen bg-gray-100`}><div className="text-xl font-semibold text-gray-700">Cargando Sistema de Votación...</div></div>;
    }

    const renderHeader = () => (
        <header className={`bg-${colors.primary} text-${colors.lightText} p-4 shadow-md sticky top-0 z-40`}>
            <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center">
                <div className="flex items-center mb-2 sm:mb-0">
                    <img src={INSTITUTION_LOGO_URL} alt="Logo Institución" className="h-10 w-10 mr-3 rounded-full object-contain bg-white p-0.5" onError={(e) => { e.target.style.display = 'none'; }} />
                    <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-center sm:text-left">UNIDAD EDUCATIVA ECUATORIANA AUSTRIACA</h1>
                </div>
                <div>
                {(user && !user.isAnonymous || currentVoter) && (
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

    const renderMessages = () => (
        <div className="my-3 mx-auto max-w-xl px-4">
            {error && <div className={`p-3 bg-red-100 text-red-700 border border-red-300 rounded-md text-sm flex justify-between items-center`}><span>{error}</span> <button onClick={clearMessages} className="ml-2 text-red-700 font-bold text-lg">&times;</button></div>}
            {success && <div className={`p-3 bg-green-100 text-green-700 border border-green-300 rounded-md text-sm flex justify-between items-center`}><span>{success}</span> <button onClick={clearMessages} className="ml-2 text-green-700 font-bold text-lg">&times;</button></div>}
        </div>
    );
    
    const renderLoginChoice = () => (
        <div className={`w-full max-w-md text-center`}>
            {!user && (
                <div className="mb-4 p-3 bg-yellow-100 text-yellow-700 border border-yellow-300 rounded-md text-sm flex items-center justify-center">
                    <RefreshCw className="animate-spin mr-2" size={16} />
                    Conectando con el servidor...
                </div>
            )}
            {user && user.isAnonymous && (
                <div className="mb-4 p-3 bg-green-100 text-green-700 border border-green-300 rounded-md text-sm flex items-center justify-center">
                    <CheckCircle className="mr-2" size={16} />
                    Conectado al servidor
                </div>
            )}
            <div className={`bg-white p-8 sm:p-12 rounded-xl shadow-2xl`}>
                <img src={INSTITUTION_LOGO_URL} alt="Logo Institución" className="h-24 w-24 mx-auto mb-6 rounded-full object-contain bg-gray-100 p-1" onError={(e) => { e.target.style.display = 'none'; }}/>
                <h2 className={`text-3xl font-bold text-gray-800 mb-2`}>Sistema de Votación</h2>
                <p className={`text-gray-600 mb-4 text-center`}>Ingresa tu código estudiantil o matrícula para votar.</p>
                <form onSubmit={handleStudentLogin}>
                    <div className="mb-4">
                        <label className={`block text-gray-700 text-sm font-bold mb-2`} htmlFor="studentId">Código Estudiantil</label>
                        <input 
                            type="text" 
                            id="studentId" 
                            value={studentId} 
                            onChange={(e) => setStudentId(e.target.value)} 
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline disabled:bg-gray-100" 
                            required 
                            disabled={!user || isLoading}
                        />
                    </div>
                    {renderMessages()}
                    <button 
                        type="submit" 
                        disabled={isLoading || !user} 
                        className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline disabled:opacity-50 text-lg transition-all flex items-center justify-center`}
                    >
                        {isLoading ? (
                            <>
                                <RefreshCw className="animate-spin mr-2" size={18} />
                                Verificando...
                            </>
                        ) : !user ? (
                            <>
                                <RefreshCw className="animate-spin mr-2" size={18} />
                                Conectando...
                            </>
                        ) : 'Acceder para Votar'}
                    </button>
                </form>
            </div>
        </div>
    );

    const renderAdminLogin = () => (
        <div className={`flex items-center justify-center min-h-full bg-gray-100 p-4`}>
            <div className={`bg-white p-8 rounded-lg shadow-xl w-full max-w-md`}>
                <button onClick={() => {setView('loginChoice'); clearMessages();}} className={`mb-4 text-blue-600 hover:text-blue-800 font-semibold flex items-center`}><Home size={18} className="mr-1"/> Volver</button>
                <h2 className={`text-2xl font-bold text-gray-800 mb-6 text-center`}>Login Administrador</h2>
                <form onSubmit={handleAdminLogin}>
                    <div className="mb-4">
                        <label className={`block text-gray-700 text-sm font-bold mb-2`} htmlFor="adminEmail">Email</label>
                        <input type="email" id="adminEmail" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
                    </div>
                    <div className="mb-6">
                        <label className={`block text-gray-700 text-sm font-bold mb-2`} htmlFor="adminPassword">Contraseña</label>
                        <input type="password" id="adminPassword" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline" required />
                    </div>
                    {renderMessages()}
                    <button type="submit" disabled={isLoading} className={`w-full bg-blue-800 hover:bg-blue-900 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50`}>
                        {isLoading ? 'Iniciando...' : 'Iniciar Sesión'}
                    </button>
                </form>
            </div>
        </div>
    );
    
    const renderStudentVoting = () => {
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
                {renderMessages()}
                {activeElectionForVoting ? (
                    <div className={`bg-white p-6 rounded-lg shadow-lg max-w-4xl mx-auto`}>
                        <h2 className={`text-2xl md:text-3xl font-bold text-center text-gray-800 mb-2`}>Elección Activa: {activeElectionForVoting.name}</h2>
                        <p className={`text-gray-600 mb-6 text-center`}>Hola <span className="font-semibold">{currentVoter?.fullName}</span>, por favor selecciona una opción.</p>
                        
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
                    <div className={`bg-white p-6 rounded-lg shadow-lg text-center max-w-lg mx-auto`}>
                        <h2 className={`text-2xl font-semibold text-gray-700 mb-4`}>Procesando...</h2>
                        <p className={`text-gray-600`}>Verificando estado de la votación.</p>
                    </div>
                )}
            </div>
        );
    }

    const renderStudentVotedOrNoElection = (messageTitle, messageBody, icon = <CheckCircle size={48} className={`mx-auto text-green-500 mb-4`} />) => (
       <div className="container mx-auto p-4 md:p-6">
            {renderMessages()}
            <div className={`bg-white p-6 rounded-lg shadow-lg text-center max-w-lg mx-auto`}>
                {icon}
                <h2 className={`text-2xl md:text-3xl font-bold text-gray-800 mb-4`}>{messageTitle}</h2>
                <p className={`text-gray-600 mb-6`}>{messageBody}</p>
                <button
                    onClick={handleLogout}
                    className={`bg-blue-800 hover:bg-blue-900 text-white font-semibold py-2 px-4 rounded-lg flex items-center mx-auto`}
                >
                    <LogOut size={18} className="mr-2" /> Finalizar Sesión
                </button>
            </div>
       </div>
    );
    
    const renderAdminDashboard = () => (
        <div className="container mx-auto p-4">
            <h2 className={`text-3xl font-bold text-gray-800 mb-6`}>Panel de Administrador</h2>
            <div className="flex flex-wrap space-x-0 sm:space-x-2 mb-6 border-b">
                <button onClick={() => { setAdminSection('dashboard'); clearMessages(); }} className={`py-2 px-3 sm:px-4 text-sm sm:text-base font-semibold ${adminSection === 'dashboard' ? `border-b-2 border-indigo-500 text-indigo-600` : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                    <BarChart3 size={18} className="inline mr-1" /> Resultados
                </button>
                <button onClick={() => { setAdminSection('elections'); clearMessages(); }} className={`py-2 px-3 sm:px-4 text-sm sm:text-base font-semibold ${adminSection === 'elections' ? `border-b-2 border-indigo-500 text-indigo-600` : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                    <ListPlus size={18} className="inline mr-1" /> Elecciones
                </button>
                <button onClick={() => { setAdminSection('voters'); clearMessages(); }} className={`py-2 px-3 sm:px-4 text-sm sm:text-base font-semibold ${adminSection === 'voters' ? `border-b-2 border-indigo-500 text-indigo-600` : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                    <Users size={18} className="inline mr-1" /> Votantes
                </button>
            </div>
            {renderMessages()} 
            {adminSection === 'dashboard' && renderResultsDashboard({ isAdmin: true })}
            {adminSection === 'elections' && renderElectionManagement()}
            {adminSection === 'voters' && renderVoterManagement()}
        </div>
    );
    
    const renderResultsDashboard = ({ isAdmin = false }) => {
        const election = elections.find(e => e.isActive);
        const currentVoteCounts = voteCounts;
        const currentParticipationByCourse = participationByCourse;
        const currentDashboardStats = dashboardStats;
        const currentCourseVoteCounts = courseVoteCounts;

        if (!election) {
            return (
                 <div className="container mx-auto p-4">
                    <div className={`text-center text-gray-600 p-5 bg-white rounded-lg shadow`}>
                       "No hay una elección activa. Active una para ver resultados."
                    </div>
                </div>
            );
        }

        const participationData = [{ name: 'Participación', value: currentDashboardStats.participation, fill: colors.accent }];

        return (
            <div className="container mx-auto p-4 space-y-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <h3 className={`text-2xl font-semibold text-gray-800 mb-2 sm:mb-0`}>Resultados: {election.name}</h3>
                    {isAdmin && (
                        <button
                            onClick={handleExportResults}
                            disabled={!currentVoteCounts || !currentVoteCounts.some(vc => vc.votes > 0)}
                            className={`bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            <Download size={18} className="mr-2" /> Exportar a Excel
                        </button>
                    )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total de Votantes</p>
                            <p className="text-3xl font-bold text-gray-800">{currentDashboardStats.totalVoters}</p>
                        </div>
                        <Users className="h-8 w-8 text-blue-500"/>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Votos Emitidos</p>
                            <p className="text-3xl font-bold text-gray-800">{currentDashboardStats.votedCount}</p>
                        </div>
                        <UserCheck className="h-8 w-8 text-green-500"/>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Faltan por Votar</p>
                            <p className="text-3xl font-bold text-gray-800">{currentDashboardStats.missingCount}</p>
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
                                    {`${currentDashboardStats.participation.toFixed(1)}%`}
                                </text>
                                 <Tooltip content={<div className="bg-white p-2 border rounded-md shadow-lg text-sm">Participación</div>} />
                            </RadialBarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className={`p-6 bg-white rounded-lg shadow-lg`}>
                    <h4 className={`text-xl font-semibold mb-4 text-gray-700`}>Resultados Generales por Opción</h4>
                    {currentVoteCounts && currentVoteCounts.some(vc => vc.votes > 0) ? (
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={currentVoteCounts} margin={{ top: 20, right: 20, left: 0, bottom: 75 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" angle={-40} textAnchor="end" interval={0} height={90} style={{ fontSize: '0.8rem' }}/>
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Legend wrapperStyle={{paddingTop: '20px'}}/>
                                <Bar dataKey="votes" name="Votos">
                                    {currentVoteCounts.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color || colors.accent} />
                                    ))}
                                    <LabelList dataKey="votes" position="top" />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <p className="text-gray-500">Aún no hay votos registrados para esta elección.</p>}
                </div>

                <div className={`p-6 bg-white rounded-lg shadow-lg`}>
                    <h4 className={`text-xl font-semibold mb-4 text-gray-700`}>Resultados Detallados por Curso</h4>
                    <div className="space-y-2">
                        {currentParticipationByCourse && currentParticipationByCourse.map(courseData => {
                            const courseOptions = currentVoteCounts.map(opt => {
                                const course = (currentCourseVoteCounts || []).find(c => c.courseDisplayName === courseData.name);
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

    const renderElectionManagement = () => (
        <div className="space-y-8">
            <div className={`p-6 bg-white rounded-lg shadow-md`}>
                <h3 className={`text-xl font-semibold mb-4 text-gray-700 flex items-center`}><PlusCircle size={22} className={`mr-2 text-indigo-600`}/>Crear Nueva Elección</h3>
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
                                        <button type="button" onClick={() => handleRemoveElectionOption(index)} className={`text-red-600 hover:text-red-800 p-1 rounded-md hover:bg-red-50`}>
                                            <Trash2 size={18}/>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                        <button type="button" onClick={handleAddElectionOption} className={`mt-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center`}>
                            <PlusCircle size={16} className="mr-1"/>Añadir Opción
                        </button>
                    </div>
                    <button type="submit" disabled={isLoading} className={`px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center`}>
                        <CheckCircle size={18} className="mr-2"/>{isLoading ? 'Creando...' : 'Crear Elección'}
                    </button>
                </form>
            </div>
            <div className={`p-6 bg-white rounded-lg shadow-md`}>
                <h3 className={`text-xl font-semibold mb-4 text-gray-700 flex items-center`}><Settings size={22} className="mr-2 text-gray-500"/>Gestionar Elecciones</h3>
                {elections.length === 0 ? <p className="text-gray-500">No hay elecciones creadas.</p> :
                <ul className="space-y-3">
                    {elections.map(election => (
                        <li key={election.id} className="p-3 border rounded-md flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
                             <div className="flex-grow flex items-center">
                                {election.options?.[0]?.iconUrl && <img src={election.options[0].iconUrl} alt="icon" className="h-8 w-8 mr-2 rounded object-contain bg-gray-100 p-0.5" onError={(e)=>e.target.style.display='none'}/>}
                                <div>
                                    <span className={`font-medium ${election.isActive ? 'text-green-600' : 'text-gray-800'}`}>{election.name}</span>
                                    <span className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded-full ${election.isActive ? `bg-green-100 text-green-700` : `bg-gray-100 text-gray-600`}`}>
                                        {election.isActive ? 'ACTIVA' : 'INACTIVA'}
                                    </span>
                                    <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                                        Opciones: {election.options?.map(o => o.name).join(', ') || 'N/A'}
                                    </div>
                                </div>
                            </div>
                            <div className="flex space-x-1 items-center flex-shrink-0 mt-2 sm:mt-0">
                                {election.isActive && (
                                    <button onClick={() => handleResetVotes(election.id)} className={`p-2 text-yellow-600 hover:text-yellow-800 rounded-md hover:bg-yellow-50`} title="Resetear Votos">
                                        <RefreshCw size={18}/>
                                    </button>
                                )}
                                <button onClick={() => handleOpenEditElectionModal(election)} className={`p-2 text-blue-600 hover:text-blue-800 rounded-md hover:bg-blue-50`} title="Editar Elección">
                                    <Edit3 size={18}/>
                                </button>
                                <button onClick={() => handleTogglePublishResults(election.id, election.resultsPublic)} className={`p-2 rounded-md hover:bg-gray-100 ${election.resultsPublic ? 'text-green-600' : 'text-gray-500'}`} title={election.resultsPublic ? 'Ocultar Resultados' : 'Publicar Resultados'}>
                                    <Eye size={18}/>
                                </button>
                                <button onClick={() => handleToggleElectionStatus(election.id, election.isActive)} className={`px-3 py-1 text-sm rounded-md font-medium flex items-center whitespace-nowrap ${election.isActive ? `bg-yellow-500 hover:bg-yellow-600 text-gray-800` : `bg-green-600 hover:bg-green-700 text-white`}`} title={election.isActive ? 'Desactivar' : 'Activar'}>
                                    {election.isActive ? <XCircle size={16} className="mr-1"/> : <CheckCircle size={16} className="mr-1"/>}
                                    {election.isActive ? 'Desactivar' : 'Activar'}
                                </button>
                                <button onClick={() => handleDeleteElection(election.id)} className={`p-2 text-red-600 hover:text-red-800 rounded-md hover:bg-red-50`} title="Eliminar Elección">
                                    <Trash2 size={18}/>
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>}
            </div>
        </div>
    );

    const renderVoterManagement = () => (
        <div className="space-y-8">
            <div className={`p-6 bg-white rounded-lg shadow-md`}>
                <h3 className={`text-xl font-semibold mb-4 text-gray-700 flex items-center`}><UserPlus size={22} className={`mr-2 text-indigo-600`}/>Crear Nuevo Votante</h3>
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
                    <button type="submit" disabled={isLoading} className={`px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center`}>
                        <CheckCircle size={18} className="mr-2"/>{isLoading ? 'Creando...' : 'Crear Votante'}
                    </button>
                </form>
            </div>

            <div className={`p-6 bg-white rounded-lg shadow-md`}>
                <h3 className={`text-xl font-semibold mb-2 text-gray-700 flex items-center`}><UploadCloud size={22} className={`mr-2 text-indigo-600`}/>Importar Votantes desde Excel/CSV</h3>
                <p className="text-sm text-gray-600 mb-1">El archivo debe tener las columnas: "Código Estudiantil", "Nombre Completo", "Nivel Curso", "Nombre Curso".</p>
                <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className={`text-sm text-indigo-600 hover:underline mb-3 inline-block bg-transparent border-none p-0 cursor-pointer`}>
                    Descargar plantilla CSV de ejemplo
                </button>
                <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} disabled={isImporting} className={`block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 mb-2`} />
                {isImporting && <p className={`text-sm text-indigo-600`}>Procesando archivo, por favor espera...</p>}
            </div>

            <div className={`p-6 bg-white rounded-lg shadow-md`}>
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
                                            <button onClick={() => handleOpenEditVoterModal(voter)} className={`p-1 text-blue-600 hover:text-blue-800 rounded-md hover:bg-blue-50`}>
                                                <Edit3 size={18}/>
                                            </button>
                                            <button onClick={() => handleDeleteVoter(voter.id)} className={`p-1 text-red-600 hover:text-red-800 rounded-md hover:bg-red-50`}>
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
    
    const renderEditVoterModal = () => {
        if (!editingVoter) return null;
        return (
             <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
                <div className={`bg-white rounded-lg shadow-xl p-6 w-full max-w-lg transform transition-all`}>
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
                            <button type="submit" disabled={isLoading} className={`px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50`}>
                                {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    const renderEditElectionModal = () => {
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
                                {editingElection.options.map((option, index) => {
                                    const isSpecial = option.name === 'Voto en Blanco' || option.name === 'Voto Nulo';
                                    return (
                                        <div key={option.id} className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4 mt-2 p-2 border rounded-md">
                                            <input type="text" value={option.name} readOnly={isSpecial} onChange={(e) => handleOptionChange(index, 'name', e.target.value)} className={`flex-grow w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm ${isSpecial ? 'bg-gray-100' : ''}`} required />
                                            <div className="flex items-center space-x-2 w-full md:w-auto">
                                                <input type="color" value={option.color} disabled={isSpecial} onChange={(e) => handleOptionChange(index, 'color', e.target.value)} className="w-10 h-10 p-0.5 border border-gray-300 rounded-md cursor-pointer disabled:cursor-not-allowed" title="Seleccionar color"/>
                                                <ImagePlus size={18} className="text-gray-400 flex-shrink-0"/>
                                                <input type="url" value={option.iconUrl} disabled={isSpecial} placeholder="URL del Icono" onChange={(e) => handleOptionChange(index, 'iconUrl', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm disabled:bg-gray-100" />
                                                <button type="button" className="p-2 text-white bg-blue-500 hover:bg-blue-600 rounded-md disabled:bg-gray-300" disabled title="Subir archivo (próximamente)">
                                                    <UploadCloud size={16}/>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </form>
                    <div className="flex justify-end space-x-3 mt-5 border-t pt-4">
                        <button type="button" onClick={() => setEditingElection(null)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                        <button type="button" onClick={handleUpdateElection} disabled={isLoading} className={`px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50`}>
                            {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            <Modal
                show={modalState.show}
                onClose={hideModal}
                onConfirm={modalState.onConfirm}
                title={modalState.title}
                danger={modalState.danger}
            >
                {modalState.message}
            </Modal>
            
            {editingVoter && renderEditVoterModal()}
            {editingElection && renderEditElectionModal()}

            {view === 'loginChoice' ? (
                <div className={`flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 via-green-500 to-blue-400 p-4 relative`}>
                    <button onClick={() => setView('adminLogin')} className="absolute top-4 right-4 text-white text-sm font-semibold py-2 px-4 rounded-lg bg-black bg-opacity-20 hover:bg-opacity-40 transition">
                        <LogIn size={16} className="inline mr-2"/>Acceso Admin
                    </button>
                    {renderLoginChoice()}
                    <footer className="text-white text-center p-4 absolute bottom-0 w-full">
                        <p className="text-sm opacity-70">&copy; {new Date().getFullYear()} Sistema de Votación UEEA. Desarrollado con fines educativos.</p>
                    </footer>
                </div>
            ) : (
                <div className={`min-h-screen bg-gray-100 font-sans flex flex-col`}>
                    {renderHeader()}
                    <main className="flex-grow w-full pt-8 sm:pt-12">
                        <div className="h-full">
                            {view === 'adminLogin' && renderAdminLogin()}
                            {/* Student Login is now the main view */}
                            
                            {isAdmin && view === 'adminDashboard' && renderAdminDashboard()}
                            
                            {!isAdmin && currentVoter && view === 'studentVoting' && renderStudentVoting()}
                            {!isAdmin && view === 'studentVoted' && renderStudentVotedOrNoElection("¡Voto Registrado!", "Gracias por participar en la elección.")}
                            {!isAdmin && view === 'studentNoElection' && renderStudentVotedOrNoElection("Información", "No hay elecciones activas en este momento o ya has completado tu participación.", <XCircle size={48} className={`mx-auto text-yellow-500 mb-4`} />)}
                        </div>
                    </main>
                </div>
            )}
        </>
    );
}

export default App;
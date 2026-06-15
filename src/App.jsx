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

    return (
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

import { 
    signInAnonymously, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from 'firebase/auth';
import { auth } from './firebase';

export const authService = {
    // Autenticación anónima para estudiantes
    signInAnonymously: () => signInAnonymously(auth),
    
    // Login de administrador
    signIn: (email, password) => 
        signInWithEmailAndPassword(auth, email, password),
    
    // Cerrar sesión
    signOut: () => signOut(auth),
    
    // Escuchar cambios de autenticación
    onAuthStateChange: (callback) => onAuthStateChanged(auth, callback),
    
    // Obtener usuario actual
    getCurrentUser: () => auth.currentUser,
    
    // Verificar si es administrador
    isAdmin: (user) => user && !user.isAnonymous && 
        user.providerData.some(p => p.providerId === 'password')
};
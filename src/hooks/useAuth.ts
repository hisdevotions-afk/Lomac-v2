import { useState, useRef, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';
import { handleFirestoreError, OperationType, Screen } from '../types';

export const useAuth = (
  setToast: (msg: string | null) => void,
  setCurrentScreen: (screen: Screen) => void,
  fetchFavorites: () => void,
  fetchCart: () => void
) => {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const isOnAuthScreen = useRef(true);

  const [userProfile, setUserProfile] = useState({
    name: '',
    phone: '',
    email: '',
    street: '',
    number: '',
    complement: '',
    zipCode: '',
    role: 'cliente'
  });

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
      setToast('Bem-vindo!');
    } catch (error: any) {
      console.error("Google login error:", error);
      if (error.code === 'auth/popup-blocked') {
        setToast('O popup foi bloqueado pelo navegador.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        // Ignore user cancellation
      } else {
        setToast('Erro ao entrar com Google.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setToast('Por favor, preencha todos os campos.');
      return;
    }
    setIsLoggingIn(true);
    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      setToast('Bem-vindo de volta!');
    } catch (error: any) {
      console.error("Login error:", error.code, error.message);
      let message = 'Erro ao entrar. Tente novamente.';
      
      if (
        error.code === 'auth/user-not-found' || 
        error.code === 'auth/wrong-password' || 
        error.code === 'auth/invalid-credential' ||
        error.code === 'auth/invalid-email'
      ) {
        message = 'E-mail e senha não conferem.';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Muitas tentativas sem sucesso. Tente novamente mais tarde.';
      } else if (error.code === 'auth/user-disabled') {
        message = 'Esta conta foi desativada.';
      }
      
      setToast(message);
      setLoginPassword('');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegister = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!regEmail || !regPassword || !regName) {
      setToast('Por favor, preencha todos os campos.');
      return;
    }
    
    setIsRegistering(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, regEmail, regPassword);
      const user = userCredential.user;
      
      const userPath = `users/${user.uid}`;
      try {
        await setDoc(doc(db, "users", user.uid), {
          name: regName,
          email: regEmail,
          role: "cliente",
          createdAt: serverTimestamp()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, userPath);
      }

      setUserProfile(prev => ({ 
        ...prev, 
        name: regName, 
        email: regEmail, 
        role: 'cliente' 
      }));
      
      setToast('Conta criada com sucesso!');
      
      setRegName('');
      setRegEmail('');
      setRegPassword('');
    } catch (error: any) {
      console.error("Registration error:", error.code, error.message);
      let message = 'Erro ao cadastrar. Tente novamente.';
      
      if (error.code === 'auth/email-already-in-use') {
        message = 'Este e-mail já está em uso.';
      } else if (error.code === 'auth/weak-password') {
        message = 'A senha deve ter pelo menos 6 caracteres.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'E-mail inválido.';
      }
      
      setToast(message);
      setRegPassword('');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.clear();
      sessionStorage.clear();
      
      setCurrentScreen('login');
      isOnAuthScreen.current = true;
      setLoginEmail('');
      setLoginPassword('');
      setUserProfile(prev => ({ ...prev, role: 'cliente' }));
      setToast('Até logo!');
    } catch (error: any) {
      console.error("Logout error:", error);
      setToast('Erro ao sair.');
    }
  };

  const handleForgotPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!forgotEmail) {
      setToast('Por favor, insira seu e-mail.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, forgotEmail);
      setToast('E-mail de recuperação enviado!');
      setCurrentScreen('login');
    } catch (error: any) {
      setToast('Erro ao enviar e-mail.');
    }
  };

  const handleSaveProfile = async () => {
    if (!auth.currentUser) return;
    const userPath = `users/${auth.currentUser.uid}`;
    try {
      await setDoc(doc(db, "users", auth.currentUser.uid), {
        name: userProfile.name,
        phone: userProfile.phone,
        street: userProfile.street,
        number: userProfile.number,
        complement: userProfile.complement,
        zipCode: userProfile.zipCode,
        updatedAt: serverTimestamp()
      }, { merge: true });
      setToast('Perfil atualizado com sucesso!');
      setCurrentScreen('home');
      isOnAuthScreen.current = false;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, userPath);
      setToast('Erro ao atualizar perfil.');
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          setUserProfile(prev => ({
            ...prev,
            email: user.email || prev.email
          }));

          if (isOnAuthScreen.current) {
            setCurrentScreen('home');
            isOnAuthScreen.current = false;
          }
          setIsAuthChecking(false);

          const userPath = `users/${user.uid}`;
          try {
            fetchFavorites();
            fetchCart();
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              setUserProfile(prev => ({
                ...prev,
                name: userData.name || prev.name,
                email: userData.email || prev.email,
                phone: userData.phone || prev.phone,
                street: userData.street || prev.street,
                number: userData.number || prev.number,
                complement: userData.complement || prev.complement,
                zipCode: userData.zipCode || prev.zipCode,
                role: userData.role || 'cliente'
              }));

              if (userData.role === 'admin' && isOnAuthScreen.current) {
                setCurrentScreen('admin-panel');
                isOnAuthScreen.current = false;
              }
            } else {
              await setDoc(doc(db, "users", user.uid), {
                name: user.displayName || regName || 'Usuário',
                email: user.email,
                role: "cliente",
                createdAt: serverTimestamp()
              });
              setUserProfile(prev => ({
                ...prev,
                name: user.displayName || regName || 'Usuário',
                email: user.email || prev.email,
                role: 'cliente'
              }));
            }
          } catch (error) {
            handleFirestoreError(error, OperationType.GET, userPath);
          }
        } catch (error: any) {
          console.error("Auth check error:", error);
          setIsAuthChecking(false);
        }
      } else {
        if (!isOnAuthScreen.current) {
          setCurrentScreen('login');
          isOnAuthScreen.current = true;
        }
        setIsAuthChecking(false);
      }
    });
    return () => unsubscribe();
  }, [regName]);

  return {
    loginEmail, setLoginEmail,
    loginPassword, setLoginPassword,
    rememberMe, setRememberMe,
    isLoggingIn,
    regName, setRegName,
    regEmail, setRegEmail,
    regPassword, setRegPassword,
    isRegistering,
    showPassword, setShowPassword,
    forgotEmail, setForgotEmail,
    userProfile, setUserProfile,
    isAuthChecking, setIsAuthChecking,
    isOnAuthScreen,
    handleLogin,
    handleRegister,
    handleLogout,
    handleForgotPassword,
    handleGoogleLogin,
    handleSaveProfile
  };
};

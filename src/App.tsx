import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, 
  ShoppingCart, 
  Bell, 
  Home, 
  Menu, 
  ChevronLeft, 
  Plus, 
  Minus, 
  Trash2, 
  Heart,
  MessageCircle,
  ArrowRight,
  CheckCircle2,
  Package,
  User,
  Mail,
  Lock,
  LogOut,
  Eye,
  EyeOff,
  LayoutDashboard,
  Users,
  BarChart3,
  Settings,
  Eye as EyeIcon,
  Edit,
  DollarSign,
  Tag,
  TrendingDown,
  MapPin,
  Clock,
  Navigation
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  onIdTokenChanged,
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
  serverTimestamp,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  deleteDoc,
  getDocFromServer
} from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase';
import { 
  CATEGORIES, 
  PRODUCTS, 
  NOTIFICATIONS, 
  PLACEHOLDER_IMAGE,
  Product, 
  Category, 
  Notification
} from './constants';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
};

type Screen = 'login' | 'register' | 'forgot-password' | 'home' | 'product' | 'cart' | 'notifications' | 'all-products' | 'favorites' | 'profile' | 'admin-panel' | 'admin-add-product' | 'admin-edit-product' | 'admin-change-price' | 'admin-promo' | 'location' | 'admin-edit-store';

const PriceDisplay = ({ product, className = "" }: { product: Product; className?: string }) => {
  const price = typeof product.price === 'number' ? product.price : 0;
  const originalPrice = typeof product.originalPrice === 'number' ? product.originalPrice : null;

  if (originalPrice) {
    return (
      <div className={`flex flex-col ${className}`}>
        <span className="text-[10px] text-slate-500 line-through">De R$ {originalPrice.toFixed(2)}</span>
        <span className="text-primary font-bold text-lg">Por R$ {price.toFixed(2)}</span>
      </div>
    );
  }
  return <p className={`text-primary font-bold text-lg ${className}`}>R$ {price.toFixed(2)}</p>;
};

const LocationSection = ({ onBack, storeInfo }: { onBack: () => void, storeInfo: any }) => {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);

  const storeLocation = storeInfo;

  const requestLocation = () => {
    setIsRequesting(true);
    setError(null);
    if (!navigator.geolocation) {
      setError("Geolocalização não é suportada pelo seu navegador.");
      setIsRequesting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setIsRequesting(false);
      },
      (err) => {
        console.error("Error getting location:", err);
        setError("Não foi possível obter sua localização. Verifique as permissões.");
        setIsRequesting(false);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  const getDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(storeLocation.address)}`;
    window.open(url, '_blank');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="px-4 py-4 space-y-6 min-h-screen bg-dark-bg"
    >
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 text-slate-400">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold text-white">Nossa Loja</h2>
      </div>

      <div className="bg-dark-surface rounded-3xl border border-dark-border overflow-hidden shadow-xl">
        <div className="h-64 w-full bg-slate-800 relative">
          {/* Google Maps Embed using address */}
          <iframe
            title="Lomac Location"
            width="100%"
            height="100%"
            frameBorder="0"
            style={{ border: 0 }}
            src={`https://maps.google.com/maps?q=${encodeURIComponent(storeLocation.address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
            allowFullScreen
            className="grayscale invert contrast-125 opacity-80"
          ></iframe>
          {/* Overlay for branding */}
          <div className="absolute inset-0 flex items-center justify-center bg-dark-bg/20 pointer-events-none">
            <div className="bg-dark-surface/90 p-4 rounded-2xl border border-primary/20 flex flex-col items-center gap-2 shadow-2xl">
              <MapPin className="text-primary" size={32} />
              <span className="text-white font-bold text-sm">{storeLocation.name}</span>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <MapPin className="text-primary shrink-0 mt-1" size={20} />
              <div>
                <p className="text-white font-bold text-sm">Endereço</p>
                <p className="text-slate-400 text-xs leading-relaxed">{storeLocation.address}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="text-primary shrink-0 mt-1" size={20} />
              <div>
                <p className="text-white font-bold text-sm">Horário de Funcionamento</p>
                <p className="text-slate-400 text-xs leading-relaxed">{storeLocation.hours}</p>
              </div>
            </div>
          </div>

          <div className="pt-4 space-y-3">
            <button 
              onClick={getDirections}
              className="w-full orange-gradient text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-900/20 active:scale-95 transition-all"
            >
              <Navigation size={20} />
              Como Chegar
            </button>
            
            {!userLocation ? (
              <button 
                onClick={requestLocation}
                disabled={isRequesting}
                className="w-full bg-dark-bg border border-dark-border text-slate-400 py-3 rounded-2xl text-xs font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
              >
                {isRequesting ? (
                  <div className="w-4 h-4 border-2 border-slate-600 border-t-primary rounded-full animate-spin" />
                ) : (
                  <MapPin size={16} />
                )}
                {isRequesting ? "Solicitando..." : "Usar minha localização"}
              </button>
            ) : (
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider">Localização compartilhada com sucesso</p>
              </div>
            )}
            
            {error && (
              <p className="text-red-500 text-[10px] text-center font-medium">{error}</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-dark-surface p-6 rounded-3xl border border-dark-border space-y-4">
        <h3 className="text-white font-bold">Contato Direto</h3>
        <div className="grid grid-cols-1 gap-3">
          <button 
            onClick={() => window.open(`tel:${storeLocation.phone.replace(/\D/g, '')}`)}
            className="flex items-center gap-4 p-4 bg-dark-bg rounded-2xl border border-dark-border hover:border-primary/50 transition-all"
          >
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <MessageCircle size={20} />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-white">Ligar para Loja</p>
              <p className="text-[10px] text-slate-500">{storeLocation.phone}</p>
            </div>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adminSelectedProduct, setAdminSelectedProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [isLoadingCart, setIsLoadingCart] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [savedProducts, setSavedProducts] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [storeInfo, setStoreInfo] = useState({
    name: "Lomac Materiais de Construção",
    address: "Av. Paulista, 1000 - Bela Vista, São Paulo - SP, 01310-100",
    hours: "Segunda a Sexta: 08:00 - 18:00 | Sábado: 08:00 - 13:00",
    phone: "(11) 5931-6801"
  });
  const [isLoadingStore, setIsLoadingStore] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Toast auto-hide
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Test connection to Firestore
  useEffect(() => {
    const testConnection = async () => {
      try {
        // Simple test to check connection
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error: any) {
        if (error.message?.includes('the client is offline')) {
          console.error("Firestore Error: The client is offline. Check your Firebase configuration.");
          setToast("Erro de conexão com o banco de dados. Por favor, recarregue a página.");
        }
      }
    };
    testConnection();
  }, []);

  // Fallback for loading screen - max 1.5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isAuthChecking) {
        setIsAuthChecking(false);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [isAuthChecking]);

  // Auth States
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
  
  const [userProfile, setUserProfile] = useState({
    name: 'Roberto Junior',
    phone: '(11) 99999-9999',
    email: 'roberto_junior.007@hotmail.com',
    street: 'Av. Paulista',
    number: '1000',
    complement: 'Apto 101',
    zipCode: '01310-100',
    role: 'cliente'
  });

  // Auth Handlers
  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
      setToast('Bem-vindo!');
    } catch (error: any) {
      console.error("Google login error:", error);
      setToast('Erro ao entrar com Google.');
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
      
      // Firebase Auth Error Codes
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
        // Save to Firestore
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
      
      // Clear registration fields
      setRegName('');
      setRegEmail('');
      setRegPassword('');
      
      // Navigation is handled by onAuthStateChanged
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
      // Clear local data
      localStorage.clear();
      sessionStorage.clear();
      
      setCurrentScreen('login');
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

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      if (user) {
        try {
          // Check if token is still valid
          const tokenResult = await user.getIdTokenResult();
          const expirationTime = new Date(tokenResult.expirationTime).getTime();
          const now = new Date().getTime();
          
          if (expirationTime <= now) {
            console.warn("Session expired, logging out...");
            handleLogout();
            return;
          }

          // Pre-fill with auth data immediately
          setUserProfile(prev => ({
            ...prev,
            email: user.email || prev.email
          }));

          // Set screen to home immediately to get out of loading screen
          if (currentScreen === 'login' || currentScreen === 'register') {
            setCurrentScreen('home');
          }
          setIsAuthChecking(false);

          // Fetch user data from Firestore in the background
          const userPath = `users/${user.uid}`;
          try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              setUserProfile(prev => ({
                ...prev,
                name: userData.name || prev.name,
                email: userData.email || prev.email,
                role: userData.role || 'cliente'
              }));

              if (userData.role === 'admin' && currentScreen === 'login') {
                setCurrentScreen('admin-panel');
              }
            } else {
              // Automatically create document if it doesn't exist (e.g. first login/registration)
              // This fulfills the requirement: "After a user registers... automatically create a document"
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
          if (error.code === 'auth/user-token-expired' || error.code === 'permission-denied') {
            handleLogout();
          } else {
            setIsAuthChecking(false);
          }
        }
      } else {
        // Only redirect to login if we're not on a screen that allows unauthenticated users
        if (currentScreen !== 'register' && currentScreen !== 'forgot-password') {
          setCurrentScreen('login');
        }
        setIsAuthChecking(false);
      }
    });
    return () => unsubscribe();
  }, [currentScreen]);

  const fetchCart = async () => {
    if (!auth.currentUser) return;
    setIsLoadingCart(true);
    const cartPath = `carts/${auth.currentUser.uid}`;
    try {
      const cartDoc = await getDoc(doc(db, "carts", auth.currentUser.uid));
      if (cartDoc.exists()) {
        const cartData = cartDoc.data().items || [];
        // Map stored IDs back to product objects
        const hydratedCart = cartData.map((item: any) => {
          const product = products.find(p => p.id === item.productId);
          return product ? { product, quantity: item.quantity } : null;
        }).filter(Boolean);
        setCart(hydratedCart);
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
      setCart([]);
    } finally {
      setIsLoadingCart(false);
    }
  };

  const saveCart = async (newCart: { product: Product; quantity: number }[]) => {
    if (!auth.currentUser) return;
    const cartPath = `carts/${auth.currentUser.uid}`;
    try {
      await setDoc(doc(db, "carts", auth.currentUser.uid), {
        items: newCart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity
        })),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, cartPath);
    }
  };

  useEffect(() => {
    if (currentScreen === 'cart') {
      fetchCart();
    }
  }, [currentScreen]);

  const fetchNotifications = async () => {
    if (!auth.currentUser) return;
    
    setIsLoadingNotifications(true);
    const notifPath = "notifications";
    try {
      const q = query(
        collection(db, "notifications"),
        orderBy("createdAt", "desc"),
        limit(20)
      );
      const querySnapshot = await getDocs(q);
      const fetchedNotifs: Notification[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedNotifs.push({
          id: doc.id,
          title: data.title,
          message: data.message,
          type: data.type,
          icon: data.type === 'promo' ? TrendingDown : (data.type === 'cart' ? ShoppingCart : Package),
          time: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleString() : 'Recent'
        } as Notification);
      });
      setNotifications(fetchedNotifs.length > 0 ? fetchedNotifs : NOTIFICATIONS);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setNotifications(NOTIFICATIONS);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  const handleOpenNotifications = () => {
    setCurrentScreen('notifications');
    fetchNotifications();
  };

  // Admin Handlers
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    price: 0,
    stock: 0,
    category: 'cimento',
    image: '',
    description: '',
    features: []
  });

  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncDatabase = async () => {
    setConfirmDialog({
      title: 'Sincronizar Catálogo',
      message: 'Isso irá adicionar todos os produtos padrão ao banco de dados. Continuar?',
      onConfirm: async () => {
        setConfirmDialog(null);
        setIsSyncing(true);
        try {
          const productsRef = collection(db, "products");
          for (const product of PRODUCTS) {
            await setDoc(doc(productsRef, product.id), {
              ...product,
              updatedAt: serverTimestamp()
            });
          }
          setToast('Catálogo sincronizado com sucesso!');
          fetchProducts();
        } catch (error) {
          console.error("Error syncing database:", error);
          setToast('Erro ao sincronizar catálogo.');
        } finally {
          setIsSyncing(false);
        }
      }
    });
  };

  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    const productsPath = "products";
    try {
      const productsRef = collection(db, "products");
      const q = query(productsRef, orderBy("name"));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // If Firestore is empty, use the default PRODUCTS from constants.ts
        setProducts(PRODUCTS);
      } else {
        const productsData: Product[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data() as any;
          productsData.push({
            ...data,
            id: data.id || doc.id,
            name: data.name || 'Produto sem nome',
            price: typeof data.price === 'number' ? data.price : 0,
            category: data.category || 'outros',
            description: data.description || '',
            features: Array.isArray(data.features) ? data.features : []
          } as Product);
        });
        setProducts(productsData);
      }
    } catch (error) {
      console.error("Error fetching products, falling back to defaults:", error);
      setProducts(PRODUCTS);
      // We don't call handleFirestoreError here to avoid crashing the app with the ErrorBoundary
      // but we still log it for debugging.
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const fetchStoreInfo = async () => {
    setIsLoadingStore(true);
    try {
      const storeDoc = await getDoc(doc(db, "settings", "store"));
      if (storeDoc.exists()) {
        setStoreInfo(storeDoc.data() as any);
      }
    } catch (error) {
      console.error("Error fetching store info:", error);
    } finally {
      setIsLoadingStore(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchStoreInfo();
  }, []);

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price) {
      setToast('Preencha o nome e o preço.');
      return;
    }
    const product: Product = {
      id: Date.now().toString(),
      name: newProduct.name as string,
      price: Number(newProduct.price),
      stock: Number(newProduct.stock || 0),
      category: newProduct.category as string,
      image: newProduct.image || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=400',
      description: newProduct.description || '',
      features: newProduct.features || []
    };

    const productPath = `products/${product.id}`;
    try {
      await setDoc(doc(db, "products", product.id), product);
      setProducts(prev => [product, ...prev]);
      setToast('Produto adicionado com sucesso!');
      setCurrentScreen('admin-panel');
      setNewProduct({ name: '', price: 0, category: 'cimento', image: '', description: '', features: [] });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, productPath);
    }
  };

  const handleUpdateProduct = async (updatedProduct: Product) => {
    const productPath = `products/${updatedProduct.id}`;
    try {
      await setDoc(doc(db, "products", updatedProduct.id), updatedProduct);
      setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
      setToast('Produto atualizado!');
      setCurrentScreen('admin-panel');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, productPath);
    }
  };

  const handleUpdatePrice = async (id: string, newPrice: number) => {
    const productPath = `products/${id}`;
    try {
      const productRef = doc(db, "products", id);
      const productDoc = await getDoc(productRef);
      
      if (productDoc.exists()) {
        const updatedProduct = { ...productDoc.data(), price: newPrice } as Product;
        await setDoc(productRef, updatedProduct);
        setProducts(prev => prev.map(p => p.id === id ? updatedProduct : p));
        setToast('Preço atualizado!');
        setCurrentScreen('admin-panel');
      } else {
        // If it's a product from constants that isn't in Firestore yet
        const product = products.find(p => p.id === id);
        if (product) {
          const updatedProduct = { ...product, price: newPrice };
          await setDoc(productRef, updatedProduct);
          setProducts(prev => prev.map(p => p.id === id ? updatedProduct : p));
          setToast('Preço atualizado!');
          setCurrentScreen('admin-panel');
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, productPath);
    }
  };

  const handleActivatePromo = async (id: string, discountPercent: number) => {
    const productPath = `products/${id}`;
    try {
      const productRef = doc(db, "products", id);
      const productDoc = await getDoc(productRef);
      let updatedProduct: Product | null = null;

      if (productDoc.exists()) {
        const p = productDoc.data() as Product;
        const originalPrice = p.originalPrice || p.price;
        const newPrice = originalPrice * (1 - discountPercent / 100);
        updatedProduct = { ...p, price: newPrice, originalPrice };
      } else {
        const p = products.find(prod => prod.id === id);
        if (p) {
          const originalPrice = p.originalPrice || p.price;
          const newPrice = originalPrice * (1 - discountPercent / 100);
          updatedProduct = { ...p, price: newPrice, originalPrice };
        }
      }

      if (updatedProduct) {
        await setDoc(productRef, updatedProduct);
        setProducts(prev => prev.map(p => p.id === id ? updatedProduct! : p));
        setToast('Promoção ativada!');
        setCurrentScreen('admin-panel');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, productPath);
    }
  };

  const handleUpdateStoreInfo = async (newInfo: typeof storeInfo) => {
    const storePath = "settings/store";
    try {
      await setDoc(doc(db, "settings", "store"), newInfo);
      setStoreInfo(newInfo);
      setToast('Informações da loja atualizadas!');
      setCurrentScreen('admin-panel');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, storePath);
    }
  };

  const handleRemovePromo = async (id: string) => {
    const productPath = `products/${id}`;
    try {
      const productRef = doc(db, "products", id);
      const productDoc = await getDoc(productRef);
      let updatedProduct: Product | null = null;

      if (productDoc.exists()) {
        const p = productDoc.data() as Product;
        if (p.originalPrice) {
          updatedProduct = { ...p, price: p.originalPrice, originalPrice: undefined };
        }
      } else {
        const p = products.find(prod => prod.id === id);
        if (p && p.originalPrice) {
          updatedProduct = { ...p, price: p.originalPrice, originalPrice: undefined };
        }
      }

      if (updatedProduct) {
        await setDoc(productRef, updatedProduct);
        setProducts(prev => prev.map(p => p.id === id ? updatedProduct! : p));
        setToast('Desconto removido!');
        setCurrentScreen('admin-panel');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, productPath);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    setConfirmDialog({
      title: 'Excluir Produto',
      message: 'Tem certeza que deseja excluir este produto?',
      onConfirm: async () => {
        setConfirmDialog(null);
        const productPath = `products/${id}`;
        try {
          await deleteDoc(doc(db, "products", id));
          setProducts(prev => prev.filter(p => p.id !== id));
          setToast('Produto excluído com sucesso!');
          setAdminSelectedProduct(null);
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, productPath);
        }
      }
    });
  };

  const categoriesRef = useRef<HTMLDivElement>(null);

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoriesRef.current) {
      const scrollAmount = 200;
      categoriesRef.current.scrollBy({ 
        left: direction === 'left' ? -scrollAmount : scrollAmount, 
        behavior: 'smooth' 
      });
    }
  };

  // Cart Logic
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      let newCart;
      if (existing) {
        newCart = prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      } else {
        newCart = [...prev, { product, quantity: 1 }];
      }
      saveCart(newCart);
      return newCart;
    });
    setToast(`${product.name} adicionado ao carrinho!`);
    setTimeout(() => setToast(null), 3000);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const newCart = prev.filter(item => item.product.id !== productId);
      saveCart(newCart);
      return newCart;
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      const newCart = prev.map(item => {
        if (item.product.id === productId) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      });
      saveCart(newCart);
      return newCart;
    });
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  }, [cart]);

  const cartCount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  }, [cart]);

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
          <p className="text-slate-400 font-medium animate-pulse">Carregando...</p>
        </div>
      </div>
    );
  }

  // Navigation Logic
  const navigateToProduct = (product: Product) => {
    setSelectedProduct(product);
    setCurrentScreen('product');
  };

  const toggleSave = (productId: string) => {
    setSavedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId) 
        : [...prev, productId]
    );
  };

  const handleWhatsAppOrder = () => {
    const productNames = cart.map(item => `${item.quantity}x ${item.product.name}`).join(', ');
    const message = `Olá! Gostaria de fazer o pedido do produto ${productNames}. Obrigado`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/551159316801?text=${encodedMessage}`, '_blank');
  };

  const scrollToTop = () => {
    if (currentScreen !== 'home') {
      setCurrentScreen('home');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToCategories = () => {
    if (currentScreen !== 'home') {
      setCurrentScreen('home');
      // Small delay to allow screen transition before scrolling
      setTimeout(() => {
        categoriesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } else {
      categoriesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Filtered Products
  const filteredProducts = products.filter(p => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const productName = (p.name || '').toLowerCase();
    const productCategory = (p.category || '').toLowerCase();
    const categoryName = CATEGORIES.find(c => c.id === p.category || c.name.toLowerCase() === productCategory)?.name.toLowerCase() || '';
    
    return productName.includes(query) ||
           productCategory.includes(query) ||
           categoryName.includes(query);
  });

  return (
    <div className="max-w-md mx-auto bg-dark-bg min-h-screen pb-20 relative overflow-hidden flex flex-col text-slate-100">
      
      {/* Header */}
      {currentScreen !== 'login' && currentScreen !== 'register' && currentScreen !== 'forgot-password' && currentScreen !== 'admin-panel' && (
        <header className="sticky top-0 z-50 glass px-4 py-4 flex items-center justify-between">
        <div 
          className="flex items-center gap-3 cursor-pointer"
          onClick={scrollToTop}
        >
          <div className="relative w-10 h-10 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <defs>
                <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ff4d00" />
                  <stop offset="50%" stopColor="#ff8c00" />
                  <stop offset="100%" stopColor="#ffcc00" />
                </linearGradient>
              </defs>
              <path 
                d="M10 60 L40 30 L70 60" 
                fill="none" 
                stroke="url(#logo-grad)" 
                strokeWidth="12" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
              <path 
                d="M35 60 L65 30 L95 60" 
                fill="none" 
                stroke="url(#logo-grad)" 
                strokeWidth="12" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 className="font-bold text-xl tracking-tight text-white">LOMAC</h1>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setCurrentScreen('profile')}
            className={`p-2 transition-colors ${currentScreen === 'profile' ? 'text-primary' : 'text-slate-400 hover:text-primary'}`}
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
              <span className="text-xs font-bold text-primary">{userProfile.name.charAt(0)}</span>
            </div>
          </button>
          <button 
            onClick={handleOpenNotifications}
            className="relative p-2 text-slate-400 hover:text-primary transition-colors"
          >
            <Bell size={24} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-dark-surface"></span>
          </button>
          <button 
            onClick={() => setCurrentScreen('cart')}
            className="relative p-2 text-slate-400 hover:text-primary transition-colors"
          >
            <ShoppingCart size={24} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-dark-surface">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>
      )}

      {/* Main Content */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          {currentScreen === 'login' && (
            <motion.div 
              key="login"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="min-h-screen flex flex-col justify-center px-6 py-12"
            >
              <div className="flex flex-col items-center mb-10">
                <div className="relative w-20 h-20 flex items-center justify-center mb-4">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <defs>
                      <linearGradient id="logo-grad-login" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ff4d00" />
                        <stop offset="50%" stopColor="#ff8c00" />
                        <stop offset="100%" stopColor="#ffcc00" />
                      </linearGradient>
                    </defs>
                    <path d="M10 60 L40 30 L70 60" fill="none" stroke="url(#logo-grad-login)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M35 60 L65 30 L95 60" fill="none" stroke="url(#logo-grad-login)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-white">LOMAC</h1>
                <p className="text-slate-400 text-sm mt-2">Construindo o futuro com você</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                      type="email" 
                      placeholder="seu@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      autoComplete="email"
                      autoFocus
                      className="w-full bg-dark-surface border border-dark-border rounded-xl py-3 pl-12 pr-4 text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      autoComplete="current-password"
                      className="w-full bg-dark-surface border border-dark-border rounded-xl py-3 pl-12 pr-12 text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-primary transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative flex items-center">
                      <input 
                        type="checkbox" 
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="peer sr-only"
                      />
                      <div className="w-5 h-5 border-2 border-dark-border rounded-md bg-dark-surface peer-checked:bg-primary peer-checked:border-primary transition-all flex items-center justify-center">
                        <div className="w-2.5 h-2.5 bg-white rounded-sm opacity-0 peer-checked:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-400 group-hover:text-slate-300 transition-colors">Manter-me conectado</span>
                  </label>
                  <button 
                    type="button"
                    onClick={() => setCurrentScreen('forgot-password')}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Esqueci minha senha
                  </button>
                </div>

                <button 
                  type="submit"
                  disabled={isLoggingIn}
                  className={`w-full orange-gradient text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-900/20 active:scale-[0.98] transition-all flex items-center justify-center ${isLoggingIn ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isLoggingIn ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Entrando...</span>
                    </div>
                  ) : 'Entrar'}
                </button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-dark-border"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#0a0a0a] px-2 text-slate-500 font-bold tracking-widest">Ou continue com</span>
                  </div>
                </div>

                <button 
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoggingIn}
                  className="w-full bg-dark-surface border border-dark-border text-white font-bold py-3 rounded-xl flex items-center justify-center gap-3 hover:bg-white/5 transition-colors active:scale-[0.98]"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Google</span>
                </button>

                <div className="text-center mt-6">
                  <p className="text-slate-400 text-sm">
                    Não tem uma conta?{' '}
                    <button 
                      type="button"
                      onClick={() => setCurrentScreen('register')}
                      className="text-primary font-bold hover:underline"
                    >
                      Cadastre-se agora
                    </button>
                  </p>
                </div>
              </form>
            </motion.div>
          )}

          {currentScreen === 'register' && (
            <motion.div 
              key="register"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="min-h-screen flex flex-col px-6 py-12"
            >
              <button 
                onClick={() => setCurrentScreen('login')}
                className="self-start p-2 -ml-2 text-slate-400 hover:text-white transition-colors mb-6"
              >
                <ChevronLeft size={24} />
              </button>

              <div className="flex flex-col items-center mb-10">
                <h2 className="text-3xl font-bold tracking-tight text-white">Criar Conta</h2>
                <p className="text-slate-400 text-sm mt-2">Junte-se à família Lomac</p>
              </div>

              <form onSubmit={handleRegister} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nome Completo</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                      type="text" 
                      placeholder="Seu nome"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      autoComplete="name"
                      autoFocus
                      className="w-full bg-dark-surface border border-dark-border rounded-xl py-3 pl-12 pr-4 text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                      type="email" 
                      placeholder="seu@email.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      autoComplete="email"
                      className="w-full bg-dark-surface border border-dark-border rounded-xl py-3 pl-12 pr-4 text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      autoComplete="new-password"
                      className="w-full bg-dark-surface border border-dark-border rounded-xl py-3 pl-12 pr-12 text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-primary transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isRegistering}
                  className={`w-full orange-gradient text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-900/20 active:scale-[0.98] transition-all mt-4 flex items-center justify-center ${isRegistering ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isRegistering ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Criando conta...</span>
                    </div>
                  ) : 'Cadastrar'}
                </button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-dark-border"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#0a0a0a] px-2 text-slate-500 font-bold tracking-widest">Ou continue com</span>
                  </div>
                </div>

                <button 
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoggingIn}
                  className="w-full bg-dark-surface border border-dark-border text-white font-bold py-3 rounded-xl flex items-center justify-center gap-3 hover:bg-white/5 transition-colors active:scale-[0.98]"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Google</span>
                </button>

                <div className="text-center mt-6">
                  <p className="text-slate-400 text-sm">
                    Já tem uma conta?{' '}
                    <button 
                      type="button"
                      onClick={() => setCurrentScreen('login')}
                      className="text-primary font-bold hover:underline"
                    >
                      Faça login
                    </button>
                  </p>
                </div>
              </form>
            </motion.div>
          )}

          {currentScreen === 'forgot-password' && (
            <motion.div 
              key="forgot-password"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="min-h-screen flex flex-col px-6 py-12"
            >
              <button 
                onClick={() => setCurrentScreen('login')}
                className="self-start p-2 -ml-2 text-slate-400 hover:text-white transition-colors mb-6"
              >
                <ChevronLeft size={24} />
              </button>

              <div className="flex flex-col items-center mb-10">
                <h2 className="text-3xl font-bold tracking-tight text-white text-center">Recuperar Senha</h2>
                <p className="text-slate-400 text-sm mt-2 text-center">Insira seu e-mail para receber as instruções de recuperação</p>
              </div>

              <form onSubmit={handleForgotPassword} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                      type="email" 
                      placeholder="seu@email.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      autoComplete="email"
                      autoFocus
                      className="w-full bg-dark-surface border border-dark-border rounded-xl py-3 pl-12 pr-4 text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full orange-gradient text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-900/20 active:scale-[0.98] transition-all"
                >
                  Enviar Instruções
                </button>

                <div className="text-center mt-6">
                  <button 
                    type="button"
                    onClick={() => setCurrentScreen('login')}
                    className="text-slate-400 text-sm font-bold hover:text-primary transition-colors"
                  >
                    Voltar para o Login
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {currentScreen === 'admin-panel' && (
            <motion.div 
              key="admin-panel"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-h-screen bg-dark-bg flex flex-col"
            >
              <header className="glass p-6 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 orange-gradient rounded-xl flex items-center justify-center shadow-lg">
                    <LayoutDashboard className="text-white" size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white leading-none">Painel Admin</h2>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Lomac Materiais</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setCurrentScreen('home')}
                    className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-2 rounded-xl text-xs font-bold hover:bg-primary hover:text-white transition-all"
                  >
                    <EyeIcon size={16} />
                    Ver Loja
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              </header>

              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Gestão de Catálogo</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {/* Adicionar Produto */}
                    <button 
                      onClick={() => setCurrentScreen('admin-add-product')}
                      className="flex items-center justify-between p-5 bg-dark-surface rounded-2xl border border-dark-border hover:border-primary/50 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                          <Plus size={24} />
                        </div>
                        <div className="text-left">
                          <p className="text-base font-bold text-white">Adicionar Produto</p>
                          <p className="text-xs text-slate-500">Cadastrar novo item no sistema</p>
                        </div>
                      </div>
                      <ArrowRight size={20} className="text-slate-600" />
                    </button>

                    {/* Editar Produto */}
                    <button 
                      onClick={() => setCurrentScreen('admin-edit-product')}
                      className="flex items-center justify-between p-5 bg-dark-surface rounded-2xl border border-dark-border hover:border-primary/50 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all">
                          <Edit size={24} />
                        </div>
                        <div className="text-left">
                          <p className="text-base font-bold text-white">Editar Produto</p>
                          <p className="text-xs text-slate-500">Modificar informações existentes</p>
                        </div>
                      </div>
                      <ArrowRight size={20} className="text-slate-600" />
                    </button>

                    {/* Alterar Preço */}
                    <button 
                      onClick={() => setCurrentScreen('admin-change-price')}
                      className="flex items-center justify-between p-5 bg-dark-surface rounded-2xl border border-dark-border hover:border-primary/50 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-all">
                          <DollarSign size={24} />
                        </div>
                        <div className="text-left">
                          <p className="text-base font-bold text-white">Alterar Preço</p>
                          <p className="text-xs text-slate-500">Atualizar valores de venda</p>
                        </div>
                      </div>
                      <ArrowRight size={20} className="text-slate-600" />
                    </button>

                    {/* Ativar Promoção */}
                    <button 
                      onClick={() => setCurrentScreen('admin-promo')}
                      className="flex items-center justify-between p-5 bg-dark-surface rounded-2xl border border-dark-border hover:border-primary/50 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-all">
                          <Tag size={24} />
                        </div>
                        <div className="text-left">
                          <p className="text-base font-bold text-white">Ativar Promoção</p>
                          <p className="text-xs text-slate-500">Criar ofertas e descontos</p>
                        </div>
                      </div>
                      <ArrowRight size={20} className="text-slate-600" />
                    </button>

                    {/* Sincronizar Banco */}
                    <button 
                      onClick={handleSyncDatabase}
                      disabled={isSyncing}
                      className="flex items-center justify-between p-5 bg-dark-surface rounded-2xl border border-dark-border hover:border-primary/50 transition-all group disabled:opacity-50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                          <Package size={24} />
                        </div>
                        <div className="text-left">
                          <p className="text-base font-bold text-white">{isSyncing ? 'Sincronizando...' : 'Sincronizar Catálogo'}</p>
                          <p className="text-xs text-slate-500">Adicionar produtos padrão ao banco</p>
                        </div>
                      </div>
                      <ArrowRight size={20} className="text-slate-600" />
                    </button>

                    {/* Editar Endereço */}
                    <button 
                      onClick={() => setCurrentScreen('admin-edit-store')}
                      className="flex items-center justify-between p-5 bg-dark-surface rounded-2xl border border-dark-border hover:border-primary/50 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-all">
                          <MapPin size={24} />
                        </div>
                        <div className="text-left">
                          <p className="text-base font-bold text-white">Editar Endereço</p>
                          <p className="text-xs text-slate-500">Alterar localização e contato</p>
                        </div>
                      </div>
                      <ArrowRight size={20} className="text-slate-600" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {currentScreen === 'admin-add-product' && (
            <motion.div 
              key="admin-add-product"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="min-h-screen bg-dark-bg p-6 space-y-6"
            >
              <div className="flex items-center gap-4">
                <button onClick={() => setCurrentScreen('admin-panel')} className="p-2 text-slate-400">
                  <ChevronLeft size={24} />
                </button>
                <h2 className="text-2xl font-bold text-white">Novo Produto</h2>
              </div>

              <div className="bg-dark-surface p-6 rounded-3xl border border-dark-border space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nome do Produto</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Cimento Cauê 50kg"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Preço (R$)</label>
                  <input 
                    type="number" 
                    placeholder="0.00"
                    value={newProduct.price || ''}
                    onChange={(e) => setNewProduct({...newProduct, price: Number(e.target.value)})}
                    className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Quantidade em Estoque</label>
                  <input 
                    type="number" 
                    placeholder="Ex: 100"
                    value={newProduct.stock || ''}
                    onChange={(e) => setNewProduct({...newProduct, stock: Number(e.target.value)})}
                    className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <select 
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                    className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-primary outline-none transition-all appearance-none"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">URL da Imagem</label>
                  <input 
                    type="text" 
                    placeholder="https://exemplo.com/imagem.jpg"
                    value={newProduct.image}
                    onChange={(e) => setNewProduct({...newProduct, image: e.target.value})}
                    className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                  />
                  {newProduct.image && (
                    <div className="mt-2 relative aspect-video rounded-xl overflow-hidden border border-dark-border">
                      <img src={newProduct.image || PLACEHOLDER_IMAGE} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Descrição</label>
                  <textarea 
                    placeholder="Descreva o produto..."
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                    className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-primary outline-none transition-all h-32 resize-none"
                  />
                </div>

                <button 
                  onClick={handleAddProduct}
                  className="w-full orange-gradient text-white py-4 rounded-2xl font-bold shadow-lg shadow-orange-900/20 active:scale-95 transition-all mt-4"
                >
                  Cadastrar Produto
                </button>
              </div>
            </motion.div>
          )}

          {currentScreen === 'admin-edit-product' && (
            <motion.div 
              key="admin-edit-product"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="min-h-screen bg-dark-bg p-6 space-y-6"
            >
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => {
                    if (adminSelectedProduct) setAdminSelectedProduct(null);
                    else setCurrentScreen('admin-panel');
                  }} 
                  className="p-2 text-slate-400"
                >
                  <ChevronLeft size={24} />
                </button>
                <h2 className="text-2xl font-bold text-white">
                  {adminSelectedProduct ? 'Editar Detalhes' : 'Selecionar Produto'}
                </h2>
              </div>

              {!adminSelectedProduct ? (
                <div className="space-y-3">
                  {products.map(product => (
                    <button 
                      key={product.id}
                      onClick={() => setAdminSelectedProduct(product)}
                      className="w-full flex items-center gap-4 p-4 bg-dark-surface rounded-2xl border border-dark-border hover:border-primary/50 transition-all text-left"
                    >
                      <img src={product.image || PLACEHOLDER_IMAGE} alt={product.name} className="w-12 h-12 rounded-lg object-cover" referrerPolicy="no-referrer" />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-white">{product.name}</p>
                        <p className="text-xs text-slate-500">R$ {product.price.toFixed(2)}</p>
                      </div>
                      <ArrowRight size={18} className="text-slate-600" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="bg-dark-surface p-6 rounded-3xl border border-dark-border space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nome</label>
                    <input 
                      type="text" 
                      value={adminSelectedProduct.name}
                      onChange={(e) => setAdminSelectedProduct({...adminSelectedProduct, name: e.target.value})}
                      className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Preço (R$)</label>
                    <input 
                      type="number" 
                      value={adminSelectedProduct.price}
                      onChange={(e) => setAdminSelectedProduct({...adminSelectedProduct, price: Number(e.target.value)})}
                      className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Quantidade em Estoque</label>
                    <input 
                      type="number" 
                      value={adminSelectedProduct.stock || 0}
                      onChange={(e) => setAdminSelectedProduct({...adminSelectedProduct, stock: Number(e.target.value)})}
                      className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">URL da Imagem</label>
                    <input 
                      type="text" 
                      value={adminSelectedProduct.image}
                      onChange={(e) => setAdminSelectedProduct({...adminSelectedProduct, image: e.target.value})}
                      className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                    />
                    {adminSelectedProduct.image && (
                      <div className="mt-2 relative aspect-video rounded-xl overflow-hidden border border-dark-border">
                        <img src={adminSelectedProduct.image || PLACEHOLDER_IMAGE} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Descrição</label>
                    <textarea 
                      value={adminSelectedProduct.description}
                      onChange={(e) => setAdminSelectedProduct({...adminSelectedProduct, description: e.target.value})}
                      className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-primary outline-none transition-all h-32 resize-none"
                    />
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button 
                      onClick={() => {
                        handleUpdateProduct(adminSelectedProduct);
                        setAdminSelectedProduct(null);
                      }}
                      className="flex-1 orange-gradient text-white py-4 rounded-2xl font-bold shadow-lg shadow-orange-900/20 active:scale-95 transition-all"
                    >
                      Salvar Alterações
                    </button>
                    <button 
                      onClick={() => handleDeleteProduct(adminSelectedProduct.id)}
                      className="p-4 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-all"
                      title="Excluir Produto"
                    >
                      <Trash2 size={24} />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {currentScreen === 'admin-change-price' && (
            <motion.div 
              key="admin-change-price"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="min-h-screen bg-dark-bg p-6 space-y-6"
            >
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => {
                    if (adminSelectedProduct) setAdminSelectedProduct(null);
                    else setCurrentScreen('admin-panel');
                  }} 
                  className="p-2 text-slate-400"
                >
                  <ChevronLeft size={24} />
                </button>
                <h2 className="text-2xl font-bold text-white">
                  {adminSelectedProduct ? 'Novo Preço' : 'Selecionar Produto'}
                </h2>
              </div>

              {!adminSelectedProduct ? (
                <div className="space-y-3">
                  {products.map(product => (
                    <button 
                      key={product.id}
                      onClick={() => setAdminSelectedProduct(product)}
                      className="w-full flex items-center gap-4 p-4 bg-dark-surface rounded-2xl border border-dark-border hover:border-primary/50 transition-all text-left"
                    >
                      <img src={product.image || PLACEHOLDER_IMAGE} alt={product.name} className="w-12 h-12 rounded-lg object-cover" referrerPolicy="no-referrer" />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-white">{product.name}</p>
                        <p className="text-xs text-slate-500">Preço atual: R$ {product.price.toFixed(2)}</p>
                      </div>
                      <ArrowRight size={18} className="text-slate-600" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="bg-dark-surface p-6 rounded-3xl border border-dark-border space-y-4 text-center">
                  <div className="w-20 h-20 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 mx-auto mb-4">
                    <DollarSign size={40} />
                  </div>
                  <h3 className="text-white font-bold">{adminSelectedProduct.name}</h3>
                  <p className="text-slate-500 text-sm">Preço atual: R$ {adminSelectedProduct.price.toFixed(2)}</p>
                  
                  <div className="space-y-2 text-left mt-6">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Novo Valor de Venda</label>
                    <input 
                      type="number" 
                      placeholder="0.00"
                      className="w-full bg-dark-bg border border-dark-border rounded-xl py-4 px-4 text-white text-2xl font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                      onChange={(e) => setAdminSelectedProduct({...adminSelectedProduct, price: Number(e.target.value)})}
                    />
                  </div>

                  <button 
                    onClick={() => {
                      handleUpdatePrice(adminSelectedProduct.id, adminSelectedProduct.price);
                      setAdminSelectedProduct(null);
                    }}
                    className="w-full orange-gradient text-white py-4 rounded-2xl font-bold shadow-lg shadow-orange-900/20 active:scale-95 transition-all mt-6"
                  >
                    Confirmar Novo Preço
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {currentScreen === 'admin-promo' && (
            <motion.div 
              key="admin-promo"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="min-h-screen bg-dark-bg p-6 space-y-6"
            >
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => {
                    if (adminSelectedProduct) setAdminSelectedProduct(null);
                    else setCurrentScreen('admin-panel');
                  }} 
                  className="p-2 text-slate-400"
                >
                  <ChevronLeft size={24} />
                </button>
                <h2 className="text-2xl font-bold text-white">
                  {adminSelectedProduct ? 'Configurar Oferta' : 'Selecionar Produto'}
                </h2>
              </div>

              {!adminSelectedProduct ? (
                <div className="space-y-3">
                  {products.map(product => (
                    <button 
                      key={product.id}
                      onClick={() => setAdminSelectedProduct(product)}
                      className="w-full flex items-center gap-4 p-4 bg-dark-surface rounded-2xl border border-dark-border hover:border-primary/50 transition-all text-left"
                    >
                      <img src={product.image || PLACEHOLDER_IMAGE} alt={product.name} className="w-12 h-12 rounded-lg object-cover" referrerPolicy="no-referrer" />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-white">{product.name}</p>
                        <p className="text-xs text-slate-500">R$ {product.price.toFixed(2)}</p>
                      </div>
                      <ArrowRight size={18} className="text-slate-600" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="bg-dark-surface p-6 rounded-3xl border border-dark-border space-y-4 text-center">
                  <div className="w-20 h-20 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-500 mx-auto mb-4">
                    <Tag size={40} />
                  </div>
                  <h3 className="text-white font-bold">{adminSelectedProduct.name}</h3>
                  <p className="text-slate-500 text-sm">Valor atual: R$ {adminSelectedProduct.price.toFixed(2)}</p>
                  
                  <div className="space-y-2 text-left mt-6">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Porcentagem de Desconto (%)</label>
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {[10, 20, 30, 50].map(pct => (
                        <button 
                          key={pct}
                          onClick={() => handleActivatePromo(adminSelectedProduct.id, pct)}
                          className="bg-dark-bg border border-dark-border py-3 rounded-xl text-white font-bold hover:bg-primary hover:border-primary transition-all"
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-600 text-center italic">Clique em uma porcentagem para aplicar imediatamente</p>
                  </div>

                  {adminSelectedProduct.originalPrice && (
                    <button 
                      onClick={() => {
                        handleRemovePromo(adminSelectedProduct.id);
                        setAdminSelectedProduct(null);
                      }}
                      className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 bg-red-500/10 text-red-500 rounded-xl font-bold border border-red-500/20 hover:bg-red-500 hover:text-white transition-all"
                    >
                      <Trash2 size={18} />
                      Remover Desconto
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {currentScreen === 'admin-edit-store' && (
            <motion.div 
              key="admin-edit-store"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="min-h-screen bg-dark-bg p-6 space-y-6"
            >
              <div className="flex items-center gap-4">
                <button onClick={() => setCurrentScreen('admin-panel')} className="p-2 text-slate-400">
                  <ChevronLeft size={24} />
                </button>
                <h2 className="text-2xl font-bold text-white">Editar Loja</h2>
              </div>

              <div className="bg-dark-surface p-6 rounded-3xl border border-dark-border space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nome da Loja</label>
                  <input 
                    type="text" 
                    value={storeInfo.name}
                    onChange={(e) => setStoreInfo({...storeInfo, name: e.target.value})}
                    className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Endereço Completo</label>
                  <textarea 
                    value={storeInfo.address}
                    onChange={(e) => setStoreInfo({...storeInfo, address: e.target.value})}
                    className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-primary outline-none transition-all min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Horário de Funcionamento</label>
                  <input 
                    type="text" 
                    value={storeInfo.hours}
                    onChange={(e) => setStoreInfo({...storeInfo, hours: e.target.value})}
                    className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Telefone de Contato</label>
                  <input 
                    type="text" 
                    value={storeInfo.phone}
                    onChange={(e) => setStoreInfo({...storeInfo, phone: e.target.value})}
                    className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                  />
                </div>

                <button 
                  onClick={() => handleUpdateStoreInfo(storeInfo)}
                  className="w-full orange-gradient text-white py-4 rounded-2xl font-bold shadow-lg shadow-orange-900/20 active:scale-95 transition-all mt-4"
                >
                  Salvar Alterações
                </button>
              </div>
            </motion.div>
          )}

          {currentScreen === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="px-4 py-4 space-y-6"
            >
              {/* Banner */}
              <div className="relative h-44 rounded-2xl overflow-hidden bg-dark-surface p-6 flex flex-col justify-center text-white shadow-2xl shadow-black/40 border border-white/5">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                <h2 className="text-2xl font-bold leading-tight mb-1 bg-gradient-to-r from-[#ff4d00] via-[#ff8c00] to-[#ffcc00] bg-clip-text text-transparent">
                  Ajudando a construir o futuro
                </h2>
                <p className="text-slate-400 text-sm">Materiais de construção com o melhor preço da região.</p>
                <button className="mt-4 orange-gradient text-white font-bold px-4 py-2 rounded-lg text-sm w-fit hover:opacity-90 transition-all shadow-lg shadow-orange-900/20">
                  Ver Ofertas
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                <input 
                  type="text" 
                  placeholder="O que você procura?"
                  className="w-full bg-dark-surface border border-dark-border rounded-xl py-4 pl-12 pr-4 text-white shadow-sm focus:ring-2 focus:ring-primary transition-all outline-none placeholder:text-slate-600"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Categories */}
              <div className="relative group">
                <h3 className="font-bold text-lg mb-4 text-white">Categorias</h3>
                
                <button 
                  onClick={() => scrollCategories('left')}
                  className="absolute left-0 top-[68px] -translate-x-1/2 z-10 bg-dark-surface/90 border border-dark-border p-2 rounded-full text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronLeft size={20} />
                </button>

                <div 
                  ref={categoriesRef} 
                  className="flex gap-4 overflow-x-auto no-scrollbar pb-2 scroll-mt-24 scroll-smooth"
                >
                  {CATEGORIES.map(cat => (
                    <button 
                      key={cat.id}
                      className="flex flex-col items-center gap-2 min-w-[80px]"
                      onClick={() => setSearchQuery(cat.name)}
                    >
                      <div className="w-16 h-16 bg-dark-surface rounded-2xl flex items-center justify-center shadow-sm border border-dark-border text-primary hover:bg-primary hover:text-white transition-all">
                        <cat.icon size={28} />
                      </div>
                      <span className="text-xs font-medium text-slate-400">{cat.name}</span>
                    </button>
                  ))}
                </div>

                <button 
                  onClick={() => scrollCategories('right')}
                  className="absolute right-0 top-[68px] translate-x-1/2 z-10 bg-dark-surface/90 border border-dark-border p-2 rounded-full text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ArrowRight size={20} />
                </button>
              </div>

              {/* Featured Products */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg text-white">Produtos em Destaque</h3>
                  <button 
                    onClick={() => setCurrentScreen('all-products')}
                    className="text-primary text-sm font-semibold"
                  >
                    Ver todos
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map(product => (
                      <div 
                        key={product.id}
                        className="bg-dark-surface rounded-2xl p-3 shadow-lg border border-dark-border flex flex-col group"
                      >
                        <div 
                          className="relative aspect-square rounded-xl overflow-hidden bg-slate-900 mb-3 cursor-pointer"
                          onClick={() => navigateToProduct(product)}
                        >
                          <img 
                            src={product.image || PLACEHOLDER_IMAGE} 
                            alt={product.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                            referrerPolicy="no-referrer"
                          />
                          <button 
                            onClick={(e) => { e.stopPropagation(); toggleSave(product.id); }}
                            className={`absolute top-2 right-2 p-1.5 rounded-full shadow-sm transition-colors ${savedProducts.includes(product.id) ? 'bg-red-500/20 text-red-500' : 'bg-black/40 text-slate-400'}`}
                          >
                            <Heart size={16} fill={savedProducts.includes(product.id) ? "currentColor" : "none"} />
                          </button>
                        </div>
                        <h4 className="text-sm font-semibold text-slate-200 line-clamp-2 mb-1 min-h-[40px]">{product.name}</h4>
                        <div className="mt-auto">
                          <PriceDisplay product={product} />
                          <button 
                            onClick={() => addToCart(product)}
                            className="w-full mt-2 orange-gradient text-white py-2 rounded-lg text-xs font-bold shadow-md shadow-orange-900/20 active:scale-95 transition-all"
                          >
                            Adicionar
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 py-12 text-center space-y-4 bg-dark-surface rounded-3xl border border-dark-border">
                      <div className="w-16 h-16 bg-dark-bg rounded-full flex items-center justify-center mx-auto text-slate-700">
                        <Search size={32} />
                      </div>
                      <div>
                        <p className="text-white font-bold">Nenhum produto encontrado</p>
                        <p className="text-slate-500 text-sm">Tente buscar por outro termo ou categoria.</p>
                      </div>
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="text-primary font-bold text-sm hover:underline"
                      >
                        Limpar busca
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {currentScreen === 'product' && selectedProduct && (
            <motion.div 
              key="product"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-dark-bg min-h-screen"
            >
              <div className="relative h-80">
                <button 
                  onClick={() => setCurrentScreen('home')}
                  className="absolute top-4 left-4 z-10 bg-black/40 p-2 rounded-full shadow-md text-white backdrop-blur-sm"
                >
                  <ChevronLeft size={24} />
                </button>
                <img 
                  src={selectedProduct.image || PLACEHOLDER_IMAGE} 
                  alt={selectedProduct.name} 
                  className="w-full h-full object-cover opacity-80"
                  referrerPolicy="no-referrer"
                />
              </div>
              
              <div className="p-6 space-y-6 -mt-6 bg-dark-bg rounded-t-3xl relative z-10 border-t border-white/5">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">{selectedProduct.category}</span>
                    <h2 className="text-2xl font-bold text-white mt-1">{selectedProduct.name}</h2>
                  </div>
                  <button 
                    onClick={() => toggleSave(selectedProduct.id)}
                    className={`p-3 rounded-2xl shadow-sm transition-colors ${savedProducts.includes(selectedProduct.id) ? 'bg-red-500/20 text-red-500' : 'bg-dark-surface text-slate-400'}`}
                  >
                    <Heart size={24} fill={savedProducts.includes(selectedProduct.id) ? "currentColor" : "none"} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <PriceDisplay product={selectedProduct} className="!flex-row items-baseline gap-2" />
                  <div className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full text-sm font-bold">
                    <CheckCircle2 size={16} />
                    Em estoque
                  </div>
                </div>

                <div className="space-y-4">
                  <button 
                    onClick={() => addToCart(selectedProduct)}
                    className="w-full orange-gradient text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-orange-900/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                  >
                    <ShoppingCart size={20} />
                    Adicionar ao Carrinho
                  </button>
                  <button 
                    onClick={() => toggleSave(selectedProduct.id)}
                    className="w-full bg-dark-surface text-slate-300 py-4 rounded-2xl font-bold text-sm border border-dark-border hover:bg-slate-800 transition-all"
                  >
                    Salvar para acompanhar preço
                  </button>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold text-white">Descrição</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {selectedProduct.description}
                  </p>
                  <ul className="space-y-2 pt-2">
                    {selectedProduct.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-slate-400">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}

          {currentScreen === 'cart' && (
            <motion.div 
              key="cart"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="px-4 py-4 space-y-6"
            >
              <div className="flex items-center gap-4">
                <button onClick={() => setCurrentScreen('home')} className="p-2 text-slate-400">
                  <ChevronLeft size={24} />
                </button>
                <h2 className="text-2xl font-bold text-white">Meu Carrinho</h2>
              </div>

              {isLoadingCart ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                  <p className="text-slate-500 font-medium animate-pulse">Carregando seu carrinho...</p>
                </div>
              ) : cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                  <div className="w-24 h-24 bg-dark-surface rounded-full flex items-center justify-center text-slate-700">
                    <ShoppingCart size={48} />
                  </div>
                  <h3 className="text-xl font-bold text-white">Seu carrinho está vazio</h3>
                  <p className="text-slate-500 max-w-[200px]">Adicione produtos para começar sua construção!</p>
                  <button 
                    onClick={() => setCurrentScreen('home')}
                    className="bg-primary text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-orange-900/20"
                  >
                    Ver Produtos
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {cart.map(item => (
                      <div key={item.product.id} className="bg-dark-surface p-4 rounded-2xl shadow-sm border border-dark-border flex gap-4">
                        <img 
                          src={item.product.image || PLACEHOLDER_IMAGE} 
                          alt={item.product.name} 
                          className="w-20 h-20 object-cover rounded-xl opacity-90"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 flex flex-col justify-between">
                          <div className="flex justify-between items-start">
                            <h4 className="text-sm font-bold text-slate-200 line-clamp-1">{item.product.name}</h4>
                            <button 
                              onClick={() => removeFromCart(item.product.id)}
                              className="text-slate-600 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                          <div className="flex justify-between items-center mt-2">
                            <PriceDisplay product={item.product} />
                            <div className="flex items-center gap-3 bg-dark-bg rounded-lg p-1 border border-dark-border">
                              <button 
                                onClick={() => updateQuantity(item.product.id, -1)}
                                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:bg-dark-surface rounded-md transition-all"
                              >
                                <Minus size={16} />
                              </button>
                              <span className="font-bold text-sm min-w-[20px] text-center">{item.quantity}</span>
                              <button 
                                onClick={() => updateQuantity(item.product.id, 1)}
                                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:bg-dark-surface rounded-md transition-all"
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-dark-surface p-6 rounded-3xl shadow-lg border border-dark-border space-y-4">
                    <div className="flex justify-between items-center text-slate-500">
                      <span>Subtotal</span>
                      <span>R$ {cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500">
                      <span>Entrega</span>
                      <span className="text-emerald-400 font-bold">Grátis</span>
                    </div>
                    <div className="h-px bg-dark-border"></div>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-lg text-white">Total</span>
                      <span className="font-bold text-2xl text-primary">R$ {cartTotal.toFixed(2)}</span>
                    </div>
                    <button 
                      onClick={handleWhatsAppOrder}
                      className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-all mt-4"
                    >
                      <MessageCircle size={24} />
                      Finalizar pelo WhatsApp
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {currentScreen === 'notifications' && (
            <motion.div 
              key="notifications"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="px-4 py-4 space-y-6"
            >
              <div className="flex items-center gap-4">
                <button onClick={() => setCurrentScreen('home')} className="p-2 text-slate-400">
                  <ChevronLeft size={24} />
                </button>
                <h2 className="text-2xl font-bold text-white">Notificações</h2>
              </div>

              <div className="space-y-4">
                {isLoadingNotifications ? (
                  <div className="flex flex-col items-center py-12 gap-3">
                    <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <p className="text-slate-500 text-sm">Buscando notificações...</p>
                  </div>
                ) : notifications.length > 0 ? (
                  notifications.map(notif => (
                    <div 
                      key={notif.id} 
                      className={`p-4 rounded-2xl border flex gap-4 transition-all ${notif.type === 'promo' ? 'bg-orange-500/10 border-orange-500/20' : 'bg-dark-surface border-dark-border shadow-sm'}`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${notif.type === 'promo' ? 'bg-primary text-white' : 'bg-slate-800 text-slate-500'}`}>
                        <notif.icon size={24} />
                      </div>
                      <div className="space-y-1 w-full">
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold text-slate-200">{notif.title}</h4>
                          <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{notif.time}</span>
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed">{notif.message}</p>
                        {notif.type === 'promo' && (
                          <button className="text-primary text-xs font-bold mt-2 flex items-center gap-1">
                            Aproveitar agora <ArrowRight size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Bell size={48} className="mx-auto text-slate-700 mb-4" />
                    <p className="text-slate-500">Nenhuma notificação por enquanto.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {currentScreen === 'all-products' && (
            <motion.div 
              key="all-products"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="px-4 py-4 space-y-6"
            >
              <div className="flex items-center gap-4">
                <button onClick={() => setCurrentScreen(userProfile.role === 'admin' ? 'admin-panel' : 'home')} className="p-2 text-slate-400">
                  <ChevronLeft size={24} />
                </button>
                <h2 className="text-2xl font-bold text-white">Todos os Produtos</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {products.map(product => (
                  <div 
                    key={product.id}
                    className="bg-dark-surface rounded-2xl p-3 shadow-lg border border-dark-border flex flex-col group"
                  >
                    <div 
                      className="relative aspect-square rounded-xl overflow-hidden bg-slate-900 mb-3 cursor-pointer"
                      onClick={() => navigateToProduct(product)}
                    >
                      <img 
                        src={product.image || PLACEHOLDER_IMAGE} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <h4 className="text-sm font-semibold text-slate-200 line-clamp-2 mb-1 min-h-[40px]">{product.name}</h4>
                    <div className="mt-auto">
                      <PriceDisplay product={product} />
                      <button 
                        onClick={() => addToCart(product)}
                        className="w-full mt-2 orange-gradient text-white py-2 rounded-lg text-xs font-bold shadow-md shadow-orange-900/20 active:scale-95 transition-all"
                      >
                        Adicionar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {currentScreen === 'favorites' && (
            <motion.div 
              key="favorites"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="px-4 py-4 space-y-6"
            >
              <div className="flex items-center gap-4">
                <button onClick={() => setCurrentScreen('home')} className="p-2 text-slate-400">
                  <ChevronLeft size={24} />
                </button>
                <h2 className="text-2xl font-bold text-white">Meus Favoritos</h2>
              </div>

              {savedProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                  <div className="w-24 h-24 bg-dark-surface rounded-full flex items-center justify-center text-slate-700">
                    <Heart size={48} />
                  </div>
                  <h3 className="text-xl font-bold text-white">Sua lista está vazia</h3>
                  <p className="text-slate-500 max-w-[200px]">Salve os produtos que você mais gostou para acompanhar o preço!</p>
                  <button 
                    onClick={() => setCurrentScreen('home')}
                    className="bg-primary text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-orange-900/20"
                  >
                    Explorar Produtos
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {products.filter(p => savedProducts.includes(p.id)).map(product => (
                    <div 
                      key={product.id}
                      className="bg-dark-surface rounded-2xl p-3 shadow-lg border border-dark-border flex flex-col group"
                    >
                      <div 
                        className="relative aspect-square rounded-xl overflow-hidden bg-slate-900 mb-3 cursor-pointer"
                        onClick={() => navigateToProduct(product)}
                      >
                        <img 
                          src={product.image || PLACEHOLDER_IMAGE} 
                          alt={product.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                          referrerPolicy="no-referrer"
                        />
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleSave(product.id); }}
                          className="absolute top-2 right-2 p-1.5 rounded-full shadow-sm bg-red-500/20 text-red-500"
                        >
                          <Heart size={16} fill="currentColor" />
                        </button>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-200 line-clamp-2 mb-1 min-h-[40px]">{product.name}</h4>
                      <div className="mt-auto">
                        <PriceDisplay product={product} />
                        <button 
                          onClick={() => addToCart(product)}
                          className="w-full mt-2 orange-gradient text-white py-2 rounded-lg text-xs font-bold shadow-md shadow-orange-900/20 active:scale-95 transition-all"
                        >
                          Adicionar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {currentScreen === 'profile' && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="px-4 py-4 space-y-6"
            >
              <div className="flex items-center gap-4">
                <button onClick={() => setCurrentScreen(userProfile.role === 'admin' ? 'admin-panel' : 'home')} className="p-2 text-slate-400">
                  <ChevronLeft size={24} />
                </button>
                <h2 className="text-2xl font-bold text-white">Meu Perfil</h2>
              </div>

              <div className="flex flex-col items-center py-4">
                <div className="w-24 h-24 rounded-full orange-gradient flex items-center justify-center text-white text-3xl font-bold border-4 border-dark-surface shadow-xl">
                  {userProfile.name.charAt(0)}
                </div>
                <h3 className="text-xl font-bold text-white mt-4">{userProfile.name}</h3>
                <p className="text-slate-500 text-sm">{userProfile.email}</p>
              </div>

              <div className="space-y-4">
                <div className="bg-dark-surface p-6 rounded-3xl border border-dark-border space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nome Completo</label>
                    <input 
                      type="text" 
                      value={userProfile.name}
                      onChange={(e) => setUserProfile({...userProfile, name: e.target.value})}
                      className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Telefone</label>
                    <input 
                      type="text" 
                      value={userProfile.phone}
                      onChange={(e) => setUserProfile({...userProfile, phone: e.target.value})}
                      className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Endereço de Entrega</label>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Rua / Avenida</label>
                      <input 
                        type="text" 
                        placeholder="Rua, Avenida..."
                        value={userProfile.street}
                        onChange={(e) => setUserProfile({...userProfile, street: e.target.value})}
                        className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Número</label>
                        <input 
                          type="text" 
                          placeholder="123"
                          value={userProfile.number}
                          onChange={(e) => setUserProfile({...userProfile, number: e.target.value})}
                          className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">CEP</label>
                        <input 
                          type="text" 
                          placeholder="00000-000"
                          value={userProfile.zipCode}
                          onChange={(e) => setUserProfile({...userProfile, zipCode: e.target.value})}
                          className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Complemento</label>
                      <input 
                        type="text" 
                        placeholder="Apto, Bloco, Referência..."
                        value={userProfile.complement}
                        onChange={(e) => setUserProfile({...userProfile, complement: e.target.value})}
                        className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                      />
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      setToast('Perfil atualizado com sucesso!');
                      setCurrentScreen('home');
                    }}
                    className="w-full orange-gradient text-white py-4 rounded-2xl font-bold shadow-lg shadow-orange-900/20 active:scale-95 transition-all"
                  >
                    Salvar Alterações
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <button 
                    onClick={() => setCurrentScreen('favorites')}
                    className="bg-dark-surface p-4 rounded-2xl border border-dark-border flex flex-col items-center gap-2 hover:bg-slate-800 transition-colors"
                  >
                    <Heart className="text-primary" size={24} />
                    <span className="text-xs font-bold text-white">Favoritos</span>
                  </button>
                </div>

                {userProfile.role === 'admin' && (
                  <button 
                    onClick={() => setCurrentScreen('admin-panel')}
                    className="w-full bg-primary/10 text-primary py-4 rounded-2xl font-bold border border-primary/20 flex items-center justify-center gap-2 hover:bg-primary/20 transition-all active:scale-95"
                  >
                    <LayoutDashboard size={20} />
                    Voltar ao Painel Admin
                  </button>
                )}

                <button 
                  onClick={handleLogout}
                  className="w-full bg-red-500/10 text-red-500 py-4 rounded-2xl font-bold border border-red-500/20 flex items-center justify-center gap-2 hover:bg-red-500/20 transition-all active:scale-95"
                >
                  <LogOut size={20} />
                  Sair da Conta
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toast Notification */}
        <AnimatePresence>
          {toast && (
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] pointer-events-none"
            >
              <div className="bg-dark-surface/90 backdrop-blur-md text-white px-4 py-2 rounded-full font-bold shadow-xl border border-primary/20 flex items-center gap-2 pointer-events-auto text-sm">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                {toast}
              </div>
            </motion.div>
          )}
          {currentScreen === 'location' && (
            <LocationSection onBack={() => setCurrentScreen('home')} storeInfo={storeInfo} />
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      {currentScreen !== 'login' && currentScreen !== 'register' && currentScreen !== 'forgot-password' && currentScreen !== 'admin-panel' && (
        <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto glass px-6 py-3 flex justify-between items-center z-50 rounded-t-3xl shadow-[0_-10px_20px_rgba(0,0,0,0.2)]">
        <button 
          onClick={scrollToTop}
          className={`flex flex-col items-center gap-1 transition-all hover:text-primary hover:scale-110 ${currentScreen === 'home' ? 'text-primary scale-110' : 'text-slate-500'}`}
        >
          <Home size={24} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Início</span>
        </button>
        <button 
          onClick={scrollToCategories}
          className="flex flex-col items-center gap-1 text-slate-500 hover:text-primary hover:scale-110 transition-all"
        >
          <Menu size={24} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Categorias</span>
        </button>
        <button 
          onClick={() => setCurrentScreen('cart')}
          className={`flex flex-col items-center gap-1 transition-all hover:text-primary hover:scale-110 ${currentScreen === 'cart' ? 'text-primary scale-110' : 'text-slate-500'}`}
        >
          <div className="relative">
            <ShoppingCart size={24} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-dark-surface">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider">Carrinho</span>
        </button>
        <button 
          onClick={() => setCurrentScreen('location')}
          className={`flex flex-col items-center gap-1 transition-all hover:text-primary hover:scale-110 ${currentScreen === 'location' ? 'text-primary scale-110' : 'text-slate-500'}`}
        >
          <MapPin size={24} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Loja</span>
        </button>
        <button 
          onClick={() => setCurrentScreen('favorites')}
          className={`flex flex-col items-center gap-1 transition-all hover:text-primary hover:scale-110 ${currentScreen === 'favorites' ? 'text-primary scale-110' : 'text-slate-500'}`}
        >
          <div className="relative">
            <Heart size={24} fill={currentScreen === 'favorites' ? "currentColor" : "none"} />
            {savedProducts.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-dark-surface">
                {savedProducts.length}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider">Favoritos</span>
        </button>
      </nav>
      )}

      {/* Confirm Dialog */}
      <AnimatePresence>
        {confirmDialog && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-dark-surface border border-dark-border p-6 rounded-3xl max-w-sm w-full shadow-2xl space-y-4"
            >
              <h3 className="text-xl font-bold text-white">{confirmDialog.title}</h3>
              <p className="text-slate-400 text-sm">{confirmDialog.message}</p>
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setConfirmDialog(null)}
                  className="flex-1 py-3 px-4 bg-dark-bg border border-dark-border text-slate-400 font-bold rounded-xl hover:bg-slate-800 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmDialog.onConfirm}
                  className="flex-1 py-3 px-4 orange-gradient text-white font-bold rounded-xl shadow-lg shadow-orange-900/20 active:scale-95 transition-all"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

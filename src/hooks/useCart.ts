import { useState, useMemo } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Product } from '../constants';
import { handleFirestoreError, OperationType } from '../types';

export const useCart = (products: Product[], setToast: (msg: string | null) => void) => {
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [isLoadingCart, setIsLoadingCart] = useState(false);

  const fetchCart = async () => {
    if (!auth.currentUser) return;
    setIsLoadingCart(true);
    try {
      const cartDoc = await getDoc(doc(db, "carts", auth.currentUser.uid));
      if (cartDoc.exists()) {
        const cartData = cartDoc.data().items || [];
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

  return {
    cart,
    setCart,
    isLoadingCart,
    addToCart,
    removeFromCart,
    updateQuantity,
    saveCart,
    fetchCart,
    cartTotal,
    cartCount
  };
};

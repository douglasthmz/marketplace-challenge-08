import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const stringedProducts = await AsyncStorage.getItem('@Market:Products');
      if (stringedProducts !== null) setProducts(JSON.parse(stringedProducts));
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const productsCopy = [...products];
      const updatedProducts = productsCopy.map(product => {
        if (product.id === id) {
          product.quantity += 1;
          return product;
        }
        return product;
      });
      setProducts(updatedProducts);
      await AsyncStorage.removeItem('@Market:Products');
      await AsyncStorage.setItem('@Market:Products', JSON.stringify(products));
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const productsCopy = [...products];
      const productExists = productsCopy.filter(
        singleProduct => singleProduct.id === product.id,
      );
      if (productExists.length > 0) {
        increment(product.id);
        return;
      }
      product.quantity = 1;
      setProducts([...products, product]);

      await AsyncStorage.removeItem('@Market:Products');
      await AsyncStorage.setItem('@Market:Products', JSON.stringify(products));
    },
    [increment, products],
  );

  const decrement = useCallback(
    async id => {
      const productsCopy = [...products];
      const selectedProduct = productsCopy.filter(product => product.id === id);
      let updatedProducts = [];
      if (selectedProduct && selectedProduct[0].quantity === 1) {
        setProducts(state => state.filter(product => product.id !== id));
      } else {
        updatedProducts = productsCopy.map(product => {
          if (product.id === id) {
            product.quantity -= 1;
            return product;
          }
          return product;
        });
        setProducts([...updatedProducts]);
      }
      await AsyncStorage.removeItem('@Market:Products');
      await AsyncStorage.setItem('@Market:Products', JSON.stringify(products));
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };

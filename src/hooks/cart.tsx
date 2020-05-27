import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';
import { TotalProductsText } from 'src/pages/Cart/styles';

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
      // await AsyncStorage.clear();
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
      // console.log('entrei no increment', updatedProducts, id, products);
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
      // console.log(productExists.length, productExists);
      if (productExists.length > 0) {
        // console.log('entrei no productExists', product.id);
        increment(product.id);
        return;
      }
      product.quantity = 1;
      // console.log('addtocart', product);
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
      console.log('produto selecionado', JSON.stringify(selectedProduct, 0, 2));
      if (selectedProduct && selectedProduct[0].quantity === 1) {
        setProducts(state => state.filter(product => product.id !== id));
        console.log('exclusão', JSON.stringify(selectedProduct, 0, 2));
      } else {
        console.log('menos 1', JSON.stringify(products, 0, 2));
        updatedProducts = productsCopy.map(product => {
          if (product.id === id) {
            product.quantity -= 1;
            return product;
          }
          return product;
        });
        setProducts([...updatedProducts]);
      }
      // console.log('entrei no decrement', updatedProducts, id, products);
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

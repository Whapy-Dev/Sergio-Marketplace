import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/contexts/AuthContext';
import { FavoritesProvider } from './src/contexts/FavoritesContext';
import { CartProvider } from './src/contexts/CartContext';

export default function App() {
  return (
    <AuthProvider>
      <FavoritesProvider>
        <CartProvider>
          <AppNavigator />
        </CartProvider>
      </FavoritesProvider>
    </AuthProvider>
  );
}
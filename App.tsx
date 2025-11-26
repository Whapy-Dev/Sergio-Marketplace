import './setupDevTools';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/contexts/AuthContext';
import { CartProvider } from './src/contexts/CartContext';
import { FavoritesProvider } from './src/contexts/FavoritesContext';
import { NotificationProvider } from './src/contexts/NotificationContext';

// NO debe haber import de CSS aquí

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <CartProvider>
          <FavoritesProvider>
            <AppNavigator />
            <StatusBar style="auto" />
          </FavoritesProvider>
        </CartProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
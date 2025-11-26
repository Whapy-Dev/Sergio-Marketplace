import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { useNotifications } from '../contexts/NotificationContext';

// Screens - Home
import HomeScreen from '../screens/home/HomeScreen';
import ProductDetailScreen from '../screens/products/ProductDetailScreen';
import SearchScreen from '../screens/search/SearchScreen';

// Screens - Cart & Favorites
import CartScreen from '../screens/cart/CartScreen';
import FavoritesScreen from '../screens/favorites/FavoritesScreen';
import ListDetailScreen from '../screens/favorites/ListDetailScreen';

// Screens - Chat
import ConversationsScreen from '../screens/chat/ConversationsScreen';
import ChatScreen from '../screens/chat/ChatScreen';

// Screens - Profile
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import ChangePasswordScreen from '../screens/profile/ChangePasswordScreen';
import MyOrdersScreen from '../screens/profile/MyOrdersScreen';
import NotificationsScreen from '../screens/profile/NotificationsScreen';
import DeleteAccountScreen from '../screens/profile/DeleteAccountScreen';
import HelpScreen from '../screens/profile/HelpScreen';
import TermsScreen from '../screens/profile/TermsScreen';
import LanguageScreen from '../screens/profile/LanguageScreen';

// Screens - Seller
import MyProductsScreen from '../screens/seller/MyProductsScreen';
import CreateProductScreen from '../screens/seller/CreateProductScreen';
import EditProductScreen from '../screens/seller/EditProductScreen';
import SellerDashboardScreen from '../screens/seller/SellerDashboardScreen';
import OfficialStoreDashboardScreen from '../screens/seller/OfficialStoreDashboardScreen';
import SellerAnalyticsScreen from '../screens/seller/SellerAnalyticsScreen';
import OrderDetailScreen from '../screens/orders/OrderDetailScreen';
import SellerOrdersScreen from '../screens/seller/SellerOrdersScreen';

// Screens - Checkout & Payments
import CheckoutScreen from '../screens/checkout/CheckoutScreen';
import PaymentPendingScreen from '../screens/checkout/PaymentPendingScreen';
import PaymentSuccessScreen from '../screens/checkout/PaymentSuccessScreen';
import PaymentFailureScreen from '../screens/checkout/PaymentFailureScreen';

// Screens - Wallet
import WalletScreen from '../screens/wallet/WalletScreen';
import BankingDetailsScreen from '../screens/wallet/BankingDetailsScreen';
import RequestWithdrawalScreen from '../screens/wallet/RequestWithdrawalScreen';
import WithdrawalHistoryScreen from '../screens/wallet/WithdrawalHistoryScreen';

// Screens - Auth
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import SplashScreen from '../screens/SplashScreen';

// Screens - Invoices
import MyInvoicesScreen from '../screens/invoices/MyInvoicesScreen';
import InvoiceDetailScreen from '../screens/invoices/InvoiceDetailScreen';

// Screens - Official Stores
import OfficialStoresScreen from '../screens/stores/OfficialStoresScreen';
import StoreDetailScreen from '../screens/stores/StoreDetailScreen';
import RegisterOfficialStoreScreen from '../screens/stores/RegisterOfficialStoreScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Export tab bar height for screens to use as bottom padding
export const TAB_BAR_HEIGHT = 70;

// Home Stack Navigator
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="OfficialStores" component={OfficialStoresScreen} />
      <Stack.Screen name="StoreDetail" component={StoreDetailScreen} />
    </Stack.Navigator>
  );
}

// Chat Stack Navigator
function ChatStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ConversationsMain" component={ConversationsScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
    </Stack.Navigator>
  );
}

// Favorites Stack Navigator
function FavoritesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FavoritesMain" component={FavoritesScreen} />
      <Stack.Screen name="ListDetail" component={ListDetailScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
    </Stack.Navigator>
  );
}

// En ProfileStack:
function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="MyOrders" component={MyOrdersScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
      <Stack.Screen name="MyProducts" component={MyProductsScreen} />
      <Stack.Screen name="CreateProduct" component={CreateProductScreen} />
      <Stack.Screen name="EditProduct" component={EditProductScreen} />
      <Stack.Screen name="SellerDashboard" component={SellerDashboardScreen} />
      <Stack.Screen name="OfficialStoreDashboard" component={OfficialStoreDashboardScreen} />
      <Stack.Screen name="SellerAnalytics" component={SellerAnalyticsScreen} />
      <Stack.Screen name="SellerOrders" component={SellerOrdersScreen} />
      <Stack.Screen name="SellerOrderDetail" component={OrderDetailScreen} />
      <Stack.Screen name="Wallet" component={WalletScreen} />
      <Stack.Screen name="BankingDetails" component={BankingDetailsScreen} />
      <Stack.Screen name="RequestWithdrawal" component={RequestWithdrawalScreen} />
      <Stack.Screen name="WithdrawalHistory" component={WithdrawalHistoryScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} />
      <Stack.Screen name="Help" component={HelpScreen} />
      <Stack.Screen name="Terms" component={TermsScreen} />
      <Stack.Screen name="Language" component={LanguageScreen} />
      <Stack.Screen name="RegisterOfficialStore" component={RegisterOfficialStoreScreen} />
      <Stack.Screen name="MyInvoices" component={MyInvoicesScreen} />
      <Stack.Screen name="InvoiceDetail" component={InvoiceDetailScreen} />
    </Stack.Navigator>
  );
}

// Bottom Tabs Navigator
function TabNavigator() {
  const { totalItems } = useCart();
  const { favorites } = useFavorites();
  const { unreadCount } = useNotifications();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          borderTopWidth: 0,
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
          position: 'absolute',
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -5 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarShowLabel: false,
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={28}
              color={color}
            />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Navigate to HomeMain with scrollToTop param
            navigation.navigate('Home', {
              screen: 'HomeMain',
              params: { scrollToTop: Date.now() },
            });
          },
        })}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesStack}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <View style={{ width: 28, height: 28, position: 'relative' }}>
              <Ionicons
                name={focused ? 'heart' : 'heart-outline'}
                size={28}
                color={color}
              />
              {favorites.length > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    right: -8,
                    top: -4,
                    backgroundColor: COLORS.primary,
                    borderRadius: 10,
                    minWidth: 18,
                    height: 18,
                    paddingHorizontal: 4,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
                    {favorites.length > 9 ? '9+' : favorites.length}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Conversations"
        component={ChatStack}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? 'chatbubble' : 'chatbubble-outline'}
              size={28}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <View style={{ width: 28, height: 28, position: 'relative' }}>
              <Ionicons
                name={focused ? 'basket' : 'basket-outline'}
                size={28}
                color={color}
              />
              {totalItems > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    right: -8,
                    top: -4,
                    backgroundColor: COLORS.primary,
                    borderRadius: 10,
                    minWidth: 18,
                    height: 18,
                    paddingHorizontal: 4,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
                    {totalItems > 9 ? '9+' : totalItems}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <View style={{ width: 28, height: 28, position: 'relative' }}>
              <Ionicons
                name={focused ? 'person' : 'person-outline'}
                size={28}
                color={color}
              />
              {unreadCount > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    right: -8,
                    top: -4,
                    backgroundColor: '#EF4444',
                    borderRadius: 10,
                    minWidth: 18,
                    height: 18,
                    paddingHorizontal: 4,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Linking configuration for deep links
const linking = {
  prefixes: ['sergiomarketplace://'],
  config: {
    screens: {
      MainTabs: {
        screens: {
          Home: 'home',
          Favorites: 'favorites',
          Conversations: 'conversations',
          Cart: 'cart',
          Profile: 'profile',
        },
      },
      Checkout: 'checkout',
      PaymentPending: {
        path: 'payment/pending',
        parse: {
          orderId: (order_id: string) => order_id,
        },
      },
      PaymentSuccess: {
        path: 'payment/success',
        parse: {
          orderId: (order_id: string) => order_id,
        },
      },
      PaymentFailure: {
        path: 'payment/failure',
        parse: {
          orderId: (order_id: string) => order_id,
        },
      },
    },
  },
};

// Main Stack Navigator
export default function AppNavigator() {
  const { session, loading } = useAuth();

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {session ? (
          <>
            <Stack.Screen name="MainTabs" component={TabNavigator} />
            <Stack.Screen name="Checkout" component={CheckoutScreen} />
            <Stack.Screen name="PaymentPending" component={PaymentPendingScreen} />
            <Stack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} />
            <Stack.Screen name="PaymentFailure" component={PaymentFailureScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="MainTabs" component={TabNavigator} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
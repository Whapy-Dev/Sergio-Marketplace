import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator, StatusBar } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { supabase } from '../../services/supabase';
import Button from '../../components/common/Button';
import { COLORS } from '../../constants/theme';

WebBrowser.maybeCompleteAuthSession();

interface LoginScreenProps {
  navigation: any;
}

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  const redirectUrl = AuthSession.makeRedirectUri({
    scheme: 'sergiomarketplace',
    path: 'auth/callback',
  });

  async function handleGoogleLogin() {
    try {
      setGoogleLoading(true);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl
        );

        if (result.type === 'success') {
          const url = result.url;
          // Extract tokens from URL
          const params = new URLSearchParams(url.split('#')[1]);
          const access_token = params.get('access_token');
          const refresh_token = params.get('refresh_token');

          if (access_token && refresh_token) {
            await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
          }
        }
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      Alert.alert('Error', 'No se pudo iniciar sesión con Google');
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleAppleLogin() {
    try {
      setAppleLoading(true);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl
        );

        if (result.type === 'success') {
          const url = result.url;
          const params = new URLSearchParams(url.split('#')[1]);
          const access_token = params.get('access_token');
          const refresh_token = params.get('refresh_token');

          if (access_token && refresh_token) {
            await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
          }
        }
      }
    } catch (error: any) {
      console.error('Apple login error:', error);
      Alert.alert('Error', 'No se pudo iniciar sesión con Apple');
    } finally {
      setAppleLoading(false);
    }
  }

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      console.log('Login exitoso:', data.user);
// La navegación se maneja automáticamente por el AuthContext
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-6 pt-8">
            <View className="mb-8">
              <Text className="text-3xl font-bold mb-2" style={{ color: COLORS.primary }}>
                Marketplace
              </Text>
              <Text className="text-2xl font-bold text-gray-900 mb-2">
                ¡Bienvenido!
              </Text>
              <Text className="text-base text-gray-500">
                Inicia sesión para continuar
              </Text>
            </View>

            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Email
              </Text>
              <TextInput
                className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base"
                placeholder="tu@email.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
              />
            </View>

            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </Text>
              <TextInput
                className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
              />
            </View>

            <TouchableOpacity 
              className="mb-6"
              onPress={() => Alert.alert('Recuperar contraseña', 'Funcionalidad próximamente')}
            >
              <Text className="text-primary text-right">
                ¿Olvidaste tu contraseña?
              </Text>
            </TouchableOpacity>

            <Button
              title="Iniciar Sesión"
              onPress={handleLogin}
              loading={loading}
            />

            {/* Separador */}
            <View className="flex-row items-center my-6">
              <View className="flex-1 h-px bg-gray-300" />
              <Text className="mx-4 text-gray-500">o continúa con</Text>
              <View className="flex-1 h-px bg-gray-300" />
            </View>

            {/* Botones sociales */}
            <View className="flex-row justify-center mb-6">
              {/* Google */}
              <TouchableOpacity
                onPress={handleGoogleLogin}
                disabled={googleLoading || loading}
                className="flex-1 flex-row items-center justify-center bg-white border border-gray-200 rounded-xl py-4 mr-2"
                style={{ opacity: googleLoading ? 0.7 : 1 }}
                activeOpacity={0.7}
              >
                {googleLoading ? (
                  <ActivityIndicator size="small" color="#4285F4" />
                ) : (
                  <>
                    <Ionicons name="logo-google" size={22} color="#4285F4" />
                    <Text className="ml-2 font-semibold text-gray-700">Google</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Apple */}
              <TouchableOpacity
                onPress={handleAppleLogin}
                disabled={appleLoading || loading}
                className="flex-1 flex-row items-center justify-center bg-black rounded-xl py-4 ml-2"
                style={{ opacity: appleLoading ? 0.7 : 1 }}
                activeOpacity={0.7}
              >
                {appleLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Ionicons name="logo-apple" size={22} color="white" />
                    <Text className="ml-2 font-semibold text-white">Apple</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View className="flex-row justify-center items-center">
              <Text className="text-gray-600">
                ¿No tienes cuenta?{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text className="text-primary font-semibold">
                  Regístrate
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              className="mt-4"
              onPress={() => navigation.navigate('MainTabs')}
            >
              <Text className="text-gray-500 text-center">
                Explorar sin cuenta →
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
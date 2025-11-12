import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/theme';
import { getUserLists, createList, addProductToList, FavoriteList } from '../../services/favoriteLists';

interface AddToListModalProps {
  visible: boolean;
  onClose: () => void;
  productId: string;
  userId: string;
}

export default function AddToListModal({ visible, onClose, productId, userId }: AddToListModalProps) {
  const [lists, setLists] = useState<FavoriteList[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingToList, setAddingToList] = useState<string | null>(null);

  useEffect(() => {
    if (visible && userId) {
      loadLists();
    }
  }, [visible, userId]);

  async function loadLists() {
    try {
      setLoading(true);
      const data = await getUserLists(userId);
      setLists(data);
    } catch (error) {
      console.error('Error loading lists:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddToList(listId: string, listName: string) {
    try {
      setAddingToList(listId);
      const success = await addProductToList(listId, productId);

      if (success) {
        Alert.alert('¡Listo!', `Producto agregado a "${listName}"`);
        onClose();
      } else {
        Alert.alert('Error', 'El producto ya está en esta lista o hubo un problema');
      }
    } catch (error) {
      console.error('Error adding to list:', error);
      Alert.alert('Error', 'No se pudo agregar el producto a la lista');
    } finally {
      setAddingToList(null);
    }
  }

  async function handleCreateList() {
    Alert.prompt(
      'Nueva lista',
      'Ingresa el nombre de la lista',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Crear y agregar',
          onPress: async (listName) => {
            if (listName && listName.trim()) {
              const newList = await createList(userId, listName.trim());
              if (newList) {
                await handleAddToList(newList.id, newList.name);
                loadLists();
              } else {
                Alert.alert('Error', 'No se pudo crear la lista');
              }
            }
          },
        },
      ],
      'plain-text'
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View className="bg-white rounded-t-[40px] shadow-lg" style={{ height: '75%' }}>
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 pt-6 pb-4">
            <Text className="text-xl font-bold text-gray-900">Agregar a lista</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Contenido */}
          <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
            {loading ? (
              <View className="py-20 items-center justify-center">
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            ) : (
              <>
                {/* Botón crear nueva lista */}
                <TouchableOpacity
                  onPress={handleCreateList}
                  className="mb-4"
                >
                  <LinearGradient
                    colors={['#2563EB', '#DC2626']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="rounded-xl py-4 px-4 flex-row items-center justify-center"
                  >
                    <Ionicons name="add-circle-outline" size={24} color="white" />
                    <Text className="text-white text-base font-semibold ml-2">
                      Crear nueva lista
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Lista de listas existentes */}
                {lists.length === 0 ? (
                  <View className="py-12 items-center">
                    <Text className="text-4xl mb-3">📋</Text>
                    <Text className="text-base text-gray-500 text-center">
                      No tienes listas todavía{'\n'}
                      Crea una para organizar tus productos
                    </Text>
                  </View>
                ) : (
                  <View className="mb-6">
                    <Text className="text-sm font-medium text-gray-500 mb-3 uppercase">
                      Mis listas
                    </Text>
                    {lists.map((list) => (
                      <TouchableOpacity
                        key={list.id}
                        onPress={() => handleAddToList(list.id, list.name)}
                        disabled={addingToList === list.id}
                        className="border border-gray-200 rounded-xl mb-3 overflow-hidden"
                      >
                        <View className="px-4 py-4 flex-row items-center justify-between">
                          <View className="flex-1">
                            <Text className="text-base font-medium text-gray-900">
                              {list.name}
                            </Text>
                            <Text className="text-sm text-gray-500 mt-1">
                              {list.product_count || 0} productos
                            </Text>
                          </View>
                          {addingToList === list.id ? (
                            <ActivityIndicator size="small" color={COLORS.primary} />
                          ) : (
                            <Ionicons name="add-circle" size={28} color={COLORS.primary} />
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

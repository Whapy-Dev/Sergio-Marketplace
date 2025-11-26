import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/theme';
import { getUserLists, createList, addProductToList, FavoriteList } from '../../services/favoriteLists';
import { scale, moderateScale, hp } from '../../utils/responsive';

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
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View style={{
          backgroundColor: '#FFF',
          borderTopLeftRadius: scale(40),
          borderTopRightRadius: scale(40),
          height: hp(75),
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 5,
        }}>
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: scale(20),
            paddingTop: scale(24),
            paddingBottom: scale(16),
          }}>
            <Text style={{ fontSize: moderateScale(20), fontWeight: 'bold', color: '#111827' }}>Agregar a lista</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={scale(28)} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Contenido */}
          <ScrollView style={{ flex: 1, paddingHorizontal: scale(20) }} showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={{ paddingVertical: scale(80), alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            ) : (
              <>
                {/* Botón crear nueva lista */}
                <TouchableOpacity
                  onPress={handleCreateList}
                  style={{ marginBottom: scale(16) }}
                >
                  <LinearGradient
                    colors={['#2563EB', '#DC2626']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      borderRadius: scale(12),
                      paddingVertical: scale(16),
                      paddingHorizontal: scale(16),
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="add-circle-outline" size={scale(24)} color="white" />
                    <Text style={{ color: '#FFF', fontSize: moderateScale(16), fontWeight: '600', marginLeft: scale(8) }}>
                      Crear nueva lista
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Lista de listas existentes */}
                {lists.length === 0 ? (
                  <View style={{ paddingVertical: scale(48), alignItems: 'center' }}>
                    <Text style={{ fontSize: scale(40), marginBottom: scale(12) }}>📋</Text>
                    <Text style={{ fontSize: moderateScale(16), color: '#6B7280', textAlign: 'center' }}>
                      No tienes listas todavía{'\n'}
                      Crea una para organizar tus productos
                    </Text>
                  </View>
                ) : (
                  <View style={{ marginBottom: scale(24) }}>
                    <Text style={{ fontSize: moderateScale(12), fontWeight: '500', color: '#6B7280', marginBottom: scale(12), textTransform: 'uppercase' }}>
                      Mis listas
                    </Text>
                    {lists.map((list) => (
                      <TouchableOpacity
                        key={list.id}
                        onPress={() => handleAddToList(list.id, list.name)}
                        disabled={addingToList === list.id}
                        style={{
                          borderWidth: 1,
                          borderColor: '#E5E7EB',
                          borderRadius: scale(12),
                          marginBottom: scale(12),
                          overflow: 'hidden',
                        }}
                      >
                        <View style={{
                          paddingHorizontal: scale(16),
                          paddingVertical: scale(16),
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: moderateScale(16), fontWeight: '500', color: '#111827' }}>
                              {list.name}
                            </Text>
                            <Text style={{ fontSize: moderateScale(14), color: '#6B7280', marginTop: scale(4) }}>
                              {list.product_count || 0} productos
                            </Text>
                          </View>
                          {addingToList === list.id ? (
                            <ActivityIndicator size="small" color={COLORS.primary} />
                          ) : (
                            <Ionicons name="add-circle" size={scale(28)} color={COLORS.primary} />
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

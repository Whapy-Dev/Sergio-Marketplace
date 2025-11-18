import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Banner } from '../types';

export default function Banners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    link_type: 'none' as 'product' | 'category' | 'store' | 'external' | 'none',
    link_value: '',
    display_order: 0,
    is_active: true,
    starts_at: '',
    ends_at: '',
  });

  useEffect(() => {
    loadBanners();
  }, []);

  async function loadBanners() {
    setLoading(true);
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .order('display_order', { ascending: true });

    if (!error && data) {
      setBanners(data);
    }
    setLoading(false);
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Debes seleccionar una imagen');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('banners')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('banners')
        .getPublicUrl(filePath);

      setFormData({ ...formData, image_url: urlData.publicUrl });
      alert('Imagen subida exitosamente!');
    } catch (error: any) {
      alert('Error al subir imagen: ' + error.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.title || !formData.image_url) {
      alert('Título e imagen son obligatorios');
      return;
    }

    try {
      if (editingBanner) {
        // Update existing banner
        const { error } = await supabase
          .from('banners')
          .update({
            title: formData.title,
            description: formData.description,
            image_url: formData.image_url,
            link_type: formData.link_type,
            link_value: formData.link_value || null,
            display_order: formData.display_order,
            is_active: formData.is_active,
            starts_at: formData.starts_at || null,
            ends_at: formData.ends_at || null,
          })
          .eq('id', editingBanner.id);

        if (error) throw error;
        alert('Banner actualizado!');
      } else {
        // Create new banner
        const { error } = await supabase
          .from('banners')
          .insert({
            title: formData.title,
            description: formData.description,
            image_url: formData.image_url,
            link_type: formData.link_type,
            link_value: formData.link_value || null,
            display_order: formData.display_order,
            is_active: formData.is_active,
            starts_at: formData.starts_at || null,
            ends_at: formData.ends_at || null,
          });

        if (error) throw error;
        alert('Banner creado!');
      }

      resetForm();
      loadBanners();
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  }

  function resetForm() {
    setFormData({
      title: '',
      description: '',
      image_url: '',
      link_type: 'none',
      link_value: '',
      display_order: 0,
      is_active: true,
      starts_at: '',
      ends_at: '',
    });
    setEditingBanner(null);
    setShowModal(false);
  }

  function handleEdit(banner: Banner) {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      description: banner.description || '',
      image_url: banner.image_url,
      link_type: banner.link_type,
      link_value: banner.link_value || '',
      display_order: banner.display_order,
      is_active: banner.is_active,
      starts_at: banner.starts_at || '',
      ends_at: banner.ends_at || '',
    });
    setShowModal(true);
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este banner?')) return;

    const { error } = await supabase.from('banners').delete().eq('id', id);

    if (!error) {
      alert('Banner eliminado');
      loadBanners();
    }
  }

  async function toggleActive(banner: Banner) {
    const { error } = await supabase
      .from('banners')
      .update({ is_active: !banner.is_active })
      .eq('id', banner.id);

    if (!error) {
      loadBanners();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando banners...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Banners</h1>
          <p className="mt-2 text-gray-600">Administra los banners del carrusel en la home</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition"
        >
          + Crear Banner
        </button>
      </div>

      {/* Banners List */}
      {banners.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">🎨</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay banners</h3>
          <p className="text-gray-600 mb-6">Crea tu primer banner para el carrusel de la home</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition"
          >
            Crear Primer Banner
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition"
            >
              <div className="flex gap-6">
                {/* Image Preview */}
                <div className="flex-shrink-0">
                  <img
                    src={banner.image_url}
                    alt={banner.title}
                    className="w-48 h-32 object-cover rounded-lg"
                  />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-gray-900">{banner.title}</h3>
                        <span className="text-sm text-gray-500">#{index + 1}</span>
                        {banner.is_active ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                            Activo
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded-full">
                            Inactivo
                          </span>
                        )}
                      </div>
                      {banner.description && (
                        <p className="text-sm text-gray-600 mt-1">{banner.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Tipo de enlace</p>
                      <p className="font-medium text-gray-900">{banner.link_type}</p>
                    </div>
                    {banner.link_value && (
                      <div>
                        <p className="text-gray-500">Valor del enlace</p>
                        <p className="font-medium text-gray-900 truncate">{banner.link_value}</p>
                      </div>
                    )}
                    {banner.starts_at && (
                      <div>
                        <p className="text-gray-500">Inicio</p>
                        <p className="font-medium text-gray-900">
                          {new Date(banner.starts_at).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {banner.ends_at && (
                      <div>
                        <p className="text-gray-500">Fin</p>
                        <p className="font-medium text-gray-900">
                          {new Date(banner.ends_at).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleEdit(banner)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => toggleActive(banner)}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
                      banner.is_active
                        ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {banner.is_active ? 'Desactivar' : 'Activar'}
                  </button>
                  <button
                    onClick={() => handleDelete(banner.id)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingBanner ? 'Editar Banner' : 'Crear Nuevo Banner'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows={3}
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Imagen * (Recomendado: 1200x400px)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  {uploading && <p className="text-sm text-gray-500 mt-2">Subiendo imagen...</p>}
                  {formData.image_url && (
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="mt-3 w-full h-32 object-cover rounded-lg"
                    />
                  )}
                </div>

                {/* Link Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Enlace
                  </label>
                  <select
                    value={formData.link_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        link_type: e.target.value as any,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="none">Sin enlace</option>
                    <option value="product">Producto</option>
                    <option value="category">Categoría</option>
                    <option value="store">Tienda Oficial</option>
                    <option value="external">URL Externa</option>
                  </select>
                </div>

                {/* Link Value */}
                {formData.link_type !== 'none' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {formData.link_type === 'product' && 'ID del Producto'}
                      {formData.link_type === 'category' && 'Nombre de la Categoría'}
                      {formData.link_type === 'store' && 'ID de la Tienda'}
                      {formData.link_type === 'external' && 'URL Externa'}
                    </label>
                    <input
                      type="text"
                      value={formData.link_value}
                      onChange={(e) => setFormData({ ...formData, link_value: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder={
                        formData.link_type === 'external'
                          ? 'https://example.com'
                          : 'ID o nombre'
                      }
                    />
                  </div>
                )}

                {/* Display Order */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Orden de Visualización
                  </label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) =>
                      setFormData({ ...formData, display_order: parseInt(e.target.value) })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Menor número = aparece primero
                  </p>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Inicio
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.starts_at}
                      onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Fin
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.ends_at}
                      onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Active */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label className="ml-2 text-sm text-gray-700">Banner activo</label>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={uploading || !formData.image_url}
                    className="flex-1 px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
                  >
                    {editingBanner ? 'Actualizar Banner' : 'Crear Banner'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold rounded-lg transition"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

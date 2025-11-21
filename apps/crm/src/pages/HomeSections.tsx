import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Section {
  id: string;
  name: string;
  slug: string;
  title: string;
  subtitle: string | null;
  display_order: number;
  is_active: boolean;
  layout_type: string;
  max_products: number;
}

interface SectionProduct {
  id: string;
  section_id: string;
  product_id: string;
  display_order: number;
  custom_label: string | null;
  custom_label_color: string;
  product?: {
    id: string;
    name: string;
    price: number;
    image_url: string;
    seller_name?: string;
  };
}

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string;
  seller_name?: string;
}

export default function HomeSections() {
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [sectionProducts, setSectionProducts] = useState<SectionProduct[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingSection, setEditingSection] = useState<Section | null>(null);

  useEffect(() => {
    loadSections();
    loadAllProducts();
  }, []);

  useEffect(() => {
    if (selectedSection) {
      loadSectionProducts(selectedSection.id);
    }
  }, [selectedSection]);

  async function loadSections() {
    const { data, error } = await supabase
      .from('home_sections')
      .select('*')
      .order('display_order', { ascending: true });

    if (!error && data) {
      setSections(data);
      if (data.length > 0 && !selectedSection) {
        setSelectedSection(data[0]);
      }
    }
    setLoading(false);
  }

  async function loadAllProducts() {
    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        price,
        image_url,
        sellers(store_name)
      `)
      .eq('status', 'active')
      .order('name');

    if (!error && data) {
      const formatted = data.map((p: any) => ({
        ...p,
        seller_name: p.sellers?.store_name || 'Sin tienda'
      }));
      setAvailableProducts(formatted);
    }
  }

  async function loadSectionProducts(sectionId: string) {
    const { data, error } = await supabase
      .from('home_section_products')
      .select(`
        *,
        products(id, name, price, image_url)
      `)
      .eq('section_id', sectionId)
      .order('display_order', { ascending: true });

    if (!error && data) {
      const formatted = data.map((sp: any) => ({
        ...sp,
        product: sp.products ? {
          ...sp.products,
          seller_name: ''
        } : undefined
      }));
      setSectionProducts(formatted);
    }
  }

  async function addProductToSection(productId: string) {
    if (!selectedSection) return;

    const maxOrder = sectionProducts.length > 0
      ? Math.max(...sectionProducts.map(p => p.display_order)) + 1
      : 1;

    const { error } = await supabase
      .from('home_section_products')
      .insert({
        section_id: selectedSection.id,
        product_id: productId,
        display_order: maxOrder
      });

    if (!error) {
      loadSectionProducts(selectedSection.id);
    }
  }

  async function removeProductFromSection(id: string) {
    const { error } = await supabase
      .from('home_section_products')
      .delete()
      .eq('id', id);

    if (!error && selectedSection) {
      loadSectionProducts(selectedSection.id);
    }
  }

  async function updateProductOrder(products: SectionProduct[]) {
    for (let i = 0; i < products.length; i++) {
      await supabase
        .from('home_section_products')
        .update({ display_order: i + 1 })
        .eq('id', products[i].id);
    }
    if (selectedSection) {
      loadSectionProducts(selectedSection.id);
    }
  }

  async function moveProduct(index: number, direction: 'up' | 'down') {
    const newOrder = [...sectionProducts];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newOrder.length) return;

    [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
    await updateProductOrder(newOrder);
  }

  async function updateProductLabel(id: string, label: string, color: string) {
    await supabase
      .from('home_section_products')
      .update({
        custom_label: label || null,
        custom_label_color: color
      })
      .eq('id', id);

    if (selectedSection) {
      loadSectionProducts(selectedSection.id);
    }
  }

  async function toggleSectionActive(section: Section) {
    const { error } = await supabase
      .from('home_sections')
      .update({ is_active: !section.is_active })
      .eq('id', section.id);

    if (!error) {
      loadSections();
    }
  }

  async function updateSection(section: Section) {
    const { error } = await supabase
      .from('home_sections')
      .update({
        title: section.title,
        subtitle: section.subtitle,
        max_products: section.max_products,
        layout_type: section.layout_type
      })
      .eq('id', section.id);

    if (!error) {
      loadSections();
      setEditingSection(null);
    }
  }

  async function moveSectionOrder(index: number, direction: 'up' | 'down') {
    const newOrder = [...sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newOrder.length) return;

    [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];

    for (let i = 0; i < newOrder.length; i++) {
      await supabase
        .from('home_sections')
        .update({ display_order: i + 1 })
        .eq('id', newOrder[i].id);
    }
    loadSections();
  }

  const productsInSection = sectionProducts.map(sp => sp.product_id);
  const filteredProducts = availableProducts.filter(p =>
    !productsInSection.includes(p.id) &&
    (p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     p.seller_name?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Secciones del Home</h1>
        <p className="mt-2 text-gray-600">
          Configura todas las secciones de productos que aparecen en la app
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sections List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-bold text-gray-900">Secciones</h2>
            </div>
            <div className="p-2">
              {sections.map((section, index) => (
                <div
                  key={section.id}
                  className={`p-3 rounded-lg cursor-pointer mb-1 ${
                    selectedSection?.id === section.id
                      ? 'bg-primary-50 border border-primary-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className="flex-1"
                      onClick={() => setSelectedSection(section)}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${section.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="font-medium text-sm">{section.name}</span>
                      </div>
                      <span className="text-xs text-gray-500 ml-4">
                        {sectionProducts.filter(sp => sp.section_id === section.id).length || 0} productos
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => moveSectionOrder(index, 'up')}
                        disabled={index === 0}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-xs"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => moveSectionOrder(index, 'down')}
                        disabled={index === sections.length - 1}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-xs"
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section Configuration */}
        {selectedSection && (
          <div className="lg:col-span-3">
            {/* Section Settings */}
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-gray-900">{selectedSection.name}</h2>
                  <p className="text-sm text-gray-500">Configuración de la sección</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingSection(selectedSection)}
                    className="text-primary-600 hover:text-primary-800 text-sm"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => toggleSectionActive(selectedSection)}
                    className={`px-3 py-1 rounded text-sm ${
                      selectedSection.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {selectedSection.is_active ? 'Activa' : 'Inactiva'}
                  </button>
                </div>
              </div>

              {editingSection?.id === selectedSection.id ? (
                <div className="p-4 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Título
                    </label>
                    <input
                      type="text"
                      value={editingSection.title}
                      onChange={(e) => setEditingSection({...editingSection, title: e.target.value})}
                      className="w-full border rounded px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subtítulo
                    </label>
                    <input
                      type="text"
                      value={editingSection.subtitle || ''}
                      onChange={(e) => setEditingSection({...editingSection, subtitle: e.target.value})}
                      className="w-full border rounded px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Layout
                    </label>
                    <select
                      value={editingSection.layout_type}
                      onChange={(e) => setEditingSection({...editingSection, layout_type: e.target.value})}
                      className="w-full border rounded px-3 py-2 text-sm"
                    >
                      <option value="horizontal">Horizontal</option>
                      <option value="vertical">Vertical</option>
                      <option value="grid">Grid</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Máx. productos
                    </label>
                    <input
                      type="number"
                      value={editingSection.max_products}
                      onChange={(e) => setEditingSection({...editingSection, max_products: parseInt(e.target.value)})}
                      className="w-full border rounded px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="col-span-2 flex justify-end gap-2">
                    <button
                      onClick={() => setEditingSection(null)}
                      className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => updateSection(editingSection)}
                      className="px-4 py-2 bg-primary-600 text-white rounded text-sm hover:bg-primary-700"
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Título:</span>
                    <p className="font-medium">{selectedSection.title}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Layout:</span>
                    <p className="font-medium capitalize">{selectedSection.layout_type}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Máx. productos:</span>
                    <p className="font-medium">{selectedSection.max_products}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Productos actuales:</span>
                    <p className="font-medium">{sectionProducts.length}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Products Management */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Products in Section */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-bold text-gray-900">
                    Productos en esta sección ({sectionProducts.length})
                  </h3>
                </div>
                <div className="p-4 max-h-[500px] overflow-y-auto">
                  {sectionProducts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No hay productos en esta sección
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sectionProducts.map((sp, index) => (
                        <div
                          key={sp.id}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border"
                        >
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => moveProduct(index, 'up')}
                              disabled={index === 0}
                              className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-xs"
                            >
                              ▲
                            </button>
                            <button
                              onClick={() => moveProduct(index, 'down')}
                              disabled={index === sectionProducts.length - 1}
                              className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-xs"
                            >
                              ▼
                            </button>
                          </div>

                          <span className="text-sm font-bold text-primary-600 w-6">
                            #{index + 1}
                          </span>

                          <img
                            src={sp.product?.image_url || 'https://via.placeholder.com/40'}
                            alt=""
                            className="w-10 h-10 object-cover rounded"
                          />

                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate text-sm">
                              {sp.product?.name}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <input
                                type="text"
                                placeholder="Etiqueta"
                                value={sp.custom_label || ''}
                                onChange={(e) => updateProductLabel(sp.id, e.target.value, sp.custom_label_color)}
                                className="w-20 text-xs border rounded px-2 py-1"
                              />
                              <input
                                type="color"
                                value={sp.custom_label_color}
                                onChange={(e) => updateProductLabel(sp.id, sp.custom_label || '', e.target.value)}
                                className="w-6 h-6 rounded cursor-pointer"
                              />
                            </div>
                          </div>

                          <button
                            onClick={() => removeProductFromSection(sp.id)}
                            className="text-red-600 hover:text-red-800 p-1"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Available Products */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-bold text-gray-900">
                    Agregar productos
                  </h3>
                  <input
                    type="text"
                    placeholder="Buscar producto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="mt-2 w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
                <div className="p-4 max-h-[500px] overflow-y-auto">
                  {filteredProducts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No hay productos disponibles
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredProducts.slice(0, 20).map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded border"
                        >
                          <img
                            src={product.image_url || 'https://via.placeholder.com/40'}
                            alt=""
                            className="w-8 h-8 object-cover rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate text-sm">
                              {product.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              ${product.price.toLocaleString()}
                            </p>
                          </div>
                          <button
                            onClick={() => addProductToSection(product.id)}
                            className="bg-primary-600 text-white px-2 py-1 rounded text-xs hover:bg-primary-700"
                          >
                            +
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

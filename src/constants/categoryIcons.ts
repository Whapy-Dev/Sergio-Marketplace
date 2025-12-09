// Mapeo de iconos 3D para categorías
// Los iconos PNG deben estar en assets/categories/

// Configuración de iconos con tamaños personalizados
interface CategoryIconConfig {
  source: any;
  size: number; // Tamaño del icono (ancho y alto)
}

// Importar todos los iconos 3D disponibles con sus tamaños óptimos
export const CATEGORY_3D_ICONS: { [key: string]: CategoryIconConfig } = {
  // Iconos 3D originales del Figma (más grandes)
  ofertas: { source: require('../../assets/categories/ofertas.png'), size: 50 },
  supermercado: { source: require('../../assets/categories/supermercado.png'), size: 50 },
  celulares: { source: require('../../assets/categories/celulares.png'), size: 50 },
  'ver-mas': { source: require('../../assets/categories/ver-mas.png'), size: 44 },

  // Nuevos iconos 3D (ajustar tamaño para que se vean igual)
  moda: { source: require('../../assets/categories/moda.png'), size: 46 },
  hogar: { source: require('../../assets/categories/hogar.png'), size: 48 },
  tecnologia: { source: require('../../assets/categories/tecnologia.png'), size: 52 },
  deportes: { source: require('../../assets/categories/deportes.png'), size: 50 },

  // Agregar más iconos aquí cuando estén disponibles:
  // belleza: { source: require('../../assets/categories/belleza.png'), size: 48 },
  // juguetes: { source: require('../../assets/categories/juguetes.png'), size: 48 },
  // mascotas: { source: require('../../assets/categories/mascotas.png'), size: 48 },
  // libros: { source: require('../../assets/categories/libros.png'), size: 48 },
};

// Mapeo de nombres de categoría a claves de iconos
// Esto permite que diferentes nombres de categoría usen el mismo icono
export const CATEGORY_NAME_TO_ICON: { [key: string]: string } = {
  // Ofertas y descuentos
  'ofertas': 'ofertas',
  'descuentos': 'ofertas',
  'promociones': 'ofertas',

  // Supermercado y alimentos
  'supermercado': 'supermercado',
  'alimentos': 'supermercado',
  'bebidas': 'supermercado',
  'comestibles': 'supermercado',

  // Celulares y electrónica
  'celulares': 'celulares',
  'telefonos': 'celulares',
  'smartphones': 'celulares',
  'electronica': 'celulares',
  'tecnologia': 'celulares',

  // Moda y ropa
  'moda': 'moda',
  'ropa': 'moda',
  'vestimenta': 'moda',
  'indumentaria': 'moda',

  // Hogar
  'hogar': 'hogar',
  'muebles': 'hogar',
  'decoracion': 'hogar',

  // Belleza
  'belleza': 'belleza',
  'cosmeticos': 'belleza',
  'cuidado personal': 'belleza',

  // Deportes
  'deportes': 'deportes',
  'fitness': 'deportes',
  'ejercicio': 'deportes',

  // Juguetes
  'juguetes': 'juguetes',
  'juegos': 'juguetes',
  'niños': 'juguetes',

  // Mascotas
  'mascotas': 'mascotas',
  'pets': 'mascotas',
  'animales': 'mascotas',
};

// Función helper para obtener el icono 3D de una categoría
export function getCategoryIcon(categoryName: string): any | null {
  const normalizedName = categoryName.toLowerCase().trim();
  const iconKey = CATEGORY_NAME_TO_ICON[normalizedName];

  if (iconKey && CATEGORY_3D_ICONS[iconKey]) {
    return CATEGORY_3D_ICONS[iconKey];
  }

  // Intentar búsqueda parcial
  for (const [key, value] of Object.entries(CATEGORY_NAME_TO_ICON)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      if (CATEGORY_3D_ICONS[value]) {
        return CATEGORY_3D_ICONS[value];
      }
    }
  }

  return null;
}

// Iconicons de respaldo para categorías sin icono 3D
export const FALLBACK_IONICONS: { [key: string]: string } = {
  'moda': 'shirt-outline',
  'ropa': 'shirt-outline',
  'hogar': 'home-outline',
  'muebles': 'bed-outline',
  'belleza': 'sparkles-outline',
  'cosmeticos': 'sparkles-outline',
  'deportes': 'football-outline',
  'fitness': 'barbell-outline',
  'juguetes': 'game-controller-outline',
  'mascotas': 'paw-outline',
  'libros': 'book-outline',
  'herramientas': 'hammer-outline',
  'automotriz': 'car-outline',
  'vehiculos': 'car-outline',
  'electrodomesticos': 'tv-outline',
  'jardin': 'leaf-outline',
  'salud': 'medkit-outline',
  'oficina': 'briefcase-outline',
  'default': 'grid-outline',
};

export function getFallbackIonicon(categoryName: string): string {
  const normalizedName = categoryName.toLowerCase().trim();

  // Búsqueda exacta
  if (FALLBACK_IONICONS[normalizedName]) {
    return FALLBACK_IONICONS[normalizedName];
  }

  // Búsqueda parcial
  for (const [key, value] of Object.entries(FALLBACK_IONICONS)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return value;
    }
  }

  return FALLBACK_IONICONS['default'];
}

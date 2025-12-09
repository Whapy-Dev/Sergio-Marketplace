# Iconos 3D de Categorías

## Iconos actuales disponibles:
- `ofertas.png` - Etiqueta de descuento amarilla
- `supermercado.png` - Carrito de compras con productos
- `celulares.png` - Teléfono celular con mensajes
- `ver-mas.png` - Símbolo más morado

## Iconos faltantes a descargar:

Descarga iconos 3D del mismo estilo desde estos sitios gratuitos:

### Sitios recomendados:
1. **Flaticon** - https://www.flaticon.com/free-icons/3d
2. **Icons8** - https://icons8.com/icons/set/3d
3. **Vecteezy** - https://www.vecteezy.com/free-png/3d-icons
4. **Freepik** - https://www.freepik.com/free-photos-vectors/3d-icon

### Iconos necesarios (guardar como PNG 512x512 con fondo transparente):

| Archivo | Categoría | Buscar en sitios |
|---------|-----------|------------------|
| `moda.png` | Moda/Ropa | "3D shirt icon", "3D fashion icon", "3D clothing icon" |
| `hogar.png` | Hogar/Muebles | "3D home icon", "3D furniture icon", "3D sofa icon" |
| `tecnologia.png` | Tecnología | "3D laptop icon", "3D computer icon", "3D tech icon" |
| `belleza.png` | Belleza/Cosméticos | "3D makeup icon", "3D beauty icon", "3D lipstick icon" |
| `deportes.png` | Deportes | "3D sports icon", "3D soccer ball icon", "3D fitness icon" |
| `juguetes.png` | Juguetes | "3D toys icon", "3D teddy bear icon", "3D game icon" |
| `mascotas.png` | Mascotas | "3D pet icon", "3D dog icon", "3D paw icon" |
| `libros.png` | Libros | "3D book icon", "3D education icon" |
| `herramientas.png` | Herramientas | "3D tools icon", "3D wrench icon", "3D hammer icon" |
| `automotriz.png` | Automotriz | "3D car icon", "3D vehicle icon" |
| `electrodomesticos.png` | Electrodomésticos | "3D appliance icon", "3D washing machine icon" |
| `jardin.png` | Jardín | "3D plant icon", "3D garden icon" |

### Después de descargar:
1. Guarda los archivos PNG en esta carpeta (`assets/categories/`)
2. Abre `src/constants/categoryIcons.ts`
3. Descomenta las líneas correspondientes en `CATEGORY_3D_ICONS`

Ejemplo:
```typescript
// Cambiar de:
// moda: require('../../assets/categories/moda.png'),

// A:
moda: require('../../assets/categories/moda.png'),
```

Los iconos se aplicarán automáticamente a las categorías que coincidan por nombre.

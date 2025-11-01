Yo Compro Formosa - Mobile App

Aplicación móvil de Yo Compro local construida con React Native, Expo y Supabase.

## 📋 **Requisitos Previos**

- Node.js 18+ 
- npm o yarn
- Expo CLI
- iOS Simulator (Mac) o Android Studio
- Cuenta en Expo (para builds)

## 🚀 **Instalación**

### 1. Clonar el repositorio
```bash
git clone https://github.com/Whapy-Dev/Sergio-Yo Compro.git
cd Sergio-Yo Compro/apps/mobile
```

### 2. Instalar dependencias

**IMPORTANTE:** Usar flag `--legacy-peer-deps` por compatibilidad de versiones:
```bash
npm install --legacy-peer-deps
```

### 3. Configurar variables de entorno

Crea el archivo `.env` en la raíz de `apps/mobile/`:
```env
EXPO_PUBLIC_SUPABASE_URL=tu_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

### 4. Iniciar el proyecto
```bash
npx expo start
```

Luego presiona:
- `i` para iOS
- `a` para Android
- `w` para Web

## 📱 **Desarrollo Local**

### Limpiar caché (si hay problemas)
```bash
npx expo start --clear
```

### Reinstalar dependencias
```bash
rm -rf node_modules
npm install --legacy-peer-deps
npx expo start --clear
```

## 🏗️ **Builds para Producción**

### Configurar EAS (primera vez)
```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login
eas login

# Configurar proyecto
eas init
```

### Crear Build Android (APK de prueba)
```bash
eas build --platform android --profile preview
```

### Crear Build Android (para Google Play)
```bash
eas build --platform android --profile production
```

### Crear Build iOS
```bash
eas build --platform ios --profile production
```

**Nota:** iOS requiere Apple Developer Account ($99/año)

## 📦 **Dependencias Principales**
```json
{
  "expo": "~54.0.19",
  "react": "19.1.0",
  "react-native": "0.81.5",
  "nativewind": "^2.0.11",
  "tailwindcss": "3.3.2",
  "@supabase/supabase-js": "^2.76.0",
  "@react-navigation/native": "^7.1.18",
  "@react-navigation/bottom-tabs": "^7.4.9",
  "@react-navigation/native-stack": "^7.3.28"
}
```

## ⚙️ **Configuración Importante**

### babel.config.js
```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['nativewind/babel'],
  };
};
```

### .npmrc
```
legacy-peer-deps=true
```

### tailwind.config.js
```javascript
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563EB',
          // ... más colores
        },
      },
    },
  },
  plugins: [],
};
```

## 🔧 **Solución de Problemas**

### Error: "Use process(css).then(cb) to work with async plugins"

**Solución:** Asegurarse de usar TailwindCSS 3.3.2 exactamente:
```bash
rm -rf node_modules
# Verificar que package.json tenga "tailwindcss": "3.3.2"
npm install --legacy-peer-deps
npx expo start --clear
```

### Error: "ERESOLVE unable to resolve dependency tree"

**Solución:** Siempre usar `--legacy-peer-deps`:
```bash
npm install --legacy-peer-deps
```

### Build falla en EAS

**Solución:** Asegurarse de tener `.npmrc` con:
```
legacy-peer-deps=true
```

## 📂 **Estructura del Proyecto**
```
apps/mobile/
├── src/
│   ├── components/      # Componentes reutilizables
│   ├── contexts/        # Context API (Auth, Cart, Favorites)
│   ├── hooks/           # Custom hooks
│   ├── navigation/      # Configuración de navegación
│   ├── screens/         # Pantallas de la app
│   ├── services/        # Servicios (Supabase, API calls)
│   └── constants/       # Constantes y temas
├── assets/              # Imágenes, iconos, fonts
├── App.tsx             # Punto de entrada
├── app.json            # Configuración de Expo
├── eas.json            # Configuración de EAS Build
├── babel.config.js     # Configuración de Babel
├── tailwind.config.js  # Configuración de TailwindCSS
└── .npmrc              # Configuración de npm
```

## 🎨 **Características**

- ✅ Autenticación con Supabase
- ✅ Carrito de compras
- ✅ Sistema de favoritos
- ✅ Búsqueda de productos
- ✅ Gestión de pedidos
- ✅ Dashboard de vendedor
- ✅ Perfil de usuario
- ✅ Navegación con tabs y stack
- ✅ Diseño con NativeWind (TailwindCSS)

## 🔐 **Variables de Entorno Requeridas**
```env
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

## 📱 **Plataformas Soportadas**

- ✅ iOS 13+
- ✅ Android 6.0+ (API 23+)
- ⚠️ Web (limitado)

## 👨‍💻 **Desarrollo**

### Comandos útiles
```bash
# Iniciar con caché limpia
npx expo start --clear

# Ver en iOS
npx expo start --ios

# Ver en Android
npx expo start --android

# Actualizar dependencias de Expo
npx expo install --fix

# Guía para Generar AAB y Subir a Google Play

Esta guía te ayudará a generar el archivo AAB (Android App Bundle) y subirlo a Google Play Console.

## Prerrequisitos

1. **Instalar EAS CLI** (si no lo tienes):
```bash
npm install -g eas-cli
```

2. **Iniciar sesión en Expo**:
```bash
eas login
```

3. **Configurar el proyecto** (si es la primera vez):
```bash
eas build:configure
```

## Paso 1: Generar el AAB

### Opción A: Generar AAB para Google Play (Recomendado)
```bash
npm run build:android:aab
```

O directamente:
```bash
eas build --platform android --profile production
```

### Opción B: Generar APK para pruebas
```bash
npm run build:android:apk
```

## Paso 2: Esperar la Compilación

- EAS Build compilará tu aplicación en la nube
- Recibirás un enlace para descargar el AAB cuando esté listo
- El proceso puede tardar entre 10-30 minutos

## Paso 3: Configurar Google Play Console

### 3.1 Crear una aplicación en Google Play Console

1. Ve a [Google Play Console](https://play.google.com/console)
2. Crea una nueva aplicación
3. Completa toda la información requerida:
   - Nombre de la aplicación: **Yo Compro Formosa**
   - Idioma predeterminado: Español
   - Categoría: Compras
   - Información de contacto

### 3.2 Crear una cuenta de servicio (para submit automático)

1. Ve a **Configuración** > **Acceso a la API**
2. Vincula tu proyecto de Google Cloud
3. Crea una cuenta de servicio
4. Otorga los permisos necesarios
5. Descarga la clave JSON
6. Guarda el archivo como `google-play-key.json` en la raíz del proyecto

**IMPORTANTE**: Añade `google-play-key.json` al `.gitignore` para no subir las credenciales al repositorio.

## Paso 4: Preparar los Assets para Google Play

Necesitarás preparar:

### Capturas de pantalla
- **Teléfono**: Mínimo 2 capturas (1080 x 1920px o similar)
- **Tablet de 7"**: Mínimo 2 capturas (opcional)
- **Tablet de 10"**: Mínimo 2 capturas (opcional)

### Gráficos
- **Icono de la aplicación**: 512 x 512px (PNG)
- **Gráfico destacado**: 1024 x 500px (PNG o JPEG)

### Textos
- **Descripción breve**: Máximo 80 caracteres
- **Descripción completa**: Máximo 4000 caracteres

## Paso 5: Subir a Google Play

### Opción A: Subir manualmente

1. Descarga el AAB desde el enlace de EAS Build
2. Ve a Google Play Console
3. Ve a **Producción** > **Crear nueva versión**
4. Sube el archivo AAB
5. Completa las notas de la versión
6. Revisa y publica

### Opción B: Subir automáticamente con EAS Submit

```bash
npm run submit:android
```

O directamente:
```bash
eas submit --platform android --profile production
```

Esto subirá automáticamente el último AAB a Google Play en el track "internal".

## Paso 6: Configurar la Ficha de la Tienda

1. Completa toda la información de la aplicación
2. Añade las capturas de pantalla
3. Configura la clasificación de contenido
4. Completa el cuestionario de privacidad de datos
5. Configura la política de privacidad (URL requerida)

## Paso 7: Pruebas Internas/Cerradas (Recomendado)

Antes de publicar en producción:

1. Crea una versión de **prueba interna**
2. Añade usuarios de prueba (emails)
3. Sube el AAB al track interno
4. Prueba la aplicación con usuarios reales
5. Corrige errores si es necesario

## Paso 8: Enviar a Revisión

1. Una vez todo esté completo, envía la aplicación a revisión
2. Google revisará tu aplicación (puede tardar 1-7 días)
3. Recibirás notificaciones sobre el estado de la revisión

## Scripts Disponibles

- `npm run build:android:aab` - Genera AAB para producción
- `npm run build:android:apk` - Genera APK para pruebas
- `npm run submit:android` - Sube el AAB a Google Play automáticamente

## Notas Importantes

- **versionCode**: Se incrementa automáticamente con cada build
- **version**: Se define en `app.json` (actualmente 1.0.0)
- **package name**: `com.Yo Compro.formosa`
- El keystore se gestiona automáticamente por EAS Build

## Solución de Problemas

### Error: "No se puede iniciar sesión en EAS"
```bash
eas logout
eas login
```

### Error: "Build failed"
- Revisa los logs en el dashboard de Expo
- Verifica que todas las dependencias estén instaladas
- Asegúrate de que el código compile localmente

### Error al subir a Google Play
- Verifica que el `versionCode` sea mayor que la versión anterior
- Asegúrate de que el `google-play-key.json` tenga los permisos correctos
- Revisa que el package name coincida con el de Google Play Console

## Recursos Útiles

- [Expo EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Google Play Console](https://play.google.com/console)
- [Google Play App Bundle](https://developer.android.com/guide/app-bundle)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)

## Información del Proyecto

- **Nombre**: Yo Compro Formosa
- **Package**: com.Yo Compro.formosa
- **EAS Project ID**: e42498d5-d3c7-4317-a07f-17f6becb49ba
- **Owner**: javieralmada

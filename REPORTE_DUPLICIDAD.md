# Informe de Análisis de Duplicidad y Reusabilidad

Este informe detalla las áreas de duplicidad de código encontradas en el proyecto `Portal de Intercambio Hortelano` y ofrece recomendaciones para mejorar la mantenibilidad y reusabilidad del código.

## 1. Duplicidad en Modelos de Datos (Types/Interfaces)

Se ha identificado una duplicación significativa entre las definiciones de tipos del Frontend y las Cloud Functions. Esto es riesgoso porque una discrepancia puede causar errores en tiempo de ejecución.

*   **Ubicaciones:**
    *   `frontend/src/types/user.ts` y `frontend/src/types/exchange.ts`
    *   `functions/src/index.ts`

*   **Hallazgos Específicos:**
    *   **Inconsistencia Crítica:** La propiedad `level` en `UserData` se define como `number` en el Frontend pero como `string` ("Seed", "Sprout", etc.) en el Backend. Esto causará errores si el frontend intenta tratar el nivel como un número.
    *   **Review Interface:** La interfaz `Review` tiene campos diferentes en ambos lados (`reviewerName` solo en frontend, `reviewedUserId` solo en backend).
    *   **Redundancia:** `ExchangeData` y `UserData` están redefinidos completamente en el archivo `index.ts` de las funciones.

*   **Recomendación:**
    *   Crear una librería compartida de tipos (si se usa un monorepo real) o, al menos, asegurar que `functions` importe los tipos desde una fuente común si la estructura de despliegue lo permite.
    *   Si no es posible compartir archivos directamente por restricciones de despliegue de Firebase, se recomienda establecer un script de "build" que copie los tipos de una fuente central a ambos directorios antes del despliegue.

## 2. Duplicidad e Inconsistencia en Lógica de Negocio

Existe lógica de negocio implementada directamente en componentes de la UI que ya existe en los servicios o hooks, lo que lleva a comportamientos inconsistentes.

*   **Caso Crítico: Borrado de Productos**
    *   **Ubicación 1:** `frontend/src/app/[locale]/my-garden/page.tsx` implementa un **borrado duro** (`deleteDoc`) y elimina manualmente las imágenes de Storage.
    *   **Ubicación 2:** `frontend/src/services/product.service.ts` implementa un **borrado suave** (`updateDoc` con `deleted: true`).
    *   **Impacto:** Los productos borrados desde "Mi Jardín" desaparecen permanentemente, mientras que el resto de la aplicación espera un borrado lógico. Esto viola el estándar del proyecto.

*   **Caso: Obtención de Productos del Usuario**
    *   `MyGardenPage` re-implementa la lógica de `query` y `onSnapshot` para obtener los productos del usuario actual.
    *   Esta lógica ya existe en `ProductService.getProductsByUserId`.

*   **Recomendación:**
    *   Refactorizar `MyGardenPage` para usar `useProducts` (con un filtro de usuario) o llamar directamente a `ProductService`.
    *   Usar exclusivamente el método de borrado del servicio para garantizar consistencia (Soft Delete).

## 3. Lógica de UI y Constantes Dispersas

*   **Colores de Categorías:**
    *   En `frontend/src/components/shared/ProductCard.tsx`, hay una función `getCategoryColor` con valores hexadecimales harcodeados.
    *   Existe un archivo `frontend/src/lib/categories.ts`, pero solo contiene IDs e iconos.
    *   **Recomendación:** Mover los colores al archivo `categories.ts` o a la configuración de Tailwind (`globals.css` / theme) para asegurar que las etiquetas de categoría siempre tengan el mismo color en toda la app.

*   **Formato de Fechas:**
    *   La lógica de "hace X tiempo" (`getTimeAgo`) está dentro de `ProductCard.tsx`. Debería moverse a `frontend/src/lib/utils.ts` para ser reusable en otras partes (ej. comentarios, notificaciones).

## 4. Lógica Compartida Backend-Frontend

*   **Cálculo de Niveles:**
    *   La función `calculateLevel` (puntos -> nombre de nivel) vive solo en `functions/src/index.ts`.
    *   Si el frontend quisiera mostrar una barra de progreso ("Te faltan 10 puntos para ser Master Grower"), tendría que duplicar esta lógica.
    *   **Recomendación:** Extraer esta lógica pura a un archivo de utilidad compartido (`frontend/src/lib/gamification.ts`) y replicarlo o compartirlo con el backend.

## Resumen de Acciones Recomendadas

1.  **Corregir la discrepancia de tipos** para `level` (decidir si es `string` o `number` y unificar).
2.  **Refactorizar `MyGardenPage`** para eliminar la lógica de base de datos directa y usar `ProductService`.
3.  **Centralizar colores** de categorías en `categories.ts`.
4.  **Extraer utilidades** de fecha de los componentes visuales.

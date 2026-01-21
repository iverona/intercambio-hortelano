# Informe de Auditoría de Seguridad - Portal de Intercambio Hortelano

**Fecha:** 24 de Octubre de 2023
**Analista:** Jules (AI Assistant)
**Alcance:** Reglas de base de datos (Firestore), Almacenamiento, Cloud Functions y Configuración Frontend.

## 1. Resumen Ejecutivo
La aplicación presenta una arquitectura moderna basada en Firebase y Next.js. Si bien utiliza buenas prácticas generales (como el uso de variables de entorno y autenticación segura), se han identificado **fallos críticos en las reglas de acceso a la base de datos** que permiten la manipulación de la reputación de los usuarios y la exposición de datos privados (notificaciones e historial de intercambios) a otros usuarios registrados.

A continuación, se detallan los hallazgos clasificados por severidad.

---

## 2. Hallazgos Críticos (Prioridad Inmediata)

### 2.1. Manipulación de Reputación y Puntos
**Ubicación:** `firestore.rules` (Colección `/users`)

**El Problema:**
Existe una regla específica que permite a *cualquier usuario autenticado* modificar los campos `reputation`, `points`, `level` y `badges` de *cualquier otro usuario*.

```javascript
// REGLA ACTUAL INSEGURA:
(request.auth.uid != userId &&
 request.resource.data.diff(resource.data).affectedKeys().hasOnly(['reputation', 'points', 'level', 'badges']))
```

Aunque la intención parece ser permitir que el sistema actualice estos datos, en Firebase las reglas de seguridad gobiernan el acceso desde el **cliente** (navegador/móvil). Esto significa que un usuario malintencionado podría enviar una petición directa a la base de datos para:
*   Darse a sí mismo el nivel máximo ("Master Grower").
*   Reiniciar los puntos de otros usuarios a 0.

**Solución Recomendada:**
Eliminar esta excepción. La actualización de la reputación ya está gestionada de forma segura por la Cloud Function `updateUserReputation`, la cual opera con permisos de administrador (Backend) y no necesita que las reglas del cliente estén abiertas.

---

## 3. Hallazgos de Riesgo Alto/Medio (Privacidad)

### 3.1. Exposición de Notificaciones Privadas
**Ubicación:** `firestore.rules` (Colección `/notifications`)

**El Problema:**
La regla `allow read: if request.auth != null;` permite que cualquier usuario registrado lea *cualquier* notificación si conoce o adivina su ID. Aunque la interfaz gráfica solo muestre las propias, la base de datos permite leer las de otros.

**Solución Recomendada:**
Restringir la lectura solo al destinatario del mensaje.
```javascript
allow read: if request.auth != null && resource.data.recipientId == request.auth.uid;
```

### 3.2. Exposición de Detalles de Intercambios
**Ubicación:** `firestore.rules` (Colección `/exchanges`)

**El Problema:**
Similar a las notificaciones, `allow read: if request.auth != null;` permite leer los detalles de cualquier intercambio. Esto podría exponer mensajes privados, ubicaciones o acuerdos entre otros usuarios.

**Solución Recomendada:**
Limitar la lectura solo a las partes involucradas (el solicitante y el dueño del producto).
```javascript
allow read: if request.auth != null &&
  (resource.data.requesterId == request.auth.uid || resource.data.ownerId == request.auth.uid);
```

---

## 4. Hallazgos Informativos y Mejoras

### 4.1. Cabeceras de Seguridad HTTP (Security Headers)
**Ubicación:** `frontend/next.config.ts`

**Observación:**
No se están configurando cabeceras de seguridad estrictas. Aunque Next.js es seguro por defecto, se recomienda añadir cabeceras como `X-Content-Type-Options`, `X-Frame-Options` y políticas de seguridad de contenido (CSP) para prevenir ataques de tipo XSS o Clickjacking avanzados.

### 4.2. Eficiencia de la Cloud Function de Reputación
**Ubicación:** `functions/src/index.ts` (`updateUserReputation`)

**Observación:**
La función recalcula la reputación leyendo **todos** los intercambios completados (`exchangesSnapshot.forEach...`).
*   **Riesgo:** A medida que la plataforma crezca, esta función se volverá lenta y costosa (costes de lectura de Firestore).
*   **Recomendación:** Implementar un sistema incremental (sumar solo la nueva valoración al total actual) en lugar de recalcular todo el historial cada vez.

### 4.3. Exposición de Datos de Usuarios
**Ubicación:** `firestore.rules` (Colección `/users`)

**Observación:**
Actualmente `allow read: if true;` permite que cualquiera (incluso no registrados) lea los perfiles de usuario. Si los perfiles contienen email o teléfono, esto es un riesgo de privacidad. Si solo contienen nombre y avatar, es aceptable, pero se aconseja revisar qué datos se guardan en esos documentos.

---

## Conclusión
La plataforma es funcional pero requiere un "sellado" de las reglas de Firestore antes de operar con usuarios reales para evitar abusos del sistema de gamificación y fugas de privacidad.

**Siguientes pasos sugeridos:**
1.  Aplicar las correcciones en `firestore.rules` (puntos 2.1, 3.1 y 3.2).
2.  Desplegar las nuevas reglas.
3.  (Opcional) Optimizar la Cloud Function de reputación.

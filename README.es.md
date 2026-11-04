# Mainichi Hub 毎日日本語

Un hub de estudio local-first para aprender japonés. Reúne todas las plataformas de aprendizaje en
un panel, se mantiene actualizado solo y envía un plan diario como notificación push.

Es una muestra de ingeniería: monorepo tipado, núcleo de dominio puro, adaptadores intercambiables,
sincronización entre dispositivos sin conflictos y ningún servidor que mantener.

[English](README.md) · [Arquitectura](docs/architecture.md) · [Configuración](docs/setup.md) ·
[Integraciones](docs/integrations.md)

## Qué hace

- **Panel diario** que une lo pendiente en WaniKani, Anki, kana y tarjetas.
- **Hub de recursos** con cada plataforma en un lugar: enlaces directos, registro de tiempo con un
  clic y seguimiento de avance.
- **Lecciones desde cero**: 27 lecciones interactivas (escritura, kana, saludos, números, hora,
  fechas y primeras oraciones) que se adaptan a lo que ya sabes, con repaso mixto.
- **Reto de escritura**: dibujas un kana de memoria y el sistema reconoce la forma y te dice cuánto
  se parece al correcto, sin servidores ni modelos externos.
- **Herramientas de práctica**: entrenador de kana, tarjetas con repetición espaciada, diario de
  oraciones y temporizadores de rutina.
- **Biblioteca de escucha**: podcasts, anime, canciones, películas y noticias con sesiones guiadas
  que registran tu tiempo y convierten lo que oyes en tarjetas.
- **Exámenes estilo MEXT**: 48 preguntas originales con el formato oficial (secciones, puntajes y
  100 minutos), resultados por nivel y registro de exámenes oficiales.
- **Guía integrada** con lista de configuración en vivo, y nueve paletas en modo claro y oscuro, cada una con cuatro colores por categoría.
- **Sincronización automática** cada hora con GitHub Actions, sin servidor.
- **Alertas push**: un plan cada mañana y, solo si no has estudiado, un recordatorio cada noche.
- **Funciona sin conexión** como PWA instalable, y sincroniza entre dispositivos sin perder cambios.

Abre la aplicación con `?demo` para explorarla con datos ficticios.

## Cómo empezar

Requiere Node 22 o superior.

```bash
npm install
npm run dev
```

Para conectar tu repositorio de datos y las alertas, sigue [docs/setup.md](docs/setup.md).

La arquitectura y las decisiones de ingeniería están en el [README en inglés](README.md) y en
[docs/adr](docs/adr).

## Licencia

[MIT](LICENSE)

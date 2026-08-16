# Harmonic Beacon — Guía de marca (para presentaciones)

> Documento para que cualquiera (o cualquier Claude) pueda armar una presentación,
> deck, pieza o página **con la estética idéntica** a la web harmonicbeacon.com.
> Sistema de marca: **negro cálido + oro** ("warm-black / gold"), nácar como matiz claro.
> Fuente de verdad en código: `assets/hb-brand.css` (tokens) y `assets/hb-main.js` (símbolo + chrome).

---

## 1. Esencia y tono

- **Concepto:** bienestar armónico, escucha situada, presencia. Investigación seria (HIT)
  vestida de experiencia sensorial y elegante. Místico pero sobrio; nunca esotérico-barato.
- **Sensación:** templo cálido a media luz, oro viejo, papel, resonancia. Lujo silencioso.
- **NO es:** neón, "frecuencias mágicas", wellness genérico, claims clínicos, azul-acero corporativo.
- **Palabras clave de diseño:** consonancia, proporción, calidez, hueso/oro, espacio, quietud.

---

## 2. Paleta de color (exacta)

### Fondos — negro cálido
| Token | HEX | Uso |
|---|---|---|
| `--bg-0` | `#16120D` | Fondo base (el más oscuro) |
| `--bg-1` | `#1E1812` | Fondo secundario / degradé |
| `--bg-2` | `#241D15` | Realces de fondo |
| `--bg-card` | `#1B150F` | Tarjetas |

### Texto — tinta clara / hueso
| Token | HEX | Uso |
|---|---|---|
| `--bone` | `#F4EEE2` | Títulos, texto fuerte |
| `--ink-800` | `#E9E0D0` | Texto principal |
| `--ink-600` | `#ADA089` | Texto secundario / párrafos suaves |
| `--ink-500` | `#8A7F6B` | Texto terciario, notas |
| `--pearl-400` | `#6E5E44` | Detalles tenues, separadores |

### Oro — acento (un solo acento, usar con moderación)
| Token | HEX | Uso |
|---|---|---|
| `--gold` | `#C9A24E` | Acento principal, símbolo, activos |
| `--gold-2` | `#E3C77E` | Brillo del degradé dorado |
| `--gold-deep` | `#A07E33` | Sombra del degradé dorado |

### Líneas y superficies
- `--hair: rgba(201,162,78,.22)` — bordes dorados sutiles
- `--hair-soft: rgba(244,238,226,.10)` — separadores en hueso
- `--surface: rgba(244,238,226,.035)` — fondo de botón fantasma / paneles

### Degradé de fondo del cuerpo (clave para que "se sienta" Beacon)
```css
background:
  radial-gradient(120% 80% at 12% -8%, rgba(201,162,78,.10), transparent 60%),
  radial-gradient(120% 90% at 92% 108%, rgba(110,94,68,.16), transparent 60%),
  linear-gradient(158deg, #16120D, #1E1812);
background-repeat: no-repeat;
```
> En presentaciones: fondo `#16120D` con un par de **glows** radiales dorados muy suaves en las esquinas.

---

## 3. Tipografía

Dos familias (Google Fonts):
- **Cormorant Garamond** (serif) → **titulares, números, citas, acentos en itálica**.
  Pesos: 400/500/600, e itálicas 400/500. Es el alma elegante de la marca.
- **Inter** (sans) → **cuerpo, etiquetas (eyebrows), botones, UI**.
  Pesos: 300/400/500/600.

```html
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
```

### Reglas de uso
- **Títulos (h1/h2/h3):** Cormorant Garamond, weight 500, color `--bone`, `line-height` ajustado (1.04–1.1).
  Tamaños fluidos: h1 `clamp(2.8rem, 7vw, 5.8rem)`; h2 `clamp(2rem, 4.4vw, 3.4rem)`.
- **Frases destacadas / citas:** Cormorant **itálica**, color `--ink-800` o `--bone`, el acento en `--gold`.
- **Eyebrow (etiqueta sobre el título):** Inter, MAYÚSCULAS, `font-size:11px`,
  `letter-spacing:0.34em`, color `--gold`, weight 500.
- **Cuerpo:** Inter 400, `line-height:1.7–1.85`, color `--ink-600/800`, ancho máx ~62ch.
- **Wordmark "Harmonic Beacon":** Inter, `letter-spacing:0.18em`.

---

## 4. El símbolo (logo)

**Curva de Lissajous de proporción 3:2** (la quinta justa — vínculo directo con la armonía/HIT).
Es una línea continua dorada, sin relleno, trazo redondeado. Se usa sola como marca/ícono.

- Trazo: `stroke:#C9A24E`, `stroke-width:2.6–3.4`, `stroke-linecap/linejoin:round`, `fill:none`.
- Favicon / app-icon: la misma curva centrada en un cuadrado redondeado `#16120D`, `rx:38`, curva al 78% de escala.
- En código se inyecta como `MARK` (path SVG) en `assets/hb-main.js` y como `#hbmark` (símbolo reutilizable).

### SVG listo para pegar (viewBox 0 0 200 200)
```html
<svg viewBox="0 0 200 200" width="64" height="64" fill="none" aria-hidden="true">
  <path d="M 192 100 L 191.79 104.13 L 191.17 108.25 L 190.13 112.35 L 188.68 116.43 L 186.84 120.47 L 184.6 124.48 L 181.97 128.43 L 178.98 132.33 L 175.62 136.16 L 171.93 139.92 L 167.91 143.6 L 163.58 147.19 L 158.96 150.68 L 154.08 154.08 L 148.95 157.36 L 143.6 160.53 L 138.05 163.58 L 132.33 166.5 L 126.46 169.28 L 120.47 171.93 L 114.39 174.43 L 108.25 176.78 L 102.06 178.98 L 95.87 181.01 L 89.7 182.89 L 83.57 184.6 L 77.52 186.13 L 71.57 187.5 L 65.75 188.68 L 60.08 189.69 L 54.6 190.52 L 49.32 191.17 L 44.27 191.63 L 39.47 191.91 L 34.95 192 L 30.72 191.91 L 26.8 191.63 L 23.22 191.17 L 19.98 190.52 L 17.11 189.69 L 14.61 188.68 L 12.5 187.5 L 10.79 186.13 L 9.48 184.6 L 8.58 182.89 L 8.09 181.01 L 8.02 178.98 L 8.37 176.78 L 9.13 174.43 L 10.31 171.93 L 11.89 169.28 L 13.87 166.5 L 16.24 163.58 L 18.99 160.53 L 22.1 157.36 L 25.57 154.08 L 29.38 150.68 L 33.5 147.19 L 37.93 143.6 L 42.64 139.92 L 47.61 136.16 L 52.81 132.33 L 58.23 128.43 L 63.84 124.48 L 69.61 120.47 L 75.52 116.43 L 81.55 112.35 L 87.65 108.25 L 93.81 104.13 L 100 100 L 106.19 95.87 L 112.35 91.75 L 118.45 87.65 L 124.48 83.57 L 130.39 79.53 L 136.16 75.52 L 141.77 71.57 L 147.19 67.67 L 152.39 63.84 L 157.36 60.08 L 162.07 56.4 L 166.5 52.81 L 170.62 49.32 L 174.43 45.92 L 177.9 42.64 L 181.01 39.47 L 183.76 36.42 L 186.13 33.5 L 188.11 30.72 L 189.69 28.07 L 190.87 25.57 L 191.63 23.22 L 191.98 21.02 L 191.91 18.99 L 191.42 17.11 L 190.52 15.4 L 189.21 13.87 L 187.5 12.5 L 185.39 11.32 L 182.89 10.31 L 180.02 9.48 L 176.78 8.83 L 173.2 8.37 L 169.28 8.09 L 165.05 8 L 160.53 8.09 L 155.73 8.37 L 150.68 8.83 L 145.4 9.48 L 139.92 10.31 L 134.25 11.32 L 128.43 12.5 L 122.48 13.87 L 116.43 15.4 L 110.3 17.11 L 104.13 18.99 L 97.94 21.02 L 91.75 23.22 L 85.61 25.57 L 79.53 28.07 L 73.54 30.72 L 67.67 33.5 L 61.95 36.42 L 56.4 39.47 L 51.05 42.64 L 45.92 45.92 L 41.04 49.32 L 36.42 52.81 L 32.09 56.4 L 28.07 60.08 L 24.38 63.84 L 21.02 67.67 L 18.03 71.57 L 15.4 75.52 L 13.16 79.53 L 11.32 83.57 L 9.87 87.65 L 8.83 91.75 L 8.21 95.87 L 8 100 L 8.21 104.13 L 8.83 108.25 L 9.87 112.35 L 11.32 116.43 L 13.16 120.47 L 15.4 124.48 L 18.03 128.43 L 21.02 132.33 L 24.38 136.16 L 28.07 139.92 L 32.09 143.6 L 36.42 147.19 L 41.04 150.68 L 45.92 154.08 L 51.05 157.36 L 56.4 160.53 L 61.95 163.58 L 67.67 166.5 L 73.54 169.28 L 79.53 171.93 L 85.61 174.43 L 91.75 176.78 L 97.94 178.98 L 104.13 181.01 L 110.3 182.89 L 116.43 184.6 L 122.48 186.13 L 128.43 187.5 L 134.25 188.68 L 139.92 189.69 L 145.4 190.52 L 150.68 191.17 L 155.73 191.63 L 160.53 191.91 L 165.05 192 L 169.28 191.91 L 173.2 191.63 L 176.78 191.17 L 180.02 190.52 L 182.89 189.69 L 185.39 188.68 L 187.5 187.5 L 189.21 186.13 L 190.52 184.6 L 191.42 182.89 L 191.91 181.01 L 191.98 178.98 L 191.63 176.78 L 190.87 174.43 L 189.69 171.93 L 188.11 169.28 L 186.13 166.5 L 183.76 163.58 L 181.01 160.53 L 177.9 157.36 L 174.43 154.08 L 170.62 150.68 L 166.5 147.19 L 162.07 143.6 L 157.36 139.92 L 152.39 136.16 L 147.19 132.33 L 141.77 128.43 L 136.16 124.48 L 130.39 120.47 L 124.48 116.43 L 118.45 112.35 L 112.35 108.25 L 106.19 104.13 L 100 100 L 93.81 95.87 L 87.65 91.75 L 81.55 87.65 L 75.52 83.57 L 69.61 79.53 L 63.84 75.52 L 58.23 71.57 L 52.81 67.67 L 47.61 63.84 L 42.64 60.08 L 37.93 56.4 L 33.5 52.81 L 29.38 49.32 L 25.57 45.92 L 22.1 42.64 L 18.99 39.47 L 16.24 36.42 L 13.87 33.5 L 11.89 30.72 L 10.31 28.07 L 9.13 25.57 L 8.37 23.22 L 8.02 21.02 L 8.09 18.99 L 8.58 17.11 L 9.48 15.4 L 10.79 13.87 L 12.5 12.5 L 14.61 11.32 L 17.11 10.31 L 19.98 9.48 L 23.22 8.83 L 26.8 8.37 L 30.72 8.09 L 34.95 8 L 39.47 8.09 L 44.27 8.37 L 49.32 8.83 L 54.6 9.48 L 60.08 10.31 L 65.75 11.32 L 71.57 12.5 L 77.52 13.87 L 83.57 15.4 L 89.7 17.11 L 95.87 18.99 L 102.06 21.02 L 108.25 23.22 L 114.39 25.57 L 120.47 28.07 L 126.46 30.72 L 132.33 33.5 L 138.05 36.42 L 143.6 39.47 L 148.95 42.64 L 154.08 45.92 L 158.96 49.32 L 163.58 52.81 L 167.91 56.4 L 171.93 60.08 L 175.62 63.84 L 178.98 67.67 L 181.97 71.57 L 184.6 75.52 L 186.84 79.53 L 188.68 83.57 L 190.13 87.65 L 191.17 91.75 L 191.79 95.87 L 192 100 Z"
    fill="none" stroke="#C9A24E" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```
> Reglas del logo: solo en oro `#C9A24E` (o hueso `#F4EEE2` sobre fondos muy claros). Nunca relleno,
> nunca degradés multicolor, nunca rotarlo ni deformarlo. Acompañado del wordmark "Harmonic Beacon" en Inter.

---

## 5. Recursos gráficos / motivos visuales

1. **Glows dorados:** círculos radiales `rgba(201,162,78,.10–.30)` muy difuminados (`blur 80–90px`)
   en esquinas/fondo. Dan profundidad y calidez. Úsalos detrás de héroes y cierres.
2. **Grano sutil (film grain):** overlay de ruido a `opacity:.04`, `mix-blend-mode:overlay`. Da textura
   analógica. (Capa fija sobre todo, sin interferir clics.)
3. **Hairlines doradas:** bordes y separadores de 1px en `--hair` / `--hair-soft`. Mucho aire entre bloques.
4. **Imágenes en duotono cálido:** fotos con `filter: saturate(.78) contrast(1.02) brightness(.92)` y un
   `inset box-shadow` oscuro en el marco. Bordes redondeados 18px. Nada de fotos frías o saturadas.
5. **Borde-cita dorado:** frases importantes con barra vertical dorada a la izquierda (`border-left:2px gold`),
   en Cormorant itálica.
6. **Numeración romana en itálica dorada** (i, ii, iii…) para pasos/listas — detalle de marca recurrente.

---

## 6. Componentes (estilos clave)

### Botón primario (oro)
```css
color:#1a140c; border-radius:999px; padding:.92rem 1.7rem;
font:500 12.5px Inter; letter-spacing:.16em; text-transform:uppercase;
background:linear-gradient(135deg,#E3C77E 0%, #C9A24E 52%, #A07E33 100%);
box-shadow:0 10px 30px rgba(201,162,78,.22), inset 0 1px 0 rgba(255,255,255,.4);
/* hover: translateY(-2px) + sombra más amplia */
```

### Botón fantasma (ghost)
```css
color:#E9E0D0; background:rgba(244,238,226,.035);
border:1px solid rgba(201,162,78,.22); border-radius:999px; backdrop-filter:blur(6px);
/* hover: borde dorado + texto hueso */
```

### Eyebrow (etiqueta)
Mayúsculas, Inter 11px, `letter-spacing:.34em`, color `--gold`. Va arriba de cada título.

### Tarjeta
Fondo `#1B150F`, borde `--hair-soft` 1px, radio 18px. Hover: `translateY(-4px)` + sombra
`0 24px 60px rgba(0,0,0,.45)` + borde dorado. Placeholders/“próximamente”: borde **punteado**.

### Pills / badges de estado
Bordes redondeados, 10.5px mayúsculas. Variante "disponible ahora" = pill **oro lleno** con punto pulsante.

### Migas de pan (breadcrumbs)
Inter 11px mayúsculas, `--ink-500`, separador `›` en `--pearl-400`, página actual en `--gold`.
Patrón: `Inicio › Sección › Página`.

---

## 7. Layout, espacio y movimiento

- **Ancho de contenido:** `max-width:1180px` (`--wrap`), variante angosta `760px` para textos largos.
- **Padding de sección:** `clamp(64px, 11vw, 140px)` vertical. Mucho aire.
- **Radio de tarjeta:** `18px`.
- **Curva de easing de marca:** `cubic-bezier(.16, 1, .3, 1)` (suave, "ease-out expresivo").
- **Animación de entrada (reveal):** elementos suben 26px + fade-in al entrar en viewport
  (~1s con la curva de arriba). Respetar **`prefers-reduced-motion`** siempre.
- **Sombra de tarjeta:** `0 24px 60px rgba(0,0,0,.45)`.

---

## 8. Variante de sub-marca: bonob.os

La línea **bonob.os** (app de bienestar sexual) usa la misma base pero más **íntima y cálida**:
- Suma un glow **ámbar/rosado** `rgba(176,108,92,.16–.26)` a los glows dorados.
- Hero centrado, tipografía Cormorant grande, kicker poético en itálica.
- **Logo propio:** monito(s) bonobo en line-art dorado (mismo trazo que el símbolo) — guiño al nombre.
- Tono educado y sensual, nunca explícito. Nota siempre presente: "bienestar y exploración, nunca tratamiento médico. Para personas adultas."

---

## 9. Voz y copy

- **Bilingüe ES/EN** en paralelo (es la web). Español rioplatense suave, inglés sobrio.
- Frases madre cortas, sensoriales, con una itálica clave. Evitar jerga y mayúsculas gritonas.
- **Encuadre obligatorio:** experiencia de **bienestar y exploración no clínica** — NUNCA "tratamiento",
  "cura" ni claims médicos. "No porque una frecuencia cure, sino porque el campo reduce carga correctiva."
- Marca paraguas: **Harmonic Beacon** (programa de AlterMundi). Experiencia: **Proyección Armónica del Mito**
  (EN: *Harmonic Myth Projection, HMP* — pendiente confirmar acrónimo con el equipo).

---

## 10. Do / Don't

**Sí:** fondo oscuro cálido · oro con moderación · mucho aire · serif elegante para títulos ·
Lissajous como sello · fotos en duotono cálido · itálicas para emoción · bilingüe.

**No:** azul-acero corporativo · multicolor · neón · degradés arcoíris · íconos genéricos de stock ·
emojis en piezas formales · claims médicos · saturar de oro · tipografías de sistema sin las dos familias.

---

## 11. Tokens listos para pegar (CSS)

```css
:root{
  --bg-0:#16120D; --bg-1:#1E1812; --bg-2:#241D15; --bg-card:#1B150F;
  --bone:#F4EEE2; --ink-800:#E9E0D0; --ink-600:#ADA089; --ink-500:#8A7F6B; --pearl-400:#6E5E44;
  --gold:#C9A24E; --gold-2:#E3C77E; --gold-deep:#A07E33;
  --hair:rgba(201,162,78,.22); --hair-soft:rgba(244,238,226,.10); --surface:rgba(244,238,226,.035);
  --font-serif:'Cormorant Garamond',Georgia,serif;
  --font-sans:'Inter',system-ui,-apple-system,sans-serif;
  --r-card:18px; --shadow-card:0 24px 60px rgba(0,0,0,.45);
  --ease:cubic-bezier(.16,1,.3,1);
}
```

> **Para reproducir 1:1**, lo más rápido es copiar `assets/hb-brand.css` (tokens + componentes) y
> el símbolo de `assets/hb-main.js`. Esta guía es el resumen humano de ese sistema.

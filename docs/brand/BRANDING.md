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

## 4. El símbolo seleccionado — 13 noviembre 2026

Sai eligió la curva de su referencia fotográfica vertical. El maestro conserva
su silueta, el lazo inferior amplio y sus cruces; excluye el destello aislado de
la esquina inferior derecha. No conocemos los parámetros físicos del oscilador:
la reconstrucción no afirma una frecuencia ni una proporción 3:2.

La única geometría editable está en
`assets/brand/beacon-mark/geometry.json`; `render_mark.py` genera todos los SVG.
Los controles son puntos de una curva cerrada en el espacio de la imagen, con
interpolación periódica. No son parámetros de un aparato físico.

- Fuente humana: selección del 13 noviembre 2026,
  `ec8b8591-1e2e-4116-bc92-0b0d1a5aaa60`.
- Referencia original: PNG 868×1229, SHA256
  `2483ec2ed9b9e9ebbbd354a846ca11b02eea1f9daf4aea5a01fb067cc2410790`.
  Sus bytes originales y la comparación se conservan en el proyecto; no se
  convierte el fondo fotográfico en parte del logotipo.
- Uso web general: `beacon-mark.svg`, transparente, sin relleno, trazo redondeado.
- Uso inline del mismo origen: `beacon-mark-symbol.svg#beacon-mark`.
- Navegación compartida entre dominios: bloque SVG inline generado por el mismo
  maestro (`--sync-consumers`). No requiere imágenes externas ni relajar la CSP
  del login. No usar un `use` externo entre orígenes.
- Bordó `#6d2939`, oliva `#48523a` y beige `#f7f1e7` son variantes de rol;
  también hay negro/blanco y una versión turquesa `#13cec2` inspirada en la
  referencia. Oro conserva la compatibilidad del tema web actualmente publicado.
- Grosor estándar 6/200; variante pequeña 10/200. Ajustar el grosor por soporte,
  conservando la geometría, proporción y orientación. No rellenar ni deformar.
- El favicon conserva su fondo oscuro y usa este mismo trazo, reforzado para
  tamaños pequeños. La nueva selección no cambia AlterMundi, HIT ni PsicopoMPo.

Los antiguos ejemplos trigonométricos quedan en el historial de Git como
referencias anteriores, no como la definición vigente de esta marca. El resto
de esta guía y la selección del tema permanecen bajo su contrato existente.

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

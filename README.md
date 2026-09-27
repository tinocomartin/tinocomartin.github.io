# Capturando la Luz

Web de fotografía de José Antonio Tinoco Martín — https://tinocomartin.com
Hecha con Jekyll y publicada con GitHub Pages (dominio gestionado en Cloudflare).

## Añadir fotos

Sube la imagen a la carpeta de su galería y aparece sola en la web:

- `assets/nocturna/`
- `assets/paisaje/`
- `assets/vehiculos/`

Recomendado: JPG sin marco blanco (el marco se ve en el visor), 2000 px en el lado largo, calidad 80–85 (≈300–500 KB).

## Redes sociales

En `_config.yml`, apartado `redes`, pega el enlace de cada perfil entre las comillas.
Las que estén vacías no se muestran. Aparecen en la página Contacto y en el pie de página.

## Añadir relatos a las fotos

Los relatos se leen de una hoja de cálculo con estas columnas:

| galeria | archivo | titulo | lugar | fecha | relato |
|---|---|---|---|---|---|
| nocturna | El-Molino.jpg | El Molino | Consuegra, Toledo | Agosto 2024 | Texto… |

- `archivo` tiene que coincidir con el nombre de la foto (da igual mayúsculas, tildes o la extensión).
- Todo lo demás es opcional. Sin relato, la foto se ve sola a pantalla completa.
- Para separar párrafos, deja una línea en blanco dentro de la celda (Alt+Intro / Cmd+Intro).

Dónde está la hoja:

- **Opción A (sin tocar GitHub):** una hoja de Google publicada como CSV. Su enlace va en `relatos_url` dentro de `_config.yml`.
- **Opción B:** el archivo `relatos.csv` de este repositorio (se usa si `relatos_url` está vacío).

Cada foto tiene enlace directo: `https://tinocomartin.com/nocturna/#el-molino`

## Diseño

- Tipografías (alojadas en `assets/fonts/`, licencia OFL): **Cormorant Garamond** para títulos y textos, **Jost** para menú y etiquetas. No usar más.
- Colores en variables al principio de `css/style.css`. El modo oscuro se activa solo si el dispositivo lo tiene activado.
- Galerías en filas que respetan la proporción de cada foto (las verticales no se recortan). Las proporciones están en `_data/proporciones.yml`; si falta una foto nueva, la web la calcula sola.

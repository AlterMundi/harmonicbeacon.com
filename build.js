const fs = require('fs');
const path = require('path');

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();

  if (isDirectory) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

// Crear carpeta de salida
if (!fs.existsSync('dist')) fs.mkdirSync('dist', { recursive: true });

// Copiar archivos raíz necesarios
['index.html', '.htaccess'].forEach(file => {
  if (fs.existsSync(file)) {
    fs.copyFileSync(file, path.join('dist', file));
    console.log(`✓ Copiado: ${file}`);
  }
});

// Copiar assets
if (fs.existsSync('assets')) {
  copyRecursiveSync('assets', path.join('dist', 'assets'));
  console.log('✓ Copiado: assets/');
}

// Copiar las landings activas y conservar sus rutas públicas exactas.
for (const directory of [
  'eventos',
  'porque-funciona',
  'proyeccion-armonica-del-mito',
  'inscripcion',
  'logos',
]) {
  if (fs.existsSync(directory)) {
    copyRecursiveSync(directory, path.join('dist', directory));
    console.log(`✓ Copiado: ${directory}/`);
  }
}

// Conservar la política vigente y sus evidencias legales versionadas.
for (const directory of ['politica', 'legal', 'contracts']) {
  if (fs.existsSync(directory)) {
    copyRecursiveSync(directory, path.join('dist', directory));
    console.log(`✓ Copiado: ${directory}/`);
  }
}

console.log('\n✅ Build completado en dist/');

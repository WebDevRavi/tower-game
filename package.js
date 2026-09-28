const fs = require('fs');
const path = require('path');
const archiverModule = require('archiver');
const ZipArchive = archiverModule.ZipArchive || archiverModule;

const outputZipPath = path.join(__dirname, 'blue3d-tower-game.zip');

if (fs.existsSync(outputZipPath)) {
  fs.unlinkSync(outputZipPath);
}

const output = fs.createWriteStream(outputZipPath);
const archive = typeof ZipArchive === 'function' 
  ? new ZipArchive({ zlib: { level: 9 } }) 
  : archiverModule('zip', { zlib: { level: 9 } });

output.on('close', function () {
  const stat = fs.statSync(outputZipPath);
  const sizeMB = (stat.size / (1024 * 1024)).toFixed(2);
  console.log(`\n==============================================`);
  console.log(`✅ CRAZYGAMES PACKAGE CREATED SUCCESSFULLY!`);
  console.log(`📦 File: ${outputZipPath}`);
  console.log(`📊 Size: ${sizeMB} MB`);
  console.log(`🌐 POSIX Paths: All entries use forward slashes (/)`);
  console.log(`⚡ Inlined JS: main.js and zepto embedded into index.html`);
  console.log(`🛡️ Resilient: Zero external JS file load dependencies`);
  console.log(`==============================================\n`);
});

archive.on('error', function (err) {
  console.error('Archive error:', err);
  process.exit(1);
});

archive.pipe(output);

// 1. Read index.html, main.js, zepto and create self-contained index.html
let indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const mainJs = fs.readFileSync(path.join(__dirname, 'dist', 'main.js'), 'utf8');
const zeptoJs = fs.readFileSync(path.join(__dirname, 'assets', 'zepto-1.1.6.min.js'), 'utf8');

// Replace external script tags with inlined code
indexHtml = indexHtml.replace(
  '<script src="./dist/main.js"></script>',
  `<script>\n/* [INLINED] dist/main.js */\n${mainJs}\n</script>`
);
indexHtml = indexHtml.replace(
  '<script src="./assets/zepto-1.1.6.min.js"></script>',
  `<script>\n/* [INLINED] assets/zepto-1.1.6.min.js */\n${zeptoJs}\n</script>`
);

// Append inlined index.html to root of zip
archive.append(indexHtml, { name: 'index.html' });

// 2. Add dist folder (force forward slash POSIX paths)
archive.directory(path.join(__dirname, 'dist'), 'dist');

// 3. Add assets folder (force forward slash POSIX paths)
archive.directory(path.join(__dirname, 'assets'), 'assets');

archive.finalize();

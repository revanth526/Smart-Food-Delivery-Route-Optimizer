const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const sourceDir = __dirname;
const tempDir = path.join(sourceDir, 'sfd_clean_build');
const zipFile = path.join(sourceDir, 'SmartFoodDelivery.zip');

const ignoreList = [
  'node_modules',
  'target',
  'dist',
  '.git',
  '.idea',
  '.mvn',
  'sfd_clean_build',
  'SmartFoodDelivery.zip',
  'zip_helper.js',
  '.DS_Store'
];

function deleteFolderRecursive(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach((file) => {
      const curPath = path.join(dirPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(dirPath);
  }
}

function copyRecursive(src, dest) {
  const name = path.basename(src);
  if (ignoreList.includes(name)) return;

  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((child) => {
      copyRecursive(path.join(src, child), path.join(dest, child));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

console.log('1. Cleaning old build directories...');
if (fs.existsSync(tempDir)) deleteFolderRecursive(tempDir);
if (fs.existsSync(zipFile)) fs.unlinkSync(zipFile);

console.log('2. Copying project files excluding dependency node_modules...');
copyRecursive(sourceDir, tempDir);

console.log('3. Archiving folder with PowerShell Compress-Archive...');
try {
  // Compress-Archive -Path .\sfd_clean_build\* -DestinationPath .\SmartFoodDelivery.zip
  execSync(`powershell -Command "Compress-Archive -Path '${tempDir}\\*' -DestinationPath '${zipFile}' -Force"`);
  console.log('✅ Archiving completed: SmartFoodDelivery.zip');
} catch (err) {
  console.error('Error zipping:', err.message);
} finally {
  console.log('4. Cleaning up temp files...');
  deleteFolderRecursive(tempDir);
}

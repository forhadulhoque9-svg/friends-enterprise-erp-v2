import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';

const zip = new AdmZip();

function addLocalFolderRecursive(localPath, zipPath = '') {
  const items = fs.readdirSync(localPath);
  for (const item of items) {
    const fullPath = path.join(localPath, item);
    const relativePath = zipPath ? `${zipPath}/${item}` : item;

    // Exclude certain directories/files to keep the ZIP clean and compact
    if (
      item === 'node_modules' ||
      item === 'dist' ||
      item === 'public' ||
      item === '.git' ||
      item === 'create-zip.js' ||
      item === 'friends_enterprise_project.zip'
    ) {
      continue;
    }

    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      zip.addFile(relativePath + '/', Buffer.alloc(0));
      addLocalFolderRecursive(fullPath, relativePath);
    } else {
      zip.addLocalFile(fullPath, zipPath);
    }
  }
}

console.log('Generating ZIP file...');
try {
  addLocalFolderRecursive('.');

  const publicDir = './public';
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
  }

  zip.writeZip('./public/friends_enterprise_project.zip');
  console.log('ZIP file successfully created at ./public/friends_enterprise_project.zip');

  const distDir = './dist';
  if (fs.existsSync(distDir)) {
    fs.copyFileSync('./public/friends_enterprise_project.zip', './dist/friends_enterprise_project.zip');
    console.log('ZIP file successfully copied to ./dist/friends_enterprise_project.zip');
  }
} catch (error) {
  console.error('Error generating ZIP file:', error);
  process.exit(1);
}

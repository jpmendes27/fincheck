#!/usr/bin/env node

/**
 * Script para incrementar versão e atualizar versionamento em arquivos HTML
 * Executa automaticamente com pre-commit hook
 */

const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, 'package.json');
const indexPath = path.join(__dirname, 'index.html');
const appIndexPath = path.join(__dirname, 'app', 'index.html');

// Ler package.json
const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
const versionParts = pkg.version.split('.');

// Incrementar patch version (1.0.0 → 1.0.1)
versionParts[2] = String(parseInt(versionParts[2]) + 1);
const newVersion = versionParts.join('.');

console.log(`📦 Bumping version: ${pkg.version} → ${newVersion}`);

// Atualizar package.json
pkg.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n');

// Função para atualizar versão em HTML
function updateHtmlVersion(filePath, version) {
  let content = fs.readFileSync(filePath, 'utf-8');

  // Remove comentário de versão antigo se existir
  content = content.replace(/<!-- fincheck v[\d.]+.*?-->\n?/i, '');

  // Adiciona novo comentário de versão no <head> ou no início
  const timestamp = new Date().toLocaleString('pt-BR');
  const versionComment = `<!-- fincheck v${version} - ${timestamp} -->\n`;

  if (content.includes('<head>')) {
    content = content.replace('<head>', `<head>\n  ${versionComment}`);
  } else {
    content = versionComment + content;
  }

  // Atualizar todos os script src que apontam para arquivos locais
  content = content.replace(
    /src="(js\/[^"]+\.js)"/g,
    `src="$1?v=${version}"`
  );

  // Atualizar todos os link href para CSS
  content = content.replace(
    /href="(css\/[^"]+\.css)"/g,
    `href="$1?v=${version}"`
  );

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`✓ Atualizado: ${path.relative(__dirname, filePath)}`);
}

// Atualizar ambos os arquivos
updateHtmlVersion(indexPath, newVersion);
updateHtmlVersion(appIndexPath, newVersion);

console.log(`✅ Versão atualizada para ${newVersion}`);

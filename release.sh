#!/bin/bash

# ================================================================
#  Missal-Planner Release Script
#  Uso: ./release.sh 0.0.2
# ================================================================

VERSION="$1"

if [ -z "$VERSION" ]; then
  echo "Uso: ./release.sh <versão> (ex.: ./release.sh 0.0.2)"
  exit 1
fi

echo "================================================"
echo "🔧 INICIANDO RELEASE $VERSION"
echo "================================================"

# ------------------------------------------------
# 1. Atualizar versão no package.json
# ------------------------------------------------
echo "📌 Atualizando versão no package.json..."
sed -i "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" package.json

grep '"version"' package.json

# ------------------------------------------------
# 2. Gerar builds
# ------------------------------------------------
echo "🏗  Gerando builds com electron-builder..."
npm run dist || { echo "❌ Erro ao gerar build"; exit 1; }

echo "📦 Conteúdo da pasta release/"
ls -lh release/

# ------------------------------------------------
# 3. Criar RELEASE no GitHub
# ------------------------------------------------
echo "🚀 Criando release v$VERSION no GitHub..."
gh release create "v$VERSION" \
  --title "Missal-Planner v$VERSION" \
  --notes "Release $VERSION gerada automaticamente pelo script."

# ------------------------------------------------
# 4. Enviar artefatos
# ------------------------------------------------
echo "📤 Enviando artefatos..."
gh release upload "v$VERSION" release/*.AppImage release/*.deb release/*.yml --clobber

# ------------------------------------------------
# 5. Mostrar release final
# ------------------------------------------------
echo "🔎 Release publicada:"
gh release view "v$VERSION" --assets

echo "================================================"
echo "🎉 RELEASE $VERSION PUBLICADA COM SUCESSO!"
echo "================================================"

#!/bin/bash

# Simple verification script to check if all major components work

echo "=== Electron Cloud Doc - Verification Script ==="

echo "1. Checking if dependencies are installed..."
if [ -d "node_modules" ]; then
    echo "✅ Dependencies installed"
else
    echo "❌ Dependencies not found"
    exit 1
fi

echo "2. Testing React build..."
if npm run build > /dev/null 2>&1; then
    echo "✅ React app builds successfully"
else
    echo "❌ React build failed"
    exit 1
fi

echo "3. Testing main process build..."
if npm run buildMain > /dev/null 2>&1; then
    echo "✅ Main process builds successfully"
else
    echo "❌ Main process build failed"
    exit 1
fi

echo "4. Checking key files exist..."
FILES_TO_CHECK=(
    "build/index.html"
    "build/main.js"
    "main.js"
    "src/App.js"
    "AppWindow.js"
)

for file in "${FILES_TO_CHECK[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
        exit 1
    fi
done

echo ""
echo "🎉 All checks passed! The project should run normally now."
echo ""
echo "To run the project:"
echo "  npm run dev    # Development mode with hot reload"
echo "  npm run ele    # Electron only mode"
echo "  npm run dist   # Build distributable"
echo ""
#!/bin/bash
echo "🚀 Setting up MR!JK! MART GitHub repository..."
echo ""

git init
git add .
git commit -m "🚀 Initial commit — MR!JK! MART"
git branch -M main
git remote add origin https://github.com/MR1JK1/MR-JK-MART.git
git push -u origin main

echo ""
echo "✅ Pushed! Now go to GitHub repo Settings → Pages → gh-pages branch"
echo "🌐 Your site will be at: https://MR1JK1.github.io/MR-JK-MART/"

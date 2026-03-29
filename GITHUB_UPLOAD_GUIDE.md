# 📤 How to Upload to GitHub

## Step 1: Create Repository on GitHub

1. Go to [github.com](https://github.com) and sign in
2. Click **New** (green button, top left)
3. Repository name: `mlbb-guide`
4. Description: "Elite gaming strategy guide for Mobile Legends: Bang Bang"
5. Choose **Public** (to show off your work!)
6. DO NOT initialize with README (we already have one)
7. Click **Create repository**

---

## Step 2: Connect Local Repository to GitHub

After creating the repo, GitHub shows you commands. Run these in PowerShell in your project folder:

```powershell
cd "C:\Coding Projects\MLBB Guide"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/mlbb-guide.git
git push -u origin main
```

**Replace `YOUR_USERNAME` with your actual GitHub username**

Example:
```powershell
git remote add origin https://github.com/john-doe/mlbb-guide.git
```

---

## Step 3: Verify Upload

1. Go to your GitHub repo: `https://github.com/YOUR_USERNAME/mlbb-guide`
2. You should see all your files!
3. Your README.md will display automatically

---

## Step 4: Deploy Live (Optional but Recommended)

### Option A: GitHub Pages (FREE)
1. Go to Settings → Pages
2. Under "Build and deployment", select "Deploy from a branch"
3. Choose `main` branch
4. Click Save
5. Wait 1-2 minutes
6. Your site is live at: `https://YOUR_USERNAME.github.io/mlbb-guide`

### Option B: Netlify (FREE + Custom Domain)
1. Go to [netlify.com](https://netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect to GitHub
4. Select your `mlbb-guide` repo
5. Netlify auto-detects it's static - just click Deploy
6. Get a free `.netlify.app` domain or add your own

### Option C: Vercel (FREE + Custom Domain)
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New..." → "Project"
3. Import your GitHub repo
4. Click Deploy
5. Get live URL instantly

---

## Future Updates

Whenever you make changes locally:

```powershell
cd "C:\Coding Projects\MLBB Guide"
git add .
git commit -m "Your description of changes"
git push
```

GitHub and your live site update automatically!

---

## What's Tracked

✅ **Tracked (uploaded):**
- All HTML/CSS/JS files
- README.md
- .gitignore
- All chapter content

❌ **NOT tracked (protected):**
- API keys (if you used .env)
- node_modules
- Build artifacts

---

## Share Your Project

After deploying:
- Share `https://YOUR_USERNAME.github.io/mlbb-guide` with friends
- Add link to your portfolio/resume
- Tweet about it with #MLBB #GameDeveloper
- Link from Discord communities

---

## Troubleshooting

### "fatal: repository not found"
- Check username spelling
- Make sure repo exists on GitHub
- Verify you have internet connection

### Can't push?
```powershell
git pull origin main
git push origin main
```

### Forgot to add files?
```powershell
git add .
git commit -m "Add missing files"
git push
```

---

## Stats to Celebrate

Your project includes:
- ✨ 16 tracked files
- 📄 ~1,300 lines of code
- 🎨 Responsive mobile-first design
- 🔐 Supabase authentication
- 📊 9 complete chapters
- 🚀 Zero dependencies
- ⚡ Production-ready

**You're ready to ship! 🚀**

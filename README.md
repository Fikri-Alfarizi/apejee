# 💖 A Little Love Story

A mobile-first interactive kawaii love book built with vanilla HTML, CSS & JS.  
Ready for **GitHub Pages** — no build tools, no dependencies.

---

## 📁 Folder Structure

```
/
├── index.html          ← HTML structure only
├── style.css           ← All styling & CSS animations
├── script.js           ← All JS logic & interactions
├── README.md
└── assets/
    ├── audio/
    │   ├── bgm.mp3         ← Background music (loop)
    │   ├── book-open.mp3   ← Sound when book opens
    │   ├── page-flip.mp3   ← Sound when page turns
    │   ├── pop.mp3         ← Pop sound for interactions
    │   └── sparkle.mp3     ← Sparkle sound for rewards
    ├── images/             ← (Optional) Custom images
    └── icons/              ← (Optional) Custom icons
```

> **Note:** The site works fine without audio files — it silently fails gracefully if files are missing.

---

## 🚀 Deploy to GitHub Pages

1. Create a new GitHub repository
2. Upload all files keeping the same folder structure
3. Go to **Settings → Pages**
4. Set **Source** to `Deploy from branch` → `main` → `/ (root)`
5. Wait ~1 minute, then visit:  
   `https://yourusername.github.io/your-repo-name/`

---

## ✏️ How to Customise

### Change the Story Text
Edit the `<div class="page" data-page="N">` blocks inside `index.html`.  
Each page has its own section with clear comments.

### Change the Book Title
Search for `"A Little Love Story"` in `index.html` and replace all instances.

### Change the Love Message (Page 14)
Find `<p class="love-line ll-1">` … `ll-7` in `index.html` and edit the lines.

### Change Colours
Edit the `:root { ... }` block at the top of `style.css`.

### Add Audio
Place `.mp3` files in `./assets/audio/` with these exact filenames:
- `bgm.mp3`
- `book-open.mp3`
- `page-flip.mp3`
- `pop.mp3`
- `sparkle.mp3`

### Add a New Page (e.g., Page 16)
1. Duplicate a `<div class="page" data-page="...">` block in `index.html`
2. Change `data-page="15"` → `data-page="16"` on the new block
3. Add class `hidden-page` to the new page div
4. In `script.js`, change `CONFIG.totalPages` from `15` → `16`
5. (Optional) Add a `case 16:` to the `onPageEnter()` function for special effects

---

## 🎮 Interactions

| Action | Effect |
|--------|--------|
| Tap opening screen | Open the book |
| Tap book cover | Flip open with animation + sound |
| Swipe left / Tap right zone | Next page |
| Swipe right / Tap left zone | Previous page |
| Tap heart (Page 5) | Interactive heart tap game |
| Tap envelope (Page 6) | Open envelope + reveal letter |
| Drag ribbon (Page 10) | Unwrap the gift |
| 🔊 button | Toggle mute/unmute |
| Tap "Baca Lagi" (Page 15) | Restart the whole story |

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| `--pink` | `#FFD6E7` |
| `--peach` | `#FFE3D8` |
| `--cream` | `#FFF8E8` |
| `--lavender` | `#E9D8FF` |
| `--baby-blue` | `#D8EEFF` |
| `--accent` | `#FF6B9D` |
| `--text-main` | `#5B4B5A` |
| Font title | Dancing Script |
| Font body | Nunito |

Made with 💖

# 🎮 Who Versus Visual Identity Brief

## 1. Overall Aesthetic
- **Core Vibe:** Futuristic neon energy with a playful, competitive edge.  
- **Mood:** Vibrant, exciting, and tech-driven — like a glowing cyber alley where fun meets rivalry.  
- **Visual Goal:** Capture the thrill of competition while maintaining clarity and legibility in a digital environment.

---

## 2. Color Palette

| Category | Color | Hex / Notes |
|-----------|--------|-------------|
| **Primary Neon Colors** | Electric Blue | `#00FFFF` – main highlight for UI elements and active states |  
|  | Neon Purple | `#9B30FF` – softer glow for backgrounds or hover states |
| **Numerical Neon Colors** | Lime Green | `#39FF14` – used for positive points and ranks above top 25% |
|  | Electric Blue | `#00FFFF` – used for 0 points and ranks in middle 50% |
|  | Hot Pink | `#FF00FF` – used for negative points and ranks above bottom 25% |
| **Secondary Neon Colors** | Lime Green | `#39FF14` – used for success or energy highlights |
|  | Neon Orange | `#FF5F1F` – used for alerts, urgency, or emphasis |
| **Background Tones** | Dark Charcoal | `#101020` – replaces black, retains glow contrast |
|  | Deep Navy | `#0B1120` – subtle gradient alternative |
|  | Soft Glow Overlay | Lightly transparent glows to simulate reflected neon light |

> **Note:** The background should **not be pure black** — use dark navy or charcoal gradients so neon glows remain visible but not harsh.

---

## 3. Typography

### **Body**
- [**Share**](https://fonts.google.com/specimen/Share)  
  Clean and modern with subtle tech influences, perfect for readable UI text.

### **Headers, Titles, Labels**
- [**Orbitron**](https://fonts.google.com/specimen/Orbitron)  
  Futuristic geometric font — ideal for headers and branding elements.

### **Scores and Rankings**
- [**Wallpoet**](https://fonts.google.com/specimen/Wallpoet)  
  Inspired by LED dot-matrix displays, excellent for numeric data and scoreboard aesthetics.

---

## 4. Lighting & Glow Effects

- **Glow Radius:** Medium spread, soft edges.  
- **Layering:** Use a faint colored bloom around major UI elements.  
- **Reflection:** Optional light gradient overlay for subtle ambient light effects.  
- **Avoid:** Overpowering glow that reduces readability.

---

## 5. Iconography & Shapes

- **Style:** Minimal geometric line icons — consistent stroke width.  
- **Glow Accent:** Each icon should have a faint neon outer glow.  
- **Shapes:** Arrows, chevrons, and abstract geometric forms (as environmental motifs or separators).  

---

## 6. Implementation Tips for Developers

### **Color Variables**

Use **CSS custom properties** for consistent color management:
```css
:root {
  --color-bg: #101020;
  --color-primary: #00ffff;
  --color-secondary: #ff00ff;
  --color-accent: #9b30ff;
  --color-text: #e0e0ff;
}
```

### **Font Setup**
```html
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Share:wght@400;700&family=Wallpoet&display=swap" rel="stylesheet">
```

### **Neon Styling Tip**

Use **glow + letter spacing + shadows** to simulate neon tubes:
```css
.neon-text {
  color: var(--color-primary);
  letter-spacing: 0.1em;
  text-shadow:
    0 0 5px var(--color-primary),
    0 0 10px var(--color-primary),
    0 0 20px var(--color-primary);
}
```

### **Layered Transparency**

Avoid fully opaque panels — use semi-transparent colors or apply **backdrop-filter: blur()** for depth:
```css
.panel {
  background: rgba(16, 16, 32, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid var(--color-accent);
  border-radius: 1rem;
}
```

---

## 7. Summary

**Who Versus** combines the excitement of neon-lit competition with clean, futuristic readability.  
Electric color glows, geometric typefaces, and structured light effects convey energy and fairness — creating a digital arena that feels alive, competitive, and fun.

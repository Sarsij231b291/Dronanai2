# 🌌 UI/UX Design Specification: "NeuralHire" Design System

This document contains the complete UI/UX engine for a premium, glassmorphic AI-driven platform.

## 1. Design Principles
*   **Aesthetics**: Glassmorphism (Backdrop blur + semi-transparent borders).
*   **Background**: Dynamic mesh gradients (Animated Orbs).
*   **Typography**: 'Space Grotesk' (Modern, techno-scientific feel).
*   **Interactions**: Subtle scale-up on hover, smooth fade-in animations on load.

---

## 2. Core CSS Variables (Design Engine)
Add this to your `index.css`. It handles Light/Dark mode transitions.

```css
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap');

:root {
  --font-family: 'Space Grotesk', system-ui, sans-serif;

  /* Light Theme */
  --bg-color: #f0f2ff;
  --surface-color: rgba(255,255,255,0.85);
  --text-primary: #0f0f1a;
  --text-secondary: #5e6278;
  --border-color: rgba(99, 102, 241, 0.15);
  --accent-primary: #4f46e5;
  --accent-secondary: #06b6d4;
  --accent-tertiary: #8b5cf6;
  --glass-bg: rgba(255, 255, 255, 0.6);
  --glass-border: rgba(99, 102, 241, 0.2);
  --glass-blur: blur(24px) saturate(180%);
  --shadow-glow: 0 0 40px rgba(79, 70, 229, 0.25);

  --orb1: rgba(79, 70, 229, 0.12);
  --orb2: rgba(6, 182, 212, 0.10);
  --orb3: rgba(139, 92, 246, 0.08);
}

.dark {
  --bg-color: #030712;
  --surface-color: rgba(15, 20, 40, 0.85);
  --text-primary: #f1f5ff;
  --text-secondary: #8892b0;
  --border-color: rgba(99, 102, 241, 0.18);
  --accent-primary: #6366f1;
  --glass-bg: rgba(15, 20, 40, 0.65);
  --glass-border: rgba(99, 102, 241, 0.12);
  --shadow-glow: 0 0 60px rgba(99, 102, 241, 0.3);

  --orb1: rgba(99, 102, 241, 0.18);
  --orb2: rgba(34, 211, 238, 0.12);
  --orb3: rgba(167, 139, 250, 0.12);
}
```

---

## 3. Dynamic Background (Animated Orbs)
Use this HTML structure in your main App wrapper for the floating background effect.

```html
<div class="app-wrapper">
  <!-- These floating div's create the mesh effect -->
  <div class="mesh-orb1"></div>
  <div class="mesh-orb2"></div>
  <div class="mesh-orb3"></div>
  
  <main class="content-container">
     <!-- Your content here -->
  </main>
</div>
```

**Associated CSS:**
```css
@keyframes float {
  0%   { transform: translate(0, 0) scale(1); }
  50%  { transform: translate(30px, -20px) scale(1.05); }
  100% { transform: translate(-20px, 30px) scale(0.96); }
}

.mesh-orb3 {
  position: fixed;
  width: 400px; height: 400px;
  background: var(--orb3);
  border-radius: 50%;
  filter: blur(100px);
  top: 40%; left: 50%;
  pointer-events: none;
  animation: float 16s ease-in-out infinite alternate-reverse;
}
```

---

## 4. Component Patterns

### A. The "Glass Panel"
All major containers should use this class.
```css
.glass-panel {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  border-radius: 1.25rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
}
```

### B. The "Smart Action" Button
```css
.btn-primary {
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary), var(--accent-tertiary));
  background-size: 200% 200%;
  animation: gradientShift 5s ease infinite;
  color: white;
  border-radius: 0.75rem;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(99, 102, 241, 0.5);
}
```

### C. Gradient Headings
```css
.gradient-heading {
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary), var(--accent-tertiary));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-weight: 700;
}
```

---

## 5. UI Layout Tips
*   **Spacing**: Use `gap: 2rem` for main sections and `gap: 1.25rem` inside cards.
*   **Borders**: Keep borders very subtle (sub-20% opacity).
*   **Animations**: Use `cubic-bezier(0.16, 1, 0.3, 1)` for that "premium" springy feel on slide-ups.

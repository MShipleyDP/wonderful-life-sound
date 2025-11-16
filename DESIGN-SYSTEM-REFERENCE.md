# Design System Quick Reference

## 🎨 Color Palette

### Primary Colors
```css
--color-primary: #D4AF37        /* Theatrical Gold */
--color-primary-dark: #B8941F   /* Dark Gold */
--color-primary-light: #F4E4B9  /* Light Gold */
```

### Neutrals
```css
--color-bg: #FAFAF8            /* Background - Warm Off-White */
--color-surface: #FFFFFF        /* Cards/Surfaces */
--color-text: #1A1A1A          /* Primary Text - Near Black */
--color-text-muted: #595959    /* Secondary Text - WCAG AA */
```

### Semantic Colors
```css
--color-success: #059669   /* Green - Actions, Success */
--color-danger: #DC2626    /* Red - Errors, Delete */
--color-info: #0369A1      /* Blue - Information */
--color-warning: #D97706   /* Orange - Warnings */
```

### Selection States
```css
--color-selected: #D1FAE5           /* Light Green Background */
--color-selected-border: #059669    /* Green Border */
```

---

## 📏 Spacing Scale (8pt Grid)

```css
--space-1: 0.5rem   /* 8px  - Tight spacing */
--space-2: 1rem     /* 16px - Base spacing */
--space-3: 1.5rem   /* 24px - Medium spacing */
--space-4: 2rem     /* 32px - Large spacing */
--space-6: 3rem     /* 48px - Section spacing */
--space-8: 4rem     /* 64px - Hero spacing */
--space-12: 6rem    /* 96px - Extra large */
```

### Usage Examples
```css
padding: var(--space-2);              /* Small padding */
margin-bottom: var(--space-4);        /* Medium gap */
padding: var(--space-6) var(--space-4); /* Vertical/Horizontal */
```

---

## 🔤 Typography

### Font Families
```css
--font-display: 'Playfair Display', Georgia, serif;
--font-body: 'Inter', -apple-system, sans-serif;
```

### Usage
```css
/* Headers - Theatrical, Elegant */
font-family: var(--font-display);
font-weight: 700-900;
letter-spacing: -0.02em;

/* Body - Modern, Readable */
font-family: var(--font-body);
font-weight: 400-600;
line-height: 1.7;
```

### Responsive Sizes
```css
/* Hero Headline - Fluid 40-64px */
font-size: clamp(2.5rem, 5vw, 4rem);

/* Section Title */
font-size: 2rem;      /* 32px */

/* Body */
font-size: 1rem;      /* 16px */

/* Small */
font-size: 0.9375rem; /* 15px */
```

---

## 🌓 Shadows

```css
/* Subtle - Cards */
--shadow-sm: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04);

/* Medium - Hover States */
--shadow-md: 0 4px 6px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.03);

/* Large - Modals, Containers */
--shadow-lg: 0 20px 25px rgba(0,0,0,0.08), 0 10px 10px rgba(0,0,0,0.02);
```

---

## 🔵 Border Radius

```css
--radius-sm: 8px    /* Buttons, Small Cards */
--radius-md: 16px   /* Medium Cards, Sections */
--radius-lg: 24px   /* Main Container */
```

---

## ⚡ Transitions

```css
--transition-fast: 0.15s cubic-bezier(0.4, 0, 0.2, 1);
--transition-base: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
--transition-slow: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
--transition-bounce: 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
```

### Easing Curves
- **cubic-bezier(0.4, 0, 0.2, 1)** - Material Design ease-out
- **cubic-bezier(0.34, 1.56, 0.64, 1)** - Bounce effect (stars)

---

## 🎯 Component Patterns

### Button
```css
.btn {
    padding: 1rem 2rem;
    border-radius: var(--radius-sm);
    font-family: var(--font-body);
    font-weight: 600;
    transition: all var(--transition-base);
}

.btn:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
}

.btn:focus {
    outline: 3px solid var(--color-primary);
    outline-offset: 2px;
}
```

### Card
```css
.card {
    background: var(--color-surface);
    border: 1px solid #E5E5E5;
    border-radius: var(--radius-md);
    padding: var(--space-4);
    box-shadow: var(--shadow-sm);
    transition: box-shadow var(--transition-slow);
}

.card:hover {
    box-shadow: var(--shadow-md);
}
```

### Input/Textarea
```css
input, textarea {
    padding: var(--space-2);
    border: 2px solid #E5E5E5;
    border-radius: var(--radius-sm);
    font-family: var(--font-body);
    transition: border-color var(--transition-base);
}

input:focus, textarea:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.2);
}
```

---

## ♿ Accessibility Requirements

### Color Contrast
- **Normal Text:** Minimum 4.5:1 ratio
- **Large Text (18px+):** Minimum 3:1 ratio
- **Use:** `--color-text-muted` (#595959) for guaranteed compliance

### Focus Indicators
```css
/* REQUIRED on all interactive elements */
:focus {
    outline: 3px solid var(--color-primary);
    outline-offset: 2px;
}
```

### Touch Targets
- **Minimum:** 44x44px
- **Recommended:** 48x48px

```css
.interactive-element {
    min-width: 44px;
    min-height: 44px;
    padding: var(--space-1);
}
```

### ARIA Labels
```html
<!-- Buttons -->
<button aria-label="Delete sound file">🗑️</button>

<!-- Form Elements -->
<input aria-label="Search for sounds" />

<!-- Navigation -->
<nav aria-label="Main navigation"></nav>

<!-- Interactive Regions -->
<div role="button" aria-expanded="false">Toggle</div>
```

---

## 📱 Responsive Breakpoints

### Mobile First Approach
```css
/* Mobile (default) */
font-size: 1rem;
padding: var(--space-2);

/* Tablet (768px+) */
@media (min-width: 768px) {
    font-size: 1.125rem;
    padding: var(--space-4);
}

/* Desktop (1024px+) */
@media (min-width: 1024px) {
    font-size: 1.25rem;
    padding: var(--space-6);
}
```

### Current Breakpoints
```css
/* Tablet and Below */
@media (max-width: 768px) {
    /* Stacked layouts */
    /* Reduced spacing */
    /* Full-width buttons */
}

/* Mobile Only */
@media (max-width: 480px) {
    /* Minimal spacing */
    /* Smaller typography */
    /* Simplified interactions */
}
```

---

## 🎨 Theme Variations

### User Interface (index.html)
- Primary: Theatrical Gold (#D4AF37)
- Accent: Success Green (#059669)
- Background: Subtle gold texture

### Admin Panel (admin.html)
- Primary: Admin Red (#DC2626)
- Accent: Info Blue (#0369A1)
- Background: Subtle red texture

### Easy Theme Customization
To change themes, just update the CSS variables:

```css
:root {
    --color-primary: #YOUR_COLOR;
    --color-primary-dark: #DARKER_VERSION;
    /* All components automatically update! */
}
```

---

## 🔧 Utility Classes (Optional Additions)

If you want to add utility classes for faster development:

```css
/* Spacing */
.mt-2 { margin-top: var(--space-2); }
.mb-4 { margin-bottom: var(--space-4); }
.p-3 { padding: var(--space-3); }

/* Text */
.text-muted { color: var(--color-text-muted); }
.text-center { text-align: center; }
.font-display { font-family: var(--font-display); }

/* Display */
.flex { display: flex; }
.grid { display: grid; }
.hidden { display: none; }
```

---

## 💡 Best Practices

### 1. Use Design Tokens
```css
/* ❌ Bad */
padding: 20px;
color: #666;

/* ✅ Good */
padding: var(--space-4);
color: var(--color-text-muted);
```

### 2. Maintain Spacing Scale
```css
/* ❌ Bad */
margin-bottom: 17px;

/* ✅ Good */
margin-bottom: var(--space-2);  /* or --space-3 */
```

### 3. Accessible Focus
```css
/* ❌ Bad */
button:focus {
    outline: none;
}

/* ✅ Good */
button:focus {
    outline: 3px solid var(--color-primary);
    outline-offset: 2px;
}
```

### 4. Responsive Typography
```css
/* ❌ Bad */
h1 { font-size: 48px; }

/* ✅ Good */
h1 { font-size: clamp(2rem, 5vw, 4rem); }
```

---

## 📚 Further Reading

- **Typography:** [Google Fonts - Inter](https://fonts.google.com/specimen/Inter)
- **Typography:** [Google Fonts - Playfair Display](https://fonts.google.com/specimen/Playfair+Display)
- **Accessibility:** [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- **Color Contrast:** [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- **Material Design:** [Material Design Easing](https://material.io/design/motion/speed.html)

---

**Design System v1.0**
Built for It's A Wonderful Life Sound Manager

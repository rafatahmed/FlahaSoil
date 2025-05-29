# FlahaSoil Navigation & Branding - Quick Reference

## 🚀 Quick Start

### Standard Navigation HTML

```html
<nav class="navbar flaha-navbar">
    <div class="nav-container">
        <div class="nav-logo">
            <a href="./landing.html" class="logo-link">
                <img src="./assets/img/logo/flaha_pa_logo.svg" alt="Flaha PA" class="logo-img">
                <div class="logo-text">
                    <span class="flaha-text">FLAHA</span>
                    <span class="pa-text">PA</span>
                    <span class="app-name">FlahaSoil</span>
                </div>
            </a>
        </div>
        
        <!-- Mobile Toggle -->
        <button class="mobile-nav-toggle" onclick="toggleMobileNav()" aria-label="Toggle navigation">
            <span></span>
            <span></span>
            <span></span>
        </button>
        
        <!-- Navigation Menu -->
        <div class="nav-menu" id="navMenu">
            <a href="./index.html" class="nav-link">Soil Analysis</a>
            <a href="./demo.html" class="nav-link">Basic Demo</a>
            <a href="./advanced-demo.html" class="nav-link">Advanced Features</a>
            <a href="./profile.html" class="nav-link">Profile</a>
        </div>
        
        <!-- Auth Section -->
        <div class="nav-auth">
            <span id="user-info" class="user-info"></span>
            <button id="auth-btn" class="btn btn-primary">Sign In</button>
        </div>
    </div>
</nav>
```

### Required CSS Include

```html
<link rel="stylesheet" href="./assets/css/style.css">
```

### Mobile Navigation JavaScript

```javascript
function toggleMobileNav() {
    const navMenu = document.getElementById('navMenu');
    const mobileToggle = document.querySelector('.mobile-nav-toggle');
    
    if (navMenu && mobileToggle) {
        navMenu.classList.toggle('mobile-open');
        
        // Animate hamburger menu
        const spans = mobileToggle.querySelectorAll('span');
        if (navMenu.classList.contains('mobile-open')) {
            spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
            spans[1].style.opacity = '0';
            spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
        } else {
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
        }
    }
}

// Auto-close on outside click
document.addEventListener('click', function(event) {
    const navMenu = document.getElementById('navMenu');
    const mobileToggle = document.querySelector('.mobile-nav-toggle');
    
    if (navMenu && mobileToggle && 
        !navMenu.contains(event.target) && 
        !mobileToggle.contains(event.target) &&
        navMenu.classList.contains('mobile-open')) {
        toggleMobileNav();
    }
});
```

## 🎨 Brand Colors

```css
:root {
    --flaha-green: #2e7d32;    /* Primary brand color */
    --tech-blue: #1976d2;      /* Secondary brand color */
    --dark-bg: #2c3e50;        /* Dark backgrounds */
    --white: #ffffff;          /* Text on dark backgrounds */
}
```

## 📱 Page Types & Navigation

| Page | File | Navigation Type | Key Features |
|------|------|----------------|--------------|
| **Landing** | `landing.html` | Marketing navbar | Hero, pricing, testimonials |
| **Main App** | `index.html` | App header | Soil analysis, user section |
| **Profile** | `profile.html` | Professional navbar | Account management |
| **Demo** | `demo.html` | Demo header | Public demo, CTAs |
| **Advanced** | `advanced-demo.html` | Full navbar | Feature showcase |

## 🔧 Common Tasks

### Adding a New Page

1. Copy navigation HTML from template above
2. Include `style.css`
3. Add mobile navigation JavaScript
4. Update navigation links to include new page
5. Test on mobile devices

### Updating Logo

1. Replace `./assets/img/logo/flaha_pa_logo.svg`
2. Clear browser cache
3. Test across all pages

### Changing Brand Colors

1. Update CSS custom properties in `:root`
2. Test contrast ratios
3. Verify accessibility compliance

## 📋 Testing Checklist

- [ ] Logo displays correctly on all pages
- [ ] Mobile navigation works on all devices
- [ ] Hover effects function properly
- [ ] Text is readable on all backgrounds
- [ ] Links navigate to correct pages
- [ ] Responsive design works on all screen sizes

## 🐛 Common Issues & Fixes

### Logo Not Showing
```bash
# Check file path
./assets/img/logo/flaha_pa_logo.svg

# Verify in browser console
console.log(document.querySelector('.logo-img').src);
```

### Mobile Menu Not Working
```javascript
// Check if JavaScript is loaded
console.log(typeof toggleMobileNav);

// Verify elements exist
console.log(document.getElementById('navMenu'));
console.log(document.querySelector('.mobile-nav-toggle'));
```

### Styling Issues
```css
/* Check CSS specificity */
.flaha-navbar .nav-link {
    color: rgba(255, 255, 255, 0.9) !important;
}

/* Clear cache and hard refresh */
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)
```

## 📞 Support

- **Documentation**: `docs/NAVIGATION_BRANDING_GUIDE.md`
- **Code Examples**: See individual page implementations
- **Testing**: Use browser developer tools for debugging

---

*For detailed implementation guide, see [NAVIGATION_BRANDING_GUIDE.md](./NAVIGATION_BRANDING_GUIDE.md)*

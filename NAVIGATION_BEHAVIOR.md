# Navigation Behavior Summary

## Desktop Navigation (md screens and up - 768px+)
- **Visible Elements**: Full horizontal navigation bar
- **Logo**: FDC logo on the left
- **Navigation Items**: All visible with icons and labels
  - New Mission button (blue)
  - Mission progress indicator (when active mission exists)
  - Dashboard, Calculator, History, Tables, Settings
- **Hamburger Menu**: Hidden (not shown)

## Mobile Navigation (sm screens and below - <768px)
- **Visible Elements**: Collapsed navigation with hamburger menu
- **Logo**: FDC logo on the left
- **Mobile Controls**: 
  - Current mission indicator (compact, when active)
  - Hamburger menu button (three lines / X)
- **Navigation Items**: Hidden by default, shown in dropdown when hamburger clicked
- **Mobile Menu**: Slides down below header when opened
  - New Mission button (full width)
  - All navigation items with icons and full labels

## Responsive Breakpoints
- Uses Tailwind CSS `md:` prefix (768px) as the main breakpoint
- `hidden md:flex` - Hidden on mobile, flex on desktop
- `md:hidden` - Visible on mobile, hidden on desktop

## Key Classes Used
- Desktop nav: `hidden md:flex`
- Mobile controls: `md:hidden`
- Mobile menu: `md:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`

This ensures clean separation between mobile and desktop experiences without overlap.

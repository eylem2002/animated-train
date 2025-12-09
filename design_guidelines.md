# VisionFlow Design Guidelines

## Design Approach

**Reference-Based Approach**: Drawing inspiration from Notion (clean productivity), Pinterest (visual inspiration), Linear (modern aesthetics), and Miro (canvas editing).

**Core Principles**:
- Desktop-first 3D editing experience with mobile-friendly 2D fallback
- Generous whitespace with purposeful visual hierarchy
- Sophisticated canvas-based interactions balanced with simple list/card views
- Visual storytelling through imagery and 3D spatial design

## Typography System

**Font Stack**: Inter (UI elements, body text) + Cal Sans or similar display font (hero headlines, board titles)

**Hierarchy**:
- Display: 56px / 700 weight (landing hero)
- H1: 36px / 700 (page titles, board names)
- H2: 24px / 600 (section headers, goal titles)
- H3: 18px / 600 (card titles, subsections)
- Body: 15px / 400 (primary content)
- Small: 13px / 400 (metadata, timestamps, helper text)
- Caption: 11px / 500 uppercase with letter-spacing (labels, badges)

## Layout & Spacing System

**Tailwind Units**: Consistent use of 2, 4, 6, 8, 12, 16, 20, 24 for spacing

**Key Patterns**:
- Container max-width: `max-w-7xl` for main content, `max-w-4xl` for text-focused views
- Section padding: `py-20` desktop, `py-12` mobile
- Card padding: `p-6` for standard cards, `p-8` for feature cards
- Gap spacing: `gap-4` for tight grids, `gap-6` for comfortable spacing, `gap-8` for hero sections

## Core Page Layouts

### Landing Page
**Structure**: Full-width hero with 3D preview → Features grid → Public gallery showcase → CTA

**Hero Section** (h-screen):
- Large centered headline with display typography
- Subheadline (20px) explaining the vision board concept
- Dual CTAs: Primary "Start Creating" + Secondary "Explore Gallery"
- Animated 3D mockup preview (subtle rotation) positioned on right side

**Features Section** (`py-24`):
- 3-column grid (`grid-cols-1 md:grid-cols-3 gap-8`)
- Each feature card: icon (48px), title (H3), description (Body), optional micro-interaction on hover
- Features: "3D Vision Boards", "AI Goal Planning", "Track & Achieve"

**Public Gallery Preview** (`py-20`):
- Masonry grid layout (Pinterest-style) using CSS columns or grid with varying heights
- 3-4 columns on desktop, 2 on tablet, 1 on mobile
- Cards show: cover image, board title, creator avatar, like/view counts
- Hover: subtle lift effect (`hover:shadow-xl hover:-translate-y-1`)

### Main Application Layout
**Structure**: Fixed sidebar navigation (240px) + Main content area + Contextual right panel (320px, collapsible)

**Left Sidebar**:
- Logo/brand (h-16)
- Navigation items with icons (Heroicons): Home, My Boards, Goals, Calendar, Challenges
- User profile at bottom with avatar + name
- "New Board" button (full-width, prominent)

**Top Navigation Bar** (within main content):
- Breadcrumbs for context
- Search input (when applicable)
- Action buttons: Share, Export, AI Assistant
- Notification bell + profile dropdown

### 3D Board Editor
**Layout**: Full-screen canvas experience with overlay UI

**Canvas Area**:
- 100% viewport height, immersive 3D room environment
- Subtle grid floor, neutral walls with texture
- Floating toolbar (bottom-left): View controls, Add Asset, Grid/Snap toggle
- Minimap (top-right corner, 160px × 120px)

**Left Toolbar** (overlaid, `w-72`, semi-transparent backdrop blur):
- Asset library tabs: Upload, Stock Images, Text, Embeds
- Drag-drop interface with thumbnail previews
- Upload zone with progress indicators

**Right Properties Panel** (overlaid, `w-80`, appears when asset selected):
- Asset preview thumbnail
- Transform controls: Position (X,Y,Z sliders), Scale, Rotation
- Link to Goal dropdown
- Tags input field
- Delete button (destructive style)

**Mode Switcher** (top-left):
- Toggle buttons: 3D Room | 2D Canvas | Timeline
- Clean segmented control design

### Goals & Tasks View
**Layout**: Split view - Goals list (left 40%) + Selected goal detail (right 60%)

**Goals List**:
- Card-based with progress ring (96px diameter)
- Goal title (H3), target date, category badge
- Sort/filter controls at top
- Add Goal button (floating action button style)

**Goal Detail Panel**:
- Large progress ring (180px) with percentage
- Tabbed interface: Overview, Tasks, Habits, Journal
- Tasks section: Checklist with checkboxes, add task inline input
- Habit grid: 7-day quick view with streak counter

### Calendar/Habit Tracker
**Layout**: Full calendar month view with left sidebar for habit list

**Calendar Grid**:
- 7×5 grid (Sunday-Saturday)
- Each day cell: date number, 3-4 habit dots (visual indicators)
- Current day highlighted with border
- Color intensity shows completion rate (use opacity/saturation)

**Habit Quick Actions** (left sidebar, `w-64`):
- Today's habits as checklist
- Large checkboxes with satisfying completion animation
- Streak numbers prominently displayed

### Public Feed/Gallery
**Layout**: Masonry grid with filters

**Filter Bar** (`sticky top-0`):
- Horizontal scrolling category chips
- Search input
- Sort dropdown (Trending, New, Popular)

**Masonry Grid**:
- Dynamic column count based on viewport
- Card components: Image cover (16:9 or 1:1 aspect), board title overlay, creator info, engagement metrics
- Infinite scroll loading pattern

## Component Library

### Cards
- Standard: `rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow`
- Feature: `rounded-2xl p-8 border border-gray-200`
- Board: `rounded-xl overflow-hidden` (image fills, content overlays)

### Buttons
- Primary: Large (`px-6 py-3`), rounded-lg, medium weight
- Secondary: Outlined style, same padding
- Icon buttons: Square (`w-10 h-10`), centered icon
- Floating Action: Large circular (`w-14 h-14`), fixed position with shadow

### Form Inputs
- Consistent height: `h-12` for text inputs
- Rounded corners: `rounded-lg`
- Clear focus states with ring
- Labels above inputs, helper text below

### Modals/Dialogs
- Max width: `max-w-2xl` for standard, `max-w-4xl` for complex
- Backdrop blur effect
- Slide-up animation on mobile, fade-in on desktop

### Progress Indicators
- Circular rings: Use SVG with animated stroke-dashoffset
- Linear bars: Rounded ends, smooth transitions
- Streak counters: Large numbers with fire/flame iconography

### Avatars
- Sizes: 32px (small), 40px (standard), 64px (large), 96px (profile)
- Rounded-full with subtle border

## Visual Interactions

**Animations** (Framer Motion):
- Page transitions: Subtle fade (200ms)
- Card hover: Lift + shadow (`duration-200`)
- Asset drop: Scale bounce on placement
- Goal completion: Confetti burst (celebrate.js or similar)
- Loading states: Skeleton screens with shimmer

**3D Canvas Interactions**:
- Drag-drop: Snap-to-grid feedback, ghost preview
- Transform: Smooth lerp transitions (300ms)
- Camera: Damped orbit controls, no jarring movements
- Asset selection: Glow outline or subtle highlight

## Responsive Behavior

**Desktop (lg+)**: Full 3-column layouts, 3D editor primary experience

**Tablet (md)**: 2-column grids, collapsible right panel, simplified 3D controls

**Mobile (base)**: 
- Single column everything
- 2D canvas mode only (3D too complex)
- Bottom sheet modals instead of side panels
- Pinch-zoom for canvas
- Hamburger menu for navigation

## Accessibility
- Keyboard navigation: Tab through canvas objects, arrow keys for transform
- ARIA labels for all icon buttons and canvas controls
- Focus visible states (ring-2 ring-offset-2)
- Skip-to-content link
- Alt text required for all uploaded images
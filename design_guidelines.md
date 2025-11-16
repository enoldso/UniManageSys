# School Uniform Management System - Design Guidelines

## Design Approach: Material Design System with SaaS Dashboard Refinement

**Selected Framework:** Material Design adapted for educational/enterprise context
**Key References:** Google Admin Console, Notion dashboards, Linear's data tables
**Principle:** Clean, professional, data-focused interface prioritizing efficiency and clarity over decorative elements

---

## Typography System

**Font Stack:**
- Primary: Inter (via Google Fonts CDN)
- Monospace: JetBrains Mono (for order/transaction IDs)

**Hierarchy:**
- Page Headers: text-3xl font-bold
- Section Titles: text-xl font-semibold
- Card Headers: text-lg font-medium
- Body Text: text-base font-normal
- Table Headers: text-sm font-semibold uppercase tracking-wide
- Helper Text: text-sm text-gray-600
- Data/Numbers: text-base font-medium (for emphasis on metrics)

---

## Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, 8, 12, 16 only
- Component padding: p-4, p-6
- Section spacing: gap-8, space-y-8
- Card spacing: p-6
- Form field spacing: space-y-4
- Grid gaps: gap-4, gap-6

**Container Structure:**
- Dashboard Shell: Sidebar (w-64) + Main Content Area (flex-1)
- Content Max Width: max-w-7xl mx-auto
- Card Components: Contained within bg-white rounded-lg shadow

**Grid Patterns:**
- Stats Dashboard: grid-cols-1 md:grid-cols-2 lg:grid-cols-4
- Data Cards: grid-cols-1 lg:grid-cols-2
- School Selection: grid-cols-1 md:grid-cols-2 lg:grid-cols-3

---

## Component Library

### Navigation
- **Sidebar:** Fixed left navigation with school/seller logo at top, main nav items with icons (Heroicons), active state with left border indicator
- **Top Bar:** School/seller name, user profile dropdown, notifications badge
- **Tab Navigation:** Underline style for switching between sections (Students, Inventory, Orders)

### Data Display
- **Tables:** Striped rows, hover states, sticky headers for long lists, sortable columns with arrow indicators
- **Cards:** Subtle shadow, rounded corners (rounded-lg), clear header/content/footer sections
- **Stats Cards:** Large number display (text-3xl font-bold), label below, icon in top-right corner
- **Status Badges:** Rounded-full px-3 py-1 text-sm with semantic backgrounds (green for good, yellow for repair needed, red for critical)

### Forms & Inputs
- **Text Inputs:** Border style with focus ring, label above input (text-sm font-medium mb-2)
- **Select Dropdowns:** Custom styled with chevron icon
- **Search Bars:** With magnifying glass icon (Heroicons), placeholder text
- **Action Buttons:** Primary (solid), Secondary (outlined), Danger (red for delete actions)
- **Multi-select:** Tag-style selections with remove × icon

### Specialized Components
- **M-Pesa Payment Modal:** Centered overlay with phone number input, amount display (large, bold KES prefix), step indicators (1. Enter Phone → 2. Confirm → 3. Complete)
- **Inventory Stock Indicator:** Progress bar showing stock level with threshold warnings
- **Student Profile Card:** Avatar placeholder, student details grid, uniform status list
- **Repair Timeline:** Vertical timeline with status checkpoints (Reported → In Progress → Complete)
- **Schedule Calendar:** Month view with delivery/repair dates marked

### Overlays
- **Modals:** Centered, max-w-2xl, backdrop blur, slide-up animation entry
- **Confirmations:** Smaller modal (max-w-md) for delete/approve actions
- **Toast Notifications:** Top-right corner for success/error messages

---

## Dashboard-Specific Patterns

**School Portal Layout:**
1. **Dashboard Home:** 4-stat grid (Total Students, Uniforms Issued, Pending Payments, Repair Requests), Recent Activity list, Quick Actions
2. **Student Management:** Search/filter bar, data table with pagination, quick-add button (floating action)
3. **Payment Tracking:** Filter by status, list view with payment details, M-Pesa integration button per student

**Seller Portal Layout:**
1. **Multi-School Dashboard:** School selector dropdown, aggregated inventory view across schools, low-stock alerts
2. **Resupply Scheduler:** Calendar view with drag-drop scheduling, school filter, delivery status workflow
3. **Repair Tracking:** Kanban board style (Pending → In Progress → Completed), school grouping

**Responsive Behavior:**
- Mobile: Sidebar collapses to hamburger menu, stats stack vertically, tables convert to card view
- Tablet: 2-column layouts, condensed sidebar

---

## Icons

**Library:** Heroicons (via CDN)
**Common Icons:** 
- Home, Users, ShoppingBag, Calendar, Clipboard, Bell, ChevronDown, Search, Plus, Pencil, Trash, Check, X

---

## Images

**No hero images** - This is a utility application focused on data management.

**Visual Elements:**
- School logos: Small (h-10 w-10) in sidebar header and school selector
- Student avatars: Circular placeholders (h-12 w-12) in student lists/profiles
- Empty states: Simple illustration placeholders (max-w-sm) for empty tables/no data scenarios

---

**Animation:** Minimal - only subtle transitions on hover states (transition-colors duration-200) and modal enter/exit animations. No decorative animations.
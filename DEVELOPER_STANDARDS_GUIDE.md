# Fansocial Admin Panel - Developer Standards Guide

## Overview

This guide outlines the mandatory standards and patterns for developing pages in the Fansocial Admin Panel. These standards ensure consistency, maintainability, and prevent the issues we've seen with inconsistent implementations.

**⚠️ CRITICAL: Follow these standards exactly. Do not deviate from established patterns.**

**REUSE EVERYTHING: The main principle of this guide is to reuse existing components, patterns, and styles. When you see a UI pattern in the admin panel, it already has a component - find and use it instead of creating custom solutions.**

---

## 1. Page Creation Standards

### ✅ DO: Follow the Standard Structure

Every page MUST use this exact structure:

```
page/your-section/
├── index.html      # HTML template with API config
├── script.js       # Page logic using waitForAdminShell pattern
├── style.css       # Page-specific styles (minimal, if needed)
└── data.json       # Mock data for development
```

### ❌ DON'T: Create Non-Standard Structures

- Don't create pages without all four files
- Don't put scripts in different locations
- Don't skip the API config script tag
- Don't hardcode HTML in JavaScript

### ✅ DO: Use PageRenderer Pattern

```javascript
(function () {
  function waitForAdminShell() {
    return new Promise((resolve) => {
      if (window.AdminShell && window.AdminShell.pageContent) {
        resolve();
      } else {
        document.body.addEventListener("adminshell:ready", resolve, { once: true });
      }
    });
  }

  waitForAdminShell().then(() => {
    const PAGE_CONFIG = {
      section: "your-section",
      tableConfig: YOUR_TABLE_CONFIG,
      pagination: { enabled: true, pageSize: 20 },
      tabs: [
        { id: "all", label: "All" },
        { id: "active", label: "Active", statusFilter: "active" }
      ]
    };

    window.PageRenderer.init(PAGE_CONFIG);
  });
})();
```

### ❌ DON'T: Use Custom Page Logic

- Don't manually create tables with `window.Table.create()`
- Don't manually handle pagination
- Don't manually implement filtering
- Don't bypass PageRenderer

---

## 2. Pagination Standards

### ✅ DO: Enable Pagination in PageRenderer Config

```javascript
const PAGE_CONFIG = {
  section: "your-section",
  tableConfig: YOUR_TABLE_CONFIG,
  pagination: {
    enabled: true,
    pageSize: 20
  }
};
```

### ❌ DON'T: Implement Custom Pagination

- Don't manually handle page buttons
- Don't manually calculate offsets
- Don't implement "Load More" buttons
- Don't disable pagination without approval

---

## 3. Filters Slide-In Standards

### ✅ DO: Use FilterPanel Component

The FilterPanel automatically creates a slide-in offcanvas from the right. No custom implementation needed.

- Filters are defined in `assets/js/core/config.js`
- FilterPanel is initialized automatically by admin.js
- Slide-in appears when filter button is clicked

### ❌ DON'T: Create Custom Filter UIs

- Don't create custom filter panels
- Don't implement inline filters
- Don't use modal dialogs for filters
- Don't bypass the FilterPanel component

---

## 4. Filtering with Chips Standards

### ✅ DO: Let Chips Render Automatically

After applying filters through FilterPanel:

- Chips appear automatically above the table
- Each chip shows "key: value"
- Chips have remove (×) buttons
- Reset button appears when filters are active

### ❌ DON'T: Implement Custom Chip Logic

- Don't manually create chip HTML
- Don't manually handle chip removal
- Don't hide the reset button
- Don't implement custom filter indicators

---

## 5. Environment Configuration Standards

### ✅ DO: Configure Endpoints in HTML

Every page MUST have this exact script tag in `index.html`:

```html
<script type="application/json" id="api-config">
{
  "your-section": {
    "prod": { "endpoint": "/your-section" },
    "stage": { "endpoint": "/your-section" },
    "dev": { "endpoint": "" }
  }
}
</script>
```

### ✅ DO: Use Relative Paths

- Use `"/section-name"` for API endpoints
- Let global base URLs handle environment differences
- Global URLs are configured in `assets/js/core/config.js`

### ❌ DON'T: Hardcode URLs

- **NEVER** hardcode `localhost:3000` in JavaScript
- **NEVER** hardcode `209.38.24.155:3000` in code
- **NEVER** put full URLs in page scripts
- **NEVER** use `window.location.hostname` for API calls

### ❌ DON'T: Skip API Config

- Don't load pages without the API config script tag
- Don't assume fallback URLs
- Don't put config in JavaScript files

---

## 6. Reference: Demo Page Pattern

### ✅ DO: Copy the Demo Page Structure

The `page/demo/` folder is the **authoritative reference** for correct implementation:

- **HTML**: Standard script loading order, API config
- **Script**: PageRenderer.init() with config object
- **Config**: section, tableConfig, pagination, tabs
- **Data**: Simple JSON array for mock data

### ❌ DON'T: Deviate from Demo Pattern

- Don't modify the demo page
- Don't create "improved" versions
- Don't skip any part of the demo structure

---

## 7. View All / Data Slide-In Standards

### ✅ DO: Use ModalViewer Component

For "View All" or "Data" buttons in table actions:

```javascript
actions: [
  {
    label: "View All",
    className: "btn btn-sm btn-outline-primary",
    onClick: "handleViewAll"
  }
]
```

Then in your handlers:

```javascript
function handleViewAll(rowData) {
  // Use ModalViewer to show data
  window.ModalViewer.showJson(JSON.stringify(rowData));
}
```

### ❌ DON'T: Create Custom Modals

- Don't implement custom modal HTML
- Don't use Bootstrap modals directly
- Don't create slide-in panels manually
- Don't bypass ModalViewer component

---

## 8. Guides Documentation Standards

### ✅ DO: Write Plain Text Guides

- Use Markdown format (.md files)
- No custom CSS styling
- No embedded HTML
- Clear, concise language
- Include code examples with proper formatting

### ❌ DON'T: Style Guide Documents

- Don't add custom CSS classes
- Don't use colored text or backgrounds
- Don't embed images or complex formatting
- Don't create styled HTML documents

---

## 9. Tabs Implementation Standards

### ✅ DO: Use PageRenderer Tabs Config

```javascript
const PAGE_CONFIG = {
  section: "your-section",
  tableConfig: YOUR_TABLE_CONFIG,
  tabs: [
    { id: "all", label: "All" },
    { id: "active", label: "Active", statusFilter: "active" },
    { id: "inactive", label: "Inactive", statusFilter: "inactive" }
  ]
};
```

### ✅ DO: Include Counts in Tab Labels

When rendering tabs manually (if needed), include counts:

```javascript
{ id: "all", label: "All (5)" }
{ id: "active", label: "Active (3)" }
```

### ❌ DON'T: Implement Custom Tab Logic

- Don't manually create tab HTML
- Don't manually handle tab switching
- Don't bypass PageRenderer tabs
- Don't implement tabs without statusFilter when applicable

---

## 10. Counts Display Standards

### ✅ DO: Show Counts in Tab Labels

- Use format: "Tab Name (count)"
- Update counts when data changes
- Show "0" when no items

### ✅ DO: Show Total Counts

- Display total items in table footer
- Update counts after filtering
- Show "No items found" when empty

### ❌ DON'T: Hide Counts

- Don't show tabs without counts
- Don't display empty states without messaging
- Don't hide total counts

---

## 11. Styling Standards

### ✅ DO: Use Bootstrap for All Styling

- Use Bootstrap classes exclusively for styling
- All buttons, forms, layouts, and components must use Bootstrap
- Reference Bootstrap documentation for available classes
- No custom CSS frameworks or libraries

### ✅ DO: Keep Custom Styling Minimal

- Custom CSS in `style.css` should be minimal and targeted
- Only override Bootstrap when absolutely necessary
- Prefer Bootstrap utility classes over custom CSS
- Custom styles should be for page-specific layouts only

### ❌ DON'T: Override Bootstrap Classes

- Don't create custom button styles that replace Bootstrap
- Don't override Bootstrap colors, spacing, or typography globally
- Don't create custom form controls that mimic Bootstrap
- Don't implement custom grid systems

### ✅ DO: Use Simple Button Colors

**Primary Colors Only:**
- `btn-primary` (blue) - Main actions, submit buttons
- `btn-outline-primary` (blue outline) - Secondary actions, view buttons
- `btn-success` (green) - Approve, confirm actions
- `btn-danger` (red) - Delete, reject actions
- `btn-secondary` (gray) - Cancel, reset actions

**Avoid These:**
- `btn-warning` (yellow/orange)
- `btn-info` (light blue)
- `btn-light` / `btn-dark`
- Custom colored buttons

### ✅ DO: Use Blue and White Most Places

- **Primary blue** (`btn-primary`) for main actions
- **White backgrounds** for content areas
- **Light grays** for secondary elements
- Avoid colorful designs - keep it professional and minimal

### ✅ DO: Use Existing Slide-Ins

**Filter Slide-In:**
- Automatically provided by FilterPanel component
- Slides in from the right as offcanvas
- Don't add custom logic or styling

**Data Preview Slide-In:**
- Use ModalViewer component for "Data" or "View All" buttons in tables
- Shows JSON/HTML content in a Bootstrap modal
- Triggered by `data-view-json` or `data-view-html` attributes
- Example: Clicking "Data" button in moderation table shows row data in modal

**Follow Demo Pages for Style Guides:**
- Copy styling patterns exactly from `page/demo/`
- Use same button classes, spacing, and layout
- Don't create custom styling solutions
- Reference existing pages for consistent appearance

### ❌ DON'T: Create Custom Slide-Ins or Modals

- Don't implement custom offcanvas panels for filters
- Don't create custom modal implementations for data preview
- Don't add custom animations or transitions
- Don't bypass ModalViewer for "Data preview" button functionality
- Don't create custom slide-in solutions when components already exist

### ❌ DON'T: Add Custom Logic to Slide-Ins

- Don't modify FilterPanel behavior or styling
- Don't add custom event handlers to data preview modals
- Don't override modal positioning, sizing, or appearance
- Don't add custom close/dismiss logic to existing modals
- Don't implement custom data display solutions

---

## 12. Component Reuse Standards

### ✅ DO: Reuse Everything - Never Create Custom Solutions

**The fundamental rule: If a UI pattern exists in the admin panel, reuse the existing component instead of creating a custom implementation.**

**Examples of What to Reuse:**

- **Slide-ins for filters** → Use FilterPanel component
- **Slide-ins for data preview** → Use ModalViewer component with `data-view-json`
- **Tables** → Use PageRenderer with tableConfig
- **Pagination** → Enable in PageRenderer config
- **Tabs** → Define in PageRenderer config
- **Chips** → Automatic with FilterPanel
- **Spinners** → Use `window.AdminUtils.spinner()`
- **Buttons** → Use Bootstrap classes only

**When you see a "Data" button in tables (like in moderation), it uses ModalViewer - don't create custom modals.**

**Follow Demo Page Patterns:**
- Copy the exact structure from `page/demo/`
- Use same PageRenderer config patterns
- Apply same styling and button classes
- Don't modify or improve existing patterns

### ❌ DON'T: Implement Custom UI Solutions

- Don't create custom modal implementations when ModalViewer exists
- Don't build custom table components when PageRenderer handles tables
- Don't implement custom pagination when PageRenderer provides it
- Don't create custom filter UIs when FilterPanel exists
- Don't add custom styling when Bootstrap classes suffice

**If you need a UI pattern, check existing pages first - it probably already exists as a reusable component.**

---

## 13. Code Quality Standards

### ✅ DO: Follow Formatting Instructions

- Read and follow `formatting/FORMATTING_INSTRUCTIONS.md`
- Use descriptive variable names (no abbreviations)
- Add comments before every line of code
- Use single comments only (no double/triple comments)
- Follow industry-standard spacing

### ✅ DO: Use Established Components

- `window.ApiService` (not `window.DataService`)
- `window.AdminUtils.spinner()` (not custom spinners)
- `window.Table.create()` for manual tables
- `window.ModalViewer` for modals

### ❌ DON'T: Create New Components

- Don't create new utility functions
- Don't implement custom table logic
- Don't bypass established components
- Don't duplicate existing functionality

---

## 14. API Call Standards

### ✅ DO: Use ApiService for All Data Fetching

**Any API calls MUST go through `window.ApiService` in the pages.** This ensures consistency in error handling, environment configuration, and data transformation.

- Use `window.ApiService.get(sectionName, options)` for standard data fetching
- Use `window.ApiService.getTotalCount(sectionName, filters)` for getting item counts
- Let the `ApiService` handle relative paths and environment-specific base URLs

### ❌ DON'T: Use Direct fetch() or XMLHttpRequest

- **NEVER** use the native `fetch()` API directly in page scripts
- **NEVER** use `axios`, `jQuery.ajax()`, or other external libraries for core API calls
- **NEVER** bypass the standard API configuration pattern

---

## Development Workflow

1. **Copy demo page structure** - Don't start from scratch
2. **Configure API endpoints** - Use relative paths in HTML config
3. **Test with mock data** - Empty endpoint for development
4. **Test with live API** - Configure prod/stage endpoints
5. **Run formatter** - `formatting/format.bat` before committing
6. **Verify standards** - Check against this guide

---

## Common Issues & Fixes

### Issue: "Page not loading"
**Fix**: Ensure API config script tag is present in HTML

### Issue: "Filters not working"
**Fix**: Define filters in `config.js`, don't implement custom filter logic

### Issue: "No slide-in for filters"
**Fix**: FilterPanel is automatic - don't create custom panels

### Issue: "No chips showing"
**Fix**: Chips render automatically after FilterPanel applies filters

### Issue: "API calls failing"
**Fix**: Use relative paths in API config, not hardcoded URLs

### Issue: "Tabs not working"
**Fix**: Use PageRenderer tabs config, not manual tab implementation

---

## 15. Reference Implementation Checklist

- [ ] Page has all 4 files (HTML, JS, CSS, JSON)
- [ ] HTML includes API config script tag
- [ ] Script uses waitForAdminShell pattern
- [ ] Uses PageRenderer.init() with config
- [ ] Config includes section, tableConfig, pagination
- [ ] Filters defined in config.js (not in page)
- [ ] Uses relative API paths (not hardcoded)
- [ ] Uses Bootstrap classes for all styling
- [ ] Custom CSS is minimal and targeted
- [ ] Uses only primary, success, danger button colors
- [ ] Uses blue and white color scheme
- [ ] Reuses existing components (ModalViewer, FilterPanel, etc.)
- [ ] Follows demo page patterns exactly
- [ ] Follows formatting instructions
- [ ] Tested with mock data (empty endpoint)
- [ ] Tested with live API (configured endpoints)

**Remember: When in doubt, copy the demo page exactly and modify only the section name and table config.**</content>
<parameter name="filePath">c:\BackUp\web-projects\clients\oliver may\Admin-Code-master\DEVELOPER_STANDARDS_GUIDE.md
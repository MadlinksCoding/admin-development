# Guide: Adding a New Page

This guide explains how to add a new page to the admin panel with the modern adapter-based architecture.

---

## 1. Directory Structure

Create a new directory for your page under `page/`. Each page typically consists of four files:

```
page/
└── your-page-slug/
    ├── index.html   # Page structure
    ├── script.js    # Page logic (IIFE)
    ├── style.css    # Page-specific styles (optional)
    └── data.json    # Mock data for the page
```

---

## 2. Global Configuration (assets/js/core/config.js)

Register your page in the global configuration file.

### Sidebar Link
Add an entry to the `sidebar` array:
```javascript
{
  slug: "your-page-slug",
  label: "Your Page Label"
}
```

### Filters
Define filters for your page in the `filters` object:
```javascript
"your-page-slug": [
  {
    type: "text",
    name: "q",
    label: "Search",
    placeholder: "search..."
  }
]
```

### Notes Panel (Optional)
Configure the notes/overview panel in the `notes` object:
```javascript
"your-page-slug": {
  heading: "Overview",
  list: ["Point 1", "Point 2"]
}
```

---

## 3. HTML Template (index.html)

Copy the structure from an existing page (like `page/products/index.html`). Key components:

### Required Script Loading Order

```html
<!-- Core -->
<script src="../../assets/js/core/utils.js"></script>
<script src="../../assets/js/core/state.js"></script>
<script src="../../assets/js/core/config.js"></script>

<!-- Services (IMPORTANT: Load adapters before api-service) -->
<script src="../../assets/js/services/api-adapters.js"></script>
<script src="../../assets/js/services/api-service.js"></script>

<!-- UI Components -->
<script src="../../assets/js/ui/sidebar.js"></script>
<script src="../../assets/js/ui/env-selector.js"></script>
<script src="../../assets/js/ui/filter-panel.js"></script>
<script src="../../assets/js/ui/modal-viewer.js"></script>
<script src="../../assets/js/ui/notes-panel.js"></script>

<!-- Main -->
<script src="../../assets/js/admin.js"></script>

<!-- Page-specific -->
<script src="./script.js" defer></script>
```

### API Configuration

Use **relative paths** (recommended) for cleaner configuration:

```html
<script type="application/json" id="api-config">
  {
    "your-page-slug": {
      "prod": { "endpoint": "/your-page-slug" },
      "stage": { "endpoint": "/your-page-slug" },
      "dev": { "endpoint": "" }
    }
  }
</script>
```

**Options:**
- **Relative path** (`"/your-page-slug"`) - Merges with global base URL
- **Absolute URL** (`"http://..."`) - Uses full URL as-is
- **Empty string** (`""`) - Uses mock data from `data.json`

### Body Attributes

```html
<body data-section="your-page-slug">
  <!-- Page content -->
</body>
```

---

## 4. Page Logic (script.js)

Use the standard lifecycle pattern:

```javascript
(function () {
  // 1. Wait for AdminShell
  function waitForAdminShell() {
    return new Promise((resolve) => {
      if (window.AdminShell && window.AdminShell.pageContent) resolve();
      else document.body.addEventListener("adminshell:ready", resolve, { once: true });
    });
  }

  waitForAdminShell().then(() => {
    const { pageContent } = window.AdminShell;
    const SECTION = "your-page-slug";

    // 2. Define Table Config
    const TABLE_CONFIG = {
      id: "your-table-id",
      columns: [
        { field: "id", label: "ID", sortable: true },
        { field: "name", label: "Name", sortable: true },
        { field: "status", label: "Status" }
      ],
      actions: [
        { label: "View", className: "btn btn-sm btn-outline-primary", onClick: "handleView" }
      ]
    };

    // 3. Render Function
    async function render(offset = 0) {
      pageContent.innerHTML = window.AdminUtils.spinner();
      
      const filters = window.AdminState.activeFilters[SECTION] || {};
      
      // Use ApiService.get (adapters handle the rest automatically)
      const apiResponse = await window.ApiService.get(SECTION, { 
        filters, 
        pagination: { limit: 20, offset } 
      });

      pageContent.innerHTML = window.Table.create(TABLE_CONFIG, apiResponse.items);
      window.Table.init();
    }

    // 4. Initialize
    render();
    
    // Listen for refreshes
    document.body.addEventListener("section:refresh", () => render(0));
    document.body.addEventListener("env:changed", () => render(0));
  });
})();
```

---

## 5. Mock Data (data.json)

Create a `data.json` file in your page directory for local development:

```json
[
  {
    "id": 1,
    "name": "Example Item",
    "status": "Active",
    "createdAt": "2024-01-01T00:00:00Z"
  },
  {
    "id": 2,
    "name": "Another Item",
    "status": "Inactive",
    "createdAt": "2024-01-02T00:00:00Z"
  }
]
```

---

## 6. Custom Adapter (Optional)

If your section has unique API requirements (e.g., GET instead of POST, custom response format), create a custom adapter:

### In `assets/js/services/api-adapters.js`:

```javascript
class YourPageAdapter extends BaseAdapter {
    buildRequest(filters, pagination) {
        // Example: GET request with query params
        const params = new URLSearchParams();
        if (filters.q) params.append("search", filters.q);
        if (filters.status) params.append("status", filters.status);
        
        return {
            method: "GET",
            params: params
        };
    }
    
    transformResponse(response, filters) {
        // Example: Transform custom response format
        return {
            items: response.data || [],
            total: response.totalCount || 0
        };
    }
}

// Register the adapter
const registry = {
    'your-page-slug': YourPageAdapter,
    // ... other adapters
};
```

**When to create a custom adapter:**
- Section uses GET instead of POST
- Response format differs from standard `{ items: [], total: 0 }`
- Custom query parameter mapping needed
- Special endpoint suffix required (e.g., `/listItems`)

---

## 7. Testing Checklist

- [ ] Page loads without errors
- [ ] Mock data works (empty endpoint)
- [ ] Live API works (with endpoint configured)
- [ ] Environment switching works (prod/stage/dev)
- [ ] Filters work correctly
- [ ] Pagination works
- [ ] Table sorting works (if applicable)
- [ ] Actions work (view, edit, delete, etc.)

---

## Quick Reference

### Standard Section (No Custom Adapter)
1. Add to `config.js` sidebar
2. Create page directory with `index.html`, `script.js`, `data.json`
3. Use relative endpoint: `"/your-page-slug"`
4. Use `ApiService.get()` in script.js
5. Done! BaseAdapter handles everything

### Custom Section (With Adapter)
1. Follow steps above
2. Create adapter class in `api-adapters.js`
3. Register adapter in registry
4. Test with mock data first, then live API

---

## See Also

- [API Configuration Guide](./API_CONFIGURATION_GUIDE.md)
- [API Service Refactoring Guide](./API_SERVICE_REFACTORING.md)
- [assets/js/README.md](../assets/js/README.md)

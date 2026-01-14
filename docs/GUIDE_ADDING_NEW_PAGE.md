# Guide: Adding a New Page

This guide explains how to add a new page to the admin panel.

## 1. Directory Structure

Create a new directory for your page under `page/`. Each page typically consists of four files:

```
page/
└── your-page-slug/
    ├── index.html   # Page structure
    ├── script.js    # Page logic (IIFE)
    ├── style.css     # Page-specific styles
    └── data.json    # Mock data for the page
```

## 2. Page Configuration (assets/js/core/config.js)

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

### Notes Panel
Configure the notes/overview panel in the `notes` object:
```javascript
"your-page-slug": {
  heading: "Overview",
  list: ["Point 1", "Point 2"]
}
```

## 3. HTML Template (index.html)

Copy the structure from an existing page (like `page/products/index.html`). Key components to include:

- **API Config**: Set up the `#api-config` script tag.
- **Section ID**: Set `data-section="your-page-slug"` on the `<body>`.
- **Infrastructure**: Include all core JS/CSS files from `../../assets/`.
- **Page Script**: Include your local `./script.js` at the end of the `<body>`.

```html
<script type="application/json" id="api-config">
  {
    "your-page-slug": {
      "prod": { "endpoint": "" },
      "stage": { "endpoint": "" },
      "dev": { "endpoint": "" }
    }
  }
</script>
```

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
        // ... more columns
      ],
      actions: [
        { label: "View", className: "btn btn-sm btn-outline-primary", onClick: "handleView" }
      ]
    };

    // 3. Render Function
    async function render(offset = 0) {
      pageContent.innerHTML = window.AdminUtils.spinner();
      
      const filters = window.AdminState.activeFilters[SECTION] || {};
      const [apiResponse] = await Promise.all([
        window.DataService.get(SECTION, { filters, pagination: { limit: 20, offset } })
      ]);

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

## 5. Mock Data (data.json)

Create a `data.json` file in your page directory to serve as mock data when endpoints are empty:

```json
[
  {
    "id": 1,
    "name": "Example Item",
    "status": "Active"
  }
]
```

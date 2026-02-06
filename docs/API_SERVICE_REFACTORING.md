# API Service Refactoring Guide

## Overview

This document describes the refactoring of the API service architecture using the **Adapter Pattern** and **Global Base URL Configuration**.

---

## Architecture Changes

### 1. Adapter Pattern

**File:** `assets/js/services/api-adapters.js`

The adapter pattern separates section-specific API logic into dedicated classes:

```javascript
// Base adapter for standard sections
class BaseAdapter {
    buildRequest(filters, pagination) { /* POST with standard payload */ }
    transformResponse(response, filters) { /* Standard transformation */ }
}

// Specialized adapters
class KycShuftiAdapter extends BaseAdapter { /* KYC-specific logic */ }
class ModerationAdapter extends BaseAdapter { /* Moderation-specific logic */ }
```

**Benefits:**
- Section-specific logic is isolated and maintainable
- Easy to add new sections without modifying core service
- Testable in isolation

### 2. Global Base URL Configuration

**File:** `assets/js/core/config.js`

```javascript
window.AdminEndpoints = {
  base: {
    prod: "http://209.38.24.155:3000",
    stage: "http://localhost:3000",
    dev: ""
  },
  routes: {
    "kyc-shufti": "/kyc-shufti",
    "user-blocks": "/user-blocks"
  }
};
```

**Benefits:**
- Single source of truth for API base URLs
- Change environment URLs in one place
- Supports both absolute and relative endpoint paths

---

## Using Adapters

### For Standard Sections

Most sections use the default `BaseAdapter` automatically. No configuration needed.

### For Custom Sections

Create a new adapter class in `api-adapters.js`:

```javascript
class MySectionAdapter extends BaseAdapter {
    buildRequest(filters, pagination) {
        // Custom request building
        const params = new URLSearchParams();
        params.append("customParam", filters.myFilter);
        return {
            method: "GET",
            params: params
        };
    }
    
    transformResponse(response, filters) {
        // Custom response transformation
        return {
            items: response.data.map(item => ({
                id: item._id,
                name: item.displayName
            })),
            total: response.count
        };
    }
}

// Register the adapter
const registry = {
    'my-section': MySectionAdapter,
    // ... other adapters
};
```

---

## Page Configuration

### Old Approach (Still Supported)

```json
{
  "moderation": {
    "prod": { "endpoint": "http://209.38.24.155:3000/moderation" },
    "stage": { "endpoint": "http://localhost:3000/moderation" }
  }
}
```

### New Approach (Recommended)

```json
{
  "moderation": {
    "prod": { "endpoint": "/moderation" },
    "stage": { "endpoint": "/moderation" }
  }
}
```

The system automatically merges relative paths with the global base URL.

---

## URL Resolution Logic

```javascript
// Absolute URL → Used as-is
"endpoint": "http://example.com/api" → "http://example.com/api"

// Relative path → Merged with global base
"endpoint": "/moderation" → "http://209.38.24.155:3000/moderation" (prod)
                          → "http://localhost:3000/moderation" (stage)

// No endpoint → Uses default route
(no config) → "http://209.38.24.155:3000/my-section"
```

---

## Migration Checklist

### For New Pages

1. ✅ Use relative endpoint paths in page config
2. ✅ Create custom adapter if needed
3. ✅ Register adapter in `api-adapters.js`
4. ✅ Include `<script src="assets/js/services/api-adapters.js"></script>` in HTML

### For Existing Pages

- **No changes required** - backward compatible
- Optionally migrate to relative paths for cleaner config

---

## Files Modified

- **Created:** `assets/js/services/api-adapters.js`
- **Updated:** `assets/js/services/api-service.js`
- **Updated:** `assets/js/core/config.js`
- **Updated:** All page `index.html` files (added script tag)

---

## See Also

- [API Configuration Guide](./API_CONFIGURATION_GUIDE.md)
- [Adding New Pages Guide](./GUIDE_ADDING_NEW_PAGE.md)
- [assets/js/README.md](../assets/js/README.md)

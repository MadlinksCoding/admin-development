# API Configuration Guide

## Overview

The admin panel uses a flexible API architecture with **Adapter Pattern** for section-specific logic and **Global Base URL Configuration** for centralized endpoint management. Each page can use **mock data** (local JSON files) or **live API endpoints** independently.

---

## Architecture Components

### 1. Global Base URL Configuration

**File:** `assets/js/core/config.js`

Centralized base URLs for all environments:

```javascript
window.AdminEndpoints = {
  base: {
    prod: "http://209.38.24.155:3000",
    stage: "http://localhost:3000",
    dev: ""
  },
  routes: {
    // Optional: Override default routes
    "kyc-shufti": "/kyc-shufti",
    "user-blocks": "/user-blocks"
  }
};
```

**Benefits:**
- Change base URL in one place for all pages
- Support both IP-based and domain-based configurations
- Easy environment switching

### 2. API Adapters

**File:** `assets/js/services/api-adapters.js`

Adapters handle section-specific request building and response transformation:

```javascript
// Standard sections use BaseAdapter automatically
class BaseAdapter {
    buildRequest(filters, pagination) { /* POST with standard payload */ }
    transformResponse(response, filters) { /* Standard transformation */ }
}

// Custom sections can define specialized adapters
class KycShuftiAdapter extends BaseAdapter {
    buildRequest(filters, pagination) { /* GET with query params */ }
    transformResponse(response, filters, pagination) { /* Transform sessions → items */ }
}
```

**Current Adapters:**
- `BaseAdapter` - Default for most sections
- `KycShuftiAdapter` - Shufti Pro KYC integration
- `ModerationAdapter` - Content moderation
- `UserBlocksAdapter` - User blocking
- `ProductsAdapter` - Product-specific payload mapping
- `OrdersAdapter` - Order-specific payload mapping

### 3. Per-Page Configuration

**Location:** Each page's `index.html`

```html
<script type="application/json" id="api-config">
{
  "section-name": {
    "prod": { "endpoint": "/section-name" },
    "stage": { "endpoint": "/section-name" },
    "dev": { "endpoint": "" }
  }
}
</script>
```

---

## Endpoint Configuration

### Option 1: Relative Paths (Recommended)

Use relative paths that merge with global base URL:

```json
{
  "moderation": {
    "prod": { "endpoint": "/moderation" },
    "stage": { "endpoint": "/moderation" },
    "dev": { "endpoint": "" }
  }
}
```

**Result:**
- **PROD**: `http://209.38.24.155:3000/moderation`
- **STAGE**: `http://localhost:3000/moderation`
- **DEV**: Mock data from `page/moderation/data.json`

### Option 2: Absolute URLs (Backward Compatible)

Use full URLs for specific endpoints:

```json
{
  "kyc-shufti": {
    "prod": { "endpoint": "https://api.production.com/kyc/sessions" },
    "stage": { "endpoint": "https://api.staging.com/kyc/sessions" },
    "dev": { "endpoint": "http://localhost:3000/kyc/sessions" }
  }
}
```

### Option 3: Mock Data Only

Use empty strings to always use local mock data:

```json
{
  "products": {
    "prod": { "endpoint": "" },
    "stage": { "endpoint": "" },
    "dev": { "endpoint": "" }
  }
}
```

---

## URL Resolution Logic

```
1. Check page config for current environment
   ↓
2. If endpoint is empty string → Use mock data
   ↓
3. If endpoint starts with http:// or https:// → Use as-is (absolute URL)
   ↓
4. If endpoint starts with / → Merge with global base URL
   ↓
5. If no endpoint configured → Use global base + default route
```

**Examples:**

| Config Value | Environment | Resolved URL |
|-------------|-------------|--------------|
| `""` | Any | Mock data from `page/{section}/data.json` |
| `"/moderation"` | prod | `http://209.38.24.155:3000/moderation` |
| `"/moderation"` | stage | `http://localhost:3000/moderation` |
| `"http://custom.com/api"` | Any | `http://custom.com/api` |

---

## Environment Switching

Users can switch environments using the dropdown in the page header:

- **PROD** → Uses `prod` endpoint configuration
- **STAGE** → Uses `stage` endpoint configuration
- **DEV** → Uses `dev` endpoint configuration

The page automatically refreshes and uses the appropriate endpoint.

---

## Creating Custom Adapters

If your section has unique API requirements, create a custom adapter:

**1. Define the adapter in `api-adapters.js`:**

```javascript
class MyCustomAdapter extends BaseAdapter {
    buildRequest(filters, pagination) {
        // Custom request logic
        const params = new URLSearchParams();
        params.append("customParam", filters.myFilter);
        return {
            method: "GET",
            params: params,
            endpointSuffix: "customAction" // Optional: appends to endpoint
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
```

**2. Register the adapter:**

```javascript
const registry = {
    'my-section': MyCustomAdapter,
    // ... other adapters
};
```

---

## Best Practices

1. **Use Relative Paths**: Prefer `/section-name` over full URLs for easier environment management
2. **Global Base URL**: Update `AdminEndpoints.base` when changing server IPs/domains
3. **Mock Data for Development**: Use empty endpoints during development to test with local data
4. **Custom Adapters**: Create adapters only when section has unique API requirements
5. **Gradual Migration**: Start with dev environment, then stage, then prod

---

## Migration from Old Configuration

### Before (Full URLs)
```json
{
  "moderation": {
    "prod": { "endpoint": "http://209.38.24.155:3000/moderation" },
    "stage": { "endpoint": "http://localhost:3000/moderation" }
  }
}
```

### After (Relative Paths)
```json
{
  "moderation": {
    "prod": { "endpoint": "/moderation" },
    "stage": { "endpoint": "/moderation" }
  }
}
```

**Note:** Both formats work! The new format is cleaner and easier to maintain.

---

## See Also

- [API Service Refactoring Guide](./API_SERVICE_REFACTORING.md)
- [Adding New Pages Guide](./GUIDE_ADDING_NEW_PAGE.md)
- [assets/js/README.md](../assets/js/README.md)

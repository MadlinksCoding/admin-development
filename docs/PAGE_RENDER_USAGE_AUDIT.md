# PageRenderer Config Format

The `config` object is required to initialize a `PageRenderer` instance. It defines how the page should be rendered, including table configuration, pagination, and optional tabs.

---

## Required Properties

| Property      | Type     | Description                                                      |
|---------------|----------|------------------------------------------------------------------|
| `section`     | string   | The section name (used for data fetching and filter state).      |
| `tableConfig` | object   | Table configuration object (passed to `window.Table.create`).    |

---

## Optional Properties

| Property      | Type     | Description                                                      |
|---------------|----------|------------------------------------------------------------------|
| `pagination`  | object   | Pagination settings (see below).                                 |
| `tabs`        | array    | Array of tab definitions (see below).                            |

---

## `tableConfig` (object)

Configuration for the table. This is passed directly to `window.Table.create`.  
**Typical fields include:**
- `id` (string): Unique table ID.
- `columns` (array): Column definitions.
- `...` (other table-specific options).

---

## `pagination` (object, optional)

Controls pagination behavior.

| Property   | Type    | Default | Description                                 |
|------------|---------|---------|---------------------------------------------|
| `enabled`  | boolean | false   | Whether pagination is enabled.              |
| `pageSize` | number  | 20      | Number of items per page (if enabled).      |

---

## `tabs` (array of objects, optional)

Defines tabbed navigation for the page. Each tab object can have:

| Property       | Type    | Description                                               |
|----------------|---------|-----------------------------------------------------------|
| `id`           | string  | Unique tab identifier.                                    |
| `label`        | string  | Tab display label.                                        |
| `statusFilter` | string  | (Optional) Value for the `status` filter when tab active. |

Example:
```js
tabs: [
  { id: "all", label: "All", statusFilter: null },
  { id: "active", label: "Active", statusFilter: "active" },
  { id: "archived", label: "Archived", statusFilter: "archived" }
]
```

---

## Example Config

```js
const config = {
  section: "users",
  tableConfig: {
    id: "usersTable",
    columns: [
      { key: "name", label: "Name" },
      { key: "email", label: "Email" }
    ]
    // ...other table options
  },
  pagination: {
    enabled: true,
    pageSize: 25
  },
  tabs: [
    { id: "all", label: "All" },
    { id: "active", label: "Active", statusFilter: "active" },
    { id: "inactive", label: "Inactive", statusFilter: "inactive" }
  ]
};
```

---

## Notes

- `section` is used for data fetching and filter state management.
- If `tabs` are provided, the first tab is active by default.
- If `pagination.enabled` is `false` or omitted, all items are loaded at once.
- The config is validated in the constructor; missing `section` or `tableConfig` will throw an error.

---

**Summary:**  
The `config` object for `PageRenderer` must at minimum include `section` and `tableConfig`, and can optionally include `pagination` and `tabs` for more advanced page layouts.
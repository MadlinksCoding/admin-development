/**
 * Admin Configuration
 * Central configuration for sidebar, filters, and notes
 */

window.AdminConfig = {
  sidebar: [
    {
      slug: "products",
      label: "Products"
    },
    {
      slug: "orders",
      label: "Orders"
    },
    {
      slug: "subscriptions",
      label: "Subscriptions"
    },
    {
      slug: "users",
      label: "Users"
    },
    {
      slug: "user-blocks",
      label: "UsersBlocks"
    },
    {
      slug: "media",
      label: "Media"
    },
    {
      slug: "moderation",
      label: "Moderation"
    },
    {
      slug: "stats",
      label: "Stats"
    },
    {
      slug: "site-settings",
      label: "Site Settings"
    },
    {
      slug: "sales-registry",
      label: "Token Registry"
    },
    {
      slug: "user-tokens",
      label: "User Tokens"
    },
    {
      type: "group",
      label: "Payment",
      children: [
        { slug: "payment-sessions", label: "Sessions" },
        { slug: "payment-transactions", label: "Transactions" },
        { slug: "payment-schedules", label: "Schedules" },
        { slug: "payment-tokens", label: "Tokens" },
        { slug: "payment-webhooks", label: "Webhooks" }
      ]
    },
    {
      slug: "translation-settings",
      label: "Translation Settings"
    },
    {
      slug: "notification-settings",
      label: "Notification Settings"
    },
    {
      slug: "fetch",
      label: "Fetch Demo"
    },
    {
      slug: "demo",
      label: "Demo Page"
    },
    {
      slug: "kyc-shufti",
      label: "KYC (Shufti)"
    },
    {
      type: "divider"
    },
    {
      type: "group",
      label: "Developers",
      children: [
        {
          type: "group",
          label: "Database Management",
          children: [
            {
              slug: "developer/scylla-db",
              label: "Scylla DB"
            },
            {
              slug: "developer/postgres",
              label: "Postgres"
            },
            {
              slug: "developer/mysql",
              label: "MySQL"
            }
          ]
        },
        {
          type: "group",
          label: "Edge Tests",
          children: [
            {
              slug: "developer/edge-tests-demo",
              label: "Demo (Template)"
            },
            {
              slug: "developer/edge-tests-products",
              label: "Products Class"
            },
            {
              slug: "developer/edge-tests-orders",
              label: "Orders Class"
            },
            {
              slug: "developer/edge-tests-cart",
              label: "Cart Class"
            },
            {
              slug: "developer/edge-tests-wishlist",
              label: "Wishlist Class"
            },
            {
              slug: "developer/edge-tests-coupon",
              label: "Coupon Class"
            },
            {
              slug: "developer/edge-tests-subscriptions",
              label: "Subscriptions Class"
            },
            {
              slug: "developer/edge-tests-transactions",
              label: "Transactions Class"
            },
            {
              slug: "developer/edge-tests-gateway-1",
              label: "Gateway 1 Class"
            },
            {
              slug: "developer/edge-tests-gateway-2",
              label: "Gateway 2 Class"
            },
            {
              slug: "developer/edge-tests-media",
              label: "Media Class"
            },
            {
              slug: "developer/edge-tests-moderation",
              label: "Moderation Class"
            },
            {
              slug: "developer/edge-tests-referrals",
              label: "Referrals Class"
            },
            {
              slug: "developer/edge-tests-users",
              label: "Users Class"
            },
            {
              slug: "developer/edge-tests-blockUsers",
              label: "BlockUsers Class"
            },
            {
              slug: "developer/edge-tests-kyc",
              label: "KYC Class"
            }
          ]
        },
        {
          slug: "developer/integration-reminders",
          label: "Integration Reminders"
        }
      ]
    }
  ],
  filters: {
    products: [
      {
        type: "text",
        name: "q",
        label: "Search",
        placeholder: "name, sku…"
      },
      {
        type: "select",
        name: "category",
        label: "Category",
        options: ["All", "Apparel", "Electronics", "Beauty"]
      },
      {
        type: "select",
        name: "status",
        label: "Status",
        options: ["Any", "Active", "Draft", "Archived"]
      },
      {
        type: "radio",
        name: "type",
        label: "Type",
        options: ["Any", "Physical", "Digital"]
      },
      {
        type: "toggle",
        name: "promo",
        label: "On Promotion"
      },
      {
        type: "toggle",
        name: "inStock",
        label: "In Stock"
      },
      {
        type: "text",
        name: "sku",
        label: "SKU"
      },
      {
        type: "number",
        name: "price_from",
        label: "Price From"
      },
      {
        type: "number",
        name: "price_to",
        label: "Price To"
      },
      {
        type: "checks",
        name: "tags",
        label: "Tags",
        options: ["New", "Sale", "Featured", "Limited"]
      }
    ],
    orders: [
      {
        type: "text",
        name: "q",
        label: "Search",
        placeholder: "search…"
      }
    ],
    subscriptions: [
      {
        type: "text",
        name: "q",
        label: "Search",
        placeholder: "search…"
      }
    ],
    users: [
      {
        type: "text",
        name: "q",
        label: "Global Search",
        placeholder: "ID, Username, Email, Phone or Name…"
      },
      {
        type: "text",
        name: "uid",
        label: "UID",
        placeholder: "Exact internal UID"
      },
      {
        type: "text",
        name: "public_uid",
        label: "Public UID",
        placeholder: "Exact Public UID"
      },
      {
        type: "text",
        name: "user_name",
        label: "Username",
        placeholder: "Filter by username"
      },
      {
        type: "text",
        name: "email",
        label: "Email",
        placeholder: "Filter by email"
      },
      {
        type: "text",
        name: "phone_number",
        label: "Phone Number",
        placeholder: "Filter by phone number"
      },
      {
        type: "text",
        name: "display_name",
        label: "Display Name",
        placeholder: "Filter by display name"
      },
      {
        type: "select",
        name: "role",
        label: "Role",
        options: [
          { value: "", label: "All Roles" },
          { value: "creator", label: "Creator" },
          { value: "vendor", label: "Vendor" },
          { value: "agent", label: "Agent" },
          { value: "fan", label: "Fan" }
        ]
      },
      {
        type: "select",
        name: "status",
        label: "Status",
        options: [
          { value: "", label: "All Statuses" },
          { value: "online", label: "Online" },
          { value: "away", label: "Away" },
          { value: "offline", label: "Offline" }
        ]
      },
      {
        type: "date",
        name: "last_activity_from",
        label: "Activity From"
      },
      {
        type: "date",
        name: "last_activity_to",
        label: "Activity To"
      }
    ],
    "user-blocks": [
      {
        type: "text",
        name: "id",
        label: "Block ID",
        placeholder: "Filter by block ID"
      },
      {
        type: "text",
        name: "q",
        label: "Global Search",
        placeholder: "From or To User ID…"
      },
      {
        type: "text",
        name: "blocker_id",
        label: "From User ID",
        placeholder: "user_a"
      },
      {
        type: "text",
        name: "blocked_id",
        label: "To User ID",
        placeholder: "user_b"
      },
      {
        type: "select",
        name: "scope",
        label: "Scope",
        options: [
          { value: "", label: "All Scopes" },
          { value: "private_chat", label: "Private Chat" },
          { value: "feed", label: "Feed" },
          { value: "global", label: "Global" }
        ]
      },
      {
        type: "select",
        name: "flag",
        label: "Flag",
        options: [
          { value: "", label: "All Flags" },
          { value: "fraud", label: "Fraud" },
          { value: "abuse", label: "Abuse" },
          { value: "violence", label: "Violence" },
          { value: "spam", label: "Spam" },
          { value: "security", label: "Security" }
        ]
      },
      {
        type: "select",
        name: "is_permanent",
        label: "Permanent",
        options: [
          { value: "", label: "Any" },
          { value: "true", label: "Yes" },
          { value: "false", label: "No" }
        ]
      },
      {
        type: "select",
        name: "expired",
        label: "Expired",
        options: [
          { value: "", label: "Any" },
          { value: "true", label: "Yes" },
          { value: "false", label: "No" }
        ]
      },
      {
        type: "date",
        name: "created_from",
        label: "Created From"
      },
      {
        type: "date",
        name: "created_to",
        label: "Created To"
      }
    ],
    media: [
      {
        type: "text",
        name: "q",
        label: "Global Search",
        placeholder: "Title, filename…"
      },
      {
        type: "text",
        name: "title",
        label: "Title",
        placeholder: "Search by title"
      },
      {
        type: "text",
        name: "media_id",
        label: "Media ID",
        placeholder: "Exact media ID"
      },
      {
        type: "select",
        name: "media_type",
        label: "Media Type",
        options: [
          { value: "", label: "All Types" },
          { value: "image", label: "Image" },
          { value: "video", label: "Video" },
          { value: "audio", label: "Audio" },
          { value: "file", label: "File" },
          { value: "gallery", label: "Gallery" }
        ]
      },
      {
        type: "select",
        name: "status",
        label: "Status",
        options: [
          { value: "", label: "All Statuses" },
          { value: "published", label: "Published" },
          { value: "scheduled", label: "Scheduled" },
          { value: "draft", label: "Draft" },
          { value: "pending", label: "Pending" }
        ]
      },
      {
        type: "select",
        name: "visibility",
        label: "Visibility",
        options: [
          { value: "", label: "All Visibility" },
          { value: "public", label: "Public" },
          { value: "subscribers", label: "Subscribers" },
          { value: "purchasers", label: "Purchasers" },
          { value: "private", label: "Private" },
          { value: "unlisted", label: "Unlisted" },
          { value: "coming_soon", label: "Coming Soon" }
        ]
      },
      {
        type: "text",
        name: "owner_user_id",
        label: "Owner ID",
        placeholder: "Filter by owner"
      },
      {
        type: "toggle",
        name: "featured",
        label: "Featured Only"
      },
      {
        type: "toggle",
        name: "coming_soon",
        label: "Coming Soon Only"
      },
      {
        type: "date",
        name: "created_from",
        label: "Created From"
      },
      {
        type: "date",
        name: "created_to",
        label: "Created To"
      },
      {
        type: "number",
        name: "file_size_min",
        label: "Min Size (KB)"
      },
      {
        type: "number",
        name: "file_size_max",
        label: "Max Size (KB)"
      }
    ],
    moderation: [
      {
        type: "text",
        name: "q",
        label: "Search",
        placeholder: "Moderation ID or User ID"
      },
      {
        type: "select",
        name: "status",
        label: "Status",
        options: [
          { value: "all", label: "All Statuses" },
          { value: "pending", label: "Pending" },
          { value: "approved", label: "Approved" },
          { value: "rejected", label: "Declined" }
        ]
      },
      {
        type: "select",
        name: "type",
        label: "Type",
        options: [
          "",
          { value: "image", label: "Image" },
          { value: "video", label: "Video" },
          { value: "audio", label: "Audio" },
          { value: "text", label: "Text" },
          { value: "emoji", label: "Emoji" },
          { value: "icon", label: "Icon" },
          { value: "tag", label: "Tag" },
          { value: "link", label: "Link" },
          { value: "gallery", label: "Image Gallery" }
        ]
      },
      {
        type: "text",
        name: "userId",
        label: "User ID",
        placeholder: "Enter User ID"
      },
      {
        type: "date",
        name: "from",
        label: "Date From"
      },
      {
        type: "date",
        name: "to",
        label: "Date To"
      },
      {
        type: "text",
        name: "limit",
        label: "Limit",
        placeholder: "20"
      }
    ],
    stats: [],
    "site-settings": [],
    "sales-registry": [
      {
        type: "text",
        name: "payee",
        label: "Payee User ID",
        placeholder: "User ID"
      },
      {
        type: "text",
        name: "beneficiary",
        label: "Beneficiary User ID",
        placeholder: "User ID"
      },
      {
        type: "select",
        name: "type",
        label: "Type",
        options: [
          { value: "", label: "All" },
          { value: "transfer", label: "Transferred" },
          { value: "payment", label: "Payment" },
          { value: "refund", label: "Refund" },
          { value: "held", label: "Held" }
        ]
      },
      {
        type: "select",
        name: "state",
        label: "State",
        options: [
          "",
          { value: "completed", label: "Completed" },
          { value: "pending", label: "Pending" },
          { value: "failed", label: "Failed" },
          { value: "cancelled", label: "Cancelled" },
          { value: "held", label: "Held" }
        ]
      },
      {
        type: "text",
        name: "refId",
        label: "Reference ID",
        placeholder: "Reference ID"
      },
      {
        type: "select",
        name: "purpose",
        label: "Purpose",
        options: [
          "",
          { value: "subscription", label: "Subscription" },
          { value: "tip", label: "Tip" },
          { value: "purchase", label: "Purchase" },
          { value: "refund", label: "Refund" }
        ]
      },
      {
        type: "date",
        name: "from",
        label: "Date From"
      },
      {
        type: "date",
        name: "to",
        label: "Date To"
      }
    ],
    "user-tokens": [
      {
        type: "text",
        name: "q",
        label: "Search",
        placeholder: "User ID…"
      }
    ],
    "payment-sessions": [
      { type: "text", name: "userId", label: "Payer User ID", placeholder: "User ID" },
      { type: "text", name: "orderId", label: "Reference ID", placeholder: "Reference ID" },
      {
        type: "select",
        name: "sessionType",
        label: "Type",
        options: ["", { value: "card", label: "Card" }, { value: "token", label: "Token" }]
      },
      {
        type: "select",
        name: "status",
        label: "State",
        options: ["", { value: "pending", label: "Pending" }, { value: "authorized", label: "Authorized" }, { value: "success", label: "Success" }, { value: "completed", label: "Completed" }, { value: "failed", label: "Failed" }, { value: "voided", label: "Voided" }]
      },
      { type: "date", name: "from", label: "Date From" },
      { type: "date", name: "to", label: "Date To" }
    ],
    "payment-transactions": [
      { type: "text", name: "userId", label: "Payee User ID", placeholder: "User ID" },
      { type: "text", name: "beneficiaryId", label: "Beneficiary User ID", placeholder: "User ID" },
      {
        type: "select",
        name: "orderType",
        label: "Type",
        options: ["", { value: "payment", label: "Payment" }, { value: "transfer", label: "Transfer" }, { value: "refund", label: "Refund" }]
      },
      {
        type: "select",
        name: "status",
        label: "State",
        options: [
          "",
          { value: "pending", label: "Pending" },
          { value: "authorized", label: "Authorized" },
          { value: "success", label: "Success" },
          { value: "failed", label: "Failed" },
          { value: "refunded", label: "Refunded" },
          { value: "chargeback", label: "Chargeback" },
          { value: "voided", label: "Voided" }
        ]
      },
      { type: "text", name: "referenceId", label: "Reference ID", placeholder: "Reference ID" },
      {
        type: "select",
        name: "purpose",
        label: "Purpose",
        options: ["", { value: "subscription", label: "Subscription" }, { value: "tip", label: "Tip" }, { value: "purchase", label: "Purchase" }, { value: "refund", label: "Refund" }]
      },
      { type: "date", name: "from", label: "Date From" },
      { type: "date", name: "to", label: "Date To" }
    ],
    "payment-schedules": [
      { type: "text", name: "userId", label: "Payer User ID", placeholder: "User ID" },
      { type: "text", name: "referenceId", label: "Reference ID", placeholder: "Reference ID" },
      {
        type: "select",
        name: "frequency",
        label: "Type",
        options: ["", { value: "monthly", label: "Monthly" }, { value: "yearly", label: "Yearly" }]
      },
      {
        type: "select",
        name: "status",
        label: "State",
        options: ["", { value: "active", label: "Active" }, { value: "paused", label: "Paused" }]
      },
      { type: "date", name: "from", label: "Date From" },
      { type: "date", name: "to", label: "Date To" }
    ],
    "payment-tokens": [
      { type: "text", name: "userId", label: "Payer User ID", placeholder: "User ID" },
      { type: "text", name: "registrationId", label: "Reference ID", placeholder: "Reference ID" },
      {
        type: "select",
        name: "type",
        label: "Type",
        options: ["", { value: "card", label: "Card" }]
      },
      {
        type: "select",
        name: "status",
        label: "State",
        options: ["", { value: "active", label: "Active" }, { value: "expired", label: "Expired" }, { value: "disabled", label: "Disabled" }]
      },
      { type: "date", name: "from", label: "Date From" },
      { type: "date", name: "to", label: "Date To" }
    ],
    "payment-webhooks": [
      { type: "text", name: "orderId", label: "Reference ID", placeholder: "Reference ID" },
      {
        type: "select",
        name: "actionTaken",
        label: "Type",
        options: ["", { value: "processed", label: "Processed" }]
      },
      {
        type: "select",
        name: "handled",
        label: "State",
        options: ["", { value: "true", label: "Handled" }, { value: "false", label: "Pending" }]
      },
      { type: "date", name: "from", label: "Date From" },
      { type: "date", name: "to", label: "Date To" }
    ],
    "translation-settings": [],
    "notification-settings": [],
    fetch: [],
    "scylla-db": [],
    postgres: [],
    mysql: [],
    "kyc-shufti": [
      {
        type: "text",
        name: "q",
        label: "Search",
        placeholder: "User ID or Reference ID"
      },
      {
        type: "text",
        name: "email",
        label: "Email",
        placeholder: "Email address"
      },
      {
        type: "text",
        name: "country",
        label: "Country",
        placeholder: "Country code"
      },
      {
        type: "select",
        name: "status",
        label: "Status",
        options: [
          "",
          { value: "verification.accepted", label: "Accepted" },
          { value: "verification.declined", label: "Declined" },
          { value: "request.pending", label: "Pending" },
          { value: "verification.pending", label: "Verification Pending" },
          { value: "request.timeout", label: "Timeout" },
          { value: "verification.cancelled", label: "Cancelled" }
        ]
      },
      {
        type: "date",
        name: "from",
        label: "Date From"
      },
      {
        type: "date",
        name: "to",
        label: "Date To"
      }
    ],
    demo: [
      {
        type: "text",
        name: "q",
        label: "Search",
        placeholder: "name, sku…"
      },
      {
        type: "select",
        name: "category",
        label: "Category",
        options: ["All", "Apparel", "Electronics", "Beauty"]
      },
      {
        type: "select",
        name: "status",
        label: "Status",
        options: ["Any", "Active", "Draft", "Archived"]
      },
      {
        type: "radio",
        name: "type",
        label: "Type",
        options: ["Any", "Physical", "Digital"]
      },
      {
        type: "toggle",
        name: "promo",
        label: "On Promotion"
      },
      {
        type: "toggle",
        name: "inStock",
        label: "In Stock"
      },
      {
        type: "text",
        name: "sku",
        label: "SKU"
      },
      {
        type: "number",
        name: "price_from",
        label: "Price From"
      },
      {
        type: "number",
        name: "price_to",
        label: "Price To"
      },
      {
        type: "checks",
        name: "tags",
        label: "Tags",
        options: ["New", "Sale", "Featured", "Limited"]
      }
    ]
  },
  notes: {
    products: {
      heading: "Stats Overview",
      list: [
        "Total creators registered",
        "Total fans registered",
        "Total media uploaded (image, video, audio)"
      ]
    },
    orders: {
      heading: "Stats Overview",
      list: [
        "Total creators registered",
        "Total fans registered",
        "Total media uploaded (image, video, audio)"
      ]
    },
    subscriptions: {
      heading: "Stats Overview",
      list: [
        "Total creators registered",
        "Total fans registered",
        "Total media uploaded (image, video, audio)"
      ]
    },
    users: {
      heading: "Stats Overview",
      list: [
        "Total creators registered",
        "Total fans registered",
        "Total media uploaded (image, video, audio)"
      ]
    },
    media: {
      heading: "Stats Overview",
      list: [
        "Total creators registered",
        "Total fans registered",
        "Total media uploaded (image, video, audio)"
      ]
    },
    moderation: {
      heading: "Stats Overview",
      list: [
        "Total creators registered",
        "Total fans registered",
        "Total media uploaded (image, video, audio)"
      ]
    },
    stats: {
      heading: "Stats Overview",
      list: [
        "Total creators registered",
        "Total fans registered",
        "Total media uploaded (image, video, audio)"
      ]
    },
    "site-settings": {
      heading: "Here you will manage:",
      list: [
        "Banned words",
        "Banned emails",
        "Global tags",
        "Authentication settings",
        "Blocked countries",
        "Ringtones",
        "Default media & URLs",
        "Force premium users"
      ]
    },
    "sales-registry": {
      text: "This page shows all recorded sales transactions, totals by period, and exportable sales reports."
    },
    "user-tokens": {
      heading: "Overview",
      list: [
        "View user token balances (paid, free system, free creator)",
        "Check token expiry dates",
        "Drilldown to token registry as payee or beneficiary"
      ]
    },
    "payment-sessions": {
      text: "Payment gateway sessions. Filter by payer, reference ID, type, state, and date range."
    },
    "payment-transactions": {
      text: "Payment gateway transactions. Filter by payee, beneficiary, type, state, purpose, and date range."
    },
    "payment-schedules": {
      text: "Payment gateway schedules (subscriptions). Filter by payer, reference ID, frequency, state, and date range."
    },
    "payment-tokens": {
      text: "Payment gateway tokens (card/registration). Filter by payer, reference ID, type, and date range. Card numbers are masked."
    },
    "payment-webhooks": {
      text: "Payment gateway webhooks. Filter by reference ID, type, handled state, and date range."
    },
    "translation-settings": {
      text: "Configure supported locales and fallback language. Manage custom string translations per language."
    },
    "notification-settings": {
      text: "Define notification channels (email, SMS, push) and configure templates and triggers for each event type."
    },
    fetch: {
      text: ""
    },
    "scylla-db": {
      text: "Manage Scylla DB backups. Create new backups, download existing ones, or restore from a backup."
    },
    postgres: {
      text: "Manage Postgres database backups. Create new backups, download existing ones, or restore from a backup."
    },
    mysql: {
      text: "Manage MySQL database backups. Create new backups, download existing ones, or restore from a backup."
    },
    "kyc-shufti": {
      text: "Manage KYC verification records from ShuftiPro. View details, check status, and fetch full verification data from ShuftiPro API."
    },
    demo: {
      heading: "Demo Page Features",
      list: [
        "Table with pagination (20 items per page)",
        "Comprehensive filters (search, category, status, type, toggles, price range, tags)",
        "View All offcanvas (slides in from right with detailed view)",
        "Popup modal (view formatted JSON)",
        "Filter chips with removal",
        "Environment switching (prod/stage/dev)"
      ]
    }
  }
};

/**
 * API Endpoints Configuration
 * Global base URLs and section routes
 */
window.AdminEndpoints = {
  base: {
    prod: "http://209.38.24.155:3000",
    stage: "http://localhost:3000",
    dev: "http://localhost:3000"
  },
  routes: {
    // Define section routes here. Used when resolving API paths; default fallback is /<slug>
    "kyc-shufti": "/kyc-shufti",
    "user-blocks": "/user-blocks",
    "user-tokens": "/user-tokens",
    "sales-registry": "/sales-registry",
    "moderation": "/moderation",
    "users": "/users",
    "media": "/media",
    "products": "/products",
    "orders": "/orders",
    "subscriptions": "/subscriptions",
    "payment-sessions": "/payment-sessions",
    "payment-transactions": "/payment-transactions",
    "payment-schedules": "/payment-schedules",
    "payment-tokens": "/payment-tokens",
    "payment-webhooks": "/payment-webhooks"
  }
};

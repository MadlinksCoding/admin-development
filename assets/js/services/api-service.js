/**
 * API Service
 * Handles data fetching from local JSON files or remote API endpoints
 */

// Flag to determine whether to use remote API endpoints or local JSON files
const USE_ENDPOINTS = false;
// Timeout duration for fetch requests in milliseconds (20 seconds)
const FETCH_TIMEOUT = 20000;

/**
 * Check if API config script tag exists
 * @returns {boolean} True if script tag exists, false otherwise
 */
function hasApiConfigScript() {
  // Check if API config script tag exists in current page
  return !!document.getElementById("api-config");
}

/**
 * Get page-specific API configuration from HTML
 * Looks for <script type="application/json" id="api-config"> tag in current page
 * @param {string} sectionName - Section name to get config for
 * @returns {Object|null} API configuration object or null if section not found in config
 * @throws {Error} If config script tag is missing or JSON parsing fails
 */
function getPageApiConfig(sectionName) {
  // Check if API config script tag exists
  if (!hasApiConfigScript()) {
    // Throw error if config script tag is missing (no fallback)
    throw new Error(
      `API configuration script tag (#api-config) is missing for section: ${sectionName}. Please add <script type="application/json" id="api-config"> to the page HTML.`
    );
  }
  // Try to parse JSON configuration
  try {
    // Get API config script tag
    const configScriptElement = document.getElementById("api-config");
    // Parse JSON from script tag content
    const pageConfig = JSON.parse(configScriptElement.textContent);
    // Return configuration for this section or null if section not found
    return pageConfig[sectionName] || null;
  } catch (parseError) {
    // Throw error if parsing fails (no fallback)
    throw new Error(
      `Failed to parse API configuration for section: ${sectionName}. ${parseError.message}`
    );
  }
}

/**
 * Internal helper to resolve endpoint URL
 */
function resolveUrl(sectionName, pathSuffix = "") {
  if (!hasApiConfigScript()) return "";
  
  const sectionNameParts = sectionName.split("/");
  const baseSectionName = sectionNameParts[sectionNameParts.length - 1];
  const pageApiConfig = getPageApiConfig(sectionName) || getPageApiConfig(baseSectionName);
  const currentEnvironment = window.Env?.current || "dev";
  
  let baseUrl = (window.AdminEndpoints?.base || {})[currentEnvironment] || "";
  let endpointUrl = "";

  const shouldUseEndpoint =
    pageApiConfig &&
    pageApiConfig[currentEnvironment] &&
    pageApiConfig[currentEnvironment].endpoint &&
    pageApiConfig[currentEnvironment].endpoint.trim() !== "";

  if (shouldUseEndpoint) {
    const configEndpoint = pageApiConfig[currentEnvironment].endpoint;
    if (configEndpoint.startsWith('http://') || configEndpoint.startsWith('https://')) {
      endpointUrl = configEndpoint;
    } else {
      const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
      const cleanPath = configEndpoint.startsWith('/') ? configEndpoint : '/' + configEndpoint;
      endpointUrl = cleanBase + cleanPath;
    }
  } else if (USE_ENDPOINTS) {
    const routePath = (window.AdminEndpoints?.routes || {})[sectionName] || `/${sectionName}`;
    endpointUrl = baseUrl + routePath;
  } else {
    // If not using endpoints and no specific config, return empty
    return "";
  }

  if (pathSuffix) {
    const cleanSuffix = pathSuffix.startsWith('/') ? pathSuffix : '/' + pathSuffix;
    endpointUrl = endpointUrl.endsWith('/') ? endpointUrl.slice(0, -1) + cleanSuffix : endpointUrl + cleanSuffix;
  }

  return endpointUrl;
}

async function fetchWithTimeout(url, fetchOptions = {}, timeoutMilliseconds = FETCH_TIMEOUT) {
  // Create abort controller for timeout handling
  const abortController = new AbortController();
  // Set timeout to abort request after specified duration
  const timeoutIdentifier = setTimeout(() => abortController.abort(), timeoutMilliseconds);

  // Try to fetch the resource
  try {
    // Build headers - default to JSON if body is present
    const headers = { ...(fetchOptions.headers || {}) };
    if (fetchOptions.body && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    // Default cache control to prevent browser caching
    // Only add if cache option is not explicitly provided in fetchOptions
    const finalFetchOptions = {
      // Spread fetch options first
      ...fetchOptions,
      // Use built headers
      headers,
      // Add cache control if not already specified (prevents browser caching)
      ...(fetchOptions.cache === undefined ? { cache: 'no-store' } : {}),
      // Add abort signal for timeout control
      signal: abortController.signal
    };
    
    // Perform fetch request with abort signal
    const fetchResponse = await fetch(url, finalFetchOptions);
    // Clear timeout since request completed
    clearTimeout(timeoutIdentifier);

    // Check if response indicates an HTTP error
    if (!fetchResponse.ok) {
      // Get status text or use default
      const responseStatusText = fetchResponse.statusText || "Unknown Error";
      // Initialize error message with status code
      let errorMessageText = `HTTP ${fetchResponse.status}: ${responseStatusText}`;

      // Try to extract error message from response body
      try {
        // Attempt to parse response as JSON
        const errorResponseData = await fetchResponse.json().catch(() => null);
        // Check if response contains message field
        if (errorResponseData && errorResponseData.message) {
          // Use message from response
          errorMessageText = errorResponseData.message;
        } else if (errorResponseData && errorResponseData.error) {
          // Use error field from response
          errorMessageText = errorResponseData.error;
        }
      } catch (parseError) {
        // If JSON parsing fails, use status text (already set above)
      }

      // Create error object with enhanced message
      const httpError = new Error(errorMessageText);
      // Attach HTTP status code to error
      httpError.status = fetchResponse.status;
      // Attach status text to error
      httpError.statusText = responseStatusText;
      // Mark error as HTTP error type
      httpError.isHttpError = true;
      // Throw the error
      throw httpError;
    }

    // Return successful response
    return fetchResponse;
  } catch (caughtError) {
    // Clear timeout on error
    clearTimeout(timeoutIdentifier);

    // Check if error is due to timeout (abort)
    if (caughtError.name === "AbortError") {
      // Create timeout-specific error
      const timeoutError = new Error(
        `Request timed out after ${timeoutMilliseconds / 1000} seconds`
      );
      // Mark as timeout error
      timeoutError.isTimeout = true;
      // Store timeout duration
      timeoutError.timeout = timeoutMilliseconds;
      // Throw timeout error
      throw timeoutError;
    }

    // Check if error is network-related
    if (caughtError.name === "TypeError" && caughtError.message.includes("fetch")) {
      // Create network error
      const networkError = new Error("Network error: Unable to connect to server");
      // Mark as network error
      networkError.isNetworkError = true;
      // Throw network error
      throw networkError;
    }

    // Re-throw other errors (including HTTP errors)
    throw caughtError;
  }
}

// Expose payload builders for different sections
window.PayloadBuilders = {
  /**
   * Build payload for products section
   * @param {Object} filterValues - Filter values object
   * @param {Object} paginationOptions - Pagination options object
   * @returns {Object} Payload object for API request
   */
  products(filterValues = {}, paginationOptions = {}) {
    // Return payload object with all filter values
    return {
      // Include current environment
      env: window.Env.current,
      // Set section name
      section: "products",
      // Include search query if provided
      q: filterValues.q || undefined,
      // Include category filter if provided
      category: filterValues.category || undefined,
      // Include status filter if provided
      status: filterValues.status || undefined,
      // Include type filter if provided
      type: filterValues.type || undefined,
      // Include in stock filter if true
      in_stock: filterValues.inStock === true ? true : undefined,
      // Include promo filter if true
      promo_only: filterValues.promo === true ? true : undefined,
      // Include SKU filter if provided
      sku: filterValues.sku || undefined,
      // Include minimum price filter if provided
      price_min:
        typeof filterValues.price_from !== "undefined" ? filterValues.price_from : undefined,
      // Include maximum price filter if provided
      price_max: typeof filterValues.price_to !== "undefined" ? filterValues.price_to : undefined,
      // Include tags filter if array is provided
      tags: Array.isArray(filterValues.tags) ? filterValues.tags : undefined,
      // Include pagination options
      pagination: paginationOptions
    };
  },
  /**
   * Build payload for orders section
   * @param {Object} filterValues - Filter values object
   * @param {Object} paginationOptions - Pagination options object
   * @returns {Object} Payload object for API request
   */
  orders(filterValues = {}, paginationOptions = {}) {
    // Return payload object for orders
    return {
      // Include current environment
      env: window.Env.current,
      // Set section name
      section: "orders",
      // Include search query if provided
      query: filterValues.q || undefined,
      // Include status filter if provided
      status: filterValues.status || undefined,
      // Include channel filter if provided
      channel: filterValues.channel || undefined,
      // Include from date filter if provided
      from: filterValues.from || undefined,
      // Include to date filter if provided
      to: filterValues.to || undefined,
      // Include pagination options
      pagination: paginationOptions
    };
  },
  /**
   * Build payload for subscriptions section
   * @param {Object} filterValues - Filter values object
   * @param {Object} paginationOptions - Pagination options object
   * @returns {Object} Payload object for API request
   */
  subscriptions(filterValues = {}, paginationOptions = {}) {
    // Return payload object with spread filters and pagination
    return {
      env: window.Env.current,
      section: "subscriptions",
      ...filterValues,
      pagination: paginationOptions
    };
  },
  /**
   * Build payload for users section
   * @param {Object} filterValues - Filter values object
   * @param {Object} paginationOptions - Pagination options object
   * @returns {Object} Payload object for API request
   */
  users(filterValues = {}, paginationOptions = {}) {
    // Return payload object with spread filters and pagination
    return {
      env: window.Env.current,
      section: "users",
      ...filterValues,
      pagination: paginationOptions
    };
  },
  /**
   * Build payload for user-blocks section
   * @param {Object} filterValues - Filter values object
   * @param {Object} paginationOptions - Pagination options object
   * @returns {Object} Payload object for API request
   */
  "user-blocks"(filterValues = {}, paginationOptions = {}) {
    return {
      env: window.Env.current,
      section: "user-blocks",
      id: filterValues.id || undefined,
      from: filterValues.from || undefined,
      to: filterValues.to || undefined,
      scope: filterValues.scope || undefined,
      is_permanent: filterValues.is_permanent || undefined,
      limit: filterValues.limit || paginationOptions.limit || undefined,
      nextToken: filterValues.nextToken || undefined,
      pagination: paginationOptions
    };
  },
  /**
   * Build payload for media section
   * @param {Object} filterValues - Filter values object
   * @param {Object} paginationOptions - Pagination options object
   * @returns {Object} Payload object for API request
   */
  media(filterValues = {}, paginationOptions = {}) {
    // Return payload object with spread filters and pagination
    return {
      env: window.Env.current,
      section: "media",
      ...filterValues,
      pagination: paginationOptions
    };
  },
  /**
   * Build payload for moderation section
   * @param {Object} filterValues - Filter values object
   * @param {Object} paginationOptions - Pagination options object
   * @returns {Object} Payload object for API request
   */
  moderation(filterValues = {}, paginationOptions = {}) {
    // Return payload object for moderation section
    return {
      env: window.Env.current,
      section: "moderation",
      q: filterValues.q || undefined,
      status: filterValues.status || undefined,
      type: filterValues.type || undefined,
      userId: filterValues.userId || undefined,
      from: filterValues.from || undefined,
      to: filterValues.to || undefined,
      nextToken: filterValues.nextToken || undefined,
      pagination: paginationOptions
    };
  },
  /**
   * Build payload for sales-registry section
   * @param {Object} filterValues - Filter values object
   * @param {Object} paginationOptions - Pagination options object
   * @returns {Object} Payload object for API request
   */
  "sales-registry"(filterValues = {}, paginationOptions = {}) {
    return {
      env: window.Env.current,
      section: "sales-registry",
      payee: filterValues.payee || undefined,
      beneficiary: filterValues.beneficiary || undefined,
      type: filterValues.type || undefined,
      state: filterValues.state || undefined,
      refId: filterValues.refId || undefined,
      purpose: filterValues.purpose || undefined,
      from: filterValues.from || undefined,
      to: filterValues.to || undefined,
      nextToken: filterValues.nextToken || undefined,
      pagination: paginationOptions
    };
  },
  "payment-sessions"(filterValues = {}, paginationOptions = {}) {
    return {
      env: window.Env.current,
      section: "payment-sessions",
      userId: filterValues.userId || undefined,
      orderId: filterValues.orderId || undefined,
      sessionType: filterValues.sessionType || undefined,
      status: filterValues.status || undefined,
      from: filterValues.from || undefined,
      to: filterValues.to || undefined,
      nextToken: filterValues.nextToken || undefined,
      pagination: paginationOptions
    };
  },
  "payment-transactions"(filterValues = {}, paginationOptions = {}) {
    return {
      env: window.Env.current,
      section: "payment-transactions",
      userId: filterValues.userId || undefined,
      beneficiaryId: filterValues.beneficiaryId || undefined,
      orderType: filterValues.orderType || undefined,
      status: filterValues.status || undefined,
      referenceId: filterValues.referenceId || undefined,
      purpose: filterValues.purpose || undefined,
      from: filterValues.from || undefined,
      to: filterValues.to || undefined,
      nextToken: filterValues.nextToken || undefined,
      pagination: paginationOptions
    };
  },
  "payment-schedules"(filterValues = {}, paginationOptions = {}) {
    return {
      env: window.Env.current,
      section: "payment-schedules",
      userId: filterValues.userId || undefined,
      referenceId: filterValues.referenceId || undefined,
      frequency: filterValues.frequency || undefined,
      status: filterValues.status || undefined,
      from: filterValues.from || undefined,
      to: filterValues.to || undefined,
      nextToken: filterValues.nextToken || undefined,
      pagination: paginationOptions
    };
  },
  "payment-tokens"(filterValues = {}, paginationOptions = {}) {
    return {
      env: window.Env.current,
      section: "payment-tokens",
      userId: filterValues.userId || undefined,
      registrationId: filterValues.registrationId || undefined,
      type: filterValues.type || undefined,
      from: filterValues.from || undefined,
      to: filterValues.to || undefined,
      nextToken: filterValues.nextToken || undefined,
      pagination: paginationOptions
    };
  },
  "payment-webhooks"(filterValues = {}, paginationOptions = {}) {
    return {
      env: window.Env.current,
      section: "payment-webhooks",
      orderId: filterValues.orderId || undefined,
      actionTaken: filterValues.actionTaken || undefined,
      handled: filterValues.handled !== undefined && filterValues.handled !== "" ? filterValues.handled === "true" : undefined,
      from: filterValues.from || undefined,
      to: filterValues.to || undefined,
      nextToken: filterValues.nextToken || undefined,
      pagination: paginationOptions
    };
  },
  /**
   * Build payload for demo section
   * @param {Object} filterValues - Filter values object
   * @param {Object} paginationOptions - Pagination options object
   * @returns {Object} Payload object for API request
   */
  demo(filterValues = {}, paginationOptions = {}) {
    // Return payload object with all filter values
    return {
      // Include current environment
      env: window.Env.current,
      // Set section name
      section: "demo",
      // Include search query if provided
      q: filterValues.q || undefined,
      // Include category filter if provided
      category: filterValues.category || undefined,
      // Include status filter if provided
      status: filterValues.status || undefined,
      // Include type filter if provided
      type: filterValues.type || undefined,
      // Include in stock filter if true
      in_stock: filterValues.inStock === true ? true : undefined,
      // Include promo filter if true
      promo_only: filterValues.promo === true ? true : undefined,
      // Include SKU filter if provided
      sku: filterValues.sku || undefined,
      // Include minimum price filter if provided
      price_min:
        typeof filterValues.price_from !== "undefined" ? filterValues.price_from : undefined,
      // Include maximum price filter if provided
      price_max: typeof filterValues.price_to !== "undefined" ? filterValues.price_to : undefined,
      // Include tags filter if array is provided
      tags: Array.isArray(filterValues.tags) ? filterValues.tags : undefined,
      // Include pagination options
      pagination: paginationOptions
    };
  },
  /**
   * Build payload for scylla-db section
   * @param {Object} filterValues - Filter values object
   * @param {Object} paginationOptions - Pagination options object
   * @returns {Object} Payload object for API request
   */
  "scylla-db"(filterValues = {}, paginationOptions = {}) {
    // Return payload object with spread filters and pagination
    return {
      env: window.Env.current,
      section: "scylla-db",
      ...filterValues,
      pagination: paginationOptions
    };
  },
  /**
   * Build payload for postgres section
   * @param {Object} filterValues - Filter values object
   * @param {Object} paginationOptions - Pagination options object
   * @returns {Object} Payload object for API request
   */
  postgres(filterValues = {}, paginationOptions = {}) {
    // Return payload object with spread filters and pagination
    return {
      env: window.Env.current,
      section: "postgres",
      ...filterValues,
      pagination: paginationOptions
    };
  },
  /**
   * Build payload for mysql section
   * @param {Object} filterValues - Filter values object
   * @param {Object} paginationOptions - Pagination options object
   * @returns {Object} Payload object for API request
   */
  mysql(filterValues = {}, paginationOptions = {}) {
    // Return payload object with spread filters and pagination
    return {
      env: window.Env.current,
      section: "mysql",
      ...filterValues,
      pagination: paginationOptions
    };
  },
  /**
   * Build payload for kyc-shufti section
   * @param {Object} filterValues - Filter values object
   * @param {Object} paginationOptions - Pagination options object
   * @returns {Object} Payload object for API request
   */
  "kyc-shufti"(filterValues = {}, paginationOptions = {}) {
    // Return payload object for KYC section
    return {
      // Include current environment
      env: window.Env.current,
      // Set section name
      section: "kyc-shufti",
      // Include search query if provided (maps to userId or reference in backend)
      q: filterValues.q || undefined,
      // Include email filter if provided (client-side filtered)
      email: filterValues.email || undefined,
      // Include country filter if provided (client-side filtered)
      country: filterValues.country || undefined,
      // Include status filter if provided
      status: filterValues.status || undefined,
      // Include from date filter if provided (maps to dateFrom)
      from: filterValues.from || undefined,
      // Include to date filter if provided (maps to dateTo)
      to: filterValues.to || undefined,
      // Include pagination options
      pagination: paginationOptions
    };
  },
  /**
   * Build default payload for unknown sections
   * @param {Object} filterValues - Filter values object
   * @param {Object} paginationOptions - Pagination options object
   * @returns {Object} Payload object for API request
   */
  default(filterValues = {}, paginationOptions = {}) {
    // Return default payload object with spread filters and pagination
    return {
      env: window.Env.current,
      section: "default",
      ...filterValues,
      pagination: paginationOptions
    };
  }
};

/**
 * Fetches data from local JSON files
 * @param {string} sectionName - Section name (products, orders, etc.)
 * @returns {Promise<Array>} Array of data items
 */
async function localFetch(sectionName) {
  // Data files are now located in page/{section}/data.json
  // Get current pathname from window location
  const currentPathname = window.location.pathname;
  // Extract base path (everything before /page/)
  const basePath = currentPathname.substring(0, currentPathname.indexOf("/page/") + 1) || "";
  // Construct full URL to data file
  const dataFileUrl = `${basePath}page/${sectionName}/data.json`;

  // Try to fetch the data file
  try {
    // Fetch data file with timeout handling
    const fetchResponse = await window.ApiService._fetchWithTimeout(dataFileUrl, {
      cache: "no-store"
    });
    // Parse and return JSON data
    return await fetchResponse.json();
  } catch (fetchError) {
    // Enhance error message with file path information
    if (fetchError.isHttpError) {
      // Check for 404 not found error
      if (fetchError.status === 404) {
        // Set custom message for missing file
        fetchError.message = `Data file not found: ${dataFileUrl}`;
      } else if (fetchError.status >= 500) {
        // Set custom message for server errors
        fetchError.message = `Server error (${fetchError.status}): ${
          fetchError.statusText || "Internal Server Error"
        }`;
      }
    } else if (fetchError.isTimeout) {
      // Set custom message for timeout errors
      fetchError.message = `Request timed out after ${
        fetchError.timeout / 1000
      } seconds while loading: ${dataFileUrl}`;
    }
    // Re-throw enhanced error
    throw fetchError;
  }
}

/**
 * Get total count for a section (from separate endpoint)
 * @param {string} sectionName - Section name to get count for
 * @param {Object} filters - Filter values object
 * @returns {Promise<number|null>} Total count or null if unavailable
 */
async function getTotalCount(sectionName, filters = {}) {
  // Use adapter for request building and response transformation
  const adapter = window.ApiAdapters.get(sectionName);
  const countRequest = adapter.buildCountRequest(filters);

  const getLocalCount = async () => {
    const dataArray = await localFetch(sectionName);
    const items = Array.isArray(dataArray) ? dataArray : [];
    return applyMockFilters(items, filters, sectionName).length;
  };

  // If adapter signals no dedicated count endpoint (e.g., combined with list)
  if (!countRequest) {
    try {
      return await getLocalCount();
    } catch (err) {
      console.warn(`[ApiService] getTotalCount local fallback failed:`, err);
      return null;
    }
  }

  try {
    let fullUrl = resolveUrl(sectionName, countRequest.endpointSuffix);
    if (!fullUrl) {
      try {
        return await getLocalCount();
      } catch (err) {
        console.warn(`[ApiService] getTotalCount local fallback failed:`, err);
        return null;
      }
    }

    if (countRequest.params) {
      const qs = countRequest.params.toString();
      if (qs) {
        fullUrl += (fullUrl.includes('?') ? '&' : '?') + qs;
      }
    }

    const response = await fetchWithTimeout(fullUrl, {
      method: countRequest.method || 'GET',
      headers: { "Content-Type": "application/json", ...(countRequest.headers || {}) },
      body: countRequest.data ? JSON.stringify(countRequest.data) : undefined
    });
    
    const responseData = await response.json();
    return adapter.transformCountResponse(responseData);
  } catch (err) {
    console.warn(`[ApiService] getTotalCount failed:`, err);
    return null;
  }
}

/**
 * Fetch a single transaction or session from Axcess (by ID).
 * Uses the page's API config: payment-transactions or payment-sessions endpoint + /axcess/{entity}/{id}.
 * @param {string} entity - "transaction" | "session"
 * @param {string} id - transactionId, gatewayTxnId, or session id / checkoutId
 * @returns {Promise<Object|null>} Fetched payload or null if no endpoint configured
 */
async function fetchFromAxcess(entity, id) {
  if (!id || !entity) return null;
  const section = entity === "transaction" ? "payment-transactions" : "payment-sessions";
  let pageApiConfig;
  try {
    if (!hasApiConfigScript()) return null;
    pageApiConfig = getPageApiConfig(section);
  } catch (e) {
    return null;
  }
  const env = window.Env?.current || "dev";
  let baseUrl = pageApiConfig?.[env]?.endpoint?.trim();
  if (!baseUrl) return null;
  const envBase = (window.AdminEndpoints?.base || {})[env] || "";
  if (envBase && !baseUrl.startsWith("http")) {
    baseUrl = envBase.replace(/\/$/, "") + "/" + baseUrl.replace(/^\//, "");
  }
  const url = baseUrl.replace(/\/$/, "") + "/axcess/" + encodeURIComponent(entity) + "/" + encodeURIComponent(id);
  try {
    const res = await fetchWithTimeout(url, { method: "GET" });
    if (!res.ok) throw new Error(res.statusText || "Request failed");
    return await res.json();
  } catch (err) {
    throw err;
  }
}

/**
 * API Service
 * Main service for fetching data from local or remote sources
 */
/**
 * Apply consolidated mock filtering to a data array
 * @param {Array} dataArray - Array of data items to filter
 * @param {Object} filters - Filter criteria
 * @returns {Array} Filtered array
 */
function applyMockFilters(dataArray, filters, sectionName = "") {
    if (!filters || Object.keys(filters).length === 0) return dataArray;

    const sourceItems = Array.isArray(dataArray) ? dataArray : [];
    let filtered = [...sourceItems];

    const ignoreKeys = new Set([
      "env",
      "section",
      "pagination",
      "limit",
      "offset",
      "nextToken",
      "sortField",
      "sortDirection"
    ]);

    const normalize = (value) => String(value).toLowerCase();

    const toSnakeCase = (value) =>
      String(value)
        .replace(/([a-z])([A-Z])/g, "$1_$2")
        .replace(/[-\s]+/g, "_")
        .toLowerCase();

    const toCamelCase = (value) =>
      String(value)
        .replace(/[-_\s]+(.)?/g, (_, ch) => (ch ? ch.toUpperCase() : ""));

    const buildCandidateKeys = (key) => {
      const candidates = new Set();
      const keyStr = String(key);
      candidates.add(keyStr);
      candidates.add(toSnakeCase(keyStr));
      candidates.add(toCamelCase(keyStr));
      candidates.add(keyStr.replace(/-/g, "_"));
      candidates.add(keyStr.replace(/_/g, "-"));
      return [...candidates].filter(Boolean);
    };

    const getFieldValues = (item, key) => {
      const keys = buildCandidateKeys(key);
      return keys
        .map((k) => item?.[k])
        .filter((v) => v !== undefined && v !== null);
    };

    const isBooleanValue = (value) =>
      value === true || value === false || value === "true" || value === "false";

    const matchesBoolean = (item, key, value) => {
      const values = getFieldValues(item, key);
      if (values.length === 0) return false;
      const boolVal = value === true || value === "true";
      return values.some((v) => {
        if (typeof v === "boolean") return v === boolVal;
        if (typeof v === "string") return normalize(v) === String(boolVal);
        return false;
      });
    };

    const matchesArray = (item, key, values) => {
      const itemValues = getFieldValues(item, key).find((v) => Array.isArray(v));
      if (!Array.isArray(itemValues)) return false;
      const normalized = itemValues.map((v) => normalize(v));
      return values.some((v) => normalized.includes(normalize(v)));
    };

    const getPrimitiveStrings = (item) => {
      const output = [];
      Object.values(item || {}).forEach((value) => {
        if (value === undefined || value === null) return;
        if (Array.isArray(value)) {
          value.forEach((inner) => {
            if (inner === undefined || inner === null) return;
            if (typeof inner === "object") return;
            output.push(normalize(inner));
          });
          return;
        }
        if (typeof value === "object") return;
        output.push(normalize(value));
      });
      return output;
    };

    const filterDefinitions = (() => {
      const baseSection = sectionName.split("/").pop();
      const definitions = window.AdminConfig?.filters?.[sectionName] || window.AdminConfig?.filters?.[baseSection];
      if (!Array.isArray(definitions)) return {};
      return definitions.reduce((acc, def) => {
        if (def?.name) acc[def.name] = def;
        return acc;
      }, {});
    })();

    const resolveMatchType = (key) => {
      const def = filterDefinitions[key];
      if (def?.match) return def.match;
      if (def?.type === "select") return "exact";
      if (def?.type === "date") return "date";
      if (def?.type === "checkbox" || def?.type === "boolean") return "boolean";
      return "contains";
    };

    const getDateCandidates = (item, key) => {
      const candidates = getFieldValues(item, key);
      if (candidates.length) return candidates;
      const keys = Object.keys(item || {}).filter((k) => /(date|time|_at|At)$/i.test(k));
      return keys.map((k) => item[k]).filter((v) => v);
    };

    const applyDateFilter = (filterKey, filterValue, comparison) => {
      const targetKey = filterKey === "from" || filterKey === "to" ? "createdAt" : filterKey.replace(/_(from|to)$/i, "");
      const compareDate = new Date(filterValue);
      if (Number.isNaN(compareDate.getTime())) return;
      if (comparison === "lte") {
        compareDate.setHours(23, 59, 59, 999);
      }
      filtered = filtered.filter((item) => {
        const dateValues = getDateCandidates(item, targetKey);
        return dateValues.some((value) => {
          const parsed = new Date(value);
          if (Number.isNaN(parsed.getTime())) return false;
          return comparison === "gte" ? parsed >= compareDate : parsed <= compareDate;
        });
      });
    };

    if (filters.q) {
      const query = normalize(filters.q);
      filtered = filtered.filter((item) => getPrimitiveStrings(item).some((val) => val.includes(query)));
    }

    Object.entries(filters).forEach(([key, value]) => {
      if (ignoreKeys.has(key) || key === "q") return;
      if (value === undefined || value === null || value === "") return;
      if (typeof value === "string" && ["Any", "all"].includes(value)) return;
      if (typeof value === "object" && !Array.isArray(value)) return;

      if (/_from$/i.test(key)) {
        applyDateFilter(key, value, "gte");
        return;
      }
      if (/_to$/i.test(key)) {
        applyDateFilter(key, value, "lte");
        return;
      }
      if (key === "from") {
        applyDateFilter(key, value, "gte");
        return;
      }
      if (key === "to") {
        applyDateFilter(key, value, "lte");
        return;
      }

      if (Array.isArray(value)) {
        filtered = filtered.filter((item) => matchesArray(item, key, value));
        return;
      }

      if (isBooleanValue(value) || resolveMatchType(key) === "boolean") {
        filtered = filtered.filter((item) => matchesBoolean(item, key, value));
        return;
      }

      const matchType = resolveMatchType(key);
      const needle = normalize(value);
      filtered = filtered.filter((item) => {
        const values = getFieldValues(item, key);
        if (values.length === 0) return false;
        if (matchType === "exact") {
          return values.some((v) => normalize(v) === needle);
        }
        return values.some((v) => normalize(v).includes(needle));
      });
    });

    return filtered;
}

window.ApiService = {
  /**
   * Internal low-level fetch with timeout (Backward compatibility)
   */
  _fetchWithTimeout: fetchWithTimeout,

  /**
   * Get total count for a section from separate endpoint
   */
  getTotalCount: getTotalCount,

  /**
   * Perform a POST request
   */
  async post(sectionName, pathSuffix, data = {}, headers = {}) {
    const url = resolveUrl(sectionName, pathSuffix);
    if (!url) throw new Error(`Could not resolve endpoint for ${sectionName}`);

    return fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(data)
    });
  },

  /**
   * Perform a DELETE request
   */
  async delete(sectionName, pathSuffix, headers = {}) {
    const url = resolveUrl(sectionName, pathSuffix);
    if (!url) throw new Error(`Could not resolve endpoint for ${sectionName}`);

    return fetchWithTimeout(url, {
      method: 'DELETE',
      headers: headers
    });
  },

  /**
   * Resolve full endpoint URL
   */
  resolveEndpoint(sectionName, pathSuffix = "") {
    return resolveUrl(sectionName, pathSuffix);
  },

  /**
   * Get data for a section with optional filters and pagination
   */
  async get(sectionName, { filters = {}, pagination = { limit: 50, offset: 0 } } = {}) {
    // Adapter Pattern: Delegate request building to specific adapter
    const adapter = window.ApiAdapters.get(sectionName);
    
    // Simulate network latency
    await new Promise((resolveFunction) => setTimeout(resolveFunction, 450));

    if (!hasApiConfigScript()) {
      throw new Error(`API configuration script tag (#api-config) is missing for section: ${sectionName}.`);
    }
    
    // Build request via adapter
    const requestConfig = adapter.buildRequest(filters, pagination);
    
    // Resolve URL using centralized logic
    let fullUrl = resolveUrl(sectionName, requestConfig.endpointSuffix);

    if (fullUrl) {
       // REMOTE API LOGIC
       if (requestConfig.params) {
           const qs = requestConfig.params.toString();
           fullUrl += (fullUrl.includes('?') ? '&' : '?') + qs;
       }

       try {
           const fetchOptions = {
               method: requestConfig.method,
               headers: { "Content-Type": "application/json", ...(requestConfig.headers || {}) },
               body: requestConfig.data ? JSON.stringify(requestConfig.data) : undefined
           };

           // Use internal fetch with timeout
           const apiResponse = await fetchWithTimeout(fullUrl, fetchOptions);
           const responseData = await apiResponse.json();
           
           // Transform Response via Adapter
           return adapter.transformResponse(responseData, filters, pagination);

       } catch (apiError) {
        // Simple Error Handling
        if (apiError.isHttpError) {
          if (apiError.status === 404) {
            apiError.message = `Endpoint not found: ${fullUrl}`;
          } else {
            apiError.message = `API error (${apiError.status}): ${apiError.statusText || "Request Failed"}`;
          }
        }
        throw apiError;
       }

    } else {
       // --- LOCAL MOCK DATA LOGIC (Fallback) ---
       let dataArray = await localFetch(sectionName);

        // Apply consolidated mock filtering
        dataArray = applyMockFilters(dataArray, filters, sectionName);

        // Sorting
        if (pagination.sortField) {
          const sortField = pagination.sortField;
          const sortDirection = pagination.sortDirection === 'desc' ? -1 : 1;

          dataArray.sort((a, b) => {
            const valA = a[sortField];
            const valB = b[sortField];

            if (typeof valA === 'string' && typeof valB === 'string') {
              return valA.localeCompare(valB) * sortDirection;
            }
            if (typeof valA === 'number' && typeof valB === 'number') {
              return (valA - valB) * sortDirection;
            }
            // Fallback for other types or mixed types
            if (valA < valB) return -1 * sortDirection;
            if (valA > valB) return 1 * sortDirection;
            return 0;
          });
        }

       // Pagination
       const paginationOffset = Number(pagination?.offset || 0);
       const paginationLimit = Number(pagination?.limit || 50);
       const paginationEndIndex = Math.min(paginationOffset + paginationLimit, dataArray.length);

       return {
        items: dataArray.slice(paginationOffset, paginationEndIndex),
        total: dataArray.length,
        nextCursor: paginationEndIndex < dataArray.length ? paginationEndIndex : null,
        prevCursor: paginationOffset > 0 ? Math.max(0, paginationOffset - paginationLimit) : null
       };
    }
  }
};

// Create backward compatibility alias for DataService
window.DataService = window.ApiService;

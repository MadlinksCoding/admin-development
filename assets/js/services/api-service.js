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
  
  // If adapter signals no dedicated count endpoint (e.g., combined with list)
  if (!countRequest) {
    return null;
  }

  try {
    let fullUrl = resolveUrl(sectionName, countRequest.endpointSuffix);
    if (!fullUrl) return null;

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
 * API Service
 * Main service for fetching data from local or remote sources
 */
/**
 * Apply consolidated mock filtering to a data array
 * @param {Array} dataArray - Array of data items to filter
 * @param {Object} filters - Filter criteria
 * @returns {Array} Filtered array
 */
function applyMockFilters(dataArray, filters) {
    if (!filters || Object.keys(filters).length === 0) return dataArray;
    
    let filtered = [...dataArray];

    // 1. Global Search (q)
    if (filters.q) {
      const s = filters.q.toLowerCase();
      filtered = filtered.filter(i => 
        (i.uid || "").toLowerCase().includes(s) ||
        (i.public_uid || "").toLowerCase().includes(s) ||
        (i.username || "").toLowerCase().includes(s) ||
        (i.display_name || "").toLowerCase().includes(s) ||
        (i.email || "").toLowerCase().includes(s) ||
        (i.userId || i.user_id || "").toLowerCase().includes(s) ||
        (i.referenceId || i.reference_id || "").toLowerCase().includes(s) ||
        (i.title || "").toLowerCase().includes(s) ||
        (i.name || "").toLowerCase().includes(s)
      );
    }

    // 2. Exact User Identifiers
    if (filters.uid) {
        filtered = filtered.filter(i => (i.uid || "").toLowerCase() === filters.uid.toLowerCase());
    }
    if (filters.public_uid) {
        filtered = filtered.filter(i => (i.public_uid || "").toLowerCase() === filters.public_uid.toLowerCase());
    }

    // 3. User Specifics
    if (filters.username) {
      const u = filters.username.toLowerCase();
      filtered = filtered.filter(i => (i.username || "").toLowerCase().includes(u));
    }
    if (filters.display_name) {
      const d = filters.display_name.toLowerCase();
      filtered = filtered.filter(i => (i.display_name || "").toLowerCase().includes(d));
    }
    if (filters.email) {
      const e = filters.email.toLowerCase();
      filtered = filtered.filter(i => (i.email || "").toLowerCase().includes(e));
    }
    if (filters.role && filters.role !== "") {
      const r = filters.role.toLowerCase();
      filtered = filtered.filter(i => (i.role || "").toLowerCase() === r);
    }

    // 4. Status
    if (filters.status && filters.status !== "" && filters.status !== "Any" && filters.status !== "all") {
      const s = filters.status.toLowerCase();
      filtered = filtered.filter(i => (i.status || "").toLowerCase() === s);
    }

    // 5. Media Specifics
    if (filters.media_type) {
        const t = filters.media_type.toLowerCase();
        filtered = filtered.filter(i => (i.media_type || "").toLowerCase() === t);
    }
    if (filters.visibility) {
        const v = filters.visibility.toLowerCase();
        filtered = filtered.filter(i => (i.visibility || "").toLowerCase() === v);
    }
    if (filters.owner_user_id) {
        const o = filters.owner_user_id.toLowerCase();
        filtered = filtered.filter(i => (i.owner_user_id || "").toLowerCase() === o);
    }

    // 6. User Blocks Specifics
    if (filters.blocker_id) {
        const b = filters.blocker_id.toLowerCase();
        filtered = filtered.filter(i => (i.blocker_id || i.fromUserId || "").toLowerCase().includes(b));
    }
    if (filters.blocked_id) {
        const b = filters.blocked_id.toLowerCase();
        filtered = filtered.filter(i => (i.blocked_id || i.toUserId || "").toLowerCase().includes(b));
    }
    if (filters.scope) {
        const s = filters.scope.toLowerCase();
        filtered = filtered.filter(i => (i.scope || "").toLowerCase() === s);
    }
    if (filters.flag) {
        const f = filters.flag.toLowerCase();
        filtered = filtered.filter(i => (i.flag || "").toLowerCase() === f);
    }
    if (filters.is_permanent !== undefined && filters.is_permanent !== "") {
        const p = String(filters.is_permanent) === "true";
        filtered = filtered.filter(i => (i.is_permanent === p || i.isPermanent === p));
    }
    if (filters.expired !== undefined && filters.expired !== "") {
        const e = String(filters.expired) === "true";
        filtered = filtered.filter(i => (i.expired === e));
    }

    // 7. Products Specifics
    if (filters.category && filters.category !== "All") {
        const c = filters.category.toLowerCase();
        filtered = filtered.filter(i => (i.category || "").toLowerCase() === c);
    }
    if (filters.sku) {
        const s = filters.sku.toLowerCase();
        filtered = filtered.filter(i => (i.sku || "").toLowerCase().includes(s));
    }
    if (filters.price_from) {
        const p = parseFloat(filters.price_from);
        filtered = filtered.filter(i => parseFloat(i.price || 0) >= p);
    }
    if (filters.price_to) {
        const p = parseFloat(filters.price_to);
        filtered = filtered.filter(i => parseFloat(i.price || 0) <= p);
    }

    // 8. Date Ranges
    if (filters.from || filters.created_from) {
      const f = new Date(filters.from || filters.created_from);
      filtered = filtered.filter(i => {
        const d = i.createdAt || i.created_at;
        return d && new Date(d) >= f;
      });
    }
    if (filters.to || filters.created_to) {
      const t = new Date(filters.to || filters.created_to);
      t.setHours(23, 59, 59, 999);
      filtered = filtered.filter(i => {
        const d = i.createdAt || i.created_at;
        return d && new Date(d) <= t;
      });
    }
    if (filters.last_activity_from) {
      const f = new Date(filters.last_activity_from);
      filtered = filtered.filter(i => i.last_activity && new Date(i.last_activity) >= f);
    }
    if (filters.last_activity_to) {
      const t = new Date(filters.last_activity_to);
      t.setHours(23, 59, 59, 999);
      filtered = filtered.filter(i => i.last_activity && new Date(i.last_activity) <= t);
    }

    // 9. Boolean Toggles
    if (filters.promo === true || filters.promo === "true") {
        filtered = filtered.filter(i => i.promo === true);
    }
    if (filters.inStock === true || filters.inStock === "true") {
        filtered = filtered.filter(i => i.inStock === true);
    }
    if (filters.featured === true || filters.featured === "true") {
        filtered = filtered.filter(i => i.featured === true);
    }

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
        dataArray = applyMockFilters(dataArray, filters);

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

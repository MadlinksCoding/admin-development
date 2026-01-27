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
 * Fetch with timeout and error handling
 * @param {string} url - URL to fetch from
 * @param {Object} fetchOptions - Fetch API options object
 * @param {number} timeoutMilliseconds - Timeout in milliseconds (default: 20000)
 * @returns {Promise<Response>} Fetch response object
 */
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
    // Resolve configuration (consistent with get() logic)
    const sectionNameParts = sectionName.split("/");
    const baseSectionName = sectionNameParts[sectionNameParts.length - 1];
    const pageApiConfig = getPageApiConfig(sectionName) || getPageApiConfig(baseSectionName);
    const currentEnvironment = window.Env?.current || "dev";
    
    const shouldUseEndpoint =
      pageApiConfig &&
      pageApiConfig[currentEnvironment] &&
      pageApiConfig[currentEnvironment].endpoint &&
      pageApiConfig[currentEnvironment].endpoint.trim() !== "";

    if (USE_ENDPOINTS || shouldUseEndpoint) {
      // --- REMOTE API LOGIC ---
      let endpointUrl;
      const globalBase = (window.AdminEndpoints?.base || {})[currentEnvironment] || "";
      
      if (shouldUseEndpoint && pageApiConfig[currentEnvironment].endpoint) {
          const configEndpoint = pageApiConfig[currentEnvironment].endpoint;
          
          if (configEndpoint.startsWith('http://') || configEndpoint.startsWith('https://')) {
             endpointUrl = configEndpoint;
          } else {
             const cleanBase = globalBase.endsWith('/') ? globalBase.slice(0, -1) : globalBase;
             const cleanPath = configEndpoint.startsWith('/') ? configEndpoint : '/' + configEndpoint;
             endpointUrl = cleanBase + cleanPath;
          }
      } else {
          const routePath = (window.AdminEndpoints?.routes || {})[sectionName] || `/${sectionName}`;
          endpointUrl = globalBase + routePath;
      }

      // Append suffix from adapter (usually "count")
      if (countRequest.endpointSuffix) {
          endpointUrl = endpointUrl.endsWith('/') 
              ? endpointUrl + countRequest.endpointSuffix 
              : endpointUrl + '/' + countRequest.endpointSuffix;
      }

      // Build Full URL with Query Params
      let fullUrl = endpointUrl;
      if (countRequest.params) {
          const qs = countRequest.params.toString();
          if (qs) {
            fullUrl += (fullUrl.includes('?') ? '&' : '?') + qs;
          }
      }

      try {
          const fetchOptions = {
              method: countRequest.method || 'GET',
              headers: { "Content-Type": "application/json", ...(countRequest.headers || {}) },
              body: countRequest.data ? JSON.stringify(countRequest.data) : undefined
          };

          const response = await fetchWithTimeout(fullUrl, fetchOptions);
          const responseData = await response.json();
          
          return adapter.transformCountResponse(responseData);
      } catch (err) {
        console.warn(`[ApiService] Count request failed for ${fullUrl}:`, err);
        return null;
      }
    } else {
      // --- LOCAL MOCK DATA LOGIC ---
      const currentPathname = window.location.pathname;
      const basePath = currentPathname.substring(0, currentPathname.indexOf("/page/") + 1) || "";
      const dataFileUrl = `${basePath}page/${sectionName}/data.json`;
      
      try {
        const fetchResponse = await fetchWithTimeout(dataFileUrl, { 
          cache: "no-store",
          headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
        });
        if (!fetchResponse.ok) return null;
        let fullData = await fetchResponse.json();
        
        if (!Array.isArray(fullData)) return null;
        
        // Mock filtering (re-using transformation logic where possible)
        // For now keep explicit filtering as it matches mock data structure
        if (filters.status && filters.status !== "" && filters.status !== "Any") {
          fullData = fullData.filter(
            (item) => (item.status || "").toLowerCase() === filters.status.toLowerCase()
          );
        }
        
        // Add more mock filters here if needed
        
        return fullData.length;
      } catch (error) {
        console.warn(`[ApiService] Mock data count failed for ${sectionName}:`, error);
        return null;
      }
    }
  } catch (error) {
    console.warn(`[ApiService] getTotalCount failed for ${sectionName}:`, error);
    return null;
  }
}

/**
 * API Service
 * Main service for fetching data from local or remote sources
 */
window.ApiService = {
  /**
   * Expose fetchWithTimeout function for use in page scripts
   */
  _fetchWithTimeout: fetchWithTimeout,
  
  /**
   * Get total count for a section from separate endpoint
   */
  getTotalCount: getTotalCount,

  /**
   * Get data for a section with optional filters and pagination
   * @param {string} sectionName - Section name to fetch data for
   * @param {Object} requestOptions - Options object
   * @param {Object} requestOptions.filters - Filter values object
   * @param {Object} requestOptions.pagination - Pagination object with limit and offset
   * @returns {Promise<Object>} Response object with items, total, nextCursor, prevCursor
   */
  async get(sectionName, { filters = {}, pagination = { limit: 50, offset: 0 } } = {}) {
    // Adapter Pattern: Delegate request building to specific adapter
    const adapter = window.ApiAdapters.get(sectionName);
    console.log("[ApiService] GET - Section:", sectionName, "Adapter:", adapter.constructor.name);

    // Simulate network latency
    await new Promise((resolveFunction) => setTimeout(resolveFunction, 450));

    if (!hasApiConfigScript()) {
      throw new Error(
        `API configuration script tag (#api-config) is missing for section: ${sectionName}. Please add <script type="application/json" id="api-config"> to the page HTML.`
      );
    }
    
    // Config Resolution (Preserved)
    // Try full section name first, then base section name
    const sectionNameParts = sectionName.split("/");
    const baseSectionName = sectionNameParts[sectionNameParts.length - 1];
    const pageApiConfig = getPageApiConfig(sectionName) || getPageApiConfig(baseSectionName);
    
    const currentEnvironment = window.Env.current;
    
    const shouldUseEndpoint =
      pageApiConfig &&
      pageApiConfig[currentEnvironment] &&
      pageApiConfig[currentEnvironment].endpoint &&
      pageApiConfig[currentEnvironment].endpoint.trim() !== "";

    if (USE_ENDPOINTS || shouldUseEndpoint) {
       // --- REMOTE API LOGIC ---
       let endpointUrl;
       const globalBase = (window.AdminEndpoints?.base || {})[window.Env.current] || "";
       
       if (shouldUseEndpoint && pageApiConfig[currentEnvironment].endpoint) {
          const configEndpoint = pageApiConfig[currentEnvironment].endpoint;
          
          // Check if endpoint is absolute (starts with http:// or https://)
          if (configEndpoint.startsWith('http://') || configEndpoint.startsWith('https://')) {
             // Use absolute URL as-is
             endpointUrl = configEndpoint;
          } else {
             // Relative path - merge with global base
             const cleanBase = globalBase.endsWith('/') ? globalBase.slice(0, -1) : globalBase;
             const cleanPath = configEndpoint.startsWith('/') ? configEndpoint : '/' + configEndpoint;
             endpointUrl = cleanBase + cleanPath;
          }
       } else {
          // Use global endpoint configuration with default route
          const routePath = (window.AdminEndpoints?.routes || {})[sectionName] || `/${sectionName}`;
          endpointUrl = globalBase + routePath;
       }

       // Build Request via Adapter
       const requestConfig = adapter.buildRequest(filters, pagination);
       
       // Handle Endpoint Suffix (e.g., /listUserBlocks)
       if (requestConfig.endpointSuffix) {
           endpointUrl = endpointUrl.endsWith('/') 
               ? endpointUrl + requestConfig.endpointSuffix 
               : endpointUrl + '/' + requestConfig.endpointSuffix;
       }

       // Build Full URL with Query Params
       let fullUrl = endpointUrl;
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
           const apiResponse = await window.ApiService._fetchWithTimeout(fullUrl, fetchOptions);
           const responseData = await apiResponse.json();
           
           // Transform Response via Adapter
           return adapter.transformResponse(responseData, filters, pagination);

       } catch (apiError) {
        // Enhanced Error Handling
        if (apiError.isHttpError) {
          if (apiError.status === 404) {
            apiError.message = `Endpoint not found: ${fullUrl}`;
          } else if (apiError.status >= 500) {
            apiError.message = `Internal server error (${apiError.status}): ${apiError.statusText || "Server Error"}`;
          } else {
            apiError.message = `API error (${apiError.status}): ${apiError.statusText || "Request Failed"}`;
          }
        } else if (apiError.isTimeout) {
          apiError.message = `Request timed out after ${apiError.timeout / 1000} seconds: ${fullUrl}`;
        } else if (apiError.isNetworkError) {
          apiError.message = `Network error: Unable to connect to ${fullUrl}`;
        }
        throw apiError;
       }

    } else {
       // --- LOCAL MOCK DATA LOGIC (Fallback) ---
       let dataArray = await localFetch(sectionName);

       // Apply standard filters matching original implementation
       if (filters.q) {
        const searchQuery = filters.q.toLowerCase();
        dataArray = dataArray.filter((dataItem) => {
          const itemUserId = (dataItem.userId || "").toLowerCase();
          const itemReferenceId = (dataItem.referenceId || "").toLowerCase();
          return itemUserId.includes(searchQuery) || itemReferenceId.includes(searchQuery);
        });
       }

       if (filters.email) {
        const emailFilter = filters.email.toLowerCase();
        dataArray = dataArray.filter((dataItem) => {
          const itemEmail = (dataItem.email || "").toLowerCase();
          return itemEmail.includes(emailFilter);
        });
       }

       if (filters.country) {
        const countryFilter = filters.country.toUpperCase();
        dataArray = dataArray.filter((dataItem) => {
          const itemCountry = (dataItem.country || dataItem.data?.country || "").toUpperCase();
          return itemCountry.includes(countryFilter);
        });
       }

       // Status Filter
       if (filters.status && filters.status !== "" && filters.status !== "Any") {
        dataArray = dataArray.filter(
          (dataItem) => (dataItem.status || "").toLowerCase() === filters.status.toLowerCase()
        );
       }

       if (filters.from) {
        const fromDateFilter = new Date(filters.from);
        dataArray = dataArray.filter((dataItem) => {
          const itemCreatedDate = new Date(dataItem.createdAt);
          return itemCreatedDate >= fromDateFilter;
        });
       }

       if (filters.to) {
        const toDateFilter = new Date(filters.to);
        toDateFilter.setHours(23, 59, 59, 999);
        dataArray = dataArray.filter((dataItem) => {
          const itemCreatedDate = new Date(dataItem.createdAt);
          return itemCreatedDate <= toDateFilter;
        });
       }

       // UserBlocks Specifics
       if (filters.fromUserId) {
        const fromFilter = String(filters.fromUserId).toLowerCase();
        dataArray = dataArray.filter((item) =>
          String(item.fromUserId || "").toLowerCase().includes(fromFilter)
        );
       }
       if (filters.toUserId) {
        const toFilter = String(filters.toUserId).toLowerCase();
        dataArray = dataArray.filter((item) =>
          String(item.toUserId || "").toLowerCase().includes(toFilter)
        );
       }
       if (filters.scope) {
        const scopeFilter = String(filters.scope).toLowerCase();
        dataArray = dataArray.filter(
          (item) => String(item.scope || "").toLowerCase() === scopeFilter
        );
       }
       if (filters.flag) {
        const flagFilter = String(filters.flag).toLowerCase();
        dataArray = dataArray.filter(
          (item) => String(item.flag || "").toLowerCase() === flagFilter
        );
       }
       if (filters.isPermanent === true) {
        dataArray = dataArray.filter((item) => item.isPermanent === true);
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

/**
 * API Adapters Service
 * Provides adapter pattern implementation for different API sections.
 * Handles request building and response transformation.
 */

(function() {
    'use strict';

    /**
     * Base API Adapter
     * Handles standard POST requests with JSON payload
     */
    class BaseAdapter {
        constructor(section) {
            this.section = section;
        }

        /**
         * Build the request payload and options
         * @param {Object} filters - Filter values
         * @param {Object} pagination - Pagination options
         * @returns {Object} Request configuration { method, url, data, params }
         */
        buildRequest(filters, pagination) {
            // Default behavior: POST with standard payload
            const payload = this.buildPayload(filters, pagination);
            return {
                method: "POST",
                data: payload
            };
        }

        /**
         * Build the standard payload object
         */
        buildPayload(filters, pagination) {
            return {
                env: window.Env.current,
                section: this.section,
                ...filters,
                pagination: pagination
            };
        }

        /**
         * Build the count request configuration
         * @param {Object} filters - Filter values
         * @returns {Object|null} Request configuration or null if not supported
         */
        buildCountRequest(filters) {
            // Default: GET with filters as query params
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== "") {
                    // Skip nextToken as it doesn't affect total count
                    if (key === 'nextToken') return;
                    params.append(key, value);
                }
            });
            return {
                method: "GET",
                params: params,
                endpointSuffix: "count"
            };
        }

        /**
         * Transform the count response into a number
         * @param {Object} response - Raw API response
         * @returns {number|null} Standardized count
         */
        transformCountResponse(response) {
            if (!response) return null;
            // Handle common count response patterns
            if (typeof response === 'number') return response;
            return response.count !== undefined ? response.count : 
                   (response.totalCount !== undefined ? response.totalCount : 
                   (response.total !== undefined ? response.total : null));
        }

        /**
         * Transform the API response into standard format
         * @param {Object} response - Raw API response
         * @returns {Object} Standardized response { items, total, nextToken, ... }
         */
        transformResponse(response, filters) {
            if (response && response.items && Array.isArray(response.items)) {
                 let items = response.items;
                 // Apply client-side email filter if needed/supported
                 if (filters && filters.email) {
                    const emailParam = filters.email.toLowerCase();
                    items = items.filter(i => (i.email || "").toLowerCase().includes(emailParam));
                 }
                 // Apply client-side country filter
                 if (filters && filters.country) {
                    const countryParam = filters.country.toUpperCase();
                    items = items.filter(i => 
                        (i.country || i.data?.country || "").toUpperCase().includes(countryParam)
                    );
                 }
                 response.items = items;
                 // Update total if we filtered
                 if (filters && (filters.email || filters.country) && typeof response.total === 'number') {
                     response.total = items.length;
                 }
            }
            return response;
        }
    }

    /**
     * KYC Shufti Adapter
     * Handles GET requests and specific field mapping for Shufti Pro integration
     */
    class KycShuftiAdapter extends BaseAdapter {
        buildRequest(filters, pagination) {
            // KYC uses GET method with query parameters
            const params = new URLSearchParams();

            // Map standard filters to API specific query params
            if (filters.q) {
                if (filters.q.startsWith("ref-")) {
                    params.append("reference", filters.q);
                } else {
                    params.append("userId", filters.q);
                }
            }
            if (filters.status && filters.status !== "" && filters.status !== "Any") {
                params.append("status", filters.status);
            }
            if (filters.from) params.append("dateFrom", filters.from);
            if (filters.to) params.append("dateTo", filters.to);
            if (pagination.limit) params.append("limit", pagination.limit);
            
            if (filters.nextToken) {
                params.append("nextToken", filters.nextToken);
            } else if (pagination.offset !== undefined) {
                params.append("offset", pagination.offset);
            }

            return {
                method: "GET",
                params: params,
                useSpecialEndpoint: true // Signal to use specific endpoint construction
            };
        }

        transformResponse(responseData, filters, pagination) {
            // Transform sessions to items
            // Backend returns: { count, sessions, filters, timestamp }
            if (responseData.sessions && Array.isArray(responseData.sessions)) {
                let allItems = responseData.sessions.map((session) => ({
                    ...session,
                    referenceId: session.reference, // Map reference -> referenceId
                    email: session.userEmail,       // Map userEmail -> email
                    country: session.userCountry,   // Map userCountry -> country
                    createdAt: session.created_at,  // Map created_at -> createdAt
                    locale: session.appLocale,
                    mode: session.verificationMode,
                    status: session.status,
                    lastEvent: session.lastEvent || session.status
                }));

                // Apply client-side filtering for unsupported filters (email, country)
                if (filters.email) {
                    const emailFilter = filters.email.toLowerCase();
                    allItems = allItems.filter(item => 
                        (item.email || item.userEmail || "").toLowerCase().includes(emailFilter)
                    );
                }

                if (filters.country) {
                    const countryFilter = filters.country.toUpperCase();
                    allItems = allItems.filter(item => 
                        (item.country || item.userCountry || item.data?.country || "").toUpperCase().includes(countryFilter)
                    );
                }

                // Client-side pagination since backend returns all for this endpoint
                const offset = Number(pagination?.offset || 0);
                const limit = Number(pagination?.limit || 50);
                const endIndex = Math.min(offset + limit, allItems.length);

                return {
                    items: allItems.slice(offset, endIndex),
                    total: allItems.length,
                    nextToken: responseData.nextToken,
                    nextCursor: endIndex < allItems.length ? endIndex : null,
                    prevCursor: offset > 0 ? Math.max(0, offset - limit) : null
                };
            }
            return responseData;
        }
    }

    /**
     * User Blocks Adapter
     * Handles specific query params and show_total_count behavior
     */
    class UserBlocksAdapter extends BaseAdapter {
        buildRequest(filters, pagination) {
            const params = new URLSearchParams();
            
            // Auto-append all set filters
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== "") {
                    params.append(key, value);
                }
            });
            
            // Force show_total_count
            params.append("show_total_count", "1");

            // Handle pagination
            if (pagination.limit) params.append("limit", pagination.limit);
            if (pagination.offset) params.append("offset", pagination.offset);
            if (filters.nextToken) params.append("nextToken", filters.nextToken);

            return {
                method: "GET",
                params: params,
                endpointSuffix: "listUserBlocks" 
            };
        }
    }

    /**
     * Moderation Adapter
     * Handles specific query params and show_total_count behavior
     */
    class ModerationAdapter extends BaseAdapter {
        buildRequest(filters, pagination) {
            const params = new URLSearchParams();
            
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== "") {
                    params.append(key, value);
                }
            });
            
            params.append("show_total_count", "1");
            
             // Handle pagination
            if (pagination.limit) params.append("limit", pagination.limit);
            if (pagination.offset) params.append("offset", pagination.offset);
            if (filters.nextToken) params.append("nextToken", filters.nextToken);


            return {
                method: "GET",
                params: params,
                endpointSuffix: "fetchModerations"
            };
        }
    }

     /**
     * User Adapter
     * Handles GET requests to /fetchUsers and specific field mapping
     */
    class UsersAdapter extends BaseAdapter {
        buildRequest(filters, pagination) {
            const params = new URLSearchParams();
            
            // Map standard filters
            if (filters.q) params.append("q", filters.q);
            if (filters.role) params.append("role", filters.role);
            if (filters.status) params.append("status", filters.status);
            
            // PostgreSQL offset-based pagination
            if (pagination.limit) params.append("limit", pagination.limit);
            if (pagination.offset !== undefined) params.append("offset", pagination.offset);

            return {
                method: "GET",
                params: params,
                endpointSuffix: "fetchUsers"
            };
        }

        transformResponse(responseData) {
            // Backend returns: { users: [...], count: 13 }
            return {
                items: responseData.users || [],
                total: responseData.count || (responseData.users ? responseData.users.length : 0),
                // items are already in correct format (uid, username, etc.)
            };
        }
    }

    /**
     * Products Adapter
     * Specific payload construction
     */
    class ProductsAdapter extends BaseAdapter {
         buildPayload(filters, pagination) {
             return {
                env: window.Env.current,
                section: "products",
                q: filters.q,
                category: filters.category,
                status: filters.status,
                type: filters.type,
                in_stock: filters.inStock === true ? true : undefined,
                promo_only: filters.promo === true ? true : undefined,
                sku: filters.sku,
                price_min: filters.price_from,
                price_max: filters.price_to,
                tags: Array.isArray(filters.tags) ? filters.tags : undefined,
                pagination: pagination
             };
         }
    }
    
    // ... Implement other specific adapters if their payload construction differs significantly 
    // or rely on BaseAdapter if they just dump filters.
    // Looking at ApiService.js, most others (orders, subscriptions, media) just spread filters.
    // BaseAdapter does `...filters`, so it covers subscriptions, media, postgres, scylla, etc.
    // Products, Orders have some renaming (q -> query, etc).

    class OrdersAdapter extends BaseAdapter {
        buildPayload(filters, pagination) {
            return {
                env: window.Env.current,
                section: "orders",
                query: filters.q, // Maps q -> query
                status: filters.status,
                channel: filters.channel,
                from: filters.from,
                to: filters.to,
                pagination: pagination
            };
        }
    }


    /**
     * Media Adapter
     * Handles GET requests to /fetchMediaItems and specific field mapping
     */
    class MediaAdapter extends BaseAdapter {
        buildRequest(filters, pagination) {
            const params = new URLSearchParams();

            // Map standard filters to query parameters
            if (filters.title) params.append("title", filters.title);
            if (filters.media_type) params.append("media_type", filters.media_type);
            if (filters.status) params.append("status", filters.status);
            if (filters.visibility) params.append("visibility", filters.visibility);
            if (filters.owner_user_id) params.append("owner_user_id", filters.owner_user_id);
            if (filters.featured !== undefined) params.append("featured", filters.featured);
            if (filters.coming_soon !== undefined) params.append("coming_soon", filters.coming_soon);
            if (filters.created_from) params.append("created_from", filters.created_from);
            if (filters.created_to) params.append("created_to", filters.created_to);
            if (filters.file_size_min) params.append("file_size_min", filters.file_size_min);
            if (filters.file_size_max) params.append("file_size_max", filters.file_size_max);
            if (filters.file_extension) params.append("file_extension", filters.file_extension);
            if (filters.file_name) params.append("file_name", filters.file_name);
            if (filters.description) params.append("description", filters.description);

            // Pagination
            if (pagination.limit) params.append("limit", pagination.limit);
            if (pagination.offset !== undefined) params.append("offset", pagination.offset);

            return {
                method: "GET",
                params: params,
                endpointSuffix: "fetchMediaItems"
            };
        }

        transformResponse(responseData) {
            // Backend returns: { items: [...], count: number, limit: number, offset: number, nextCursor?: string }
            return {
                items: responseData.items || [],
                total: responseData.count || (responseData.items ? responseData.items.length : 0),
                nextCursor: responseData.nextCursor,
                prevCursor: responseData.prevCursor
            };
        }
    }


    // Registry of all adapters
    const registry = {
        'default': BaseAdapter,
        'kyc-shufti': KycShuftiAdapter,
        'user-blocks': UserBlocksAdapter,
        'moderation': ModerationAdapter,
        'products': ProductsAdapter,
        'orders': OrdersAdapter,
        'users': UsersAdapter,
        'media': MediaAdapter
    };

    /**
     * Factory to get the correct adapter instance
     */
    function getAdapter(sectionName) {
        // Handle path-like section names (e.g. developer/scylla-db -> scylla-db)
        const baseSectionName = sectionName.split("/").pop();
        
        const AdapterClass = registry[baseSectionName] || registry[sectionName] || registry['default'];
        return new AdapterClass(baseSectionName);
    }

    // Expose Global API
    window.ApiAdapters = {
        get: getAdapter,
        registry
    };

})();

// Wrap in IIFE to avoid polluting global scope
(function () {
  'use strict';

  // Wait for AdminShell to be available before proceeding
  function waitForAdminShell() {
    return new Promise((resolve) => {
      if (window.AdminShell && window.AdminShell.pageContent) resolve();
      else document.body.addEventListener("adminshell:ready", resolve, { once: true });
    });
  }

  waitForAdminShell().then(() => {
    const SECTION = "users";

    /**
     * Users Table Configuration
     * Uses core Table component's action system
     */
    const USERS_TABLE_CONFIG = {
      id: "users-table",
      columns: [
        { 
          field: "avatar_url", 
          label: "Avatar",
          formatter: (value, row) => {
            const initials = row.display_name || row.username || 'U';
            const url = value || `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=random`;
            return `<img src="${url}" class="rounded-circle" width="32" height="32" title="${row.username}">`;
          }
        },
        { 
          field: "role", 
          label: "Role", 
          sortable: true,
          formatter: (value) => {
            const badges = { admin: 'bg-danger', moderator: 'bg-warning text-dark', user: 'bg-info text-dark' };
            const badgeClass = badges[value?.toLowerCase()] || 'bg-secondary';
            return `<span class="badge ${badgeClass}">${value || 'user'}</span>`;
          }
        },
        { 
          field: "username", 
          label: "Username", 
          sortable: true,
          formatter: (value) => `<strong>${value}</strong>`
        },
        { field: "display_name", label: "Display Name", sortable: true },
        { field: "uid", label: "Public UID", sortable: true },
        { 
          field: "last_activity", 
          label: "Last Activity", 
          sortable: true,
          formatter: (value) => value ? window.ModerationUtils.formatDateTime(value) : 'Never'
        }
      ],
      actions: [
        {
          label: "View",
          className: "btn btn-sm btn-outline-primary",
          onClick: "viewUser"
        },
        {
          label: "Settings",
          className: "btn btn-sm btn-primary",
          onClick: "editSettings"
        }
      ]
    };

    // Initialize Page
    window.PageRenderer.init({
      section: SECTION,
      tableConfig: USERS_TABLE_CONFIG,
      pagination: { enabled: true, pageSize: 20 }
    });

    /**
     * GLOBAL ACTION HANDLERS
     * These are called by assets/js/ui/table.js when action buttons are clicked
     */

    // 1. View User Profile
    window.viewUser = async (rowData) => {
      const offcanvasEl = document.getElementById('userProfileOffcanvas');
      const offcanvasBody = document.getElementById('userProfileOffcanvasBody');
      const offcanvasTitle = document.getElementById('userProfileOffcanvasLabel');
      
      const bsOffcanvas = bootstrap.Offcanvas.getOrCreateInstance(offcanvasEl);
      offcanvasTitle.textContent = "Loading Profile...";
      offcanvasBody.innerHTML = window.AdminUtils.spinnerInline("Fetching user details...");
      bsOffcanvas.show();

      try {
        const isDev = (window.Env?.current || "dev") === "dev";
        const user = isDev ? rowData : await fetchFullUser(rowData.uid);
        
        offcanvasTitle.textContent = `Profile: ${user.userName || user.username}`;
        offcanvasBody.innerHTML = renderProfileHtml(user);
      } catch (err) {
        offcanvasBody.innerHTML = window.AdminUtils.errorMessage(err);
      }
    };

    // 2. Edit User Settings
    window.editSettings = async (rowData) => {
      const offcanvasEl = document.getElementById('userSettingsOffcanvas');
      const offcanvasBody = document.getElementById('userSettingsOffcanvasBody');
      const offcanvasTitle = document.getElementById('userSettingsOffcanvasLabel');
      
      const bsOffcanvas = bootstrap.Offcanvas.getOrCreateInstance(offcanvasEl);
      offcanvasTitle.textContent = "Loading Settings...";
      offcanvasBody.innerHTML = window.AdminUtils.spinnerInline("Fetching user details...");
      bsOffcanvas.show();

      try {
        const isDev = (window.Env?.current || "dev") === "dev";
        const user = isDev ? rowData : await fetchFullUser(rowData.uid);

        offcanvasTitle.textContent = `Settings: ${user.userName || user.username}`;
        offcanvasBody.innerHTML = renderSettingsFormHtml(user);
        attachSettingsSubmitHandler(user, bsOffcanvas);
      } catch (err) {
        offcanvasBody.innerHTML = window.AdminUtils.errorMessage(err);
      }
    };

    // 3. Create User Modal (Header button)
    window.handleCreateUser = () => {
      const modal = window.ModalViewer;
      modal.init(); // Ensure initialized
      
      const titleEl = document.querySelector("#viewModal .modal-title");
      if (titleEl) titleEl.textContent = "Create New User";

      modal.body.innerHTML = renderCreateUserFormHtml();
      modal.modal.show();

      document.getElementById("createUserForm").onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const payload = buildCreatePayload(Object.fromEntries(formData));

        await window.Processing.process(async () => {
          const endpoint = await resolveEndpoint("users", "createUser");
          const response = await window.ApiService._fetchWithTimeout(endpoint, {
            method: "POST",
            body: JSON.stringify(payload)
          });
          const result = await response.json();
          if (!result.success) throw new Error(result.message || "Failed to create user");
          
          modal.modal.hide();
          document.body.dispatchEvent(new CustomEvent('section:refresh'));
        }, "Creating user...", "User created successfully!");
      };
    };

    // 4. Delete User (Called from Settings sidebar)
    window.handleUserDelete = (userId) => {
      const modal = window.ModalViewer;
      modal.init();

      const titleEl = document.querySelector("#viewModal .modal-title");
      if (titleEl) titleEl.textContent = "Confirm Termination";

      modal.body.innerHTML = `
        <div class="text-center py-3">
          <i class="bi bi-exclamation-triangle text-danger mb-3" style="font-size: 3rem;"></i>
          <h5>Terminate user account?</h5>
          <p class="text-muted">Permanently delete <strong>${userId}</strong>? This action is irreversible.</p>
          <div class="mt-4 d-flex justify-content-center gap-2">
            <button type="button" class="btn btn-secondary px-4" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-danger px-4" id="confirmDeleteBtn">Terminate Account</button>
          </div>
        </div>
      `;
      modal.modal.show();

      document.getElementById("confirmDeleteBtn").onclick = async () => {
        await window.Processing.process(async () => {
          const endpoint = await resolveEndpoint("users", "deleteUser", userId);
          const response = await window.ApiService._fetchWithTimeout(endpoint, { method: "DELETE" });
          const result = await response.json();
          if (!result.success) throw new Error(result.message || "Deletion failed");

          modal.modal.hide();
          window.Processing.closeAllModals(); // Closes offcanvas too
          document.body.dispatchEvent(new CustomEvent('section:refresh'));
        }, "Deleting...", "Account terminated.");
      };
    };

    /**
     * HELPER FUNCTIONS
     */

    async function fetchFullUser(userId) {
      const endpoint = await resolveEndpoint("users", "fetchUserById", userId);
      const res = await window.ApiService._fetchWithTimeout(endpoint);
      const data = await res.json();
      if (!data.success || !data.user) throw new Error(data.message || "User not found");
      return data.user;
    }

    async function resolveEndpoint(section, action, id = "") {
      const pageApiConfig = JSON.parse(document.getElementById("api-config").textContent);
      const currentEnv = window.Env?.current || "dev";
      const config = pageApiConfig[section]?.[currentEnv];
      let baseUrl = config?.endpoint?.match(/^https?:\/\/[^\/]+/)?.[0] || "";
      if (!baseUrl) baseUrl = (window.AdminEndpoints?.base || {})[currentEnv] || "";
      return `${baseUrl}/${section}/${action}${id ? '/' + id : ''}`;
    }

    function renderProfileHtml(user) {
      const profile = user.user_profile || {};
      const socialLinks = (profile.socialUrls || []).map(url => 
        `<a href="${url}" target="_blank" class="btn btn-xs btn-outline-secondary py-0 px-2" style="font-size: 0.75rem;">Link <i class="bi bi-box-arrow-up-right ms-1"></i></a>`
      ).join('') || '<span class="text-muted small">None</span>';

      const addLinks = (profile.additionalUrls || []).map(url => 
        `<a href="${url}" target="_blank" class="btn btn-xs btn-outline-info py-0 px-2" style="font-size: 0.75rem;">Info <i class="bi bi-link-45deg ms-1"></i></a>`
      ).join('') || '';

      const bgImages = (profile.backgroundImages || []).map(img => 
        `<div class="col-4"><img src="${img}" class="img-fluid rounded border shadow-xs" style="height: 60px; width: 100%; object-fit: cover;"></div>`
      ).join('') || '<div class="col-12 text-muted small">None</div>';

      return `
        <div class="text-center mb-4">
           <div class="user-cover-header mb-3" style="height: 120px; background: #e9ecef; border-radius: 8px; overflow: hidden; position: relative;">
              ${profile.coverImage ? `<img src="${profile.coverImage}" style="width: 100%; height: 100%; object-fit: cover;">` : ''}
              <img src="${user.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.userName) + '&background=random'}" 
                   class="rounded-circle shadow-sm border border-white border-4" 
                   width="80" height="80" 
                   style="position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%);">
           </div>
           <h4 class="mt-4 mb-0">${user.displayName || user.userName}</h4>
           <p class="text-muted small mb-2">@${user.userName}</p>
           <span class="badge bg-primary">${user.status || 'offline'}</span>
        </div>

        <h6 class="border-bottom pb-2 mb-3"><i class="bi bi-person-vcard me-2"></i>Identity Details</h6>
        <table class="table table-sm table-borderless mb-4">
           <tbody>
             <tr><th class="text-muted" width="40%">Public UID</th><td><code>${user.publicUid || '-'}</code></td></tr>
             <tr><th class="text-muted">Internal ID</th><td><code>${user.uid}</code></td></tr>
             <tr><th class="text-muted">Role</th><td><span class="badge bg-light text-dark border">${user.role}</span></td></tr>
           </tbody>
        </table>

        <h6 class="border-bottom pb-2 mb-3"><i class="bi bi-person-lines-fill me-2"></i>Profile Details</h6>
        <div class="row g-3 mb-4">
           <div class="col-6"><label class="small text-muted d-block">Gender</label><span>${profile.gender || '-'}</span></div>
           <div class="col-6"><label class="small text-muted d-block">Age</label><span>${profile.age || '-'}</span></div>
           <div class="col-6"><label class="small text-muted d-block">Body Type</label><span>${profile.bodyType || '-'}</span></div>
           <div class="col-6"><label class="small text-muted d-block">Hair Color</label><span>${profile.hairColor || '-'}</span></div>
           <div class="col-12"><label class="small text-muted d-block">Country</label><span>${profile.country || '-'}</span></div>
           <div class="col-12"><label class="small text-muted d-block">Bio</label><p class="small mb-0">${profile.bio || 'None'}</p></div>
        </div>

        <h6 class="border-bottom pb-2 mb-3"><i class="bi bi-link-45deg me-2"></i>Links & Media</h6>
        <div class="mb-4">
            <label class="small text-muted d-block mb-1">Social URLs</label>
            <div class="d-flex flex-wrap gap-1 mb-2">${socialLinks}</div>
            ${addLinks ? `<div class="d-flex flex-wrap gap-1">${addLinks}</div>` : ''}
        </div>
        <div class="mb-4"><label class="small text-muted d-block mb-1">Background Images</label><div class="row g-2">${bgImages}</div></div>
      `;
    }

    function renderSettingsFormHtml(user) {
      const s = user.user_settings || {};
      const p = user.user_profile || {};
      return `
        <form id="userSettingsForm">
          <div class="accordion accordion-flush" id="settingsAccordion">
            <div class="accordion-item">
              <h2 class="accordion-header"><button class="accordion-button px-0 fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#c1"><i class="bi bi-gear me-2"></i>Preferences</button></h2>
              <div id="c1" class="accordion-collapse collapse show"><div class="accordion-body px-0">
                <div class="mb-3"><label class="form-label small fw-bold">Locale</label><input type="text" class="form-control form-control-sm" name="locale" value="${s.locale || 'en-US'}"></div>
                <div class="form-check form-switch mb-3"><input class="form-check-input" type="checkbox" name="callVideoMessage" ${s.callVideoMessage ? 'checked' : ''}><label class="form-check-label small">Video Messaging</label></div>
              </div></div>
            </div>
            <div class="accordion-item">
              <h2 class="accordion-header"><button class="accordion-button px-0 fw-bold collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#c2"><i class="bi bi-person-badge me-2"></i>Profile Content</button></h2>
              <div id="c2" class="accordion-collapse collapse"><div class="accordion-body px-0">
                <div class="mb-3"><label class="form-label small fw-bold">Bio</label><textarea class="form-control form-control-sm" name="bio" rows="2">${p.bio || ''}</textarea></div>
                <div class="row g-2 mb-3">
                  <div class="col-6"><label class="form-label small fw-bold">Gender</label><input type="text" class="form-control form-control-sm" name="gender" value="${p.gender || ''}"></div>
                  <div class="col-6"><label class="form-label small fw-bold">Age</label><input type="number" class="form-control form-control-sm" name="age" value="${p.age || ''}"></div>
                  <div class="col-6"><label class="form-label small fw-bold">Body Type</label><input type="text" class="form-control form-control-sm" name="bodyType" value="${p.bodyType || ''}"></div>
                  <div class="col-6"><label class="form-label small fw-bold">Hair Color</label><input type="text" class="form-control form-control-sm" name="hairColor" value="${p.hairColor || ''}"></div>
                  <div class="col-12"><label class="form-label small fw-bold">Country</label><input type="text" class="form-control form-control-sm" name="country" value="${p.country || ''}"></div>
                </div>
                
                <h6 class="small fw-bold text-muted border-bottom pb-1 mb-2">Media & Assets</h6>
                <div class="mb-2"><label class="form-label small fw-bold">Cover URL</label><input type="url" class="form-control form-control-sm" name="coverImage" value="${p.coverImage || ''}"></div>
                <div class="mb-2"><label class="form-label small fw-bold">Bg Images (CSV)</label><textarea class="form-control form-control-sm" name="backgroundImages" rows="2">${(p.backgroundImages || []).join(',')}</textarea></div>
                
                <h6 class="small fw-bold text-muted border-bottom pb-1 mb-2 mt-3">Links</h6>
                <div class="mb-2"><label class="form-label small fw-bold">Social URLs (CSV)</label><textarea class="form-control form-control-sm" name="socialUrls" rows="2">${(p.socialUrls || []).join(',')}</textarea></div>
                <div class="mb-2"><label class="form-label small fw-bold">Extra URLs (CSV)</label><textarea class="form-control form-control-sm" name="additionalUrls" rows="2">${(p.additionalUrls || []).join(',')}</textarea></div>
              </div></div>
            </div>
          </div>
          <div class="d-grid gap-2 mt-4 pt-3 border-top">
            <button type="submit" class="btn btn-primary" id="saveBtn">Save All Changes</button>
            <button type="button" class="btn btn-outline-danger" onclick="handleUserDelete('${user.uid}')">Terminate Account</button>
          </div>
        </form>`;
    }

    function attachSettingsSubmitHandler(user, bsOffcanvas) {
      document.getElementById('userSettingsForm').onsubmit = async (ev) => {
        ev.preventDefault();
        
        try {
          const raw = Object.fromEntries(new FormData(ev.target));
          
          // Reconstruct notifications object safely
          const currentNotifications = (user.user_settings && typeof user.user_settings.notifications === 'object' && user.user_settings.notifications !== null)
            ? user.user_settings.notifications
            : { email: true, sms: false };

          const payload = {
            displayName: raw.displayName || user.displayName || user.display_name,
            avatarUrl: user.avatar || user.avatarUrl || user.avatar_url,
            role: raw.role || user.role,
            isNewUser: false,
            user_settings: {
              locale: raw.locale,
              callVideoMessage: ev.target.callVideoMessage.checked,
              notifications: { ...currentNotifications }, // Ensure it's a fresh object
              presencePreference: user.user_settings?.presencePreference || "online"
            },
            user_profile: {
              bio: raw.bio,
              gender: raw.gender,
              age: raw.age ? parseInt(raw.age) : null,
              bodyType: raw.bodyType,
              hairColor: raw.hairColor,
              country: raw.country,
              coverImage: raw.coverImage,
              backgroundImages: raw.backgroundImages ? raw.backgroundImages.split(',').map(s => s.trim()).filter(Boolean) : [],
              socialUrls: raw.socialUrls ? raw.socialUrls.split(',').map(s => s.trim()).filter(Boolean) : [],
              additionalUrls: raw.additionalUrls ? raw.additionalUrls.split(',').map(s => s.trim()).filter(Boolean) : []
            }
          };

          // Debug log for troubleshooting backend type errors
          console.log("[Users] Update Payload:", payload);

          await window.Processing.process(async () => {
            const url = await resolveEndpoint("users", "updateUser", user.uid);
            const res = await window.ApiService._fetchWithTimeout(url, { 
              method: "PUT", 
              body: JSON.stringify(payload) 
            });
            const result = await res.json();
            if (!result.success) throw new Error(result.message || "Update failed");
            
            bsOffcanvas.hide();
            document.body.dispatchEvent(new CustomEvent('section:refresh'));
          }, "Saving changes...", "User updated successfully!");

        } catch (err) {
          console.error("[Users] Save Error:", err);
          // Error notice is already handled by Processing.process if called, 
          // but we catch here to prevent "Uncaught (in promise)" console errors.
        }
      };
    }

    function renderCreateUserFormHtml() {
      return `
        <form id="createUserForm">
          <div class="row g-3">
            <div class="col-md-6"><label class="form-label small fw-bold">Username*</label><input type="text" class="form-control form-control-sm" name="userName" required></div>
            <div class="col-md-6"><label class="form-label small fw-bold">Display Name</label><input type="text" class="form-control form-control-sm" name="displayName"></div>
            <div class="col-md-6"><label class="form-label small fw-bold">Role</label><select class="form-select form-select-sm" name="role"><option value="user">User</option><option value="admin">Admin</option></select></div>
            <div class="col-12"><label class="form-label small fw-bold">Bio</label><textarea class="form-control form-control-sm" name="bio" rows="2"></textarea></div>
          </div>
          <div class="mt-4 pt-3 border-top d-flex justify-content-end gap-2">
            <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Cancel</button>
            <button type="submit" class="btn btn-success btn-sm px-4">Create User</button>
          </div>
        </form>`;
    }

    function buildCreatePayload(raw) {
      return {
        userName: raw.userName,
        displayName: raw.displayName,
        role: raw.role,
        isNewUser: true,
        user_settings: { locale: "en-US", notifications: { email: true, sms: false }, callVideoMessage: true, presencePreference: "online" },
        user_profile: { bio: raw.bio || "", country: "", gender: "", age: null, socialUrls: [], backgroundImages: [] }
      };
    }
  });
})();

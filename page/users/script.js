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
        { field: "uid", label: "UID", sortable: true },
        { field: "public_uid", label: "Public UID", sortable: true },
        { 
          field: "avatar_url", 
          label: "Avatar_URL",
          formatter: (value) => {
            const url = value || "https://ui-avatars.com/api/?background=random";
            return `
              <div class="d-flex align-items-center gap-2">
                <img src="${url}" class="rounded-circle" width="32" height="32">
                <span class="text-break">${url}</span>
              </div>
            `;
          }
        },
        { field: "user_name", label: "Username", sortable: true },
        { field: "display_name", label: "Display Name", sortable: true },
        { field: "email", label: "Email", sortable: true },
        { field: "phone_number", label: "Phone Number", sortable: true },
        { field: "role", label: "Role", sortable: true },
        { field: "status", label: "Status", sortable: true },
        // { 
        //   field: "last_activity", 
        //   label: "Last Activity", 
        //   sortable: true,
        //   formatter: (value) => value ? window.ModerationUtils.formatDateTime(value) : 'Never'
        // }
      ],
      actions: [
        {
          label: "View",
          className: "btn btn-sm btn-primary",
          onClick: "viewUser"
        },
        {
          label: "Settings",
          className: "btn btn-sm btn-outline-primary",
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
    
    // Create User Button Handler
    const createUserBtn = document.getElementById("createUserBtn");
    if (createUserBtn) {
      createUserBtn.onclick = () => {
        const modal = window.ModalViewer;
        modal.init();
        
        const titleEl = document.querySelector("#viewModal .modal-title");
        if (titleEl) titleEl.textContent = "User Creation";
        
        modal.body.innerHTML = `
          <div class="text-center py-4">
            <h5>Creation Policy</h5>
            <p class="text-muted px-3">
              Users must go through the proper registration and verification flows(KYC) to be created. 
              Manual creation through this panel is currently disabled to ensure platform integrity.
            </p>
          </div>
        `;
        modal.modal.show();
      };
    }

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
        
        offcanvasTitle.textContent = `User: ${user.user_name || user.username}`;
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

        offcanvasTitle.textContent = `Settings: ${user.user_name || user.userName}`;
        offcanvasBody.innerHTML = renderSettingsFormHtml(user);
      } catch (err) {
        offcanvasBody.innerHTML = window.AdminUtils.errorMessage(err);
      }
    };


    // 4. Delete User (Called from Settings sidebar)
    window.handleUserDelete = (userId) => {
      const modal = window.ModalViewer;
      modal.init();

      const titleEl = document.querySelector("#viewModal .modal-title");
      if (titleEl) titleEl.textContent = "Confirm Termination";

      modal.body.innerHTML = `
        <div class="text-center py-3">
          <i class="bi bi-exclamation-triangle text-primary mb-3" style="font-size: 3rem;"></i>
          <h5>Terminate user account?</h5>
          <p class="text-muted">Permanently delete <strong>${userId}</strong>? This action is irreversible.</p>
          <div class="mt-4 d-flex justify-content-center gap-2">
            <button type="button" class="btn btn-outline-primary px-4" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary px-4" id="confirmDeleteBtn">Terminate Account</button>
          </div>
        </div>
      `;
      modal.modal.show();
      document.getElementById("confirmDeleteBtn").onclick = async () => {
        await window.Processing.process(async () => {
          const res = await window.ApiService.delete("users", `deleteUser/${userId}`);
          const result = await res.json();
          if (!result.success) throw new Error(result.message || "Deletion failed");

          modal.modal.hide();
          window.Processing.closeAllModals(); 
          document.body.dispatchEvent(new CustomEvent('section:refresh'));
        }, "Deleting...", "Account terminated.");
      };
    };

    /**
     * HELPER FUNCTIONS
     */

    async function fetchFullUser(userId) {
      const url = window.ApiService.resolveEndpoint("users", `fetchUserById/${userId}`);
      if (!url) throw new Error("API endpoint not configured");
      
      const res = await window.ApiService._fetchWithTimeout(url);
      const data = await res.json();
      if (!data.success || !data.user) throw new Error(data.message || "User not found");
      return data.user;
    }

    function renderProfileHtml(user) {
      const status = (user.status || "").toLowerCase();
      const statusClass = status === 'online' ? 'success' : status === 'offline' ? 'secondary' : 'warning';
      
      const fields = [
        { label: "UID", value: user.uid },
        { label: "Public UID", value: user.public_uid ||user.publicUid || "-" },
        { label: "Username", value: user.user_name || user.userName || "-" },
        { label: "Display Name", value: user.display_name || "-" },
        { label: "Email", value: user.email || "-" },
        { label: "Role", value: user.role || "-" },
        { label: "Status", value: status.toLowerCase() || "-" },
        { label: "Last Activity", value: user.last_activity ? window.ModerationUtils.formatDateTime(user.last_activity) : "-" }
      ];

      const fieldsHtml = fields.map(f => `<p class="mb-2"><strong>${f.label}:</strong> ${f.value}</p>`).join("");

      return `
       
        <div class="user-details-body">
          ${fieldsHtml}
          ${user.user_profile ? `
            <div class="mt-4 border-top pt-3">
              <h6>Profile Info</h6>
              <p class="mb-2"><strong>Bio:</strong> ${user.user_profile.bio || "-"}</p>
              <p class="mb-2"><strong>Country:</strong> ${user.user_profile.country || "-"}</p>
            </div>
          ` : ''}
          <div class="mt-4 border-top pt-3">
            <h6>Full Table Payload</h6>
            <pre class="code-json bg-white border p-3 rounded small" style="max-height: 400px; overflow: auto;">${JSON.stringify(user, null, 2)}</pre>
          </div>
        </div>
      `;
    }

    function renderSettingsFormHtml(user) {
      const s = user.user_settings || {};
      const n = s.notifications || { email: false, sms: false };
      
      const fields = [
        { label: "Locale", value: s.locale || "en-US" },
        { label: "Email Notifications", value: n.email ? "Enabled" : "Disabled" },
        { label: "Push Notifications", value: n.push ? "Enabled" : "Disabled" },
        { label: "SMS Notifications", value: n.sms ? "Enabled" : "Disabled" },
        { label: "Video Messaging", value: s.call_video_message ? "Enabled" : "Disabled" },
        { label: "Presence", value: s.presence_preference || "-" }
      ];

      const fieldsHtml = fields.map(f => `<p class="mb-2"><strong>${f.label}:</strong> ${f.value}</p>`).join("");

      return `
        <div id="userSettingsPanel" class="d-flex flex-column h-100">
          <div class="flex-grow-1">
          
            <div class="user-settings-body">
              ${fieldsHtml}
              <div class="mt-4 border-top pt-3">
                <h6>Settings Payload</h6>
                <pre class="code-json bg-white border p-3 rounded small" style="max-height: 200px; overflow: auto;">${JSON.stringify(s, null, 2)}</pre>
              </div>
            </div>
          </div>
          <div class="mt-auto pt-3 border-top">
            <div class="d-grid">
              <button type="button" class="btn btn-primary" onclick="handleUserDelete('${user.uid}')">Terminate Account</button>
            </div>
          </div>
        </div>
      `;
    }


  });
})();

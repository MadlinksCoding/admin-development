<!-- user-user blocks -->
<!-- list actions -->
-  (User-User) - List User Blocks(all, global)
-  (User-User) - List Blocks (Feed)
-  (User-User) - List Blocks (Private Chat)

<!-- block actions -->
- (User-User) - Block User (Feed Scope) ["from and to" will be inside the inputs]
- (User-User) - Block User (Private Chat Scope)

<!-- unblock actions -->
- (User-User) - Unblock (Feed)
- (User-User) - Unblock (Feed, Non-Existent)
- (User-User) - Unblock (Private Chat)
- (User-User) - Unblock (Private Chat, Non-Existent)

<!-- check actions -->
- (User-User) - Is User Blocked
- (User-User) - Is Blocked (False Check)
- (User-User) - Is Blocked (Feed)
- (User-User) - Is Blocked (Private Chat)

- (User-User) - Batch Check (all, global Scopes)

<!-- system blocks -->

<!-- list actions -->

- System - List System Blocks(all/ global scopes)
- System - List System (Auth)
- System - List System (Feed)
- System - List System (Private Chat)

<!-- block actions -->

- System - Block IP (Auth)
- System - Block IP (Feed)
- System - Block IP (Private Chat)

- System - Is IP Blocked (Auth)
- System - Is IP Blocked (Feed)
- System - Is IP Blocked (Private Chat)

- System - Block Email (Auth)
- System - Block Email (Feed)
- System - Block Email (Private Chat)

<!-- check actions-->

- System - Is Email Blocked (Auth)
- System - Is Email Blocked (Feed)
- System - Is Email Blocked (Private Chat)


<!-- manual action -->

<!-- there are no scopes   on manual actions in the schema-->

- Manual Action - List Manual Actions(all, paginated)
- Manual Action - Suspend User
- Manual Action - Suspend (Duplicate)
- Manual Action - Unsuspend User
- Manual Action - Is User Suspended
- Manual Action - Warn User


<!--  -->

 Test Scenarios 1: Create User
 Test Scenarios 1-D: Duplicate User
 Test Scenarios 2: Get Users (list)
 Test Scenarios 3: Get User by ID
 Test Scenarios 3-B: Get Non-Existent User
 Test Scenarios 4: Update User (comprehensive)
 Test Scenarios 4-B: Update Role
 Test Scenarios 4-C: Update Non-Existent
 Test Scenarios 5: Update User Settings
 Test Scenarios 5-B: Update Settings 404
 Test Scenarios 6: Update User Profile
 Test Scenarios 6-B: Update Profile 404
 Test Scenarios 7: Delete User
 Test Scenarios 7-B: Delete Non-Existent


 <!--  -->

  Test Scenarios 1-A: User to User - List User Blocks(all, global)
 Test Scenarios 1-B: User to User - List Blocks (Feed)
 Test Scenarios 1-C: User to User - List Blocks (Private Chat)
 Test Scenarios 2-A: User to User - Block User (Feed Permanent)
 Test Scenarios 2-B: User to User - Block User (Private Chat Permanent)
 Test Scenarios 2-C: User to User - Block User (Feed Temporary)
 Test Scenarios 2-D: User to User - Block User (Private Chat Temporary)
 Test Scenarios 3-A: User to User - Unblock (Feed)
 Test Scenarios 3-B: User to User - Unblock (Feed, Non-Existent)
 Test Scenarios 3-C: User to User - Unblock (Private Chat)
 Test Scenarios 3-D: User to User - Unblock (Private Chat, Non-Existent)
 Test Scenarios 4-A: User to User - Is Blocked (Feed)
 Test Scenarios 4-B: User to User - Is Blocked (Private Chat)
 Test Scenarios 5: User to User - Batch Check (all, global Scopes)
 Test Scenarios 6-A: System - List System Blocks(all/ global scopes)
 Test Scenarios 6-B: System - List System (Auth)
 Test Scenarios 6-C: System - List System (Feed)
 Test Scenarios 6-D: System - List System (Private Chat)
 Test Scenarios 7-A: System - Block IP (Auth Permanent)
 Test Scenarios 7-B: System - Block IP (Feed Permanent)
 Test Scenarios 7-C: System - Block IP (Private Chat Permanent)
 Test Scenarios 7-D: System - Block IP (Auth Temporary)
 Test Scenarios 7-E: System - Block IP (Feed Temporary)
 Test Scenarios 7-F: System - Block IP (Private Chat Temporary)
 Test Scenarios 8-A: System - Is IP Blocked (Auth)
 Test Scenarios 8-B: System - Is IP Blocked (Feed)
 Test Scenarios 8-C: System - Is IP Blocked (Private Chat)
 Test Scenarios 9-A: System - Block Email (Auth Permanent)
 Test Scenarios 9-B: System - Block Email (Feed Permanent)
 Test Scenarios 9-C: System - Block Email (Private Chat Permanent)
 Test Scenarios 9-D: System - Block Email (Auth Temporary)
 Test Scenarios 9-E: System - Block Email (Feed Temporary)
 Test Scenarios 9-F: System - Block Email (Private Chat Temporary)
 Test Scenarios 10-A: System - Is Email Blocked (Auth)
 Test Scenarios 10-B: System - Is Email Blocked (Feed)
 Test Scenarios 10-C: System - Is Email Blocked (Private Chat)
 Test Scenarios 11: Manual Action - List Manual Actions(all, paginated)
 Test Scenarios 12-A: Manual Action - Suspend User
 Test Scenarios 12-B: Manual Action - Suspend (Duplicate)
 Test Scenarios 13: Manual Action - Unsuspend User
 Test Scenarios 14: Manual Action - Is User Suspended
 Test Scenarios 15: Manual Action - Warn User
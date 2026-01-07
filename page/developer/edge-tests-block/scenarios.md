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

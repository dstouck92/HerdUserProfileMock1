# Fixing Supabase "Unhealthy" So the Web App Works Again

When your Supabase project shows **Unhealthy** in the dashboard, the database or related services are not responding. The web app cannot sign users in until the project is healthy again.

## Quick fixes (try in order)

### 1. Restore the project (if it’s Paused)

- Open [Supabase Dashboard](https://supabase.com/dashboard) and select your project.
- If the status is **Paused** (common on the free tier after inactivity), click **Restore project**.
- Wait a few minutes for the project to become **Healthy** before using the app again.

### 2. Restart the database (if status is Unhealthy)

- In the dashboard go to **Project Settings** → **General**:  
  [https://supabase.com/dashboard/project/_/settings/general](https://supabase.com/dashboard/project/_/settings/general)
- Use **Restart database** (or equivalent) if available.
- Wait a couple of minutes. Restart is only a temporary fix if the project is undersized or under heavy load.

### 3. Give the project time after restore/restart

- After restoring or restarting, it can take **a few minutes** for all services to become fully operational. Refresh the project status in the dashboard and try logging in again once it shows **Healthy**.

## If Unhealthy keeps coming back

- **Increase resources**: In the dashboard go to **Settings** → **Compute and Disk** and increase compute/disk if needed.
- **Performance**: See [Supabase performance tuning](https://supabase.com/docs/guides/platform/performance) and [troubleshooting connection timeouts](https://supabase.com/docs/guides/troubleshooting/failed-to-run-sql-query-connection-terminated-due-to-connection-timeout).
- **Stuck restart**: If the project gets stuck “restarting”, contact [Supabase support](https://supabase.com/support) with your project details.

## While the backend is down

- The app’s login screen can show **“Open in demo mode”** when it detects that the backend is unavailable. Use that to open the app with empty data until Supabase is healthy again.

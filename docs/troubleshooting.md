# Troubleshooting Guide

## Common Issues & Solutions

### Development Environment Issues

#### Supabase Not Starting

**❌ Error: "Docker not running"**
```bash
Error: Cannot connect to the Docker daemon
```
**Solution:**
1. Start Docker Desktop application
2. Wait for Docker to fully initialize
3. Run `bunx supabase start`

**❌ Error: "Port conflicts"**
```bash
Error: Port 54321 is already in use
```
**Solution:**
```bash
# Check what's using the ports
lsof -i :54321
lsof -i :54322
lsof -i :54323

# Stop conflicting services or change Supabase ports in config.toml
bunx supabase stop
bunx supabase start
```

**❌ Error: "Database reset fails"**
```bash
Error: Failed to reset database
```
**Solution:**
```bash
# Stop Supabase completely
bunx supabase stop

# Remove all containers and volumes
docker system prune -f
docker volume prune -f

# Start fresh
bunx supabase start
```

#### Database Connection Issues

**❌ Error: "Connection refused"**
```bash
Error: connect ECONNREFUSED 127.0.0.1:54322
```
**Solution:**
1. Check Supabase status: `bunx supabase status`
2. Ensure all services are running (green status)
3. Verify `.env.local` has correct URLs
4. Restart Supabase if needed: `bunx supabase stop && bunx supabase start`

**❌ Error: "Invalid database URL"**
```bash
Error: Invalid database URL format
```
**Solution:**
1. Check `.env.local` file exists and contains correct values
2. Verify no extra spaces or quotes in environment variables
3. Regenerate `.env.local`: 
   ```bash
   rm .env.local
   bunx supabase stop
   bunx supabase start
   ```

#### Build & Development Issues

**❌ Error: "Module not found"**
```bash
Error: Cannot resolve module '@/components/...'
```
**Solution:**
```bash
# Clear node modules and reinstall
rm -rf node_modules bun.lockb
bun install

# Check if path mapping is correct in vite.config.ts
```

**❌ Error: "TypeScript errors"**
```bash
Error: Type 'X' is not assignable to type 'Y'
```
**Solution:**
```bash
# Run type checking
bun run lint

# Check for missing type definitions
bun add -D @types/node @types/react @types/react-dom
```

### Google Maps Integration Issues

#### Maps Not Loading

**❌ Error: "This page can't load Google Maps correctly"**
```bash
Google Maps JavaScript API error: MissingKeyMapError
```
**Solution:**
- **For basic usage**: Google Maps should work without API key
- Check browser console for specific error details

**❌ Error: "Development watermark showing"**
```bash
"For development purposes only" watermark appears
```
**Solution:**
- This is expected in development without API key
- For production: Configure Google Maps API key with proper billing
- Enable required APIs in Google Cloud Console

**❌ Error: "Map not rendering"**
```bash
Map container appears but no map loads
```
**Solution:**
1. Check browser console for JavaScript errors
2. Verify internet connectivity
3. Clear browser cache and reload
4. Check if ad blockers are interfering

#### Maps Performance Issues

**❌ Issue: "Map loads slowly"**
**Solution:**
- Reduce initial zoom level
- Implement marker clustering for large datasets
- Optimize marker icons (use smaller images)

**❌ Issue: "Too many markers"**
**Solution:**
- Implement viewport-based marker loading
- Use marker clustering libraries
- Consider server-side filtering

### Admin Dashboard Issues

#### Authentication Problems

**❌ Error: "Access denied"**
```bash
Error: User does not have admin privileges
```
**Solution:**
1. Verify user has correct role in Supabase:
   ```sql
   SELECT email, raw_user_meta_data 
   FROM auth.users 
   WHERE email = 'your-admin@example.com';
   ```
2. Add admin role if missing:
   ```sql
   UPDATE auth.users 
   SET raw_user_meta_data = '{"role": "supermarket_admin"}'::jsonb
   WHERE email = 'your-admin@example.com';
   ```

**❌ Error: "500 Internal Server Error during login"**
```bash
Error: Invalid user record
```
**Solution:**
1. Delete problematic user:
   ```sql
   DELETE FROM auth.users WHERE email = 'your-email@example.com';
   ```
2. Recreate user via Supabase Studio UI (not SQL)
3. Ensure "Auto Confirm User" is checked

**❌ Error: "Invalid login credentials"**
```bash
Error: Invalid email or password
```
**Solution:**
1. Verify email and password are correct
2. Check user exists in Authentication → Users
3. Ensure user is confirmed (not pending email verification)
4. Try password reset if needed

#### Dashboard Functionality Issues

**❌ Error: "No incidents showing"**
```bash
Dashboard shows 0 incidents but data exists
```
**Solution:**
1. Check RLS policies are applied correctly
2. Verify admin user has proper permissions
3. Test with direct SQL query in Supabase Studio

**❌ Error: "Bulk operations failing"**
```bash
Error: Function 'bulk_resolve_incidents' does not exist
```
**Solution:**
1. Ensure database migration has been applied:
   ```bash
   bunx supabase db reset
   ```
2. Check function exists in Supabase Studio → SQL Editor

### Data Synchronization Issues

#### Google Places API Problems

**❌ Error: "API key not found"**
```bash
Error: You must use an API key to authenticate each request
```
**Solution:**
1. Get API key from [Google Cloud Console](https://console.cloud.google.com/)
2. Add to `.env` file: `GOOGLE_PLACES_API_KEY=your_key_here`
3. Ensure no spaces or quotes around the key value

**❌ Error: "This service is not enabled"**
```bash
Error: Google Places API (New) has not been used
```
**Solution:**
1. Go to Google Cloud Console
2. Navigate to APIs & Services → Library
3. Search for "Places API (New)"
4. Click Enable
5. Wait 5-10 minutes for activation

**❌ Error: "Quota exceeded"**
```bash
Error: You have exceeded your daily quota
```
**Solution:**
1. Check usage in Google Cloud Console
2. Increase quotas or wait for reset
3. Implement more aggressive rate limiting in sync script

#### Database Sync Issues

**❌ Error: "RLS policy violation"**
```bash
Error: new row violates row-level security policy
```
**Solution:**
1. Ensure using service role key, not anon key
2. Verify `SUPABASE_SERVICE_ROLE_KEY` environment variable
3. Check admin permissions are configured correctly

**❌ Error: "Duplicate key value"**
```bash
Error: duplicate key value violates unique constraint
```
**Solution:**
- This should be handled by `ON CONFLICT` clause
- Check sync script is using proper upsert logic
- Verify Google Place IDs are being used correctly

**❌ Error: "Connection timeout"**
```bash
Error: Connection timed out
```
**Solution:**
1. Check network connectivity
2. Verify Supabase URL is correct
3. Try reducing batch size in sync script

### Performance Issues

#### Slow Loading Times

**❌ Issue: "App loads slowly"**
**Solution:**
1. Check browser Network tab for slow requests
2. Verify database indexes are created
3. Optimize queries in Supabase Studio
4. Consider implementing loading states

**❌ Issue: "Map interactions are laggy"**
**Solution:**
1. Reduce number of markers displayed
2. Implement marker clustering
3. Use efficient marker update strategies
4. Check for memory leaks in browser dev tools

#### Memory Issues

**❌ Issue: "Browser tab crashes"**
**Solution:**
1. Reduce marker count using clustering
2. Implement proper cleanup in useEffect hooks
3. Avoid memory leaks in event listeners
4. Use React.memo for expensive components

### Network & Connectivity Issues

#### API Rate Limiting

**❌ Error: "Too many requests"**
```bash
Error: Rate limit exceeded
```
**Solution:**
1. Implement exponential backoff in API calls
2. Add delays between requests in sync script
3. Consider caching strategies
4. Monitor API usage patterns

#### CORS Issues

**❌ Error: "Cross-origin request blocked"**
```bash
Error: Access to fetch has been blocked by CORS policy
```
**Solution:**
- **Google Places API**: Use server-side sync script (CORS not supported)
- **Supabase**: Ensure correct domain configuration
- **Development**: Use local environment properly

### Data Integrity Issues

#### Inconsistent Status

**❌ Issue: "Supermarket shows wrong status"**
**Solution:**
1. Check incident override logic in `useSupermarkets.ts`
2. Verify recent incidents are being considered
3. Run manual sync to update Google Places data
4. Check status determination logic in sync script

**❌ Issue: "Incidents not appearing"**
**Solution:**
1. Verify incident was created successfully in database
2. Check real-time subscriptions are working
3. Refresh browser cache
4. Check RLS policies allow reading incidents

### Browser Compatibility Issues

#### Safari Issues

**❌ Issue: "Map not working in Safari"**
**Solution:**
1. Ensure iOS/Safari versions are supported
2. Check for specific Safari console errors
3. Test with different Safari versions
4. Consider Safari-specific polyfills

#### Mobile Issues

**❌ Issue: "Touch interactions not working"**
**Solution:**
1. Test touch event handlers
2. Ensure responsive design is working
3. Check viewport meta tag in index.html
4. Test on actual devices, not just browser dev tools

### Deployment Issues

#### Build Failures

**❌ Error: "Build failed"**
```bash
Error: Build failed with exit code 1
```
**Solution:**
1. Fix TypeScript errors: `bun run lint`
2. Ensure all dependencies are installed
3. Check for missing environment variables
4. Verify build configuration in `vite.config.ts`

#### Environment Variables

**❌ Issue: "Environment variables not working in production"**
**Solution:**
1. Ensure variables start with `VITE_` prefix for client-side
2. Configure variables in deployment platform (Vercel, Netlify)
3. Check variable names match exactly (case-sensitive)
4. Restart deployment after adding variables

## Debugging Strategies

### Browser Developer Tools

**Console Debugging**
1. Open browser console (F12)
2. Look for red error messages
3. Check network tab for failed requests
4. Monitor performance tab for bottlenecks

**React Developer Tools**
1. Install React DevTools browser extension
2. Inspect component state and props
3. Profile component renders
4. Check for unnecessary re-renders

### Database Debugging

**Supabase Studio**
1. Access at `http://localhost:54323` (local) or cloud dashboard
2. Use SQL Editor to test queries directly
3. Check Table Editor for data integrity
4. Monitor real-time messages in API tab

**SQL Debugging**
```sql
-- Check supermarket data
SELECT * FROM supermarkets LIMIT 10;

-- Check incident data
SELECT * FROM supermarket_incidents ORDER BY reportedAt DESC LIMIT 10;

-- Check admin user
SELECT email, raw_user_meta_data FROM auth.users 
WHERE raw_user_meta_data->>'role' = 'supermarket_admin';

-- Test admin function
SELECT * FROM get_admin_dashboard_stats();
```

### Network Debugging

**API Request Monitoring**
1. Check Network tab in browser dev tools
2. Look for 4xx/5xx HTTP status codes
3. Examine request/response headers
4. Check request timing and size

**Supabase API Debugging**
```javascript
// Enable debug mode for Supabase client
const supabase = createClient(url, key, {
  auth: {
    debug: true
  }
});
```

## Getting Help

### When to Create an Issue

Create a GitHub issue when:
- Problem persists after trying troubleshooting steps
- Error is reproducible with specific steps
- Issue affects core functionality
- Documentation is unclear or incorrect

### Issue Template

```markdown
**Environment:**
- OS: [e.g. macOS 13.0]
- Browser: [e.g. Chrome 115]
- Node.js: [e.g. 18.17.0]
- Bun: [e.g. 1.0.0]

**Problem Description:**
[Clear description of the issue]

**Steps to Reproduce:**
1. [First step]
2. [Second step]
3. [etc.]

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Console Logs:**
[Any relevant console output]

**Additional Context:**
[Any other relevant information]
```

### Community Resources

- **GitHub Issues**: Report bugs and feature requests
- **Supabase Documentation**: Database and auth help
- **Google Maps Documentation**: Maps integration help
- **React Documentation**: Frontend development help
# Admin Guide

## Admin Access Configuration

### 1. Create Admin User in Supabase

**Important**: Always create admin users via the Supabase Studio UI to ensure proper field initialization.

1. **Go to Supabase Studio**: For local development: http://localhost:54323
2. **Navigate to**: Authentication → Users
3. **Click "Add User"**
4. **Fill in the form**:
   - **Email**: Your admin email (e.g., `admin@test.com`)
   - **Password**: Create a secure password (e.g., `admin123`)
   - **Auto Confirm User**: ✓ (checked)
5. **Click "Create User"**

### 2. Add Admin Role to User

After the user is created, add the admin role using SQL:

1. **Go to**: SQL Editor in Supabase Studio
2. **Run this SQL**:
   ```sql
   UPDATE auth.users 
   SET raw_user_meta_data = '{"role": "supermarket_admin"}'::jsonb
   WHERE email = 'admin@test.com';  -- Replace with your admin email
   ```

**Note**: Do not create users manually via SQL INSERT as this can cause authentication errors due to missing required fields.

### 3. Apply Database Migration

Run the migration to set up the incidents table and admin permissions:

```bash
bunx supabase db reset  # This will apply all migrations
```

Or to apply migrations to existing database:

```bash
bunx supabase db push
```

### 4. Environment Configuration

The admin dashboard uses Supabase authentication. Ensure your `.env.local` file has:

```env
# Supabase configuration (automatically created by `bunx supabase start`)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Admin Access Flow

### How Admin Authentication Works

The application uses **Supabase Authentication** with role-based access control. Admin users are identified by a special role in their user metadata.

**Admin User Identification:**
```json
{
  "role": "supermarket_admin"
}
```

### Step-by-Step Access Process

**1. Create Admin User (One-time setup)**
```bash
# In your Supabase dashboard
1. Go to Authentication > Users
2. Click "Add User"
3. Fill in admin details:
   - Email: your-admin@example.com
   - Password: [secure password]
   - Email confirmed: ✓ (checked)
4. In User metadata (JSON), add:
   {
     "role": "supermarket_admin"
   }
5. Save the user
```

**2. Access Admin Panel**
```bash
# Method 1: Direct URL
Navigate to: http://localhost:5173/admin

# Method 2: From main app
1. Go to http://localhost:5173
2. Add /admin to the URL
```

**3. Authentication Flow**
```
1. Visit /admin → Redirected to Supabase Auth (if not logged in)
2. Login with admin credentials → Supabase validates user
3. App checks user.user_metadata.role === 'supermarket_admin'
4. If admin role found → Access granted to dashboard
5. If no admin role → "Access denied" message shown
```

## Admin Panel Features

Once authenticated as admin, you can:

- **📊 Dashboard Overview**: View system statistics and incident summaries
- **⚠️ Incident Management**: Review, update, and resolve user-reported incidents  
- **🏪 Supermarket Data**: Monitor locations with active incidents
- **📋 Bulk Operations**: Resolve multiple incidents at once
- **🔄 Data Refresh**: Manually refresh dashboard data

## Troubleshooting Admin Access

**❌ "Access denied" message:**
- Verify user has `"role": "supermarket_admin"` in user metadata
- Check that user is properly logged in to Supabase
- Ensure local Supabase is running (`bunx supabase status`)

**❌ Can't reach admin panel:**
- Verify URL is correct: `http://localhost:5173/admin`
- Check development server is running (`bun run dev`)
- Look for JavaScript errors in browser console

**❌ 500 Internal Server Error during login:**
- This usually means the user was created via SQL with missing fields
- Delete the user and recreate via Supabase Studio UI
- Run: `DELETE FROM auth.users WHERE email = 'your-email@example.com';`
- Then recreate via UI as described above

**❌ User metadata not saving:**
- Ensure JSON is valid: `{"role": "supermarket_admin"}`
- Check Supabase dashboard permissions
- Try logging out and back in after metadata changes

**❌ "Invalid login credentials" error:**
- Verify the email and password are correct
- Check that the user exists in Authentication → Users
- Ensure "Auto Confirm User" was checked during creation

## Security Notes

- Admin access is controlled via Row Level Security (RLS) policies
- Admin users are identified by the `supermarket_admin` role in user metadata
- All admin functions include permission checks
- Regular users cannot access sensitive admin data
- Database functions use `SECURITY DEFINER` with proper authorization checks
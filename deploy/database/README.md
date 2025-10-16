# New Era Database Schema

## Overview
This is a simplified yet robust PostgreSQL database schema for the New Era application, designed for Supabase integration with proper authentication and session management.

## Database Structure

### ENUM Types
```sql
-- User roles for access control
CREATE TYPE user_role AS ENUM ('Administrator', 'Member');

-- Device types for session tracking
CREATE TYPE device_type AS ENUM ('desktop', 'mobile', 'tablet', 'unknown');

-- Session status for enhanced session management
CREATE TYPE session_status AS ENUM ('active', 'expired', 'revoked');
```

### Tables

#### 1. `accounts` - Authentication Credentials
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Unique account identifier |
| `email` | VARCHAR(255) | User email (unique) |
| `password_hash` | TEXT | Hashed password |
| `created_at` | TIMESTAMPTZ | Account creation time |
| `updated_at` | TIMESTAMPTZ | Last update time |

#### 2. `users` - Profile Information
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Unique user identifier |
| `account_id` | UUID (FK) | Reference to accounts table |
| `full_name` | VARCHAR(200) | User's full name |
| `field_of_interest` | VARCHAR(100) | User's field of interest |
| `role` | user_role | Administrator or Member |
| `created_at` | TIMESTAMPTZ | Profile creation time |
| `updated_at` | TIMESTAMPTZ | Last update time |

#### 3. `user_sessions` - Enhanced Session Management
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Unique session identifier |
| `account_id` | UUID (FK) | Reference to accounts table |
| `session_token` | TEXT | Unique session token |
| `device_type` | device_type | Type of device |
| `device_name` | VARCHAR(100) | Device description |
| `ip_address` | INET | User's IP address |
| `user_agent` | TEXT | Browser user agent |
| `location_country` | VARCHAR(2) | ISO country code |
| `location_city` | VARCHAR(100) | City name |
| `status` | session_status | Session status |
| `last_activity` | TIMESTAMPTZ | Last activity time |
| `expires_at` | TIMESTAMPTZ | Session expiration |
| `created_at` | TIMESTAMPTZ | Session creation time |

## Indexes
- `idx_accounts_email` - Fast email lookups
- `idx_users_account_id` - User-account relationship
- `idx_users_role` - Role-based queries
- `idx_user_sessions_account_id` - Session-account relationship
- `idx_user_sessions_expires_at` - Session expiration queries
- `idx_user_sessions_status` - Session status filtering
- `idx_user_sessions_last_activity` - Activity tracking

## Features

### ✅ **Simplified Structure**
- Only essential fields for core functionality
- Clean separation of concerns between authentication and profile data

### ✅ **Role-Based Access Control**
- Administrator and Member roles
- Enum-based for type safety and performance

### ✅ **Enhanced Session Tracking**
- Device and location tracking
- Session status management (active/expired/revoked)
- Security monitoring capabilities

### ✅ **PostgreSQL Best Practices**
- Proper ENUM types instead of VARCHAR constraints
- Optimized indexes for common queries
- Automatic timestamp updates via triggers

### ✅ **Supabase Integration**
- Compatible with Supabase authentication
- Ready for Row Level Security (RLS) policies
- TypeScript type definitions included

## Deployment

To deploy this schema to your Supabase database:

```bash
psql -h db.zjzfuhbyrjvaqiccawdj.supabase.co -p 5432 -d postgres -U postgres -f schema.sql
```

## TypeScript Integration

The schema includes full TypeScript type definitions:

```typescript
interface Account {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

interface User {
  id: string;
  account_id: string;
  full_name: string;
  field_of_interest: string | null;
  role: 'Administrator' | 'Member';
  created_at: string;
  updated_at: string;
}

interface UserSession {
  id: string;
  account_id: string;
  session_token: string;
  device_type: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  device_name: string | null;
  ip_address: string | null;
  user_agent: string | null;
  location_country: string | null;
  location_city: string | null;
  status: 'active' | 'expired' | 'revoked';
  last_activity: string;
  expires_at: string;
  created_at: string;
}
```

## Security Considerations

1. **Password Security**: Passwords are hashed before storage
2. **Session Management**: Comprehensive session tracking with expiration
3. **Device Tracking**: Monitor login devices and locations
4. **Role-Based Access**: Clear distinction between Administrator and Member roles
5. **Audit Trail**: Timestamps for all operations

This schema provides a solid foundation for the New Era application with room for future enhancements while maintaining simplicity and performance.

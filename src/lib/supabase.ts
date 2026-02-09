import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Initialize the Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Resend API token - prefer reading from env. If you intentionally want to hardcode for testing,
// you can set the fallback below but avoid committing secrets to source control.
// Example env var: VITE_RESEND_API_KEY=re_xxx
const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY || 're_6JLjjcpY_Q7dVyUsxfD4pRHjmJ5CQSpFp';

// Database Types
export interface Account {
  id: string
  email: string
  password_hash: string
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  account_id: string // Foreign key to accounts table
  full_name: string
  field_of_interest: string | null // Changed from enum union to string for table flexibility
  role: 'Administrator' | 'Member'
  created_at: string
  updated_at: string
}

export interface UserSession {
  id: string
  account_id: string
  session_token: string
  device_type: 'desktop' | 'mobile' | 'tablet' | 'unknown'
  device_name: string | null
  ip_address: string | null
  user_agent: string | null
  location_country: string | null
  location_city: string | null
  status: 'active' | 'expired' | 'revoked'
  last_activity: string
  expires_at: string
  created_at: string
}

export interface UserProfile extends User {
  account: Account
}

export interface Event {
  id: string
  title: string
  description: string | null
  date: string
  time: string | null // Add time field
  location: string | null
  image_url: string | null
  attendees: number
  max_attendees: number | null
  created_at: string
  updated_at: string
}

export interface EventRegistration {
  id: string
  event_id: string
  user_id: string
  registration_date: string
  status: 'registered' | 'attended' | 'cancelled'
}

export interface EventWithRegistrations extends Event {
  registered_count: number
  created_by_email: string | null
  created_by_name: string | null
}

export interface ContactMessage {
  id: string
  first_name: string
  last_name: string
  email: string
  subject: string
  message: string
  status: 'unread' | 'read' | 'replied' | 'archived'
  created_at: string
  updated_at: string
}

export interface EventTicket {
  id: string;
  event_id: string;
  user_id: string;
  created_at: string;
}

// Custom authentication using our accounts and users tables
export const authHelpers = {
  async signUp(email: string, password: string, profileData: { full_name: string; field_of_interest?: string; role?: 'Administrator' | 'Member' }) {
    try {
      // Hash password (in production, use bcrypt or similar)
      const passwordHash = btoa(password); // Simple base64 encoding for demo
      
      // Create account record
      const { data: accountData, error: accountError } = await supabase
        .from('accounts')
        .insert({
          email,
          password_hash: passwordHash
        })
        .select()
        .single();
      
      if (accountError) {
        return { data: null, error: accountError };
      }
      
      // Create user profile record
      const { data: userProfileData, error: userError } = await supabase
        .from('users')
        .insert({
          account_id: accountData.id,
          full_name: profileData.full_name,
          field_of_interest: profileData.field_of_interest,
          role: profileData.role || 'Member'
        })
        .select()
        .single();
      
      if (userError) {
        // Cleanup account if user creation fails
        await supabase.from('accounts').delete().eq('id', accountData.id);
        return { data: null, error: userError };
      }
      
      return { data: { account: accountData, user: userProfileData }, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  async signIn(email: string, password: string) {
    try {
      // First, check if email exists
      const { data: emailCheck, error: emailError } = await supabase
        .from('accounts')
        .select('id, email, password_hash')
        .eq('email', email)
        .single();
      
      if (emailError || !emailCheck) {
        return { data: null, error: { message: 'Email not found. Create an account.' } };
      }
      
      // Hash password for comparison
      const passwordHash = btoa(password);
      
      // Check if password matches
      if (emailCheck.password_hash !== passwordHash) {
        return { data: null, error: { message: 'Incorrect password. Please try again.' } };
      }
      
      // Get full account data with user profile
      const { data: accountData, error: accountError } = await supabase
        .from('accounts')
        .select(`
          *,
          users(*)
        `)
        .eq('email', email)
        .single();
      
      if (accountError || !accountData) {
        return { data: null, error: { message: 'Error loading account data. Please try again.' } };
      }
      // Ensure user profile exists
      if (!accountData.users || !Array.isArray(accountData.users) || accountData.users.length === 0) {
        return { data: null, error: { message: 'User profile not found. Please contact support.' } };
      }
      // Detect device type from user agent
      const userAgent = navigator.userAgent.toLowerCase();
      let deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown' = 'unknown';
      if (/mobile|android|iphone|ipod|ipad|windows phone/i.test(userAgent)) {
        deviceType = /ipad|tablet|playbook|silk|(android(?!.*mobile))/i.test(userAgent) ? 'tablet' : 'mobile';
      } else {
        deviceType = 'desktop';
      }
      // Get device name (simplified)
      const deviceName = deviceType === 'mobile' ? 'Mobile Device' : 
                        deviceType === 'tablet' ? 'Tablet' : 'Desktop';
      // Get IP address (in production, you'd get this from the request)
      let ipAddress = '127.0.0.1'; // Default to localhost for development
      // Create user_session record in database
      const sessionId = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
      const { data: sessionRecord, error: sessionError } = await supabase
        .from('user_sessions')
        .insert({
          id: sessionId,
          account_id: accountData.id,
          session_token: crypto.randomUUID(),
          device_type: deviceType,
          device_name: `${deviceName} (${navigator.platform})`,
          ip_address: ipAddress,
          user_agent: navigator.userAgent,
          status: 'active',
          last_activity: new Date().toISOString(),
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();
      if (sessionError || !sessionRecord) {
        return { data: null, error: { message: 'Failed to create session. Please try again.' } };
      }
      // Store session in localStorage (in production, use secure session management)
      const sessionData = {
        account: accountData,
        user: accountData.users[0],
        sessionId: sessionId,
        sessionToken: sessionRecord.session_token,
        timestamp: Date.now(),
        expiresAt: expiresAt.getTime()
      };
      localStorage.setItem('auth_session', JSON.stringify(sessionData));
      // Clean up expired sessions in the background
      this.cleanupExpiredSessions(accountData.id).catch(console.error);
      return { data: sessionData, error: null };
    } catch (error) {
      return { data: null, error: { message: 'Login failed. Please try again.' } };
    }
  },

  async signOut() {
    try {
      // Get current session to revoke it
      const sessionData = localStorage.getItem('auth_session');
      if (sessionData) {
        const session = JSON.parse(sessionData);
        if (session.sessionId) {
          // Revoke session in database
          await supabase
            .from('user_sessions')
            .update({ 
              status: 'revoked',
              last_activity: new Date().toISOString()
            })
            .eq('id', session.sessionId);
        }
      }
      
      localStorage.removeItem('auth_session');
      return { error: null };
    } catch (error) {
      console.error('Error during sign out:', error);
      // Still remove local session even if database update fails
      localStorage.removeItem('auth_session');
      return { error: null };
    }
  },

  // Get active sessions for the current user
  async getActiveSessions(accountId: string) {
    try {
      const { data: sessions, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('account_id', accountId)
        .eq('status', 'active')
        .order('last_activity', { ascending: false });
      
      if (error) throw error;
      return { data: sessions || [], error: null };
    } catch (error) {
      console.error('Error fetching active sessions:', error);
      return { data: [], error };
    }
  },

  // Clean up expired sessions (called after successful login)
  async cleanupExpiredSessions(accountId: string) {
    try {
      await supabase
        .from('user_sessions')
        .update({ status: 'expired' })
        .lt('expires_at', new Date().toISOString())
        .eq('account_id', accountId)
        .eq('status', 'active');
    } catch (error) {
      console.error('Error cleaning up expired sessions:', error);
    }
  },

  // Revoke a specific session by ID
  async revokeSession(sessionId: string) {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({ 
          status: 'revoked',
          last_activity: new Date().toISOString()
        })
        .eq('id', sessionId);
      
      if (error) throw error;
      return { success: true, error: null };
    } catch (error) {
      console.error('Error revoking session:', error);
      return { success: false, error };
    }
  },

  async getCurrentUser() {
    try {
      const sessionData = localStorage.getItem('auth_session');
      if (!sessionData) return null;
      
      const session = JSON.parse(sessionData);
      
      // Check if session is still valid (24 hours)
      const isExpired = Date.now() - session.timestamp > 24 * 60 * 60 * 1000;
      if (isExpired) {
        // Update session status in database before removing local session
        if (session.sessionId) {
          await supabase
            .from('user_sessions')
            .update({
              status: 'expired',
              last_activity: new Date().toISOString()
            })
            .eq('id', session.sessionId);
        }
        localStorage.removeItem('auth_session');
        return null;
      }
      
      // Update last activity timestamp in database for active sessions
      if (session.sessionId) {
        await supabase
          .from('user_sessions')
          .update({
            last_activity: new Date().toISOString()
          })
          .eq('id', session.sessionId);
      }
      
      return session;
    } catch (error) {
      return null;
    }
  },

  async getUserProfile(accountId: string) {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        account:accounts(*)
      `)
      .eq('account_id', accountId)
      .single();
    
    return { data, error };
  },

  async updateUserProfile(accountId: string, updates: Partial<UserProfile>) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('account_id', accountId)
      .select()
      .single();
    
    return { data, error };
  },

  async validateCurrentPassword(accountId: string, currentPassword: string) {
    try {
      // Hash the provided password
      const passwordHash = btoa(currentPassword);
      
      // Check if the password matches the one in database
      const { data, error } = await supabase
        .from('accounts')
        .select('password_hash')
        .eq('id', accountId)
        .single();
      
      if (error || !data) {
        return { valid: false, error: 'Account not found' };
      }
      
      const isValid = data.password_hash === passwordHash;
      return { valid: isValid, error: isValid ? null : 'Current password is incorrect' };
    } catch (error) {
      return { valid: false, error: 'Password validation failed' };
    }
  },

  async changePassword(accountId: string, newPassword: string) {
    try {
      // Hash the new password
      const passwordHash = btoa(newPassword);
      
      // Update password in database
      const { data, error } = await supabase
        .from('accounts')
        .update({ password_hash: passwordHash })
        .eq('id', accountId)
        .select()
        .single();
      
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  // OTP-based Password Reset Functions
  async requestPasswordReset(email: string) {
    try {
      // Check if email exists in accounts
      const { data: accountData, error: accountError } = await supabase
        .from('accounts')
        .select('id, email')
        .eq('email', email)
        .single();
      
      if (accountError || !accountData) {
        return { data: null, error: 'Email not found in our system' };
      }

      // Generate 6-digit OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Set expiration time (10 minutes from now)
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      const formattedExpiry = expiresAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      // Store OTP in database
      const { data: otpData, error: otpError } = await supabase
        .from('password_reset_tokens')
        .insert({
          email: email,
          otp_code: otpCode,
          expires_at: expiresAt.toISOString(),
          used: false
        })
        .select()
        .single();
      
      if (otpError) {
        return { data: null, error: 'Failed to generate OTP. Please try again.' };
      }

        // Send email via Resend SDK directly from the client (note: for production you should
        // send through a server to keep API keys secret). The HTML is dynamic and uses the
        // generated otpCode and formattedExpiry values.
        const htmlTemplate = `
<div style="font-family: 'Segoe UI', system-ui, sans-serif; background: linear-gradient(135deg, #0f172a, #1e293b); color: #ffffff; padding: 28px; border-radius: 14px; max-width: 480px; margin: auto; box-shadow: 0 0 18px rgba(0, 217, 255, 0.2);">
  <a href="[Website Link]" target="_blank" style="text-decoration: none;">
    <img src="cid:logo.png" alt="logo" height="40" style="display: block; margin: 0 auto 24px;" />
  </a>

  <h2 style="text-align: center; font-size: 20px; color: #38bdf8; margin-bottom: 24px;">🔐 Welcome to the <strong>New Era</strong> of security</h2>

  <p style="font-size: 16px; text-align: center; margin-bottom: 12px;">
    To proceed, please use the following One-Time Password (OTP):
  </p>

  <p style="font-size: 32px; font-weight: bold; text-align: center; letter-spacing: 4px; color: #00d9ff; margin: 20px 0;">
    ${otpCode}
  </p>

  <p style="text-align: center; font-size: 14px; color: #cbd5e1;">
    This code is valid for 15 minutes, until <strong>${formattedExpiry}</strong>.
  </p>

  <hr style="border: none; border-top: 1px solid #334155; margin: 24px 0;" />

  <p style="font-size: 13px; color: #94a3b8; line-height: 1.6;">
    ⚠️ Do <strong>not</strong> share this code with anyone. If you didn’t request this OTP, you can safely ignore this email.
    <br /><br />
    NEWERA will never contact you asking for login codes or credentials. Stay safe and beware of phishing attempts.
  </p>

  <p style="text-align: center; margin-top: 28px; color: #38bdf8; font-size: 14px;">
    Thank you for trusting <strong>NEW ERA</strong> ✨
  </p>
</div>
        `;

        // First prefer server-side proxy endpoint if configured. This keeps API keys secret
        // and avoids CORS/network resolution issues from the browser.
        // Only server-side proxy is supported for sending OTP emails. This prevents
        // exposing API keys to clients and avoids browser network/CORS issues.
        const resendProxyUrl = import.meta.env.VITE_EMAIL_PROXY_URL_RESEND;
        if (!resendProxyUrl) {
          console.error('Resend proxy URL is not configured: set VITE_EMAIL_PROXY_URL_RESEND');
          return { data: null, error: 'Email sending is not configured. Please contact support.' };
        }

        try {
          const proxyRes = await fetch(resendProxyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from: 'onboarding@resend.dev',
              to: email,
              subject: 'Your NEW ERA OTP',
              html: htmlTemplate
            })
          });

          const proxyJson = await proxyRes.json().catch(() => ({}));
          if (!proxyRes.ok) {
            console.error('❌ Resend proxy responded with error:', proxyRes.status, proxyJson);
            return { data: null, error: proxyJson?.error || `Proxy error: ${proxyRes.status}` };
          }

          console.log('✅ Email forwarded to resend proxy successfully:', proxyJson);
        } catch (err) {
          console.error('❌ Error sending email via resend proxy:', err);
          return { data: null, error: 'Failed to forward email to proxy' };
        }

        // In development, always log the OTP to console for testing
        console.log('📧 [DEVELOPMENT/FALLBACK] Password Reset Code for:', email);
        console.log('🔐 Your OTP Code:', otpCode);
        console.log('⏰ Expires at:', formattedExpiry);

        return {
          data: {
            message: 'Password reset code sent (via Resend SDK or logged in console for development)',
            ...(process.env.NODE_ENV === 'development' && { otpCode })
          },
          error: null
        };
    } catch (error) {
      console.error('Password reset error:', error);
      return { data: null, error: 'Failed to process password reset request' };
    }
  },

  async verifyOtpAndResetPassword(email: string, otpCode: string, newPassword: string) {
    try {
      // Find valid OTP token
      const { data: tokenData, error: tokenError } = await supabase
        .from('password_reset_tokens')
        .select('*')
        .eq('email', email)
        .eq('otp_code', otpCode)
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (tokenError || !tokenData) {
        return { success: false, error: 'Invalid or expired OTP code' };
      }

      // Get account ID for this email
      const { data: accountData, error: accountError } = await supabase
        .from('accounts')
        .select('id')
        .eq('email', email)
        .single();
      
      if (accountError || !accountData) {
        return { success: false, error: 'Account not found' };
      }

      // Hash the new password
      const passwordHash = btoa(newPassword);
      
      // Update password in accounts table
      const { error: updateError } = await supabase
        .from('accounts')
        .update({ password_hash: passwordHash })
        .eq('id', accountData.id);
      
      if (updateError) {
        return { success: false, error: 'Failed to update password' };
      }

      // Mark OTP as used
      await supabase
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('id', tokenData.id);
      
      return { success: true, message: 'Password reset successfully!' };
      } catch (error) {
      return { success: false, error: 'Failed to reset password' };
      }
      },
      
      // Get user role options
      async getUserRoleOptions(): Promise<string[]> {
        // Return hardcoded values since user_role is an enum but we'll use hardcoded for simplicity
        return ['Administrator', 'Member'];
      },

      // Get field of interest options
      async getFieldOfInterestOptions(): Promise<string[]> {
        try {
          const { data, error } = await supabase
            .from('field_of_interest_options')
            .select('name')
            .eq('is_active', true)
            .order('display_order', { ascending: true });
          
          if (error) throw error;
          return data?.map(item => item.name) || [];
        } catch (error) {
          console.error('Error fetching field options:', error);
          return [];
        }
      },

      // Modern: Get joined session info from active_sessions_view for the current user
      async getModernSessions(userEmail: string) {
        try {
          const { data, error } = await supabase
            .from('active_sessions_view')
            .select('*')
            .eq('email', userEmail)
            .order('last_activity', { ascending: false });
          if (error) throw error;
          return { data: data || [], error: null };
        } catch (error) {
          console.error('Error fetching modern sessions:', error);
          return { data: [], error };
        }
      },

      // Event Management Functions
      async getEvents() {
        try {
          const { data, error } = await supabase
            .from('events')
            .select('*')
            .order('date', { ascending: true });
          
          return { data: data || [], error };
        } catch (error) {
          return { data: [], error };
        }
      },

      async getEventById(eventId: string) {
        try {
          const { data, error } = await supabase
            .from('events_with_registrations')
            .select('*')
            .eq('id', eventId)
            .single();
          
          return { data, error };
        } catch (error) {
          return { data: null, error };
        }
      },

      async registerForEvent(eventId: string, userId: string) {
        try {
          const { data, error } = await supabase
            .from('event_registrations')
            .insert({
              event_id: eventId,
              user_id: userId,
              status: 'registered'
            })
            .select()
            .single();
          
          return { data, error };
        } catch (error) {
          return { data: null, error };
        }
      },

      async unregisterFromEvent(eventId: string, userId: string) {
        try {
          const { error } = await supabase
            .from('event_registrations')
            .delete()
            .eq('event_id', eventId)
            .eq('user_id', userId);
          
          return { error };
        } catch (error) {
          return { error };
        }
      },

      async getEventRegistrations(eventId: string) {
        try {
          const { data, error } = await supabase
            .from('event_registrations')
            .select(`
              *,
              user:users(full_name, email),
              event:events(title)
            `)
            .eq('event_id', eventId)
            .order('registration_date', { ascending: false });
          
          return { data: data || [], error };
        } catch (error) {
          return { data: [], error };
        }
      },

      async getUserEventRegistrations(userId: string) {
        try {
          const { data, error } = await supabase
            .from('event_registrations')
            .select(`
              *,
              event:events(*)
            `)
            .eq('user_id', userId)
            .order('registration_date', { ascending: false });
          
          return { data: data || [], error };
        } catch (error) {
          return { data: [], error };
        }
      },

      async updateEvent(eventId: string, updates: Partial<Event>, adminName: string) {
        try {
          const { data, error } = await supabase
            .from('events')
            .update(updates)
            .eq('id', eventId)
            .select()
            .single();
          
          if (!error) {
            // Log admin action
            await supabase
              .from('admin_actions')
              .insert({
                admin_name: adminName,
                action_type: 'update',
                table_name: 'events',
                record_id: eventId,
                details: `Updated event: ${updates.title || 'ID: ' + eventId}`
              });
          }
          
          return { data, error };
        } catch (error) {
          return { data: null, error };
        }
      },

      async deleteEvent(eventId: string, adminName: string) {
        try {
          // Get event title before deletion for logging
          const { data: eventData } = await supabase
            .from('events')
            .select('title')
            .eq('id', eventId)
            .single();
          
          const { error } = await supabase
            .from('events')
            .delete()
            .eq('id', eventId);
          
          if (!error && eventData) {
            // Log admin action
            await supabase
              .from('admin_actions')
              .insert({
                admin_name: adminName,
                action_type: 'delete',
                table_name: 'events',
                record_id: eventId,
                details: `Deleted event: ${eventData.title}`
              });
          }
          
          return { error };
        } catch (error) {
          return { error };
        }
      },

      // Admin Management Functions
      async getAllUsers() {
        try {
          const { data, error } = await supabase
            .from('users')
            .select(`
              *,
              account:accounts(email, created_at)
            `)
            .order('created_at', { ascending: false });
          
          return { data: data || [], error };
        } catch (error) {
          return { data: [], error };
        }
      },

      async updateUserRole(userId: string, newRole: 'Administrator' | 'Member', adminName: string) {
        try {
          const { data, error } = await supabase
            .from('users')
            .update({ role: newRole })
            .eq('id', userId)
            .select()
            .single();
          
          if (!error) {
            // Log admin action
            await supabase
              .from('admin_actions')
              .insert({
                admin_name: adminName,
                action_type: 'update',
                table_name: 'users',
                record_id: userId,
                details: `Changed user role to ${newRole}`
              });
          }
          
          return { data, error };
        } catch (error) {
          return { data: null, error };
        }
      },

      async deleteUser(userId: string, adminName: string) {
        try {
          // Get user account ID first
          const { data: userData } = await supabase
            .from('users')
            .select('account_id')
            .eq('id', userId)
            .single();
          
          if (!userData) {
            return { error: 'User not found' };
          }

          // Delete user and account
          const { error: userError } = await supabase
            .from('users')
            .delete()
            .eq('id', userId);
          
          if (userError) {
            return { error: userError };
          }

          const { error: accountError } = await supabase
            .from('accounts')
            .delete()
            .eq('id', userData.account_id);
          
          if (!accountError) {
            // Log admin action
            await supabase
              .from('admin_actions')
              .insert({
                admin_name: adminName,
                action_type: 'delete',
                table_name: 'users',
                record_id: userId,
                details: 'Deleted user account'
              });
          }
          
          return { error: accountError };
        } catch (error) {
          return { error };
        }
      },

      async getAllFieldOptions() {
        try {
          const { data, error } = await supabase
            .from('field_of_interest_options')
            .select('*')
            .order('display_order', { ascending: true });
          
          return { data: data || [], error };
        } catch (error) {
          return { data: [], error };
        }
      },

      async createFieldOption(name: string, displayOrder: number, adminName: string) {
        try {
          const { data, error } = await supabase
            .from('field_of_interest_options')
            .insert({
              name,
              display_order: displayOrder,
              is_active: true
            })
            .select()
            .single();
          
          if (!error) {
            // Log admin action
            await supabase
              .from('admin_actions')
              .insert({
                admin_name: adminName,
                action_type: 'create',
                table_name: 'field_of_interest_options',
                record_id: data.id,
                details: `Created field option: ${name}`
              });
          }
          
          return { data, error };
        } catch (error) {
          return { data: null, error };
        }
      },

      async updateFieldOption(id: number, updates: { name?: string; display_order?: number; is_active?: boolean }, adminName: string) {
        try {
          const { data, error } = await supabase
            .from('field_of_interest_options')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
          
          if (!error) {
            // Log admin action
            await supabase
              .from('admin_actions')
              .insert({
                admin_name: adminName,
                action_type: 'update',
                table_name: 'field_of_interest_options',
                record_id: id.toString(),
                details: `Updated field option: ${updates.name || 'ID: ' + id}`
              });
          }
          
          return { data, error };
        } catch (error) {
          return { data: null, error };
        }
      },

      async deleteFieldOption(id: number, adminName: string) {
        try {
          // Get field name before deletion for logging
          const { data: fieldData } = await supabase
            .from('field_of_interest_options')
            .select('name')
            .eq('id', id)
            .single();
          
          const { error } = await supabase
            .from('field_of_interest_options')
            .delete()
            .eq('id', id);
          
          if (!error && fieldData) {
            // Log admin action
            await supabase
              .from('admin_actions')
              .insert({
                admin_name: adminName,
                action_type: 'delete',
                table_name: 'field_of_interest_options',
                record_id: id.toString(),
                details: `Deleted field option: ${fieldData.name}`
              });
          }
          
          return { error };
        } catch (error) {
          return { error };
        }
      },

      // Contact Message Functions
      async submitContactMessage(messageData: {
        first_name: string
        last_name: string
        email: string
        subject: string
        message: string
      }) {
        try {
          const { data, error } = await supabase
            .from('contact_messages')
            .insert(messageData)
            .select()
            .single();
          
          return { data, error };
        } catch (error) {
          return { data: null, error };
        }
      },

      async getAllContactMessages() {
        try {
          const { data, error } = await supabase
            .from('contact_messages')
            .select('*')
            .order('created_at', { ascending: false });
          
          return { data: data || [], error };
        } catch (error) {
          return { data: [], error };
        }
      },

      async updateContactMessageStatus(messageId: string, status: 'unread' | 'read' | 'replied' | 'archived', adminName: string) {
        try {
          const { data, error } = await supabase
            .from('contact_messages')
            .update({ 
              status,
              updated_at: new Date().toISOString()
            })
            .eq('id', messageId)
            .select()
            .single();
          
          if (!error) {
            // Log admin action
            await supabase
              .from('admin_actions')
              .insert({
                admin_name: adminName,
                action_type: 'update',
                table_name: 'contact_messages',
                record_id: messageId,
                details: `Updated contact message status to ${status}`
              });
          }
          
          return { data, error };
        } catch (error) {
          return { data: null, error };
        }
      },

      async deleteContactMessage(messageId: string, adminName: string) {
        try {
          // Get message details before deletion for logging
          const { data: messageData } = await supabase
            .from('contact_messages')
            .select('subject, email')
            .eq('id', messageId)
            .single();
          
          const { error } = await supabase
            .from('contact_messages')
            .delete()
            .eq('id', messageId);
          
          if (!error && messageData) {
            // Log admin action
            await supabase
              .from('admin_actions')
              .insert({
                admin_name: adminName,
                action_type: 'delete',
                table_name: 'contact_messages',
                record_id: messageId,
                details: `Deleted contact message: ${messageData.subject} from ${messageData.email}`
              });
          }
          
          return { error };
        } catch (error) {
          return { error };
        }
      },

      /**
       * Get all tickets for a given event
       */
      async getTicketsForEvent(eventId: string) {
        const { data, error } = await supabase
          .from('event_tickets')
          .select('*')
          .eq('event_id', eventId);
        return { data, error };
      },

      /**
       * Check if a user already has a ticket for an event
       */
      async userHasTicket(eventId: string, userId: string) {
        const { data, error } = await supabase
          .from('event_tickets')
          .select('id')
          .eq('event_id', eventId)
          .eq('user_id', userId)
          .maybeSingle();
        return { hasTicket: !!data, error };
      },

      /**
       * Take a ticket for an event (if available)
       */
      async takeTicket(eventId: string, userId: string) {
        // Check if already has ticket
        const { hasTicket } = await authHelpers.userHasTicket(eventId, userId);
        if (hasTicket) {
          return { error: { message: 'You already have a ticket for this event.' } };
        }
        // Check event capacity
        const { data: event, error: eventError } = await supabase
          .from('events')
          .select('id, attendees, max_attendees')
          .eq('id', eventId)
          .single();
        if (eventError) return { error: eventError };
        if (event.max_attendees && event.attendees >= event.max_attendees) {
          return { error: { message: 'Event is sold out.' } };
        }
        // Insert ticket
        const { data, error } = await supabase
          .from('event_tickets')
          .insert({ event_id: eventId, user_id: userId })
          .select()
          .single();
        if (error) return { error };
        // Increment attendees count
        await supabase
          .from('events')
          .update({ attendees: event.attendees + 1 })
          .eq('id', eventId);
        return { data };
      },

      /**
       * Get the number of tickets taken for an event
       */
      async getTicketCountForEvent(eventId: string) {
        const { count, error } = await supabase
          .from('event_tickets')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', eventId);
        return { count: count || 0, error };
      },

      /**
       * Get all tickets for a user (with event info)
       */
      async getUserTickets(userId: string) {
        const { data, error } = await supabase
          .from('event_tickets')
          .select('*, event:events(id, title, date, location)')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        return { data, error };
      }
    }; // End of authHelpers
      
      // Export the supabase client instance and auth helpers
      export { supabase, authHelpers as auth };

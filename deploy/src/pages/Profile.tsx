import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/supabase';
import type { User as UserType } from '@/lib/supabase';
import { 
  User, 
  Lock, 
  Edit3, 
  Save, 
  X, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle, 
  Loader2, 
  Shield,
  UserCheck,
  Ticket as TicketIcon
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

interface ProfileFormData {
  fullName: string;
  email: string;
  fieldOfInterest: string;
}

interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, userProfile, updateProfile, loading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldOptions, setFieldOptions] = useState<string[]>([]);
  const [roleOptions, setRoleOptions] = useState<string[]>(['Member', 'Administrator']);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [myTickets, setMyTickets] = useState<any[]>([]);

  const [profileForm, setProfileForm] = useState<ProfileFormData>({
    fullName: '',
    email: '',
    fieldOfInterest: '',
  });

  const [passwordForm, setPasswordForm] = useState<PasswordChangeData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  // Load user data into form
  useEffect(() => {
    if (userProfile) {
      setProfileForm({
        fullName: userProfile.full_name || '',
        email: user?.email || '',
        fieldOfInterest: userProfile.field_of_interest || '',
      });
    }
  }, [userProfile, user]);

  // Load dynamic options from database
  useEffect(() => {
    const loadOptions = async () => {
      setIsLoadingOptions(true);
      try {
        const [fields, roles] = await Promise.all([
          auth.getFieldOfInterestOptions(),
          auth.getUserRoleOptions()
        ]);
        setFieldOptions(fields);
        setRoleOptions(roles);
      } catch (error) {
        console.error('Error loading options:', error);
        // Don't set fallback options - let the user see the error
        setFieldOptions([]);
        setRoleOptions(['Member', 'Administrator']);
      } finally {
        setIsLoadingOptions(false);
      }
    };

    loadOptions();
  }, []);

  useEffect(() => {
    const fetchMyTickets = async () => {
      if (!userProfile) return;
      const { data, error } = await auth.getUserTickets(userProfile.id);
      if (!error) setMyTickets(data || []);
    };
    fetchMyTickets();
  }, [userProfile]);

  const handleProfileInputChange = (field: keyof ProfileFormData, value: string) => {
    setProfileForm(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handlePasswordInputChange = (field: keyof PasswordChangeData, value: string) => {
    setPasswordForm(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const result = await updateProfile({
        full_name: profileForm.fullName,
        field_of_interest: profileForm.fieldOfInterest as UserType['field_of_interest'],
      });

      if (result.error) {
        setError(result.error.message || 'Failed to update profile');
      } else {
        setSuccess('Profile updated successfully!');
        setIsEditing(false);
      }
    } catch (error) {
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    // Basic validation
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match');
      setIsSubmitting(false);
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      setIsSubmitting(false);
      return;
    }

    if (!user?.id) {
      setError('User not found. Please log in again.');
      setIsSubmitting(false);
      return;
    }

    try {
      // First, validate the current password
      const passwordValidation = await auth.validateCurrentPassword(user.id, passwordForm.currentPassword);
      
      if (!passwordValidation.valid) {
        setError(passwordValidation.error || 'Current password is incorrect');
        setIsSubmitting(false);
        return;
      }

      // If current password is valid, change to new password
      const changeResult = await auth.changePassword(user.id, passwordForm.newPassword);
      
      if (changeResult.error) {
        setError('Failed to change password. Please try again.');
        setIsSubmitting(false);
        return;
      }
      
      setSuccess('Password changed successfully!');
      setIsChangingPassword(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      setError('Failed to change password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setError(null);
    setSuccess(null);
    // Reset form to original values
    if (userProfile) {
      setProfileForm({
        fullName: userProfile.full_name || '',
        email: user?.email || '',
        fieldOfInterest: userProfile.field_of_interest || '',
      });
    }
  };

  const cancelPasswordChange = () => {
    setIsChangingPassword(false);
    setError(null);
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user || !userProfile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 relative overflow-hidden">
      {/* Particle Animation Background */}
      <div className="particles-container">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 20 + 10}s`,
              animationDelay: `${Math.random() * 20}s`,
            }}
          />
        ))}
        {[...Array(20)].map((_, i) => (
          <div
            key={`orb-${i}`}
            className="cosmic-orb"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 15 + 10}s`,
              animationDelay: `${Math.random() * 10}s`,
            }}
          />
        ))}
        {[...Array(5)].map((_, i) => (
          <div
            key={`star-${i}`}
            className="shooting-star"
            style={{
              top: `${Math.random() * 50}%`,
              animationDuration: `${Math.random() * 3 + 2}s`,
              animationDelay: `${Math.random() * 10}s`,
            }}
          />
        ))}
      </div>
      
      <Header />
      
      <main className="container mx-auto px-4 py-16 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Modern Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-primary/20 to-blue-500/20 mb-6 backdrop-blur-sm">
              <User className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-5xl font-bold text-glow mb-4 bg-gradient-to-r from-primary via-blue-400 to-purple-400 bg-clip-text text-transparent">
              User Profile
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Manage your account settings and personal information in your cosmic dashboard
            </p>
          </div>

          {/* Success/Error Messages */}
          {error && (
            <Alert className="mb-6 border-red-500/50 bg-red-500/10">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-400">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-6 border-green-500/50 bg-green-500/10">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="text-green-400">{success}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Profile Information Card */}
            <Card className="card-cosmic p-8 border-border/50 backdrop-blur-sm bg-background/80">

              {/* Active Sessions Section */}
              {/* Active Sessions Section removed */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-orbitron font-bold flex items-center">
                  <UserCheck className="w-5 h-5 mr-2 text-primary" />
                  Profile Information
                </h2>
                {!isEditing && (
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                    size="sm"
                    className="border-primary/50 hover:border-primary transition-all duration-300"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="fullName"
                        type="text"
                        value={profileForm.fullName}
                        onChange={(e) => handleProfileInputChange('fullName', e.target.value)}
                        className="pl-10 bg-background/50 border-border/50 focus:border-primary transition-all duration-300"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fieldOfInterest">Field of Interest</Label>
                    <Select 
                      value={profileForm.fieldOfInterest} 
                      onValueChange={(value) => handleProfileInputChange('fieldOfInterest', value)}
                      required
                    >
                      <SelectTrigger className="bg-background/50 border-border/50 focus:border-primary transition-all duration-300">
                        <SelectValue placeholder="Select your field of interest" />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingOptions ? (
                          <SelectItem value="loading" disabled>
                            <div className="flex items-center">
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Loading options...
                            </div>
                          </SelectItem>
                        ) : (
                          fieldOptions.map((field) => (
                            <SelectItem key={field} value={field}>
                              {field}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Role is not editable - it's set during registration */}

                  <div className="flex space-x-3 pt-4">
                    <Button 
                      type="submit" 
                      className="btn-cosmic flex-1" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={cancelEdit}
                      disabled={isSubmitting}
                      className="border-border/50 hover:border-primary"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-4 bg-muted/30 rounded-lg">
                    <User className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Full Name</p>
                      <p className="font-medium">{userProfile.full_name}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-4 bg-muted/30 rounded-lg">
                    <Shield className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Role</p>
                      <p className="font-medium">{userProfile.role}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-4 bg-muted/30 rounded-lg">
                    <UserCheck className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Field of Interest</p>
                      <p className="font-medium">{userProfile.field_of_interest}</p>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* Password Change Card */}
            <Card className="card-cosmic p-8 border-border/50 backdrop-blur-sm bg-background/80">
              {/* NOTE: If the current session user is not the profile owner, show a warning */}
              {user?.id !== userProfile.account_id && (
                <Alert className="mb-6 border-yellow-500/50 bg-yellow-500/10">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-700">
                    <b>Security Notice:</b> You are not the owner of this profile. For your safety, please change your password immediately.
                  </AlertDescription>
                </Alert>
              )}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-orbitron font-bold flex items-center">
                  <Lock className="w-5 h-5 mr-2 text-primary" />
                  Security Settings
                </h2>
                {!isChangingPassword && (
                  <Button
                    onClick={() => setIsChangingPassword(true)}
                    variant="outline"
                    size="sm"
                    className="border-primary/50 hover:border-primary transition-all duration-300"
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Change Password
                  </Button>
                )}
              </div>

              {isChangingPassword ? (
                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwordForm.currentPassword}
                        onChange={(e) => handlePasswordInputChange('currentPassword', e.target.value)}
                        className="pl-10 pr-10 bg-background/50 border-border/50 focus:border-primary transition-all duration-300"
                        required
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                        disabled={isSubmitting}
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordForm.newPassword}
                        onChange={(e) => handlePasswordInputChange('newPassword', e.target.value)}
                        className="pl-10 pr-10 bg-background/50 border-border/50 focus:border-primary transition-all duration-300"
                        required
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                        disabled={isSubmitting}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmNewPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => handlePasswordInputChange('confirmPassword', e.target.value)}
                        className="pl-10 pr-10 bg-background/50 border-border/50 focus:border-primary transition-all duration-300"
                        required
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                        disabled={isSubmitting}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <Button 
                      type="submit" 
                      className="btn-cosmic flex-1" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Changing Password...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Change Password
                        </>
                      )}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={cancelPasswordChange}
                      disabled={isSubmitting}
                      className="border-border/50 hover:border-primary"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-4 bg-muted/30 rounded-lg">
                    <Lock className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Password</p>
                      <p className="font-medium">••••••••••••</p>
                    </div>
                  </div>

                  <Button 
                    onClick={() => setIsChangingPassword(true)}
                    className="btn-cosmic w-full"
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Change Password
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>

      <Footer />
      
      {/* Global styles for particle animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .particles-container {
            position: absolute;
            width: 100%;
            height: 100%;
            overflow: hidden;
          }
          
          .particle {
            position: absolute;
            width: 2px;
            height: 2px;
            background: radial-gradient(circle, rgba(147, 51, 234, 0.8) 0%, rgba(59, 130, 246, 0.4) 50%, transparent 100%);
            border-radius: 50%;
            animation: float linear infinite;
          }
          
          .cosmic-orb {
            position: absolute;
            width: 8px;
            height: 8px;
            background: radial-gradient(circle, rgba(147, 51, 234, 0.6) 0%, rgba(59, 130, 246, 0.3) 30%, transparent 70%);
            border-radius: 50%;
            animation: pulse 4s ease-in-out infinite alternate, float linear infinite;
            filter: blur(0.5px);
          }
          
          .shooting-star {
            position: absolute;
            width: 2px;
            height: 2px;
            background: linear-gradient(45deg, rgba(255, 255, 255, 1) 0%, rgba(147, 51, 234, 0.8) 50%, transparent 100%);
            border-radius: 50%;
            animation: shoot linear infinite;
          }
          
          .shooting-star::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 20px;
            height: 1px;
            background: linear-gradient(90deg, rgba(255, 255, 255, 0.8) 0%, transparent 100%);
            transform: translateX(-20px);
          }
          
          @keyframes float {
            0% {
              transform: translateY(100vh) translateX(0px) rotate(0deg);
              opacity: 0;
            }
            10% {
              opacity: 1;
            }
            90% {
              opacity: 1;
            }
            100% {
              transform: translateY(-100px) translateX(100px) rotate(360deg);
              opacity: 0;
            }
          }
          
          @keyframes pulse {
            0% {
              transform: scale(1);
              opacity: 0.6;
            }
            100% {
              transform: scale(1.5);
              opacity: 0.2;
            }
          }
          
          @keyframes shoot {
            0% {
              transform: translateX(-100px) translateY(0px);
              opacity: 0;
            }
            10% {
              opacity: 1;
            }
            90% {
              opacity: 1;
            }
            100% {
              transform: translateX(100vw) translateY(200px);
              opacity: 0;
            }
          }
        `
      }} />
    </div>
  );
}

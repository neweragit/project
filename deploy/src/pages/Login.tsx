import React, { useState, useEffect, useRef } from 'react';
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
import { 
  User, 
  Mail, 
  Lock, 
  Rocket, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle, 
  Loader2, 
  Globe, 
  Shield 
} from 'lucide-react';

interface LoginFormData {
  email: string;
  password: string;
}

interface RegisterFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  fieldOfInterest: string;
  role: 'Administrator' | 'Member';
}

// Dynamic field options will be loaded from database

export default function Login() {
  const navigate = useNavigate();
  const { signIn, signUp, loading, user, userProfile } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldOptions, setFieldOptions] = useState<string[]>([]);
  const [roleOptions, setRoleOptions] = useState<string[]>(['Member', 'Administrator']);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState<'email' | 'otp'>('email');
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [developmentOtp, setDevelopmentOtp] = useState(''); // For development only
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [loginForm, setLoginForm] = useState<LoginFormData>({
    email: '',
    password: '',
  });

  const [registerForm, setRegisterForm] = useState<RegisterFormData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    fieldOfInterest: '',
    role: 'Member',
  });

  // Load dynamic options from database
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setIsLoadingOptions(true);
        
        const [fields, roles] = await Promise.all([
          auth.getFieldOfInterestOptions(),
          auth.getUserRoleOptions()
        ]);
        
        setFieldOptions(fields);
        setRoleOptions([...new Set(roles)]);
        
      } catch (error) {
        console.error('Error loading options:', error);
        setFieldOptions([]);
        setRoleOptions(['Member']);
      } finally {
        setIsLoadingOptions(false);
      }
    };

    fetchOptions();
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (user && userProfile) {
      console.log('Login redirect - User:', user.email, 'Role:', userProfile.role);
      // Add a small delay to ensure context is fully updated
      const redirectTimer = setTimeout(() => {
      if (userProfile.role === 'Administrator') {
        navigate('/admin');
      } else if (userProfile.role === 'Member') {
        navigate('/profile');
      } else {
        navigate('/');
      }
      }, 100);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [user, userProfile, navigate]);

  const handleLoginInputChange = (field: keyof LoginFormData, value: string) => {
    setLoginForm(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleRegisterInputChange = (field: keyof RegisterFormData, value: string) => {
    setRegisterForm(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      console.log('Attempting login with:', loginForm.email);
      const { error } = await signIn(loginForm.email, loginForm.password);
      
      if (error) {
        setError(error.message || 'Failed to sign in');
        return;
      }

      // Handle successful login
      console.log('Login successful, waiting for redirect...');
      setSuccess('Successfully logged in!');
      // Redirect will be handled by useEffect above
    } catch (error) {
      setError('An unexpected error occurred');
      console.error('Login error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (registerForm.password !== registerForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (registerForm.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (!registerForm.fieldOfInterest) {
      setError('Please select your field of interest');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await signUp(
        registerForm.email,
        registerForm.password,
        {
          full_name: registerForm.fullName,
          field_of_interest: registerForm.fieldOfInterest,
          role: 'Member' // Always set to Member for new registrations
        }
      );
      
      if (error) {
        setError(error.message || 'Failed to create account');
        return;
      }

      // Handle successful registration
      setSuccess('Account created successfully! Please log in.');
      setIsLogin(true);
      setRegisterForm({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        fieldOfInterest: '',
        role: 'Member'
      });
    } catch (error) {
      setError('An unexpected error occurred');
      console.error('Registration error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await auth.requestPasswordReset(forgotPasswordEmail);
      
      if (result.data) {
        setSuccess(result.data.message || 'Password reset code sent to your email');
        setOtpSent(true);
        setForgotPasswordStep('otp');
        // For development - show OTP in console and state
        if (result.data.otpCode) {
          setDevelopmentOtp(result.data.otpCode);
          }
      } else {
        setError(result.error || 'Failed to send reset code');
      }
    } catch (err: any) {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Validate new password
    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await auth.verifyOtpAndResetPassword(
        forgotPasswordEmail,
        otpCode,
        newPassword
      );
      
      if (result.success) {
        setSuccess(result.message);
        // Reset forgot password form
        setShowForgotPassword(false);
        setForgotPasswordStep('email');
        setForgotPasswordEmail('');
        setOtpCode('');
        setNewPassword('');
        setConfirmNewPassword('');
        setOtpSent(false);
        setDevelopmentOtp('');
      } else {
        setError(result.error);
      }
    } catch (err: any) {
      setError('Failed to reset password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForgotPasswordForm = () => {
    setShowForgotPassword(false);
    setForgotPasswordStep('email');
    setForgotPasswordEmail('');
    setOtpCode('');
    setNewPassword('');
    setConfirmNewPassword('');
    setOtpSent(false);
    setDevelopmentOtp('');
    setError(null);
    setSuccess(null);
  };

  const renderLoginForm = () => (
    <form onSubmit={handleLogin} className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-cosmic rounded-full flex items-center justify-center mx-auto mb-4">
          <Rocket className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-orbitron font-bold text-glow mb-2">Welcome Back</h1>
        <p className="text-muted-foreground">Sign in to continue your cosmic journey</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={loginForm.email}
              onChange={(e) => handleLoginInputChange('email', e.target.value)}
              className="pl-10 bg-background/50 border-border/50 focus:border-primary transition-all duration-300"
              required
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={loginForm.password}
              onChange={(e) => handleLoginInputChange('password', e.target.value)}
              className="pl-10 pr-10 bg-background/50 border-border/50 focus:border-primary transition-all duration-300"
              required
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
              disabled={isSubmitting}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full btn-cosmic" 
        disabled={isSubmitting || !loginForm.email || !loginForm.password}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Signing In...
          </>
        ) : (
          <>
            <Rocket className="w-4 h-4 mr-2" />
            Sign In
          </>
        )}
      </Button>

      <div className="text-center space-y-3">
        <button
          type="button"
          onClick={() => {
            setShowForgotPassword(true);
            setError(null);
            setSuccess(null);
          }}
          className="text-sm text-muted-foreground hover:text-primary transition-colors"
          disabled={isSubmitting}
        >
          Forgot your password?
        </button>
        
        <button
          type="button"
          onClick={() => {
            setIsLogin(false);
            setError(null);
            setSuccess(null);
          }}
          className="text-sm text-muted-foreground hover:text-primary transition-colors block"
          disabled={isSubmitting}
        >
          Don't have an account? <span className="text-primary font-medium">Sign up</span>
        </button>
      </div>
    </form>
  );

  const renderForgotPasswordForm = () => {
    if (forgotPasswordStep === 'email') {
      return (
        <form onSubmit={handleForgotPasswordSubmit} className="space-y-6">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-cosmic rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-orbitron font-bold text-glow mb-2">Forgot Password</h1>
            <p className="text-muted-foreground">Enter your email to receive a reset code</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forgotEmail">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="forgotEmail"
                  type="email"
                  placeholder="Enter your email address"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  className="pl-10 bg-background/50 border-border/50 focus:border-primary transition-all duration-300"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full btn-cosmic" 
            disabled={isSubmitting || !forgotPasswordEmail}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending OTP...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Send Reset Code
              </>
            )}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={resetForgotPasswordForm}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
              disabled={isSubmitting}
            >
              Back to Sign In
            </button>
          </div>
        </form>
      );
    }

    // OTP Verification Step
    return (
      <form onSubmit={handleOtpVerificationSubmit} className="space-y-6">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-cosmic rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-orbitron font-bold text-glow mb-2">Verify Code</h1>
          <p className="text-muted-foreground">Enter the 6-digit code sent to {forgotPasswordEmail}</p>
          
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="otpCode">Verification Code</Label>
            <div className="relative">
              <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="otpCode"
                type="text"
                placeholder="Enter 6-digit code"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="pl-10 bg-background/50 border-border/50 focus:border-primary transition-all duration-300 text-center text-lg tracking-widest"
                required
                disabled={isSubmitting}
                maxLength={6}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
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
                type={showConfirmNewPassword ? 'text' : 'password'}
                placeholder="Confirm new password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="pl-10 pr-10 bg-background/50 border-border/50 focus:border-primary transition-all duration-300"
                required
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                disabled={isSubmitting}
              >
                {showConfirmNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full btn-cosmic" 
          disabled={isSubmitting || !otpCode || !newPassword || !confirmNewPassword || otpCode.length !== 6}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Resetting Password...
            </>
          ) : (
            <>
              <Shield className="w-4 h-4 mr-2" />
              Reset Password
            </>
          )}
        </Button>

        <div className="text-center space-y-2">
          <button
            type="button"
            onClick={() => {
              setForgotPasswordStep('email');
              setOtpCode('');
              setNewPassword('');
              setConfirmNewPassword('');
              setError(null);
            }}
            className="text-sm text-muted-foreground hover:text-primary transition-colors block"
            disabled={isSubmitting}
          >
            Didn't receive code? Try again
          </button>
          <button
            type="button"
            onClick={resetForgotPasswordForm}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
            disabled={isSubmitting}
          >
            Back to Sign In
          </button>
        </div>
      </form>
    );
  };

  const renderRegisterForm = () => (
    <form onSubmit={handleRegisterSubmit} className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-cosmic rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-orbitron font-bold text-glow mb-2">Join NEW ERA</h1>
        <p className="text-muted-foreground">Create your account to explore the cosmos</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="fullName"
              type="text"
              placeholder="Enter your full name"
              value={registerForm.fullName}
              onChange={(e) => handleRegisterInputChange('fullName', e.target.value)}
              className="pl-10 bg-background/50 border-border/50 focus:border-primary transition-all duration-300"
              required
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="registerEmail">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="registerEmail"
              type="email"
              placeholder="Enter your email"
              value={registerForm.email}
              onChange={(e) => handleRegisterInputChange('email', e.target.value)}
              className="pl-10 bg-background/50 border-border/50 focus:border-primary transition-all duration-300"
              required
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fieldOfInterest">Field of Interest</Label>
          <div className="relative">
            <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
            <Select value={registerForm.fieldOfInterest} onValueChange={(value) => handleRegisterInputChange('fieldOfInterest', value)}>
              <SelectTrigger className="pl-10 bg-background/50 border-border/50 focus:border-primary transition-all duration-300">
                <SelectValue placeholder="Choose your field of interest" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingOptions ? (
                  <SelectItem value="loading" disabled>
                    <div className="flex items-center">
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading options...
                    </div>
                  </SelectItem>
                ) : fieldOptions.length === 0 ? (
                  <SelectItem value="no-options" disabled>
                    <div className="flex items-center text-muted-foreground">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      No field options available. Please contact admin.
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
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="registerPassword">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="registerPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create password"
                value={registerForm.password}
                onChange={(e) => handleRegisterInputChange('password', e.target.value)}
                className="pl-10 pr-10 bg-background/50 border-border/50 focus:border-primary transition-all duration-300"
                required
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                disabled={isSubmitting}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm password"
                value={registerForm.confirmPassword}
                onChange={(e) => handleRegisterInputChange('confirmPassword', e.target.value)}
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
        </div>

        {/* Role is automatically set to 'Member' - no user selection */}
      </div>

      <Button 
        type="submit" 
        className="w-full btn-cosmic" 
        disabled={isSubmitting || !registerForm.email || !registerForm.password || !registerForm.fullName || !registerForm.fieldOfInterest}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Creating Account...
          </>
        ) : (
          <>
            <Rocket className="w-4 h-4 mr-2" />
            Create Account
          </>
        )}
      </Button>

      <div className="text-center">
        <button
          type="button"
          onClick={() => {
            setIsLogin(true);
            setError(null);
            setSuccess(null);
          }}
          className="text-sm text-muted-foreground hover:text-primary transition-colors"
          disabled={isSubmitting}
        >
          Already have an account? <span className="text-primary font-medium">Sign in</span>
        </button>
      </div>
    </form>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Animated Particles Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="particles-container">
          {/* Floating particles */}
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 20}s`,
                animationDuration: `${15 + Math.random() * 10}s`
              }}
            />
          ))}
          
          {/* Larger cosmic orbs */}
          {[...Array(8)].map((_, i) => (
            <div
              key={`orb-${i}`}
              className="cosmic-orb"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 15}s`,
                animationDuration: `${20 + Math.random() * 15}s`
              }}
            />
          ))}
          
          {/* Shooting stars */}
          {[...Array(3)].map((_, i) => (
            <div
              key={`star-${i}`}
              className="shooting-star"
              style={{
                top: `${Math.random() * 50}%`,
                animationDelay: `${Math.random() * 10}s`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
        
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div className="absolute inset-0 bg-gradient-to-tl from-purple-500/5 via-transparent to-blue-500/5" />
      </div>
      
      <Header />
      
      <main className="flex-1 flex items-center justify-center py-4 sm:py-8 md:py-12 px-2 sm:px-4 mt-20 sm:mt-24 md:mt-28">
        <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl mx-auto">
          <Card className="card-cosmic p-4 sm:p-6 md:p-8 border-border/50 backdrop-blur-sm bg-card/80 shadow-2xl relative overflow-hidden">
            {/* Card glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-tl from-purple-500/5 via-transparent to-blue-500/5" />
            
            {/* Content wrapper */}
            <div className="relative z-10">
            {error && (
              <Alert className="mb-6 border-red-500/50 bg-red-500/10">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-400">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-6 border-green-500/50 bg-green-500/10">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription className="text-green-400">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            {showForgotPassword ? renderForgotPasswordForm() : (isLogin ? renderLoginForm() : renderRegisterForm())}
            </div>
          </Card>
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

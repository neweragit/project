import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { auth, supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { DataTable } from '@/components/ui/data-table';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  BarChart3,
  Users,
  Calendar,
  Globe,
  Menu,
  UserCheck,
  Loader2,
  AlertCircle,
  X,
  Settings,
  Shield,
  LogOut,
  Plus,
  Edit3,
  Trash2,
  Eye,
  CheckCircle,
  User,
  Clock,
  Activity,
  ChevronDown,
  Home,
  Mail,
  Ticket as TicketIcon
} from 'lucide-react';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveBar } from '@nivo/bar';
import logo from '@/assets/logo.png';
import { ResponsiveLine } from '@nivo/line';

interface Stats {
  totalUsers: number;
  totalEvents: number;
  activeEvents: number;
  completedEvents: number;
  totalFields: number;
  activeFields: number;
  upcomingEvents: number;
  totalAttendees: number;
  avgAttendees: number;
}

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  field_of_interest?: string;
  account?: {
    email: string;
    created_at: string;
  };
  created_at: string;
}

interface Event {
  id: string;
  title: string;
  description: string | null;
  date: string;
  time: string | null; // Add time field
  location: string | null;
  image_url: string | null;
  attendees: number;
  max_attendees: number | null;
  created_at: string;
  updated_at: string;
}

interface Field {
  id: number;
  name: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

interface ContactMessage {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'replied' | 'archived';
  created_at: string;
  updated_at: string;
}

interface AdminAction {
  id: string;
  action: string;
  target: string;
  timestamp: string;
  user: string;
}

interface Ticket {
  id: string;
  event_id: string;
  user_id: string;
  created_at: string;
  event?: { id: string; title: string };
  user?: { id: string; full_name: string; email: string };
}

type ActiveTab = 'overview' | 'users' | 'events' | 'fields' | 'messages' | 'tickets';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalEvents: 0,
    activeEvents: 0,
    completedEvents: 0,
    totalFields: 0,
    activeFields: 0,
    upcomingEvents: 0,
    totalAttendees: 0,
    avgAttendees: 0
  });
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [recentActions, setRecentActions] = useState<AdminAction[]>([]);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  
  // Form states - moved to top to avoid hook order issues
  const [userForm, setUserForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'Member',
    field_of_interest: ''
  });

  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    date: '',
    time: '', // Add time field
    location: '',
    image_url: '',
    attendees: 0,
    max_attendees: null as number | null
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Staged event creation states
  const [eventStep, setEventStep] = useState(1);
  const [eventProgress, setEventProgress] = useState(0);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Field CRUD states
  const [isFieldDialogOpen, setIsFieldDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<Field | null>(null);
  const [fieldForm, setFieldForm] = useState({
    name: '',
    display_order: 1,
    is_active: true
  });

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [showDeleteTicketDialog, setShowDeleteTicketDialog] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<Ticket | null>(null);

  const { user, userProfile, loading } = useAuth();

  // Add toast notification system
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  // Add modern confirmation dialog states
  const [showDeleteUserDialog, setShowDeleteUserDialog] = useState(false);
  const [showDeleteEventDialog, setShowDeleteEventDialog] = useState(false);
  const [showDeleteFieldDialog, setShowDeleteFieldDialog] = useState(false);
  const [showDeleteMessageDialog, setShowDeleteMessageDialog] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);

  // Custom toast component
  const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'warning'; onClose: () => void }) => {
    useEffect(() => {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }, [onClose]);

    const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-yellow-500';
    const icon = type === 'success' ? <CheckCircle className="h-4 w-4" /> : type === 'error' ? <AlertCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />;

    return (
      <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg text-white ${bgColor} flex items-center gap-2`}>
        {icon}
        <span>{message}</span>
        <button onClick={onClose} className="ml-2 hover:opacity-80">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  };

  // Replace alert() with toast
  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ message, type });
  };

  // Modern confirmation dialogs
  const handleDeleteUserConfirm = async () => {
    if (!itemToDelete) return;
    try {
      const { error } = await supabase.from('users').delete().eq('id', itemToDelete.id);
      if (error) throw error;
      setUsers(users.filter(u => u.id !== itemToDelete.id));
      setStats(prev => ({ ...prev, totalUsers: prev.totalUsers - 1 }));
      showToast('User deleted successfully!', 'success');
    } catch (err) {
      console.error('Delete user error:', err);
      showToast(err instanceof Error ? err.message : 'Failed to delete user', 'error');
    } finally {
      setShowDeleteUserDialog(false);
      setItemToDelete(null);
    }
  };

  const handleDeleteEventConfirm = async () => {
    if (!itemToDelete) return;
    try {
      const { error } = await supabase.from('events').delete().eq('id', itemToDelete.id);
      if (error) throw error;
      setEvents(events.filter(e => e.id !== itemToDelete.id));
      setStats(prev => ({ ...prev, totalEvents: prev.totalEvents - 1 }));
      showToast('Event deleted successfully!', 'success');
    } catch (err) {
      console.error('Delete event error:', err);
      showToast(err instanceof Error ? err.message : 'Failed to delete event', 'error');
    } finally {
      setShowDeleteEventDialog(false);
      setItemToDelete(null);
    }
  };

  const handleDeleteFieldConfirm = async () => {
    if (!itemToDelete) return;
    try {
      const { error } = await supabase.from('field_of_interest_options').delete().eq('id', itemToDelete.id);
      if (error) throw error;
      setFields(fields.filter(f => f.id !== itemToDelete.id));
      showToast('Field deleted successfully!', 'success');
    } catch (err) {
      console.error('Delete field error:', err);
      showToast(err instanceof Error ? err.message : 'Failed to delete field', 'error');
    } finally {
      setShowDeleteFieldDialog(false);
      setItemToDelete(null);
    }
  };

  const handleDeleteMessageConfirm = async () => {
    if (!itemToDelete) return;
    try {
      const { error } = await supabase.from('contact_messages').delete().eq('id', itemToDelete.id);
      if (error) throw error;
      setContactMessages(contactMessages.filter(m => m.id !== itemToDelete.id));
      showToast('Message deleted successfully!', 'success');
    } catch (err) {
      console.error('Delete message error:', err);
      showToast(err instanceof Error ? err.message : 'Failed to delete message', 'error');
    } finally {
      setShowDeleteMessageDialog(false);
      setItemToDelete(null);
    }
  };

  const handleLogoutConfirm = async () => {
    await auth.signOut();
    navigate('/login');
    setShowLogoutDialog(false);
  };

  // Update delete handlers to show modern dialogs
  const handleDeleteUser = (user: UserProfile) => {
    setItemToDelete(user);
    setShowDeleteUserDialog(true);
  };

  const handleDeleteEvent = (event: Event) => {
    setItemToDelete(event);
    setShowDeleteEventDialog(true);
  };

  const handleDeleteField = (field: Field) => {
    setItemToDelete(field);
    setShowDeleteFieldDialog(true);
  };

  const handleDeleteMessage = (message: ContactMessage) => {
    setItemToDelete(message);
    setShowDeleteMessageDialog(true);
  };

  const handleMarkMessageAsRead = async (message: ContactMessage) => {
    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({ 
          status: 'read',
          updated_at: new Date().toISOString()
        })
        .eq('id', message.id);
      
      if (error) throw error;
      
      setContactMessages(contactMessages.map(m => 
        m.id === message.id ? { ...m, status: 'read' as const } : m
      ));
      showToast('Message marked as read!', 'success');
    } catch (err) {
      console.error('Mark as read error:', err);
      showToast(err instanceof Error ? err.message : 'Failed to mark as read', 'error');
    }
  };

  const handleLogout = () => {
    setShowLogoutDialog(true);
  };

  // Protect admin dashboard - only administrators can access
  useEffect(() => {
    if (user && userProfile) {
      if (userProfile.role !== 'Administrator') {
        console.log('Non-admin user detected, redirecting to profile');
        navigate('/profile', { replace: true });
      }
    }
  }, [user, userProfile, navigate]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      console.log('No user found, redirecting to login');
      navigate('/login', { replace: true });
    }
  }, [user, loading, navigate]);

  // Fetch data effect
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch from the correct tables based on your Supabase schema
        const [usersData, eventsData, fieldsData, contactMessagesData] = await Promise.all([
          supabase.from('users').select(`
            *,
            account:accounts(email, created_at)
          `).order('created_at', { ascending: false }),
          supabase.from('events').select('*').order('created_at', { ascending: false }),
          supabase.from('field_of_interest_options').select('*'),
          supabase.from('contact_messages').select('*').order('created_at', { ascending: false })
        ]);

        // Handle users data
        if (usersData.error) {
          console.error('Users fetch error:', usersData.error);
          setUsers([]);
        } else {
          setUsers(usersData.data || []);
        }

        // Handle events data
        if (eventsData.error) {
          console.error('Events fetch error:', eventsData.error);
          setEvents([]);
        } else {
          setEvents(eventsData.data || []);
        }

        // Handle fields data
        if (fieldsData.error) {
          console.error('Fields fetch error:', fieldsData.error);
          setFields([]);
        } else {
          setFields(fieldsData.data || []);
        }

        // Handle contact messages data
        if (contactMessagesData.error) {
          console.error('Contact messages fetch error:', contactMessagesData.error);
          setContactMessages([]);
        } else {
          setContactMessages(contactMessagesData.data || []);
        }
        
        // Calculate statistics
        const totalEvents = eventsData.data?.length || 0;
        const activeEvents = totalEvents; // All events are considered active since there's no status field
        const totalFields = fieldsData.data?.length || 0;
        const activeFields = fieldsData.data?.filter(f => f.is_active).length || 0;
        
        // Calculate event statistics
        const upcomingEvents = eventsData.data?.filter(e => new Date(e.date) > new Date()).length || 0;
        const pastEvents = eventsData.data?.filter(e => new Date(e.date) <= new Date()).length || 0;
        const totalAttendees = eventsData.data?.reduce((sum, e) => sum + (e.attendees || 0), 0) || 0;
        const avgAttendees = totalEvents > 0 ? Math.round(totalAttendees / totalEvents) : 0;
        
        setStats({
          totalUsers: usersData.data?.length || 0,
          totalEvents,
          activeEvents,
          completedEvents: pastEvents,
          totalFields,
          activeFields,
          upcomingEvents,
          totalAttendees,
          avgAttendees: totalEvents > 0 ? Math.round(totalAttendees / totalEvents) : 0
        });

        // Mock recent actions
        setRecentActions([
          { id: '1', action: 'Created', target: 'New Event: Quantum Computing Workshop', timestamp: '2 hours ago', user: 'Admin' },
          { id: '2', action: 'Updated', target: 'User Profile: John Doe', timestamp: '4 hours ago', user: 'Admin' },
          { id: '3', action: 'Deleted', target: 'Event: Old Workshop', timestamp: '1 day ago', user: 'Admin' },
          { id: '4', action: 'Created', target: 'New Field: Astrophysics Lab', timestamp: '2 days ago', user: 'Admin' },
        ]);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err instanceof Error ? err.message : 'An error occurred while fetching data');
        // Set empty arrays to prevent crashes
        setUsers([]);
        setEvents([]);
        setFields([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch tickets in useEffect
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        // First get all tickets with joined data
        const { data: ticketsData, error: ticketsError } = await supabase
          .from('event_tickets')
          .select(`
            *,
            event:events(id, title),
            user:users(id, full_name, account:accounts(email))
          `)
          .order('created_at', { ascending: false });
        
        if (ticketsError) {
          console.error('Error fetching tickets:', ticketsError);
          setTickets([]);
          return;
        }

        // Transform the data to match our interface
        const transformedTickets: Ticket[] = ticketsData?.map(ticket => ({
          id: ticket.id,
          event_id: ticket.event_id,
          user_id: ticket.user_id,
          created_at: ticket.created_at,
          event: ticket.event,
          user: ticket.user ? {
            id: ticket.user.id,
            full_name: ticket.user.full_name,
            email: ticket.user.account?.email || 'No email'
          } : undefined
        })) || [];

        setTickets(transformedTickets);
      } catch (err) {
        console.error('Error fetching tickets:', err);
        setTickets([]);
      }
    };
    fetchTickets();
  }, []);

  // Calculate ticket statistics for the chart
  const getTicketStats = () => {
    const ticketCounts: { [eventId: string]: { title: string; count: number } } = {};
    
    tickets.forEach(ticket => {
      if (ticket.event) {
        if (!ticketCounts[ticket.event_id]) {
          ticketCounts[ticket.event_id] = {
            title: ticket.event.title,
            count: 0
          };
        }
        ticketCounts[ticket.event_id].count++;
      }
    });
    
    return Object.values(ticketCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 events by ticket count
  };

  const handleDeleteTicketConfirm = async () => {
    if (!ticketToDelete) return;
    try {
      const { error } = await supabase.from('event_tickets').delete().eq('id', ticketToDelete.id);
      if (!error) {
        setTickets(tickets.filter(t => t.id !== ticketToDelete.id));
      }
    } catch (err) {
      // Optionally show error
    }
    setShowDeleteTicketDialog(false);
    setTicketToDelete(null);
  };

  // Show loading while checking authentication
  if (!user || !userProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show access denied for non-administrators
  if (userProfile.role !== 'Administrator') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">You don't have permission to access the admin dashboard.</p>
          <Button onClick={() => navigate('/profile')}>
            Go to Profile
          </Button>
        </div>
      </div>
    );
  }

  const handleAddUser = () => {
    setEditingUser(null);
    setUserForm({ full_name: '', email: '', password: '', role: 'Member', field_of_interest: '' });
    setIsUserDialogOpen(true);
  };

  const handleEditUser = (user: UserProfile) => {
    setEditingUser(user);
    setUserForm({
      full_name: user.full_name,
      email: user.email,
      password: '', // Password is not editable for users
      role: user.role,
      field_of_interest: user.field_of_interest || '' // No field_of_interest for users
    });
    setIsUserDialogOpen(true);
  };

  const handleSaveUser = async () => {
    try {
      if (editingUser) {
        // For editing, we only update the user's profile fields
        const { error } = await supabase
          .from('users')
          .update({
            full_name: userForm.full_name,
            role: userForm.role,
            field_of_interest: userForm.field_of_interest,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingUser.id);
        if (error) throw error;
        setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...userForm } : u));
        showToast('User updated successfully!', 'success');
      } else {
        // For creating new users, we need to create both account and user profile
        // First create the account
        const { data: accountData, error: accountError } = await supabase
          .from('accounts')
          .insert({
            email: userForm.email,
            password_hash: btoa(userForm.password), // Simple hash for demo
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (accountError) throw accountError;

        // Then create the user profile
        const { error: userError } = await supabase
          .from('users')
          .insert({
            account_id: accountData.id,
            full_name: userForm.full_name,
            role: userForm.role,
            field_of_interest: userForm.field_of_interest,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (userError) throw userError;

        // Refresh users list
        const { data } = await supabase
          .from('users')
          .select(`
            *,
            account:accounts(email, created_at)
          `)
          .order('created_at', { ascending: false });
        
        setUsers(data || []);
        setStats(prev => ({ ...prev, totalUsers: prev.totalUsers + 1 }));
        showToast('User created successfully!', 'success');
      }
      setIsUserDialogOpen(false);
    } catch (err) {
      console.error('Save user error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save user');
    }
  };

  const handleAddEvent = () => {
    setEditingEvent(null);
    setEventForm({ title: '', description: '', date: '', time: '', location: '', image_url: '', attendees: 0, max_attendees: null });
    setImageFile(null);
    setImagePreview('');
    setEventStep(1);
    setEventProgress(0);
    setIsEventDialogOpen(true);
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setEventForm({
      title: event.title,
      description: event.description || '',
      date: event.date,
      time: event.time || '',
      location: event.location || '',
      image_url: event.image_url || '',
      attendees: event.attendees,
      max_attendees: event.max_attendees
    });
    setImagePreview(event.image_url || '');
    setEventStep(1);
    setEventProgress(0);
    setIsEventDialogOpen(true);
  };

  // Alternative image upload using base64 (fallback)
  const uploadImageAsBase64 = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => {
        reject(new Error('Failed to read image file'));
      };
      reader.readAsDataURL(file);
    });
  };

  // Image upload function using ImgBB API
  const uploadImage = async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      console.log('Uploading image:', file.name, 'Size:', file.size, 'Type:', file.type);
      
      const response = await fetch(`https://api.imgbb.com/1/upload?key=0e4967098565f77990919e3c917d9808`, {
        method: 'POST',
        body: formData
      });
      
      console.log('ImgBB Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('ImgBB API Error:', errorText);
        throw new Error(`ImgBB API Error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('ImgBB Response data:', data);
      
      if (data.success) {
        return data.data.url;
      } else {
        console.error('ImgBB API returned success: false', data);
        throw new Error(data.error?.message || 'ImgBB API returned an error');
      }
    } catch (error) {
      console.error('Image upload error details:', error);
      throw error;
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const showSuccessAlert = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  // Field CRUD handlers
  const handleAddField = () => {
    setEditingField(null);
    setFieldForm({ name: '', display_order: 1, is_active: true });
    setIsFieldDialogOpen(true);
  };

  const handleEditField = (field: Field) => {
    setEditingField(field);
    setFieldForm({
      name: field.name,
      display_order: field.display_order,
      is_active: field.is_active
    });
    setIsFieldDialogOpen(true);
  };

  const handleSaveField = async () => {
    try {
      if (!fieldForm.name.trim()) {
        setError('Field name is required');
        return;
      }

      if (editingField) {
        const { error } = await supabase
          .from('field_of_interest_options')
          .update(fieldForm)
          .eq('id', editingField.id);
        if (error) throw error;
        setFields(fields.map(f => f.id === editingField.id ? { ...f, ...fieldForm } : f));
        showToast('Field updated successfully!', 'success');
      } else {
        const { error } = await supabase.from('field_of_interest_options').insert([fieldForm]);
        if (error) throw error;
        // Refresh fields list
        const { data } = await supabase.from('field_of_interest_options').select('*');
        setFields(data || []);
        showToast('Field created successfully!', 'success');
      }
      setIsFieldDialogOpen(false);
    } catch (err) {
      console.error('Save field error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save field');
    }
  };

  // Test ImgBB API key function
  const testImgBBAPI = async () => {
    try {
      console.log('Testing ImgBB API key...');
      const response = await fetch(`https://api.imgbb.com/1/upload?key=0e4967098565f77990919e3c917d9808`, {
        method: 'POST',
        body: new FormData() // Empty form data to test key
      });
      
      console.log('ImgBB API test response status:', response.status);
      const data = await response.text();
      console.log('ImgBB API test response:', data);
      
      if (response.status === 400) {
        console.error('ImgBB API key might be invalid or expired');
        return false;
      }
      return true;
    } catch (error) {
      console.error('ImgBB API test failed:', error);
      return false;
    }
  };

  const handleSaveEvent = async () => {
    try {
      setIsCreatingEvent(true);
      setEventProgress(0);
      
      let imageUrl = eventForm.image_url;
      
      // Stage 1: Validate form (10%)
      setEventProgress(10);
      if (!eventForm.title || !eventForm.date) {
        throw new Error('Title and date are required');
      }
      
      // Stage 2: Upload image if needed (30%)
      if (imageFile) {
        setEventProgress(20);
        setIsUploadingImage(true);
        try {
          // Try ImgBB API first
          imageUrl = await uploadImage(imageFile);
          setEventProgress(30);
        } catch (error) {
          console.error('ImgBB upload failed, trying base64 fallback:', error);
          try {
            // Fallback to base64 encoding
            imageUrl = await uploadImageAsBase64(imageFile);
            setEventProgress(30);
            console.log('Image saved as base64 (fallback method)');
          } catch (base64Error) {
            console.error('Base64 fallback also failed:', base64Error);
            // Ask user if they want to continue without image using toast
            showToast('Failed to upload image. Continuing without image.', 'warning');
            imageUrl = ''; // Continue without image
            setEventProgress(30);
          }
        } finally {
          setIsUploadingImage(false);
        }
      } else {
        setEventProgress(30);
      }

      const eventData = {
        ...eventForm,
        image_url: imageUrl
      };

      // Stage 3: Save to database (60%)
      setEventProgress(50);
      if (editingEvent) {
        const { error } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', editingEvent.id);
        if (error) throw error;
        setEvents(events.map(e => e.id === editingEvent.id ? { ...e, ...eventData } : e));
        setEventProgress(100);
        showToast('Event updated successfully!', 'success');
      } else {
        const { error } = await supabase.from('events').insert([eventData]);
        if (error) throw error;
        // Refresh events list
        const { data } = await supabase.from('events').select('*').order('created_at', { ascending: false });
        setEvents(data || []);
        setStats(prev => ({ ...prev, totalEvents: prev.totalEvents + 1 }));
        setEventProgress(100);
        showToast('Event created successfully!', 'success');
      }
      
      // Stage 4: Complete (100%)
      setTimeout(() => {
        setIsEventDialogOpen(false);
        setImageFile(null);
        setImagePreview('');
        setEventStep(1);
        setEventProgress(0);
        setIsCreatingEvent(false);
      }, 1000);
      
    } catch (err) {
      console.error('Save event error:', err);
      showToast(err instanceof Error ? err.message : 'Failed to save event', 'error');
      setIsCreatingEvent(false);
      setEventProgress(0);
    }
  };

  const userColumns = [
    { accessorKey: 'full_name', header: 'Name' },
    { 
      accessorKey: 'account.email', 
      header: 'Email',
      cell: ({ row }: any) => row.original.account?.email || row.original.email || 'N/A'
    },
    { 
      accessorKey: 'role', 
      header: 'Role',
      cell: ({ row }: any) => (
        <Badge variant={row.original.role === 'Administrator' ? 'default' : 'secondary'}>
          {row.original.role}
        </Badge>
      )
    },
    { 
      accessorKey: 'field_of_interest', 
      header: 'Field',
      cell: ({ row }: any) => row.original.field_of_interest || 'Not specified'
    },
    { 
      accessorKey: 'created_at', 
      header: 'Joined',
      cell: ({ row }: any) => new Date(row.original.created_at).toLocaleDateString()
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => handleEditUser(row.original)}>
            <Edit3 className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="destructive" onClick={() => handleDeleteUser(row.original)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  const eventColumns = [
    { accessorKey: 'title', header: 'Title' },
    { accessorKey: 'location', header: 'Location' },
    { accessorKey: 'date', header: 'Date', cell: ({ row }: any) => new Date(row.original.date).toLocaleDateString() },
    { 
      accessorKey: 'attendees', 
      header: 'Attendees',
      cell: ({ row }: any) => (
        <div className="text-sm">
          {row.original.attendees}
          {row.original.max_attendees && ` / ${row.original.max_attendees}`}
        </div>
      )
    },
    {
      accessorKey: 'image_url',
      header: 'Image',
      cell: ({ row }: any) => (
        row.original.image_url ? (
          <img 
            src={row.original.image_url} 
            alt="Event" 
            className="w-12 h-12 object-cover rounded"
          />
        ) : (
          <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </div>
        )
      )
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => handleEditEvent(row.original)}>
            <Edit3 className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="destructive" onClick={() => handleDeleteEvent(row.original)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  // Calculate user role distribution for donut chart
  const adminCount = users.filter(u => u.role === 'Administrator').length;
  const memberCount = users.filter(u => u.role !== 'Administrator').length;

  // In the overview section, update the donut chart to show user role distribution
  // and update the stat cards with better colors

  return (
    <div className="min-h-screen bg-background">
      
      <div className="flex">
        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/80 z-20 lg:hidden backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Sidebar */}
        <aside className={cn(
          "fixed left-0 top-0 z-30 h-screen border-r bg-card/95 backdrop-blur-md transition-all duration-300 lg:translate-x-0",
          "w-full lg:w-64", // Full width on mobile, normal width on desktop
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          {/* NEW ERA Header */}
          <div className="p-4 lg:p-6 border-b bg-gradient-to-r from-primary/10 to-purple-500/10">
            <div className="flex items-center justify-between lg:justify-center">
              <span className="text-xl lg:text-2xl font-orbitron font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                NEW ERA
              </span>
              {/* Close button for mobile */}
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 rounded-lg hover:bg-primary/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <div className="p-4 lg:p-4 space-y-4 lg:space-y-6">
            <nav className="space-y-2 lg:space-y-3">
              {[
                { id: 'overview', icon: BarChart3, label: 'Overview' },
                { id: 'users', icon: Users, label: 'Users' },
                { id: 'events', icon: Calendar, label: 'Events' },
                { id: 'fields', icon: Globe, label: 'Fields' },
                { id: 'messages', icon: Mail, label: 'Messages' },
                { id: 'tickets', icon: TicketIcon, label: 'Tickets' },
              ].map((item) => (
                <Button
                  key={item.id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start h-12 lg:h-12 text-base lg:text-base font-medium transition-all duration-200 hover:bg-primary/10 hover:text-primary rounded-lg",
                    activeTab === item.id && "bg-primary/15 text-primary shadow-sm border border-primary/20"
                  )}
                  onClick={() => {
                    setActiveTab(item.id as ActiveTab);
                    setSidebarOpen(false); // Close sidebar on mobile after selection
                  }}
                >
                  <item.icon className="mr-3 lg:mr-3 h-5 lg:h-5 w-5 lg:w-5" />
                  {item.label}
                </Button>
              ))}
              
              <div className="pt-4 lg:pt-4 border-t border-border/50">
              <Button
                variant="ghost"
                  className="w-full justify-start h-12 lg:h-12 text-base lg:text-base font-medium text-destructive hover:bg-destructive/10 hover:text-destructive rounded-lg transition-all duration-200"
                onClick={handleLogout}
              >
                  <LogOut className="mr-3 lg:mr-3 h-5 lg:h-5 w-5 lg:w-5" />
                Logout
              </Button>
              </div>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <div className={cn("flex-1 transition-all duration-300", "lg:ml-64")}>
          <div className="p-3 lg:p-6">
            {/* Success Alert */}
            {successMessage && (
              <Alert className="mb-6 border-green-500/50 bg-green-500/10">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription className="text-green-400">
                  {successMessage}
                </AlertDescription>
              </Alert>
            )}

            {/* Error Alert */}
            {error && (
              <Alert className="mb-6 border-red-500/50 bg-red-500/10">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-400">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Toast */}
            {toast && (
              <Toast
                message={toast.message}
                type={toast.type}
                onClose={() => setToast(null)}
              />
            )}

            {/* Mobile Header */}
            <div className="lg:hidden flex items-center justify-between mb-6 p-4 bg-card/90 backdrop-blur-md rounded-lg border border-border/50 shadow-sm">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
                className="h-10 w-10 rounded-lg hover:bg-primary/10"
            >
              <Menu className="h-5 w-5" />
            </Button>
              
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 h-10 px-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-sm">{userProfile?.full_name?.charAt(0) || 'A'}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm hidden sm:inline">{userProfile?.full_name || 'Admin'}</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/')}>
                      <Home className="mr-2 h-4 w-4" />
                      Home
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Desktop Header */}
            <div className="hidden lg:flex items-center justify-between mb-6 p-4 bg-card/50 rounded-lg border">
            <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                <Badge variant="outline" className="text-sm">
                  {userProfile?.role || 'Admin'}
                </Badge>
              </div>
              <div className="flex items-center gap-4">
                <ThemeToggle />
                <Button variant="outline" onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Button>
                <Button variant="outline" onClick={() => navigate('/')}>
                  <Home className="mr-2 h-4 w-4" />
                  Home
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{userProfile?.full_name?.charAt(0) || 'A'}</AvatarFallback>
                      </Avatar>
              <span className="font-medium">{userProfile?.full_name || 'Admin'}</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
            </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-6">
                {activeTab === 'overview' && (
                  <>
                    <div className="grid gap-3 lg:gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <Card className="p-3 lg:p-4 bg-card">
                        <div className="flex items-center gap-3 lg:gap-4">
                          <Users className="h-6 lg:h-8 w-6 lg:w-8 text-primary" />
                          <div>
                            <p className="text-xs lg:text-sm text-muted-foreground">Total Users</p>
                            <h3 className="text-lg lg:text-2xl font-bold text-foreground">{stats.totalUsers}</h3>
                          </div>
                        </div>
                      </Card>
                      <Card className="p-3 lg:p-4 bg-card">
                        <div className="flex items-center gap-3 lg:gap-4">
                          <Calendar className="h-6 lg:h-8 w-6 lg:w-8 text-primary" />
                          <div>
                            <p className="text-xs lg:text-sm text-muted-foreground">Total Events</p>
                            <h3 className="text-lg lg:text-2xl font-bold text-foreground">{stats.totalEvents}</h3>
                            <p className="text-xs text-muted-foreground">
                              {stats.upcomingEvents} upcoming, {stats.completedEvents} past
                            </p>
                          </div>
                        </div>
                      </Card>
                      <Card className="p-3 lg:p-4 bg-card">
                        <div className="flex items-center gap-3 lg:gap-4">
                          <TicketIcon className="h-6 lg:h-8 w-6 lg:w-8 text-primary" />
                          <div>
                            <p className="text-xs lg:text-sm text-muted-foreground">Total Tickets</p>
                            <h3 className="text-lg lg:text-2xl font-bold text-foreground">{tickets.length}</h3>
                            <p className="text-xs text-muted-foreground">
                              Across all events
                            </p>
                          </div>
                        </div>
                      </Card>
                      <Card className="p-3 lg:p-4 bg-card">
                        <div className="flex items-center gap-3 lg:gap-4">
                          <BarChart3 className="h-6 lg:h-8 w-6 lg:w-8 text-primary" />
                          <div>
                            <p className="text-xs lg:text-sm text-muted-foreground">Total Attendees</p>
                            <h3 className="text-lg lg:text-2xl font-bold text-foreground">{stats.totalAttendees}</h3>
                            <p className="text-xs text-muted-foreground">
                              Avg: {stats.avgAttendees} per event
                            </p>
                          </div>
                        </div>
                      </Card>
                    </div>
                    <div className="grid gap-4 lg:gap-6 lg:grid-cols-2 mt-4 lg:mt-6">
                      <Card className="p-3 lg:p-4">
                        <h3 className="text-base lg:text-lg font-semibold mb-3 lg:mb-4">User Role Distribution</h3>
                        <div className="h-[250px] lg:h-[300px]">
                          <ResponsivePie
                            data={[
                              {
                                id: 'Admins',
                                label: 'Admins',
                                value: adminCount,
                                color: 'hsl(221, 83%, 53%)',
                              },
                              {
                                id: 'Members',
                                label: 'Members',
                                value: memberCount,
                                color: 'hsl(142, 71%, 45%)',
                              },
                            ]}
                            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                            innerRadius={0.5}
                            padAngle={0.7}
                            cornerRadius={3}
                            colors={({ id }) => id === 'Admins' ? 'hsl(221, 83%, 53%)' : 'hsl(142, 71%, 45%)'}
                            enableArcLinkLabels={true}
                            arcLinkLabelsSkipAngle={10}
                            arcLinkLabelsTextColor={{ from: 'color', modifiers: [] }}
                          />
                        </div>
                      </Card>
                      <Card className="p-3 lg:p-4">
                        <h3 className="text-base lg:text-lg font-semibold mb-3 lg:mb-4">Ticket Statistics</h3>
                        <div className="h-[250px] lg:h-[300px]">
                          <ResponsiveBar
                            data={getTicketStats()}
                            keys={['count']}
                            indexBy="title"
                            layout="horizontal"
                            padding={0.3}
                            margin={{ top: 20, right: 20, bottom: 40, left: 60 }}
                            colors={{ scheme: 'category10' }}
                            axisBottom={{
                              tickSize: 5,
                              tickPadding: 5,
                              tickRotation: 0
                            }}
                            axisLeft={{
                              tickSize: 5,
                              tickPadding: 5,
                              tickRotation: 0
                            }}
                          />
                        </div>
                      </Card>
                    </div>
                    
                    {/* Monthly Events Line Chart */}
                    <div className="mt-4 lg:mt-6">
                      <Card className="p-3 lg:p-4">
                        <h3 className="text-base lg:text-lg font-semibold mb-3 lg:mb-4">Monthly Events Trend</h3>
                        <div className="h-[300px] lg:h-[400px]">
                          <ResponsiveLine
                            data={[
                              {
                                id: 'Events',
                                color: 'hsl(221, 83%, 53%)',
                                data: getEventsPerMonth(events).map(item => ({
                                  x: item.month,
                                  y: item.events
                                }))
                              }
                            ]}
                            margin={{ top: 20, right: 20, bottom: 40, left: 60 }}
                            xScale={{ type: 'point' }}
                            yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: true, reverse: false }}
                            axisTop={null}
                            axisRight={null}
                            axisBottom={{
                              tickSize: 5,
                              tickPadding: 5,
                              tickRotation: -45,
                              legend: 'Month',
                              legendOffset: 40,
                              legendPosition: 'middle'
                            }}
                            axisLeft={{
                              tickSize: 5,
                              tickPadding: 5,
                              tickRotation: 0,
                              legend: 'Number of Events',
                              legendOffset: -50,
                              legendPosition: 'middle'
                            }}
                            pointSize={10}
                            pointColor={{ theme: 'background' }}
                            pointBorderWidth={2}
                            pointBorderColor={{ from: 'serieColor' }}
                            pointLabelYOffset={-12}
                            useMesh={true}
                            legends={[
                              {
                                anchor: 'top',
                                direction: 'row',
                                justify: false,
                                translateX: 0,
                                translateY: -20,
                                itemsSpacing: 0,
                                itemDirection: 'left-to-right',
                                itemWidth: 80,
                                itemHeight: 20,
                                itemOpacity: 0.75,
                                symbolSize: 12,
                                symbolShape: 'circle',
                                effects: [
                                  {
                                    on: 'hover',
                                    style: {
                                      itemBackground: 'rgba(0, 0, 0, .03)',
                                      itemOpacity: 1
                                    }
                                  }
                                ]
                              }
                            ]}
                          />
                        </div>
                      </Card>
                    </div>
                  </>
                )}
                
                {activeTab === 'users' && (
                  <Card className="p-4">
                    <DataTable
                      columns={userColumns}
                      data={users}
                      searchKey="full_name"
                      onAdd={handleAddUser}
                    />
                  </Card>
                )}

                {activeTab === 'events' && (
                  <Card className="p-4">
                    <DataTable
                      columns={eventColumns}
                      data={events}
                      searchKey="title"
                      onAdd={handleAddEvent}
                    />
                  </Card>
                )}

                {activeTab === 'fields' && (
                  <Card className="p-4">
                    <DataTable
                      columns={[
                        { accessorKey: 'name', header: 'Name' },
                        { accessorKey: 'display_order', header: 'Display Order' },
                        { 
                          accessorKey: 'is_active', 
                          header: 'Active',
                          cell: ({ row }: any) => (
                            <Badge variant={row.original.is_active ? 'default' : 'secondary'}>
                              {row.original.is_active ? 'Yes' : 'No'}
                            </Badge>
                          )
                        },
                        { 
                          accessorKey: 'created_at', 
                          header: 'Created At',
                          cell: ({ row }: any) => new Date(row.original.created_at).toLocaleDateString()
                        },
                        {
                          id: 'actions',
                          header: 'Actions',
                          cell: ({ row }: any) => (
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleEditField(row.original)}>
                                <Edit3 className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleDeleteField(row.original)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )
                        }
                      ]}
                      data={fields}
                      searchKey="name"
                      onAdd={handleAddField}
                    />
                  </Card>
                )}

                {activeTab === 'messages' && (
                  <Card className="p-4">
                    <DataTable
                      columns={[
                        { 
                          accessorKey: 'first_name', 
                          header: 'Name',
                          cell: ({ row }: any) => `${row.original.first_name} ${row.original.last_name}`
                        },
                        { accessorKey: 'email', header: 'Email' },
                        { accessorKey: 'subject', header: 'Subject' },
                        { 
                          accessorKey: 'status', 
                          header: 'Status',
                          cell: ({ row }: any) => (
                            <Badge variant={
                              row.original.status === 'unread' ? 'destructive' :
                              row.original.status === 'read' ? 'default' :
                              row.original.status === 'replied' ? 'secondary' : 'outline'
                            }>
                              {row.original.status}
                            </Badge>
                          )
                        },
                        { 
                          accessorKey: 'created_at', 
                          header: 'Received',
                          cell: ({ row }: any) => new Date(row.original.created_at).toLocaleDateString()
                        },
                        {
                          id: 'actions',
                          header: 'Actions',
                          cell: ({ row }: any) => (
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => window.open(`mailto:${row.original.email}?subject=Re: ${row.original.subject}`)}>
                                <Mail className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleMarkMessageAsRead(row.original)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleDeleteMessage(row.original)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
              </div>
                          )
                        }
                      ]}
                      data={contactMessages}
                      searchKey="subject"
                    />
                  </Card>
                )}

                {activeTab === 'tickets' && (
                  <Card className="p-4">
                    <DataTable
                      columns={[
                        { 
                          id: 'event_title', 
                          header: 'Event', 
                          accessorFn: (row: any) => row.event?.title || '—',
                          cell: ({ row }: any) => row.original.event?.title || '—' 
                        },
                        { 
                          id: 'user_name', 
                          header: 'User', 
                          accessorFn: (row: any) => row.user?.full_name || '—',
                          cell: ({ row }: any) => row.original.user?.full_name || '—' 
                        },
                        { 
                          id: 'user_email', 
                          header: 'Email', 
                          accessorFn: (row: any) => row.user?.email || '—',
                          cell: ({ row }: any) => row.original.user?.email || '—' 
                        },
                        { 
                          accessorKey: 'created_at', 
                          header: 'Date', 
                          cell: ({ row }: any) => new Date(row.original.created_at).toLocaleString() 
                        },
                        { 
                          id: 'actions', 
                          header: 'Actions', 
                          cell: ({ row }: any) => (
                            <Button size="sm" variant="destructive" onClick={() => {
                              setTicketToDelete(row.original);
                              setShowDeleteTicketDialog(true);
                            }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          ) 
                        },
                      ]}
                      data={tickets}
                      searchKey="event_title"
                    />
                    <Dialog open={showDeleteTicketDialog} onOpenChange={setShowDeleteTicketDialog}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Confirm Delete Ticket</DialogTitle>
                          <DialogDescription>Are you sure you want to delete this ticket?</DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setShowDeleteTicketDialog(false)}>Cancel</Button>
                          <Button variant="destructive" onClick={handleDeleteTicketConfirm}>Delete</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </Card>
                )}
        </div>
            )}
      </div>
      </div>
      </div>

      {/* User Dialog */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
            <DialogDescription>
              {editingUser ? 'Update user information' : 'Create a new user account'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={userForm.full_name}
                onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
              />
            </div>
            {!editingUser && (
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  required
                />
              </div>
            )}
            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={userForm.role} onValueChange={(value) => setUserForm({ ...userForm, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Member">Member</SelectItem>
                  <SelectItem value="Administrator">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="field_of_interest">Field of Interest</Label>
              <Select value={userForm.field_of_interest} onValueChange={(value) => setUserForm({ ...userForm, field_of_interest: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a field" />
                </SelectTrigger>
                <SelectContent>
                  {fields.map(field => (
                    <SelectItem key={field.id} value={field.name}>{field.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUserDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveUser}>
              {editingUser ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Event Dialog */}
      <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingEvent ? 'Edit Event' : 'Add New Event'}</DialogTitle>
            <DialogDescription>
              {editingEvent ? 'Update event information' : 'Create a new event with detailed information'}
            </DialogDescription>
          </DialogHeader>

          {/* Progress Bar */}
          {isCreatingEvent && (
            <div className="mb-6">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Creating event...</span>
                <span>{eventProgress}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${eventProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={eventForm.title}
                onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                disabled={isCreatingEvent}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                disabled={isCreatingEvent}
                placeholder="Enter event description..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={eventForm.location}
                  onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                  disabled={isCreatingEvent}
                  placeholder="Event location..."
                />
              </div>
              <div>
                <Label htmlFor="date">Date *</Label>
                <div className="flex gap-2">
                  <Input
                    id="date"
                    type="date"
                    value={eventForm.date}
                    onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                    disabled={isCreatingEvent}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const today = new Date().toISOString().split('T')[0];
                      setEventForm({ ...eventForm, date: today });
                    }}
                    disabled={isCreatingEvent}
                    className="px-3"
                  >
                    Today
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      setEventForm({ ...eventForm, date: tomorrow.toISOString().split('T')[0] });
                    }}
                    disabled={isCreatingEvent}
                    className="px-3"
                  >
                    Tomorrow
                  </Button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="time">Time *</Label>
                <div className="flex gap-2">
                  <Input
                    id="time"
                    type="time"
                    value={eventForm.time}
                    onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
                    disabled={isCreatingEvent}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEventForm({ ...eventForm, time: '12:00' })}
                    disabled={isCreatingEvent}
                    className="px-3"
                  >
                    Noon
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEventForm({ ...eventForm, time: '18:00' })}
                    disabled={isCreatingEvent}
                    className="px-3"
                  >
                    Evening
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="attendees">Current Attendees</Label>
                <Input
                  id="attendees"
                  type="number"
                  min="0"
                  value={eventForm.attendees}
                  onChange={(e) => setEventForm({ ...eventForm, attendees: parseInt(e.target.value) || 0 })}
                  disabled={isCreatingEvent}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="max_attendees">Max Attendees</Label>
                <Input
                  id="max_attendees"
                  type="number"
                  min="1"
                  placeholder="No limit"
                  value={eventForm.max_attendees || ''}
                  onChange={(e) => setEventForm({ ...eventForm, max_attendees: e.target.value ? parseInt(e.target.value) : null })}
                  disabled={isCreatingEvent}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="image">Event Image</Label>
              <div className="space-y-2">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={isCreatingEvent || isUploadingImage}
                />
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={testImgBBAPI}
                    disabled={isCreatingEvent}
                  >
                    Test ImgBB API
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    If image upload fails, you can continue without an image
                  </span>
                </div>
              </div>
              {imagePreview && (
                <div className="mt-2">
                  <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover rounded" />
                </div>
              )}
              {isUploadingImage && (
                <div className="mt-2 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Uploading image...</span>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEventDialogOpen(false)} disabled={isCreatingEvent}>
              Cancel
            </Button>
            <Button onClick={handleSaveEvent} disabled={isCreatingEvent}>
              {isCreatingEvent ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {editingEvent ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                editingEvent ? 'Update Event' : 'Create Event'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Field Dialog */}
      <Dialog open={isFieldDialogOpen} onOpenChange={setIsFieldDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingField ? 'Edit Field' : 'Add New Field'}</DialogTitle>
            <DialogDescription>
              {editingField ? 'Update field information' : 'Create a new field of interest'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="field_name">Field Name *</Label>
              <Input
                id="field_name"
                value={fieldForm.name}
                onChange={(e) => setFieldForm({ ...fieldForm, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="display_order">Display Order</Label>
              <Input
                id="display_order"
                type="number"
                min="1"
                value={fieldForm.display_order}
                onChange={(e) => setFieldForm({ ...fieldForm, display_order: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div>
              <Label htmlFor="is_active">Active</Label>
              <Select value={fieldForm.is_active ? 'true' : 'false'} onValueChange={(value) => setFieldForm({ ...fieldForm, is_active: value === 'true' })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFieldDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveField}>
              {editingField ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialogs */}
      <Dialog open={showDeleteUserDialog} onOpenChange={setShowDeleteUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {itemToDelete?.full_name || itemToDelete?.title || itemToDelete?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteUserDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteUserConfirm}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteEventDialog} onOpenChange={setShowDeleteEventDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {itemToDelete?.title}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteEventDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteEventConfirm}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteFieldDialog} onOpenChange={setShowDeleteFieldDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{itemToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteFieldDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteFieldConfirm}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteMessageDialog} onOpenChange={setShowDeleteMessageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this message? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteMessageDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteMessageConfirm}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
            <DialogDescription>
              Are you sure you want to log out?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogoutDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleLogoutConfirm}>Logout</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default AdminDashboard;

// Helper function to get events per month
type MonthData = { month: string; events: number };
function getEventsPerMonth(events: Event[]): MonthData[] {
  const monthMap: { [key: string]: number } = {};
  events.forEach(e => {
    const date = new Date(e.date);
    const month = date.toLocaleString('default', { month: 'short', year: '2-digit' });
    monthMap[month] = (monthMap[month] || 0) + 1;
  });
  return Object.entries(monthMap).map(([month, events]) => ({ month, events }));
}

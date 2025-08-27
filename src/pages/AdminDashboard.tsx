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
  Ticket as TicketIcon,
  BookOpen
} from 'lucide-react';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveBar } from '@nivo/bar';
import logo from '@/assets/logo.png';
import { ResponsiveLine } from '@nivo/line';

import { Link as LinkIcon } from 'lucide-react';
import { Progress } from "@/components/ui/progress";

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

interface NavigationItem {
  name: string;
  icon: React.ElementType;
  tab: ActiveTab;
}

const navigationItems: NavigationItem[] = [
  { name: 'Overview', icon: Home, tab: 'overview' },
  { name: 'Users', icon: Users, tab: 'users' },
  { name: 'Events', icon: Calendar, tab: 'events' },
  { name: 'Courses', icon: BookOpen, tab: 'courses' },
  { name: 'Enrollments', icon: UserCheck, tab: 'enrollments' },
  { name: 'Fields', icon: Globe, tab: 'fields' },
  { name: 'Messages', icon: Mail, tab: 'messages' },
  { name: 'Tickets', icon: TicketIcon, tab: 'tickets' },
];

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

interface Course {
  id: string;
  title: string;
  description: string | null;
  course_type_id: number | null;
  course_type: string;
  status_id: number | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  link: string | null;
  image_url: string | null;
  field_of_interest_id: number | null;
  created_at: string;
  updated_at: string;
}

interface Ticket {
  id: string;
  event_id: string;
  user_id: string;
  created_at: string;
  event?: { id: string; title: string };
  user?: { id: string; full_name: string; email: string };
}

type ActiveTab = 'overview' | 'users' | 'events' | 'fields' | 'messages' | 'tickets' | 'courses' | 'enrollments';

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
  const [courseEnrollmentStats, setCourseEnrollmentStats] = useState<{ title: string; count: number }[]>([]);
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

  // Course states
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [courseTypes, setCourseTypes] = useState<{ id: number; name: string; display_name: string; variant: string; is_active: boolean }[]>([]);
  const [courseStatuses, setCourseStatuses] = useState<{ id: number; name: string; display_name: string; variant: string; is_active: boolean }[]>([]);
  const [showCourseEnrolleesDialog, setShowCourseEnrolleesDialog] = useState(false);
  const [selectedCourseEnrollees, setSelectedCourseEnrollees] = useState<any[]>([]);

  // User enrollments management states
  const [userEnrollments, setUserEnrollments] = useState<any[]>([]);
  const [loadingUserEnrollments, setLoadingUserEnrollments] = useState(false);
  const [showRemoveEnrollmentDialog, setShowRemoveEnrollmentDialog] = useState(false);
  const [enrollmentToRemove, setEnrollmentToRemove] = useState<any>(null);
  const [isCourseDialogOpen, setIsCourseDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [showDeleteCourseDialog, setShowDeleteCourseDialog] = useState(false);
  const [coursesTab, setCoursesTab] = useState<'courses' | 'types' | 'filters'>('courses');
  const [courseFilters, setCourseFilters] = useState({
    status: 'all',
    type: 'all',
    dateType: 'all' // 'all', 'permanent', 'temporary'
  });
  const [isCourseTypeDialogOpen, setIsCourseTypeDialogOpen] = useState(false);
  const [editingCourseType, setEditingCourseType] = useState<{ id: number; name: string; variant?: string } | null>(null);
  const [courseTypeForm, setCourseTypeForm] = useState({ name: '', display_name: '', variant: 'outline', is_active: true });
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    course_type_id: null as number | null,
    course_type: '',
    status_id: null as number | null,
    status: '',
    start_date: null as string | null,
    end_date: null as string | null,
    link: '',
    image_url: '',
    field_of_interest_id: null as number | null
  });
  const [selectedCourseFields, setSelectedCourseFields] = useState<number[]>([]);
  const [fieldOfInterestOptions, setFieldOfInterestOptions] = useState<{ id: number; name: string; display_order: number; is_active: boolean }[]>([]);

  const { user, userProfile, signOut, loading: authLoading } = useAuth();

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
    try {
      await signOut(); // Use the signOut from useAuth context
      setShowLogoutDialog(false);
      // Force navigation to login and replace history
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
    }
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
    if (!authLoading && !user) {
      console.log('No user found, redirecting to login');
      navigate('/login', { replace: true });
      return;
    }
    // Check if user is admin
    if (user && userProfile && userProfile.role !== 'Administrator') {
      console.log('Non-admin access attempt, redirecting to home');
      navigate('/', { replace: true });
    }
  }, [user, authLoading, userProfile, navigate]);

  // Fetch data effect
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch from the correct tables based on your Supabase schema
  const [usersData, eventsData, fieldOfInterestData, contactMessagesData, coursesData, courseTypesData, courseStatusesData, enrollmentsData] = await Promise.all([
          supabase.from('users').select(`
            *,
            account:accounts(email, created_at)
          `).order('created_at', { ascending: false }),
          supabase.from('events').select('*').order('created_at', { ascending: false }),
          supabase.from('field_of_interest_options').select('*'),
          supabase.from('contact_messages').select('*').order('created_at', { ascending: false }),
          supabase.from('courses').select(`
            *,
            field_of_interest_options(name)
          `).order('created_at', { ascending: false }),
          supabase.from('course_types').select('*').order('created_at', { ascending: true }),
          supabase.from('course_statuses').select('*').order('created_at', { ascending: true }),
          // fetch enrollments with user join (adjust fields to match your schema)
          supabase.from('course_enrollments').select(`*, user:users(id, full_name, account:accounts(email))`).order('collected_at', { ascending: false })
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
        if (fieldOfInterestData.error) {
          console.error('Fields fetch error:', fieldOfInterestData.error);
          setFields([]);
        } else {
          setFields(fieldOfInterestData.data || []);
        }

        // Handle contact messages data
        if (contactMessagesData.error) {
          console.error('Contact messages fetch error:', contactMessagesData.error);
          setContactMessages([]);
        } else {
          setContactMessages(contactMessagesData.data || []);
        }

        // Handle courses data
        if (coursesData.error) {
          console.error('Courses fetch error:', coursesData.error);
          setCourses([]);
        } else {
          setCourses(coursesData.data || []);
        }

        // Handle enrollments data
        if (enrollmentsData && enrollmentsData.error) {
          console.error('Enrollments fetch error:', enrollmentsData.error);
          setEnrollments([]);
        } else {
          setEnrollments(enrollmentsData?.data || []);
        }
        // course types
        if (courseTypesData && courseTypesData.error) {
          console.error('Course types fetch error:', courseTypesData.error);
          setCourseTypes([]);
        } else {
          setCourseTypes(courseTypesData?.data || []);
        }

        // course statuses
        if (courseStatusesData && courseStatusesData.error) {
          console.error('Course statuses fetch error:', courseStatusesData.error);
          setCourseStatuses([]);
        } else {
          setCourseStatuses(courseStatusesData?.data || []);
        }

        // field of interest options
        if (fieldOfInterestData && fieldOfInterestData.error) {
          console.error('Field of interest fetch error:', fieldOfInterestData.error);
          setFieldOfInterestOptions([]);
        } else {
          setFieldOfInterestOptions(fieldOfInterestData?.data || []);
        }
        
        // Calculate statistics
        const totalEvents = eventsData.data?.length || 0;
        const activeEvents = totalEvents; // All events are considered active since there's no status field
        const totalFields = fieldOfInterestData.data?.length || 0;
        const activeFields = fieldOfInterestData.data?.filter(f => f.is_active).length || 0;
        
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

        // Fetch course enrollment statistics
        const enrollmentStatsQuery = supabase
          .from('courses')
          .select(`
            title,
            course_enrollments(count)
          `);

        const { data: enrollmentStatsData, error: enrollmentStatsError } = await enrollmentStatsQuery;

        if (enrollmentStatsError) {
          console.error('Course enrollment stats fetch error:', enrollmentStatsError);
          setCourseEnrollmentStats([]);
        } else {
          const stats = (enrollmentStatsData || []).map(course => ({
            title: course.title,
            count: course.course_enrollments?.[0]?.count || 0
          })).sort((a, b) => b.count - a.count);
          setCourseEnrollmentStats(stats);
        }

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

  // Load user enrollments when enrollments tab is active
  useEffect(() => {
    if (activeTab === 'enrollments') {
      loadUserEnrollments();
    }
  }, [activeTab]);

  // Function to load user enrollments
  const loadUserEnrollments = async () => {
    try {
      setLoadingUserEnrollments(true);
      const { data, error } = await supabase
        .from('course_enrollments')
        .select(`
          *,
          user:users(id, full_name, account:accounts(email)),
          course:courses(id, title, course_type, status)
        `)
        .order('collected_at', { ascending: false });

      if (error) {
        console.error('Error loading user enrollments:', error);
        setUserEnrollments([]);
        return;
      }

      setUserEnrollments(data || []);
    } catch (error) {
      console.error('Error loading user enrollments:', error);
      setUserEnrollments([]);
    } finally {
      setLoadingUserEnrollments(false);
    }
  };

  // Function to remove enrollment
  const handleRemoveEnrollment = async (enrollment: any) => {
    try {
      const { error } = await supabase
        .from('course_enrollments')
        .delete()
        .eq('id', enrollment.id);

      if (error) {
        console.error('Error removing enrollment:', error);
        return;
      }

      // Refresh the enrollments list
      await loadUserEnrollments();
      setShowRemoveEnrollmentDialog(false);
      setEnrollmentToRemove(null);
    } catch (error) {
      console.error('Error removing enrollment:', error);
    }
  };

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

  // Course CRUD handlers
  const handleAddCourse = () => {
    const defaultStatus = courseStatuses.find(cs => cs.name === 'upcoming');
    setEditingCourse(null);
    setCourseForm({
      title: '',
      description: '',
      course_type_id: null,
      course_type: '',
      status_id: defaultStatus ? defaultStatus.id : null,
      status: defaultStatus ? defaultStatus.name : '',
      start_date: null,
      end_date: null,
      link: '',
      image_url: '',
      field_of_interest_id: null
    });
    setImageFile(null);
    setImagePreview('');
    setIsCourseDialogOpen(true);
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setCourseForm({
      title: course.title,
      description: course.description || '',
      course_type_id: course.course_type_id,
      course_type: course.course_type,
      status_id: course.status_id,
      status: course.status,
      start_date: course.start_date,
      end_date: course.end_date || '',
      link: course.link || '',
      image_url: course.image_url || '',
      field_of_interest_id: course.field_of_interest_id
    });
    setImagePreview(course.image_url || '');
    setIsCourseDialogOpen(true);
  };

  const handleDeleteCourse = (course: Course) => {
    setCourseToDelete(course);
    setShowDeleteCourseDialog(true);
  };

  const handleDeleteCourseConfirm = async () => {
    if (!courseToDelete) return;
    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseToDelete.id);
      
      if (error) throw error;
      
      setCourses(courses.filter(c => c.id !== courseToDelete.id));
      showToast('Course deleted successfully!', 'success');
    } catch (err) {
      console.error('Delete course error:', err);
      showToast(err instanceof Error ? err.message : 'Failed to delete course', 'error');
    } finally {
      setShowDeleteCourseDialog(false);
      setCourseToDelete(null);
    }
  };

  const handleSaveCourse = async () => {
    try {
      setIsCreatingEvent(true); // Reuse the loading state
      setEventProgress(0);
      
      let imageUrl = courseForm.image_url;
      
      // Validate form
      if (!courseForm.title || !courseForm.course_type_id || !courseForm.status_id) {
        throw new Error('Title, course type, and status are required');
      }
      
      setEventProgress(20);
      
      // Handle image upload if there's a new image
      if (imageFile) {
        setIsUploadingImage(true);
        try {
          imageUrl = await uploadImage(imageFile);
        } catch (error) {
          console.error('Image upload failed:', error);
          showToast('Failed to upload image. Continuing without image.', 'warning');
          imageUrl = '';
        } finally {
          setIsUploadingImage(false);
        }
      }
      
      setEventProgress(50);
      
      const courseData = {
        ...courseForm,
        image_url: imageUrl,
        // Ensure date fields are properly formatted for database
        start_date: courseForm.start_date === '' ? null : courseForm.start_date,
        end_date: courseForm.end_date === '' ? null : courseForm.end_date
      };

      // Debug: Log the data being sent to database
      console.log('Course data being sent to database:', courseData);
      
      if (editingCourse) {
        const { error } = await supabase
          .from('courses')
          .update(courseData)
          .eq('id', editingCourse.id);
        
        if (error) throw error;
        
        setCourses(courses.map(c => 
          c.id === editingCourse.id ? { ...c, ...courseData } : c
        ));
        showToast('Course updated successfully!', 'success');
      } else {
        const { error } = await supabase
          .from('courses')
          .insert([courseData]);
        
        if (error) throw error;
        
        // Refresh courses list
        const { data } = await supabase
          .from('courses')
          .select('*')
          .order('created_at', { ascending: false });
        
        setCourses(data || []);
        showToast('Course created successfully!', 'success');
      }
      
      setEventProgress(100);
      
      setTimeout(() => {
        setIsCourseDialogOpen(false);
        setImageFile(null);
        setImagePreview('');
        setEventProgress(0);
        setIsCreatingEvent(false);
      }, 1000);
      
    } catch (err) {
      console.error('Save course error:', err);
      showToast(err instanceof Error ? err.message : 'Failed to save course', 'error');
      setIsCreatingEvent(false);
      setEventProgress(0);
    }
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
        image_url: imageUrl,
        // Ensure date field is properly formatted
        date: eventForm.date || null
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

  const courseColumns = [
    { accessorKey: 'title', header: 'Title' },
    { accessorKey: 'description', header: 'Description', cell: ({ row }: any) => (
      <div className="max-w-xs truncate text-sm" title={row.original.description || ''}>{row.original.description || '—'}</div>
    ) },
    {
      id: 'enrolled_count',
      header: 'Enrolled',
      cell: ({ row }: any) => {
        const courseId = row.original.id;
        const list = enrollments.filter((en: any) => en.course_id === courseId);
        return (
          <Button variant="ghost" size="sm" onClick={() => {
            setSelectedCourseEnrollees(list);
            setShowCourseEnrolleesDialog(true);
          }}>
            {list.length}
          </Button>
        );
      }
    },
    { 
      accessorKey: 'course_type', 
      header: 'Type',
      cell: ({ row }: any) => {
        const courseType = courseTypes.find(ct => ct.id === row.original.course_type_id);
        return (
          <Badge variant={courseType?.variant as any || 'outline'}>
            {courseType?.display_name || row.original.course_type}
          </Badge>
        );
      }
    },
    {
      accessorKey: 'start_date',
      header: 'Start Date',
      cell: ({ row }: any) => {
        if (!row.original.start_date) {
          return <Badge variant="secondary">Permanent</Badge>;
        }
        return new Date(row.original.start_date).toLocaleDateString();
      }
    },
    { 
      accessorKey: 'end_date', 
      header: 'End Date',
      cell: ({ row }: any) => row.original.end_date ? new Date(row.original.end_date).toLocaleDateString() : 'N/A'
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => {
        const courseStatus = courseStatuses.find(cs => cs.id === row.original.status_id);
        return (
          <Badge variant={courseStatus?.variant as any || 'outline'}>
            {courseStatus?.display_name || row.original.status}
          </Badge>
        );
      }
    },
    {
      accessorKey: 'field_of_interest_id',
      header: 'Field',
      cell: ({ row }: any) => {
        const field = fieldOfInterestOptions.find(f => f.id === row.original.field_of_interest_id);
        return field ? (
          <Badge variant="secondary">
            {field.name}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        );
      }
    },
    {
      accessorKey: 'link',
      header: 'Link',
      cell: ({ row }: any) => row.original.link ? (
        <Button variant="ghost" size="sm" asChild>
          <a href={row.original.link} target="_blank" rel="noopener noreferrer">
            <LinkIcon className="h-4 w-4" />
          </a>
        </Button>
      ) : null
    },
    {
      accessorKey: 'image_url',
      header: 'Image',
      cell: ({ row }: any) => (
        row.original.image_url ? (
          <img src={row.original.image_url} alt={row.original.title} className="w-12 h-12 object-cover rounded" />
        ) : (
          <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </div>
        )
      )
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => handleEditCourse(row.original)}>
            <Edit3 className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="destructive" onClick={() => handleDeleteCourse(row.original)}>
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
                { id: 'courses', icon: BookOpen, label: 'Courses' },
                { id: 'enrollments', icon: UserCheck, label: 'Enrollments' },
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
                    <Button variant="ghost" className="flex items-center gap-2 h-10 px-3 text-foreground hover:bg-accent/20 dark:text-muted-foreground dark:hover:text-foreground">
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
                    
                    {/* Course Enrollment Histogram */}
                    <div className="mt-4 lg:mt-6">
                      <Card className="p-3 lg:p-4">
                        <h3 className="text-base lg:text-lg font-semibold mb-3 lg:mb-4">Course Enrollment Histogram</h3>
                        <div className="h-[300px] lg:h-[400px]">
                          <ResponsiveBar
                            data={courseEnrollmentStats}
                            keys={['count']}
                            indexBy="title"
                            margin={{ top: 20, right: 20, bottom: 60, left: 60 }}
                            padding={0.3}
                            colors={{ scheme: 'paired' }}
                            axisBottom={{
                              tickSize: 5,
                              tickPadding: 5,
                              tickRotation: -45,
                              legend: 'Course Title',
                              legendPosition: 'middle',
                              legendOffset: 40
                            }}
                            axisLeft={{
                              tickSize: 5,
                              tickPadding: 5,
                              tickRotation: 0,
                              legend: 'Number of Enrollments',
                              legendPosition: 'middle',
                              legendOffset: -50
                            }}
                            labelSkipWidth={12}
                            labelSkipHeight={12}
                            labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                            animate={true}
                            motionConfig={{
                              mass: 1,
                              tension: 120,
                              friction: 14,
                              clamp: false,
                              precision: 0.01,
                              velocity: 0
                            }}
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

                {activeTab === 'courses' && (
                  <div>
                    <div className="mb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex space-x-2">
                          <Button variant={coursesTab === 'courses' ? 'default' : 'ghost'} size="sm" onClick={() => setCoursesTab('courses')}>Courses Management</Button>
                          <Button variant={coursesTab === 'types' ? 'default' : 'ghost'} size="sm" onClick={() => setCoursesTab('types')}>Course Types</Button>
                          <Button variant={coursesTab === 'filters' ? 'default' : 'ghost'} size="sm" onClick={() => setCoursesTab('filters')}>Filters</Button>
                        </div>
                        <div>
                          {coursesTab === 'courses' ? (
                            <Button onClick={handleAddCourse} size="sm">
                              <Plus className="mr-2 h-4 w-4" /> Add Course
                            </Button>
                          ) : coursesTab === 'types' ? (
                            <Button onClick={() => { setEditingCourseType(null); setCourseTypeForm({ name: '', display_name: '', variant: 'outline', is_active: true }); setIsCourseTypeDialogOpen(true); }} size="sm">
                              <Plus className="mr-2 h-4 w-4" /> Add Type
                            </Button>
                          ) : null}
                        </div>
                      </div>

                      {coursesTab === 'types' && (
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium">Course Types</h3>
                            <Button onClick={() => { setEditingCourseType(null); setCourseTypeForm({ name: '', display_name: '', variant: 'outline', is_active: true }); setIsCourseTypeDialogOpen(true); }} size="sm">
                              <Plus className="mr-2 h-4 w-4" /> Add Type
                            </Button>
                          </div>
                          <Card className="p-4">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b">
                                  <th className="text-left p-2">Name</th>
                                  <th className="text-left p-2">Display Name</th>
                                  <th className="text-left p-2">Variant</th>
                                  <th className="text-left p-2">Active</th>
                                  <th className="text-left p-2">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {courseTypes.map(ct => (
                                  <tr key={ct.id} className="border-b">
                                    <td className="p-2">
                                      <Badge variant={ct.variant as any}>{ct.name}</Badge>
                                    </td>
                                    <td className="p-2">{ct.display_name}</td>
                                    <td className="p-2">{ct.variant}</td>
                                    <td className="p-2">
                                      <Badge variant={ct.is_active ? 'default' : 'secondary'}>
                                        {ct.is_active ? 'Active' : 'Inactive'}
                                      </Badge>
                                    </td>
                                    <td className="p-2">
                                      <div className="flex gap-2">
                                        <Button size="sm" variant="outline" onClick={() => {
                                          setEditingCourseType(ct);
                                          setCourseTypeForm({ name: ct.name, display_name: ct.display_name, variant: ct.variant, is_active: ct.is_active });
                                          setIsCourseTypeDialogOpen(true);
                                        }}>Edit</Button>
                                        <Button size="sm" variant="ghost" onClick={async () => {
                                          await supabase.from('course_types').delete().eq('id', ct.id);
                                          setCourseTypes(courseTypes.filter(t => t.id !== ct.id));
                                        }}>Delete</Button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </Card>
                        </div>
                      )}

                      {coursesTab === 'filters' && (
                        <div className="space-y-4">
                          <Card className="p-4">
                            <h3 className="text-lg font-medium mb-4">Course Filters</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <Label htmlFor="status-filter">Status</Label>
                                <Select value={courseFilters.status} onValueChange={(value) => setCourseFilters({...courseFilters, status: value})}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="All statuses" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    {courseStatuses.map(status => (
                                      <SelectItem key={status.id} value={status.name}>{status.display_name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label htmlFor="type-filter">Course Type</Label>
                                <Select value={courseFilters.type} onValueChange={(value) => setCourseFilters({...courseFilters, type: value})}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="All types" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    {courseTypes.map(type => (
                                      <SelectItem key={type.id} value={type.name}>{type.display_name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label htmlFor="date-filter">Date Type</Label>
                                <Select value={courseFilters.dateType} onValueChange={(value) => setCourseFilters({...courseFilters, dateType: value})}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="All courses" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="all">All Courses</SelectItem>
                                    <SelectItem value="permanent">Permanent Courses</SelectItem>
                                    <SelectItem value="temporary">Temporary Courses</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="mt-4 flex gap-2">
                              <Button onClick={() => setCourseFilters({ status: 'all', type: 'all', dateType: 'all' })} variant="outline" size="sm">
                                Clear Filters
                              </Button>
                              <Button onClick={() => setCoursesTab('courses')} size="sm">
                                Apply Filters
                              </Button>
                            </div>
                          </Card>
                        </div>
                      )}
                    </div>

                    {coursesTab === 'courses' && (
                      <Card className="p-4">
                        {(() => {
                          // Apply filters to courses
                          const filteredCourses = courses.filter(course => {
                            // Status filter
                            if (courseFilters.status !== 'all' && course.status !== courseFilters.status) {
                              return false;
                            }
                            // Type filter
                            if (courseFilters.type !== 'all' && course.course_type !== courseFilters.type) {
                              return false;
                            }
                            // Date type filter
                            if (courseFilters.dateType === 'permanent' && course.start_date) {
                              return false;
                            }
                            if (courseFilters.dateType === 'temporary' && !course.start_date) {
                              return false;
                            }
                            return true;
                          });

                          return filteredCourses.length === 0 ? (
                            <div className="p-6 text-center">
                              <p className="mb-4 text-muted-foreground">
                                {courses.length === 0 ? 'No courses yet. Click "Add Course" to create one.' : 'No courses match the selected filters.'}
                              </p>
                              {courses.length === 0 ? (
                                <Button onClick={handleAddCourse} variant="ghost">
                                  <Plus className="mr-2 h-4 w-4" /> Create your first course
                                </Button>
                              ) : (
                                <Button onClick={() => setCourseFilters({ status: 'all', type: 'all', dateType: 'all' })} variant="ghost">
                                  Clear Filters
                                </Button>
                              )}
                            </div>
                          ) : (
                            <DataTable
                              columns={courseColumns}
                              data={filteredCourses}
                              searchKey="title"
                            />
                          );
                        })()}
                      </Card>
                    )}
                  </div>
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

                      {/* Course Enrollees Dialog */}
                      <Dialog open={showCourseEnrolleesDialog} onOpenChange={setShowCourseEnrolleesDialog}>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Enrolled Users</DialogTitle>
                            <DialogDescription>List of users who collected / enrolled in this course.</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            {selectedCourseEnrollees.length === 0 ? (
                              <p className="text-muted-foreground">No users have enrolled in this course yet.</p>
                            ) : (
                              <div className="space-y-2">
                                {selectedCourseEnrollees.map((en: any) => (
                                  <div key={en.id} className="flex items-center justify-between p-2 border rounded">
                                    <div>
                                      <div className="font-medium">{en.user?.full_name || 'Unknown'}</div>
                                      <div className="text-sm text-muted-foreground">{en.user?.account?.email || 'No email'}</div>
                                    </div>
                                    <div className="text-sm text-muted-foreground">{en.status}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setShowCourseEnrolleesDialog(false)}>Close</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                  </Card>
                )}

                {activeTab === 'enrollments' && (
                  <Card className="p-4">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold">User Course Enrollments</h3>
                      <p className="text-sm text-muted-foreground">Manage user enrollments and remove courses from users</p>
                    </div>

                    {loadingUserEnrollments ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        <span>Loading enrollments...</span>
                      </div>
                    ) : userEnrollments.length === 0 ? (
                      <div className="text-center py-8">
                        <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No user enrollments found</p>
                      </div>
                    ) : (
                      <DataTable
                        columns={[
                          {
                            id: 'user_name',
                            header: 'User',
                            accessorFn: (row: any) => row.user?.full_name || 'Unknown',
                            cell: ({ row }: any) => (
                              <div>
                                <div className="font-medium">{row.original.user?.full_name || 'Unknown'}</div>
                                <div className="text-sm text-muted-foreground">{row.original.user?.account?.email || 'No email'}</div>
                              </div>
                            )
                          },
                          {
                            id: 'course_title',
                            header: 'Course',
                            accessorFn: (row: any) => row.course?.title || 'Unknown',
                            cell: ({ row }: any) => (
                              <div>
                                <div className="font-medium">{row.original.course?.title || 'Unknown'}</div>
                                <div className="text-sm text-muted-foreground">{row.original.course?.course_type || ''}</div>
                              </div>
                            )
                          },
                          {
                            accessorKey: 'status',
                            header: 'Status',
                            cell: ({ row }: any) => (
                              <Badge variant={row.original.status === 'enrolled' ? 'default' : 'secondary'}>
                                {row.original.status}
                              </Badge>
                            )
                          },
                          {
                            accessorKey: 'progress',
                            header: 'Progress',
                            cell: ({ row }: any) => `${row.original.progress}%`
                          },
                          {
                            accessorKey: 'collected_at',
                            header: 'Enrolled Date',
                            cell: ({ row }: any) => new Date(row.original.collected_at).toLocaleDateString()
                          },
                          {
                            id: 'actions',
                            header: 'Actions',
                            cell: ({ row }: any) => (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setEnrollmentToRemove(row.original);
                                  setShowRemoveEnrollmentDialog(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )
                          }
                        ]}
                        data={userEnrollments}
                        searchKey="user.full_name"
                      />
                    )}

                    {/* Remove Enrollment Confirmation Dialog */}
                    <Dialog open={showRemoveEnrollmentDialog} onOpenChange={setShowRemoveEnrollmentDialog}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Remove Enrollment</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to remove this course enrollment? This action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        {enrollmentToRemove && (
                          <div className="py-4">
                            <div className="bg-muted p-3 rounded-lg">
                              <p><strong>User:</strong> {enrollmentToRemove.user?.full_name || 'Unknown'}</p>
                              <p><strong>Course:</strong> {enrollmentToRemove.course?.title || 'Unknown'}</p>
                              <p><strong>Enrolled:</strong> {new Date(enrollmentToRemove.collected_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                        )}
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setShowRemoveEnrollmentDialog(false)}>
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => enrollmentToRemove && handleRemoveEnrollment(enrollmentToRemove)}
                          >
                            Remove Enrollment
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>      {/* User Dialog */}
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

      {/* Course Dialog */}
      <Dialog open={isCourseDialogOpen} onOpenChange={setIsCourseDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingCourse ? 'Edit Course' : 'Add New Course'}</DialogTitle>
            <DialogDescription>
              {editingCourse ? 'Edit the course details below.' : 'Add a new course to the platform.'}
            </DialogDescription>
          </DialogHeader>

          {/* Progress Bar */}
          {isCreatingEvent && (
            <div className="mb-6">
              <Progress value={eventProgress} className="w-full" />
              <p className="text-sm text-muted-foreground mt-2">
                {isUploadingImage ? 'Uploading image...' : 'Saving course...'}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={courseForm.title}
                  onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                  disabled={isCreatingEvent}
                />
              </div>

              <div>
                <Label htmlFor="start_date">Start Date <span className="text-sm text-muted-foreground">(Optional)</span></Label>
                <Input
                  id="start_date"
                  type="date"
                  value={courseForm.start_date || ''}
                  onChange={(e) => setCourseForm({ ...courseForm, start_date: e.target.value === '' ? null : e.target.value })}
                  disabled={isCreatingEvent}
                  placeholder="Leave empty for permanent courses"
                />
              </div>

              <div>
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={courseForm.end_date || ''}
                  onChange={(e) => setCourseForm({ ...courseForm, end_date: e.target.value === '' ? null : e.target.value })}
                  disabled={isCreatingEvent}
                />
              </div>

              <div>
                <Label htmlFor="course_type">Course Type</Label>
                <Select
                  value={courseForm.course_type_id?.toString() || ''}
                  onValueChange={(value: string) => {
                    const selectedType = courseTypes.find(ct => ct.id.toString() === value);
                    if (selectedType) {
                      setCourseForm({ 
                        ...courseForm, 
                        course_type_id: selectedType.id,
                        course_type: selectedType.name
                      });
                    }
                  }}
                  disabled={isCreatingEvent}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {courseTypes.filter(ct => ct.is_active).map(ct => (
                      <SelectItem key={ct.id} value={ct.id.toString()}>{ct.display_name || ct.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                  disabled={isCreatingEvent}
                  placeholder="Enter course description..."
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={courseForm.status_id?.toString() || ''}
                  onValueChange={(value) => {
                    const selectedStatus = courseStatuses.find(cs => cs.id.toString() === value);
                    setCourseForm({
                      ...courseForm,
                      status_id: selectedStatus ? selectedStatus.id : null,
                      status: selectedStatus ? selectedStatus.name : ''
                    });
                  }}
                  disabled={isCreatingEvent}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {courseStatuses.filter(cs => cs.is_active).map(cs => (
                      <SelectItem key={cs.id} value={cs.id.toString()}>
                        {cs.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="field_of_interest">Field of Interest</Label>
                <Select
                  value={courseForm.field_of_interest_id?.toString() || ''}
                  onValueChange={(value) => {
                    setCourseForm({
                      ...courseForm,
                      field_of_interest_id: value ? parseInt(value) : null
                    });
                  }}
                  disabled={isCreatingEvent}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select field (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {fieldOfInterestOptions.filter(f => f.is_active).map(field => (
                      <SelectItem key={field.id} value={field.id.toString()}>
                        {field.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="link">Course Link</Label>
                <Input
                  id="link"
                  type="url"
                  value={courseForm.link || ''}
                  onChange={(e) => setCourseForm({ ...courseForm, link: e.target.value })}
                  disabled={isCreatingEvent}
                  placeholder="https://..."
                />
              </div>

              <div>
                <Label htmlFor="image">Course Image</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={isCreatingEvent}
                  />
                  {imagePreview && (
                    <div className="relative w-24 h-24">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover rounded"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCourseDialogOpen(false)} disabled={isCreatingEvent}>
              Cancel
            </Button>
            <Button onClick={handleSaveCourse} disabled={isCreatingEvent}>
              {isCreatingEvent ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>{editingCourse ? 'Update Course' : 'Create Course'}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Course Dialog */}
      <Dialog open={showDeleteCourseDialog} onOpenChange={setShowDeleteCourseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Course</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this course? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteCourseDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteCourseConfirm}>
              Delete Course
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Course Type Dialog */}
      <Dialog open={isCourseTypeDialogOpen} onOpenChange={setIsCourseTypeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCourseType ? 'Edit Course Type' : 'Add Course Type'}</DialogTitle>
            <DialogDescription>Manage course type details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="course-type-name">Name</Label>
              <Input id="course-type-name" value={courseTypeForm.name} onChange={(e) => setCourseTypeForm({ ...courseTypeForm, name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="course-type-display-name">Display Name</Label>
              <Input id="course-type-display-name" value={courseTypeForm.display_name} onChange={(e) => setCourseTypeForm({ ...courseTypeForm, display_name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="course-type-variant">Variant</Label>
              <Select value={courseTypeForm.variant} onValueChange={(v) => setCourseTypeForm({ ...courseTypeForm, variant: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="outline">Outline</SelectItem>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="secondary">Secondary</SelectItem>
                  <SelectItem value="destructive">Destructive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="course-type-active"
                checked={courseTypeForm.is_active}
                onChange={(e) => setCourseTypeForm({ ...courseTypeForm, is_active: e.target.checked })}
              />
              <Label htmlFor="course-type-active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCourseTypeDialogOpen(false); setEditingCourseType(null); }}>Cancel</Button>
            <Button onClick={async () => {
              try {
                if (!courseTypeForm.name.trim()) return;
                if (editingCourseType) {
                  const { error } = await supabase.from('course_types').update({
                    name: courseTypeForm.name,
                    display_name: courseTypeForm.display_name,
                    variant: courseTypeForm.variant,
                    is_active: courseTypeForm.is_active
                  }).eq('id', editingCourseType.id);
                  if (error) throw error;
                  setCourseTypes(courseTypes.map(ct => ct.id === editingCourseType.id ? { ...ct, ...courseTypeForm } : ct));
                  showToast('Course type updated', 'success');
                } else {
                  const { data, error } = await supabase.from('course_types').insert({
                    name: courseTypeForm.name,
                    display_name: courseTypeForm.display_name,
                    variant: courseTypeForm.variant,
                    is_active: courseTypeForm.is_active
                  }).select().single();
                  if (error) throw error;
                  setCourseTypes([...courseTypes, data]);
                  showToast('Course type added', 'success');
                }
                setIsCourseTypeDialogOpen(false);
                setEditingCourseType(null);
              } catch (err) {
                console.error('Save course type error:', err);
                showToast(err instanceof Error ? err.message : 'Failed to save course type', 'error');
              }
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default AdminDashboard;
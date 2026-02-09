import React, { useState, useEffect } from 'react';
import { useNavigate} from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { AdminSidebar } from '@/components/AdminSidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { cn } from '@/lib/utils';
import { 
  Menu, 
  ChevronDown, 
  User, 
  Home, 
  LogOut, 
  Loader2,
  Plus,
  Edit,
  Trash2,
  Eye,
  Upload,
  X,
  DollarSign,
  Calendar,
  Users as UsersIcon,
  Image as ImageIcon,
  FileText,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface Magazine {
  id: string;
  title: string;
  description: string;
  cover_image_url: string | null;
  pdf_url: string | null;
  authors: string[];
  images: string[];
  price: number;
  is_paid: boolean;
  status: 'coming_soon' | 'published' | 'archived';
  published_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface MagazineRequest {
  id: string;
  user_id: string;
  magazine_id: string;
  status: 'pending' | 'approved' | 'rejected';
  message: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  user?: { id: string; full_name: string; account?: { email: string } };
  magazine?: { id: string; title: string; created_by?: string | null };
}

interface MagazineAccess {
  id: string;
  user_id: string;
  magazine_id: string;
  access_type: string;
  granted_by: string | null;
  granted_at: string;
  expires_at: string | null;
  user?: { id: string; full_name: string; email?: string };
  magazine?: { id: string; title: string };
  granted_by_user?: { id: string; full_name: string };
}

const MagazineAdmin: React.FC = () => {
  const navigate = useNavigate();
  const { user, userProfile, signOut, loading: authLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'magazines' | 'requests' | 'access'>('magazines');
  
  // Custom scrollbar styles
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .custom-scrollbar::-webkit-scrollbar {
        width: 12px;
        height: 12px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: linear-gradient(to right, #f1f5f9, #e2e8f0);
        border-radius: 10px;
        margin: 4px;
      }
      .dark .custom-scrollbar::-webkit-scrollbar-track {
        background: linear-gradient(to right, #1e293b, #0f172a);
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: linear-gradient(135deg, #6366f1, #8b5cf6, #d946ef);
        border-radius: 10px;
        border: 2px solid transparent;
        background-clip: padding-box;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(135deg, #4f46e5, #7c3aed, #c026d3);
        border: 2px solid transparent;
        background-clip: padding-box;
      }
      .custom-scrollbar::-webkit-scrollbar-corner {
        background: transparent;
      }
      /* Firefox */
      .custom-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: #8b5cf6 #e2e8f0;
      }
      .dark .custom-scrollbar {
        scrollbar-color: #8b5cf6 #1e293b;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  // Magazine states
  const [magazines, setMagazines] = useState<Magazine[]>([]);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryTitle, setGalleryTitle] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingMagazine, setEditingMagazine] = useState<Magazine | null>(null);
  const [viewingMagazine, setViewingMagazine] = useState<Magazine | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: 0,
    is_paid: false,
    status: 'coming_soon' as 'coming_soon' | 'published' | 'archived',
    published_at: null as string | null
  });
  const [authors, setAuthors] = useState<string[]>(['']);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string>('');
  const [additionalImages, setAdditionalImages] = useState<File[]>([]);
  const [additionalImagePreviews, setAdditionalImagePreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Request states
  const [requests, setRequests] = useState<MagazineRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<MagazineRequest | null>(null);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [isUserDetailsDialogOpen, setIsUserDetailsDialogOpen] = useState(false);
  const [selectedUserForDetails, setSelectedUserForDetails] = useState<{ id: string; full_name: string; account?: { email: string } } | null>(null);
  
  // Access states
  const [accesses, setAccesses] = useState<MagazineAccess[]>([]);
  const [isAccessDialogOpen, setIsAccessDialogOpen] = useState(false);
  const [editingAccess, setEditingAccess] = useState<MagazineAccess | null>(null);
  const [accessForm, setAccessForm] = useState({
    user_id: '',
    magazine_id: '',
    access_type: 'full',
    expires_at: null as string | null
  });
  const [users, setUsers] = useState<{ id: string; full_name: string }[]>([]);

  // Protect admin pages - only administrators can access
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { replace: true });
      return;
    }
    if (user && userProfile && userProfile.role !== 'Administrator') {
      navigate('/', { replace: true });
    }
  }, [user, authLoading, userProfile, navigate]);

  useEffect(() => {
    fetchMagazines();
    fetchRequests();
    fetchAccesses();
    fetchUsers();
  }, []);

  const fetchMagazines = async () => {
    setError(null);
    const { data, error } = await supabase
      .from('magazines')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      setError(`Failed to load magazines: ${error.message}`);
      console.error('Fetch magazines error:', error);
    } else {
      setMagazines(data || []);
    }
  };

  const fetchRequests = async () => {
    setError(null);
    const { data, error } = await supabase
      .from('magazine_requests')
      .select(`
        *,
        user:users!magazine_requests_user_id_fkey(id, full_name, account:accounts!users_account_id_fkey(email)),
        magazine:magazines!magazine_requests_magazine_id_fkey(id, title, created_by)
      `)
      .order('created_at', { ascending: false });
    if (error) {
      setError(`Failed to load requests: ${error.message}`);
      console.error('Fetch requests error:', error);
    } else {
      setRequests(data || []);
    }
  };

  const fetchAccesses = async () => {
    setError(null);
    const { data, error } = await supabase
      .from('magazine_access')
      .select(`
        *,
        user:users!magazine_access_user_id_fkey(id, full_name),
        magazine:magazines!magazine_access_magazine_id_fkey(id, title),
        granted_by_user:users!magazine_access_granted_by_fkey(id, full_name)
      `)
      .order('granted_at', { ascending: false });
    if (error) {
      setError(`Failed to load access records: ${error.message}`);
      console.error('Fetch accesses error:', error);
    } else {
      setAccesses(data || []);
    }
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name')
      .order('full_name');
    if (!error) setUsers(data || []);
  };

  const handleAdd = () => {
    setError(null);
    setSuccess(null);
    setEditingMagazine(null);
    setForm({ 
      title: '', 
      description: '', 
      price: 0, 
      is_paid: false, 
      status: 'coming_soon',
      published_at: null 
    });
    setAuthors(['']);
    setPdfFile(null);
    setCoverImageFile(null);
    setCoverImagePreview('');
    setAdditionalImages([]);
    setAdditionalImagePreviews([]);
    setIsDialogOpen(true);
  };

  const handleEdit = (magazine: Magazine) => {
    setError(null);
    setSuccess(null);
    setEditingMagazine(magazine);
    setForm({ 
      title: magazine.title, 
      description: magazine.description || '', 
      price: magazine.price || 0,
      is_paid: magazine.is_paid || false,
      status: magazine.status || 'coming_soon',
      published_at: magazine.published_at
    });
    setAuthors(magazine.authors && magazine.authors.length > 0 ? magazine.authors : ['']);
    setCoverImagePreview(magazine.cover_image_url || '');
    setPdfFile(null);
    setCoverImageFile(null);
    setAdditionalImages([]);
    setAdditionalImagePreviews(magazine.images || []);
    setIsDialogOpen(true);
  };

  const handleView = (magazine: Magazine) => {
    setViewingMagazine(magazine);
    setIsViewDialogOpen(true);
  };

  const handleDelete = async (magazine: Magazine) => {
    if (!confirm(`Are you sure you want to delete "${magazine.title}"?`)) return;
    
    // Delete PDF from storage
    if (magazine.pdf_url) {
      const path = magazine.pdf_url.split('/').pop();
      if (path) await supabase.storage.from('Magazines').remove([path]);
    }
    
    // Delete cover image from storage
    if (magazine.cover_image_url) {
      const path = magazine.cover_image_url.split('/').pop();
      if (path) await supabase.storage.from('MagazineImages').remove([path]);
    }
    
    // Delete additional images
    if (magazine.images && magazine.images.length > 0) {
      const paths = magazine.images.map(url => url.split('/').pop()).filter(Boolean);
      if (paths.length > 0) await supabase.storage.from('MagazineImages').remove(paths as string[]);
    }
    
    await supabase.from('magazines').delete().eq('id', magazine.id);
    fetchMagazines();
  };

  const uploadImage = async (file: File, bucket: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);
    
    if (error) {
      console.error('Upload error:', error);
      return null;
    }
    
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return urlData.publicUrl;
  };

  const handleSave = async () => {
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    
    // Check if userProfile is loaded
    if (!userProfile?.id) {
      console.warn('User profile not loaded. Magazine will be created without created_by field.');
    }
    
    try {
      // Upload PDF (main feature!)
      let pdfUrl = editingMagazine?.pdf_url || '';
      if (pdfFile) {
        setUploadProgress(10);
        const fileExt = pdfFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { data, error } = await supabase.storage
          .from('Magazines')
          .upload(fileName, pdfFile);
        
        if (error) {
          throw new Error(`PDF upload failed: ${error.message}`);
        }
        
        if (data) {
          const { data: urlData } = supabase.storage.from('Magazines').getPublicUrl(data.path);
          pdfUrl = urlData.publicUrl;
          console.log('PDF uploaded successfully:', pdfUrl);
        }
      }
      
      // Upload cover image
      setUploadProgress(30);
      let coverImageUrl = editingMagazine?.cover_image_url || '';
      if (coverImageFile) {
        const url = await uploadImage(coverImageFile, 'MagazineImages');
        if (url) {
          coverImageUrl = url;
          console.log('Cover image uploaded:', coverImageUrl);
        }
      }
      
      // Upload additional images
      setUploadProgress(50);
      const existingImages = editingMagazine?.images || [];
      const newImageUrls: string[] = [];
      
      for (let i = 0; i < additionalImages.length; i++) {
        const url = await uploadImage(additionalImages[i], 'MagazineImages');
        if (url) newImageUrls.push(url);
        setUploadProgress(50 + (30 * (i + 1) / additionalImages.length));
      }
      
      const allImages = [...existingImages, ...newImageUrls];
      console.log('All images:', allImages);
      
      setUploadProgress(90);
      
      // Get the user ID from userProfile (users table), not from auth user
      const currentUserId = userProfile?.id || null;
      console.log('Current user ID:', currentUserId);
      
      const magazineData = {
        title: form.title,
        description: form.description || null,
        pdf_url: pdfUrl || null,
        cover_image_url: coverImageUrl || null,
        authors: authors.filter(a => a.trim() !== ''),
        images: allImages,
        price: form.price || 0,
        is_paid: form.is_paid,
        status: form.status,
        published_at: form.status === 'published' && !form.published_at ? new Date().toISOString() : form.published_at,
        created_by: currentUserId,
        updated_at: new Date().toISOString()
      };
      
      console.log('Saving magazine data:', magazineData);
      
      let result;
      if (editingMagazine) {
        result = await supabase.from('magazines').update(magazineData).eq('id', editingMagazine.id).select();
      } else {
        result = await supabase.from('magazines').insert([magazineData]).select();
      }
      
      if (result.error) {
        throw new Error(`Database error: ${result.error.message}`);
      }
      
      console.log('Magazine saved successfully:', result.data);
      
      setUploadProgress(100);
      setSuccess(editingMagazine ? 'Magazine updated successfully!' : 'Magazine created successfully!');
      setIsDialogOpen(false);
      fetchMagazines();
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
      
      // Reset form
      setForm({ title: '', description: '', price: 0, is_paid: false, status: 'coming_soon', published_at: null });
      setAuthors(['']);
      setPdfFile(null);
      setCoverImageFile(null);
      setCoverImagePreview('');
      setAdditionalImages([]);
      setAdditionalImagePreviews([]);
    } catch (error: any) {
      console.error('Save error:', error);
      setError(error.message || 'Failed to save magazine. Please check console for details.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setCoverImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAdditionalImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAdditionalImages(prev => [...prev, ...files]);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAdditionalImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAdditionalImage = (index: number) => {
    setAdditionalImages(prev => prev.filter((_, i) => i !== index));
    setAdditionalImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const addAuthor = () => {
    setAuthors([...authors, '']);
  };

  const removeAuthor = (index: number) => {
    setAuthors(authors.filter((_, i) => i !== index));
  };

  const updateAuthor = (index: number, value: string) => {
    const updated = [...authors];
    updated[index] = value;
    setAuthors(updated);
  };

  // Request handlers
  const handleViewRequest = (request: MagazineRequest) => {
    setSelectedRequest(request);
    setIsRequestDialogOpen(true);
  };

  const handleApproveRequest = async (request: MagazineRequest) => {
    try {
      // Check if access already exists
      const { data: existingAccess } = await supabase
        .from('magazine_access')
        .select('id')
        .eq('user_id', request.user_id)
        .eq('magazine_id', request.magazine_id)
        .single();
      
      // Update request status
      await supabase
        .from('magazine_requests')
        .update({
          status: 'approved',
          reviewed_by: userProfile?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', request.id);
      
      // Grant access only if it doesn't exist
      if (!existingAccess) {
        await supabase.from('magazine_access').insert([{
          user_id: request.user_id,
          magazine_id: request.magazine_id,
          access_type: 'full',
          granted_by: userProfile?.id,
          granted_at: new Date().toISOString()
        }]);
      }
      
      fetchRequests();
      fetchAccesses();
      setIsRequestDialogOpen(false);
      setSuccess('Request approved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error approving request:', error);
      setError('Failed to approve request. Please try again.');
    }
  };

  const handleRejectRequest = async (request: MagazineRequest) => {
    try {
      await supabase
        .from('magazine_requests')
        .update({
          status: 'rejected',
          reviewed_by: userProfile?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', request.id);
      
      fetchRequests();
      setIsRequestDialogOpen(false);
      setSuccess('Request rejected successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error rejecting request:', error);
      setError('Failed to reject request. Please try again.');
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to delete this request?')) return;
    await supabase.from('magazine_requests').delete().eq('id', requestId);
    fetchRequests();
  };

  // Access handlers
  const handleAddAccess = () => {
    setEditingAccess(null);
    setAccessForm({
      user_id: '',
      magazine_id: '',
      access_type: 'full',
      expires_at: null
    });
    setIsAccessDialogOpen(true);
  };

  const handleEditAccess = (access: MagazineAccess) => {
    setEditingAccess(access);
    setAccessForm({
      user_id: access.user_id,
      magazine_id: access.magazine_id,
      access_type: access.access_type,
      expires_at: access.expires_at
    });
    setIsAccessDialogOpen(true);
  };

  const handleSaveAccess = async () => {
    try {
      const accessData = {
        ...accessForm,
        granted_by: user?.id,
        granted_at: new Date().toISOString()
      };
      
      if (editingAccess) {
        await supabase.from('magazine_access').update(accessData).eq('id', editingAccess.id);
      } else {
        await supabase.from('magazine_access').insert([accessData]);
      }
      
      setIsAccessDialogOpen(false);
      fetchAccesses();
    } catch (error) {
      console.error('Error saving access:', error);
      alert('Failed to save access');
    }
  };

  const handleDeleteAccess = async (accessId: string) => {
    if (!confirm('Are you sure you want to revoke this access?')) return;
    await supabase.from('magazine_access').delete().eq('id', accessId);
    fetchAccesses();
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'published': return 'default';
      case 'coming_soon': return 'secondary';
      case 'archived': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'published': return 'Published';
      case 'coming_soon': return 'Coming Soon';
      case 'archived': return 'Archived';
      default: return status;
    }
  };

  const getRequestStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return { variant: 'default' as const, label: 'Approved', icon: CheckCircle };
      case 'rejected': return { variant: 'destructive' as const, label: 'Rejected', icon: XCircle };
      case 'pending': return { variant: 'secondary' as const, label: 'Pending', icon: Clock };
      default: return { variant: 'outline' as const, label: status, icon: AlertCircle };
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Show loading while checking authentication
  if (!user || !userProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show access denied for non-administrators
  if (userProfile.role !== 'Administrator') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-6">
          <h2 className="text-xl font-bold text-destructive mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You do not have permission to access this page.</p>
        </Card>
      </div>
    );
  }

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
        <AdminSidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          activePage="/admin/magazines"
        />

        {/* Main Content */}
        <div className={cn("flex-1 transition-all duration-300 custom-scrollbar overflow-y-auto max-h-screen", "lg:ml-64")}>
          <div className="p-3 lg:p-6">
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
                <h1 className="text-2xl font-bold">Magazines Admin</h1>
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

            {/* Tabs Navigation */}
            <div className="flex items-center gap-2 mb-6 border-b pb-2">
              <Button
                variant={activeTab === 'magazines' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('magazines')}
                className="rounded-full"
              >
                <FileText className="mr-2 h-4 w-4" />
                Magazines
              </Button>
              <Button
                variant={activeTab === 'requests' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('requests')}
                className="rounded-full"
              >
                <Clock className="mr-2 h-4 w-4" />
                Access Requests
                {requests.filter(r => r.status === 'pending').length > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {requests.filter(r => r.status === 'pending').length}
                  </Badge>
                )}
              </Button>
              <Button
                variant={activeTab === 'access' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('access')}
                className="rounded-full"
              >
                <UsersIcon className="mr-2 h-4 w-4" />
                User Access
              </Button>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border-2 border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-800 dark:text-red-300">Error</h3>
                    <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setError(null)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Success Display */}
            {success && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-950/20 border-2 border-green-200 dark:border-green-800 rounded-lg animate-in slide-in-from-top">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-green-800 dark:text-green-300">Success</h3>
                    <p className="text-sm text-green-700 dark:text-green-400 mt-1">{success}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSuccess(null)}
                    className="text-green-600 hover:text-green-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Magazine Tab */}
            {activeTab === 'magazines' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-semibold">Magazine Collection</h2>
                    <p className="text-muted-foreground text-sm mt-1">Manage your magazine library with PDFs and images</p>
                  </div>
                  <Button onClick={handleAdd} size="lg">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Magazine
                  </Button>
                </div>
                
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {magazines.map(magazine => (
                    <Card key={magazine.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50">
                      <div className="relative h-48 bg-gradient-to-br from-primary/10 to-purple-500/10">
                        {magazine.cover_image_url ? (
                          <img 
                            src={magazine.cover_image_url} 
                            alt={magazine.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FileText className="h-16 w-16 text-muted-foreground" />
                          </div>
                        )}
                        <Badge 
                          variant={getStatusBadgeVariant(magazine.status)} 
                          className="absolute top-2 right-2"
                        >
                          {getStatusLabel(magazine.status)}
                        </Badge>
                        {magazine.pdf_url && (
                          <Badge 
                            variant="default" 
                            className="absolute top-2 left-2 bg-green-600"
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            PDF
                          </Badge>
                        )}
                      </div>
                      
                      <CardHeader>
                        <CardTitle className="line-clamp-1">{magazine.title}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {magazine.description || 'No description available'}
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent className="space-y-3">
                        {magazine.created_by && (() => {
                          const creator = users.find(u => u.id === magazine.created_by);
                          return (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <User className="h-4 w-4" />
                              <span className="line-clamp-1">
                                Created by: <span className="font-semibold text-foreground">{creator ? creator.full_name : magazine.created_by}</span>
                              </span>
                            </div>
                          );
                        })()}
                        
                        {magazine.authors && magazine.authors.length > 0 && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <UsersIcon className="h-4 w-4" />
                            <span className="line-clamp-1">
                              {magazine.authors.join(', ')}
                            </span>
                          </div>
                        )}
                        
                        {magazine.is_paid && (
                          <div className="flex items-center gap-2 text-sm font-semibold text-green-600">
                            <DollarSign className="h-4 w-4" />
                            <span>${magazine.price}</span>
                          </div>
                        )}
                        
                        {magazine.published_at && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(magazine.published_at).toLocaleDateString()}</span>
                          </div>
                        )}
                        
                        {magazine.images && magazine.images.length > 0 && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <ImageIcon className="h-4 w-4" />
                            <span>{magazine.images.length} images</span>
                          </div>
                        )}
                      </CardContent>
                      
                      <CardFooter className="flex gap-2">
                        {magazine.pdf_url && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1"
                            asChild
                          >
                            <a href={magazine.pdf_url} target="_blank" rel="noopener noreferrer">
                              <Download className="mr-2 h-4 w-4" />
                              PDF
                            </a>
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleView(magazine)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEdit(magazine)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleDelete(magazine)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
                
                {magazines.length === 0 && (
                  <Card className="p-12 bg-gradient-to-br from-primary/5 to-purple-500/5 border-dashed border-2">
                    <div className="text-center">
                      <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-xl font-semibold mb-2">No magazines yet</h3>
                      <p className="text-muted-foreground mb-6">Upload your first magazine with PDF and cover image</p>
                      <Button onClick={handleAdd} size="lg">
                        <Plus className="mr-2 h-5 w-5" />
                        Create First Magazine
                      </Button>
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* Requests Tab */}
            {activeTab === 'requests' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold">Magazine Access Requests</h2>
                  <p className="text-muted-foreground text-sm mt-1">Review and manage user requests for magazine access</p>
                </div>
                
                <div className="grid gap-4">
                  {requests.map(request => {
                    const statusInfo = getRequestStatusBadge(request.status);
                    return (
                      <Card key={request.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-3">
                                <h3 className="font-semibold text-lg">
                                  {request.user?.full_name || 'Unknown User'}
                                </h3>
                                <Badge variant={statusInfo.variant} className="flex items-center gap-1">
                                  <statusInfo.icon className="h-3 w-3" />
                                  {statusInfo.label}
                                </Badge>
                              </div>
                              <p className="text-muted-foreground">
                                Requesting: <span className="font-medium text-foreground">{request.magazine?.title || 'Unknown Magazine'}</span>
                              </p>
                              {request.magazine?.created_by && (() => {
                                const creator = users.find(u => u.id === request.magazine.created_by);
                                return (
                                  <p className="text-xs text-muted-foreground">
                                    Magazine by: <span className="font-semibold text-foreground">{creator ? creator.full_name : request.magazine.created_by}</span>
                                  </p>
                                );
                              })()}
                              {request.message && (
                                <p className="text-sm text-muted-foreground italic">"{request.message}"</p>
                              )}
                              <p className="text-xs text-muted-foreground">
                                Requested: {new Date(request.created_at).toLocaleString()}
                              </p>
                              {request.reviewed_at && (
                                <p className="text-xs text-muted-foreground">
                                  Reviewed: {new Date(request.reviewed_at).toLocaleString()}
                                </p>
                              )}
                            </div>
                            
                            <div className="flex gap-2 ml-4">
                              {request.status === 'pending' && (
                                <>
                                  <Button 
                                    size="sm" 
                                    variant="default"
                                    onClick={() => handleApproveRequest(request)}
                                  >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Approve
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="destructive"
                                    onClick={() => handleRejectRequest(request)}
                                  >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Reject
                                  </Button>
                                </>
                              )}
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setSelectedUserForDetails(request.user);
                                  setIsUserDetailsDialogOpen(true);
                                }}
                              >
                                <User className="mr-2 h-4 w-4" />
                                Show User Details
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleDeleteRequest(request.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                
                {requests.length === 0 && (
                  <Card className="p-12 text-center">
                    <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No requests yet</h3>
                    <p className="text-muted-foreground">Access requests will appear here</p>
                  </Card>
                )}
              </div>
            )}

            {/* Access Tab */}
            {activeTab === 'access' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-semibold">User Access Management</h2>
                    <p className="text-muted-foreground text-sm mt-1">Control who has access to your magazines</p>
                  </div>
                  <Button onClick={handleAddAccess} size="lg">
                    <Plus className="mr-2 h-4 w-4" />
                    Grant Access
                  </Button>
                </div>
                
                <div className="grid gap-4">
                  {accesses.map(access => (
                    <Card key={access.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold text-lg">
                                {access.user?.full_name || 'Unknown User'}
                              </h3>
                              <Badge variant="default">
                                {access.access_type}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground">
                              Magazine: <span className="font-medium text-foreground">{access.magazine?.title || 'Unknown'}</span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Granted: {new Date(access.granted_at).toLocaleString()}
                              {access.granted_by_user && ` by ${access.granted_by_user.full_name}`}
                            </p>
                            {access.expires_at && (
                              <p className="text-xs text-muted-foreground">
                                Expires: {new Date(access.expires_at).toLocaleString()}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex gap-2 ml-4">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEditAccess(access)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleDeleteAccess(access.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {accesses.length === 0 && (
                  <Card className="p-12 text-center">
                    <UsersIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No access granted yet</h3>
                    <p className="text-muted-foreground">Grant users access to magazines</p>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Add/Edit Magazine Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
          <DialogHeader>
            <DialogTitle>{editingMagazine ? 'Edit Magazine' : 'Add Magazine'}</DialogTitle>
            <DialogDescription>
              {editingMagazine ? 'Update the magazine information and files' : 'Create a new magazine with PDF and images'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* PDF Upload - THE MAIN FEATURE */}
            <div className="space-y-3 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-purple-950/30 p-6 rounded-xl border-2 border-blue-300 dark:border-blue-700 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <Label htmlFor="pdf" className="text-lg font-bold text-blue-900 dark:text-blue-100">
                    Magazine PDF File *
                  </Label>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">Main content file (PDF format)</p>
                </div>
              </div>
              <Input
                id="pdf"
                type="file"
                accept="application/pdf"
                onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                className="border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-950"
              />
              {editingMagazine?.pdf_url && !pdfFile && (
                <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 px-3 py-2 rounded-lg">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">Current PDF available</span>
                  <a href={editingMagazine.pdf_url} target="_blank" rel="noopener noreferrer" className="underline ml-auto hover:text-green-800 dark:hover:text-green-300">
                    View File
                  </a>
                </div>
              )}
              {pdfFile && (
                <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/30 px-3 py-2 rounded-lg">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">{pdfFile.name}</span>
                  <span className="ml-auto text-xs">({(pdfFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
              )}
            </div>
            
            {/* Cover Image */}
            <div className="space-y-3 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 p-6 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-500 rounded-lg">
                  <ImageIcon className="h-5 w-5 text-white" />
                </div>
                <Label className="text-base font-semibold text-emerald-900 dark:text-emerald-100">Cover Image</Label>
              </div>
              <div className="flex items-center gap-4">
                {coverImagePreview && (
                  <div className="relative">
                    <img 
                      src={coverImagePreview} 
                      alt="Cover preview" 
                      className="w-32 h-32 object-cover rounded-xl border-2 border-emerald-300 dark:border-emerald-700 shadow-md"
                    />
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors rounded-xl" />
                  </div>
                )}
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverImageChange}
                    className="border-emerald-200 dark:border-emerald-800 bg-white dark:bg-gray-950"
                  />
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-2">Recommended: 600x800px or similar aspect ratio</p>
                </div>
              </div>
            </div>
            
            {/* Title */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 rounded">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <Label htmlFor="title" className="text-base font-semibold">Magazine Title *</Label>
              </div>
              <Input
                id="title"
                placeholder="Enter magazine title..."
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                required
                className="text-base border-2 focus:border-primary"
              />
            </div>
            
            {/* Description */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded">
                  <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <Label htmlFor="description" className="text-base font-semibold">Description</Label>
              </div>
              <Textarea
                id="description"
                placeholder="Brief description of the magazine content..."
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                rows={4}
                className="border-2 focus:border-purple-400 resize-none"
              />
            </div>
            
            {/* Authors (Simple - just names) */}
            <div className="space-y-3 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 p-5 rounded-xl border border-amber-200 dark:border-amber-800">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-500 rounded-lg">
                    <UsersIcon className="h-5 w-5 text-white" />
                  </div>
                  <Label className="text-base font-semibold text-amber-900 dark:text-amber-100">Authors</Label>
                </div>
                <Button type="button" size="sm" variant="outline" onClick={addAuthor} className="border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/30">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Author
                </Button>
              </div>
              <div className="space-y-2">
                {authors.map((author, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Author name"
                      value={author}
                      onChange={e => updateAuthor(index, e.target.value)}
                      className="flex-1 border-amber-200 dark:border-amber-800 bg-white dark:bg-gray-950"
                    />
                    {authors.length > 1 && (
                      <Button 
                        type="button" 
                        size="icon" 
                        variant="ghost"
                        onClick={() => removeAuthor(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Status & Publication */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-violet-100 dark:bg-violet-900/30 rounded">
                    <AlertCircle className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  </div>
                  <Label htmlFor="status" className="text-base font-semibold">Status</Label>
                </div>
                <Select
                  value={form.status}
                  onValueChange={(value: 'coming_soon' | 'published' | 'archived') => 
                    setForm({ ...form, status: value })
                  }
                >
                  <SelectTrigger id="status" className="border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="coming_soon">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-500" />
                        <span>Coming Soon</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="published">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Published</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="archived">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-gray-500" />
                        <span>Archived</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded">
                    <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <Label htmlFor="published_at" className="text-base font-semibold">Publish Date</Label>
                </div>
                <Input
                  id="published_at"
                  type="date"
                  value={form.published_at ? new Date(form.published_at).toISOString().split('T')[0] : ''}
                  onChange={e => setForm({ ...form, published_at: e.target.value || null })}
                  className="border-2"
                />
              </div>
            </div>
            
            {/* Price & Payment Status */}
            <div className="space-y-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 p-5 rounded-xl border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-500 rounded-lg">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <Label className="text-base font-semibold text-green-900 dark:text-green-100">Pricing</Label>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-sm font-medium text-green-800 dark:text-green-200">Price Amount</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-600 dark:text-green-400" />
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={form.price}
                      onChange={e => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                      className="pl-9 border-green-200 dark:border-green-800 bg-white dark:bg-gray-950 font-semibold text-green-700 dark:text-green-300"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-green-800 dark:text-green-200">Access Type</Label>
                  <Select
                    value={form.is_paid ? 'paid' : 'free'}
                    onValueChange={(value) => setForm({ ...form, is_paid: value === 'paid' })}
                  >
                    <SelectTrigger className="border-green-200 dark:border-green-800 bg-white dark:bg-gray-950">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-blue-500" />
                          <span>Free Access</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="paid">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-500" />
                          <span>Paid Access</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            {/* Additional Images */}
            <div className="space-y-3 bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20 p-5 rounded-xl border border-pink-200 dark:border-pink-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-pink-500 rounded-lg">
                  <ImageIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <Label className="text-base font-semibold text-pink-900 dark:text-pink-100">Gallery Images</Label>
                  <p className="text-xs text-pink-700 dark:text-pink-300 mt-0.5">Additional images for the magazine (optional)</p>
                </div>
              </div>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleAdditionalImagesChange}
                className="border-pink-200 dark:border-pink-800 bg-white dark:bg-gray-950"
              />
              {additionalImagePreviews.length > 0 && (
                <div className="grid grid-cols-4 gap-3 mt-3">
                  {additionalImagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={preview} 
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border-2 border-pink-200 dark:border-pink-700 shadow-sm"
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        onClick={() => removeAdditionalImage(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {isUploading && (
              <div className="space-y-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-5 rounded-xl border-2 border-blue-300 dark:border-blue-700">
                <div className="flex justify-between items-center text-sm font-medium">
                  <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Uploading files...</span>
                  </div>
                  <span className="text-blue-600 dark:text-blue-400 font-bold">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-blue-100 dark:bg-blue-900/30 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-300 shadow-sm"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isUploading} size="lg">
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isUploading || !form.title} size="lg" className="min-w-[160px]">
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : editingMagazine ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Update Magazine
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Magazine
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* View Magazine Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar">
          <DialogHeader>
            <DialogTitle>{viewingMagazine?.title}</DialogTitle>
            <DialogDescription>Magazine details and information</DialogDescription>
          </DialogHeader>
          
          {viewingMagazine && (
            <div className="space-y-6">
              {/* PDF Download */}
              {viewingMagazine.pdf_url && (
                <div className="bg-gradient-to-r from-green-600/10 to-emerald-500/10 p-4 rounded-lg border-2 border-green-600/30">
                  <Button variant="default" size="lg" className="w-full bg-green-600 hover:bg-green-700" asChild>
                    <a href={viewingMagazine.pdf_url} target="_blank" rel="noopener noreferrer">
                      <Download className="mr-2 h-5 w-5" />
                      Download Magazine PDF
                    </a>
                  </Button>
                </div>
              )}
              
              {/* Cover Image */}
              {viewingMagazine.cover_image_url && (
                <div className="w-full h-64 rounded-lg overflow-hidden">
                  <img 
                    src={viewingMagazine.cover_image_url} 
                    alt={viewingMagazine.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              {/* Details */}
              <div className="grid gap-4">
                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <p className="mt-1">{viewingMagazine.description || 'No description available'}</p>
                </div>
                
                {viewingMagazine.authors && viewingMagazine.authors.length > 0 && (
                  <div>
                    <Label className="text-muted-foreground">Authors</Label>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {viewingMagazine.authors.map((author, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          <UsersIcon className="h-3 w-3" />
                          {author}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <div className="mt-1">
                      <Badge variant={getStatusBadgeVariant(viewingMagazine.status)}>
                        {getStatusLabel(viewingMagazine.status)}
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-muted-foreground">Price</Label>
                    <p className="mt-1 font-semibold text-green-600">
                      {viewingMagazine.is_paid ? `$${viewingMagazine.price}` : 'Free'}
                    </p>
                  </div>
                </div>
                
                {viewingMagazine.published_at && (
                  <div>
                    <Label className="text-muted-foreground">Published Date</Label>
                    <p className="mt-1">{new Date(viewingMagazine.published_at).toLocaleDateString()}</p>
                  </div>
                )}
                
                {/* Additional Images */}
                {viewingMagazine.images && viewingMagazine.images.length > 0 && (
                  <div>
                    <Label className="text-muted-foreground">Gallery ({viewingMagazine.images.length})</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {viewingMagazine.images.map((image, index) => (
                        <img 
                          key={index}
                          src={image} 
                          alt={`Gallery ${index + 1}`}
                          className="w-full h-32 object-cover rounded border"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setIsViewDialogOpen(false);
              if (viewingMagazine) handleEdit(viewingMagazine);
            }}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Magazine
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Grant/Edit Access Dialog */}
      <Dialog open={isAccessDialogOpen} onOpenChange={setIsAccessDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAccess ? 'Edit Access' : 'Grant Magazine Access'}</DialogTitle>
            <DialogDescription>
              {editingAccess ? 'Modify magazine access permissions' : 'Grant magazine access to a user'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* User Selection */}
            <div className="space-y-2">
              <Label htmlFor="user">User *</Label>
              <Select
                value={accessForm.user_id}
                onValueChange={(value) => setAccessForm({ ...accessForm, user_id: value })}
                disabled={!!editingAccess}
              >
                <SelectTrigger id="user">
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {magazines.map(magazine => {
                    // Find creator's name from users list
                    const creator = users.find(u => u.id === magazine.created_by);
                    return (
                      <Card key={magazine.id} className="relative group border-2 border-primary/10 hover:border-primary/40 transition-all duration-300 shadow-md hover:shadow-lg bg-gradient-to-br from-white via-blue-50 to-purple-50 dark:from-background dark:via-primary/10 dark:to-purple-900">
                        <div className="p-4 flex flex-col gap-2">
                          <div className="flex items-center gap-2 justify-between">
                            <h3 className="font-bold text-lg line-clamp-2 group-hover:text-primary transition-colors">{magazine.title}</h3>
                            <Badge variant="outline" className="text-xs px-2 py-1">
                              {magazine.status.charAt(0).toUpperCase() + magazine.status.slice(1)}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-2 items-center text-xs text-muted-foreground">
                            {magazine.authors && magazine.authors.length > 0 && (
                              <span className="bg-primary/10 px-2 py-1 rounded-full font-semibold">{magazine.authors.join(', ')}</span>
                            )}
                            {magazine.published_at && (
                              <span className="bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-full">
                                {new Date(magazine.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            )}
                            {magazine.is_paid && (
                              <span className="bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded-full font-semibold">
                                {magazine.price ? magazine.price.toLocaleString('en-DZ', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 }) : 'DZD'}
                              </span>
                            )}
                          </div>
                          {magazine.cover_image_url && (
                            <img src={magazine.cover_image_url} alt={magazine.title} className="w-full h-40 object-cover rounded-lg border border-primary/10 mt-2" />
                          )}
                          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed mt-2">{magazine.description || 'No description available.'}</p>
                          {/* Created By (non-editable, show name if available) */}
                          {magazine.created_by && (
                            <div className="text-xs text-right text-primary/80 mt-2">
                              Created by: <span className="font-semibold">{creator ? creator.full_name : magazine.created_by}</span>
                            </div>
                          )}
                          <div className="flex gap-2 mt-4">
                            <Button size="sm" variant="outline" onClick={() => handleView(magazine)}>
                              View
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleEdit(magazine)}>
                              Edit
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDelete(magazine)}>
                              Delete
                            </Button>
                            {magazine.images && magazine.images.length > 0 && (
                              <Button size="sm" variant="secondary" onClick={() => { setGalleryImages(magazine.images); setGalleryTitle(magazine.title); setGalleryOpen(true); }}>
                                View Gallery
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            {/* Expiration Date */}
            <div className="space-y-2">
              <Label htmlFor="expires_at">Expiration Date (Optional)</Label>
              <Input
                id="expires_at"
                type="datetime-local"
                value={accessForm.expires_at || ''}
                onChange={(e) => setAccessForm({ ...accessForm, expires_at: e.target.value || null })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAccessDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveAccess}
              disabled={!accessForm.user_id || !accessForm.magazine_id}
            >
              {editingAccess ? 'Update Access' : 'Grant Access'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Grant/Edit Access Dialog */}
      <Dialog open={isAccessDialogOpen} onOpenChange={setIsAccessDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAccess ? 'Edit Access' : 'Grant Magazine Access'}</DialogTitle>
            <DialogDescription>
              {editingAccess ? 'Modify magazine access permissions' : 'Grant magazine access to a user'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* User Selection */}
            <div className="space-y-2">
              <Label htmlFor="user">User *</Label>
              <Select
                value={accessForm.user_id}
                onValueChange={(value) => setAccessForm({ ...accessForm, user_id: value })}
                disabled={!!editingAccess}
              >
                <SelectTrigger id="user">
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Magazine Selection */}
            <div className="space-y-2">
              <Label htmlFor="magazine">Magazine *</Label>
              <Select
                value={accessForm.magazine_id}
                onValueChange={(value) => setAccessForm({ ...accessForm, magazine_id: value })}
                disabled={!!editingAccess}
              >
                <SelectTrigger id="magazine">
                  <SelectValue placeholder="Select magazine" />
                </SelectTrigger>
                <SelectContent>
                  {magazines.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Access Type */}
            <div className="space-y-2">
              <Label htmlFor="access_type">Access Type</Label>
              <Select
                value={accessForm.access_type}
                onValueChange={(value) => setAccessForm({ ...accessForm, access_type: value })}
              >
                <SelectTrigger id="access_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Access</SelectItem>
                  <SelectItem value="read">Read Only</SelectItem>
                  <SelectItem value="limited">Limited</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Expiration Date */}
            <div className="space-y-2">
              <Label htmlFor="expires_at">Expiration Date (Optional)</Label>
              <Input
                id="expires_at"
                type="datetime-local"
                value={accessForm.expires_at || ''}
                onChange={(e) => setAccessForm({ ...accessForm, expires_at: e.target.value || null })}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAccessDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveAccess}
              disabled={!accessForm.user_id || !accessForm.magazine_id}
            >
              {editingAccess ? 'Update Access' : 'Grant Access'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Gallery Dialog */}
      <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gallery - {galleryTitle}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-wrap gap-4 justify-center py-4">
            {galleryImages.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`Gallery ${idx + 1}`}
                className="h-40 w-40 object-cover rounded-xl border border-primary/20 shadow-md bg-white dark:bg-background"
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog open={isUserDetailsDialogOpen} onOpenChange={setIsUserDetailsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-muted-foreground">Full Name</Label>
              <p className="text-base font-medium">{selectedUserForDetails?.full_name || 'N/A'}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-muted-foreground">Email</Label>
              <p className="text-base font-medium">{selectedUserForDetails?.account?.email || 'N/A'}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-muted-foreground">User ID</Label>
              <p className="text-xs text-muted-foreground font-mono">{selectedUserForDetails?.id || 'N/A'}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUserDetailsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MagazineAdmin;

import React, { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Card, CardContent, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { BookOpen, Download, Eye, Search, Lock, CheckCircle, Clock, Users, Calendar, DollarSign, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type Magazine = {
  id: string;
  title: string;
  description?: string;
  cover_image_url?: string;
  pdf_url?: string;
  authors?: string[];
  images?: any;
  price?: number;
  is_paid?: boolean;
  status?: string;
  published_at?: string | null;
};

type MagazineAccess = {
  id: string;
  user_id: string;
  magazine_id: string;
  access_type: string;
  expires_at?: string | null;
};

type MagazineRequest = {
  id: string;
  user_id: string;
  magazine_id: string;
  status: 'pending' | 'approved' | 'rejected';
  message?: string | null;
};

const Magazines: React.FC = () => {
  const { user, userProfile } = useAuth();
  const [magazines, setMagazines] = useState<Magazine[]>([]);
  const [userAccess, setUserAccess] = useState<Set<string>>(new Set());
  const [userRequests, setUserRequests] = useState<Map<string, MagazineRequest>>(new Map());
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedMagazine, setSelectedMagazine] = useState<Magazine | null>(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryTitle, setGalleryTitle] = useState<string>('');

  useEffect(() => {
    loadMagazines();
    if (userProfile?.id) {
      loadUserAccess();
      loadUserRequests();
    }
  }, [userProfile]);

  const loadMagazines = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('magazines')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false });
      if (error) throw error;
      setMagazines((data || []) as Magazine[]);
    } catch (err) {
      console.error('Failed to load magazines', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUserAccess = async () => {
    if (!userProfile?.id) return;
    try {
      const { data, error } = await supabase
        .from('magazine_access')
        .select('magazine_id')
        .eq('user_id', userProfile.id);
      if (error) throw error;
      const accessSet = new Set((data || []).map((a: any) => a.magazine_id));
      setUserAccess(accessSet);
    } catch (err) {
      console.error('Failed to load user access', err);
    }
  };

  const loadUserRequests = async () => {
    if (!userProfile?.id) return;
    try {
      const { data, error } = await supabase
        .from('magazine_requests')
        .select('*')
        .eq('user_id', userProfile.id);
      if (error) throw error;
      const requestsMap = new Map((data || []).map((r: MagazineRequest) => [r.magazine_id, r]));
      setUserRequests(requestsMap);
    } catch (err) {
      console.error('Failed to load user requests', err);
    }
  };

  const handleRequestAccess = async () => {
    if (!userProfile?.id || !selectedMagazine) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('magazine_requests')
        .insert([{
          user_id: userProfile.id,
          magazine_id: selectedMagazine.id,
          status: 'pending',
          message: requestMessage || null
        }]);
      
      if (error) throw error;
      
      await loadUserRequests();
      setIsRequestDialogOpen(false);
      setRequestMessage('');
      setSelectedMagazine(null);
    } catch (err) {
      console.error('Failed to request access', err);
      alert('Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openRequestDialog = (magazine: Magazine) => {
    setSelectedMagazine(magazine);
    setRequestMessage('');
    setIsRequestDialogOpen(true);
  };

  // Generate watermarked PDF download URL
  const getWatermarkedDownloadUrl = (magazineId: string) => {
    if (!userProfile?.id) return '#';
    const baseUrl = import.meta.env.VITE_PDF_WATERMARK_SERVER_URL || 'http://localhost:3002';
    return `${baseUrl}/download-pdf/${magazineId}?userId=${userProfile.id}`;
  };

  // Handle secure PDF download with watermarking
  const handleSecureDownload = (magazineId: string, magazineTitle: string) => {
    if (!userProfile?.id) {
      alert('Please sign in to download magazines');
      return;
    }

    const downloadUrl = getWatermarkedDownloadUrl(magazineId);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${magazineTitle.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = magazines.filter((m) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      m.title.toLowerCase().includes(q) ||
      (m.authors || []).some((a) => a.toLowerCase().includes(q)) ||
      (m.description || '').toLowerCase().includes(q)
    );
  });

  const getAccessStatus = (magazineId: string) => {
    if (userAccess.has(magazineId)) return 'granted';
    const request = userRequests.get(magazineId);
    if (request) return request.status;
    return null;
  };

  return (

    <div className="min-h-screen">
      <Header />
      <section className="pt-24 pb-8 bg-gradient-to-b from-primary/5 via-purple-500/5 to-transparent">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4">
            <div className="inline-block">
              <div className="flex items-center gap-3 bg-gradient-to-r from-primary/10 to-purple-500/10 px-6 py-3 rounded-full border border-primary/20">
                <BookOpen className="h-8 w-8 text-primary" />
                <h1 className="text-4xl md:text-5xl font-orbitron font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  Magazines
                </h1>
              </div>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Explore our collection of research, interviews, and insights. {userProfile ? 'Request access to premium content!' : 'Sign in to request access to premium magazines.'}
            </p>
            {userProfile && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800 px-4 py-2 rounded-full max-w-lg mx-auto">
                <Shield className="h-4 w-4 text-green-600" />
                <span>All downloads are personalized and protected with your information</span>
              </div>
            )}
          </div>
          <div className="mt-8 flex items-center justify-center">
            <div className="w-full max-w-2xl">
              <div className="relative">
                <Input
                  placeholder="Search by title, author or description..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-12 h-14 text-lg border-2 focus:border-primary rounded-xl"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
              </div>
            </div>
          </div>
          {!userProfile && (
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                💡 Sign in to request access to paid magazines and download your collection
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {loading && (
              <div className="col-span-full text-center py-20 text-muted-foreground">
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
                  <p>Loading magazines...</p>
                </div>
              </div>
            )}
            {!loading && filtered.length === 0 && (
              <div className="col-span-full text-center py-20">
                <BookOpen className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground text-lg">No magazines found.</p>
                {query && <p className="text-sm text-muted-foreground mt-2">Try a different search term.</p>}
              </div>
            )}
            {!loading && filtered.map((mag) => {
              const accessStatus = getAccessStatus(mag.id);
              const hasAccess = accessStatus === 'granted' || !mag.is_paid;
              const isPending = accessStatus === 'pending';
              const isRejected = accessStatus === 'rejected';

              return (
                <Card key={mag.id} className="group relative overflow-hidden border-2 border-primary/30 hover:border-primary/70 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-1 bg-gradient-to-br from-white via-blue-50 to-purple-50 dark:from-background dark:via-primary/10 dark:to-purple-900">
                  {/* Status Badge */}
                  <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
                    {mag.is_paid && (
                      <Badge variant="default" className="bg-gradient-to-r from-orange-400 to-yellow-500 text-white shadow-lg">
                        <DollarSign className="h-3 w-3 mr-1" />
                        {mag.price ? mag.price.toLocaleString('en-DZ', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 }) : 'DZD'}
                      </Badge>
                    )}
                    {!mag.is_paid && (
                      <Badge variant="default" className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg">
                        FREE
                        {mag.price ? mag.price.toLocaleString('en-DZ', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 }) : 'DZD'}
                      </Badge>
                    )}
                    {hasAccess && mag.is_paid && (
                      <Badge variant="default" className="bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-lg">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Access
                      </Badge>
                    )}
                    {isPending && (
                      <Badge variant="default" className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg animate-pulse">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                    {isRejected && (
                      <Badge variant="destructive" className="shadow-lg">
                        Rejected
                      </Badge>
                    )}
                  </div>

                  <CardContent className="p-0">
                    {/* Cover Image */}
                    <div className="relative w-full h-56 bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 overflow-hidden">
                      {mag.cover_image_url ? (
                        <img 
                          src={mag.cover_image_url} 
                          alt={mag.title} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="w-20 h-20 text-primary/30 group-hover:text-primary/50 transition-colors" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>

                    {/* View More Button for Gallery */}
                    {mag.images && mag.images.length > 0 && (
                      <div className="flex gap-2 px-5 pt-3 pb-1 items-center">
                        <div className="flex gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent">
                          {mag.images.slice(0, 3).map((img: string, idx: number) => (
                            <img
                              key={idx}
                              src={img}
                              alt={`Gallery ${idx + 1}`}
                              className="h-14 w-14 object-cover rounded-lg border border-primary/20 shadow-sm hover:scale-105 transition-transform duration-200 bg-white dark:bg-background"
                            />
                          ))}
                        </div>
                        <Button size="sm" variant="outline" className="ml-2" onClick={() => { setGalleryImages(mag.images); setGalleryTitle(mag.title); setGalleryOpen(true); }}>
                          View More
                        </Button>
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-5 space-y-3">
                      <h3 className="font-bold text-xl line-clamp-2 group-hover:text-primary transition-colors">
                        {mag.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                        {mag.description || 'No description available.'}
                      </p>

                      {/* Metadata - Authors and Published */}
                      <div className="flex flex-wrap gap-3 pt-2 items-center">
                        {mag.authors && mag.authors.length > 0 && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-primary/10 px-2 py-1 rounded-full">
                            <Users className="h-3.5 w-3.5 text-primary" />
                            <span className="line-clamp-1 font-semibold">{mag.authors.join(', ')}</span>
                          </div>
                        )}
                        {mag.published_at && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-full">
                            <Calendar className="h-3.5 w-3.5 text-primary" />
                            <span>{new Date(mag.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="p-5 pt-0 flex gap-2">
                    {hasAccess && mag.pdf_url && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 group/btn"
                          onClick={() => window.open(getWatermarkedDownloadUrl(mag.id), '_blank')}
                        >
                          <Eye className="w-4 h-4 mr-2 group-hover/btn:scale-110 transition-transform" />
                          View PDF
                        </Button>
                        <Button 
                          size="sm" 
                          className="flex-1 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 group/btn"
                          onClick={() => handleSecureDownload(mag.id, mag.title)}
                        >
                          <div className="flex items-center">
                            <Shield className="w-3 h-3 mr-1 opacity-80" />
                            <Download className="w-4 h-4 mr-2 group-hover/btn:animate-bounce" />
                            Download
                          </div>
                        </Button>
                      </>
                    )}
                    {/* Request/Sign in/Status Buttons remain unchanged, but in English */}
                    {!hasAccess && !isPending && !isRejected && mag.is_paid && userProfile && (
                      <Button 
                        size="sm" 
                        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                        onClick={() => openRequestDialog(mag)}
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        Request Access
                      </Button>
                    )}

                    {!hasAccess && !isPending && !isRejected && mag.is_paid && !userProfile && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="w-full"
                        onClick={() => window.location.href = '/login'}
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        Sign in to Access
                      </Button>
                    )}

                    {isPending && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="w-full"
                        disabled
                      >
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Request Pending
                      </Button>
                    )}

                    {isRejected && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="w-full"
                        onClick={() => openRequestDialog(mag)}
                      >
                        Request Again
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

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

      {/* Request Access Dialog */}
      <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Request Magazine Access
            </DialogTitle>
            <DialogDescription>
              Submit a request to access "{selectedMagazine?.title}". Your request will be reviewed by an administrator.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Optional Message</label>
              <Textarea
                placeholder="Why would you like access to this magazine? (optional)"
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsRequestDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRequestAccess}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-primary to-purple-600"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Submit Request
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Magazines;

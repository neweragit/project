import React, { useState, useEffect, useRef } from 'react';
import { Calendar, MapPin, Clock, User, Ticket, Star, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/supabase';
import QRCode from 'react-qr-code';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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
}

interface EventCardProps {
  event: Event;
}

function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const [isFutureEvent, setIsFutureEvent] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const difference = target - now;

      if (difference > 0) {
        setIsFutureEvent(true);
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      } else {
        setIsFutureEvent(false);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!isFutureEvent) {
    return (
      <div className="py-4 border-t border-border/50">
<p className="text-sm font-bold text-red-500 text-center">Event has passed</p>
      </div>
    );
  }

  return (
    <div className="py-4 border-t border-border/50">
      <div className="flex items-center justify-center mb-3">
        <Star className="w-4 h-4 text-primary mr-2 animate-pulse" />
        <p className="text-sm text-primary font-medium">Countdown to Event</p>
        <Star className="w-4 h-4 text-primary ml-2 animate-pulse" />
      </div>
      <div className="flex justify-center space-x-2 text-center">
        {Object.entries(timeLeft).map(([unit, value]) => (
          <div key={unit} className="flex flex-col">
            <div className="text-xl font-orbitron font-bold text-primary bg-gradient-cosmic text-white rounded-lg px-2 py-1 min-w-[2.5rem] shadow-lg">
              {value.toString().padStart(2, '0')}
            </div>
            <div className="text-xs text-muted-foreground capitalize mt-1">
              {unit}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EventCard({ event }: EventCardProps) {
  const { user, userProfile } = useAuth();
  const [hasTicket, setHasTicket] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [attendees, setAttendees] = useState(event.attendees);
  const [showTicketDialog, setShowTicketDialog] = useState(false);
  const [ticketOrder, setTicketOrder] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    async function checkTicket() {
      if (userProfile) {
        const { hasTicket } = await auth.userHasTicket(event.id, userProfile.id);
        if (mounted) setHasTicket(hasTicket);
      }
    }
    checkTicket();
    return () => { mounted = false; };
  }, [userProfile, event.id]);

  useEffect(() => {
    async function fetchOrder() {
      if (hasTicket && userProfile) {
        const { data } = await auth.getTicketsForEvent(event.id);
        if (data) {
          const idx = data.findIndex((t: any) => t.user_id === userProfile.id);
          setTicketOrder(idx >= 0 ? idx + 1 : null);
        }
      }
    }
    fetchOrder();
  }, [hasTicket, userProfile, event.id]);

  const handleTakeTicket = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    if (!userProfile) {
      setError('You must be logged in to take a ticket.');
      setIsLoading(false);
      return;
    }
    const { error } = await auth.takeTicket(event.id, userProfile.id);
    if (error) {
      setError(error.message || 'Failed to take ticket.');
    } else {
      setSuccess('Ticket taken!');
      setHasTicket(true);
      setAttendees(a => a + 1);
    }
    setIsLoading(false);
  };

  const isSoldOut = event.max_attendees !== null && attendees >= event.max_attendees;

  const ticketRef = React.useRef<HTMLDivElement>(null);
  const handleDownloadTicket = async () => {
    if (ticketRef.current) {
      try {
        // Capture the actual ticket dialog content for exact style match
        const canvas = await html2canvas(ticketRef.current, { 
          backgroundColor: '#ffffff',
          scale: 2, // Higher scale for better quality
          useCORS: true,
          allowTaint: true,
          width: ticketRef.current.offsetWidth,
          height: ticketRef.current.offsetHeight,
          scrollX: 0,
          scrollY: 0
        });
        
        // Create PDF in landscape orientation
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape orientation
        
        // Calculate dimensions to fit the ticket properly
        const pageWidth = 297; // A4 landscape width in mm
        const pageHeight = 210; // A4 landscape height in mm
        const imgWidth = pageWidth - 20; // Leave 10mm margin on each side
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        // Center the image on the page
        const x = 10; // 10mm margin from left
        const y = (pageHeight - imgHeight) / 2; // Center vertically
        
        pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
        
        // Download PDF
        pdf.save(`ticket-${event.id}.pdf`);
      } catch (error) {
        console.error('Error generating PDF:', error);
        // Fallback to PNG if PDF fails
        const canvas = await html2canvas(ticketRef.current, { 
          backgroundColor: '#ffffff',
          scale: 1,
          useCORS: true,
          allowTaint: true
        });
        const link = document.createElement('a');
        link.download = `ticket-${event.id}.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
      }
    }
  };

  return (
    <div className="card-cosmic group">
      {/* Event Image */}
      <div className="relative overflow-hidden rounded-lg mb-4">
        <div 
          className="h-48 bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
          style={{ backgroundImage: `url(${event.image_url})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        {/* Attendee Count */}
        <div className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm rounded-full px-3 py-1 text-sm flex items-center space-x-1">
          <Users className="w-4 h-4" />
          <span>{attendees}/{event.max_attendees || '∞'}</span>
        </div>
      </div>
      {/* Event Info */}
      <div className="space-y-4">
        <h3 className="text-xl font-orbitron font-bold group-hover:text-primary transition-colors">
          {event.title}
        </h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>{new Date(event.date).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4" />
            <span>{event.location || 'Location TBD'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>{event.time ? event.time : new Date(event.date).toLocaleTimeString()}</span>
          </div>
        </div>
        {/* Countdown */}
        <CountdownTimer targetDate={event.date} />
        {/* Ticket Button */}
        <div className="pt-2">
          {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
          {success && <div className="text-green-500 text-sm mb-2">{success}</div>}
          {isSoldOut ? (
            <Button className="w-full" variant="destructive" disabled>Sold Out</Button>
          ) : hasTicket ? (
            <Button className="w-full bg-green-600 text-white hover:bg-green-700 border-green-700" variant="default" onClick={() => setShowTicketDialog(true)}>
              View Ticket
            </Button>
          ) : userProfile ? (
            <Button className="w-full btn-cosmic" onClick={handleTakeTicket} disabled={isLoading || isSoldOut}>
              {isLoading ? 'Processing...' : 'Take Ticket'}
            </Button>
          ) : (
            <Button className="w-full btn-cosmic" onClick={() => window.location.href = '/login'}>
              Login to Take Ticket
            </Button>
          )}
        </div>
        {/* Details Button */}
        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-full btn-cosmic mt-2">
              View Details
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-orbitron">{event.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div 
                className="h-32 bg-cover bg-center rounded-lg"
                style={{ backgroundImage: `url(${event.image_url})` }}
              />
              <p className="text-muted-foreground">
                {event.description || 'No description available.'}
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>{new Date(event.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>{event.time ? event.time : new Date(event.date).toLocaleTimeString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>{event.location || 'Location TBD'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span>{attendees} / {event.max_attendees || '∞'} attendees</span>
                </div>
              </div>
              {/* Ticket Button in Dialog */}
              <div className="pt-2">
                {isSoldOut ? (
                  <Button className="w-full" variant="destructive" disabled>Sold Out</Button>
                ) : hasTicket ? (
                  <Button className="w-full bg-green-600 text-white hover:bg-green-700 border-green-700" variant="default" onClick={() => setShowTicketDialog(true)}>
                    View Ticket
                  </Button>
                ) : userProfile ? (
                  <Button className="w-full btn-cosmic" onClick={handleTakeTicket} disabled={isLoading || isSoldOut}>
                    {isLoading ? 'Processing...' : 'Take Ticket'}
                  </Button>
                ) : (
                  <Button className="w-full btn-cosmic" onClick={() => window.location.href = '/login'}>
                    Login to Take Ticket
              </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Ticket Dialog */}
      <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
        <DialogContent className="max-w-5xl p-0 bg-transparent shadow-none border-none">
          <DialogTitle className="sr-only">Event Ticket - {event.title}</DialogTitle>
          <div className="flex flex-col items-center p-2 sm:p-6">
            <div ref={ticketRef} className="bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-4xl" style={{ minHeight: '400px' }}>
              {/* Header Section */}
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold">NEW ERA</h1>
                    <p className="text-purple-200 text-sm sm:text-base">Event Ticket</p>
                  </div>
                  <Ticket className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
              </div>
              
              {/* Main Content - Boarding Pass Style */}
              <div className="flex flex-col lg:flex-row">
                {/* Left Side - Main Ticket */}
                <div className="flex-1 p-4 sm:p-6">
                  <div className="space-y-4">
                    {/* Event Title */}
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-1">{event.title}</h2>
                      <p className="text-sm text-gray-500 uppercase tracking-wide">Event</p>
                    </div>
                    
                    {/* Event Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-purple-600 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800 text-sm sm:text-base truncate">{new Date(event.date).toLocaleDateString()}</p>
                          <p className="text-sm text-gray-500">Date</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-purple-600 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800 text-sm sm:text-base truncate">{event.time || new Date(event.date).toLocaleTimeString()}</p>
                          <p className="text-sm text-gray-500">Time</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-purple-600 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800 text-sm sm:text-base truncate">{event.location || 'Location TBD'}</p>
                          <p className="text-sm text-gray-500">Location</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-purple-600 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800 text-sm sm:text-base truncate">{userProfile?.full_name}</p>
                          <p className="text-sm text-gray-500">Attendee</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Ticket ID */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Ticket ID</p>
                      <p className="font-mono text-sm text-gray-800">{event.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                  </div>
                </div>
                
                {/* Tear-off Line - Only show on desktop */}
                <div className="relative hidden lg:block">
                  <div className="absolute inset-y-0 left-0 w-0.5 bg-gray-300">
                    {/* Perforation dots - simplified for better performance */}
                    {Array.from({ length: 50 }, (_, i) => (
                      <div 
                        key={i}
                        className="absolute w-2 h-2 bg-white rounded-full -translate-x-1"
                        style={{ top: `${i * 8}px` }}
                      ></div>
                    ))}
                  </div>
                </div>
                
                {/* Right Side - Detachable Part */}
                <div className="w-full lg:w-56 p-4 sm:p-6 bg-gray-50 border-t lg:border-t-0 lg:border-l border-gray-200">
                  <div className="flex flex-col items-center space-y-4">
                    {/* Attendee Number */}
                    <div className="bg-purple-50 rounded-lg p-4 text-center w-full">
                      <p className="text-2xl sm:text-3xl font-bold text-purple-600">{ticketOrder || '—'}</p>
                      <p className="text-sm text-gray-500 uppercase tracking-wide">Attendee Number</p>
                    </div>
                    
                    {/* QR Code */}
                    <div className="bg-white p-3 rounded-lg border-2 border-gray-200">
                      <div className="w-20 h-20 sm:w-30 sm:h-30 flex items-center justify-center">
                        <QRCode 
                          value={`${event.id}-${userProfile?.id}`}
                          size={80}
                          level="H"
                          fgColor="#1f2937"
                          bgColor="#ffffff"
                          className="w-full h-full"
                        />
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Scan to login</p>
                    </div>
                    
                    {/* Attendee Count */}
                    <div className="text-center text-xs text-gray-500">
                      <p>{attendees} / {event.max_attendees || '∞'}</p>
                      <p>Attendees</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Footer */}
              <div className="p-4 sm:p-6 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
                  <div className="text-sm text-gray-500">
                    <p>Generated on {new Date().toLocaleDateString()}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                    <button 
                      onClick={() => setShowTicketDialog(false)}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition w-full sm:w-auto"
                    >
                      Close
                    </button>
                    <button 
                      onClick={handleDownloadTicket}
                      className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold w-full sm:w-auto"
                    >
                      Download PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Try both import styles for QRCode
let QRCodeComponent: any = null;
try {
  // @ts-ignore
  QRCodeComponent = require('qrcode.react').default || require('qrcode.react').QRCode;
} catch {}

const TicketQRCode = ({ value }: { value: string }) => {
  if (QRCodeComponent) {
    return <QRCodeComponent value={value} size={64} bgColor="#fff" fgColor="#111" />;
  }
  // Fallback SVG barcode
  return (
    <svg width="64" height="64" viewBox="0 0 64 64"><rect x="8" y="8" width="48" height="48" fill="#fff" stroke="#111" strokeWidth="2"/><text x="50%" y="50%" textAnchor="middle" dy=".3em" fontSize="10" fill="#111">{value.slice(0,6)}</text></svg>
  );
};

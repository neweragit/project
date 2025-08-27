import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { EventCard } from '@/components/EventCard';
import { Calendar, Filter, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/supabase';
import type { Event } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

const Events = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useAuth(); // Ensure context is available

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        const { data, error } = await auth.getEvents();
        if (error) {
          setError('Failed to load events');
          console.error('Error loading events:', error);
        } else {
          // Sort events by date - nearest upcoming events first
          const sortedEvents = (data || []).sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            const now = new Date();
            
            // If both events are in the future, sort by nearest first
            if (dateA >= now && dateB >= now) {
              return dateA.getTime() - dateB.getTime();
            }
            
            // If one is in the past and one is in the future, future events come first
            if (dateA >= now && dateB < now) return -1;
            if (dateA < now && dateB >= now) return 1;
            
            // If both are in the past, sort by most recent first
            return dateB.getTime() - dateA.getTime();
          });
          
          setEvents(sortedEvents);
        }
      } catch (err) {
        setError('Failed to load events');
        console.error('Error loading events:', err);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-24 pb-12 starfield">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4">
            <h1 className="text-5xl md:text-6xl font-orbitron font-bold text-glow">
              Cosmic Events
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Join our community of scientists, researchers, and space enthusiasts 
              at groundbreaking events that shape the future of human knowledge.
            </p>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="py-8 border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Calendar className="w-5 h-5" />
              <span className="font-medium">
                {loading ? 'Loading...' : `${events.length} Upcoming Events`}
              </span>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                All Categories
              </Button>
              <Button variant="outline" size="sm">
                This Month
              </Button>
              <Button variant="outline" size="sm">
                Virtual Events
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Loading events...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{error}</p>
              <Button 
                onClick={() => window.location.reload()} 
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No events found.</p>
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event, index) => (
              <div
                key={event.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <EventCard event={event} />
              </div>
            ))}
          </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Events;
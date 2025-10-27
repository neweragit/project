import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { HeroSection } from '@/components/HeroSection';
import { StatisticsSection } from '@/components/StatisticsSection';
import { EventCard } from '@/components/EventCard';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/supabase';
import { ArrowRight, Rocket, Atom, Globe, Clock, User } from 'lucide-react';
import type { Event } from '@/lib/supabase';

const Index = () => {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  
  // Load events from database
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const { data, error } = await auth.getEvents();
        if (!error && data) {
          // Sort events by date - nearest upcoming events first
          const sortedEvents = data.sort((a, b) => {
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
          
          setFeaturedEvents(sortedEvents);
        }
      } catch (error) {
        console.error('Error loading events:', error);
      } finally {
        setLoadingEvents(false);
      }
    };

    loadEvents();
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Personalized Greeting for Logged-in Users */}
        {user && userProfile && (
          <section className="mt-16 md:mt-24 py-4 md:py-8 px-4 bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-border/50">
            <div className="container mx-auto max-w-6xl">
              <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 p-3 md:p-4 bg-card/50 rounded-lg border border-border/30">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-cosmic rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div className="text-center sm:text-left">
                  <h2 className="text-lg md:text-xl font-orbitron font-bold text-glow">
                    Hello, {userProfile.full_name}! 👋
                  </h2>
                  <p className="text-sm md:text-base text-muted-foreground">
                    Welcome back to your cosmic journey • Role: {userProfile.role} • Field: {userProfile.field_of_interest}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}
        
        <HeroSection />

        {/* Features Section */}
        <section className="py-20 relative">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-4xl md:text-5xl font-orbitron font-bold text-glow">
                Leading the Future
              </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
             We are a hub designed to empower members, providing the environment to transform bold concepts into pioneering innovations that will shape the future
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card-cosmic text-center group">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-cosmic rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Rocket className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-orbitron font-bold mb-4">Workshops</h3>
              <p className="text-muted-foreground">
              Organizing workshops for early detection, prevention, and correcting misconceptions
              </p>
            </div>

            <div className="card-cosmic text-center group">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-nebula rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Atom className="w-10 h-10 text-white" />
              </div>
<h3 className="text-xl font-orbitron font-bold mb-4">Scientific Research</h3>
              <p className="text-muted-foreground">
               Training students in scientific research and how to write it.
              </p>
            </div>

            <div className="card-cosmic text-center group">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-cosmic rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Globe className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-orbitron font-bold mb-4">Global Impact</h3>
              <p className="text-muted-foreground">
                Finding solutions that benefit students through collaborative scientific endeavors.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <StatisticsSection />

      {/* Featured Events Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-orbitron font-bold text-glow">
              Upcoming Events
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join us at our upcoming events and be part of the scientific revolution.
            </p>
          </div>

          {loadingEvents ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading events...</p>
            </div>
          ) : featuredEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {featuredEvents.map((event, index) => (
                <div
                  key={event.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  <EventCard event={event} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No events found.</p>
            </div>
          )}

         <div className="text-center">
  <Button
    className="btn-cosmic text-lg px-8 py-4 h-auto"
    onClick={() => navigate('/events')}
  >
    View All Events
    <ArrowRight className="w-5 h-5 ml-3" />
  </Button>
</div>

        </div>
      </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;

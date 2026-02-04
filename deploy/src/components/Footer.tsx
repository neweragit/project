import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, Youtube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo.png';
import { supabase } from '@/lib/supabase';

export function Footer() {
  const [siteStats, setSiteStats] = useState<{ contact_email?: string; contact_phone?: string } | null>(null);
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase.from('site_stats').select('contact_email, contact_phone').limit(1).single();
        if (!error && data) setSiteStats(data as any);
      } catch (e) {}
    };
    load();
  }, []);

  return (
    <footer className="bg-card/50 backdrop-blur-md border-t border-border/50 mt-20 relative z-10">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <img src={logo} alt="New Era Club" className="h-10 w-10" />
              <span className="text-xl font-orbitron font-bold text-glow">New Era Club</span>
            </div>
            <p className="text-muted-foreground max-w-md">
              Leading humanity into the new era of scientific discovery and cosmic exploration.
            </p>
            {/* Social Media Icons */}
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 bg-gradient-cosmic rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300">
                <Facebook className="w-5 h-5 text-white" />
              </a>
              <a href="#" className="w-10 h-10 bg-gradient-nebula rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300">
                <Twitter className="w-5 h-5 text-white" />
              </a>
              <a href="#" className="w-10 h-10 bg-gradient-cosmic rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300">
                <Instagram className="w-5 h-5 text-white" />
              </a>
              <a href="#" className="w-10 h-10 bg-gradient-nebula rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300">
                <Linkedin className="w-5 h-5 text-white" />
              </a>
              <a href="#" className="w-10 h-10 bg-gradient-cosmic rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300">
                <Youtube className="w-5 h-5 text-white" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-orbitron font-semibold">Quick Links</h3>
            <nav className="flex flex-col space-y-2">
              <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">
                Home
              </Link>
              <Link to="/events" className="text-muted-foreground hover:text-primary transition-colors">
                Events
              </Link>
              <Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors">
                Contact
              </Link>
              <Link to="/about" className="text-muted-foreground hover:text-primary transition-colors">
                About
              </Link>
            </nav>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-orbitron font-semibold">Contact</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-cosmic rounded-full flex items-center justify-center">
                  <Mail className="w-4 h-4 text-white" />
                </div>
                <span className="text-muted-foreground text-sm">
                  <a className="hover:underline" href={`mailto:${siteStats?.contact_email ?? 'ali2003fac@gmail.com'}`}>{siteStats?.contact_email ?? 'ali2003fac@gmail.com'}</a>
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-nebula rounded-full flex items-center justify-center">
                  <Phone className="w-4 h-4 text-white" />
                </div>
                <span className="text-muted-foreground text-sm">
                  <a className="hover:underline" href={`tel:${siteStats?.contact_phone ?? '+213669028650'}`}>{siteStats?.contact_phone ?? '+213669028650'}</a>
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-cosmic rounded-full flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <span className="text-muted-foreground text-sm">CERN Campus, Geneva</span>
              </div>
            </div>
          </div>

          {/* Back to Top */}
          <div className="space-y-4">
            <h3 className="text-lg font-orbitron font-semibold">Navigate</h3>
            <Button
              onClick={scrollToTop}
              className="btn-cosmic w-fit"
            >
              <ArrowUp className="w-4 h-4 mr-2" />
              Back to Top
            </Button>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-border/50 text-center">
          <p className="text-muted-foreground">
            © 2024 New Era Club - NEW ERA. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
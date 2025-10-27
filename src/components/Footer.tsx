import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, Youtube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo.png';

export function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-card/50 backdrop-blur-md border-t border-border/50 mt-20 relative z-10">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Logo and Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <img src={logo} alt="RVLTI" className="h-10 w-10" />
              <span className="text-xl font-orbitron font-bold text-glow">RVLTI</span>
            </div>
            <p className="text-muted-foreground max-w-md">
              Leading humanity into the new era of scientific discovery and cosmic exploration.
            </p>

            {/* Social Media Icons */}
            <div className="flex space-x-3">
              {[Facebook, Twitter, Instagram, Linkedin, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-10 h-10 bg-gradient-cosmic rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300"
                >
                  <Icon className="w-5 h-5 text-white" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-orbitron font-semibold">Quick Links</h3>
            <nav className="flex flex-col space-y-2">
              <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">Home</Link>
              <Link to="/events" className="text-muted-foreground hover:text-primary transition-colors">Events</Link>
              <Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors">Contact</Link>
              <Link to="/about" className="text-muted-foreground hover:text-primary transition-colors">About</Link>
            </nav>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-orbitron font-semibold">Contact</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-cosmic rounded-full flex items-center justify-center">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <span className="text-muted-foreground text-sm">ali2003fac@gmail.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-cosmic rounded-full flex items-center justify-center">
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <span className="text-muted-foreground text-sm">+213669028650</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-cosmic rounded-full flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <span className="text-muted-foreground text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                  Kasdi Merbah University, Central Campus, Faculty of Medicine, Ouargla, Algeria
                </span>
              </div>
            </div>
          </div>

          {/* Back to Top */}
          <div className="space-y-4">
            <h3 className="text-lg font-orbitron font-semibold">Navigate</h3>
            <Button onClick={scrollToTop} className="btn-cosmic w-fit flex items-center gap-2">
              <ArrowUp className="w-5 h-5" />
              Back to Top
            </Button>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-border/50 text-center">
          <p className="text-muted-foreground">
            © 2025 RVLTI - NEW ERA. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

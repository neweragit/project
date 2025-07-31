import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail, Phone, MapPin, Send, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/supabase';

const Contact = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data, error } = await auth.submitContactMessage({
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        subject: formData.subject,
        message: formData.message
      });

      if (error) {
        throw error;
      }

      // Success toast
      toast({
        title: (
          <span className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircle className="w-5 h-5" />
            Message Sent!
          </span>
        ),
        description: (
          <span className="text-green-700 dark:text-green-300">
            Thank you for contacting us. We'll get back to you soon.
          </span>
        ),
        variant: 'default',
        className: 'border-green-500 bg-green-50 dark:bg-green-950',
      });

      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        subject: '',
        message: ''
      });

    } catch (error) {
      console.error('Contact form error:', error);
      
      // Error toast
      toast({
        title: (
          <span className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <XCircle className="w-5 h-5" />
            Message Failed
          </span>
        ),
        description: (
          <span className="text-red-700 dark:text-red-300">
            Something went wrong. Please try again later.
          </span>
        ),
        variant: 'destructive',
        className: 'border-red-500 bg-red-50 dark:bg-red-950',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-24 pb-12 starfield">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4">
            <h1 className="text-5xl md:text-6xl font-orbitron font-bold text-glow">
              Contact Us
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Ready to join the new era of scientific discovery? 
              Get in touch with our team of experts and researchers.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            
            {/* Contact Form */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl font-orbitron font-bold">Send us a Message</h2>
                <p className="text-muted-foreground">
                  Whether you're interested in our research, want to collaborate, 
                  or have questions about our events, we'd love to hear from you.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input 
                      id="firstName" 
                      placeholder="Enter your first name"
                      className="bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary"
                      required
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input 
                      id="lastName" 
                      placeholder="Enter your last name"
                      className="bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary"
                      required
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email"
                    placeholder="Enter your email address"
                    className="bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary"
                    required
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input 
                    id="subject" 
                    placeholder="What's this about?"
                    className="bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary"
                    required
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea 
                    id="message"
                    placeholder="Tell us more about your inquiry..."
                    className="bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary min-h-[120px]"
                    required
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                  />
                </div>

                <Button type="submit" className="btn-cosmic w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                  <Send className="w-4 h-4 mr-2" />
                  )}
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            </div>

            {/* Contact Information */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl font-orbitron font-bold">Get in Touch</h2>
                <p className="text-muted-foreground">
                  Connect with our research teams and stay updated on the latest discoveries.
                </p>
              </div>

              <div className="space-y-6">
                <div className="card-cosmic">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-cosmic rounded-full flex items-center justify-center flex-shrink-0">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-orbitron font-semibold">Email</h3>
                      <p className="text-muted-foreground">contact@newera-rvlti.org</p>
                      <p className="text-muted-foreground">research@newera-rvlti.org</p>
                    </div>
                  </div>
                </div>

                <div className="card-cosmic">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-nebula rounded-full flex items-center justify-center flex-shrink-0">
                      <Phone className="w-6 h-6 text-white" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-orbitron font-semibold">Phone</h3>
                      <p className="text-muted-foreground">+1 (555) 123-4567</p>
                      <p className="text-muted-foreground">+44 20 7946 0958</p>
                    </div>
                  </div>
                </div>

                <div className="card-cosmic">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-cosmic rounded-full flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-orbitron font-semibold">Headquarters</h3>
                      <p className="text-muted-foreground">
                        CERN Campus<br />
                        Route de Meyrin 385<br />
                        1217 Meyrin, Switzerland
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Map Placeholder */}
              <div className="card-cosmic p-0 overflow-hidden">
                <div className="h-64 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <MapPin className="w-12 h-12 mx-auto text-primary" />
                    <p className="text-muted-foreground">Interactive Map</p>
                    <p className="text-sm text-muted-foreground">
                      Find us at the CERN Campus
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;
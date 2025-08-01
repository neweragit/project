import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Rocket, Users, Telescope, Atom, Globe, Zap, Brain, Star, User } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function About() {
  const values = [
    {
      icon: Rocket,
      title: 'Innovation',
      description: 'Pushing the boundaries of what\'s possible through cutting-edge research and technology.'
    },
    {
      icon: Users,
      title: 'Collaboration',
      description: 'Bringing together brilliant minds from around the world to solve humanity\'s greatest challenges.'
    },
    {
      icon: Telescope,
      title: 'Exploration',
      description: 'Venturing into the unknown to discover new frontiers in space and science.'
    },
    {
      icon: Atom,
      title: 'Scientific Excellence',
      description: 'Maintaining the highest standards of research and scientific methodology.'
    }
  ];

  const missions = [
    {
      icon: Zap,
      title: 'System Innovation',
      description: 'Building modular systems and scalable architectures to empower digital solutions.',
      progress: 90
    },
    {
      icon: Brain,
      title: 'Team Empowerment',
      description: 'Fostering leadership, growth, and collaboration across interdisciplinary teams.',
      progress: 88
    },
    {
      icon: Atom,
      title: 'Product Development',
      description: 'From ideation to deployment, crafting tools that solve real-world problems.',
      progress: 94
    },
    {
      icon: Users,
      title: 'Community Engagement',
      description: 'Connecting with users and contributors to build impactful, inclusive platforms.',
      progress: 81
    }
  ];

  const team = [
    {
      name: 'Sebabkhi Faress Eddine',
      role: 'Lead Developer',
      image: 'https://i.ibb.co/27dg1kZ/image.png'
    },
    {
      name: 'Seguéni Ali',
      role: 'Founder & Manager',
      image: 'https://i.ibb.co/wNFPM8P/ali.png'
    },
    {
      name: 'Abdelkarim Kamassi',
      role: 'Deputy Manager',
      image: 'https://i.ibb.co/GVtq3p1/kamassi.png'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-starfield starfield">
      <Header />
      
      <main className="pt-24">
        {/* Hero Section */}
        <section className="py-20 relative">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-4xl mx-auto animate-slide-in-up">
              <h1 className="text-5xl md:text-7xl font-orbitron font-bold text-glow mb-6">
                Who We Are
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
                NEW ERA is more than a club — it's a sandbox of innovation where curiosity leads the way 
                and every failure is a first draft. We bring together explorers from every field to prototype 
                ideas, question assumptions, and build the future. Whether you're an engineer, artist, or 
                philosopher, this is your playground to think beyond.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/events">
                  <Button className="btn-cosmic text-lg px-8 py-6">
                    <Rocket className="w-5 h-5 mr-2" />
                    Join Our Mission
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button variant="outline" className="text-lg px-8 py-6 border-border/50 hover:bg-primary/10">
                    Contact Us
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Mission Statement */}
        <section className="py-20 relative">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-orbitron font-bold text-glow mb-6">
                  Our Mission
                </h2>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                  To accelerate human progress through groundbreaking research, space exploration, 
                  and the development of technologies that will secure humanity's future among the stars.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {values.map((value, index) => (
                  <div
                    key={value.title}
                    className="animate-fade-in-delayed"
                    style={{ animationDelay: `${index * 0.2}s` }}
                  >
                    <Card className="card-cosmic text-center h-full">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gradient-cosmic rounded-full flex items-center justify-center">
                        <value.icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-orbitron font-bold mb-3 text-primary">
                        {value.title}
                      </h3>
                      <p className="text-muted-foreground">
                        {value.description}
                      </p>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* N.E.W. E.R.A. Values Section */}
        <section className="py-20 relative bg-muted/5">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-orbitron font-bold text-glow mb-6">
                N.E.W. E.R.A. – Where Ideas Rise Beyond Limits
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                We believe excellence grows where curiosity is nurtured and imagination is free. 
                Here's what drives us:
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
       {[
  { letter: 'N', title: 'Nurture', description: 'We nurture talent, ideas, and collaboration — planting the seeds of tomorrow\'s breakthroughs.' },
  { letter: 'E', title: 'Elevate', description: 'We elevate ambitions, turning ordinary efforts into extraordinary outcomes.' },
  { letter: 'W', title: 'Wisdom', description: 'We draw on wisdom from diverse experiences, blending knowledge with imagination to craft pioneering solutions.' },
  { letter: 'E', title: 'Empower', description: 'We empower one another to explore boldly, lead confidently, and innovate fearlessly.' },
  { letter: 'R', title: 'Reimagine', description: 'We reimagine what\'s possible, challenging the status quo to build something greater.' },
  { letter: 'A', title: 'Aspire', description: 'We aspire to reach the peak — not just for ourselves, but to shape a brighter future.' },
              ].map((val, index) => (
                <Card key={val.title} className="card-cosmic text-center animate-fade-in-delayed" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="w-12 h-12 mx-auto mb-4 bg-gradient-cosmic rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {val.letter}
                  </div>
                  <h3 className="text-xl font-orbitron font-bold mb-2 text-primary">
                    {val.title}
                  </h3>
                  <p className="text-muted-foreground">{val.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Current Missions */}
        <section className="py-20 relative">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-orbitron font-bold text-glow mb-6">
                  Current Missions
                </h2>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                  Our ongoing research projects are pushing the boundaries of human knowledge 
                  and capability across multiple scientific disciplines.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {missions.map((mission, index) => (
                  <div
                    key={mission.title}
                    className="animate-fade-in-delayed"
                    style={{ animationDelay: `${index * 0.15}s` }}
                  >
                    <Card className="card-cosmic h-full">
                      <div className="flex items-start space-x-4 mb-4">
                        <div className="w-12 h-12 bg-gradient-cosmic rounded-lg flex items-center justify-center flex-shrink-0">
                          <mission.icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-orbitron font-bold mb-2 text-primary">
                            {mission.title}
                          </h3>
                          <p className="text-muted-foreground mb-4">
                            {mission.description}
                          </p>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium text-primary">{mission.progress}%</span>
                        </div>
                        <div className="w-full bg-muted/30 rounded-full h-2">
                          <div 
                            className="h-full bg-gradient-cosmic rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${mission.progress}%` }}
                          />
                        </div>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Leadership Team */}
        <section className="py-20 relative">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-orbitron font-bold text-glow mb-6">
                  Leadership Team
                </h2>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                  Meet the visionary leaders driving NEW ERA's mission to explore the cosmos 
                  and advance human knowledge.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {team.map((member, index) => (
                  <div
                    key={member.name}
                    className="animate-fade-in-delayed"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <Card className="card-cosmic text-center p-6">
                      <div className="w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden border-2 border-primary/20">
                        <img 
                          src={member.image} 
                          alt={member.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h3 className="text-xl font-orbitron font-bold mb-1 text-primary">
                        {member.name}
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {member.role}
                      </p>
                      <div className="flex justify-center space-x-4">
                        <Button variant="outline" size="sm" className="border-primary/20 hover:bg-primary/10">
                          View Profile
                        </Button>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-20 relative">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Card className="card-cosmic">
                <h2 className="text-3xl md:text-4xl font-orbitron font-bold text-glow mb-6">
                  Ready to Join the NEW ERA?
                </h2>
                <p className="text-xl text-muted-foreground mb-8">
                  Be part of humanity's greatest adventure. Join our community of researchers, 
                  scientists, and visionaries working to secure our future among the stars.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to="/login">
                    <Button className="btn-cosmic text-lg px-8 py-6">
                      <Rocket className="w-5 h-5 mr-2" />
                      Join NEW ERA
                    </Button>
                  </Link>
                  <Link to="/events">
                    <Button variant="outline" className="text-lg px-8 py-6 border-border/50 hover:bg-primary/10">
                      View Events
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-10 w-40 h-40 bg-accent/5 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-3/4 left-1/3 w-24 h-24 bg-primary/5 rounded-full blur-2xl animate-pulse delay-500" />
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

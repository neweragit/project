import React, { useEffect, useState, useRef } from 'react';
import { Users, Calendar, Beaker, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface StatItemProps {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  label: string;
  suffix?: string;
  isVisible: boolean;
}

function StatItem({ icon: Icon, value, label, suffix = '', isVisible }: StatItemProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isVisible) return;

    const duration = 2500; // 2.5 seconds
    const increment = value / (duration / 16); // 60fps
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value, isVisible]);

  return (
    <div className="card-cosmic text-center group cursor-pointer">
      <div className="w-16 h-16 mx-auto mb-4 bg-gradient-cosmic rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
        <Icon className="w-8 h-8 text-white" />
      </div>
      <div className="space-y-2">
        <div className="text-3xl md:text-4xl font-orbitron font-bold text-primary animate-count-up">
          {count.toLocaleString()}{suffix}
        </div>
        <div className="text-muted-foreground font-medium animate-fade-in-delayed">
          {label}
        </div>
      </div>
    </div>
  );
}

export function StatisticsSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const [dbStats, setDbStats] = useState<{ total_members: number; events_hosted: number; research_projects: number; success_rate: string } | null>(null);

  useEffect(() => {
    // load site stats from database
    const loadStats = async () => {
      try {
        const { data, error } = await supabase.from('site_stats').select('total_members, events_hosted, research_projects, success_rate').limit(1).single();
        if (!error && data) setDbStats(data as any);
      } catch (e) {}
    };
    loadStats();

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);
  const stats = [
    {
      icon: Users,
      value: dbStats ? Number(dbStats.total_members || 0) : 0,
      label: 'Total Members',
      suffix: '',
    },
    {
      icon: Calendar,
      value: dbStats ? Number(dbStats.events_hosted || 0) : 0,
      label: 'Events Hosted',
      suffix: '',
    },
    {
      icon: Beaker,
      value: dbStats ? Number(dbStats.research_projects || 0) : 0,
      label: 'Research Projects',
      suffix: '',
    },
    {
      icon: TrendingUp,
      value: dbStats ? parseInt(String(dbStats.success_rate || '0'), 10) : 0,
      label: 'Success Rate',
      suffix: '%',
    },
  ];

  return (
    <section ref={sectionRef} className="py-20 relative">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-orbitron font-bold text-glow">
            Our Impact
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Driving scientific innovation and cosmic exploration through collaborative research and discovery.
          </p>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <StatItem {...stat} isVisible={isVisible} />
            </div>
          ))}
        </div>

        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-10 w-40 h-40 bg-accent/5 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
      </div>
    </section>
  );
}

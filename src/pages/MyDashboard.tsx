import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  User,
  BookOpen,
  Calendar,
  ExternalLink,
  Trophy,
  Clock,
  CheckCircle,
  UserCheck
} from 'lucide-react';

interface EnrolledCourse {
  id: string;
  course_id: string;
  user_id: string;
  status: string;
  progress: number;
  collected_at: string;
  updated_at: string;
  course: {
    id: string;
    title: string;
    description: string | null;
    course_type_id: number | null;
    course_type: string;
    status_id: number | null;
    status: string;
    start_date: string;
    end_date: string | null;
    link: string | null;
    image_url: string | null;
  };
}

export default function MyDashboard() {
  const navigate = useNavigate();
  const { user, userProfile, loading } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
      return;
    }

    if (userProfile) {
      fetchEnrolledCourses();
    }
  }, [user, userProfile, loading, navigate]);

  const fetchEnrolledCourses = async () => {
    if (!userProfile) return;

    try {
      setLoadingCourses(true);
      const { data, error } = await supabase
        .from('course_enrollments')
        .select(`
          *,
          course:courses(
            id,
            title,
            description,
            course_type_id,
            course_type,
            status_id,
            status,
            start_date,
            end_date,
            link,
            image_url
          )
        `)
        .eq('user_id', userProfile.id)
        .order('collected_at', { ascending: false });

      if (error) {
        console.error('Error fetching enrolled courses:', error);
        return;
      }

      setEnrolledCourses(data || []);
    } catch (error) {
      console.error('Error fetching enrolled courses:', error);
    } finally {
      setLoadingCourses(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!user || !userProfile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">My Dashboard</h1>
            <p className="text-gray-300">Welcome back, {userProfile.full_name}!</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Section */}
            <div className="lg:col-span-1">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>Profile Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-300">Full Name</label>
                    <p className="text-white">{userProfile.full_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-300">Email</label>
                    <p className="text-white">{user?.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-300">Field of Interest</label>
                    <p className="text-white">{userProfile.field_of_interest || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-300">Role</label>
                    <Badge variant={userProfile.role === 'Administrator' ? 'default' : 'secondary'}>
                      {userProfile.role}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-300">Member Since</label>
                    <p className="text-white">{new Date(userProfile.created_at).toLocaleDateString()}</p>
                  </div>
                  <Button
                    onClick={() => navigate('/profile')}
                    className="w-full mt-4"
                    variant="outline"
                  >
                    Edit Profile
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Enrolled Courses Section */}
            <div className="lg:col-span-2">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <BookOpen className="w-5 h-5" />
                    <span>My Enrolled Courses ({enrolledCourses.length})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingCourses ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                    </div>
                  ) : enrolledCourses.length === 0 ? (
                    <div className="text-center py-8">
                      <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-300 mb-4">You haven't enrolled in any courses yet.</p>
                      <Button onClick={() => navigate('/courses')} className="btn-cosmic">
                        Browse Courses
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {enrolledCourses.map((enrollment) => (
                        <div
                          key={enrollment.id}
                          className="bg-slate-700/50 rounded-lg p-4 border border-slate-600"
                        >
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-white mb-1">
                                {enrollment.course.title}
                              </h3>
                              <p className="text-gray-300 text-sm mb-2">
                                {enrollment.course.description}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <Badge variant="outline" className="text-xs">
                                  {enrollment.course.course_type}
                                </Badge>
                                <Badge
                                  variant={enrollment.course.status === 'active' ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {enrollment.course.status}
                                </Badge>
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-gray-400">
                                <div className="flex items-center space-x-1">
                                  <Calendar className="w-4 h-4" />
                                  <span>Enrolled: {new Date(enrollment.collected_at).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Trophy className="w-4 h-4" />
                                  <span>Progress: {enrollment.progress}%</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col space-y-2 md:ml-4">
                              {enrollment.course.link && (
                                <Button
                                  size="sm"
                                  className="btn-cosmic"
                                  asChild
                                >
                                  <a
                                    href={enrollment.course.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center space-x-1"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    <span>Start Course</span>
                                  </a>
                                </Button>
                              )}
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                disabled
                              >
                                <UserCheck className="w-3 h-3 mr-1" />
                                <span>Enrolled</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

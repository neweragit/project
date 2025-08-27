import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CourseCard } from '../components/CourseCard';
import { BookOpen, Filter, Loader2, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Course {
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
  field_of_interest_id: number | null;
  created_at: string;
  updated_at: string;
  field_of_interest_options?: { id: number; name: string };
  is_enrolled?: boolean;
}

interface FieldOfInterest {
  id: number;
  name: string;
  display_order: number;
  is_active: boolean;
}

const Courses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [fieldsOfInterest, setFieldsOfInterest] = useState<FieldOfInterest[]>([]);
  const [selectedFields, setSelectedFields] = useState<number[]>([]);
  const [courseFilters, setCourseFilters] = useState({
    status: 'all',
    type: 'all',
    dateType: 'all' // 'all', 'permanent', 'temporary'
  });
  const [courseTypes, setCourseTypes] = useState<{ id: number; name: string; display_name: string }[]>([]);
  const [courseStatuses, setCourseStatuses] = useState<{ id: number; name: string; display_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const { user, userProfile } = useAuth(); // Get user and userProfile from auth context

  const handleEnrollmentChange = (courseId: string, isEnrolled: boolean) => {
    // Update the course enrollment status in both courses and allCourses
    setCourses(prev => prev.map(course =>
      course.id === courseId ? { ...course, is_enrolled: isEnrolled } : course
    ));
    setAllCourses(prev => prev.map(course =>
      course.id === courseId ? { ...course, is_enrolled: isEnrolled } : course
    ));
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Load courses with their field relationships
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select(`
            *,
            field_of_interest_options(name)
          `)
          .order('created_at', { ascending: false });

        if (coursesError) {
          setError('Failed to load courses');
          console.error('Error loading courses:', coursesError);
          return;
        }

        // Load field of interest options
        const { data: fieldsData, error: fieldsError } = await supabase
          .from('field_of_interest_options')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (fieldsError) {
          console.error('Error loading fields of interest:', fieldsError);
        } else {
          setFieldsOfInterest(fieldsData || []);
        }

        // Load user enrollments if user is logged in
        let enrollmentsData: any[] = [];
        if (userProfile) {
          const { data: enrollments, error: enrollmentsError } = await supabase
            .from('course_enrollments')
            .select('course_id')
            .eq('user_id', userProfile.id);

          if (enrollmentsError) {
            console.error('Error loading enrollments:', enrollmentsError);
          } else {
            enrollmentsData = enrollments || [];
          }
        }

        const coursesWithFields = (coursesData || []).map(course => ({
          ...course,
          field_of_interest_options: course.field_of_interest_options,
          is_enrolled: enrollmentsData.some(enrollment => enrollment.course_id === course.id)
        }));

        // Show all courses (active, expired, upcoming, etc.)
        const allCourses = coursesWithFields;

        // Load course types and statuses for filters
        const { data: typesData, error: typesError } = await supabase
          .from('course_types')
          .select('*')
          .order('created_at', { ascending: true });

        if (typesError) {
          console.error('Error loading course types:', typesError);
        } else {
          setCourseTypes(typesData || []);
        }

        const { data: statusesData, error: statusesError } = await supabase
          .from('course_statuses')
          .select('*')
          .order('created_at', { ascending: true });

        if (statusesError) {
          console.error('Error loading course statuses:', statusesError);
        } else {
          setCourseStatuses(statusesData || []);
        }

        // Sort courses by status priority, then by start date
        const sortedCourses = allCourses.sort((a, b) => {
          // Priority order: active -> upcoming -> expired -> archived
          const statusPriority = { 'active': 1, 'upcoming': 2, 'expired': 3, 'archived': 4 };
          const priorityA = statusPriority[a.status as keyof typeof statusPriority] || 5;
          const priorityB = statusPriority[b.status as keyof typeof statusPriority] || 5;

          if (priorityA !== priorityB) {
            return priorityA - priorityB;
          }

          // If same status, sort by start date (permanent courses last)
          if (!a.start_date && !b.start_date) {
            return 0; // Both permanent, maintain current order
          }
          if (!a.start_date) {
            return 1; // a is permanent, comes after b
          }
          if (!b.start_date) {
            return -1; // b is permanent, a comes before b
          }
          const dateA = new Date(a.start_date);
          const dateB = new Date(b.start_date);
          return dateA.getTime() - dateB.getTime();
        });

        setAllCourses(sortedCourses);
        setCourses(sortedCourses);
      } catch (err) {
        setError('Failed to load courses');
        console.error('Error loading courses:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userProfile]);

  // Filter courses based on selected fields and filters
  useEffect(() => {
    let filteredCourses = allCourses;

    // Filter by field of interest
    if (selectedFields.length > 0) {
      filteredCourses = filteredCourses.filter(course =>
        course.field_of_interest_id && selectedFields.includes(course.field_of_interest_id)
      );
    }

    // Filter by status
    if (courseFilters.status !== 'all') {
      filteredCourses = filteredCourses.filter(course => course.status === courseFilters.status);
    }

    // Filter by course type
    if (courseFilters.type !== 'all') {
      filteredCourses = filteredCourses.filter(course => course.course_type === courseFilters.type);
    }

    // Filter by date type
    if (courseFilters.dateType === 'permanent') {
      filteredCourses = filteredCourses.filter(course => !course.start_date);
    } else if (courseFilters.dateType === 'temporary') {
      filteredCourses = filteredCourses.filter(course => course.start_date);
    }

    setCourses(filteredCourses);
  }, [selectedFields, courseFilters, allCourses]);

  const toggleFieldFilter = (fieldId: number) => {
    setSelectedFields(prev =>
      prev.includes(fieldId)
        ? prev.filter(id => id !== fieldId)
        : [...prev, fieldId]
    );
  };

  const clearFilters = () => {
    setSelectedFields([]);
    setCourseFilters({ status: 'all', type: 'all', dateType: 'all' });
  };

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero Section */}
      <section className="pt-20 md:pt-24 pb-8 md:pb-12 starfield">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-3 md:space-y-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-orbitron font-bold text-glow">
              Educational Courses
            </h1>
            <p className="text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl md:max-w-3xl mx-auto px-2">
              Expand your knowledge with our comprehensive courses covering cutting-edge
              topics in science, technology, and research methodologies.
            </p>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="py-6 md:py-8 border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <BookOpen className="w-5 h-5" />
              <span className="font-medium text-sm md:text-base">
                {loading ? 'Loading...' : `${courses.length} Available Courses`}
              </span>
            </div>

            {/* Mobile Filter Toggle */}
            <div className="flex items-center justify-between w-full lg:w-auto lg:justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="lg:hidden"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {selectedFields.length > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {selectedFields.length}
                  </Badge>
                )}
              </Button>

              {/* Desktop Filters */}
              <div className="hidden lg:flex items-center space-x-2">
                <Select value={courseFilters.status} onValueChange={(value) => setCourseFilters({...courseFilters, status: value})}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {courseStatuses.map(status => (
                      <SelectItem key={status.id} value={status.name}>{status.display_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={courseFilters.type} onValueChange={(value) => setCourseFilters({...courseFilters, type: value})}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {courseTypes.map(type => (
                      <SelectItem key={type.id} value={type.name}>{type.display_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={courseFilters.dateType} onValueChange={(value) => setCourseFilters({...courseFilters, dateType: value})}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Date Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Dates</SelectItem>
                    <SelectItem value="permanent">Permanent</SelectItem>
                    <SelectItem value="temporary">Temporary</SelectItem>
                  </SelectContent>
                </Select>

                <Button onClick={() => setCourseFilters({ status: 'all', type: 'all', dateType: 'all' })} variant="outline" size="sm">
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Filters Panel */}
          {showMobileFilters && (
            <div className="mt-4 p-4 bg-card border rounded-lg lg:hidden">
              <div className="space-y-4">
                {/* Field of Interest Filters */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-sm">Filter by Field of Interest</h3>
                    {selectedFields.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedFields([])}
                        className="text-xs"
                      >
                        Clear All
                      </Button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {fieldsOfInterest.map(field => (
                      <Button
                        key={field.id}
                        variant={selectedFields.includes(field.id) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleFieldFilter(field.id)}
                        className="text-xs"
                      >
                        {field.name}
                        {selectedFields.includes(field.id) && (
                          <X className="w-3 h-3 ml-1" />
                        )}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Course Filters */}
                <div>
                  <h3 className="font-medium text-sm mb-3">Course Filters</h3>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Status</Label>
                      <Select value={courseFilters.status} onValueChange={(value) => setCourseFilters({...courseFilters, status: value})}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          {courseStatuses.map(status => (
                            <SelectItem key={status.id} value={status.name}>{status.display_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">Type</Label>
                      <Select value={courseFilters.type} onValueChange={(value) => setCourseFilters({...courseFilters, type: value})}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          {courseTypes.map(type => (
                            <SelectItem key={type.id} value={type.name}>{type.display_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">Date Type</Label>
                      <Select value={courseFilters.dateType} onValueChange={(value) => setCourseFilters({...courseFilters, dateType: value})}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="All Dates" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Dates</SelectItem>
                          <SelectItem value="permanent">Permanent</SelectItem>
                          <SelectItem value="temporary">Temporary</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button onClick={() => setCourseFilters({ status: 'all', type: 'all', dateType: 'all' })} variant="outline" size="sm" className="w-full">
                      Clear Course Filters
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Desktop Field Filters */}
          <div className="hidden lg:flex flex-wrap gap-2 mt-4">
            <span className="text-sm text-muted-foreground mr-2 self-center">Filter by Field:</span>
            {fieldsOfInterest.map(field => (
              <Button
                key={field.id}
                variant={selectedFields.includes(field.id) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleFieldFilter(field.id)}
                className="text-xs"
              >
                {field.name}
                {selectedFields.includes(field.id) && (
                  <X className="w-3 h-3 ml-1" />
                )}
              </Button>
            ))}
            {selectedFields.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-xs"
              >
                Clear All
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Courses Grid */}
      <section className="py-8 md:py-16">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="flex items-center justify-center py-8 md:py-12">
              <div className="text-center">
                <Loader2 className="w-6 h-6 md:w-8 md:h-8 animate-spin mx-auto mb-3 md:mb-4 text-primary" />
                <p className="text-sm md:text-base text-muted-foreground">Loading courses...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-8 md:py-12">
              <p className="text-sm md:text-base text-muted-foreground">{error}</p>
              <Button
                onClick={() => window.location.reload()}
                className="mt-3 md:mt-4"
                size="sm"
              >
                Try Again
              </Button>
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-8 md:py-12">
              <p className="text-sm md:text-base text-muted-foreground">
                {selectedFields.length > 0
                  ? "No courses found for the selected fields of interest."
                  : "No courses available at the moment."
                }
              </p>
              <p className="text-xs md:text-sm text-muted-foreground mt-2">
                {selectedFields.length > 0
                  ? "Try selecting different fields or clear all filters."
                  : "Check back soon for new educational content!"
                }
              </p>
              {selectedFields.length > 0 && (
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  size="sm"
                  className="mt-3"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Active Filters Display */}
              {selectedFields.length > 0 && (
                <div className="mb-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-muted-foreground">Active filters:</span>
                    {selectedFields.map(fieldId => {
                      const field = fieldsOfInterest.find(f => f.id === fieldId);
                      return field ? (
                        <Badge
                          key={fieldId}
                          variant="secondary"
                          className="cursor-pointer hover:bg-secondary/80"
                          onClick={() => toggleFieldFilter(fieldId)}
                        >
                          {field.name}
                          <X className="w-3 h-3 ml-1" />
                        </Badge>
                      ) : null;
                    })}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="text-xs h-6 px-2"
                    >
                      Clear all
                    </Button>
                  </div>
                </div>
              )}

              {/* Courses Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
                {courses.map((course, index) => (
                  <div
                    key={course.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <CourseCard
                      course={course}
                      onEnrollmentChange={handleEnrollmentChange}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Courses;

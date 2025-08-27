import React, { useState, useEffect } from 'react';
import { Calendar, Clock, ExternalLink, BookOpen, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Course {
  id: string;
  title: string;
  description: string | null;
  course_type_id: number | null;
  course_type: string;
  status_id: number | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  link: string | null;
  image_url: string | null;
  field_of_interest_id: number | null;
  created_at: string;
  updated_at: string;
  field_of_interest_options?: { id: number; name: string };
  is_enrolled?: boolean;
}

interface CourseCardProps {
  course: Course;
  onEnrollmentChange?: (courseId: string, isEnrolled: boolean) => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, onEnrollmentChange }) => {
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(course.is_enrolled || false);
  const { user, userProfile } = useAuth();
  const { toast } = useToast();

  // Prevent multiple enrollment attempts
  const [enrollmentAttempted, setEnrollmentAttempted] = useState(false);

  // Check enrollment status when component mounts or user changes
  useEffect(() => {
    const checkEnrollmentStatus = async () => {
      if (!userProfile || !course.id) return;

      try {
        const { data, error } = await supabase
          .from('course_enrollments')
          .select('id')
          .eq('course_id', course.id)
          .eq('user_id', userProfile.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking enrollment status:', error);
          return;
        }

        const enrolled = !!data;
        setIsEnrolled(enrolled);
        onEnrollmentChange?.(course.id, enrolled);
      } catch (error) {
        console.error('Error checking enrollment status:', error);
      }
    };

    checkEnrollmentStatus();
  }, [userProfile, course.id, onEnrollmentChange]);

  const handleEnroll = async () => {
    if (!user || !userProfile) {
      // Show login required toast
      toast({
        title: "Login Required",
        description: "Please log in to enroll in courses. Redirecting to login page in 5 seconds...",
        variant: "destructive",
      });

      // Redirect to login after 5 seconds
      setTimeout(() => {
        window.location.href = '/login';
      }, 5000);

      return;
    }

    // Check if already enrolled to prevent duplicate enrollment attempts
    if (isEnrolled || enrollmentAttempted) {
      toast({
        title: "Already Enrolled",
        description: `You are already enrolled in "${course.title}"`,
        variant: "default",
      });
      return;
    }

    try {
      setIsEnrolling(true);
      setEnrollmentAttempted(true);

      const { error } = await supabase
        .from('course_enrollments')
        .insert([{
          course_id: course.id,
          user_id: userProfile.id, // Use userProfile.id instead of user.id
          status: 'enrolled',
          progress: 0
        }]);

      if (error) throw error;

      setIsEnrolled(true);
      onEnrollmentChange?.(course.id, true);

      // Show success toast
      toast({
        title: "Enrollment Successful!",
        description: `You have successfully enrolled in "${course.title}"`,
        variant: "default",
      });
    } catch (error: any) {
      console.error('Enrollment failed:', error);

      // Handle specific error cases
      if (error?.code === '23505' ||
          error?.code === '409' ||
          error?.message?.includes('duplicate key') ||
          error?.message?.includes('unique constraint') ||
          error?.message?.includes('already exists')) {
        // User is already enrolled (unique constraint violation)
        setIsEnrolled(true);
        onEnrollmentChange?.(course.id, true);
        toast({
          title: "Already Enrolled",
          description: `You are already enrolled in "${course.title}"`,
          variant: "default",
        });
      } else if (error?.code === '23503' ||
                error?.message?.includes('violates foreign key constraint') ||
                error?.message?.includes('is not present in table')) {
        // Foreign key constraint violation - user doesn't exist in users table
        setEnrollmentAttempted(false); // Allow retry but this will likely fail again
        toast({
          title: "Account Issue",
          description: "There seems to be an issue with your account. Please try logging out and logging back in, or contact support if the problem persists.",
          variant: "destructive",
        });
      } else {
        // Other errors - reset the attempt flag so user can try again
        setEnrollmentAttempted(false);
        toast({
          title: "Enrollment Failed",
          description: "There was an error enrolling in this course. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsEnrolling(false);
    }
  };
  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'default';
      case 'upcoming':
        return 'secondary';
      case 'expired':
        return 'destructive';
      case 'archived':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getCourseTypeDisplay = (courseType: string) => {
    const typeMap: { [key: string]: string } = {
      'udemy': 'Udemy',
      'coursera': 'Coursera',
      'youtube': 'YouTube',
      'other': 'Other'
    };
    return typeMap[courseType.toLowerCase()] || courseType;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) {
      return 'Permanent';
    }
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card className="card-cosmic group overflow-hidden h-full">
      {/* Course Image */}
      <div className="relative overflow-hidden rounded-t-lg">
        <div
          className="h-32 sm:h-40 md:h-48 bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
          style={{
            backgroundImage: course.image_url
              ? `url(${course.image_url})`
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />

        {/* Status Badge */}
        <div className="absolute top-2 right-2">
          <Badge
            variant={getStatusVariant(course.status)}
            className={`bg-background/90 backdrop-blur-sm text-xs ${
              course.status === 'active'
                ? 'bg-green-600 text-white'
                : course.status === 'expired'
                ? 'bg-red-600 text-white'
                : course.status === 'upcoming'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-600 text-white'
            }`}
          >
            {course.status}
          </Badge>
        </div>

        {/* Course Type Badge */}
        <div className="absolute top-2 left-2">
          <Badge variant="outline" className="bg-background/90 backdrop-blur-sm text-xs">
            {getCourseTypeDisplay(course.course_type)}
          </Badge>
        </div>
      </div>

      {/* Course Info */}
      <div className="p-3 sm:p-4 md:p-6 space-y-3 md:space-y-4 flex-1 flex flex-col">
        <h3 className="text-lg md:text-xl font-orbitron font-bold group-hover:text-primary transition-colors line-clamp-2 leading-tight">
          {course.title}
        </h3>

        {course.description && (
          <p className="text-muted-foreground text-xs md:text-sm line-clamp-2 md:line-clamp-3 flex-1">
            {course.description}
          </p>
        )}

        {/* Field of Interest */}
        {course.field_of_interest_options && (
          <div className="space-y-1">
            <Badge
              variant="secondary"
              className="text-xs px-1.5 py-0.5"
            >
              {course.field_of_interest_options.name}
            </Badge>
          </div>
        )}

        <div className="space-y-1 md:space-y-2 text-xs md:text-sm text-muted-foreground">
          <div className="flex items-center space-x-2">
            <Calendar className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
            <span className="truncate">
              {formatDate(course.start_date)}
              {course.start_date && course.end_date && ` - ${formatDate(course.end_date)}`}
            </span>
          </div>

          {course.link && isEnrolled && (
            <div className="flex items-center space-x-2">
              <ExternalLink className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
              <span>Online Course</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-2 mt-auto">
          {/* Button container with vertical layout */}
          <div className="flex flex-col space-y-2 w-full">
            {/* Start Course button - only show if enrolled and has link */}
            {isEnrolled && course.link && (
              <Button
                size="sm"
                className="w-full btn-cosmic text-xs md:text-sm"
                asChild
              >
                <a
                  href={course.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center space-x-1 md:space-x-2"
                >
                  <ExternalLink className="w-3 h-3 md:w-4 md:h-4" />
                  <span>Start Course</span>
                </a>
              </Button>
            )}

            {/* Enrolled status button - always show if enrolled */}
            {isEnrolled ? (
              <Button
                size="sm"
                className="w-full bg-green-600 hover:bg-green-700 text-white text-xs md:text-sm"
                disabled
              >
                <UserCheck className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                <span>Enrolled</span>
              </Button>
            ) : (
              /* Enroll button - only show if not enrolled */
              <Button
                size="sm"
                className={`w-full text-xs md:text-sm ${
                  course.status === 'active'
                    ? 'btn-cosmic'
                    : course.status === 'upcoming'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : course.status === 'expired'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-gray-600 hover:bg-gray-700 text-white'
                }`}
                disabled={isEnrolling}
                onClick={course.status === 'active' ? handleEnroll : undefined}
              >
                <BookOpen className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                <span>
                  {isEnrolling
                    ? 'Enrolling...'
                    : course.status === 'active'
                    ? 'Enroll Now'
                    : course.status === 'upcoming'
                    ? 'Coming Soon'
                    : course.status === 'expired'
                    ? 'Expired'
                    : course.status}
                </span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export { CourseCard };

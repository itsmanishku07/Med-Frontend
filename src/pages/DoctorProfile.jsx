import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Mail, Phone, MapPin, Award, BookOpen, Clock, MessageSquare, Send, Loader2, ArrowLeft, Edit2, Trash2, CheckCircle, Calendar } from 'lucide-react';
import api, { appointmentAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/FirebaseAuthContext';
import DoctorAvailabilityViewer from '../components/DoctorAvailabilityViewer';

export default function DoctorProfile() {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  
  const [doctor, setDoctor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ average_rating: 0, total_reviews: 0 });
  const [myReview, setMyReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completedCases, setCompletedCases] = useState([]);
  const [loadingCases, setLoadingCases] = useState(false);
  
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const [showAvailability, setShowAvailability] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingNotes, setBookingNotes] = useState('');
  const [preferredTime, setPreferredTime] = useState('');

  const isPatient = userProfile?.role === 'PATIENT';
  const isDoctor = userProfile?.role === 'DOCTOR';
  const isOwnProfile = isDoctor && userProfile?.id === doctorId;

  useEffect(() => {
    fetchDoctorData();
    if (isOwnProfile) {
      console.log('Fetching completed cases for doctor:', doctorId);
      fetchCompletedCases();
    }
  }, [doctorId, isOwnProfile]);

  const fetchDoctorData = async () => {
    try {
      setLoading(true);
      const [doctorRes, reviewsRes, myReviewRes] = await Promise.all([
        api.get(`/auth/doctors`),
        api.get(`/reviews/doctor/${doctorId}`),
        isPatient ? api.get(`/reviews/doctor/${doctorId}/my-review`).catch(() => ({ data: { review: null } })) : Promise.resolve({ data: { review: null } })
      ]);

      const doctorData = doctorRes.data.doctors?.find(d => d.id === doctorId);
      if (!doctorData) {
        toast.error('Doctor not found');
        navigate('/doctors');
        return;
      }

      setDoctor(doctorData);
      setReviews(reviewsRes.data.reviews || []);
      setStats(reviewsRes.data.stats || { average_rating: 0, total_reviews: 0 });
      
      if (myReviewRes.data.review) {
        setMyReview(myReviewRes.data.review);
        setRating(myReviewRes.data.review.rating);
        setComment(myReviewRes.data.review.comment || '');
      }
    } catch (error) {
      console.error('Error fetching doctor data:', error);
      toast.error('Failed to load doctor profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompletedCases = async () => {
    try {
      setLoadingCases(true);
      console.log('Calling API for completed cases:', doctorId);
      const response = await appointmentAPI.getDoctorCompletedCases(doctorId);
      console.log('Completed cases response:', response.data);
      if (response.data.success) {
        setCompletedCases(response.data.completed_cases || []);
      }
    } catch (error) {
      console.error('Error fetching completed cases:', error);
      toast.error('Failed to load completed cases');
    } finally {
      setLoadingCases(false);
    }
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    try {
      setSubmitting(true);
      const response = await api.post(`/reviews/doctor/${doctorId}`, {
        rating,
        comment: comment.trim()
      });

      if (response.data.success) {
        toast.success(myReview ? 'Review updated!' : 'Review submitted!');
        setShowReviewForm(false);
        fetchDoctorData();
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!confirm('Delete your review?')) return;

    try {
      await api.delete(`/reviews/${myReview.id}`);
      toast.success('Review deleted');
      setMyReview(null);
      setRating(0);
      setComment('');
      fetchDoctorData();
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error('Failed to delete review');
    }
  };

  const handleBookAppointment = async () => {
    try {
      setSubmitting(true);
      const response = await api.post('/appointments/request', {
        doctor_id: doctorId,
        notes: bookingNotes,
        preferred_time: preferredTime
      });

      if (response.data.success) {
        toast.success('Appointment request sent!');
        setIsBooking(false);
        setBookingNotes('');
        setPreferredTime('');
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast.error('Failed to send request');
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ value, onChange, readonly = false }) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => !readonly && onChange(star)}
            onMouseEnter={() => !readonly && setHoverRating(star)}
            onMouseLeave={() => !readonly && setHoverRating(0)}
            className={`transition-all ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
          >
            <Star
              className={`w-6 h-6 ${
                star <= (hoverRating || value)
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!doctor) return null;

  const profile = doctor.profile || {};
  const specializations = doctor.specializations || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {}
        <button
          onClick={() => navigate('/doctors')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 font-semibold transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Doctors
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {}
          <div className="lg:col-span-1 space-y-6">
            {}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600" />
              <div className="px-6 pb-6">
                <div className="relative -mt-16 mb-4">
                  <div className="h-32 w-32 rounded-2xl bg-white p-1 shadow-xl mx-auto">
                    {doctor.profile_picture ? (
                      <img
                        src={doctor.profile_picture}
                        alt={doctor.name}
                        className="h-full w-full rounded-xl object-cover"
                      />
                    ) : (
                      <div className="h-full w-full rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                        <span className="text-4xl font-black text-blue-600">
                          {doctor.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-center mb-4">
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">
                    Dr. {doctor.name}
                  </h1>
                  <div className="flex flex-wrap justify-center gap-2 mb-3">
                    {specializations.map((spec, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold border border-blue-100"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>

                  {}
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-5 h-5 ${
                            star <= Math.round(stats.average_rating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-lg font-bold text-gray-900">
                      {stats.average_rating.toFixed(1)}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({stats.total_reviews} {stats.total_reviews === 1 ? 'review' : 'reviews'})
                    </span>
                  </div>
                </div>

                {}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="text-gray-700 font-medium">{doctor.email}</span>
                  </div>
                  {doctor.phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                        <Phone className="w-5 h-5 text-green-600" />
                      </div>
                      <span className="text-gray-700 font-medium">{doctor.phone}</span>
                    </div>
                  )}
                  {profile.location && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-orange-600" />
                      </div>
                      <span className="text-gray-700 font-medium">{profile.location}</span>
                    </div>
                  )}
                </div>

                {}
                {isPatient && (
                  <div className="space-y-3">
                    <button
                      onClick={() => setShowAvailability(true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-semibold transition shadow-sm"
                    >
                      <Clock className="w-5 h-5" />
                      View Availability
                    </button>
                    <button
                      onClick={() => setIsBooking(!isBooking)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold transition shadow-sm"
                    >
                      <MessageSquare className="w-5 h-5" />
                      Book Appointment
                    </button>
                  </div>
                )}
              </div>
            </div>

            {}
            {(profile.experience || profile.education) && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="font-bold text-gray-900 mb-4">Professional Info</h3>
                <div className="space-y-3">
                  {profile.experience && (
                    <div className="flex items-center gap-3">
                      <Award className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Experience</p>
                        <p className="text-sm text-gray-600">{profile.experience} Years</p>
                      </div>
                    </div>
                  )}
                  {profile.education && (
                    <div className="flex items-center gap-3">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Education</p>
                        <p className="text-sm text-gray-600">{profile.education}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {isOwnProfile && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">Accepted & Completed Cases</h3>
                  <span className="px-3 py-1 bg-green-50 text-green-700 rounded-lg text-sm font-semibold">
                    {completedCases.length} Cases
                  </span>
                </div>
                {loadingCases ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                  </div>
                ) : completedCases.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No accepted or completed cases yet</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {completedCases.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 text-sm">
                              {appointment.patient_name}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Calendar className="w-3.5 h-3.5 text-gray-400" />
                              <p className="text-xs text-gray-500">
                                {appointment.scheduled_at
                                  ? new Date(appointment.scheduled_at).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })
                                  : 'Not scheduled'}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                              appointment.status === 'COMPLETED'
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-green-50 text-green-700'
                            }`}
                          >
                            {appointment.status}
                          </span>
                        </div>
                        {appointment.notes && (
                          <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                            {appointment.notes}
                          </p>
                        )}
                        {appointment.doctor_notes && (
                          <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                            <p className="text-xs text-blue-900 font-medium">Your Notes:</p>
                            <p className="text-xs text-blue-700 mt-1">{appointment.doctor_notes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {}
          <div className="lg:col-span-2 space-y-6">
            {}
            {isBooking && isPatient && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Request Appointment</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Preferred Time (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={preferredTime}
                      onChange={(e) => setPreferredTime(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Reason for Consultation
                    </label>
                    <textarea
                      value={bookingNotes}
                      onChange={(e) => setBookingNotes(e.target.value)}
                      rows="4"
                      placeholder="Briefly describe your symptoms..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleBookAppointment}
                      disabled={submitting}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold transition disabled:opacity-50"
                    >
                      {submitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                      Submit Request
                    </button>
                    <button
                      onClick={() => setIsBooking(false)}
                      className="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {}
            {profile.bio && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">About</h3>
                <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Patient Reviews ({stats.total_reviews})
                </h3>
                {isPatient && !showReviewForm && (
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold transition text-sm"
                  >
                    <Edit2 className="w-4 h-4" />
                    {myReview ? 'Edit Review' : 'Write Review'}
                  </button>
                )}
              </div>

              {}
              {showReviewForm && isPatient && (
                <div className="mb-6 p-6 bg-blue-50 rounded-xl border-2 border-blue-100">
                  <h4 className="font-bold text-gray-900 mb-4">
                    {myReview ? 'Edit Your Review' : 'Write a Review'}
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Your Rating
                      </label>
                      <StarRating value={rating} onChange={setRating} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Your Comment (Optional)
                      </label>
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows="4"
                        placeholder="Share your experience..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleSubmitReview}
                        disabled={submitting}
                        className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold transition disabled:opacity-50"
                      >
                        {submitting ? 'Submitting...' : 'Submit Review'}
                      </button>
                      {myReview && (
                        <button
                          onClick={handleDeleteReview}
                          className="px-4 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 font-semibold transition"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => setShowReviewForm(false)}
                        className="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {}
              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <div className="text-center py-12">
                    <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No reviews yet. Be the first to review!</p>
                  </div>
                ) : (
                  reviews.map((review) => (
                    <div
                      key={review.id}
                      className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center flex-shrink-0">
                          {review.patient.profile_picture ? (
                            <img
                              src={review.patient.profile_picture}
                              alt={review.patient.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-lg font-bold text-blue-600">
                              {review.patient.name?.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-bold text-gray-900">{review.patient.name}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(review.created_at).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= review.rating
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          {review.comment && (
                            <p className="text-gray-700 text-sm leading-relaxed">{review.comment}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {}
      <DoctorAvailabilityViewer
        isOpen={showAvailability}
        onClose={() => setShowAvailability(false)}
        doctor={doctor}
      />
    </div>
  );
}

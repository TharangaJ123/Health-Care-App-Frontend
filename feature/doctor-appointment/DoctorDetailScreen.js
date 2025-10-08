import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Alert, Image, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { styles } from './styles/AppointmentStyles';

// Adjust this to your backend host if running on device/emulator
// e.g., Android emulator: http://10.0.2.2:5000, iOS simulator: http://localhost:5000, real device: http://<LAN-IP>:5000
const API_BASE = 'http://192.168.8.190:5000';

export default function DoctorDetailScreen({ route, navigation }) {
  const { doctorId, doctorName } = route.params;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookmarked, setBookmarked] = useState(false);
  const [activeTab, setActiveTab] = useState('Details');
  const [editData, setEditData] = useState({});
  const [savingInline, setSavingInline] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!doctorId) return;
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API_BASE}/api/doctors/${doctorId}/profile`);
      if (!res.ok) throw new Error('Failed to load doctor profile');
      const data = await res.json();
      setProfile(data);
      setEditData(data || {});
    } catch (e) {
      setError(e.message || 'Failed to load doctor profile');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile])
  );

  const renderStarRating = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating || 0);
    const hasHalfStar = (rating || 0) % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push('⭐');
      } else if (i === fullStars && hasHalfStar) {
        stars.push('⭐');
      } else {
        stars.push('☆');
      }
    }
    return stars.join('');
  };

  const isMissing = (val) =>
    val === undefined || val === null || (typeof val === 'string' && val.trim() === '') ||
    (Array.isArray(val) && val.length === 0);

  const missingKeys = (p) => {
    if (!p) return [];
    const keys = ['name','title','qualification','hospital','experience','happyPatients','rating','reviewCount','consultationFee','bio','phone','email','location','workingHours','photoUrl'];
    return keys.filter(k => isMissing(p[k]));
  };

  const hasMissing = profile ? missingKeys(profile).length > 0 : false;

  const handleInlineSave = async () => {
    if (!doctorId) return;
    try {
      setSavingInline(true);
      const res = await fetch(`${API_BASE}/api/doctors/${doctorId}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });
      if (!res.ok) throw new Error('Failed to update profile');
      const updated = await res.json();
      setProfile(updated);
      setEditData(updated);
      Alert.alert('Saved', 'Profile updated');
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to update');
    } finally {
      setSavingInline(false);
    }
  };

  const handleEditDoctor = () => {
    navigation.navigate('EditDoctor', {
      doctorId,
      doctorProfile: profile
    });
  };

  const handleDeleteDoctor = async () => {
    Alert.alert(
      'Delete Doctor',
      'Are you sure you want to delete this doctor? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const response = await fetch(`${API_BASE}/api/doctors/${doctorId}/profile`, {
                method: 'DELETE',
              });

              if (!response.ok) {
                throw new Error('Failed to delete doctor');
              }

              Alert.alert(
                'Success',
                'Doctor deleted successfully!',
                [
                  {
                    text: 'OK',
                    onPress: () => navigation.navigate('Success', {
                      title: 'Doctor Deleted!',
                      message: 'The doctor has been successfully removed from the system.',
                      nextScreen: 'Home',
                      nextScreenParams: {}
                    })
                  }
                ]
              );
            } catch (error) {
              console.error('Error deleting doctor:', error);
              Alert.alert('Error', 'Failed to delete doctor. Please try again.');
              setLoading(false);
            }
          },
        },
      ]
    );
  };

    return (
      <ScrollView style={localStyles.container}>
        {/* Header with back and bookmark */}
        <View style={localStyles.headerBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={localStyles.headerIconButton}>
            <Text style={localStyles.headerIconText}>←</Text>
          </TouchableOpacity>
          <Text style={localStyles.headerBarTitle}>Doctor Profile</Text>
          <TouchableOpacity onPress={() => setBookmarked((b) => !b)} style={localStyles.headerIconButton}>
            <Text style={[localStyles.headerIconText, bookmarked && { color: '#E91E63' }]}>{bookmarked ? '❤' : '♡'}</Text>
          </TouchableOpacity>
        </View>

        

        <View style={localStyles.content}>
          {loading ? (
            <View style={localStyles.loadingContainer}>
              <ActivityIndicator size="large" color="#4A90E2" />
              <Text style={localStyles.loadingText}>Loading doctor information...</Text>
            </View>
          ) : error ? (
            <View style={localStyles.errorContainer}>
              <Text style={localStyles.errorIcon}>⚠️</Text>
              <Text style={localStyles.errorText}>{error}</Text>
              <TouchableOpacity style={localStyles.retryButton} onPress={fetchProfile}>
                <Text style={localStyles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : profile ? (
            <View>
              {/* Doctor Hero Card */}
              <View style={localStyles.profileCard}>
                <View style={localStyles.heroCenter}>
                  {profile.photoUrl ? (
                    <Image source={{ uri: profile.photoUrl }} style={localStyles.doctorImage} />
                  ) : (
                    <View style={localStyles.avatarContainer}>
                      <Text style={localStyles.avatarText}>
                        {(profile.name || doctorName || 'Dr. Imran Syaher').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  {profile.isVerified && (
                    <View style={localStyles.verifiedBadge}>
                      <Text style={localStyles.verifiedIcon}>✓</Text>
                    </View>
                  )}
                  {profile.name ? (
                    <Text style={localStyles.doctorName}>{profile.name}</Text>
                  ) : null}
                  {profile.title ? (
                    <View style={localStyles.subtitleBadge}>
                      <Text style={localStyles.subtitleBadgeText}>{profile.title}</Text>
                    </View>
                  ) : null}
                  {profile.qualification ? (
                    <Text style={localStyles.qualificationText}>{profile.qualification}</Text>
                  ) : null}
                  {profile.hospital ? (
                    <Text style={localStyles.hospitalText}>{profile.hospital}</Text>
                  ) : null}

                  {/* Stats */}
                  <View style={localStyles.statsRow}>
                    {profile.experience !== undefined && (
                      <View style={localStyles.statCard}>
                        <Text style={localStyles.statValue}>{profile.experience}</Text>
                        <Text style={localStyles.statLabel}>Years</Text>
                      </View>
                    )}
                    {profile.happyPatients !== undefined && (
                      <View style={localStyles.statCard}>
                        <Text style={localStyles.statValue}>{profile.happyPatients}</Text>
                        <Text style={localStyles.statLabel}>Happy Patients</Text>
                      </View>
                    )}
                    {profile.rating !== undefined && (
                      <View style={localStyles.statCard}>
                        <Text style={localStyles.statValue}>{Number(profile.rating).toFixed(1)}★</Text>
                        <Text style={localStyles.statLabel}>Rating</Text>
                      </View>
                    )}
                    {profile.reviewCount !== undefined && (
                      <View style={localStyles.statCard}>
                        <Text style={localStyles.statValue}>{profile.reviewCount}</Text>
                        <Text style={localStyles.statLabel}>Reviews</Text>
                      </View>
                    )}
                  </View>

                  {/* Tabs */}
                  <View style={localStyles.tabRow}>
                    {['Details', 'Address', 'Reviews', 'Education'].map((t) => (
                      <TouchableOpacity key={t} onPress={() => setActiveTab(t)} style={[localStyles.tabButton, activeTab === t && localStyles.tabButtonActive]}>
                        <Text style={[localStyles.tabButtonText, activeTab === t && localStyles.tabButtonTextActive]}>{t}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* About Section */}
                  {profile.bio ? (
                    <View style={localStyles.aboutBox}>
                      <Text style={localStyles.aboutTitle}>About</Text>
                      <Text style={localStyles.aboutText}>{profile.bio}</Text>
                    </View>
                  ) : null}
                </View>

                {profile.bio && (
                  <View style={localStyles.bioSection}>
                    <Text style={localStyles.sectionTitle}>About</Text>
                    <Text style={localStyles.bioText}>{profile.bio}</Text>
                  </View>
                )}

                {/* Professional Information Section */}
                <View style={localStyles.professionalSection}>
                  <Text style={localStyles.sectionTitle}>Professional Information</Text>

                  {profile.education && profile.education.length > 0 && (
                    <View style={localStyles.infoGroup}>
                      <Text style={localStyles.infoLabel}>🎓 Education</Text>
                      {profile.education.map((edu, index) => (
                        <Text key={index} style={localStyles.infoText}>• {edu}</Text>
                      ))}
                    </View>
                  )}

                  {profile.certifications && profile.certifications.length > 0 && (
                    <View style={localStyles.infoGroup}>
                      <Text style={localStyles.infoLabel}>🏆 Certifications</Text>
                      {profile.certifications.map((cert, index) => (
                        <Text key={index} style={localStyles.infoText}>• {cert}</Text>
                      ))}
                    </View>
                  )}

                  {profile.specialInterests && profile.specialInterests.length > 0 && (
                    <View style={localStyles.infoGroup}>
                      <Text style={localStyles.infoLabel}>⭐ Special Interests</Text>
                      <Text style={localStyles.infoText}>{profile.specialInterests.join(', ')}</Text>
                    </View>
                  )}

                  {profile.consultationFee && (
                    <View style={localStyles.infoGroup}>
                      <Text style={localStyles.infoLabel}>💰 Consultation Fee</Text>
                      <Text style={localStyles.infoText}>₹{profile.consultationFee}</Text>
                    </View>
                  )}
                </View>

                {/* Contact & Availability Section */}
                <View style={localStyles.contactSection}>
                  <Text style={localStyles.sectionTitle}>Contact & Availability</Text>

                  <View style={localStyles.contactGrid}>
                    {profile.phone && (
                      <View style={localStyles.contactItem}>
                        <View style={localStyles.contactIconContainer}>
                          <Text style={localStyles.contactIcon}>📞</Text>
                        </View>
                        <View style={localStyles.contactInfo}>
                          <Text style={localStyles.contactLabel}>Phone</Text>
                          <Text style={localStyles.contactValue}>{profile.phone}</Text>
                        </View>
                      </View>
                    )}

                    {profile.email && (
                      <View style={localStyles.contactItem}>
                        <View style={localStyles.contactIconContainer}>
                          <Text style={localStyles.contactIcon}>✉️</Text>
                        </View>
                        <View style={localStyles.contactInfo}>
                          <Text style={localStyles.contactLabel}>Email</Text>
                          <Text style={localStyles.contactValue}>{profile.email}</Text>
                        </View>
                      </View>
                    )}

                    {profile.hospital && (
                      <View style={localStyles.contactItem}>
                        <View style={localStyles.contactIconContainer}>
                          <Text style={localStyles.contactIcon}>🏥</Text>
                        </View>
                        <View style={localStyles.contactInfo}>
                          <Text style={localStyles.contactLabel}>Hospital/Clinic</Text>
                          <Text style={localStyles.contactValue}>{profile.hospital}</Text>
                        </View>
                      </View>
                    )}

                    {profile.location && (
                      <View style={localStyles.contactItem}>
                        <View style={localStyles.contactIconContainer}>
                          <Text style={localStyles.contactIcon}>📍</Text>
                        </View>
                        <View style={localStyles.contactInfo}>
                          <Text style={localStyles.contactLabel}>Location</Text>
                          <Text style={localStyles.contactValue}>{profile.location}</Text>
                        </View>
                      </View>
                    )}
                  </View>

                  {profile.workingHours && (
                    <View style={localStyles.workingHoursSection}>
                      <Text style={localStyles.infoLabel}>🕐 Working Hours</Text>
                      <Text style={localStyles.infoText}>{profile.workingHours}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Inline Complete Profile Section (only if missing data) */}
              {hasMissing && (
                <View style={localStyles.actionCard}>
                  <Text style={[localStyles.sectionTitle, { marginBottom: 8 }]}>Complete Profile</Text>
                  <Text style={{ color: '#607D8B', marginBottom: 12 }}>Some fields are empty. You can fill them here.</Text>

                  {missingKeys(profile).includes('name') && (
                    <TextInput placeholder="Name" style={localStyles.inputInline} value={editData.name || ''} onChangeText={(t)=>setEditData({ ...editData, name: t })} />
                  )}
                  {missingKeys(profile).includes('title') && (
                    <TextInput placeholder="Title" style={localStyles.inputInline} value={editData.title || ''} onChangeText={(t)=>setEditData({ ...editData, title: t })} />
                  )}
                  {missingKeys(profile).includes('qualification') && (
                    <TextInput placeholder="Qualification" style={localStyles.inputInline} value={editData.qualification || ''} onChangeText={(t)=>setEditData({ ...editData, qualification: t })} />
                  )}
                  {missingKeys(profile).includes('hospital') && (
                    <TextInput placeholder="Hospital" style={localStyles.inputInline} value={editData.hospital || ''} onChangeText={(t)=>setEditData({ ...editData, hospital: t })} />
                  )}
                  {missingKeys(profile).includes('experience') && (
                    <TextInput placeholder="Experience (years)" keyboardType="numeric" style={localStyles.inputInline} value={String(editData.experience || '')} onChangeText={(t)=>setEditData({ ...editData, experience: Number(t) || 0 })} />
                  )}
                  {missingKeys(profile).includes('happyPatients') && (
                    <TextInput placeholder="Happy Patients" keyboardType="numeric" style={localStyles.inputInline} value={String(editData.happyPatients || '')} onChangeText={(t)=>setEditData({ ...editData, happyPatients: Number(t) || 0 })} />
                  )}
                  {missingKeys(profile).includes('rating') && (
                    <TextInput placeholder="Rating (0-5)" keyboardType="decimal-pad" style={localStyles.inputInline} value={String(editData.rating || '')} onChangeText={(t)=>setEditData({ ...editData, rating: Number(t) || 0 })} />
                  )}
                  {missingKeys(profile).includes('reviewCount') && (
                    <TextInput placeholder="Review Count" keyboardType="numeric" style={localStyles.inputInline} value={String(editData.reviewCount || '')} onChangeText={(t)=>setEditData({ ...editData, reviewCount: Number(t) || 0 })} />
                  )}
                  {missingKeys(profile).includes('consultationFee') && (
                    <TextInput placeholder="Consultation Fee" keyboardType="numeric" style={localStyles.inputInline} value={String(editData.consultationFee || '')} onChangeText={(t)=>setEditData({ ...editData, consultationFee: Number(t) || 0 })} />
                  )}
                  {missingKeys(profile).includes('bio') && (
                    <TextInput placeholder="About / Bio" style={[localStyles.inputInline, { height: 90 }]} multiline value={editData.bio || ''} onChangeText={(t)=>setEditData({ ...editData, bio: t })} />
                  )}
                  {missingKeys(profile).includes('phone') && (
                    <TextInput placeholder="Phone" style={localStyles.inputInline} value={editData.phone || ''} onChangeText={(t)=>setEditData({ ...editData, phone: t })} />
                  )}
                  {missingKeys(profile).includes('email') && (
                    <TextInput placeholder="Email" style={localStyles.inputInline} value={editData.email || ''} autoCapitalize="none" keyboardType="email-address" onChangeText={(t)=>setEditData({ ...editData, email: t })} />
                  )}
                  {missingKeys(profile).includes('location') && (
                    <TextInput placeholder="Location" style={localStyles.inputInline} value={editData.location || ''} onChangeText={(t)=>setEditData({ ...editData, location: t })} />
                  )}
                  {missingKeys(profile).includes('workingHours') && (
                    <TextInput placeholder="Working Hours" style={localStyles.inputInline} value={editData.workingHours || ''} onChangeText={(t)=>setEditData({ ...editData, workingHours: t })} />
                  )}
                  {missingKeys(profile).includes('photoUrl') && (
                    <TextInput placeholder="Photo URL" style={localStyles.inputInline} value={editData.photoUrl || ''} onChangeText={(t)=>setEditData({ ...editData, photoUrl: t })} />
                  )}

                  <TouchableOpacity style={[localStyles.primaryButton, { marginTop: 8 }]} onPress={handleInlineSave} disabled={savingInline}>
                    <Text style={localStyles.primaryButtonText}>{savingInline ? 'Saving...' : 'Save Missing Fields'}</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Action Buttons Section */}
              <View style={localStyles.actionCard}>
                <TouchableOpacity
                  style={localStyles.primaryButton}
                  onPress={handleEditDoctor}
                >
                  <Text style={localStyles.primaryButtonIcon}>✏️</Text>
                  <Text style={localStyles.primaryButtonText}>Edit Profile</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={localStyles.secondaryButton}
                  onPress={handleDeleteDoctor}
                >
                  <Text style={localStyles.secondaryButtonIcon}>🗑️</Text>
                  <Text style={localStyles.secondaryButtonText}>Delete Doctor</Text>
                </TouchableOpacity>
              </View>

              {/* Enhanced Appointments Section */}
              <View style={localStyles.appointmentsSection}>
                <View style={localStyles.sectionHeader}>
                  <Text style={localStyles.sectionTitle}>Recent Appointments</Text>
                  <Text style={localStyles.appointmentCount}>
                    {profile.appointments ? profile.appointments.length : 0} appointments
                  </Text>
                </View>

                {(!profile.appointments || profile.appointments.length === 0) ? (
                  <View style={localStyles.emptyState}>
                    <Text style={localStyles.emptyStateIcon}>📅</Text>
                    <Text style={localStyles.emptyStateTitle}>No appointments yet</Text>
                    <Text style={localStyles.emptyStateText}>This doctor hasn't had any appointments scheduled yet.</Text>
                  </View>
                ) : (
                  <View style={localStyles.appointmentsList}>
                    {profile.appointments.slice(0, 5).map((appointment, index) => (
                      <View key={appointment.id || index} style={localStyles.appointmentCard}>
                        <View style={localStyles.appointmentHeader}>
                          <View style={localStyles.patientInfo}>
                            <Text style={localStyles.patientName}>
                              {appointment.patientName || 'Unknown Patient'}
                            </Text>
                            <Text style={localStyles.appointmentDate}>
                              {new Date(appointment.appointmentDate || appointment.date).toLocaleDateString()}
                            </Text>
                          </View>
                          <View style={[
                            localStyles.statusBadge,
                            appointment.status === 'completed' && localStyles.statusCompleted,
                            appointment.status === 'scheduled' && localStyles.statusScheduled,
                            appointment.status === 'cancelled' && localStyles.statusCancelled
                          ]}>
                            <Text style={localStyles.statusText}>{appointment.status || 'scheduled'}</Text>
                          </View>
                        </View>

                        <View style={localStyles.appointmentDetails}>
                          {appointment.appointmentTime || appointment.time ? (
                            <View style={localStyles.detailRow}>
                              <Text style={localStyles.detailIcon}>🕐</Text>
                              <Text style={localStyles.detailText}>
                                {appointment.appointmentTime || appointment.time}
                              </Text>
                            </View>
                          ) : null}
                          {appointment.reason && (
                            <View style={localStyles.detailRow}>
                              <Text style={localStyles.detailIcon}>📋</Text>
                              <Text style={localStyles.detailText}>{appointment.reason}</Text>
                            </View>
                          )}
                          {appointment.type && (
                            <View style={localStyles.detailRow}>
                              <Text style={localStyles.detailIcon}>🏥</Text>
                              <Text style={localStyles.detailText}>{appointment.type}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          ) : null}
        </View>

        {/* Bottom Booking Bar */}
        <View style={localStyles.bottomBar}>
          <View style={{ flex: 1 }}>
            <Text style={localStyles.priceLabel}>Price</Text>
            <Text style={localStyles.priceValue}>${profile?.consultationFee || 1000}</Text>
          </View>
          <TouchableOpacity style={localStyles.iconCircleGreen} onPress={() => Alert.alert('Chat', 'Starting chat...')}>
            <Text style={localStyles.iconCircleText}>💬</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[localStyles.iconCircleGreen, { marginLeft: 8 }]} onPress={() => Alert.alert('Call', 'Calling doctor...')}>
            <Text style={localStyles.iconCircleText}>📞</Text>
          </TouchableOpacity>
          <TouchableOpacity style={localStyles.bookButton} onPress={() => Alert.alert('Book Now', 'Proceed to booking flow') }>
            <Text style={localStyles.bookButtonText}>Book Now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
}

  const localStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F8F9FA',
    },
    headerBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 24,
      paddingBottom: 8,
      backgroundColor: '#FFFFFF',
      borderBottomLeftRadius: 16,
      borderBottomRightRadius: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 2,
    },
    headerIconButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#E3F2FD',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerIconText: {
      color: '#0D47A1',
      fontSize: 18,
      fontWeight: '700',
    },
    headerBarTitle: {
      color: '#0D47A1',
      fontSize: 16,
      fontWeight: '700',
    },
    headerGradient: {
      backgroundColor: '#4A90E2',
      paddingTop: 60,
      paddingBottom: 30,
      paddingHorizontal: 20,
    },
    headerContent: {
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#fff',
      marginBottom: 8,
    },
    headerSubtitle: {
      fontSize: 16,
      color: '#E3F2FD',
      opacity: 0.9,
    },
    content: {
      flex: 1,
      padding: 20,
      marginTop: 0,
    },
    loadingContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
      backgroundColor: '#fff',
      borderRadius: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: '#666',
      fontWeight: '500',
    },
    errorContainer: {
      alignItems: 'center',
      paddingVertical: 40,
      backgroundColor: '#fff',
      borderRadius: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    errorIcon: {
      fontSize: 48,
      marginBottom: 16,
    },
    errorText: {
      fontSize: 16,
      color: '#F44336',
      marginBottom: 20,
      textAlign: 'center',
    },
    retryButton: {
      backgroundColor: '#4A90E2',
      paddingHorizontal: 32,
      paddingVertical: 14,
      borderRadius: 12,
    },
    retryButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    profileCard: {
      backgroundColor: '#fff',
      borderRadius: 20,
      padding: 24,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 5,
    },
    heroCenter: {
      alignItems: 'center',
      marginBottom: 16,
    },
    avatarSection: {
      position: 'relative',
      marginRight: 20,
    },
    avatarContainer: {
      width: 90,
      height: 90,
      borderRadius: 45,
      backgroundColor: '#4A90E2',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    doctorImage: {
      width: 110,
      height: 110,
      borderRadius: 55,
      marginBottom: 8,
    },
    avatarText: {
      fontSize: 36,
      fontWeight: 'bold',
      color: '#fff',
    },
    verifiedBadge: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: '#4CAF50',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: '#fff',
    },
    verifiedIcon: {
      color: '#fff',
      fontSize: 14,
      fontWeight: 'bold',
    },
    doctorMainInfo: {
      flex: 1,
    },
    doctorName: {
      fontSize: 26,
      fontWeight: 'bold',
      color: '#1A237E',
      marginBottom: 6,
      lineHeight: 32,
    },
    doctorSpecialty: {
      fontSize: 18,
      color: '#5C6BC0',
      marginBottom: 12,
      fontWeight: '500',
    },
    ratingSection: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    starsContainer: {
      marginRight: 8,
    },
    starsText: {
      fontSize: 18,
      lineHeight: 18,
    },
    ratingValue: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FF9800',
      marginRight: 8,
    },
    reviewCount: {
      fontSize: 14,
      color: '#78909C',
    },
    quickInfo: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
    },
    quickInfoItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F3F4F6',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    quickInfoIcon: {
      fontSize: 14,
      marginRight: 6,
    },
    quickInfoText: {
      fontSize: 13,
      color: '#4A5568',
      fontWeight: '500',
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      marginTop: 8,
      marginBottom: 12,
    },
    statCard: {
      backgroundColor: '#F3F8FF',
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 12,
      alignItems: 'center',
      flex: 1,
      marginHorizontal: 4,
    },
    statValue: {
      color: '#0D47A1',
      fontWeight: '700',
      fontSize: 16,
      marginBottom: 2,
    },
    statLabel: {
      color: '#607D8B',
      fontSize: 11,
      fontWeight: '600',
    },
    tabRow: {
      flexDirection: 'row',
      backgroundColor: '#EEF5FF',
      borderRadius: 12,
      padding: 4,
      marginTop: 8,
      marginBottom: 12,
    },
    tabButton: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 8,
      alignItems: 'center',
    },
    tabButtonActive: {
      backgroundColor: '#FFFFFF',
    },
    tabButtonText: {
      color: '#1565C0',
      fontSize: 13,
      fontWeight: '600',
    },
    tabButtonTextActive: {
      color: '#0D47A1',
    },
    aboutBox: {
      backgroundColor: '#E8F3FF',
      borderRadius: 12,
      padding: 14,
      marginTop: 4,
      width: '100%',
    },
    aboutTitle: {
      color: '#1A237E',
      fontWeight: '700',
      fontSize: 16,
      marginBottom: 6,
    },
    aboutText: {
      color: '#37474F',
      fontSize: 14,
      lineHeight: 20,
    },
    bioSection: {
      marginBottom: 24,
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: '#E8EAF6',
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#1A237E',
      marginBottom: 16,
    },
    bioText: {
      fontSize: 16,
      color: '#37474F',
      lineHeight: 26,
    },
    professionalSection: {
      marginBottom: 24,
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: '#E8EAF6',
    },
    infoGroup: {
      marginBottom: 16,
    },
    infoLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: '#263238',
      marginBottom: 8,
    },
    infoText: {
      fontSize: 15,
      color: '#455A64',
      lineHeight: 22,
      marginBottom: 4,
    },
    contactSection: {
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: '#E8EAF6',
    },
    contactGrid: {
      gap: 16,
      marginBottom: 20,
    },
    contactItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F8F9FA',
      padding: 16,
      borderRadius: 12,
      borderLeftWidth: 4,
      borderLeftColor: '#4A90E2',
    },
    contactIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#4A90E2',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    contactIcon: {
      fontSize: 20,
      color: '#fff',
    },
    contactInfo: {
      flex: 1,
    },
    contactLabel: {
      fontSize: 12,
      color: '#78909C',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    contactValue: {
      fontSize: 16,
      color: '#263238',
      fontWeight: '500',
    },
    workingHoursSection: {
      backgroundColor: '#FFF3E0',
      padding: 16,
      borderRadius: 12,
      borderLeftWidth: 4,
      borderLeftColor: '#FF9800',
    },
    actionCard: {
      backgroundColor: '#fff',
      borderRadius: 20,
      padding: 24,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 5,
    },
    primaryButton: {
      backgroundColor: '#4A90E2',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      borderRadius: 12,
      marginBottom: 12,
      shadowColor: '#4A90E2',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 3,
    },
    primaryButtonIcon: {
      fontSize: 18,
      marginRight: 8,
    },
    primaryButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    secondaryButton: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: '#F44336',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      borderRadius: 12,
    },
    secondaryButtonIcon: {
      fontSize: 18,
      marginRight: 8,
    },
    secondaryButtonText: {
      color: '#F44336',
      fontSize: 16,
      fontWeight: '600',
    },
    appointmentsSection: {
      backgroundColor: '#fff',
      borderRadius: 20,
      padding: 24,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 5,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    appointmentCount: {
      fontSize: 14,
      color: '#78909C',
      fontWeight: '500',
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyStateIcon: {
      fontSize: 64,
      marginBottom: 16,
      opacity: 0.7,
    },
    emptyStateTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#546E7A',
      marginBottom: 8,
    },
    emptyStateText: {
      fontSize: 14,
      color: '#78909C',
      textAlign: 'center',
      lineHeight: 20,
    },
    appointmentsList: {
      gap: 12,
    },
    appointmentCard: {
      backgroundColor: '#F8F9FA',
      borderRadius: 16,
      padding: 16,
      borderLeftWidth: 4,
      borderLeftColor: '#4A90E2',
    },
    appointmentHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    patientInfo: {
      flex: 1,
    },
    patientName: {
      fontSize: 16,
      fontWeight: '600',
      color: '#263238',
      marginBottom: 4,
    },
    appointmentDate: {
      fontSize: 14,
      color: '#78909C',
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    statusCompleted: {
      backgroundColor: '#C8E6C9',
    },
    statusScheduled: {
      backgroundColor: '#E3F2FD',
    },
    statusCancelled: {
      backgroundColor: '#FFCDD2',
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'capitalize',
    },
    appointmentDetails: {
      gap: 8,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    detailIcon: {
      fontSize: 16,
      marginRight: 12,
      width: 20,
    },
    detailText: {
      fontSize: 14,
      color: '#455A64',
      flex: 1,
    },
  });

import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  Alert, 
  TouchableOpacity,
  ImageBackground,
  ScrollView,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, AntDesign } from '@expo/vector-icons';
import api from '../src/api';

const { width } = Dimensions.get('window');

export default function MySubscriptions({ navigation }) {
  const [sub, setSub] = useState(null);
  const [planDetails, setPlanDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [daysRemaining, setDaysRemaining] = useState(0);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const res = await api.get('/main/user-subscriptions/current/');
      
      if (res.status === 204) {
        setSub(null);
        return;
      }

      if (res.status === 200 && res.data) {
        setSub(res.data);
        calculateDaysRemaining(res.data.end_date);
        await fetchPlanDetails(res.data.plan);
      } else {
        setSub(null);
      }
    } catch (err) {
      if (err.response?.status === 204) {
        setSub(null);
      } else {
        console.error('Fetch subscription error:', err);
        // Alert.alert('Error', 'Could not load subscription details.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchPlanDetails = async (planSlug) => {
    try {
      const res = await api.get('/main/subscription-plans/');
      if (res.status === 200 && res.data && res.data.length > 0) {
        const plan = res.data.find(p => p.slug === planSlug);
        if (plan) setPlanDetails(plan);
        else console.warn('Plan details not found for slug:', planSlug);
      }
    } catch (err) {
      console.error('Fetch plan details error:', err);
    }
  };

  const calculateDaysRemaining = (endDate) => {
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    setDaysRemaining(diffDays > 0 ? diffDays : 0);
  };

  const renderPerk = (perk, index) => {
    const perkIcons = {
      featured: 'star',
      urgent: 'flash',
      top: 'arrow-up',
      highlight: 'highlight',
      unlimited: 'infinity',
      support: 'headset'
    };
    return (
      <View key={`${perk.code}-${index}`} style={styles.perkItem}>
        <MaterialIcons 
          name={perkIcons[perk.code] || 'check'} 
          size={20} 
          color="#4CAF50" 
          style={styles.perkIcon}
        />
        <Text style={styles.perkText}>{perk.label}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <ImageBackground
        source={require('../assets/gradient-bg.jpg')}
        style={styles.loadingContainer}
        blurRadius={2}
      >
        <ActivityIndicator size="large" color="#3A7BFF" />
        <Text style={styles.loadingText}>Loading Subscription...</Text>
      </ImageBackground>
    );
  }

  if (!sub || !sub.plan) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Subscription</Text>
        </View>
        
        <View style={styles.emptyContent}>
          <View style={styles.illustration}>
            <MaterialIcons name="subscriptions" size={60} color="#888" />
            <View style={styles.plusIcon}>
              <Ionicons name="close" size={30} color="#fff" />
            </View>
          </View>
          
          <Text style={styles.emptyTitle}>No Active Subscription</Text>
          <Text style={styles.emptyDescription}>
            You don't have an active subscription. Subscribe now to get premium features for your property listings.
          </Text>
          
          <TouchableOpacity
            style={styles.subscribeButton}
            onPress={() => navigation.navigate('SubscriptionPlans')}
          >
            <Text style={styles.subscribeButtonText}>Browse Plans</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.homeButton}
            onPress={() => navigation.navigate('Main')}
          >
            <Text style={styles.homeButtonText}>Go to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Compute display quota: subtract 1 to account for pre-save
  const displayQuota = planDetails?.unlimited_listings
    ? 'Unlimited free listings'
    : `${Math.max(sub.free_listings_remaining - 1, 0)} free listings remaining`;

  const perks = planDetails?.perks || [];
  
  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#4361EE', '#3A0CA3']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Subscription</Text>
      </LinearGradient>
      
      <View style={styles.content}>
        {/* Subscription Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.planName}>
              {planDetails?.display_name || sub.plan || 'No Plan Name'}
            </Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>ACTIVE</Text>
            </View>
          </View>
          
          <View style={styles.progressContainer}>
            <Text style={styles.progressLabel}>
              {displayQuota}
            </Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <MaterialIcons name="event" size={20} color="#666" />
              <Text style={styles.detailLabel}>Started</Text>
              <Text style={styles.detailValue}>
                {new Date(sub.start_date).toLocaleDateString()}
              </Text>
            </View>
            
            <View style={styles.detailItem}>
              <MaterialIcons name="event-busy" size={20} color="#666" />
              <Text style={styles.detailLabel}>Expires</Text>
              <Text style={styles.detailValue}>
                {new Date(sub.end_date).toLocaleDateString()}
              </Text>
            </View>
          </View>
          
          <View style={styles.daysRemaining}>
            <MaterialIcons name="timer" size={24} color="#3A7BFF" />
            <Text style={styles.daysText}>
              {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining
            </Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Plan Perks</Text>
          <View style={styles.perksContainer}>
            {perks.length > 0 ? (
              perks.map(renderPerk)
            ) : (
              <Text style={styles.noPerksText}>No perks available for this plan</Text>
            )}
          </View>
        </View>
        
        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.button, styles.manageButton]}
            onPress={() => navigation.navigate('SubscriptionPlans')}
          >
            <AntDesign name="switcher" size={20} color="#3A7BFF" />
            <Text style={[styles.buttonText, styles.manageButtonText]}>Manage Plan</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.renewButton]}
            onPress={() => navigation.navigate('SubscriptionPlans')}
          >
            <Ionicons name="refresh" size={20} color="white" />
            <Text style={[styles.buttonText, styles.renewButtonText]}>Renew Early</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={styles.homeButton}
          onPress={() => navigation.navigate('Main')}
        >
          <Ionicons name="home" size={20} color="#3A7BFF" />
          <Text style={styles.homeButtonText}>Go to Home</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FF'
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    flexDirection: 'row',
    alignItems: 'center'
  },
  backButton: {
    marginRight: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 8
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
    flex: 1
  },
  content: {
    padding: 20,
    paddingBottom: 40
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FF'
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#555'
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#F8F9FF'
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30
  },
  illustration: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#EDF0FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    position: 'relative'
  },
  plusIcon: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#FF5252',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center'
  },
  emptyDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24
  },
  subscribeButton: {
    backgroundColor: '#3A7BFF',
    borderRadius: 15,
    paddingVertical: 16,
    paddingHorizontal: 40,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center'
  },
  subscribeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10
  },
  homeButtonText: {
    color: '#3A7BFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    marginBottom: 25,
    shadowColor: '#3A7BFF',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  planName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333'
  },
  statusBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 15
  },
  statusText: {
    color: '#4CAF50',
    fontWeight: '700',
    fontSize: 12
  },
  progressContainer: {
    marginBottom: 20,
    alignItems: 'center'
  },
  progressLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600'
  },
  divider: {
    height: 1,
    backgroundColor: '#EEE',
    marginVertical: 20
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  detailItem: {
    alignItems: 'center'
  },
  detailLabel: {
    fontSize: 14,
    color: '#888',
    marginTop: 5
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 3
  },
  daysRemaining: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EDF0FF',
    padding: 15,
    borderRadius: 15,
    marginTop: 10
  },
  daysText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3A7BFF',
    marginLeft: 10
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    marginBottom: 25,
    shadowColor: '#3A7BFF',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 15
  },
  perksContainer: {
    marginTop: 10
  },
  perkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15
  },
  perkIcon: {
    marginRight: 12
  },
  perkText: {
    fontSize: 16,
    color: '#555'
  },
  noPerksText: {
    fontSize: 16,
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 15,
    marginHorizontal: 5
  },
  manageButton: {
    backgroundColor: '#EDF0FF',
    borderWidth: 1,
    borderColor: '#3A7BFF'
  },
  renewButton: {
    backgroundColor: '#3A7BFF'
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8
  },
  manageButtonText: {
    color: '#3A7BFF'
  },
  renewButtonText: {
    color: 'white'
  }
});
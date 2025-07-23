import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator, 
  Alert, 
  TouchableOpacity,
  ImageBackground,
  Dimensions,
  TextInput,
  ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import api from '../src/api';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.9;

export default function SubscriptionPlans({ route, navigation }) {
  // Safely handle route.params with default values
  const params = route.params || {};
  const returnScreen = params.returnScreen || 'Main';
  const images = params.images || [];
  const propertyId = params.propertyId || null;

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [currentSub, setCurrentSub] = useState(null);
  const [loadingSub, setLoadingSub] = useState(true);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [discountedPrices, setDiscountedPrices] = useState({});
  const [applyingPromo, setApplyingPromo] = useState(false);

  useEffect(() => {
    fetchPlans();
    fetchCurrentSubscription();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await api.get('/main/subscription-plans/');
      setPlans(res.data);
      if (res.data.length > 0) {
        setSelectedPlan(res.data[0].id);
      }
    } catch (err) {
      console.error('Fetch plans error:', err);
      Alert.alert('Error', 'Could not load subscription plans. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentSubscription = async () => {
    try {
      const res = await api.get('/main/user-subscriptions/current/');
      if (res.status === 200) {
        setCurrentSub(res.data);
      } else {
        setCurrentSub(null);
      }
    } catch (err) {
      if (err.response?.status === 204) {
        setCurrentSub(null);
      } else {
        console.error('Fetch current subscription error:', err);
      }
    } finally {
      setLoadingSub(false);
    }
  };

  const applyPromoCode = async () => {
    if (!promoCode.trim() || !selectedPlan) {
      Alert.alert('Error', 'Please enter a promo code and select a plan');
      return;
    }

    setApplyingPromo(true);
    try {
      const res = await api.post('/main/subscription-payments/preview/', {
        plan: selectedPlan,
        promo_code: promoCode.trim()
      });

      if (res.data.amount) {
        setAppliedPromo(promoCode.trim());
        setDiscountedPrices(prev => ({
          ...prev,
          [selectedPlan]: res.data.amount
        }));
        Alert.alert('Success', 'Promo code applied successfully!');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to apply promo code';
      Alert.alert('Error', errorMsg);
      setAppliedPromo(null);
    } finally {
      setApplyingPromo(false);
    }
  };

  const renderPerk = (perk) => {
    const perkIcons = {
      featured: 'star',
      urgent: 'flash',
      top: 'arrow-up',
      highlight: 'highlight',
      unlimited: 'infinity',
      support: 'headset'
    };
    
    return (
      <View key={perk.code} style={styles.perkItem}>
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

  const handleSelectPlan = (item) => {
    if (currentSub && currentSub.plan !== item.slug) {
      Alert.alert(
        'Subscription Active',
        `You already have an active subscription (${currentSub.plan}). Please wait until it expires.`
      );
      return;
    }
    
    // Clear promo when switching plans
    if (selectedPlan !== item.id) {
      setAppliedPromo(null);
    }
    
    setSelectedPlan(item.id);
  };

  const handleProceedToCheckout = (item) => {
    const finalPrice = discountedPrices[item.id] || item.price;
    
    navigation.navigate('SubscriptionCheckout', {
      planId: item.id,
      promoCode: appliedPromo || null,
      amount: finalPrice,
      returnScreen,
      images,
      propertyId
    });
  };

  if (loading || loadingSub) {
    return (
      <ImageBackground
        source={require('../assets/gradient-bg.jpg')}
        style={styles.loadingContainer}
        blurRadius={2}
      >
        <ActivityIndicator size="large" color="#3A7BFF" />
        <Text style={styles.loadingText}>Loading Plans...</Text>
      </ImageBackground>
    );
  }

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../assets/gradient-bg.jpg')}
        style={styles.header}
        blurRadius={1}
      >
        <TouchableOpacity 
          style={styles.homeButton} 
          onPress={() => navigation.navigate('Main')}
        >
          <Ionicons name="home" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Your Plan</Text>
        <Text style={styles.headerSubtitle}>Get more visibility for your properties</Text>
      </ImageBackground>

      <ScrollView style={styles.content}>
        {selectedPlan && (
          <>
            <Text style={styles.sectionTitle}>Have a Promo Code?</Text>
            <View style={styles.promoRow}>
              <TextInput
                placeholder="Enter promo code"
                autoCapitalize="characters"
                value={promoCode}
                onChangeText={setPromoCode}
                style={styles.promoInput}
                editable={!applyingPromo}
              />
              <TouchableOpacity 
                style={[
                  styles.applyButton, 
                  appliedPromo && styles.appliedButton
                ]}
                onPress={applyPromoCode}
                disabled={applyingPromo}
              >
                {applyingPromo ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.applyButtonText}>
                    {appliedPromo ? 'Applied' : 'Apply'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}

        <Text style={styles.sectionTitle}>Available Plans</Text>
        
        {plans.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="error-outline" size={50} color="#888" />
            <Text style={styles.emptyText}>No subscription plans available</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={fetchPlans}
            >
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={plans}
            keyExtractor={plan => plan.slug}
            renderItem={({ item }) => {
              const isSelected = selectedPlan === item.id;
              const finalPrice = discountedPrices[item.id] || item.price;
              const hasDiscount = finalPrice !== item.price;
              
              return (
                <TouchableOpacity 
                  onPress={() => handleSelectPlan(item)}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={isSelected ? ['#4361EE', '#3A0CA3'] : ['#FFFFFF', '#F8F9FF']}
                    start={[0, 0]}
                    end={[1, 1]}
                    style={[
                      styles.card,
                      isSelected && styles.selectedCard
                    ]}
                  >
                    {item.is_popular && (
                      <View style={styles.popularBadge}>
                        <Text style={styles.popularText}>POPULAR</Text>
                      </View>
                    )}
                    
                    <Text style={[
                      styles.planName,
                      isSelected && styles.selectedText
                    ]}>
                      {item.display_name}
                    </Text>
                    
                    <View style={styles.priceContainer}>
                      {hasDiscount && (
                        <Text style={[
                          styles.originalPrice,
                          isSelected && styles.selectedOriginalPrice
                        ]}>
                          GH₵{item.price}
                        </Text>
                      )}
                      <Text style={[
                        styles.price,
                        isSelected && styles.selectedText
                      ]}>
                        GH₵{finalPrice}
                      </Text>
                      <Text style={[
                        styles.duration,
                        isSelected && styles.selectedTextLight
                      ]}>
                        / {item.duration_days} days
                      </Text>
                    </View>
                    
                    <Text style={[
                      styles.description,
                      isSelected && styles.selectedTextLight
                    ]}>
                      {item.description}
                    </Text>
                    
                    <View style={styles.perksContainer}>
                      <View style={styles.perkRow}>
                        <FontAwesome 
                          name="home" 
                          size={16} 
                          color={isSelected ? '#D0D7FF' : '#666'} 
                        />
                        <Text style={[
                          styles.perkLabel,
                          isSelected && styles.selectedTextLight
                        ]}>
                          {item.unlimited_listings ? 'Unlimited listings' : `${item.number_of_free_listings} free listings`}
                        </Text>
                      </View>
                      
                      {item.perks.map(renderPerk)}
                    </View>
                    
                    <TouchableOpacity
                      style={[
                        styles.selectButton,
                        isSelected ? styles.selectedButton : styles.unselectedButton
                      ]}
                      onPress={() => isSelected 
                        ? handleProceedToCheckout(item) 
                        : handleSelectPlan(item)
                      }
                    >
                      <Text style={isSelected ? styles.selectedButtonText : styles.unselectedButtonText}>
                        {isSelected ? 'Proceed to Checkout' : 'Choose Plan'}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark" size={18} color="white" style={{ marginLeft: 5 }} />
                      )}
                    </TouchableOpacity>
                  </LinearGradient>
                </TouchableOpacity>
              );
            }}
            contentContainerStyle={styles.list}
            scrollEnabled={false}
            ListFooterComponent={
              <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>Why Subscribe?</Text>
                <View style={styles.infoItem}>
                  <Ionicons name="eye" size={18} color="#3A7BFF" />
                  <Text style={styles.infoText}>Get 5x more property views</Text>
                </View>
                <View style={styles.infoItem}>
                  <Ionicons name="star" size={18} color="#3A7BFF" />
                  <Text style={styles.infoText}>Featured in top listings</Text>
                </View>
                <View style={styles.infoItem}>
                  <Ionicons name="flash" size={18} color="#3A7BFF" />
                  <Text style={styles.infoText}>Urgent listing badges</Text>
                </View>
              </View>
            }
          />
        )}
      </ScrollView>
    </View>
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
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden'
  },
  homeButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 8
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    maxWidth: '80%'
  },
  content: {
    flex: 1,
    paddingTop: 20
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginHorizontal: 20,
    marginBottom: 15,
    color: '#333'
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
  list: {
    paddingHorizontal: 20,
    paddingBottom: 30
  },
  card: {
    width: CARD_WIDTH,
    padding: 25,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#3A7BFF',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#EDF0FF',
    position: 'relative'
  },
  selectedCard: {
    borderColor: '#3A7BFF',
    shadowOpacity: 0.2,
    elevation: 8
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 15
  },
  popularText: {
    color: '#333',
    fontWeight: '700',
    fontSize: 12
  },
  planName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 5
  },
  selectedText: {
    color: 'white'
  },
  selectedTextLight: {
    color: 'rgba(255,255,255,0.9)'
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 15,
    flexWrap: 'wrap'
  },
  price: {
    fontSize: 32,
    fontWeight: '800',
    color: '#3A7BFF'
  },
  originalPrice: {
    fontSize: 22,
    fontWeight: '600',
    color: '#888',
    textDecorationLine: 'line-through',
    marginRight: 8
  },
  selectedOriginalPrice: {
    color: 'rgba(255,255,255,0.7)'
  },
  duration: {
    fontSize: 16,
    color: '#888',
    marginLeft: 5,
    marginBottom: 5
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20
  },
  perksContainer: {
    marginBottom: 25
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15
  },
  perkLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
    marginLeft: 10
  },
  perkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  perkIcon: {
    marginRight: 12
  },
  perkText: {
    fontSize: 15,
    color: '#555'
  },
  selectButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 15
  },
  selectedButton: {
    backgroundColor: 'white'
  },
  unselectedButton: {
    backgroundColor: '#3A7BFF'
  },
  selectedButtonText: {
    color: '#3A7BFF',
    fontWeight: '700',
    fontSize: 16
  },
  unselectedButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16
  },
  infoBox: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginTop: 15,
    marginBottom: 50,
    borderWidth: 1,
    borderColor: 'red'
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 15
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  infoText: {
    fontSize: 15,
    color: '#555',
    marginLeft: 12
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: 'white',
    borderRadius: 20,
    marginHorizontal: 20
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 15,
    textAlign: 'center'
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 30,
    backgroundColor: '#3A7BFF',
    borderRadius: 15
  },
  retryText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16
  },
  promoRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center'
  },
  promoInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    backgroundColor: 'white',
    marginRight: 10
  },
  applyButton: {
    paddingHorizontal: 20,
    height: 44,
    backgroundColor: '#3A7BFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80
  },
  appliedButton: {
    backgroundColor: '#4CAF50'
  },
  applyButtonText: {
    color: 'white',
    fontWeight: '600'
  }
});
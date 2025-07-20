import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { PUBLIC_KEY } from '../src/constant';
import api from '../src/api';

export default function SubscriptionCheckout({ route, navigation }) {
  const { 
    planId, 
    promoCode = null, 
    amount,
    returnScreen = 'MySubscriptions', 
    images,
    propertyId  // Get propertyId from params
  } = route.params;
  
  const [userEmail, setUserEmail] = useState(null);
  const [accessCode, setAccessCode] = useState(null);
  const [paymentReference, setPaymentReference] = useState(null);
  const [price, setPrice] = useState(null);
  const [loading, setLoading] = useState(true);

  const initEndpoint = "/main/subscription-payments/";
  const verifyEndpoint = "/main/payments/verify-subscription/";

  useEffect(() => {
    (async () => {
      try {
        // 1) fetch user email
        const { data: me } = await api.get('/core/user/me/');
        setUserEmail(me.email);

        // 2) initialize subscription payment with promo code
        const payload = { plan: planId };
        if (promoCode) {
          payload.promo_code = promoCode;
        }

        const { data } = await api.post(initEndpoint, payload);
        setAccessCode(data.access_code);
        setPaymentReference(data.payment_ref || data.payment_reference);
        setPrice(data.amount);
      } catch (err) {
        console.error('Subscription init error:', err.response?.data || err);
        Alert.alert(
          'Payment Error', 
          err.response?.data?.detail || 'Could not start subscription payment.'
        );
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    })();
  }, [planId, promoCode]);

  const onMessage = async ({ nativeEvent }) => {
    try {
      const msg = JSON.parse(nativeEvent.data);
      if (msg.status === 'success') {
        // verify payment
        await api.post(verifyEndpoint, { reference: msg.reference });
        
        Alert.alert('Success', 'Subscription activated.', [
          {
            text: 'OK',
            onPress: () => {
              // Pass propertyId back to AddImages
              navigation.replace(returnScreen, {
                paid: true,
                images,
                propertyId  // Add propertyId here
              });
            }
          },
        ]);
      } else if (msg.status === 'cancelled') {
        navigation.goBack();
      }
    } catch (e) {
      console.error('WebView msg error:', e);
      Alert.alert('Error', 'Could not process payment result');
    }
  };

  if (loading || price === null || accessCode === null || paymentReference === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>Preparing payment...</Text>
      </View>
    );
  }

  const html = `
    <!DOCTYPE html><html><head>
      <meta name="viewport" content="width=device-width,initial-scale=1"/>
      <script src="https://js.paystack.co/v1/inline.js"></script>
    </head><body>
      <script>
        PaystackPop.setup({
          key: '${PUBLIC_KEY}',
          email: '${userEmail}',
          amount: ${price * 100},
          currency: 'GHS',
          access_code: '${accessCode}',
          ref: '${paymentReference}',
          callback: function(resp) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ 
              status:'success', 
              reference:resp.reference 
            }));
          },
          onClose: function() {
            window.ReactNativeWebView.postMessage(JSON.stringify({ 
              status:'cancelled' 
            }));
          }
        }).openIframe();
      </script>
    </body></html>
  `;

  return (
    <WebView
      source={{ html }}
      onMessage={onMessage}
      javaScriptEnabled
      domStorageEnabled
      startInLoadingState
      style={styles.webview}
    />
  );
}

const styles = StyleSheet.create({
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#F8F9FF'
  },
  webview: { flex: 1 },
});
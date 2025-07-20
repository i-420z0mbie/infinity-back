// src/components/PaystackPayment.jsx
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Text, Alert, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import { PUBLIC_KEY } from "../src/constant";
import api from "../src/api";

export default function PaystackPayment({ route, navigation }) {
  const { amount, propertyId, promoCode, returnScreen, images } = route.params;
  const [userEmail, setUserEmail] = useState(null);
  const [paymentReference, setPaymentReference] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const createEndpoint = "/main/listing-payments/";
  const verifyEndpoint = "/main/payments/verify-listing/";

  useEffect(() => {
    async function initialize() {
      try {
        // Fetch current user email
        const { data: userData } = await api.get('/core/user/me/');
        setUserEmail(userData.email);
      } catch (e) {
        console.error('Error fetching user info:', e);
        setError('Unable to fetch user email');
      }

      if (!PUBLIC_KEY) {
        setError("Paystack public key is missing");
        setLoading(false);
        Alert.alert("Configuration Error", "Paystack public key is not configured.");
        return;
      }

      try {
        // Create listing payment record
        const payload = { property_id: propertyId, amount };
        if (promoCode) payload.promo_code = promoCode;
        const { data } = await api.post(createEndpoint, payload);
        setPaymentReference(data.payment_ref || data.payment_reference);
      } catch (err) {
        console.error("Error creating listing payment record:", err.response?.data || err);
        setError("Unable to initiate payment.");
        Alert.alert("Payment Error", err.response?.data?.[0] || err.message || "Could not start payment.");
      } finally {
        setLoading(false);
      }
    }
    initialize();
  }, [propertyId, amount, promoCode]);

  if (loading || !userEmail) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>{error || 'Loading…'}</Text>
      </View>
    );
  }

  const handleSuccess = async ({ reference }) => {
    try {
      await api.post(verifyEndpoint, { reference });
      navigation.replace(returnScreen, { propertyId, paymentRef: reference, paid: true, images });
    } catch (err) {
      console.error("Payment verification error:", err);
      Alert.alert(
        "Verification Failed",
        `Payment was made but verification failed. Please contact support.\n${err.message}`
      );
    }
  };

  const html = `
    <!DOCTYPE html><html><head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <script src="https://js.paystack.co/v1/inline.js"></script>
    </head><body>
      <script>
        document.addEventListener('DOMContentLoaded', () => {
          setTimeout(() => {
            try {
              const handler = PaystackPop.setup({
                key: '${PUBLIC_KEY}',
                email: '${userEmail}',
                amount: ${amount} * 100,
                currency: 'GHS',
                ref: '${paymentReference}',
                onClose: () => {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ status: 'cancelled' }));
                },
                callback: (resp) => {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    status: 'success',
                    reference: resp.reference
                  }));
                }
              });
              handler.openIframe();
            } catch (e) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                status: 'error',
                message: e.message
              }));
            }
          }, 500);
        });
      </script>
    </body></html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={["*"]}
        source={{ html }}
        onMessage={({ nativeEvent }) => {
          try {
            const msg = JSON.parse(nativeEvent.data);
            if (msg.status === "success") handleSuccess(msg);
            else if (msg.status === "cancelled") navigation.goBack();
            else Alert.alert("Payment Error", msg.message || "An error occurred");
          } catch (e) {
            console.error("WebView message parse error:", e);
          }
        }}
        javaScriptEnabled
a domStorageEnabled
        startInLoadingState
        renderLoading={() => (
          <View style={styles.center}>
            <ActivityIndicator size="large" />
          </View>
        )}
        style={styles.webview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  webview: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16 },
  loadingText: { marginTop: 12, fontSize: 16 },
  errorText: { color: "red", fontSize: 16, textAlign: "center" },
});

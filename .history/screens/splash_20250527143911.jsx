import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

export default function Splash() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>z0mbie Real Estate</Text>
      <ActivityIndicator size="large" color="#fff" style={styles.indicator} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 32,
    // fontFamily: 'LeckerliOne-Regular',
  },
  indicator: {
    marginTop: 20,
  },
});
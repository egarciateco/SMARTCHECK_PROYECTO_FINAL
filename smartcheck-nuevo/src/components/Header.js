import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Text } from 'react-native';

const Header = ({ navigation, onShare, showBackButton = false, showShareButton = true }) => {
  return (
    <View style={styles.header}>
      <View style={styles.leftContainer}>
        {showBackButton && (
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
        )}
        
        <Image 
          source={require('../../assets/logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        
        <Text style={styles.appName}>SmartCheck</Text>
      </View>
      
      {onShare && showShareButton && (
        <TouchableOpacity 
          onPress={onShare} 
          style={styles.shareButton}
          activeOpacity={0.7}
        >
          <Text style={styles.shareIcon}>📥</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#001f3f',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    minHeight: 100,
    elevation: 5,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 4,
  },
  backButtonText: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 10,
  },
  appName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.5,
  },
  shareButton: {
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 25,
    minWidth: 45,
    minHeight: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareIcon: {
    fontSize: 24,
    color: '#fff',
  },
});

export default Header;
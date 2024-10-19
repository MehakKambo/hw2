import React, { useState, useEffect } from 'react';
import { View, Button, Switch, Text, StyleSheet, Image, Alert, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

export default function HomeScreen() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);

  // Dark Mode
  const toggleSwitch = async () => {
    const newValue = !isDarkMode;
    setIsDarkMode(newValue);
    try {
      await AsyncStorage.setItem('darkMode', JSON.stringify(newValue));
      alert('Dark Mode settings saved!');
    } catch (error) {
      console.log(error);
    }
  };

  // Load dark mode preference from local storage on app startup
  const loadDarkModePreference = async () => {
    try {
      const value = await AsyncStorage.getItem('darkMode');
      if (value !== null) {
        const savedValue = JSON.parse(value);
        setIsDarkMode(savedValue);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Pick an image from the user's gallery
  const pickImage = async () => {
    let result = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!result.granted) {
      // Show an alert with options to try again or exit
      Alert.alert(
        "Permission Required",
        "You won't be able to use this app without media library access. Please grant permission to proceed.",
        [
          {
            text: "Try Again",
            onPress: async () => {
              // Re-request permission
              const newResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (!newResult.granted) {
                // Still denied, show the same alert again
                pickImage();
              }
            },
          },
          {
            text: "Go to Settings",
            onPress: () => Linking.openSettings(),  // Open device settings so user can grant permission
            style: "cancel",
          },
        ],
        { cancelable: false }
      );
      return;
    }

    let pickedImage = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!pickedImage.canceled && pickedImage.assets && pickedImage.assets.length > 0) {
      saveImageLocally(pickedImage.assets[0].uri);
    }
  };

  // Save image locally using FileSystem
  const saveImageLocally = async (uri: string) => {
    const fileName = uri.split('/').pop();  // Get the file name from URI
    const newUri = `${FileSystem.documentDirectory}${fileName}`;  // Create a new file path in local storage
    await FileSystem.moveAsync({
      from: uri,
      to: newUri,
    });
    setImageUri(newUri);  // Store and display the saved image
    alert('Image saved locally!');
    await AsyncStorage.setItem('savedImage', newUri);  // Save image URI in AsyncStorage
  };

  // Load the saved image URI from AsyncStorage
  const loadImage = async () => {
    try {
      const savedUri = await AsyncStorage.getItem('savedImage');
      if (savedUri) {
        setImageUri(savedUri);  // Display the saved image if it exists
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Load dark mode preference and image on app startup
  useEffect(() => {
    loadDarkModePreference();
    loadImage();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#333' : '#fff' }]}>
      <Text style={[styles.header, { color: isDarkMode ? '#fff' : '#000' }]}>1. Settings Storage</Text>

      {/* Dark Mode Toggle */}
      <View style={styles.switchContainer}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
          <Text style={{ color: isDarkMode ? '#fff' : '#000' }}>Enable Dark Mode</Text>
          <Switch
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={isDarkMode ? "#f5dd4b" : "#f4f3f4"}
            ios_backgroundColor="#3e3e3e"
            onValueChange={toggleSwitch}
            value={isDarkMode}
            style={{ marginLeft: 20 }}
          />
        </View>
      </View>

      {/* Image Selection and Display */}
      <Text style={[styles.header, { color: isDarkMode ? '#fff' : '#000' }]}>2. Media Storage</Text>
      <Button title="Pick and Save Image" onPress={pickImage} />
      {imageUri && <Image source={{ uri: imageUri }} style={styles.image} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: 10,
  },
  storedSetting: {
    marginVertical: 20,
    fontSize: 16,
  },
  image: {
    width: 300,
    height: 300,
    marginTop: 30,
  },
});

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../store/AuthContext";
import { authService } from "../services/auth.service";

const PLAY_STYLES = [
  "speedball",
  "tournament",
  "mechanical",
  "pump",
  "recball",
  "woodsball",
  "scenario",
  "big_game",
  "magfed",
];
const SKILL_LEVELS = ["beginner", "intermediate", "advanced", "pro"];

export default function EditProfileScreen({ navigation }: any) {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Form state
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [country, setCountry] = useState(user?.country || "");
  const [stateProvince, setStateProvince] = useState(user?.stateProvince || "");
  const [city, setCity] = useState(user?.city || "");
  const [homeField, setHomeField] = useState(user?.homeField || "");
  const [favoritePosition, setFavoritePosition] = useState(
    user?.favoritePosition || "",
  );
  const [playStyle, setPlayStyle] = useState<string[]>(user?.playStyle || []);
  const [skillLevel, setSkillLevel] = useState(user?.skillLevel || "");

  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [bannerUri, setBannerUri] = useState<string | null>(null);

  const pickImage = async (type: "avatar" | "banner") => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert("Permission needed", "Please grant photo library access");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === "avatar" ? [1, 1] : [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      if (type === "avatar") {
        setAvatarUri(result.assets[0].uri);
      } else {
        setBannerUri(result.assets[0].uri);
      }
    }
  };

  const togglePlayStyle = (style: string) => {
    if (playStyle.includes(style)) {
      setPlayStyle(playStyle.filter((s) => s !== style));
    } else {
      setPlayStyle([...playStyle, style]);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);
    setSaveError("");

    try {
      // Upload images first if changed
      if (avatarUri) {
        await authService.uploadAvatar(avatarUri);
      }

      if (bannerUri) {
        await authService.uploadBanner(bannerUri);
      }

      // Update profile data
      await authService.updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        displayName: displayName.trim(),
        bio: bio.trim(),
        country: country.trim(),
        stateProvince: stateProvince.trim(),
        city: city.trim(),
        homeField: homeField.trim(),
        favoritePosition: favoritePosition.trim(),
        playStyle,
        skillLevel: skillLevel || null,
      });

      // Refresh user data
      await refreshUser();

      setSaved(true);
      setTimeout(() => navigation.goBack(), 650);
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Profile changes could not be saved.";
      setSaveError(message);
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        {/* Banner */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Banner Image</Text>
          <TouchableOpacity
            style={styles.imagePicker}
            onPress={() => pickImage("banner")}
          >
            {bannerUri || user?.bannerUrl ? (
              <Image
                source={{ uri: bannerUri || user?.bannerUrl }}
                style={styles.bannerPreview}
              />
            ) : (
              <View style={styles.bannerPlaceholder}>
                <Text style={styles.placeholderText}>Tap to select banner</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Avatar */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Avatar</Text>
          <TouchableOpacity
            style={styles.avatarPicker}
            onPress={() => pickImage("avatar")}
          >
            {avatarUri || user?.avatarUrl ? (
              <Image
                source={{ uri: avatarUri || user?.avatarUrl }}
                style={styles.avatarPreview}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.placeholderText}>Tap to select avatar</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <Text style={styles.label}>First Name</Text>
          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Enter first name"
            placeholderTextColor="#666"
          />

          <Text style={styles.label}>Last Name</Text>
          <TextInput
            style={styles.input}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Enter last name"
            placeholderTextColor="#666"
          />

          <Text style={styles.label}>Display Name</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Enter display name"
            placeholderTextColor="#666"
          />

          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell us about yourself..."
            placeholderTextColor="#666"
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Paintball Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paintball Profile</Text>

          <Text style={styles.label}>Play Style</Text>
          <View style={styles.chipContainer}>
            {PLAY_STYLES.map((style) => (
              <TouchableOpacity
                key={style}
                style={[
                  styles.chip,
                  playStyle.includes(style) && styles.chipSelected,
                ]}
                onPress={() => togglePlayStyle(style)}
              >
                <Text
                  style={[
                    styles.chipText,
                    playStyle.includes(style) && styles.chipTextSelected,
                  ]}
                >
                  {style}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Skill Level</Text>
          <View style={styles.chipContainer}>
            {SKILL_LEVELS.map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.chip,
                  skillLevel === level && styles.chipSelected,
                ]}
                onPress={() => setSkillLevel(level)}
              >
                <Text
                  style={[
                    styles.chipText,
                    skillLevel === level && styles.chipTextSelected,
                  ]}
                >
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Home Field</Text>
          <TextInput
            style={styles.input}
            value={homeField}
            onChangeText={setHomeField}
            placeholder="Enter your home field"
            placeholderTextColor="#666"
          />

          <Text style={styles.label}>Favorite Position</Text>
          <TextInput
            style={styles.input}
            value={favoritePosition}
            onChangeText={setFavoritePosition}
            placeholder="e.g., Front, Back, Snake"
            placeholderTextColor="#666"
          />
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>

          <Text style={styles.label}>City</Text>
          <TextInput
            style={styles.input}
            value={city}
            onChangeText={setCity}
            placeholder="Enter city"
            placeholderTextColor="#666"
          />

          <Text style={styles.label}>State/Province</Text>
          <TextInput
            style={styles.input}
            value={stateProvince}
            onChangeText={setStateProvince}
            placeholder="Enter state or province"
            placeholderTextColor="#666"
          />

          <Text style={styles.label}>Country</Text>
          <TextInput
            style={styles.input}
            value={country}
            onChangeText={setCountry}
            placeholder="Enter country"
            placeholderTextColor="#666"
          />
        </View>

        {/* Save Button */}
        {!!saveError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{saveError}</Text>
          </View>
        )}
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>
              {saved ? "✓  Saved" : "Save Changes"}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#101516",
  },
  form: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: "#ccc",
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: "#283033",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#333",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  imagePicker: {
    marginBottom: 16,
  },
  bannerPreview: {
    width: "100%",
    height: 150,
    borderRadius: 8,
  },
  bannerPlaceholder: {
    width: "100%",
    height: 150,
    backgroundColor: "#283033",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#333",
    borderStyle: "dashed",
  },
  avatarPicker: {
    alignSelf: "center",
  },
  avatarPreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#283033",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#333",
    borderStyle: "dashed",
  },
  placeholderText: {
    color: "#666",
    fontSize: 12,
    textAlign: "center",
    padding: 20,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#283033",
    borderWidth: 1,
    borderColor: "#333",
  },
  chipSelected: {
    backgroundColor: "#D39A3A",
    borderColor: "#D39A3A",
  },
  chipText: {
    color: "#ccc",
    fontSize: 14,
    textTransform: "capitalize",
  },
  chipTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: "#D39A3A",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 24,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  errorBanner: {
    backgroundColor: "#271513",
    borderWidth: 1,
    borderColor: "#713A31",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  errorText: { color: "#F0A08E", fontSize: 12, fontWeight: "700" },
  cancelButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#666",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
});

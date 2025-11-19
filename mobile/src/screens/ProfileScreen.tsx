import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useAuth } from '../store/AuthContext';

export default function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => await logout(),
        },
      ]
    );
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No user data available</Text>
      </View>
    );
  }

  const displayName = user.displayName || user.username;
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');

  return (
    <ScrollView style={styles.container}>
      {/* Banner */}
      <View style={styles.banner}>
        {user.bannerUrl ? (
          <Image source={{ uri: user.bannerUrl }} style={styles.bannerImage} />
        ) : (
          <View style={styles.bannerPlaceholder} />
        )}
      </View>

      {/* Avatar */}
      <View style={styles.avatarContainer}>
        {user.avatarUrl ? (
          <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      {/* User Info */}
      <View style={styles.info}>
        <Text style={styles.displayName}>{displayName}</Text>
        {fullName && <Text style={styles.fullName}>{fullName}</Text>}
        <Text style={styles.username}>@{user.username}</Text>

        {user.bio && (
          <Text style={styles.bio}>{user.bio}</Text>
        )}

        {/* Stats */}
        <View style={styles.stats}>
          {user.skillLevel && (
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Skill Level</Text>
              <Text style={styles.statValue}>{user.skillLevel}</Text>
            </View>
          )}
          {user.playStyle && user.playStyle.length > 0 && (
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Play Style</Text>
              <Text style={styles.statValue}>
                {user.playStyle.join(', ')}
              </Text>
            </View>
          )}
        </View>

        {/* Details */}
        {(user.homeField || user.city) && (
          <View style={styles.details}>
            {user.homeField && (
              <View style={styles.detail}>
                <Text style={styles.detailLabel}>Home Field</Text>
                <Text style={styles.detailValue}>{user.homeField}</Text>
              </View>
            )}
            {user.city && (
              <View style={styles.detail}>
                <Text style={styles.detailLabel}>Location</Text>
                <Text style={styles.detailValue}>
                  {[user.city, user.stateProvince, user.country]
                    .filter(Boolean)
                    .join(', ')}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.primaryButtonText}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleLogout}
          >
            <Text style={styles.secondaryButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  banner: {
    height: 150,
    backgroundColor: '#2a2a2a',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2a2a2a',
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: -60,
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#1a1a1a',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#007AFF',
    borderWidth: 4,
    borderColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  info: {
    padding: 20,
  },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  fullName: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 4,
  },
  username: {
    fontSize: 16,
    color: '#007AFF',
    textAlign: 'center',
    marginTop: 4,
  },
  bio: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 20,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#2a2a2a',
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'capitalize',
  },
  details: {
    marginTop: 24,
  },
  detail: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#fff',
  },
  actions: {
    marginTop: 32,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ff3b30',
  },
  secondaryButtonText: {
    color: '#ff3b30',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#ff3b30',
    textAlign: 'center',
    marginTop: 40,
  },
});

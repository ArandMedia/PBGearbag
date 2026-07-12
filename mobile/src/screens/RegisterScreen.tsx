import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Alert } from '../utils/alert';
import { useAuth } from '../store/AuthContext';

export default function RegisterScreen({ navigation }: any) {
  const { register, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [ageConfirmed,setAgeConfirmed]=useState(false);
  const [acceptedTerms,setAcceptedTerms]=useState(false);

  const handleRegister = async () => {
    // Validation
    if (!email.trim() || !username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }
    if(!ageConfirmed||!acceptedTerms){Alert.alert('Confirm launch policies','You must confirm the minimum account age and accept the Terms, Privacy Policy, Marketplace Rules, and Community Code.');return}

    try {
      await register({
        email: email.trim(),
        username: username.trim(),
        password,
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        ageConfirmed,
        acceptedTerms,
      });
      // Navigation will happen automatically
    } catch (err: any) {
      Alert.alert(
        'Registration Failed',
        err.response?.data?.error?.message || err.response?.data?.message || 'Unable to create account'
      );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join the Paintball Community</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email *"
            placeholderTextColor="#666"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Username *"
            placeholderTextColor="#666"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="First Name"
              placeholderTextColor="#666"
              value={firstName}
              onChangeText={setFirstName}
              editable={!loading}
            />

            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Last Name"
              placeholderTextColor="#666"
              value={lastName}
              onChangeText={setLastName}
              editable={!loading}
            />
          </View>

          <TextInput
            style={styles.input}
            placeholder="Password *"
            placeholderTextColor="#666"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Confirm Password *"
            placeholderTextColor="#666"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
            editable={!loading}
          />

          <Text style={styles.helperText}>
            Password must be at least 8 characters with uppercase, lowercase, and number
          </Text>
          <TouchableOpacity style={styles.checkRow} onPress={()=>setAgeConfirmed(!ageConfirmed)}><View style={[styles.check,ageConfirmed&&styles.checkOn]}><Text style={styles.checkMark}>{ageConfirmed?'✓':''}</Text></View><Text style={styles.checkText}>I confirm I meet the minimum account age for my location.</Text></TouchableOpacity>
          <TouchableOpacity style={styles.checkRow} onPress={()=>setAcceptedTerms(!acceptedTerms)}>
            <View style={[styles.check,acceptedTerms&&styles.checkOn]}><Text style={styles.checkMark}>{acceptedTerms?'✓':''}</Text></View>
            <Text style={styles.checkText}>
              I accept the{' '}
              <Text style={styles.checkLink} onPress={()=>navigation.navigate('Legal',{doc:'terms'})}>Terms</Text>
              {', '}
              <Text style={styles.checkLink} onPress={()=>navigation.navigate('Legal',{doc:'privacy'})}>Privacy Policy</Text>
              {', '}
              <Text style={styles.checkLink} onPress={()=>navigation.navigate('Legal',{doc:'marketplace'})}>Marketplace Rules</Text>
              {', and '}
              <Text style={styles.checkLink} onPress={()=>navigation.navigate('Legal',{doc:'community'})}>Community Code</Text>.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate('Login')}
            disabled={loading}
          >
            <Text style={styles.linkText}>
              Already have an account? <Text style={styles.linkTextBold}>Login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101516',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#888',
  },
  form: {
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  input: {
    backgroundColor: '#283033',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
  },
  halfInput: {
    width: '48%',
  },
  helperText: {
    color: '#666',
    fontSize: 12,
    marginBottom: 16,
    marginTop: -8,
  },
  button: {
    backgroundColor: '#D39A3A',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#888',
    fontSize: 14,
  },
  linkTextBold: {
    color: '#D39A3A',
    fontWeight: '600',
  },
  checkRow:{flexDirection:'row',alignItems:'flex-start',gap:10,marginBottom:12},check:{width:22,height:22,borderRadius:6,borderWidth:1,borderColor:'#46515a',alignItems:'center',justifyContent:'center'},checkOn:{backgroundColor:'#A8C84A',borderColor:'#A8C84A'},checkMark:{color:'#10150d',fontWeight:'900'},checkText:{color:'#aab3ba',fontSize:12,lineHeight:18,flex:1},checkLink:{color:'#D39A3A',fontWeight:'700',textDecorationLine:'underline'},
});

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
  ImageBackground,
} from 'react-native';
import { Alert } from '../utils/alert';
import { useAuth } from '../store/AuthContext';
import PBGLogo from '../components/PBGLogo';
const hero = require('../../assets/brand/pbgearbag-hero-v1.jpg');

export default function LoginScreen({ navigation }: any) {
  const { login, loading, error } = useAuth();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!usernameOrEmail.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await login({ usernameOrEmail: usernameOrEmail.trim(), password });
      // Navigation will happen automatically via AuthContext
    } catch (err: any) {
      Alert.alert('Login Failed', err.response?.data?.error?.message || err.response?.data?.message || 'Invalid credentials');
    }
  };

  return (
    <ImageBackground source={hero} style={styles.background} imageStyle={styles.backgroundImage}>
      <View style={styles.overlay}/>
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.split}>
        <View style={styles.pitch}>
          <Text style={styles.pitchKicker}>THE PAINTBALL NETWORK</Text>
          <Text style={styles.pitchTitle}>Stay close to the game.</Text>
          <Text style={styles.pitchCopy}>One home for the people, places, gear, and moments that make paintball worth coming back to.</Text>
          <View style={styles.benefit}><Text style={styles.bullet}>✦</Text><View><Text style={styles.benefitTitle}>Find your next day out</Text><Text style={styles.benefitCopy}>Discover fields, events, and teams matched to how you play.</Text></View></View>
          <View style={styles.benefit}><Text style={styles.bullet}>✦</Text><View><Text style={styles.benefitTitle}>Keep your gear moving</Text><Text style={styles.benefitCopy}>Track your setup and trade with players who get it.</Text></View></View>
          <View style={styles.benefit}><Text style={styles.bullet}>✦</Text><View><Text style={styles.benefitTitle}>Build your paintball circle</Text><Text style={styles.benefitCopy}>Share clips, follow players, and never miss the field feed.</Text></View></View>
          <Text style={styles.promise}>Free to join. No pressure. Just more ways to play.</Text>
        </View>
        <View style={styles.form}>
          <View style={styles.brandRow}><PBGLogo size={95} textSize={26} style={{ marginRight: -16 }} /><Text style={styles.brandName}>Gearbag</Text></View>
          <Text style={styles.kicker}>THE PAINTBALL NETWORK</Text>
          <Text style={styles.title}>Get back in the game.</Text>
          <Text style={styles.subtitle}>Your gear, your people, and your next field day are waiting.</Text>
          <TextInput
            style={styles.input}
            placeholder="Username or Email"
            placeholderTextColor="#666"
            value={usernameOrEmail}
            onChangeText={setUsernameOrEmail}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#666"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            editable={!loading}
          />

          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}
          <TouchableOpacity style={styles.forgot} onPress={()=>navigation.navigate('ForgotPassword')}><Text style={styles.forgotText}>Forgot password?</Text></TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Enter PBGearbag  →</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Register')}
            disabled={loading}
          >
            <Text style={styles.secondaryButtonText}>Create Account</Text>
          </TouchableOpacity>
        </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    <View style={styles.fieldNote}><Text style={styles.fieldNoteTitle}>FIELD STATUS</Text><Text style={styles.fieldNoteText}>●  Community network online</Text></View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background:{flex:1,backgroundColor:'#060809'},backgroundImage:{resizeMode:'cover'},overlay:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(2,4,5,.55)'},
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  split:{width:'100%',maxWidth:1120,alignSelf:'center',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:34},
  pitch:{flex:1,maxWidth:520,paddingHorizontal:12},
  pitchKicker:{color:'#A8C84A',fontSize:11,fontWeight:'900',letterSpacing:2,marginBottom:14},
  pitchTitle:{color:'#fff',fontSize:48,fontWeight:'900',lineHeight:52,letterSpacing:-1.5},
  pitchCopy:{color:'#b8c1c7',fontSize:18,lineHeight:27,marginTop:14,marginBottom:26},
  benefit:{flexDirection:'row',gap:12,marginBottom:18},
  bullet:{color:'#A8C84A',fontSize:20,fontWeight:'900'},
  benefitTitle:{color:'#fff',fontSize:16,fontWeight:'900'},
  benefitCopy:{color:'#96a1a8',fontSize:14,lineHeight:20,marginTop:3,maxWidth:360},
  promise:{color:'#A8C84A',fontSize:13,fontWeight:'800',marginTop:10},
  brandRow:{flexDirection:'row',alignItems:'center',marginBottom:28},brandName:{color:'#fff',fontSize:22,fontWeight:'900',letterSpacing:-0.3},kicker:{color:'#A8C84A',fontSize:10,fontWeight:'900',letterSpacing:1.7,marginBottom:11},
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 10,
    letterSpacing:-1.2,
  },
  subtitle: {
    fontSize: 18,
    color: '#aeb7be',
    lineHeight:24,
    marginBottom:28,
  },
  form: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    backgroundColor:'rgba(12,16,18,.90)',
    borderWidth:1,
    borderColor:'rgba(141,160,172,.3)',
    borderRadius:24,
    padding:30,
    shadowColor:'#000',shadowOpacity:.45,shadowRadius:30,shadowOffset:{width:0,height:18},
  },
  input: {
    backgroundColor: '#171c20',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#364047',
  },
  button: {
    backgroundColor: '#A8C84A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#10150d',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#ff3b30',
    marginBottom: 12,
    textAlign: 'center',
  },
  forgot:{alignSelf:'flex-end',marginTop:-5,marginBottom:10},forgotText:{color:'#A8C84A',fontSize:12,fontWeight:'800'},
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
  },
  dividerText: {
    color: '#666',
    marginHorizontal: 16,
    fontSize: 14,
  },
  secondaryButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#56636c',
  },
  secondaryButtonText: {
    color: '#dce3e8',
    fontSize: 16,
    fontWeight: '600',
  },
  fieldNote:{position:'absolute',right:24,bottom:22,backgroundColor:'rgba(6,9,10,.72)',borderWidth:1,borderColor:'#324039',borderRadius:12,paddingHorizontal:15,paddingVertical:11},fieldNoteTitle:{color:'#6e7c75',fontSize:9,fontWeight:'900',letterSpacing:1.3},fieldNoteText:{color:'#bde99c',fontSize:12,fontWeight:'700',marginTop:4},
});

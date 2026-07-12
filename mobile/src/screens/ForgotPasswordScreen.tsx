import React,{useState}from'react';import{Pressable,StyleSheet,Text,TextInput,View}from'react-native';import{authService}from'../services/auth.service';

function backToSignIn(navigation?:any){if(navigation){navigation.navigate('Login')}else if(typeof window!=='undefined'){window.location.href='/'}}

export default function ForgotPasswordScreen({navigation,initialToken}:{navigation?:any;initialToken?:string}){
  const[email,setEmail]=useState('');
  const[token]=useState(initialToken||'');
  const[password,setPassword]=useState('');
  const[confirmPassword,setConfirmPassword]=useState('');
  const[stage,setStage]=useState<'email'|'sent'|'reset'|'done'>(initialToken?'reset':'email');
  const[busy,setBusy]=useState(false);
  const[error,setError]=useState<string|null>(null);

  const send=async()=>{
    if(!email.trim())return;
    setBusy(true);setError(null);
    try{
      const r=await authService.forgotPassword(email.trim());
      // Dev/local backends echo the token directly so you can skip email
      // entirely; production never does, so real users always go to 'sent'.
      if(r.resetToken){setStage('reset')}else{setStage('sent')}
    }catch(err:any){
      setError(err.response?.data?.error?.message||err.response?.data?.message||'Something went wrong. Try again.');
    }finally{
      setBusy(false);
    }
  };

  const reset=async()=>{
    if(password.length<8||!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)){
      setError('Password must be at least 8 characters with uppercase, lowercase, and a number.');
      return;
    }
    if(password!==confirmPassword){
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);setError(null);
    try{
      await authService.resetPassword(token,password);
      setStage('done');
    }catch(err:any){
      setError(err.response?.data?.error?.message||err.response?.data?.message||'This link is invalid or expired. Request a new one.');
    }finally{
      setBusy(false);
    }
  };

  return<View style={s.page}><View style={s.card}>
    <Text style={s.kicker}>ACCOUNT RECOVERY</Text>
    <Text style={s.title}>
      {stage==='email'&&'Reset your password.'}
      {stage==='sent'&&'Check your email.'}
      {stage==='reset'&&'Choose a new password.'}
      {stage==='done'&&"You're all set."}
    </Text>
    <Text style={s.sub}>
      {stage==='email'&&'Enter the email for your PBGearbag account and we’ll send you a link to reset your password.'}
      {stage==='sent'&&`We sent a reset link to ${email.trim()}. Open it on this device to choose a new password.`}
      {stage==='reset'&&'Choose a strong password for your account.'}
      {stage==='done'&&'Your password has been changed. Sign in with your new password.'}
    </Text>

    {stage==='email'&&<>
      <TextInput style={s.input} value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor="#606b73" autoCapitalize="none"/>
      {error&&<Text style={s.errorText}>{error}</Text>}
      <Pressable style={s.primary} onPress={send} disabled={busy}><Text style={s.primaryText}>{busy?'Sending…':'Send reset instructions  →'}</Text></Pressable>
      <Pressable style={s.link} onPress={()=>backToSignIn(navigation)}><Text style={s.muted}>Back to sign in</Text></Pressable>
    </>}

    {stage==='sent'&&<>
      <Pressable style={s.primary} onPress={send} disabled={busy}><Text style={s.primaryText}>{busy?'Resending…':'Resend link'}</Text></Pressable>
      <Pressable style={s.link} onPress={()=>backToSignIn(navigation)}><Text style={s.muted}>Back to sign in</Text></Pressable>
    </>}

    {stage==='reset'&&<>
      <TextInput style={s.input} value={password} onChangeText={setPassword} placeholder="New password" placeholderTextColor="#606b73" secureTextEntry/>
      <TextInput style={s.input} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirm new password" placeholderTextColor="#606b73" secureTextEntry/>
      <Text style={s.helperText}>Password must be at least 8 characters with uppercase, lowercase, and a number.</Text>
      {error&&<Text style={s.errorText}>{error}</Text>}
      <Pressable style={s.primary} onPress={reset} disabled={busy}><Text style={s.primaryText}>{busy?'Resetting…':'Reset password  →'}</Text></Pressable>
      <Pressable style={s.link} onPress={()=>backToSignIn(navigation)}><Text style={s.muted}>Back to sign in</Text></Pressable>
    </>}

    {stage==='done'&&<Pressable style={s.primary} onPress={()=>backToSignIn(navigation)}><Text style={s.primaryText}>Continue to sign in  →</Text></Pressable>}
  </View></View>
}
const s=StyleSheet.create({page:{flex:1,backgroundColor:'#0A0E0F',alignItems:'center',justifyContent:'center',padding:20},card:{width:'100%',maxWidth:560,backgroundColor:'#121819',borderWidth:1,borderColor:'#2c353c',borderRadius:24,padding:30},kicker:{color:'#A8C84A',fontSize:9,fontWeight:'900',letterSpacing:1.5},title:{color:'#fff',fontSize:32,fontWeight:'900',marginTop:8},sub:{color:'#929da5',lineHeight:22,marginTop:10},input:{backgroundColor:'#171c20',borderWidth:1,borderColor:'#303a41',borderRadius:12,padding:14,color:'#fff',marginTop:16},helperText:{color:'#5f6972',fontSize:12,marginTop:8},errorText:{color:'#ff6b6b',fontSize:13,marginTop:10},primary:{backgroundColor:'#A8C84A',padding:16,borderRadius:12,alignItems:'center',marginTop:16},primaryText:{color:'#10150d',fontWeight:'900'},link:{padding:10,alignItems:'center',marginTop:4},muted:{color:'#6d7881'}});

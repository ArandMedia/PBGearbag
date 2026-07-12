import React,{useState,useEffect}from'react';import{Pressable,StyleSheet,Text,TextInput,View}from'react-native';import{useAuth}from'../store/AuthContext';import{authService}from'../services/auth.service';

function backToSignIn(){if(typeof window!=='undefined')window.location.href='/'}

export default function VerifyEmailScreen({initialToken}:{initialToken?:string}){
  const{user,verificationToken,verifyEmail,resendVerification,logout}=useAuth();
  const[token,setToken]=useState(initialToken||verificationToken||'');
  const[busy,setBusy]=useState(false);
  const[error,setError]=useState<string|null>(null);
  const[standaloneVerified,setStandaloneVerified]=useState(false);

  const go=async(t?:string)=>{
    const useToken=(t??token).trim();
    if(!useToken)return;
    setBusy(true);setError(null);
    try{
      if(user){
        await verifyEmail(useToken);
      }else{
        // No active session (link opened on a different device/browser than
        // registration) — verify directly against the public endpoint
        // instead of routing through AuthContext, which assumes a session.
        await authService.verifyEmail(useToken);
        setStandaloneVerified(true);
      }
    }catch(err:any){
      setError(err.response?.data?.error?.message||err.response?.data?.message||'This link is invalid or expired.');
    }finally{
      setBusy(false);
    }
  };

  useEffect(()=>{if(initialToken)void go(initialToken)},[]);// eslint-disable-line react-hooks/exhaustive-deps

  if(standaloneVerified){
    return<View style={s.page}><View style={s.card}>
      <View style={s.mark}><Text style={s.markText}>PBG</Text></View>
      <Text style={s.kicker}>EMAIL VERIFIED</Text>
      <Text style={s.title}>You're all set.</Text>
      <Text style={s.sub}>Your email is verified. Sign in to continue.</Text>
      <Pressable style={s.primary} onPress={backToSignIn}><Text style={s.primaryText}>Continue to sign in  →</Text></Pressable>
    </View></View>
  }

  return<View style={s.page}><View style={s.card}>
    <View style={s.mark}><Text style={s.markText}>PBG</Text></View>
    <Text style={s.kicker}>ONE LAST SAFETY CHECK</Text>
    <Text style={s.title}>Verify your email.</Text>
    <Text style={s.sub}>{user?`We sent verification instructions to ${user.email}. Verification protects marketplace and messaging trust.`:'Paste the verification token from your email, or open the link we sent you on this device.'}</Text>
    <TextInput style={s.input} value={token} onChangeText={setToken} placeholder="Paste verification token" placeholderTextColor="#5f6972" autoCapitalize="none"/>
    {error&&<Text style={s.errorText}>{error}</Text>}
    <Pressable style={s.primary} onPress={()=>go()} disabled={busy}><Text style={s.primaryText}>{busy?'Verifying…':'Verify and enter PBGearbag  →'}</Text></Pressable>
    {user&&<Pressable style={s.link} onPress={resendVerification}><Text style={s.linkText}>Resend verification</Text></Pressable>}
    {user?<Pressable style={s.link} onPress={logout}><Text style={s.muted}>Use another account</Text></Pressable>:<Pressable style={s.link} onPress={backToSignIn}><Text style={s.muted}>Back to sign in</Text></Pressable>}
    {verificationToken&&<Text style={s.dev}>Local testing token has been filled automatically.</Text>}
  </View></View>
}
const s=StyleSheet.create({page:{flex:1,backgroundColor:'#0A0E0F',alignItems:'center',justifyContent:'center',padding:20},card:{width:'100%',maxWidth:560,backgroundColor:'#121819',borderWidth:1,borderColor:'#2c353c',borderRadius:24,padding:30},mark:{width:44,height:44,borderRadius:13,backgroundColor:'#A8C84A',alignItems:'center',justifyContent:'center'},markText:{color:'#10150d',fontWeight:'900',fontSize:10},kicker:{color:'#A8C84A',fontSize:9,fontWeight:'900',letterSpacing:1.5,marginTop:26},title:{color:'#fff',fontSize:38,fontWeight:'900',marginTop:8},sub:{color:'#929da5',lineHeight:22,marginTop:10},input:{backgroundColor:'#171c20',borderWidth:1,borderColor:'#303a41',borderRadius:12,padding:14,color:'#fff',marginTop:22},errorText:{color:'#ff6b6b',fontSize:13,marginTop:10},primary:{backgroundColor:'#A8C84A',padding:16,borderRadius:12,alignItems:'center',marginTop:12},primaryText:{color:'#10150d',fontWeight:'900'},link:{padding:10,alignItems:'center'},linkText:{color:'#d2d9de',fontWeight:'800'},muted:{color:'#6d7881'},dev:{color:'#ff9a58',fontSize:10,textAlign:'center',marginTop:10}});

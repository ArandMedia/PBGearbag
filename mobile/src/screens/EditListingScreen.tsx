import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { marketplaceService } from '../services/marketplace.service';

export default function EditListingScreen({ route, navigation }: any) {
  const { listingId } = route.params;
  const [loading,setLoading]=useState(true); const [saving,setSaving]=useState(false);
  const [title,setTitle]=useState(''); const [description,setDescription]=useState(''); const [price,setPrice]=useState('');
  const [isNegotiable,setNegotiable]=useState(true); const [acceptsTrades,setTrades]=useState(false);
  useEffect(()=>{marketplaceService.getListing(listingId).then(x=>{setTitle(x.title);setDescription(x.description);setPrice(String(x.price));setNegotiable(x.isNegotiable);setTrades(x.acceptsTrades)}).catch(()=>Alert.alert('Error','Could not load listing')).finally(()=>setLoading(false))},[listingId]);
  const save=async()=>{if(!title.trim()||!description.trim()||!Number(price)){Alert.alert('Check your listing','Title, description, and a valid price are required.');return} setSaving(true);try{await marketplaceService.updateListing(listingId,{title:title.trim(),description:description.trim(),price:Number(price),isNegotiable,acceptsTrades});Alert.alert('Saved','Listing updated successfully.');navigation.replace('ListingDetail',{listingId})}catch(e:any){Alert.alert('Error',e.response?.data?.error?.message||'Could not update listing')}finally{setSaving(false)}};
  if(loading)return <View style={styles.center}><ActivityIndicator color="#A8C84A" size="large"/></View>;
  return <ScrollView style={styles.page} contentContainerStyle={styles.form}>
    <Text style={styles.label}>Title</Text><TextInput style={styles.input} value={title} onChangeText={setTitle}/>
    <Text style={styles.label}>Description</Text><TextInput style={[styles.input,styles.area]} value={description} onChangeText={setDescription} multiline/>
    <Text style={styles.label}>Price</Text><TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="decimal-pad"/>
    <TouchableOpacity style={styles.option} onPress={()=>setNegotiable(!isNegotiable)}><Text style={styles.optionText}>{isNegotiable?'✓':'○'} Price is negotiable</Text></TouchableOpacity>
    <TouchableOpacity style={styles.option} onPress={()=>setTrades(!acceptsTrades)}><Text style={styles.optionText}>{acceptsTrades?'✓':'○'} Open to trades</Text></TouchableOpacity>
    <TouchableOpacity style={styles.save} disabled={saving} onPress={save}><Text style={styles.saveText}>{saving?'Saving…':'Save changes'}</Text></TouchableOpacity>
  </ScrollView>;
}
const styles=StyleSheet.create({page:{flex:1,backgroundColor:'#0b0d10'},form:{width:'100%',maxWidth:760,alignSelf:'center',padding:24,paddingBottom:60},center:{flex:1,backgroundColor:'#0b0d10',alignItems:'center',justifyContent:'center'},label:{color:'#dce2e8',fontWeight:'700',marginTop:16,marginBottom:8},input:{backgroundColor:'#171c22',color:'#fff',borderWidth:1,borderColor:'#313b45',borderRadius:12,padding:15,fontSize:16},area:{minHeight:150,textAlignVertical:'top'},option:{paddingVertical:14},optionText:{color:'#c7d0d8',fontSize:16},save:{backgroundColor:'#A8C84A',padding:16,borderRadius:12,alignItems:'center',marginTop:20},saveText:{color:'#10150d',fontWeight:'900',fontSize:16}});

import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const events = [
  { month:'AUG', day:'16', title:'Midwest Scenario Weekend', type:'Scenario • Open play', place:'Wentzville, Missouri', detail:'Two-day scenario game with camping and team registration.' },
  { month:'SEP', day:'06', title:'Gateway 5-Man Classic', type:'Tournament • Mechanical', place:'St. Louis, Missouri', detail:'Regional mechanical 5-man event with novice and open divisions.' },
  { month:'SEP', day:'27', title:'Fall Gear Swap & Tech Day', type:'Community • Marketplace', place:'Belleville, Illinois', detail:'Local gear swap, airsmith demos, and free marker safety checks.' },
];

export default function EventsScreen() {
  return <ScrollView style={styles.page} contentContainerStyle={styles.content}>
    <Text style={styles.eyebrow}>FIELD & EVENT DISCOVERY</Text><Text style={styles.title}>Find your next game.</Text><Text style={styles.subtitle}>A launch preview of event discovery. Organizer submissions and live geography are the next expansion after the marketplace foundation.</Text>
    <View style={styles.filters}><Text style={styles.filterActive}>Near St. Louis</Text><Text style={styles.filter}>All formats</Text><Text style={styles.filter}>Next 90 days</Text></View>
    {events.map((event) => <View style={styles.card} key={event.title}><View style={styles.date}><Text style={styles.month}>{event.month}</Text><Text style={styles.day}>{event.day}</Text></View><View style={styles.event}><Text style={styles.type}>{event.type}</Text><Text style={styles.eventTitle}>{event.title}</Text><Text style={styles.place}>{event.place}</Text><Text style={styles.detail}>{event.detail}</Text></View><TouchableOpacity style={styles.save}><Text style={styles.saveText}>Save</Text></TouchableOpacity></View>)}
  </ScrollView>;
}
const styles=StyleSheet.create({page:{flex:1,backgroundColor:'#0b0d10'},content:{width:'100%',maxWidth:1000,alignSelf:'center',padding:24,paddingBottom:80},eyebrow:{color:'#A8C84A',fontWeight:'800',fontSize:12,letterSpacing:1.3,marginTop:10},title:{color:'#fff',fontSize:36,fontWeight:'800',marginTop:12},subtitle:{color:'#9da8b4',fontSize:16,lineHeight:24,maxWidth:720,marginTop:10},filters:{flexDirection:'row',flexWrap:'wrap',gap:10,marginVertical:28},filterActive:{color:'#0d140a',backgroundColor:'#A8C84A',paddingHorizontal:16,paddingVertical:10,borderRadius:20,fontWeight:'800'},filter:{color:'#c5ccd4',backgroundColor:'#1a2026',paddingHorizontal:16,paddingVertical:10,borderRadius:20},card:{flexDirection:'row',alignItems:'center',gap:20,backgroundColor:'#15191f',borderColor:'#28313a',borderWidth:1,borderRadius:18,padding:20,marginBottom:14},date:{width:64,alignItems:'center',padding:8,backgroundColor:'#20262d',borderRadius:12},month:{color:'#A8C84A',fontSize:11,fontWeight:'900'},day:{color:'#fff',fontSize:26,fontWeight:'800'},event:{flex:1},type:{color:'#A8C84A',fontSize:12,fontWeight:'700'},eventTitle:{color:'#fff',fontSize:19,fontWeight:'800',marginTop:5},place:{color:'#c3cbd4',marginTop:5},detail:{color:'#89949f',marginTop:8,lineHeight:20},save:{borderColor:'#46515e',borderWidth:1,borderRadius:10,paddingHorizontal:16,paddingVertical:10},saveText:{color:'#fff',fontWeight:'700'}});

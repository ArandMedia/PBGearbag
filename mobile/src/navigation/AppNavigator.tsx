import React from "react";
import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { useAuth } from "../store/AuthContext";
import LoginScreen from "../screens/LoginScreen";
import LandingScreen from "../screens/LandingScreen";
import RegisterScreen from "../screens/RegisterScreen";
import ProfileScreen from "../screens/ProfileScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
import AccountSettingsScreen from "../screens/AccountSettingsScreen";
import MarketplaceFeedScreen from "../screens/MarketplaceFeedScreen";
import ListingDetailScreen from "../screens/ListingDetailScreen";
import CreateListingScreen from "../screens/CreateListingScreen";
import MyListingsScreen from "../screens/MyListingsScreen";
import HomeScreen from "../screens/HomeScreen";
import EditListingScreen from "../screens/EditListingScreen";
import DiscoverScreen from "../screens/DiscoverScreen";
import MessagesScreen from "../screens/MessagesScreen";
import GearbagScreen from "../screens/GearbagScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import AddGearScreen from "../screens/AddGearScreen";
import GearItemScreen from "../screens/GearItemScreen";
import MakeOfferScreen from "../screens/MakeOfferScreen";
import ReportScreen from "../screens/ReportScreen";
import AdminScreen from "../screens/AdminScreen";
import VerifyEmailScreen from "../screens/VerifyEmailScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";
import ConfirmEmailChangeScreen from "../screens/ConfirmEmailChangeScreen";
import FieldFeedScreen from "../screens/FieldFeedScreen";
import PublicProfileScreen from "../screens/PublicProfileScreen";
import FollowListScreen from "../screens/FollowListScreen";
import CommunityEntityScreen from "../screens/CommunityEntityScreen";
import CustomizeWidgetsScreen from "../screens/CustomizeWidgetsScreen";

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();
const INK = "#0A0E0F";
const PANEL = "#121819";
const LIME = "#A8C84A";

const icons: Record<string, string> = {
  Home: "grid-outline",
  "Field Feed": "videocam-outline",
  Marketplace: "pricetags-outline",
  Discover: "compass-outline",
  Messages: "chatbubbles-outline",
  Gearbag: "briefcase-outline",
  Profile: "person-outline",
};

function Brand() {
  return (
    <View style={styles.brand}>
      <View style={styles.brandMark}>
        <Text style={styles.brandMarkText}>PB</Text>
      </View>
      <View>
        <Text style={styles.brandName}>GEARBAG</Text>
        <Text style={styles.brandTag}>THE PAINTBALL NETWORK</Text>
      </View>
    </View>
  );
}

function CustomDrawer(props: any) {
  const { user } = useAuth();
  return (
    <View style={styles.drawerShell}>
      <View style={styles.drawerBrand}>
        <Brand />
      </View>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.drawerScroll}
      >
        <Text style={styles.navEyebrow}>PBG NETWORK</Text>
        <DrawerItemList {...props} />
        <Pressable
          style={({ pressed }) => [
            styles.sellButton,
            pressed && { opacity: 0.82 },
          ]}
          onPress={() => props.navigation.navigate("CreateListing")}
        >
          <Ionicons name="add-circle" size={20} color={INK} />
          <Text style={styles.sellText}>LIST YOUR GEAR</Text>
        </Pressable>
      </DrawerContentScrollView>
      <View style={styles.memberCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user?.username || user?.email || "P").slice(0, 1).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={styles.memberName}>
            {user?.username || "PBG Member"}
          </Text>
          <Text style={styles.memberMeta}>VERIFIED PLAYER</Text>
        </View>
        <View style={styles.onlineDot} />
      </View>
    </View>
  );
}

function MainDrawer() {
  const { width } = useWindowDimensions();
  const desktop = width >= 900;
  return (
    <Drawer.Navigator
      drawerContent={(p) => <CustomDrawer {...p} />}
      screenOptions={({ route }) => ({
        drawerType: desktop ? "permanent" : "front",
        drawerStyle: {
          width: 272,
          backgroundColor: PANEL,
          borderRightWidth: 1,
          borderRightColor: "#232B30",
        },
        overlayColor: "rgba(0,0,0,.72)",
        swipeEdgeWidth: 80,
        drawerActiveTintColor: LIME,
        drawerInactiveTintColor: "#A4ADB3",
        drawerActiveBackgroundColor: "rgba(168,200,74,.11)",
        drawerInactiveBackgroundColor: "transparent",
        drawerLabelStyle: {
          fontSize: 13,
          fontWeight: "800",
          letterSpacing: 0.7,
          marginLeft: -14,
        },
        drawerItemStyle: {
          borderRadius: 10,
          marginHorizontal: 12,
          marginVertical: 3,
          height: 48,
        },
        drawerIcon: ({ color, size }) => (
          <Ionicons
            name={(icons[route.name] || "ellipse-outline") as any}
            color={color}
            size={size}
          />
        ),
        headerStyle: { backgroundColor: INK },
        headerTintColor: "#fff",
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: "800", letterSpacing: 0.4 },
        headerRight: () => (
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        ),
      })}
    >
      <Drawer.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: !desktop, title: "Home" }}
      />
      <Drawer.Screen name="Field Feed" component={FieldFeedScreen} />
      <Drawer.Screen name="Marketplace" component={MarketplaceFeedScreen} />
      <Drawer.Screen name="Discover" component={DiscoverScreen} />
      <Drawer.Screen name="Messages" component={MessagesScreen} />
      <Drawer.Screen
        name="Gearbag"
        component={GearbagScreen}
        options={{ title: "My Gearbag" }}
      />
      <Drawer.Screen name="Profile" component={ProfileScreen} />
    </Drawer.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: INK },
      }}
    >
      <Stack.Screen name="Landing" component={LandingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}

const detailOptions = (title: string) => ({
  title,
  headerStyle: { backgroundColor: INK },
  headerTintColor: "#fff",
  headerShadowVisible: false,
  headerTitleStyle: { fontWeight: "800" as const },
});
function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ contentStyle: { backgroundColor: INK } }}>
      <Stack.Screen
        name="MainDrawer"
        component={MainDrawer}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MyListings"
        component={MyListingsScreen}
        options={detailOptions("My Listings")}
      />
      <Stack.Screen
        name="Gearbag"
        component={GearbagScreen}
        options={detailOptions("Digital Gearbag")}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={detailOptions("Notifications")}
      />
      <Stack.Screen
        name="AddGear"
        component={AddGearScreen}
        options={detailOptions("Add Gear")}
      />
      <Stack.Screen
        name="GearItem"
        component={GearItemScreen}
        options={detailOptions("Gear Details")}
      />
      <Stack.Screen
        name="MakeOffer"
        component={MakeOfferScreen}
        options={detailOptions("Make an Offer")}
      />
      <Stack.Screen
        name="Report"
        component={ReportScreen}
        options={detailOptions("Report")}
      />
      <Stack.Screen
        name="Admin"
        component={AdminScreen}
        options={detailOptions("PBG Operations")}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={detailOptions("Edit Profile")}
      />
      <Stack.Screen
        name="AccountSettings"
        component={AccountSettingsScreen}
        options={detailOptions("Account Settings")}
      />
      <Stack.Screen
        name="CustomizeWidgets"
        component={CustomizeWidgetsScreen}
        options={detailOptions("Customize Profile")}
      />
      <Stack.Screen
        name="ListingDetail"
        component={ListingDetailScreen}
        options={detailOptions("Listing Details")}
      />
      <Stack.Screen
        name="CreateListing"
        component={CreateListingScreen}
        options={detailOptions("List Your Gear")}
      />
      <Stack.Screen
        name="EditListing"
        component={EditListingScreen}
        options={detailOptions("Edit Listing")}
      />
      <Stack.Screen
        name="PublicProfile"
        component={PublicProfileScreen}
        options={detailOptions("Player Profile")}
      />
      <Stack.Screen
        name="FollowList"
        component={FollowListScreen}
        options={detailOptions("Connections")}
      />
      <Stack.Screen
        name="CommunityEntity"
        component={CommunityEntityScreen}
        options={detailOptions("Community")}
      />
    </Stack.Navigator>
  );
}

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: LIME,
    background: INK,
    card: PANEL,
    border: "#232B30",
    text: "#F5F7F8",
  },
};
function getUrlToken(path: string): string | undefined {
  if (Platform.OS !== "web" || typeof window === "undefined") return undefined;
  if (window.location.pathname !== path) return undefined;
  return new URLSearchParams(window.location.search).get("token") || undefined;
}

export default function AppNavigator() {
  const { isAuthenticated, loading, user } = useAuth();
  const verifyToken = getUrlToken("/verify-email");
  const resetToken = getUrlToken("/reset-password");
  const emailChangeToken = getUrlToken("/confirm-email-change");
  if (loading)
    return (
      <View style={styles.loading}>
        <Brand />
        <ActivityIndicator size="large" color={LIME} />
      </View>
    );
  // Email links (verify, reset, confirm-change) can be opened without an
  // active session — e.g. on a different device than the one used to
  // register — so all of these have to work standalone rather than only
  // inside the app shell.
  if (resetToken) {
    return <ForgotPasswordScreen initialToken={resetToken} />;
  }
  if (emailChangeToken) {
    return <ConfirmEmailChangeScreen token={emailChangeToken} />;
  }
  if (verifyToken && !isAuthenticated) {
    return <VerifyEmailScreen initialToken={verifyToken} />;
  }
  return (
    <NavigationContainer theme={navTheme}>
      {isAuthenticated ? (
        user?.isVerified ? (
          <MainStack />
        ) : (
          <VerifyEmailScreen initialToken={verifyToken} />
        )
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: INK,
    alignItems: "center",
    justifyContent: "center",
    gap: 28,
  },
  drawerShell: { flex: 1, backgroundColor: PANEL },
  drawerBrand: {
    paddingHorizontal: 22,
    paddingTop: 30,
    paddingBottom: 22,
    borderBottomWidth: 1,
    borderBottomColor: "#232B30",
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 11 },
  brandMark: {
    width: 38,
    height: 38,
    borderRadius: 9,
    backgroundColor: LIME,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "-3deg" }],
  },
  brandMarkText: {
    color: INK,
    fontWeight: "900",
    fontSize: 15,
    letterSpacing: -0.5,
  },
  brandName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1.7,
  },
  brandTag: {
    color: "#727D84",
    fontSize: 7,
    fontWeight: "800",
    letterSpacing: 1.15,
    marginTop: 2,
  },
  drawerScroll: { paddingTop: 16 },
  navEyebrow: {
    color: "#59646B",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.8,
    marginHorizontal: 24,
    marginBottom: 8,
  },
  sellButton: {
    margin: 18,
    marginTop: 20,
    height: 48,
    borderRadius: 10,
    backgroundColor: LIME,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  sellText: { color: INK, fontWeight: "900", fontSize: 12, letterSpacing: 1 },
  memberCard: {
    margin: 14,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#0B0F11",
    borderWidth: 1,
    borderColor: "#222A2F",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: "#283137",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: LIME, fontWeight: "900" },
  memberName: { color: "#F3F6F7", fontSize: 12, fontWeight: "800" },
  memberMeta: {
    color: "#68747B",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginTop: 2,
  },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: LIME },
  livePill: {
    marginRight: 16,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: "#171D20",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: LIME },
  liveText: {
    color: "#A9B2B7",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },
});

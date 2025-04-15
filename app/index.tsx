import { StyleSheet, Text, View } from "react-native";
import { useAuth } from "../src/contexts/AuthContext";
import { useEffect } from "react";
import { useNavigation } from "@react-navigation/native";

export default function IndexPage() {
  const { currentUser, userDetails } = useAuth();
  const navigation = useNavigation();

  if (currentUser && userDetails) {
    console.log("User authenticated with role:", userDetails.role);
    setTimeout(() => {
      try {
        switch (userDetails.role) {
          case 'producer':
            navigation.reset({
              index: 0,
              routes: [{ name: 'ProducerTabs' }],
            });
            break;
          // ... other cases
        }
      } catch (e) {
        console.error("Navigation error:", e);
      }
    }, 500); // Small delay to ensure navigation is ready
  }

  return (
    <View style={styles.container}>
      <View style={styles.main}>
        <Text style={styles.title}>TV Production Scheduler</Text>
        <Text style={styles.subtitle}>Loading your dashboard...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    padding: 24,
  },
  main: {
    flex: 1,
    justifyContent: "center",
    maxWidth: 960,
    marginHorizontal: "auto",
  },
  title: {
    fontSize: 64,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 36,
    color: "#38434D",
  },
});
import { StyleSheet, Text, View } from "react-native";
import { useAuth } from "../src/contexts/AuthContext";
import { useEffect } from "react";
import { useNavigation } from "@react-navigation/native";

export default function IndexPage() {
  const { currentUser, userDetails } = useAuth();
  const navigation = useNavigation();

  // Redirect based on user role
  useEffect(() => {
    if (currentUser && userDetails) {
      switch (userDetails.role) {
        case 'producer':
          navigation.navigate('ProducerTabs' as never);
          break;
        case 'booking_officer':
          navigation.navigate('BookingOfficerTabs' as never);
          break;
        case 'operator':
          navigation.navigate('OperatorTabs' as never);
          break;
        default:
          // If role is not recognized, stay on this page
          break;
      }
    }
  }, [currentUser, userDetails]);

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
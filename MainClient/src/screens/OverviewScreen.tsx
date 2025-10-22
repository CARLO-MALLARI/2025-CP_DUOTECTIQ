import React from 'react';
import { View, Text, ScrollView, Image, StyleSheet} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme } from '../styles/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomNavBar from '../components/BottomNavbar';

const OverviewScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Crop Qualities Overview</Text>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="ribbon-outline" size={20} color={theme.colors.primary} />
          <Text style={styles.sectionTitle}>Quality Assessment Criteria</Text>
        </View>

        <View style={styles.cardRow}>
          <View style={styles.card}>
            <Ionicons name="search-outline" size={28} color={theme.colors.primary} />
            <Text style={styles.cardTitle}>Condition Assessment</Text>
            <Text style={styles.cardText}>
              Detecting visible damage including bruises, blemishes, cuts, and discoloration that affect market value.
            </Text>
          </View>

          <View style={styles.card}>
            <Ionicons name="color-palette-outline" size={28} color={theme.colors.primary} />
            <Text style={styles.cardTitle}>Color Classification</Text>
            <Text style={styles.cardText}>
              Classifying undamaged crops as green or red to meet buyer packaging and pricing requirements.
            </Text>
          </View>

          <View style={styles.card}>
            <Ionicons name="resize-outline" size={28} color={theme.colors.primary} />
            <Text style={styles.cardTitle}>Size Standardization</Text>
            <Text style={styles.cardText}>
              Categorizing undamaged crops into small, medium, or large for consistent presentation and market standards.
            </Text>
          </View>
        </View>
      </View>

      {/* ===== Economic Benefits ===== */}
      <View style={[styles.section, { backgroundColor: '#FDF7EE' }]}>
        <View style={styles.sectionHeader}>
          <Ionicons name="trending-up-outline" size={20} color="#C47F00" />
          <Text style={[styles.sectionTitle, { color: '#C47F00' }]}>Economic Benefits</Text>
        </View>

        <View style={styles.benefitsRow}>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#3C8D40" />
            <Text style={styles.benefitText}>Reduced Rejection Rates</Text>
          </View>

          <View style={styles.benefitItem}>
            <Ionicons name="cash-outline" size={20} color="#3C8D40" />
            <Text style={styles.benefitText}>Premium Pricing</Text>
          </View>

          <View style={styles.benefitItem}>
            <Ionicons name="time-outline" size={20} color="#3C8D40" />
            <Text style={styles.benefitText}>Operational Efficiency</Text>
          </View>

          <View style={styles.benefitItem}>
            <Ionicons name="leaf-outline" size={20} color="#3C8D40" />
            <Text style={styles.benefitText}>Waste Reduction</Text>
          </View>
        </View>

        <Text style={styles.benefitDesc}>
          Improves buyer confidence, pricing accuracy, and operational speed while minimizing losses due to damaged produce.
        </Text>
      </View>

      {/* ===== Supported Crop Varieties ===== */}
      <Text style={styles.subtitle}>Supported Crop Varieties</Text>

      <View style={styles.cropRow}>
        <View style={styles.cropCard}>
          <View style={[styles.cropHeader, { backgroundColor: '#B93128' }]}>
            <Text style={styles.cropName}>Tomato</Text>
            <Text style={styles.cropSub}>Solanum lycopersicum</Text>
          </View>

          <Image
            source={require('../assets/tomato.jpg')} // add this image
            style={styles.cropImage}
            resizeMode="cover"
          />

          <Text style={styles.cropText}>
            A tomato is the fleshy, seed-bearing fruit of Solanum lycopersicum, treated like a vegetable in everyday cooking.
          </Text>
        </View>

        <View style={styles.cropCard}>
          <View style={[styles.cropHeader, { backgroundColor: '#3C8D40' }]}>
            <Text style={styles.cropName}>Bell Pepper</Text>
            <Text style={styles.cropSub}>Capsicum annuum</Text>
          </View>

          <Image
            source={require('../assets/bellpepper.jpg')} // add this image
            style={styles.cropImage}
            resizeMode="cover"
          />

          <Text style={styles.cropText}>
            A bell pepper is the fruit of Capsicum annuum, known for its crisp, mild, and sweet flavor. Available in green and red.
          </Text>
        </View>
      </View>
    
      <Text style={styles.subtitle}>Common Defects</Text>
    </ScrollView>
    <BottomNavBar/>
    </SafeAreaView>
  );
};

export default OverviewScreen;

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#f4f4f4' 
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    color: theme.colors.text,
    marginVertical: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    margin: 4,
    elevation: 2,
  },
  cardTitle: {
    fontWeight: '600',
    fontSize: 14,
    marginTop: 6,
  },
  cardText: {
    fontSize: 12,
    color: '#555',
    marginTop: 4,
  },
  benefitsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 13,
    marginLeft: 4,
    color: '#333',
  },
  benefitDesc: {
    fontSize: 12,
    color: '#555',
    marginTop: 6,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    color: theme.colors.text,
    marginVertical: 12,
  },
  cropRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cropCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 16,
    marginHorizontal: 4,
    overflow: 'hidden',
    elevation: 3,
  },
  cropHeader: {
    padding: 10,
  },
  cropName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  cropSub: {
    fontSize: 11,
    color: '#fff',
  },
  cropImage: {
    width: '100%',
    height: 130,
  },
  cropText: {
    padding: 10,
    fontSize: 12,
    color: '#444',
  },
});

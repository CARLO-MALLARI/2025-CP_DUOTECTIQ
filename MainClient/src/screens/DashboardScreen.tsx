import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import BottomNavBar from '../components/BottomNavbar';
import { SafeAreaView } from 'react-native-safe-area-context';

const DashboardScreen: React.FC = () => {
  const [expanded, setExpanded] = useState({
    green: false,
    red: false,
  });

  const toggleExpand = (key: keyof typeof expanded) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const [fromDate, setFromDate] = useState('07/09/2025');
  const [toDate, setToDate] = useState('');
  const [sortBy, setSortBy] = useState('All');

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.wrapper}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {/* ===== Dashboard Overview ===== */}
          <Text style={styles.sectionTitle}>Dashboard Overview</Text>

          <View style={styles.cardContainer}>
            <View style={styles.card}>
              <Ionicons style={styles.cardIcon} name="settings-outline" size={32} color="#555" />
              <Text style={styles.cardTitle}>System Status</Text>
              <Text style={[styles.cardValue, { color: 'green' }]}>Online</Text>
            </View>

            <View style={styles.card}>
              <Ionicons name="trending-up-outline" size={32} color="#555" />
              <Text style={[styles.cardValue, { color: 'green' }]}>78</Text>
              <Text style={styles.cardTitle}>Total crops sorted (Latest)</Text>
            </View>

            <View style={styles.card}>
              <Ionicons style={styles.cardIcon} name="grid-outline" size={32} color="#555" />
              <Text style={styles.cardTitle}>Crop Qualities Overview</Text>
            </View>
          </View>

          {/* ===== Sorting Summary ===== */}
          <Text style={styles.sectionTitle}>Sorting Summary</Text>

          {/* Filters Row */}
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>From:</Text>
            <TextInput style={styles.dateInput} placeholder="mm/dd" value={fromDate} onChangeText={setFromDate} />
            <Text style={styles.filterLabel}>To:</Text>
            <TextInput style={styles.dateInput} placeholder="mm/dd" value={toDate} onChangeText={setToDate} />
            <Text style={styles.filterLabel}>Sort:</Text>
            <TextInput style={[styles.dateInput, { width: 55 }]} placeholder="All" value={sortBy} onChangeText={setSortBy} />
            <TouchableOpacity style={styles.filterBtn}>
              <Ionicons name="filter-outline" size={12} color="#fff" />
            </TouchableOpacity>
          </View>


          {/* Summary Table */}
          <View style={styles.table}>
            {/* Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.cell, styles.headerCell, { flex: 2 }]}>Category</Text>
              <Text style={[styles.cell, styles.headerCell]}>Tomato</Text>
              <Text style={[styles.cell, styles.headerCell]}>Bell Pepper</Text>
              <Text style={[styles.cell, styles.headerCell]}>Total</Text>
            </View>

            {/* ▸ Not Damaged - Green */}
            <TouchableOpacity style={styles.tableRow} onPress={() => toggleExpand("green")}>
              <Text style={[styles.cell, { flex: 2 }]}>
                {expanded.green ? "▾" : "▸"} Not Damaged - Green
              </Text>
              <Text style={styles.cell}>15</Text>
              <Text style={styles.cell}>12</Text>
              <Text style={styles.cell}>27</Text>
            </TouchableOpacity>

            {expanded.green && (
              <>
                <View style={styles.subRow}>
                  <Text style={[styles.subCell, { flex: 2 }]}>Small</Text>
                  <Text style={styles.subCell}>5</Text>
                  <Text style={styles.subCell}>5</Text>
                  <Text style={styles.subCell}></Text>
                </View>
                <View style={styles.subRow}>
                  <Text style={[styles.subCell, { flex: 2 }]}>Medium</Text>
                  <Text style={styles.subCell}>10</Text>
                  <Text style={styles.subCell}>7</Text>
                  <Text style={styles.subCell}></Text>
                </View>
              </>
            )}

            {/* ▸ Not Damaged - Red */}
            <TouchableOpacity style={styles.tableRow} onPress={() => toggleExpand("red")}>
              <Text style={[styles.cell, { flex: 2 }]}>
                {expanded.red ? "▾" : "▸"} Not Damaged - Red
              </Text>
              <Text style={styles.cell}>20</Text>
              <Text style={styles.cell}>14</Text>
              <Text style={styles.cell}>34</Text>
            </TouchableOpacity>

            {expanded.red && (
              <>
                <View style={styles.subRow}>
                  <Text style={[styles.subCell, { flex: 2 }]}>Small</Text>
                  <Text style={styles.subCell}>6</Text>
                  <Text style={styles.subCell}>5</Text>
                  <Text style={styles.subCell}></Text>
                </View>
                <View style={styles.subRow}>
                  <Text style={[styles.subCell, { flex: 2 }]}>Medium</Text>
                  <Text style={styles.subCell}>14</Text>
                  <Text style={styles.subCell}>9</Text>
                  <Text style={styles.subCell}></Text>
                </View>
              </>
            )}

            {/* ▸ Damaged */}
            <View style={styles.tableRow}>
              <Text style={[styles.cell, { flex: 2 }]}>▸ Damaged</Text>
              <Text style={styles.cell}>9</Text>
              <Text style={styles.cell}>8</Text>
              <Text style={styles.cell}>17</Text>
            </View>

            {/* Footer */}
            <View style={[styles.tableRow, { borderTopWidth: 1, borderColor: "#ccc" }]}>
              <Text style={[styles.cell, { flex: 2, fontWeight: "bold" }]}>Total Pieces</Text>
              <Text style={[styles.cell, { fontWeight: "bold" }]}>44</Text>
              <Text style={[styles.cell, { fontWeight: "bold" }]}>34</Text>
              <Text style={[styles.cell, { fontWeight: "bold" }]}>78</Text>
            </View>
          </View>
          
          {/* Add padding at bottom so content doesn't hide behind navbar */}
          <View style={{ height: 80 }} />
        </ScrollView>
        
        {/* Bottom Navigation Bar - Outside ScrollView */}
        <BottomNavBar />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#f4f4f4' 
  },
  wrapper: { 
    flex: 1 
  },
  container: { 
    padding: 10, 
    backgroundColor: '#f4f4f4', 
    flexGrow: 1 
  },
  sectionTitle: { fontSize: 22, fontWeight: '700', marginBottom: 16, marginTop: 10 },
  cardContainer: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: 24 },
  card: {
    width: '30%',
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 10,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  
  cardIcon:  { textAlign: 'center', marginTop: 15 },
  cardTitle: { fontSize: 12, color: '#333', alignSelf:'center', marginTop: 5 },
  cardValue: { fontSize: 20, fontWeight: '600',  marginTop: 1 },

  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'nowrap',
    marginBottom: 10,
    gap: 4,
  },

  filterLabel: {
    fontSize: 11,
    color: '#333',
  },

  dateInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    backgroundColor: '#fff',
    width: 75,
    fontSize: 11,
  },

  filterBtn: {
    backgroundColor: '#007a33',
    borderRadius: 4,
    padding: 3,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },

  table: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
  },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#ddd', paddingVertical: 6 },
  headerCell: { fontWeight: 'bold', color: '#333' },
  tableRow: { flexDirection: 'row', paddingVertical: 6 },
  subRow: { flexDirection: 'row', paddingLeft: 20, paddingVertical: 4 },
  cell: { flex: 1, textAlign: 'center', color: '#333' },
  subCell: { flex: 1, textAlign: 'center', color: '#666', fontSize: 13 },
});

export default DashboardScreen;
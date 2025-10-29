import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Picker } from '@react-native-picker/picker';
import { theme } from '../styles/theme';
import BottomNavBar from '../components/BottomNavbar';
import { ScrollView } from 'react-native';

type SortOption = 'All' | 'Tomato' | 'Bell Pepper';

interface SortData {
  id: string;
  crop: string;
  color: string;
  condition: string;
  size: string;
  basket: string;
  time: string;
}

const data: SortData[] = [
  { id: '1', crop: 'Bell Pepper', color: 'Green', condition: 'Not Damaged', size: 'Medium', basket: 'Left Basket', time: '09:14:12 AM' },
  { id: '2', crop: 'Bell Pepper', color: 'Red', condition: 'Not Damaged', size: 'Large', basket: 'Right Basket', time: '09:14:43 AM' },
  { id: '3', crop: 'Bell Pepper', color: 'Red', condition: 'Damaged', size: 'Large', basket: 'Middle Basket', time: '09:15:14 AM' },
  { id: '4', crop: 'Bell Pepper', color: 'Red', condition: 'Not Damaged', size: 'Small', basket: 'Right Basket', time: '09:15:40 AM' },
  { id: '5', crop: 'Tomato', color: 'Red', condition: 'Damaged', size: 'Medium', basket: 'Middle Basket', time: '09:16:09 AM' },
  { id: '6', crop: 'Tomato', color: 'Green', condition: 'Not Damaged', size: 'Medium', basket: 'Left Basket', time: '09:16:38 AM' },
  { id: '7', crop: 'Tomato', color: 'Red', condition: 'Damaged', size: 'Small', basket: 'Middle Basket', time: '09:17:03 AM' },
  { id: '8', crop: 'Tomato', color: 'Green', condition: 'Damaged', size: 'Large', basket: 'Middle Basket', time: '09:17:31 AM' },
];

const SortingHistoryScreen: React.FC = () => {
  const [date, setDate] = useState('');
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('All');

  const handleConfirm = (pickedDate: Date) => {
    setDate(pickedDate.toLocaleDateString());
    setDatePickerVisible(false);
  };

  const filteredData = sortBy === 'All' ? data : data.filter(item => item.crop === sortBy);

  return (
    <SafeAreaView style={styles.safeArea}>
      
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header Title */}
        <Text style={styles.header}>Sorting History</Text>

        {/* Filters Row */}
        <View style={styles.filterRow}>
          {/* Date Picker */}
          <TouchableOpacity
            style={styles.datePicker}
            onPress={() => setDatePickerVisible(true)}
          >
            <TextInput
              style={styles.dateText}
              placeholder="mm/dd/yyyy"
              value={date}
              editable={false}
              placeholderTextColor="#777"
            />
            <Ionicons name="calendar-outline" size={18} color="#555" />
          </TouchableOpacity>

          {/* Sort Dropdown */}
          <View style={styles.sortPicker}>
            <Picker
              selectedValue={sortBy}
              onValueChange={(itemValue: string) => setSortBy(itemValue as SortOption)}
              mode="dropdown"
              dropdownIconColor="#333"
              style={{ fontSize: 14 }}
            >
              <Picker.Item label="Sort by" value="All" />
              <Picker.Item label="Tomato" value="Tomato" />
              <Picker.Item label="Bell Pepper" value="Bell Pepper" />
            </Picker>
          </View>
        </View>

        {/* Table Section */}
        <View style={styles.tableCard}>
          <View style={styles.tableHeader}>
            <Text style={[styles.cell, styles.headerCell]}>Crop Type</Text>
            <Text style={[styles.cell, styles.headerCell]}>Color</Text>
            <Text style={[styles.cell, styles.headerCell]}>Condition</Text>
            <Text style={[styles.cell, styles.headerCell]}>Size</Text>
            <Text style={[styles.cell, styles.headerCell]}>Time</Text>
          </View>

          <FlatList
            data={filteredData}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.tableRow}>
                <Text style={styles.cell}>{item.crop}</Text>
                <Text style={styles.cell}>{item.color}</Text>
                <Text style={styles.cell}>{item.condition}</Text>
                <Text style={styles.cell}>{item.size}</Text>
                <Text style={styles.cell}>{item.time}</Text>
              </View>
            )}
          />
        </View>

        {/* Date Picker Modal */}
        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={handleConfirm}
          onCancel={() => setDatePickerVisible(false)}
        />
    </ScrollView>       
      <BottomNavBar />
    </SafeAreaView>
  );
};

export default SortingHistoryScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#e8e8e8', 
  },
  container: {
    flex: 1,
    margin: 16,
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
    marginBottom: 18,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bbb',
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingHorizontal: 10,
    height: 40,
    flex: 0.64,
  },
  dateText: {
    flex: 1,
    color: '#333',
    fontSize: 14,
  },
  sortPicker: {
    flex: 0.33,
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 6,
    backgroundColor: '#fff',
    height: 40,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  tableCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    padding: 5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#eee',
    paddingVertical: 8,
    padding: 5,
  },
  cell: {
    flex: 1,
    fontSize: 13,
    color: '#333',
    textAlign: 'center',
  },
  headerCell: {
    fontWeight: '700',
    fontSize: 14,
    color: '#111',
  },
});

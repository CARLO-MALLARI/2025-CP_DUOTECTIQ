import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Picker } from '@react-native-picker/picker';
import { theme } from '../styles/theme';
import BottomNavBar from '../components/BottomNavbar';

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
  { id: '1', crop: 'Tomato', color: 'Green', condition: 'Not Damaged', size: 'Medium', basket: 'Left Basket', time: '09:14:12 AM' },
  { id: '2', crop: 'Tomato', color: 'Red', condition: 'Not Damaged', size: 'Large', basket: 'Right Basket', time: '09:14:43 AM' },
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

  const filteredData =
    sortBy === 'All' ? data : data.filter(item => item.crop === sortBy);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <Text style={styles.header}>Sorting History</Text>

        {/* Filters Row */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={styles.datePicker}
            onPress={() => setDatePickerVisible(true)}
          >
            <TextInput
              style={styles.dateText}
              placeholder="mm/dd/yyyy"
              value={date}
              editable={false}
            />
            <Ionicons
              name="calendar-outline"
              size={18}
              color="#555"
              style={{ marginLeft: 6 }}
            />
          </TouchableOpacity>

          <View style={styles.sortPicker}>
            <Picker
              selectedValue={sortBy}
              onValueChange={(itemValue: string) => setSortBy(itemValue as SortOption)}
              mode="dropdown"
              dropdownIconColor="#333"
            >
              <Picker.Item label="Sort by" value="All" />
              <Picker.Item label="Tomato" value="Tomato" />
              <Picker.Item label="Bell Pepper" value="Bell Pepper" />
            </Picker>
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.cell, styles.headerCell]}>Crop</Text>
            <Text style={[styles.cell, styles.headerCell]}>Color</Text>
            <Text style={[styles.cell, styles.headerCell]}>Condition</Text>
            <Text style={[styles.cell, styles.headerCell]}>Size</Text>
            <Text style={[styles.cell, styles.headerCell]}>Sorted To</Text>
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
                <Text style={styles.cell}>{item.basket}</Text>
                <Text style={styles.cell}>{item.time}</Text>
              </View>
            )}
          />
        </View>

        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={handleConfirm}
          onCancel={() => setDatePickerVisible(false)}
        />
      </View>
      <BottomNavBar/>
    </SafeAreaView>
  );
};

export default SortingHistoryScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f2f3f5' },
  container: { flex: 1, padding: 20 },
  header: { fontSize: 24, fontWeight: '700', marginBottom: 16 },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    flex: 0.65,
  },
  dateText: { flex: 1, color: '#333' },
  sortPicker: {
    flex: 0.32,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#fff',
    height: 40,
    overflow: 'hidden',
  },
  table: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingBottom: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f4f4f4',
    paddingVertical: 8,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#eee',
    paddingVertical: 6,
  },
  cell: {
    flex: 1,
    fontSize: 13,
    textAlign: 'center',
    color: '#333',
  },
  headerCell: {
    fontWeight: '700',
    fontSize: 14,
    color: '#222',
  },
});

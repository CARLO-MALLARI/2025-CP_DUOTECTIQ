
import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Picker } from '@react-native-picker/picker';
import BottomNavBar from '../components/BottomNavbar';
import { fetchHistory, HistoryRecord } from '../helpers/firebaseHistoryHelper';

type SortOption = 'All' | 'Tomato' | 'BellPepper';

const SortingHistoryScreen: React.FC = () => {
  // ---- UI state ----------------------------------------------------
  const [date, setDate] = useState('');                 // "mm/dd/yyyy"
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('All');

  // ---- Data state --------------------------------------------------
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // ---- Convert UI date → ISO ----------------------------------------
  const iso = (ui: string): string => {
    if (!ui) return '';
    const [m, d, y] = ui.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  };

  // ---- Load data ----------------------------------------------------
  const load = useCallback(async () => {
    if (!date) {
      Alert.alert('Select a date');
      return;
    }
    setLoading(true);
    try {
      const isoDate = iso(date);
      const data = await fetchHistory(isoDate, sortBy);
      setRecords(data);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, [date, sortBy]);

  // Auto‑load when filters change
  useEffect(() => {
    load();
  }, [load]);

  // ---- Date picker --------------------------------------------------
  const handleConfirm = (picked: Date) => {
    setDate(picked.toLocaleDateString('en-US'));
    setDatePickerVisible(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.wrapper}>
        <FlatList
          data={records}
          keyExtractor={item => item.id}
          ListHeaderComponent={
            <>
              {/* Header */}
              <Text style={styles.header}>Sorting History</Text>

              {/* Filters */}
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
                    placeholderTextColor="#777"
                  />
                  <Ionicons name="calendar-outline" size={18} color="#555" />
                </TouchableOpacity>

                <View style={styles.sortPicker}>
                  <Picker
                    selectedValue={sortBy}
                    onValueChange={v => setSortBy(v as SortOption)}
                    mode="dropdown"
                    dropdownIconColor="#333"
                    style={{ fontSize: 14 }}
                  >
                    <Picker.Item label="All" value="All" />
                    <Picker.Item label="Tomato" value="Tomato" />
                    <Picker.Item label="Bell Pepper" value="BellPepper" />
                  </Picker>
                </View>

                <TouchableOpacity style={styles.refreshBtn} onPress={load}>
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="refresh" size={16} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>

              {/* Table Header */}
              <View style={styles.tableCard}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.cell, styles.headerCell]}>Crop</Text>
                  <Text style={[styles.cell, styles.headerCell]}>Color</Text>
                  <Text style={[styles.cell, styles.headerCell]}>Condition</Text>
                  <Text style={[styles.cell, styles.headerCell]}>Size</Text>
                  <Text style={[styles.cell, styles.headerCell]}>Time</Text>
                </View>
              </View>
            </>
          }
          renderItem={({ item }) => (
            <View style={styles.tableRow}>
              <Text style={styles.cell}>{item.crop}</Text>
              <Text style={styles.cell}>{item.color}</Text>
              <Text style={styles.cell}>{item.condition}</Text>
              <Text style={styles.cell}>{item.size}</Text>
              <Text style={styles.cell}>{item.time}</Text>
            </View>
          )}
          ListEmptyComponent={
            loading ? null : (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No records for this date.</Text>
              </View>
            )
          }
          contentContainerStyle={{ paddingBottom: 80 }}
        />

        {/* Date Picker Modal */}
        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={handleConfirm}
          onCancel={() => setDatePickerVisible(false)}
        />
      </View>

      <BottomNavBar />
    </SafeAreaView>
  );
};

export default SortingHistoryScreen;

/* --------------------------------------------------------------- */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#e8e8e8' },
  wrapper: { flex: 1 },
  header: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 8,
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
    flex: 0.55,
  },
  dateText: { flex: 1, color: '#333', fontSize: 14 },
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
  refreshBtn: {
    backgroundColor: '#007a33',
    borderRadius: 4,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },

  tableCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#eee',
    paddingVertical: 8,
  },
  cell: {
    flex: 1,
    fontSize: 13,
    color: '#333',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  headerCell: {
    fontWeight: '700',
    fontSize: 14,
    color: '#111',
  },
  empty: { padding: 20, alignItems: 'center' },
  emptyText: { color: '#777', fontSize: 15 },
});
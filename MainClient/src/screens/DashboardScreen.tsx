
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import BottomNavBar from '../components/BottomNavbar';
import { SafeAreaView } from 'react-native-safe-area-context';
import BarChartComponent from '../components/BarChart';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Picker } from '@react-native-picker/picker';
import { fetchDashboardData, DashboardData } from '../helpers/firebaseDashboardHelper';

type SortOption = 'All' | 'Tomato' | 'Bell Pepper';

const DashboardScreen: React.FC = () => {
  // ---- UI state ----------------------------------------------------
  const [fromDate, setFromDate] = useState('');               // "mm/dd/yyyy"
  const [toDate, setToDate] = useState('');
  const [isFromPickerVisible, setFromPickerVisible] = useState(false);
  const [isToPickerVisible, setToPickerVisible] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('All');

  const [expanded, setExpanded] = useState({
    green: false,
    red: false,
  });

  // ---- Data state --------------------------------------------------
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);

  // ---- Convert UI dates to ISO strings -----------------------------
  const iso = (uiDate: string): string => {
    if (!uiDate) return '';
    const [m, d, y] = uiDate.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  };

  // ---- Fetch data --------------------------------------------------
  const loadData = useCallback(async () => {
    if (!fromDate) {
      Alert.alert('Select a “From” date');
      return;
    }
    setLoading(true);
    try {
      const fromISO = iso(fromDate);
      const toISO = toDate ? iso(toDate) : fromISO; // default to same day
      const agg = await fetchDashboardData(fromISO, toISO, sortBy);
      setData(agg);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, sortBy]);

  // Auto-load when filters change
  useEffect(() => {
    loadData();
  }, [loadData]);

  // ---- UI helpers --------------------------------------------------
  const toggleExpand = (key: keyof typeof expanded) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleConfirmFrom = (picked: Date) => {
    setFromDate(picked.toLocaleDateString('en-US'));
    setFromPickerVisible(false);
  };
  const handleConfirmTo = (picked: Date) => {
    setToDate(picked.toLocaleDateString('en-US'));
    setToPickerVisible(false);
  };

  // ---- Render helpers -----------------------------------------------
  const defaultData: DashboardData = {
    totalPieces: 0,
    byCrop: { Tomato: 0, 'Bell Pepper': 0 },
    byCategory: {
      green: { total: 0, Tomato: 0, 'Bell Pepper': 0, small: 0, medium: 0, large: 0 },
      red:   { total: 0, Tomato: 0, 'Bell Pepper': 0, small: 0, medium: 0, large: 0 },
      damaged: { total: 0, Tomato: 0, 'Bell Pepper': 0 },
    },
  };

  const d: DashboardData = data
    ? {
        totalPieces: data.totalPieces ?? 0,
        byCrop: {
          Tomato: data.byCrop?.Tomato ?? 0,
          'Bell Pepper': data.byCrop?.['Bell Pepper'] ?? 0,
        },
        byCategory: {
          green: {
            total: data.byCategory?.green?.total ?? 0,
            Tomato: data.byCategory?.green?.Tomato ?? 0,
            'Bell Pepper': data.byCategory?.green?.['Bell Pepper'] ?? 0,
            small: data.byCategory?.green?.small ?? 0,
            medium: data.byCategory?.green?.medium ?? 0,
            large: data.byCategory?.green?.large ?? 0,
          },
          red: {
            total: data.byCategory?.red?.total ?? 0,
            Tomato: data.byCategory?.red?.Tomato ?? 0,
            'Bell Pepper': data.byCategory?.red?.['Bell Pepper'] ?? 0,
            small: data.byCategory?.red?.small ?? 0,
            medium: data.byCategory?.red?.medium ?? 0,
            large: data.byCategory?.green?.large ?? 0,
          },
          damaged: {
            total: data.byCategory?.damaged?.total ?? 0,
            Tomato: data.byCategory?.damaged?.Tomato ?? 0,
            'Bell Pepper': data.byCategory?.damaged?.['Bell Pepper'] ?? 0,
          },
        },
      }
    : defaultData;

  const showTomato = sortBy === 'All' || sortBy === 'Tomato';
  const showBell   = sortBy === 'All' || sortBy === 'Bell Pepper';

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
              <Text style={[styles.cardValue, { color: 'green' }]}>
                {d.totalPieces}
              </Text>
              <Text style={styles.cardTitle}>Total crops sorted (Latest)</Text>
            </View>
          </View>

          {/* ===== Sorting Summary ===== */}
          <Text style={styles.sectionTitle}>Sorting Summary</Text>

          {/* Filters Row */}
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>From:</Text>
            <TouchableOpacity style={styles.datePicker} onPress={() => setFromPickerVisible(true)}>
              <TextInput
                style={styles.dateText}
                placeholder="mm/dd/yyyy"
                value={fromDate}
                editable={false}
                placeholderTextColor="#777"
              />
              <Ionicons name="calendar-outline" size={14} color="#555" />
            </TouchableOpacity>

            <Text style={styles.filterLabel}>To:</Text>
            <TouchableOpacity style={styles.datePicker} onPress={() => setToPickerVisible(true)}>
              <TextInput
                style={styles.dateText}
                placeholder="mm/dd/yyyy"
                value={toDate}
                editable={false}
                placeholderTextColor="#777"
              />
              <Ionicons name="calendar-outline" size={14} color="#555" />
            </TouchableOpacity>

            <Text style={styles.filterLabel}>Sort:</Text>
            <View style={styles.sortPicker}>
              <Picker
                selectedValue={sortBy}
                onValueChange={(v: any) => setSortBy(v as SortOption)}
                mode="dropdown"
                dropdownIconColor="transparent"
                style={{ fontSize: 11 }}
              >
                <Picker.Item label="All" value="All" />
                <Picker.Item label="Tomato" value="Tomato" />
                <Picker.Item label="Bell Pepper" value="Bell Pepper" />
              </Picker>
            </View>

            <TouchableOpacity style={styles.filterBtn} onPress={loadData}>
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="filter-outline" size={12} color="#fff" />
              )}
            </TouchableOpacity>
          </View>

          {/* Summary Table */}
          {loading ? (
            <ActivityIndicator style={{ marginTop: 20 }} />
          ) : (
            <View style={styles.table}>
              {/* Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.cell, styles.headerCell, { flex: 2 }]}>Category</Text>
                <Text style={[styles.cell, styles.headerCell]}>Tomato</Text>
                <Text style={[styles.cell, styles.headerCell]}>Bell Pepper</Text>
                <Text style={[styles.cell, styles.headerCell]}>Total</Text>
              </View>

              {/* ---------- GREEN ---------- */}
              <TouchableOpacity style={styles.tableRow} onPress={() => toggleExpand('green')}>
                <Text style={[styles.cell, { flex: 2 }]}>
                  {expanded.green ? "Down Arrow" : "Right Arrow"} Not Damaged – Green
                </Text>
                <Text style={styles.cell}>{showTomato ? d.byCategory.green.Tomato : 0}</Text>
                <Text style={styles.cell}>{showBell ? d.byCategory.green['Bell Pepper'] : 0}</Text>
                <Text style={styles.cell}>{d.byCategory.green.total}</Text>
              </TouchableOpacity>

              {expanded.green && (
                <>
                  <View style={styles.subRow}>
                    <Text style={[styles.subCell, { flex: 2 }]}>Small</Text>
                    <Text style={styles.subCell}>{showTomato ? d.byCategory.green.small : 0}</Text>
                    <Text style={styles.subCell}>{showBell ? d.byCategory.green.small : 0}</Text>
                    <Text style={styles.subCell}>-</Text>
                  </View>
                  <View style={styles.subRow}>
                    <Text style={[styles.subCell, { flex: 2 }]}>Medium</Text>
                    <Text style={styles.subCell}>{showTomato ? d.byCategory.green.medium : 0}</Text>
                    <Text style={styles.subCell}>{showBell ? d.byCategory.green.medium : 0}</Text>
                    <Text style={styles.subCell}>-</Text>
                  </View>
                  <View style={styles.subRow}>
                    <Text style={[styles.subCell, { flex: 2 }]}>Large</Text>
                    <Text style={styles.subCell}>
                      {sortBy === 'All' || sortBy === 'Tomato' ? d.byCategory.green.large : 0}
                    </Text>
                    <Text style={styles.subCell}>
                      {sortBy === 'All' || sortBy === 'Bell Pepper' ? d.byCategory.green.large : 0}
                    </Text>
                    <Text style={styles.subCell}></Text>
                  </View>
                </>
              )}

              {/* ---------- RED ---------- */}
              <TouchableOpacity style={styles.tableRow} onPress={() => toggleExpand('red')}>
                <Text style={[styles.cell, { flex: 2 }]}>
                  {expanded.red ? "Down Arrow" : "Right Arrow"} Not Damaged – Red
                </Text>
                <Text style={styles.cell}>{showTomato ? d.byCategory.red.Tomato : 0}</Text>
                <Text style={styles.cell}>{showBell ? d.byCategory.red['Bell Pepper'] : 0}</Text>
                <Text style={styles.cell}>{d.byCategory.red.total}</Text>
              </TouchableOpacity>

              {expanded.red && (
                <>
                  <View style={styles.subRow}>
                    <Text style={[styles.subCell, { flex: 2 }]}>Small</Text>
                    <Text style={styles.subCell}>{showTomato ? d.byCategory.red.small : 0}</Text>
                    <Text style={styles.subCell}>{showBell ? d.byCategory.red.small : 0}</Text>
                    <Text style={styles.subCell}>-</Text>
                  </View>
                  <View style={styles.subRow}>
                    <Text style={[styles.subCell, { flex: 2 }]}>Medium</Text>
                    <Text style={styles.subCell}>{showTomato ? d.byCategory.red.medium : 0}</Text>
                    <Text style={styles.subCell}>{showBell ? d.byCategory.red.medium : 0}</Text>
                    <Text style={styles.subCell}>-</Text>
                  </View>
                  <View style={styles.subRow}>
                    <Text style={[styles.subCell, { flex: 2 }]}>Large</Text>
                    <Text style={styles.subCell}>
                      {sortBy === 'All' || sortBy === 'Tomato' ? d.byCategory.red.large : 0}
                    </Text>
                    <Text style={styles.subCell}>
                      {sortBy === 'All' || sortBy === 'Bell Pepper' ? d.byCategory.red.large : 0}
                    </Text>
                    <Text style={styles.subCell}></Text>
                  </View>
                </>
              )}

              {/* ---------- DAMAGED ---------- */}
              <View style={styles.tableRow}>
                <Text style={[styles.cell, { flex: 2 }]}>Damaged</Text>
                <Text style={styles.cell}>{showTomato ? d.byCategory.damaged.Tomato : 0}</Text>
                <Text style={styles.cell}>{showBell ? d.byCategory.damaged['Bell Pepper'] : 0}</Text>
                <Text style={styles.cell}>{d.byCategory.damaged.total}</Text>
              </View>

              {/* ---------- FOOTER ---------- */}
              <View style={[styles.tableRow, { borderTopWidth: 1, borderColor: '#ccc' }]}>
                <Text style={[styles.cell, { flex: 2, fontWeight: 'bold' }]}>Total Pieces</Text>
                <Text style={[styles.cell, { fontWeight: 'bold' }]}>{d.byCrop.Tomato}</Text>
                <Text style={[styles.cell, { fontWeight: 'bold' }]}>{d.byCrop['Bell Pepper']}</Text>
                <Text style={[styles.cell, { fontWeight: 'bold' }]}>{d.totalPieces}</Text>
              </View>
            </View>
          )}

          <BarChartComponent data={d} />

          {/* bottom padding */}
          <View style={{ height: 80 }} />
        </ScrollView>

        <BottomNavBar />

        {/* Date pickers */}
        <DateTimePickerModal
          isVisible={isFromPickerVisible}
          mode="date"
          onConfirm={handleConfirmFrom}
          onCancel={() => setFromPickerVisible(false)}
        />
        <DateTimePickerModal
          isVisible={isToPickerVisible}
          mode="date"
          onConfirm={handleConfirmTo}
          onCancel={() => setToPickerVisible(false)}
        />
      </View>
    </SafeAreaView>
  );
};

/* ---------- Styles (unchanged) ---------- */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f4f4f4' },
  wrapper: { flex: 1 },
  container: { padding: 10, backgroundColor: '#f4f4f4', flexGrow: 1 },
  sectionTitle: { fontSize: 22, fontWeight: '700', marginBottom: 16, marginTop: 10 },
  cardContainer: { flexDirection: 'row', justifyContent: 'space-evenly', flexWrap: 'wrap', marginBottom: 24 },
  card: {
    width: '40%',
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 10,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  cardIcon: { textAlign: 'center', marginTop: 15 },
  cardTitle: { fontSize: 12, color: '#333', alignSelf: 'center', marginTop: 5 },
  cardValue: { fontSize: 20, fontWeight: '600', marginTop: 1 },

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
  dateText: { flex: 1, color: '#333', fontSize: 9 },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'nowrap',
    marginBottom: 10,
    gap: 4,
  },
  filterLabel: { fontSize: 11, color: '#333' },
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
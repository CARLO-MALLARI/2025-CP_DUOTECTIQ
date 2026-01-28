import React from 'react';
import {View, Text, StyleSheet, ScrollView, Dimensions} from 'react-native';
import {PieChart, StackedBarChart} from 'react-native-chart-kit';

interface DashboardData {
  totalPieces: number;
  byCrop: {
    Tomato: number;
    'Bell Pepper': number;
  };
  byCategory: {
    green: {
      total: number;
      Tomato: number;
      'Bell Pepper': number;
      small: number;
      medium: number;
      large: number;
    };
    red: {
      total: number;
      Tomato: number;
      'Bell Pepper': number;
      small: number;
      medium: number;
      large: number;
    };
    damaged: {
      total: number;
      Tomato: number;
      'Bell Pepper': number;
    };
  };
  byWeek?: WeeklyStat[];
}

interface WeeklyStat {
  week: string; // e.g. "2026-W03"
  Tomato: number;
  'Bell Pepper': number;
}

interface BarChartProps {
  data: DashboardData;
}

const BarChartComponent: React.FC<BarChartProps> = ({data}) => {
  const chartWidth = Dimensions.get('window').width - 40;
  const weeklyStats = data.byWeek ?? [];

  const weeklyBarData = {
    labels: weeklyStats.map(w => w.week),
    legend: ['Tomato', 'Bell Pepper'],
    data: weeklyStats.map(w => [w.Tomato, w['Bell Pepper']]),
    barColors: ['#FF6347', '#FFD700'],
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
    style: {borderRadius: 16},
    barPercentage: 0.7,
    propsForBackgroundLines: {stroke: '#e0e0e0'},
  };

  const getTomatoPercentage = () => {
    if (data.totalPieces === 0) return 0;
    return Math.round((data.byCrop.Tomato / data.totalPieces) * 100);
  };

  const getBellPepperPercentage = () => {
    if (data.totalPieces === 0) return 0;
    return Math.round((data.byCrop['Bell Pepper'] / data.totalPieces) * 100);
  };

  const getCategoryPercentage = (value: number) => {
    if (data.totalPieces === 0) return 0;
    return Math.round((value / data.totalPieces) * 100);
  };

  const getSizeDistribution = (category: 'green' | 'red') => {
    const cat = data.byCategory[category];
    const total = cat.small + cat.medium + cat.large;
    if (total === 0) return {small: 0, medium: 0, large: 0};
    return {
      small: Math.round((cat.small / total) * 100),
      medium: Math.round((cat.medium / total) * 100),
      large: Math.round((cat.large / total) * 100),
    };
  };

  const greenSizes = getSizeDistribution('green');
  const redSizes = getSizeDistribution('red');

  // Crop distribution pie data
  const cropData = [
    {
      name: 'Tomato',
      value: data.byCrop.Tomato,
      color: '#FF6347',
      percentage: getTomatoPercentage(),
    },
    {
      name: 'Bell Pepper',
      value: data.byCrop['Bell Pepper'],
      color: '#FFD700',
      percentage: getBellPepperPercentage(),
    },
  ];

  // Stacked bar data for categories
  const stackedData = {
    labels: ['Green', 'Red', 'Damaged'],
    legend: ['Tomato', 'Bell Pepper'],
    data: [
      [data.byCategory.green.Tomato, data.byCategory.green['Bell Pepper']],
      [data.byCategory.red.Tomato, data.byCategory.red['Bell Pepper']],
      [data.byCategory.damaged.Tomato, data.byCategory.damaged['Bell Pepper']],
    ],
    barColors: ['#FF6347', '#FFD700'],
  };

  // Size distribution data
  const greenSizeData = [
    {
      name: 'Small',
      value: data.byCategory.green.small,
      color: '#C8E6C9',
      percentage: greenSizes.small,
    },
    {
      name: 'Medium',
      value: data.byCategory.green.medium,
      color: '#81C784',
      percentage: greenSizes.medium,
    },
    {
      name: 'Large',
      value: data.byCategory.green.large,
      color: '#4CAF50',
      percentage: greenSizes.large,
    },
  ];

  const redSizeData = [
    {
      name: 'Small',
      value: data.byCategory.red.small,
      color: '#FF8A80',
      percentage: redSizes.small,
    },
    {
      name: 'Medium',
      value: data.byCategory.red.medium,
      color: '#E57373',
      percentage: redSizes.medium,
    },
    {
      name: 'Large',
      value: data.byCategory.red.large,
      color: '#F44336',
      percentage: redSizes.large,
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.mainTitle}>Analytics Overview</Text>

      {/* Crop Distribution - Pie Chart */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Crop Distribution</Text>
        {data.totalPieces > 0 ? (
          <View style={{alignItems: 'center'}}>
            <PieChart
              data={cropData.map(d => ({
                name: d.name,
                population: d.value,
                color: d.color,
                legendFontColor: '#333',
                legendFontSize: 12,
              }))}
              width={chartWidth}
              height={200}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="0"
              absolute={false}
            />
            <View style={{width: chartWidth, marginTop: 20}}>
              {cropData.map(item => (
                <View key={item.name} style={styles.statRow}>
                  <View style={styles.statHeader}>
                    <View
                      style={[styles.colorDot, {backgroundColor: item.color}]}
                    />
                    <Text style={styles.statLabel}>{item.name}</Text>
                  </View>
                  <View style={styles.statDetails}>
                    <Text style={styles.statValue}>{item.value}</Text>
                    <Text style={styles.statPercent}>{item.percentage}%</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <Text style={{textAlign: 'center', color: '#666'}}>
            No data available
          </Text>
        )}
      </View>
      {/* Size Distribution - Pie Charts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Size Distribution (Not Damaged)</Text>

        {data.byCategory.green.total > 0 && (
          <View style={{alignItems: 'center', marginBottom: 32}}>
            <Text style={[styles.categoryTitle, {marginBottom: 12}]}>
              Not Damaged - Green
            </Text>
            <PieChart
              data={greenSizeData.map(d => ({
                name: d.name,
                population: d.value,
                color: d.color,
                legendFontColor: '#333',
                legendFontSize: 10,
              }))}
              width={chartWidth}
              height={220}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="0"
              absolute={false}
            />
            <View style={styles.sizeRow}>
              {greenSizeData.map(item => (
                <View key={item.name} style={styles.sizeItem}>
                  <View
                    style={[styles.colorDot, {backgroundColor: item.color}]}
                  />
                  <Text style={styles.sizeLabel}>{item.name}</Text>
                  <Text style={styles.sizeValue}>{item.value}</Text>
                  <Text style={styles.sizePercent}>{item.percentage}%</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {data.byCategory.red.total > 0 && (
          <View style={{alignItems: 'center'}}>
            <Text style={[styles.categoryTitle, {marginBottom: 12}]}>
              Not Damaged - Red
            </Text>
            <PieChart
              data={redSizeData.map(d => ({
                name: d.name,
                population: d.value,
                color: d.color,
                legendFontColor: '#333',
                legendFontSize: 10,
              }))}
              width={chartWidth}
              height={220}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="0"
              absolute={false}
            />
            <View style={styles.sizeRow}>
              {redSizeData.map(item => (
                <View key={item.name} style={styles.sizeItem}>
                  <View
                    style={[styles.colorDot, {backgroundColor: item.color}]}
                  />
                  <Text style={styles.sizeLabel}>{item.name}</Text>
                  <Text style={styles.sizeValue}>{item.value}</Text>
                  <Text style={styles.sizePercent}>{item.percentage}%</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Weekly Production</Text>

        {weeklyStats.length > 0 ? (
          <StackedBarChart
            data={weeklyBarData}
            width={chartWidth}
            height={280}
            chartConfig={chartConfig}
            hideLegend={false}
          />
        ) : (
          <Text style={{textAlign: 'center', color: '#666'}}>
            No weekly data available
          </Text>
        )}
      </View>

      {/* Quality Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quality Metrics</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total Sorted</Text>
            <Text style={[styles.metricValue, {color: '#007a33'}]}>
              {data.totalPieces}
            </Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Undamaged</Text>
            <Text style={[styles.metricValue, {color: '#4CAF50'}]}>
              {data.byCategory.green.total + data.byCategory.red.total}
            </Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Damage Rate</Text>
            <Text style={[styles.metricValue, {color: '#F44336'}]}>
              {getCategoryPercentage(data.byCategory.damaged.total)}%
            </Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Quality Score</Text>
            <Text style={[styles.metricValue, {color: '#2196F3'}]}>
              {100 - getCategoryPercentage(data.byCategory.damaged.total)}%
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

// Styles remain the same (copy from your original code)
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginTop: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  statDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statPercent: {
    fontSize: 14,
    color: '#666',
    minWidth: 40,
    textAlign: 'right',
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  sizeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  sizeItem: {
    alignItems: 'center',
    flex: 1,
  },
  sizeLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
    marginTop: 4,
  },
  sizeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  sizePercent: {
    fontSize: 11,
    color: '#007a33',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  metricCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    width: '48%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  metricLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 6,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '700',
  },
});

export default BarChartComponent;

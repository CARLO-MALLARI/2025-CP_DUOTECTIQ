import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

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
}

interface BarChartProps {
  data: DashboardData;
}

const BarChartComponent: React.FC<BarChartProps> = ({ data }) => {
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
    if (total === 0) return { small: 0, medium: 0, large: 0 };
    return {
      small: Math.round((cat.small / total) * 100),
      medium: Math.round((cat.medium / total) * 100),
      large: Math.round((cat.large / total) * 100),
    };
  };

  const greenSizes = getSizeDistribution('green');
  const redSizes = getSizeDistribution('red');

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.mainTitle}>Analytics Overview</Text>

      {/* Overall Distribution */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Crop Distribution</Text>
        
        {/* Tomato */}
        <View style={styles.statRow}>
          <View style={styles.statHeader}>
            <View style={[styles.colorDot, { backgroundColor: '#FF6347' }]} />
            <Text style={styles.statLabel}>Tomato</Text>
          </View>
          <View style={styles.statDetails}>
            <Text style={styles.statValue}>{data.byCrop.Tomato}</Text>
            <Text style={styles.statPercent}>{getTomatoPercentage()}%</Text>
          </View>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${getTomatoPercentage()}%`, backgroundColor: '#FF6347' },
            ]}
          />
        </View>

        {/* Bell Pepper */}
        <View style={[styles.statRow, { marginTop: 16 }]}>
          <View style={styles.statHeader}>
            <View style={[styles.colorDot, { backgroundColor: '#FFD700' }]} />
            <Text style={styles.statLabel}>Bell Pepper</Text>
          </View>
          <View style={styles.statDetails}>
            <Text style={styles.statValue}>{data.byCrop['Bell Pepper']}</Text>
            <Text style={styles.statPercent}>{getBellPepperPercentage()}%</Text>
          </View>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${getBellPepperPercentage()}%`, backgroundColor: '#FFD700' },
            ]}
          />
        </View>
      </View>

      {/* Category Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Category Breakdown</Text>

        {/* Green */}
        <View style={styles.categoryCard}>
          <View style={styles.categoryHeader}>
            <View style={[styles.categoryDot, { backgroundColor: '#4CAF50' }]} />
            <Text style={styles.categoryTitle}>Not Damaged - Green</Text>
          </View>
          
          <View style={styles.categoryStats}>
            <View style={styles.categoryStatItem}>
              <Text style={styles.categoryStatLabel}>Total</Text>
              <Text style={styles.categoryStatValue}>{data.byCategory.green.total}</Text>
              <Text style={styles.categoryStatPercent}>
                {getCategoryPercentage(data.byCategory.green.total)}%
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.categoryStatItem}>
              <Text style={styles.categoryStatLabel}>Tomato</Text>
              <Text style={styles.categoryStatValue}>{data.byCategory.green.Tomato}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.categoryStatItem}>
              <Text style={styles.categoryStatLabel}>Bell Pepper</Text>
              <Text style={styles.categoryStatValue}>{data.byCategory.green['Bell Pepper']}</Text>
            </View>
          </View>

          {/* Size distribution */}
          {data.byCategory.green.total > 0 && (
            <View style={styles.sizeDistribution}>
              <Text style={styles.sizeTitle}>Size Distribution</Text>
              <View style={styles.sizeRow}>
                <View style={styles.sizeItem}>
                  <Text style={styles.sizeLabel}>Small</Text>
                  <Text style={styles.sizeValue}>{data.byCategory.green.small}</Text>
                  <Text style={styles.sizePercent}>{greenSizes.small}%</Text>
                </View>
                <View style={styles.sizeItem}>
                  <Text style={styles.sizeLabel}>Medium</Text>
                  <Text style={styles.sizeValue}>{data.byCategory.green.medium}</Text>
                  <Text style={styles.sizePercent}>{greenSizes.medium}%</Text>
                </View>
                <View style={styles.sizeItem}>
                  <Text style={styles.sizeLabel}>Large</Text>
                  <Text style={styles.sizeValue}>{data.byCategory.green.large}</Text>
                  <Text style={styles.sizePercent}>{greenSizes.large}%</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Red */}
        <View style={styles.categoryCard}>
          <View style={styles.categoryHeader}>
            <View style={[styles.categoryDot, { backgroundColor: '#F44336' }]} />
            <Text style={styles.categoryTitle}>Not Damaged - Red</Text>
          </View>
          
          <View style={styles.categoryStats}>
            <View style={styles.categoryStatItem}>
              <Text style={styles.categoryStatLabel}>Total</Text>
              <Text style={styles.categoryStatValue}>{data.byCategory.red.total}</Text>
              <Text style={styles.categoryStatPercent}>
                {getCategoryPercentage(data.byCategory.red.total)}%
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.categoryStatItem}>
              <Text style={styles.categoryStatLabel}>Tomato</Text>
              <Text style={styles.categoryStatValue}>{data.byCategory.red.Tomato}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.categoryStatItem}>
              <Text style={styles.categoryStatLabel}>Bell Pepper</Text>
              <Text style={styles.categoryStatValue}>{data.byCategory.red['Bell Pepper']}</Text>
            </View>
          </View>

          {/* Size distribution */}
          {data.byCategory.red.total > 0 && (
            <View style={styles.sizeDistribution}>
              <Text style={styles.sizeTitle}>Size Distribution</Text>
              <View style={styles.sizeRow}>
                <View style={styles.sizeItem}>
                  <Text style={styles.sizeLabel}>Small</Text>
                  <Text style={styles.sizeValue}>{data.byCategory.red.small}</Text>
                  <Text style={styles.sizePercent}>{redSizes.small}%</Text>
                </View>
                <View style={styles.sizeItem}>
                  <Text style={styles.sizeLabel}>Medium</Text>
                  <Text style={styles.sizeValue}>{data.byCategory.red.medium}</Text>
                  <Text style={styles.sizePercent}>{redSizes.medium}%</Text>
                </View>
                <View style={styles.sizeItem}>
                  <Text style={styles.sizeLabel}>Large</Text>
                  <Text style={styles.sizeValue}>{data.byCategory.red.large}</Text>
                  <Text style={styles.sizePercent}>{redSizes.large}%</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Damaged */}
        <View style={styles.categoryCard}>
          <View style={styles.categoryHeader}>
            <View style={[styles.categoryDot, { backgroundColor: '#FFA726' }]} />
            <Text style={styles.categoryTitle}>Damaged</Text>
          </View>
          
          <View style={styles.categoryStats}>
            <View style={styles.categoryStatItem}>
              <Text style={styles.categoryStatLabel}>Total</Text>
              <Text style={styles.categoryStatValue}>{data.byCategory.damaged.total}</Text>
              <Text style={styles.categoryStatPercent}>
                {getCategoryPercentage(data.byCategory.damaged.total)}%
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.categoryStatItem}>
              <Text style={styles.categoryStatLabel}>Tomato</Text>
              <Text style={styles.categoryStatValue}>{data.byCategory.damaged.Tomato}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.categoryStatItem}>
              <Text style={styles.categoryStatLabel}>Bell Pepper</Text>
              <Text style={styles.categoryStatValue}>{data.byCategory.damaged['Bell Pepper']}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Quality Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quality Metrics</Text>
        
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total Sorted</Text>
            <Text style={[styles.metricValue, { color: '#007a33' }]}>
              {data.totalPieces}
            </Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Undamaged</Text>
            <Text style={[styles.metricValue, { color: '#4CAF50' }]}>
              {data.byCategory.green.total + data.byCategory.red.total}
            </Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Damage Rate</Text>
            <Text style={[styles.metricValue, { color: '#F44336' }]}>
              {getCategoryPercentage(data.byCategory.damaged.total)}%
            </Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Quality Score</Text>
            <Text style={[styles.metricValue, { color: '#2196F3' }]}>
              {100 - getCategoryPercentage(data.byCategory.damaged.total)}%
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

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
  progressBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  categoryCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 8,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  categoryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  categoryStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  categoryStatLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  categoryStatValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  categoryStatPercent: {
    fontSize: 12,
    color: '#007a33',
  },
  divider: {
    width: 1,
    backgroundColor: '#ddd',
    marginHorizontal: 8,
  },
  sizeDistribution: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 10,
    marginTop: 8,
  },
  sizeTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  sizeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  sizeItem: {
    alignItems: 'center',
    flex: 1,
  },
  sizeLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
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
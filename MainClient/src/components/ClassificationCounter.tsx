import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CounterData } from '../types/detection.types';

interface ClassificationCounterProps {
  data: CounterData;
}

const SIZES = ['small', 'medium', 'large'] as const;
const LABELS = ['Tomato', 'Bellpepper'] as const;

const COLORS = {
  green: '#22C55E',
  damaged: '#dc9026ff',
  red: '#DC2626',
};

export const ClassificationCounter: React.FC<ClassificationCounterProps> = ({ data }) => {
  return (
    <View style={styles.counterContainer}>
      {LABELS.map((label) => (
        <View key={label} style={styles.counterColumn}>
          <Text style={styles.counterHeader}>{label}</Text>

          {/* Total Row */}
          <View style={styles.counterRow}>
            <CounterBox color={COLORS.green} value={data[label].total.green} />
            <CounterBox color={COLORS.damaged} value={data[label].total.damaged} />
            <CounterBox color={COLORS.red} value={data[label].total.red} />
          </View>

          {/* Size Rows */}
          {SIZES.map((size) => (
            <View style={styles.counterRow} key={size}>
              <CounterBox color={COLORS.green} value={data[label][size].green} />
              <Text style={styles.counterLabel}>
                {size.charAt(0).toUpperCase() + size.slice(1)}
              </Text>
              <CounterBox color={COLORS.red} value={data[label][size].red} />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
};

interface CounterBoxProps {
  color: string;
  value: number;
}

const CounterBox: React.FC<CounterBoxProps> = ({ color, value }) => (
  <View style={[styles.counterBox, { backgroundColor: color }]}>
    <Text style={styles.counterValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  counterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 10,
    marginBottom: 15,
    elevation: 2,
  },
  counterColumn: {
    alignItems: 'center',
  },
  counterHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    justifyContent: 'center',
  },
  counterBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 3,
  },
  counterValue: {
    color: 'white',
    fontWeight: 'bold',
  },
  counterLabel: {
    width: 50,
    textAlign: 'center',
    fontSize: 12,
  },
});
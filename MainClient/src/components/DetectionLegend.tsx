import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

const LEGEND_ITEMS = [
  {color: 'green', label: 'Not Damaged Green'},
  {color: 'orange', label: 'Damaged'},
  {color: 'red', label: 'Not Damaged Red'},
];

export const DetectionLegend: React.FC = () => {
  return (
    <View style={styles.legendRow}>
      {LEGEND_ITEMS.map((item, index) => (
        <View key={index} style={styles.legendItem}>
          <View style={[styles.legendDot, {backgroundColor: item.color}]} />
          <Text style={styles.legendText}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 4,
  },
  legendText: {
    fontSize: 12,
  },
});

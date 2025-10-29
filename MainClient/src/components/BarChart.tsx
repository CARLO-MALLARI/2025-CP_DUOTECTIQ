import React, { useState } from "react";
import { View, Text, StyleSheet, Dimensions, ScrollView } from "react-native";
import { BarChart } from "react-native-chart-kit";
import { Picker } from "@react-native-picker/picker";

const screenWidth = Dimensions.get("window").width;

// Define colors for each status
const STATUS_COLORS = {
  red: "#C62828",
  green: "#2E7D32",
  damaged: "#FBC02D",
};

// ---- TYPE DEFINITIONS ----
type CropType = "Tomato" | "Bell Pepper";
type SizeType = "Small" | "Medium" | "Large";
type DataMap = Record<CropType, Record<SizeType, number[]>>;

// ---- DUMMY DATA ----
const dummyData: DataMap = {
  Tomato: {
    Small: [120, 100, 150, 90, 110, 130, 140],
    Medium: [150, 130, 180, 110, 140, 160, 170],
    Large: [200, 180, 220, 150, 190, 210, 230],
  },
  "Bell Pepper": {
    Small: [100, 90, 120, 80, 100, 115, 125],
    Medium: [130, 110, 160, 100, 120, 140, 150],
    Large: [180, 160, 210, 140, 170, 190, 200],
  },
};

// ---- OTHER CONSTANTS ----
const damageRatio = 0.3;
const months = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb"];

const chartConfig = {
  backgroundGradientFrom: "#fff",
  backgroundGradientTo: "#fff",
  decimalPlaces: 0,
  barPercentage: 0.5,
  color: (opacity = 1) => `rgba(0,0,0,${opacity})`,
  labelColor: (opacity = 1) => `rgba(80,80,80,${opacity})`,
  propsForLabels: { fontSize: 12 },
};

export default function ProduceDashboardChart() {
  const [crop, setCrop] = useState<CropType | "Please select">("Please select");
  const [size, setSize] = useState<SizeType | "Please select">("Please select");

  const getChartData = () => {
    if (crop === "Please select" || size === "Please select") {
      return { 
        labels: months,
        datasets: [{ data: [0, 0, 0, 0, 0, 0, 0], color: () => "#ccc" }] 
    };
    }

    const base = dummyData[crop][size];
    const damaged = base.map((v: number) => v * damageRatio);
    const good = base.map((v: number) => v - v * damageRatio);

    return {
      labels: months,
      datasets: [
        {
          data: good.map((v: number) => v * 0.6),
          color: () => STATUS_COLORS.red,
        },
        {
          data: good.map((v: number) => v * 0.4),
          color: () => STATUS_COLORS.green,
        },
        {
          data: damaged,
          color: () => STATUS_COLORS.damaged,
        },
      ],
    };
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        {/* Filters */}
        <View style={styles.filterRow}>
          <View style={styles.filter}>
            <Text style={styles.filterLabel}>Crop:</Text>
            <Picker
              selectedValue={crop}
              onValueChange={(value) => setCrop(value as CropType | "Please select")}
              style={styles.picker}
            >
              <Picker.Item label="Please select" value="Please select" />
              <Picker.Item label="Tomato" value="Tomato" />
              <Picker.Item label="Bell Pepper" value="Bell Pepper" />
            </Picker>
          </View>

          <View style={styles.filter}>
            <Text style={styles.filterLabel}>Size:</Text>
            <Picker
              selectedValue={size}
              onValueChange={(value) => setSize(value as SizeType | "Please select")}
              style={styles.picker}
            >
              <Picker.Item label="Please select" value="Please select" />
              <Picker.Item label="Small" value="Small" />
              <Picker.Item label="Medium" value="Medium" />
              <Picker.Item label="Large" value="Large" />
            </Picker>
          </View>
        </View>

        {/* Chart */}
        <View style={{ alignItems: "center" }}>
          <BarChart
            data={getChartData()}
            width={screenWidth - 32}
            height={300}
            fromZero
            showValuesOnTopOfBars
            withCustomBarColorFromData
            flatColor
            chartConfig={chartConfig}
            style={styles.chart}
            yAxisLabel=""
            yAxisSuffix=""
          />
        </View>

        {/* Legend */}
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendDot, { backgroundColor: STATUS_COLORS.red }]}
            />
            <Text style={styles.legendText}>Not Damaged Red</Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendDot, { backgroundColor: STATUS_COLORS.green }]}
            />
            <Text style={styles.legendText}>Not Damaged Green</Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendDot, { backgroundColor: STATUS_COLORS.damaged }]}
            />
            <Text style={styles.legendText}>Damaged</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E0E0E0",
    padding: 1,
    marginTop: 10,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    flexWrap: "wrap",
  },
  filter: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  filterLabel: {
    fontWeight: "bold",
    marginRight: 6,
  },
  picker: {
    height: 40,
    width: 150,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 12,
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    marginTop: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
    marginBottom: 4,
  },
  legendDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 4,
  },
  legendText: {
    fontSize: 12,
  },
});

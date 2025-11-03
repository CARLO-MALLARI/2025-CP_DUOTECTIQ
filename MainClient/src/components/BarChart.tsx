import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
} from "react-native";
import { BarChart } from "react-native-chart-kit";
import { Picker } from "@react-native-picker/picker";

const screenWidth = Dimensions.get("window").width;

const STATUS_COLORS = {
  red: "#C62828",
  green: "#2E7D32",
  damaged: "#FBC02D",
};

type CropType = "Tomato" | "Bell Pepper";
type SizeType = "Small" | "Medium" | "Large";

export interface BarChartProps {
  /** Aggregated data from firebaseDashboardHelper */
  data: {
    byCrop: Record<CropType, number>;
    byCategory: {
      green: { total: number; small: number; medium: number };
      red: { total: number; small: number; medium: number };
      damaged: { total: number };
    };
  };
}

/* -------------------------------------------------------------
   2. Component
   ------------------------------------------------------------- */
const BarChartComponent: React.FC<BarChartProps> = ({ data }) => {
  const [crop, setCrop] = useState<CropType | "Please select">(
    "Please select"
  );
  const [size, setSize] = useState<SizeType | "Please select">(
    "Please select"
  );

  const getChartData = () => {
    // If a picker is not selected → empty chart
    if (crop === "Please select" || size === "Please select") {
      return {
        labels: ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb"],
        datasets: [{ data: [0, 0, 0, 0, 0, 0, 0], color: () => "#ccc" }],
      };
    }

    /* ---------------------------------------------------------
       1. Base amount for the selected crop+size
       --------------------------------------------------------- */
    const totalForCrop = data.byCrop[crop];

    // We only have totals per size, not per month → spread evenly
    const monthsCount = 7;
    const basePerMonth = totalForCrop / monthsCount;

    // Split into size buckets
    const sizeMap: Record<SizeType, number> = {
      Small: 0,
      Medium: 0,
      Large: 0,
    };

    // Pull the correct size bucket from the category data
    if (size === "Small") {
      sizeMap.Small =
        (crop === "Tomato"
          ? data.byCategory.green.small + data.byCategory.red.small
          : 0) +
        (crop === "Bell Pepper"
          ? data.byCategory.green.small + data.byCategory.red.small
          : 0);
    } else if (size === "Medium") {
      sizeMap.Medium =
        (crop === "Tomato"
          ? data.byCategory.green.medium + data.byCategory.red.medium
          : 0) +
        (crop === "Bell Pepper"
          ? data.byCategory.green.medium + data.byCategory.red.medium
          : 0);
    } else {
      // Large = everything that is not small/medium (you can add a Large bucket later)
      sizeMap.Large = totalForCrop - sizeMap.Small - sizeMap.Medium;
    }

    const base = sizeMap[size];
    const perMonth = base / monthsCount;

    /* ---------------------------------------------------------
       2. Damage ratio (30 % – same as your dummy version)
       --------------------------------------------------------- */
    const damageRatio = 0.3;
    const damagedPerMonth = perMonth * damageRatio;
    const goodPerMonth = perMonth - damagedPerMonth;

    /* ---------------------------------------------------------
       3. Split good into red / green (60 % red, 40 % green)
       --------------------------------------------------------- */
    const goodRed = goodPerMonth * 0.6;
    const goodGreen = goodPerMonth * 0.4;

    const monthArray = Array(monthsCount).fill(0);

    return {
      labels: ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb"],
      datasets: [
        {
          data: monthArray.map(() => goodRed),
          color: () => STATUS_COLORS.red,
        },
        {
          data: monthArray.map(() => goodGreen),
          color: () => STATUS_COLORS.green,
        },
        {
          data: monthArray.map(() => damagedPerMonth),
          color: () => STATUS_COLORS.damaged,
        },
      ],
    };
  };

  const chartConfig = {
    backgroundGradientFrom: "#fff",
    backgroundGradientTo: "#fff",
    decimalPlaces: 0,
    barPercentage: 0.5,
    color: (opacity = 1) => `rgba(0,0,0,${opacity})`,
    labelColor: (opacity = 1) => `rgba(80,80,80,${opacity})`,
    propsForLabels: { fontSize: 12 },
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        {/* ---------- Filters ---------- */}
        <View style={styles.filterRow}>
          <View style={styles.filter}>
            <Text style={styles.filterLabel}>Crop:</Text>
            <Picker
              selectedValue={crop}
              onValueChange={(v) =>
                setCrop(v as CropType | "Please select")
              }
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
              onValueChange={(v) =>
                setSize(v as SizeType | "Please select")
              }
              style={styles.picker}
            >
              <Picker.Item label="Please select" value="Please select" />
              <Picker.Item label="Small" value="Small" />
              <Picker.Item label="Medium" value="Medium" />
              <Picker.Item label="Large" value="Large" />
            </Picker>
          </View>
        </View>

        {/* ---------- Chart ---------- */}
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

        {/* ---------- Legend ---------- */}
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: STATUS_COLORS.red },
              ]}
            />
            <Text style={styles.legendText}>Not Damaged Red</Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: STATUS_COLORS.green },
              ]}
            />
            <Text style={styles.legendText}>Not Damaged Green</Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: STATUS_COLORS.damaged },
              ]}
            />
            <Text style={styles.legendText}>Damaged</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

/* -------------------------------------------------------------
   3. Styles (unchanged – only tiny tweaks for readability)
   ------------------------------------------------------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E0E0E0",
    padding: 1,
    marginTop: 10,
    borderRadius: 12,
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
    height: 20,
    width: 100,
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

export default BarChartComponent;
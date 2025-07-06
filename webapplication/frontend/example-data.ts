import { DataPoint } from "./types";

export const exampleDataPoints: DataPoint[] = [
  {
    id: 1,
    leezenbox_id: 101,
    timestamp: "2025-07-06T08:15:30.000Z",
    predictions: [
      {
        id: 1,
        datapoint_id: 1,
        position_x: 245,
        position_y: 180,
        label: "bike",
        confidence: 0.92,
      },
      {
        id: 2,
        datapoint_id: 1,
        position_x: 450,
        position_y: 220,
        label: "saddle",
        confidence: 0.87,
      },
    ],
  },
  {
    id: 2,
    leezenbox_id: 101,
    timestamp: "2025-07-06T08:22:15.000Z",
    predictions: [
      {
        id: 3,
        datapoint_id: 2,
        position_x: 320,
        position_y: 195,
        label: "bike",
        confidence: 0.95,
      },
      {
        id: 4,
        datapoint_id: 2,
        position_x: 320,
        position_y: 165,
        label: "saddle",
        confidence: 0.89,
      },
      {
        id: 5,
        datapoint_id: 2,
        position_x: 580,
        position_y: 240,
        label: "bike",
        confidence: 0.78,
      },
    ],
  },
  {
    id: 3,
    leezenbox_id: 102,
    timestamp: "2025-07-06T09:05:42.000Z",
    predictions: [
      {
        id: 6,
        datapoint_id: 3,
        position_x: 150,
        position_y: 300,
        label: "bike",
        confidence: 0.84,
      },
      {
        id: 7,
        datapoint_id: 3,
        position_x: 150,
        position_y: 275,
        label: "saddle",
        confidence: 0.91,
      },
      {
        id: 8,
        datapoint_id: 3,
        position_x: 380,
        position_y: 285,
        label: "bike",
        confidence: 0.88,
      },
      {
        id: 9,
        datapoint_id: 3,
        position_x: 380,
        position_y: 260,
        label: "saddle",
        confidence: 0.82,
      },
      {
        id: 10,
        datapoint_id: 3,
        position_x: 520,
        position_y: 310,
        label: "bike",
        confidence: 0.76,
      },
    ],
  },
  {
    id: 4,
    leezenbox_id: 103,
    timestamp: "2025-07-06T10:30:18.000Z",
    predictions: [
      {
        id: 11,
        datapoint_id: 4,
        position_x: 200,
        position_y: 150,
        label: "bike",
        confidence: 0.93,
      },
      {
        id: 12,
        datapoint_id: 4,
        position_x: 200,
        position_y: 125,
        label: "saddle",
        confidence: 0.85,
      },
    ],
  },
  {
    id: 5,
    leezenbox_id: 101,
    timestamp: "2025-07-06T11:45:55.000Z",
    predictions: [],
  },
  {
    id: 6,
    leezenbox_id: 102,
    timestamp: "2025-07-06T12:15:33.000Z",
    predictions: [
      {
        id: 13,
        datapoint_id: 6,
        position_x: 280,
        position_y: 190,
        label: "bike",
        confidence: 0.89,
      },
      {
        id: 14,
        datapoint_id: 6,
        position_x: 280,
        position_y: 165,
        label: "saddle",
        confidence: 0.94,
      },
      {
        id: 15,
        datapoint_id: 6,
        position_x: 420,
        position_y: 205,
        label: "bike",
        confidence: 0.81,
      },
      {
        id: 16,
        datapoint_id: 6,
        position_x: 420,
        position_y: 180,
        label: "saddle",
        confidence: 0.77,
      },
      {
        id: 17,
        datapoint_id: 6,
        position_x: 550,
        position_y: 220,
        label: "bike",
        confidence: 0.86,
      },
      {
        id: 18,
        datapoint_id: 6,
        position_x: 640,
        position_y: 250,
        label: "bike",
        confidence: 0.72,
      },
    ],
  },
  {
    id: 7,
    leezenbox_id: 104,
    timestamp: "2025-07-06T14:20:10.000Z",
    predictions: [
      {
        id: 19,
        datapoint_id: 7,
        position_x: 300,
        position_y: 400,
        label: "bike",
        confidence: 0.9,
      },
      {
        id: 20,
        datapoint_id: 7,
        position_x: 300,
        position_y: 375,
        label: "saddle",
        confidence: 0.88,
      },
    ],
  },
  {
    id: 8,
    leezenbox_id: 103,
    timestamp: "2025-07-06T15:55:27.000Z",
    predictions: [
      {
        id: 21,
        datapoint_id: 8,
        position_x: 180,
        position_y: 120,
        label: "bike",
        confidence: 0.95,
      },
      {
        id: 22,
        datapoint_id: 8,
        position_x: 180,
        position_y: 95,
        label: "saddle",
        confidence: 0.92,
      },
      {
        id: 23,
        datapoint_id: 8,
        position_x: 350,
        position_y: 140,
        label: "bike",
        confidence: 0.83,
      },
      {
        id: 24,
        datapoint_id: 8,
        position_x: 350,
        position_y: 115,
        label: "saddle",
        confidence: 0.79,
      },
      {
        id: 25,
        datapoint_id: 8,
        position_x: 480,
        position_y: 160,
        label: "bike",
        confidence: 0.87,
      },
    ],
  },
];

// Helper function to get data points for a specific leezenbox
export const getDataPointsByLeezenboxId = (
  leezenboxId: number
): DataPoint[] => {
  return exampleDataPoints.filter(
    (dataPoint) => dataPoint.leezenbox_id === leezenboxId
  );
};

// Helper function to get data points within a time range
export const getDataPointsByTimeRange = (
  startTime: string,
  endTime: string
): DataPoint[] => {
  const start = new Date(startTime);
  const end = new Date(endTime);

  return exampleDataPoints.filter((dataPoint) => {
    const timestamp = new Date(dataPoint.timestamp);
    return timestamp >= start && timestamp <= end;
  });
};

// Helper function to count total bikes detected in a data point
export const countBikesInDataPoint = (dataPoint: DataPoint): number => {
  return dataPoint.predictions.filter(
    (prediction) => prediction.label === "bike"
  ).length;
};

// Helper function to count total saddles detected in a data point
export const countSaddlesInDataPoint = (dataPoint: DataPoint): number => {
  return dataPoint.predictions.filter(
    (prediction) => prediction.label === "saddle"
  ).length;
};

import { DataPoint } from "./types";

export const exampleDataPoints: DataPoint[] = [
  {
    id: 1,
    leezenbox_id: 101,
    timestamp: "2025-07-06T08:15:30.000Z",
    predictions: [
      {
        category: 1,
        bbox: [0.554063, 0.8, 0.071875, 0.4],
        confidence: 0.95,
      },
      {
        category: 2,
        bbox: [0.28125, 0.183333, 0.3, 0.216667],
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
        category: 1,
        bbox: [320, 195, 350, 225],
        confidence: 0.95,
      },
      {
        category: 2,
        bbox: [580, 240, 600, 270],
        confidence: 0.78,
      },
      {
        category: 0,
        bbox: [320, 165, 350, 195],
        confidence: 0.89,
      },
      {
        category: 2,
        bbox: [320, 165, 350, 195],
        confidence: 0.89,
      },
      {
        category: 0,
        bbox: [320, 165, 350, 195],
        confidence: 0.89,
      },
    ],
  },
  {
    id: 3,
    leezenbox_id: 102,
    timestamp: "2025-07-06T09:05:42.000Z",
    predictions: [
      {
        category: 1,
        bbox: [150, 300, 180, 330],
        confidence: 0.84,
      },
      {
        category: 2,
        bbox: [150, 275, 180, 305],
        confidence: 0.91,
      },
      {
        category: 1,
        bbox: [380, 285, 410, 315],
        confidence: 0.88,
      },
      {
        category: 2,
        bbox: [380, 260, 410, 290],
        confidence: 0.82,
      },
      {
        category: 1,
        bbox: [520, 310, 550, 340],
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
        category: 1,
        bbox: [200, 150, 230, 180],
        confidence: 0.93,
      },
      {
        category: 2,
        bbox: [200, 125, 230, 155],
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
        category: 1,
        bbox: [280, 190, 310, 220],
        confidence: 0.89,
      },
      {
        category: 2,
        bbox: [280, 165, 310, 195],
        confidence: 0.94,
      },
      {
        category: 1,
        bbox: [420, 205, 450, 235],
        confidence: 0.81,
      },
      {
        category: 2,
        bbox: [420, 180, 450, 210],
        confidence: 0.77,
      },
      {
        category: 1,
        bbox: [550, 220, 580, 250],
        confidence: 0.86,
      },
      {
        category: 1,
        bbox: [640, 250, 670, 280],
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
        category: 1,
        bbox: [300, 400, 330, 430],
        confidence: 0.9,
      },
      {
        category: 2,
        bbox: [300, 375, 330, 405],
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
        category: 1,
        bbox: [180, 120, 210, 150],
        confidence: 0.95,
      },
      {
        category: 2,
        bbox: [180, 95, 210, 125],
        confidence: 0.92,
      },
      {
        category: 1,
        bbox: [350, 140, 380, 170],
        confidence: 0.83,
      },
      {
        category: 2,
        bbox: [350, 115, 380, 145],
        confidence: 0.79,
      },
      {
        category: 1,
        bbox: [480, 160, 510, 190],
        confidence: 0.87,
      },
    ],
  },
  {
    id: 9,
    leezenbox_id: 101,
    timestamp: "2025-07-09T16:30:00.000Z",
    predictions: [
      // Category 0 predictions
      {
        category: 0,
        bbox: [0.554063, 0.8, 0.071875, 0.4],
        confidence: 0.85,
      },
      {
        category: 0,
        bbox: [0.46375, 0.797917, 0.0525, 0.394167],
        confidence: 0.82,
      },
      {
        category: 0,
        bbox: [0.399375, 0.735, 0.0575, 0.391667],
        confidence: 0.88,
      },
      {
        category: 0,
        bbox: [0.707187, 0.744583, 0.100625, 0.349167],
        confidence: 0.9,
      },
      {
        category: 0,
        bbox: [0.765938, 0.788333, 0.068125, 0.343333],
        confidence: 0.87,
      },
      {
        category: 0,
        bbox: [0.1775, 0.659167, 0.12625, 0.323333],
        confidence: 0.83,
      },
      {
        category: 0,
        bbox: [0.335938, 0.635417, 0.100625, 0.3775],
        confidence: 0.89,
      },
      {
        category: 0,
        bbox: [0.269062, 0.757083, 0.113125, 0.289167],
        confidence: 0.84,
      },
      {
        category: 0,
        bbox: [0.849688, 0.595, 0.125625, 0.33],
        confidence: 0.86,
      },
      {
        category: 0,
        bbox: [0.04375, 0.555833, 0.0875, 0.333333],
        confidence: 0.81,
      },
      {
        category: 0,
        bbox: [0.860938, 0.785417, 0.094375, 0.335833],
        confidence: 0.88,
      },
      {
        category: 0,
        bbox: [0.921875, 0.724583, 0.13625, 0.299167],
        confidence: 0.85,
      },
      {
        category: 0,
        bbox: [0.8075, 0.13125, 0.075, 0.2625],
        confidence: 0.79,
      },
      // Category 1 predictions
      {
        category: 1,
        bbox: [0.56875, 0.745, 0.0375, 0.081667],
        confidence: 0.92,
      },
      {
        category: 1,
        bbox: [0.45625, 0.775417, 0.03, 0.070833],
        confidence: 0.9,
      },
      {
        category: 1,
        bbox: [0.385313, 0.695, 0.035625, 0.066667],
        confidence: 0.88,
      },
      {
        category: 1,
        bbox: [0.33625, 0.590833, 0.0425, 0.06],
        confidence: 0.85,
      },
      {
        category: 1,
        bbox: [0.129688, 0.635417, 0.033125, 0.069167],
        confidence: 0.87,
      },
      {
        category: 1,
        bbox: [0.759687, 0.722917, 0.045625, 0.064167],
        confidence: 0.91,
      },
      {
        category: 1,
        bbox: [0.821562, 0.786667, 0.036875, 0.065],
        confidence: 0.89,
      },
      {
        category: 1,
        bbox: [0.913438, 0.555, 0.030625, 0.058333],
        confidence: 0.84,
      },
      {
        category: 1,
        bbox: [0.920937, 0.765417, 0.024375, 0.065833],
        confidence: 0.86,
      },
      {
        category: 1,
        bbox: [0.958125, 0.695, 0.01875, 0.05],
        confidence: 0.83,
      },
      {
        category: 1,
        bbox: [0.88875, 0.037917, 0.035, 0.0525],
        confidence: 0.8,
      },
      {
        category: 1,
        bbox: [0.990938, 0.104167, 0.018124, 0.041667],
        confidence: 0.78,
      },
      {
        category: 1,
        bbox: [0.252912, 0.759983, 0.034942, 0.062396],
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
  return dataPoint.predictions.filter((prediction) => prediction.category === 1)
    .length;
};

// Helper function to count total saddles detected in a data point
export const countSaddlesInDataPoint = (dataPoint: DataPoint): number => {
  return dataPoint.predictions.filter((prediction) => prediction.category === 2)
    .length;
};

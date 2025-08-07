import { DataPoint, LeezenboxOccupancies, LeezenboxOccupancy } from "./types";

// Seeded random number generator for consistent results
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Generate consistent pseudo-random data based on timestamp
function generatePredictionsForHour(
  timestamp: Date,
  leezenboxId: number
): DataPoint["predictions"] {
  const baseSeed = Math.floor(timestamp.getTime() / 1000) + leezenboxId;
  let currentSeed = baseSeed;

  const random = () => {
    currentSeed++;
    return seededRandom(currentSeed);
  };

  const predictions: DataPoint["predictions"] = [];

  // Determine number of detections (0-8 bikes/saddles with some probability distribution)
  const detectionCount = Math.floor(random() * 9); // 0-8 detections

  if (detectionCount === 0) {
    return predictions; // Empty predictions array
  }

  for (let i = 0; i < detectionCount; i++) {
    const baseX = random();
    const baseY = random();
    const width = 0.02 + random() * 0.08; // Width between 0.02 and 0.1
    const height = 0.03 + random() * 0.1; // Height between 0.03 and 0.13

    // Bike prediction (category 1)
    predictions.push({
      category: 1,
      bbox: [
        Math.max(0, Math.min(1 - width, baseX)), // x
        Math.max(0, Math.min(1 - height, baseY)), // y
        width, // width
        height, // height
      ],
      confidence: 0.75 + random() * 0.2, // Confidence between 0.75 and 0.95
    });

    // Add corresponding saddle prediction (category 2) with high probability
    if (random() > 0.2) {
      // 80% chance of having a saddle
      predictions.push({
        category: 2,
        bbox: [
          Math.max(
            0,
            Math.min(1 - width * 0.8, baseX + (random() - 0.5) * 0.02)
          ), // Slightly offset x
          Math.max(0, Math.min(1 - height * 0.6, baseY - height * 0.3)), // Above the bike
          width * 0.8, // Smaller width
          height * 0.6, // Smaller height
        ],
        confidence: 0.7 + random() * 0.25, // Confidence between 0.7 and 0.95
      });
    }

    // Occasionally add person detection (category 0) with lower probability
    if (random() > 0.7) {
      // 30% chance of having a person
      predictions.push({
        category: 0,
        bbox: [
          Math.max(
            0,
            Math.min(1 - width * 1.5, baseX + (random() - 0.5) * 0.1)
          ), // More offset x
          Math.max(0, Math.min(1 - height * 2, baseY - height * 0.5)), // Above bike/saddle
          width * 1.5, // Larger width
          height * 2, // Much larger height
        ],
        confidence: 0.65 + random() * 0.25, // Confidence between 0.65 and 0.9
      });
    }
  }

  return predictions;
}

// Generate dynamic example data for the last 24 hours (1 per hour)
function generateExampleDataPoints(): DataPoint[] {
  const now = new Date();
  const dataPoints: DataPoint[] = [];
  const leezenboxIds = [1, 2, 3, 4, 5];

  // Generate data for last 24 hours, one entry per hour
  for (let hoursAgo = 719; hoursAgo >= 0; hoursAgo--) {
    const timestamp = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
    // Round to the hour for consistency
    timestamp.setMinutes(0, 0, 0);

    // Use the hour and day to determine which leezenbox(es) have data
    const hourSeed = timestamp.getHours() + timestamp.getDate();
    const activeLeezenboxes = leezenboxIds.filter(
      (_, index) => seededRandom(hourSeed + index) > 0.3 // 70% chance each box is active
    );

    // Ensure at least one leezenbox is active per hour
    if (activeLeezenboxes.length === 0) {
      activeLeezenboxes.push(leezenboxIds[hourSeed % leezenboxIds.length]);
    }

    activeLeezenboxes.forEach((leezenboxId, index) => {
      const id = (23 - hoursAgo) * 10 + index + 1; // Generate consistent IDs

      dataPoints.push({
        id,
        leezenbox_id: leezenboxId,
        timestamp: timestamp.toISOString(),
        predictions: generatePredictionsForHour(timestamp, leezenboxId),
      });
    });
  }

  return dataPoints.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

// Export the dynamic data points
export const exampleDataPoints: DataPoint[] = generateExampleDataPoints();

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

// Helper function to get the latest occupancy count for a leezenbox
export const getLatestOccupancyByLeezenboxId = (
  leezenboxId: number
): LeezenboxOccupancy => {
  const latestDataPoint = exampleDataPoints
    .filter((dp) => dp.leezenbox_id === leezenboxId)
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];

  if (!latestDataPoint) {
    return { bikes: 0, saddles: 0 };
  }

  const bikes = countBikesInDataPoint(latestDataPoint);
  const saddles = countSaddlesInDataPoint(latestDataPoint);

  return { bikes, saddles };
};

// Helper function to get the latest occupancy for all leezenboxes
export const getLatestOccupancyForAllLeezenboxes = (): LeezenboxOccupancies => {
  const occupancy: LeezenboxOccupancies = {};

  // Get unique leezenbox IDs
  const uniqueLeezenboxIds = Array.from(
    new Set(exampleDataPoints.map((dp) => dp.leezenbox_id))
  );

  // For each leezenbox, get the latest occupancy
  uniqueLeezenboxIds.forEach((leezenboxId) => {
    const latestOccupancy = getLatestOccupancyByLeezenboxId(leezenboxId);
    occupancy[leezenboxId] = latestOccupancy;
  });

  return occupancy;
};

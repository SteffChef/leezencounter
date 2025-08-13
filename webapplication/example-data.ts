import {
  DataPoint,
  LeezenboxOccupancies,
  LeezenboxOccupancy,
  Leezenbox,
} from "./types";

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
    const width = 0.04 + random() * 0.12; // Width between 0.04 and 0.16 (realistic bike width)
    const height = 0.06 + random() * 0.14; // Height between 0.06 and 0.2 (realistic bike height)

    // Generate bicycle prediction (no categories - just bicycles)
    predictions.push({
      bbox: [
        Math.max(0, Math.min(1 - width, baseX)), // x
        Math.max(0, Math.min(1 - height, baseY)), // y
        width, // width
        height, // height
      ],
      confidence: 0.7 + random() * 0.25, // Confidence between 0.7 and 0.95
    });
  }

  return predictions;
}

// Generate dynamic example data for available leezenboxes
function generateExampleDataPoints(leezenboxIds: number[] = []): DataPoint[] {
  const now = new Date();
  const dataPoints: DataPoint[] = [];

  // If no leezenbox IDs provided, use default ones for backward compatibility
  const availableLeezenboxIds =
    leezenboxIds.length > 0 ? leezenboxIds : [1, 2, 3, 4, 5];

  // Generate data for last 30 days (720 hours), one entry per hour
  for (let hoursAgo = 719; hoursAgo >= 0; hoursAgo--) {
    const timestamp = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
    // Round to the hour for consistency
    timestamp.setMinutes(0, 0, 0);

    // Use the hour and day to determine which leezenbox(es) have data
    const hourSeed = timestamp.getHours() + timestamp.getDate();
    const activeLeezenboxes = availableLeezenboxIds.filter(
      (leezenboxId, index) => seededRandom(hourSeed + leezenboxId + index) > 0.3 // 70% chance each box is active
    );

    // Ensure at least one leezenbox is active per hour if we have any leezenboxes
    if (activeLeezenboxes.length === 0 && availableLeezenboxIds.length > 0) {
      const selectedIndex =
        Math.abs(Math.floor(seededRandom(hourSeed))) %
        availableLeezenboxIds.length;
      activeLeezenboxes.push(availableLeezenboxIds[selectedIndex]);
    }

    activeLeezenboxes.forEach((leezenboxId, index) => {
      const id = (719 - hoursAgo) * 1000 + leezenboxId * 10 + index + 1; // Generate more unique IDs

      dataPoints.push({
        id,
        leezenbox_id: leezenboxId,
        received_at: timestamp.toISOString(),
        predictions: generatePredictionsForHour(timestamp, leezenboxId),
      });
    });
  }

  return dataPoints.sort(
    (a, b) =>
      new Date(a.received_at).getTime() - new Date(b.received_at).getTime()
  );
}

// Export the dynamic data points (default backward compatibility)
export const exampleDataPoints: DataPoint[] = generateExampleDataPoints();

// Function to generate example data for specific leezenbox IDs
export const generateExampleDataForLeezenboxes = (
  leezenboxIds: number[]
): DataPoint[] => {
  return generateExampleDataPoints(leezenboxIds);
};

// Helper function to get data points for a specific leezenbox
export const getDataPointsByLeezenboxId = (
  leezenboxId: number,
  dataPoints: DataPoint[] = exampleDataPoints
): DataPoint[] => {
  return dataPoints.filter(
    (dataPoint) => dataPoint.leezenbox_id === leezenboxId
  );
};

// Helper function to get data points within a time range
export const getDataPointsByTimeRange = (
  startTime: string,
  endTime: string,
  dataPoints: DataPoint[] = exampleDataPoints
): DataPoint[] => {
  const start = new Date(startTime);
  const end = new Date(endTime);

  return dataPoints.filter((dataPoint) => {
    const timestamp = new Date(dataPoint.received_at);
    return timestamp >= start && timestamp <= end;
  });
};

// Helper function to count total bikes detected in a data point
export const countBikesInDataPoint = (dataPoint: DataPoint): number => {
  return dataPoint.predictions.length;
};

// Helper function to get the latest occupancy count for a leezenbox
export const getLatestOccupancyByLeezenboxId = (
  leezenboxId: number,
  dataPoints: DataPoint[] = exampleDataPoints
): LeezenboxOccupancy => {
  const latestDataPoint = dataPoints
    .filter((dp) => dp.leezenbox_id === leezenboxId)
    .sort(
      (a, b) =>
        new Date(b.received_at).getTime() - new Date(a.received_at).getTime()
    )[0];

  if (!latestDataPoint) {
    return { bikes: 0, saddles: 0 };
  }

  const bikes = countBikesInDataPoint(latestDataPoint);
  // Since we no longer have saddles as a separate category, set to 0
  const saddles = 0;

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

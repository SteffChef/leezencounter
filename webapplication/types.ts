export interface Participant {
  id: number;
  name: string;
  role: string;
}

export interface Leezenbox {
  id: number;
  name: string;
  ttn_location_key: string; // Added for TTN integration
  address: string;
  postcode: string;
  city: string;
  latitude: number;
  longitude: number;
  num_lockers_with_power: number;
  capacity: number;
}

export interface Prediction {
  bbox: number[]; // [center_x, center_y, width, height] in YOLO format (normalized 0-1)
  confidence: number;
}

export interface DataPoint {
  id: number;
  leezenbox_id: number;
  received_at: string; // ISO date string
  predictions: Prediction[];
}

export interface LeezenboxOccupancy {
  bikes: number;
  saddles: number;
}

export interface LeezenboxOccupancies {
  [leezenboxId: number]: LeezenboxOccupancy;
}

// TTN (The Things Network) related types
export interface TTNPrediction {
  bbox: [number, number, number, number]; // Raw format: [left_up_x, left_up_y, right_down_x, right_down_y] (absolute pixels)
  // Note: This gets converted to YOLO format [center_x, center_y, width, height] (normalized 0-1) in processing
  confidence?: number; // confidence score between 0 and 1
}

export interface ProcessedDataItem {
  device_id: string;
  received_at: string; // ISO timestamp
  confidence_threshold: number;
  location: string;
  predictions: TTNPrediction[];
  timestamp: string; // ISO timestamp
  total_detected: number;
}

// Database stored TTN data (includes additional fields)
export interface TTNDataRecord extends ProcessedDataItem {
  id: number;
  created_at: string;
  updated_at: string;
}

export interface TTNProcessedResponse {
  message: string;
  data: ProcessedDataItem[];
  savedCount: number;
  sampleObject: Record<string, unknown> | null;
}

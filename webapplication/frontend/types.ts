export interface Participant {
  id: number;
  name: string;
  role: string;
}

export interface Leezenbox {
  id: number;
  name: string;
  address: string;
  postcode: string;
  city: string;
  latitude: number;
  longitude: number;
  num_lockers_with_power: number;
  capacity: number;
}

export interface Prediction {
  id: number;
  datapoint_id: number;
  position_x: number;
  position_y: number;
  label: string;
  confidence: number;
}

export interface DataPoint {
  id: number;
  leezenbox_id: number;
  timestamp: string; // ISO date string
  predictions: Prediction[];
}

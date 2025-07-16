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
  category: number;
  bbox: number[];
  confidence: number;
}

export interface DataPoint {
  id: number;
  leezenbox_id: number;
  timestamp: string; // ISO date string
  predictions: Prediction[];
}

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
}

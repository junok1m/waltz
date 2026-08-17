export type Point = {
  latitude: number;
  longitude: number;
};

export type Walk = {
  id: number;
  dog_name: string;
  distance_km: number;
  duration_seconds: number;
  ended_at: string;
};

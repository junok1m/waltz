export type Point = {
  latitude: number;
  longitude: number;
};

export type WalkTag = "trail" | "swim" | "coffee";
export type RoutePrivacy = "private" | "hidden_ends" | "full" | "stats_only";
export type WeatherCondition = "clear" | "cloudy" | "fog" | "drizzle" | "rain" | "heavy_rain" | "snow" | "storm" | "unknown";
export type WalkWeather = {
  temperatureC: number;
  condition: WeatherCondition;
  code: number | null;
};

export type WalkLocation = {
  suburbName: string | null;
  region: string | null;
  postcode: string | null;
  countryCode: string | null;
  latitude: number;
  longitude: number;
};

export type Walk = {
  id: number;
  dog_id?: string | null;
  dog_name: string;
  title?: string | null;
  distance_km: number;
  duration_seconds: number;
  ended_at: string;
  route_points?: Point[] | null;
  share_route?: boolean;
  route_visibility?: RoutePrivacy;
  hidden_from_profile?: boolean;
  tags?: WalkTag[] | null;
  weather_temperature_c?: number | null;
  weather_condition?: WeatherCondition | null;
  weather_code?: number | null;
  suburb_name?: string | null;
  location_region?: string | null;
  location_postcode?: string | null;
  location_country_code?: string | null;
  location_latitude?: number | null;
  location_longitude?: number | null;
  is_mock?: boolean;
};

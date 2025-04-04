export interface Marker {
  id: number;
  title: string;
  description: string;
  lat: number;
  lng: number;
  category: string;
  image?: string;
  price?: number;
  rating?: number;
}

export type BBox = {
  west: number;
  south: number;
  east: number;
  north: number;
};

export function boundingBox(points: [number, number][]): BBox {
  // Write your code here
  return { west: 0, south: 0, east: 0, north: 0 };
}

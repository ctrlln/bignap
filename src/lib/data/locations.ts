export interface Location {
    name: string;
    coordinates: [number, number];
    students: number;
}

export const locations: Location[] = [
    { name: "New York", coordinates: [-74.006, 40.7128], students: 5200 },
    { name: "London", coordinates: [-0.1276, 51.5074], students: 3100 },
    { name: "Tokyo", coordinates: [139.6503, 35.6762], students: 4500 },
    { name: "Sydney", coordinates: [151.2093, -33.8688], students: 1200 },
    { name: "San Francisco", coordinates: [-122.4194, 37.7749], students: 2800 },
    { name: "Berlin", coordinates: [13.405, 52.52], students: 800 },
    { name: "Cape Town", coordinates: [18.4241, -33.9249], students: 400 },
    { name: "Sao Paulo", coordinates: [-46.6333, -23.5505], students: 1500 },
    { name: "Mumbai", coordinates: [72.8777, 19.076], students: 3800 },
    { name: "Singapore", coordinates: [103.8198, 1.3521], students: 950 },
    { name: "Dubai", coordinates: [55.2708, 25.2048], students: 600 },
    { name: "Paris", coordinates: [2.3522, 48.8566], students: 2100 }
];

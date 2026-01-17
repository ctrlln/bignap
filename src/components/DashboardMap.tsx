
import { useEffect, useMemo, useState } from "react";
import {
    ComposableMap,
    Geographies,
    Geography,
    Marker,
    ZoomableGroup
} from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import { Tooltip } from "react-tooltip";
import { fetchMapData } from "../lib/api";

const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

interface MapLocation {
    name: string;
    coordinates: [number, number];
    count: number;
}

export function DashboardMap() {
    const [locations, setLocations] = useState<MapLocation[]>([]);

    useEffect(() => {
        fetchMapData()
            .then(data => setLocations(data))
            .catch(err => console.error('Failed to load map data', err));
    }, []);

    const popScale = useMemo(
        () =>
            scaleLinear<number>()
                .domain([0, 50]) // Adjusted domain for certifications
                .range([4, 20]),
        []
    );

    return (
        <div className="w-full h-[500px] bg-card rounded-xl border relative overflow-hidden flex items-center justify-center">
            <ComposableMap
                projection="geoMercator"
                projectionConfig={{
                    scale: 120, // Increased by ~10% from 110
                    rotate: [-10, 0, 0],
                    center: [0, 40]
                }}
                className="w-full h-full"
            >
                <ZoomableGroup zoom={1} center={[0, 0]}>
                    <Geographies geography={geoUrl}>
                        {({ geographies }) =>
                            geographies
                                .filter((geo: any) =>
                                    geo.properties.name !== "Antarctica" &&
                                    geo.properties.ISO_A3 !== "ATA" &&
                                    geo.id !== "010"
                                )
                                .map((geo: any) => (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        fill="#EFF6F7" // var(--secondary)
                                        stroke="#FAFCFD" // var(--background)
                                        strokeWidth={0.5}
                                        style={{
                                            default: { outline: "none" },
                                            hover: { fill: "#E2E8F0", outline: "none" }, // var(--border) for slightly darker hover
                                            pressed: { outline: "none" },
                                        }}
                                    />
                                ))
                        }
                    </Geographies>
                    {locations.map(({ name, coordinates, count }) => (
                        <Marker key={name} coordinates={coordinates}>
                            <circle
                                r={popScale(count)}
                                fill="#81AEB5" // var(--primary)
                                fillOpacity={0.6}
                                stroke="#81AEB5"
                                strokeWidth={1}
                                className="hover:scale-110 transition-transform duration-300 cursor-pointer outline-none"
                                data-tooltip-id="map-tooltip"
                                data-tooltip-content={`${name}: ${count} certifications`}
                            />
                        </Marker>
                    ))}
                </ZoomableGroup>
            </ComposableMap>
            <Tooltip
                id="map-tooltip"
                className="!bg-card !text-card-foreground !border !border-border !rounded-lg !px-3 !py-2 !text-sm !shadow-md !opacity-100"
            />
        </div>
    );
}


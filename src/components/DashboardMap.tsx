
import { useEffect, useState } from "react";
import {
    ComposableMap,
    Geographies,
    Geography,
    Marker,
    ZoomableGroup
} from "react-simple-maps";
import { Tooltip } from "react-tooltip";
import { fetchCenters } from "../lib/api";
import type { TrainingCenter } from "../lib/data/types";
import { useNavigate } from "react-router-dom";

const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

export function DashboardMap() {
    const [locations, setLocations] = useState<TrainingCenter[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetchCenters()
            .then(data => {
                // Filter out centers without valid coordinates
                const validLocations = data.filter(
                    center => center.address?.lat && center.address?.lng
                );
                setLocations(validLocations);
            })
            .catch(err => console.error('Failed to load map data', err));
    }, []);

    return (
        <div className="w-full h-[500px] bg-card rounded-xl border relative overflow-hidden flex items-center justify-center">
            <ComposableMap
                projection="geoMercator"
                projectionConfig={{
                    scale: 120,
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
                                            hover: { fill: "#E2E8F0", outline: "none" },
                                            pressed: { outline: "none" },
                                        }}
                                    />
                                ))
                        }
                    </Geographies>
                    {locations.map((center) => {
                        const lat = parseFloat(center.address!.lat!);
                        const lng = parseFloat(center.address!.lng!);

                        return (
                            <Marker
                                key={center.id}
                                coordinates={[lng, lat]}
                                onClick={() => navigate('/locations')}
                            >
                                <circle
                                    r={6}
                                    fill="#81AEB5" // var(--primary)
                                    fillOpacity={0.8}
                                    stroke="#fff"
                                    strokeWidth={1.5}
                                    className="hover:scale-125 transition-transform duration-300 cursor-pointer outline-none"
                                    data-tooltip-id="map-tooltip"
                                    data-tooltip-content={`${center.name} (${center.address?.city}, ${center.address?.country})`}
                                />
                            </Marker>
                        );
                    })}
                </ZoomableGroup>
            </ComposableMap>
            <Tooltip
                id="map-tooltip"
                className="!bg-card !text-card-foreground !border !border-border !rounded-lg !px-3 !py-2 !text-sm !shadow-md !opacity-100 z-50"
            />
        </div>
    );
}


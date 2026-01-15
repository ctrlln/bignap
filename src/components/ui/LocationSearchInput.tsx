import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { Input } from './Input';
import type { Address } from '../../lib/data/types';

interface LocationSearchInputProps {
    onSelect: (address: Address) => void;
    defaultValue?: string;
    placeholder?: string;
}

interface OSMResult {
    display_name: string;
    address: {
        road?: string;
        house_number?: string;
        city?: string;
        town?: string;
        village?: string;
        state?: string;
        postcode?: string;
        country?: string;
    };
    lat: string;
    lon: string;
}

export function LocationSearchInput({ onSelect, defaultValue = '', placeholder = "Search for a location..." }: LocationSearchInputProps) {
    const [query, setQuery] = useState(defaultValue);
    const [results, setResults] = useState<OSMResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.length > 2 && showResults) {
                searchLocation(query);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [query, showResults]);

    // Click outside to close
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const searchLocation = async (q: string) => {
        setLoading(true);
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&addressdetails=1&limit=5`);
            const data = await response.json();
            setResults(data);
            setLoading(false);
        } catch (error) {
            console.error("Search failed", error);
            setLoading(false);
        }
    };

    const handleSelect = (result: OSMResult) => {
        const addr = result.address;
        const street = addr.road ? `${addr.house_number || ''} ${addr.road}`.trim() : '';
        const city = addr.city || addr.town || addr.village || '';

        const formattedAddress: Address = {
            street,
            city,
            state: addr.state,
            zip: addr.postcode,
            country: addr.country,
            formatted: result.display_name,
            lat: result.lat,
            lng: result.lon
        };

        setQuery(result.display_name); // Show full name in input
        setShowResults(false);
        onSelect(formattedAddress);
    };

    return (
        <div className="relative w-full" ref={wrapperRef}>
            <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    value={query}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setQuery(e.target.value);
                        setShowResults(true);
                    }}
                    placeholder={placeholder}
                    className="pl-9"
                />
                {loading && <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />}
            </div>

            {showResults && results.length > 0 && (
                <div className="absolute z-50 mt-1 w-full rounded-md border bg-card text-card-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95">
                    <ul className="p-1">
                        {results.map((result, index) => (
                            <li
                                key={index}
                                className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 cursor-pointer"
                                onClick={() => handleSelect(result)}
                            >
                                <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                                <div className="flex flex-col">
                                    <span className="font-medium">{result.display_name.split(',')[0]}</span>
                                    <span className="text-xs text-muted-foreground truncate max-w-[300px]">{result.display_name}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

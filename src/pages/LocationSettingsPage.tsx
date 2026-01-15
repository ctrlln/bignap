import React, { useState, useEffect } from 'react';
import { useAuth, getAuthHeaders } from '../contexts/AuthContext';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Upload, Image as ImageIcon, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { fetchCenters } from '../lib/api';
import type { TrainingCenter } from '../lib/data/types';

export function LocationSettingsPage() {
    const { user } = useAuth();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [currentStampUrl, setCurrentStampUrl] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Admin features
    const [locations, setLocations] = useState<TrainingCenter[]>([]);
    const [selectedLocationId, setSelectedLocationId] = useState<string>('');

    const isAdmin = user?.roles.includes('admin');

    // Helper function to fetch all locations (for admin)
    const fetchAllLocations = async () => {
        setIsLoading(true);
        try {
            const centers = await fetchCenters();
            setLocations(centers);
        } catch (error) {
            console.error('Error fetching locations:', error);
            setLocations([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Initialization
    useEffect(() => {
        if (user && isAdmin) {
            fetchAllLocations();
        }
    }, [user, isAdmin]);

    // Fetch stamp when location changes
    useEffect(() => {
        const fetchStamp = async () => {
            if (!selectedLocationId) return;

            // Don't set global loading here to avoid flashing UI on switch, maybe local loading?
            // keeping simple for now
            try {
                const res = await fetch(`http://localhost:3000/api/locations/${selectedLocationId}/stamp`, {
                    headers: getAuthHeaders()
                });
                if (res.ok) {
                    const data = await res.json();
                    setCurrentStampUrl(`http://localhost:3000${data.url}`);
                } else {
                    setCurrentStampUrl(null);
                }
            } catch (e) {
                console.error('Failed to fetch stamp', e);
                setCurrentStampUrl(null);
            }
        };

        fetchStamp();
    }, [selectedLocationId]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (!file.type.match('image.*')) {
                setMessage({ type: 'error', text: 'Please select a valid image file (PNG, JPG, SVG).' });
                return;
            }
            setSelectedFile(file);
            setMessage(null);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile || !selectedLocationId) return;

        setIsLoading(true);
        setMessage(null);

        const formData = new FormData();
        formData.append('stamp', selectedFile);
        formData.append('location_id', selectedLocationId.toString());

        try {
            const res = await fetch('http://localhost:3000/api/locations/stamp', {
                method: 'POST',
                headers: {
                    ...getAuthHeaders(),
                },
                body: formData
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Stamp uploaded successfully!' });

                // Refresh stamp for current location
                const stampRes = await fetch(`http://localhost:3000/api/locations/${selectedLocationId}/stamp`, {
                    headers: getAuthHeaders()
                });
                if (stampRes.ok) {
                    const data = await stampRes.json();
                    setCurrentStampUrl(`http://localhost:3000${data.url}`);
                }

                setSelectedFile(null);
                // Reset file input if possible, but React state null handles logic
            } else {
                const err = await res.json();
                setMessage({ type: 'error', text: err.error || 'Upload failed' });
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) return <div>Access Denied</div>;

    const currentLocation = locations.find(l => l.id === selectedLocationId);
    const currentLocationName = currentLocation
        ? `${currentLocation.name} (${currentLocation.address?.city || 'Unknown City'})`
        : 'Select a Location';

    return (
        <div className="space-y-6">
            <PageHeader
                title="Location Settings"
                description={isAdmin ? "Manage stamps for all locations." : `Manage settings for your location: ${currentLocationName}`}
            />

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ImageIcon className="text-primary" /> Location Stamp
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">

                    {/* Location Selector */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-500">Target Location</label>
                        {isAdmin ? (
                            <select
                                className="w-full p-2 rounded border border-slate-200 bg-background"
                                value={selectedLocationId}
                                onChange={(e) => setSelectedLocationId(e.target.value)}
                                disabled={isLoading}
                            >
                                <option value="">Select a location...</option>
                                {locations.map(loc => (
                                    <option key={loc.id} value={loc.id}>
                                        {loc.name} - {loc.address?.city}, {loc.address?.country}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <div className="p-2 rounded bg-slate-50 border border-slate-200 text-slate-700 font-medium">
                                Contact an Admin to manage stamps.
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Current Stamp Preview */}
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-slate-700">Current Stamp</label>
                            <div className="flex flex-col items-center justify-center h-[240px] bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                                {currentStampUrl ? (
                                    <div className="text-center p-4">
                                        <img
                                            src={currentStampUrl}
                                            alt="Location Stamp"
                                            className="max-w-[180px] max-h-[180px] object-contain mb-2 shadow-sm"
                                        />
                                    </div>
                                ) : (
                                    <div className="text-center text-slate-400 p-4">
                                        <ImageIcon size={48} className="mx-auto mb-2 opacity-50" />
                                        <p>No stamp uploaded.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Upload Form */}
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-slate-700">Upload New</label>
                            <form onSubmit={handleUpload} className="space-y-4 h-[240px] flex flex-col justify-between">
                                <div className="p-4 bg-slate-50 rounded border border-slate-200 flex-1">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="block w-full text-sm text-slate-500
                                              file:mr-4 file:py-2 file:px-4
                                              file:rounded-full file:border-0
                                              file:text-sm file:font-semibold
                                              file:bg-primary/10 file:text-primary
                                              hover:file:bg-primary/20
                                            "
                                    />
                                    <p className="mt-2 text-xs text-slate-400">
                                        Recommended: Transparent PNG or SVG.
                                    </p>
                                </div>

                                {message && (
                                    <div className={`p-3 rounded text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                                        }`}>
                                        {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                                        {message.text}
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    disabled={!selectedFile || isLoading}
                                    className="w-full"
                                >
                                    {isLoading ? (
                                        <><Loader2 className="animate-spin mr-2" /> Processing...</>
                                    ) : (
                                        <><Upload className="mr-2" size={16} /> Upload Stamp</>
                                    )}
                                </Button>
                            </form>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

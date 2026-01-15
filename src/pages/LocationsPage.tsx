import { useEffect, useState } from 'react';
import type { TrainingCenter, Address } from '../lib/data/types';
import { fetchCenters, createCenter } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/ui/PageHeader';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { LoadingState } from '../components/ui/LoadingState';
import { EmptyState } from '../components/ui/EmptyState';
import { LocationSearchInput } from '../components/ui/LocationSearchInput';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { MapPin, Search, Plus, X } from 'lucide-react';

export function LocationsPage() {
    const { user } = useAuth();
    const [centers, setCenters] = useState<TrainingCenter[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);

    // Check if user is admin or master trainer
    const isAdmin = user?.roles.some(r => ['admin', 'master_trainer'].includes(r));

    // Form State
    const [newName, setNewName] = useState('');
    const [newLevel, setNewLevel] = useState<number>(4);
    const [newAddress, setNewAddress] = useState<Address | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchCenters()
            .then(data => {
                setCenters(data);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleAddCenter = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAddress) {
            alert('Please select a location');
            return;
        }

        setSubmitting(true);
        try {
            const data = await createCenter({
                name: newName,
                nursery_level: newLevel as 1 | 2 | 3 | 4,
                address: newAddress
            });

            setCenters([...centers, data]);
            setShowAddModal(false);
            setNewName('');
            setNewAddress(null);
        } catch (error) {
            console.error(error);
            alert('Failed to create center');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredCenters = centers.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.address?.city?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return <div className="p-12"><LoadingState message="Loading training centers..." /></div>;

    return (
        <div className="space-y-6 relative">
            <PageHeader title="Training Locations" description="Global network of NIDCAP training centers.">
                <div className="flex gap-2">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <Input
                            type="text"
                            placeholder="Search locations..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    {isAdmin && (
                        <Button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2"
                        >
                            <Plus size={16} />
                            Add Center
                        </Button>
                    )}
                </div>
            </PageHeader>

            {filteredCenters.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredCenters.map(center => (
                        <Card key={center.id} className="flex flex-col overflow-hidden hover:shadow-md transition-shadow group">
                            <div className="h-32 bg-secondary/30 border-b border-border flex items-center justify-center relative">
                                {center.stamp_url ? (
                                    <img
                                        src={`http://localhost:3000/uploads/${center.stamp_url}`}
                                        alt={`${center.name} Stamp`}
                                        className="h-24 w-24 object-contain drop-shadow-sm transition-transform group-hover:scale-105"
                                    />
                                ) : (
                                    <MapPin className="h-12 w-12 text-muted-foreground/20" />
                                )}
                                <div className="absolute top-3 right-3">
                                    <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm shadow-sm">
                                        Level {center.nursery_level}
                                    </Badge>
                                </div>
                            </div>
                            <div className="p-5 flex-1 flex flex-col space-y-4">
                                <div>
                                    <h3 className="font-semibold text-lg leading-tight mb-1 group-hover:text-primary transition-colors">
                                        {center.name}
                                    </h3>
                                    <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                        <MapPin size={14} className="shrink-0" />
                                        {center.address ? `${center.address.city}, ${center.address.country}` : 'Unknown Location'}
                                    </p>
                                </div>

                                <div className="pt-4 mt-auto border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                                    <span>ID: {center.id.slice(0, 8)}</span>
                                    <span className={center.is_active ? "text-emerald-600 font-medium flex items-center gap-1" : "text-rose-500"}>
                                        <div className={`h-1.5 w-1.5 rounded-full ${center.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                        {center.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="py-12">
                    <EmptyState
                        title="No locations found"
                        description={search ? `No centers matching "${search}"` : "No training centers registered yet."}
                    />
                </div>
            )}

            {/* Simple Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-background rounded-lg shadow-lg w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold">Add New Training Center</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleAddCenter} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-1 block">Center Name</label>
                                <Input
                                    required
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    placeholder="e.g. West Coast NIDCAP Center"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">Location</label>
                                <LocationSearchInput onSelect={setNewAddress} />
                                {newAddress && (
                                    <p className="text-xs text-primary mt-1 flex items-center gap-1">
                                        <MapPin size={10} /> {newAddress.formatted}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">Nursery Level</label>
                                <select
                                    value={newLevel}
                                    onChange={e => setNewLevel(Number(e.target.value))}
                                    className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                >
                                    <option value={1}>Level 1</option>
                                    <option value={2}>Level 2</option>
                                    <option value={3}>Level 3</option>
                                    <option value={4}>Level 4</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setShowAddModal(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={submitting || !newAddress}
                                >
                                    {submitting ? 'Creating...' : 'Create Center'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

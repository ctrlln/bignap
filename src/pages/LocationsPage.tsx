import { useEffect, useState } from 'react';
import type { TrainingCenter, Address } from '../lib/data/types';
import { fetchCenters, createCenter, updateCenter, deleteCenter, uploadStamp } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/ui/PageHeader';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { LoadingState } from '../components/ui/LoadingState';
import { EmptyState } from '../components/ui/EmptyState';
import { LocationSearchInput } from '../components/ui/LocationSearchInput';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { MapPin, Search, Plus, X, Upload, Trash2, Save, Image as ImageIcon, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

export function LocationsPage() {
    const { user } = useAuth();
    const [centers, setCenters] = useState<TrainingCenter[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Modals
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingCenter, setEditingCenter] = useState<TrainingCenter | null>(null);

    const isAdmin = user?.roles.some(r => ['admin', 'master_trainer'].includes(r));

    useEffect(() => {
        loadCenters();
    }, []);

    const loadCenters = () => {
        setLoading(true);
        fetchCenters()
            .then(setCenters)
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    const handleCreate = async (data: Partial<TrainingCenter>) => {
        try {
            const newCenter = await createCenter(data);
            setCenters([...centers, newCenter]);
            setShowAddModal(false);
        } catch (e) {
            console.error(e);
            alert('Failed to create center');
        }
    };

    const handleUpdate = async (id: string, data: Partial<TrainingCenter>) => {
        try {
            const updated = await updateCenter(id, data);
            setCenters(centers.map(c => c.id === id ? updated : c));
            setEditingCenter(updated); // Update modal state
            return updated;
        } catch (e) {
            console.error(e);
            alert('Failed to update center');
            throw e;
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this location? This action cannot be undone.')) return;
        try {
            await deleteCenter(id);
            setCenters(centers.filter(c => c.id !== id));
            setEditingCenter(null);
        } catch (e) {
            console.error(e);
            alert('Failed to delete center');
        }
    };

    const filteredCenters = centers.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.address?.city?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading && centers.length === 0) return <div className="p-12"><LoadingState message="Loading training centers..." /></div>;

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
                        <Button onClick={() => setShowAddModal(true)} className="flex items-center gap-2">
                            <Plus size={16} /> Add Center
                        </Button>
                    )}
                </div>
            </PageHeader>

            {filteredCenters.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredCenters.map(center => (
                        <Card
                            key={center.id}
                            onClick={() => isAdmin && setEditingCenter(center)}
                            className={clsx(
                                "flex flex-col overflow-hidden transition-all group",
                                isAdmin ? "cursor-pointer hover:ring-2 hover:ring-primary/50 hover:shadow-lg" : ""
                            )}
                        >
                            <div className="h-32 bg-secondary/30 border-b border-border flex items-center justify-center relative">
                                {center.stamp_url ? (
                                    <img
                                        src={`http://localhost:3000/uploads/${center.stamp_url}`}
                                        alt="Stamp"
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

            {/* Create Modal */}
            {showAddModal && (
                <LocationModal
                    onClose={() => setShowAddModal(false)}
                    onSubmit={handleCreate}
                    title="Add New Training Center"
                    submitLabel="Create Center"
                />
            )}

            {/* Edit Modal */}
            {editingCenter && (
                <LocationModal
                    initialData={editingCenter}
                    onClose={() => setEditingCenter(null)}
                    onSubmit={(data) => handleUpdate(editingCenter.id, data)}
                    onDelete={() => handleDelete(editingCenter.id)}
                    title="Edit Location"
                    submitLabel="Save Changes"
                    showStampManagement
                />
            )}
        </div>
    );
}

// Sub-component for Modal Form
function LocationModal({
    initialData,
    onClose,
    onSubmit,
    onDelete,
    title,
    submitLabel,
    showStampManagement
}: {
    initialData?: TrainingCenter,
    onClose: () => void,
    onSubmit: (data: Partial<TrainingCenter>) => Promise<any>,
    onDelete?: () => void,
    title: string,
    submitLabel: string,
    showStampManagement?: boolean
}) {
    const [name, setName] = useState(initialData?.name || '');
    const [level, setLevel] = useState<1 | 2 | 3 | 4>((initialData?.nursery_level as 1 | 2 | 3 | 4) || 4);
    const [address, setAddress] = useState<Address | null>(initialData?.address || null);
    const [submitting, setSubmitting] = useState(false);

    // Stamp State
    const [stampFile, setStampFile] = useState<File | null>(null);
    const [uploadingStamp, setUploadingStamp] = useState(false);
    const [stampMessage, setStampMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await onSubmit({ name, nursery_level: level, address: address! });
            if (!showStampManagement) onClose(); // Only close if not editing (creating)
        } catch (e) {
            // Error handled in parent
        } finally {
            setSubmitting(false);
        }
    };

    const handleStampUpload = async () => {
        if (!initialData || !stampFile) return;
        setUploadingStamp(true);
        setStampMessage(null);
        try {
            await uploadStamp(initialData.id, stampFile!);
            setStampMessage({ type: 'success', text: 'Stamp uploaded!' });
            setStampFile(null);
            // Refresh parent data implicitly by triggering an update or just showing success
            // In a real app we might want to refresh the stamp URL in the UI immediately
            // But main list updates on close or refetch.
            // We can call a partial update or just let the user see it when they close.
            // Ideally we callback to parent to refresh.
            // For now, simple success message.
            await onSubmit({}); // Trigger refresh in parent
        } catch (e: any) {
            setStampMessage({ type: 'error', text: e.message });
        } finally {
            setUploadingStamp(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-background rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 flex flex-col">
                <div className="p-6 border-b border-border flex justify-between items-center sticky top-0 bg-background z-10">
                    <h2 className="text-xl font-bold">{title}</h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-8">
                    {/* Main Details Form */}
                    <form id="location-form" onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Center Name</label>
                                <Input required value={name} onChange={e => setName(e.target.value)} placeholder="Center Name" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Nursery Level</label>
                                <select
                                    value={level}
                                    onChange={e => setLevel(Number(e.target.value) as 1 | 2 | 3 | 4)}
                                    className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background"
                                >
                                    {[1, 2, 3, 4].map(l => <option key={l} value={l}>Level {l}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Location</label>
                            <LocationSearchInput onSelect={setAddress} defaultValue={address?.formatted} />
                            {address && (
                                <div className="p-3 bg-muted/30 rounded text-xs text-muted-foreground">
                                    <p className="font-medium text-foreground">{address.formatted}</p>
                                    <p>Lat: {address.lat}, Lng: {address.lng}</p>
                                </div>
                            )}
                        </div>
                    </form>

                    {/* Stamp Management Section - Only in Edit Mode */}
                    {showStampManagement && initialData && (
                        <div className="pt-6 border-t border-border">
                            <h3 className="font-semibold mb-4 flex items-center gap-2">
                                <ImageIcon size={18} /> Official Stamp
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center min-h-[160px] bg-muted/5">
                                    {initialData.stamp_url ? (
                                        <img
                                            src={`http://localhost:3000/uploads/${initialData.stamp_url}`}
                                            alt="Current Stamp"
                                            className="max-h-32 object-contain"
                                        />
                                    ) : (
                                        <div className="text-muted-foreground text-center">
                                            <ImageIcon size={32} className="mx-auto mb-2 opacity-30" />
                                            <p className="text-sm">No valid stamp uploaded</p>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Upload New Stamp</label>
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            onChange={e => setStampFile(e.target.files?.[0] || null)}
                                            className="cursor-pointer"
                                        />
                                        <p className="text-xs text-muted-foreground">Recommended: Transparent PNG or SVG.</p>
                                    </div>

                                    {stampMessage && (
                                        <div className={clsx("p-2 rounded text-xs flex items-center gap-2",
                                            stampMessage.type === 'success' ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                                        )}>
                                            {stampMessage.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                                            {stampMessage.text}
                                        </div>
                                    )}

                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        disabled={!stampFile || uploadingStamp}
                                        onClick={handleStampUpload}
                                        className="w-full"
                                    >
                                        {uploadingStamp ? <Loader2 className="animate-spin mr-2" /> : <Upload className="mr-2" size={14} />}
                                        Upload Stamp
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-border bg-muted/10 flex justify-between items-center sticky bottom-0">
                    {onDelete ? (
                        <Button
                            type="button"
                            size="sm"
                            onClick={onDelete}
                            className="bg-rose-600 hover:bg-rose-700 text-white border-rose-600 dark:text-white"
                        >
                            <Trash2 size={16} className="mr-2" /> Delete Location
                        </Button>
                    ) : <div></div>}

                    <div className="flex gap-3">
                        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button
                            type="submit"
                            form="location-form" // Link to form
                            disabled={submitting}
                        >
                            {submitting ? <Loader2 className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                            {submitLabel}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}


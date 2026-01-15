import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { fetchMyCertifications } from '../lib/api';
import type { Certification, Address } from '../lib/data/types';
import { generateCertificatePDF } from '../lib/certificate';
import { Award, Save, Loader2, Download, LogOut, MapPin } from 'lucide-react';
import { LocationSearchInput } from '../components/ui/LocationSearchInput';
import { Input } from '../components/ui/Input';

export function ProfilePage() {
    const { user, updateProfile, logout } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [certificates, setCertificates] = useState<Certification[]>([]);
    const [isLoadingCerts, setIsLoadingCerts] = useState(true);
    const [editAddress, setEditAddress] = useState<Address | null>(null);

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
    });

    useEffect(() => {
        if (user) {
            setFormData({
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
            });
            setEditAddress(user.address || null);

            // Fetch certificates
            fetchMyCertifications()
                .then(setCertificates)
                .catch(console.error)
                .finally(() => setIsLoadingCerts(false));
        }
    }, [user]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateProfile({ ...formData, address: editAddress || undefined });
        setIsEditing(false);
    };

    if (!user) return <div className="p-8">Please log in to view profile.</div>;

    return (
        <div className="space-y-6">
            <PageHeader
                title="My Profile"
                description="Manage your personal information and view your achievements."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">First Name</label>
                                    <Input
                                        type="text"
                                        name="first_name"
                                        value={formData.first_name}
                                        onChange={handleInputChange}
                                        disabled={!isEditing}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Last Name</label>
                                    <Input
                                        type="text"
                                        name="last_name"
                                        value={formData.last_name}
                                        onChange={handleInputChange}
                                        disabled={!isEditing}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Email</label>
                                <Input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Location</label>
                                {isEditing ? (
                                    <div className="space-y-2">
                                        <LocationSearchInput
                                            defaultValue={editAddress?.formatted}
                                            onSelect={setEditAddress}
                                            placeholder="Search your city..."
                                        />
                                        {editAddress && (
                                            <p className="text-xs text-primary flex items-center gap-1">
                                                <MapPin size={12} /> {editAddress.formatted}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 p-2 rounded-md border border-transparent disabled:bg-muted text-foreground">
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                        {user.address ? (
                                            <span>{user.address.city}, {user.address.country}</span>
                                        ) : (
                                            <span className="text-muted-foreground italic">No location set</span>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">System Roles</label>
                                <div className="flex gap-2 flex-wrap">
                                    {user.roles.map(r => (
                                        <span key={r} className="px-2 py-1 rounded-md bg-secondary text-secondary-foreground text-sm capitalize">
                                            {r.replace('_', ' ')}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end">
                                {isEditing ? (
                                    <div className="flex gap-2">
                                        <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                                        <Button type="submit" className="flex items-center gap-2">
                                            <Save size={16} /> Save Changes
                                        </Button>
                                    </div>
                                ) : (
                                    <Button type="button" onClick={() => setIsEditing(true)}>Edit Profile</Button>
                                )}
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Certificates */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Award className="text-primary" /> My Certifications
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoadingCerts ? (
                            <div className="flex items-center justify-center p-8 text-slate-500">
                                <Loader2 className="animate-spin mr-2" /> Loading...
                            </div>
                        ) : certificates.length === 0 ? (
                            <div className="text-center p-8 text-slate-500 italic">
                                No certifications found.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {certificates.map(cert => (
                                    <div key={cert.id} className="flex items-start justify-between p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors">
                                        <div>
                                            <h4 className="font-bold text-foreground">{cert.certification_type}</h4>
                                            <p className="text-sm text-muted-foreground">Awarded: {new Date(cert.issue_date).toLocaleDateString()}</p>
                                            <p className="text-xs text-muted-foreground/70 mt-1">Center: {cert.issuing_center_name || 'N/A'}</p>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-xs flex items-center gap-1 hover:bg-primary/10 hover:text-primary hover:border-primary/20 text-muted-foreground"
                                            onClick={async () => {
                                                let stampUrl = null;
                                                if (cert.issuing_center_stamp_url) {
                                                    stampUrl = `http://localhost:3000/uploads/${cert.issuing_center_stamp_url}`;
                                                }
                                                await generateCertificatePDF(user as any, cert, stampUrl);
                                            }}
                                            title="Download PDF Certificate"
                                        >
                                            <Download size={12} /> Download
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-center pt-8 pb-4">
                <Button
                    variant="default"
                    onClick={() => logout()}
                    className="bg-red-600 hover:bg-red-700 text-white text-lg px-8 py-6 w-full max-w-sm shadow-lg flex items-center justify-center gap-2"
                >
                    <LogOut size={24} /> Log Out Securely
                </Button>
            </div>
        </div>
    );
}


import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { fetchData } from '../lib/api';
import type { Certification } from '../types';
import { generateCertificatePDF } from '../lib/certificate';
import { Award, Save, Loader2, Download } from 'lucide-react';

export function ProfilePage() {
    const { user, updateProfile } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [certificates, setCertificates] = useState<Certification[]>([]);
    const [isLoadingCerts, setIsLoadingCerts] = useState(true);

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        professionalrole: '',
        work_city: '',
    });

    useEffect(() => {
        if (user) {
            setFormData({
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                professionalrole: user.professionalrole,
                work_city: user.work_city,
            });

            // Fetch certificates
            fetchData().then(db => {
                const userCerts = db.certifications.filter(c => c.student_id === user.student_id);
                setCertificates(userCerts);
                setIsLoadingCerts(false);
            });
        }
    }, [user]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateProfile(formData);
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
                                    <label className="text-sm font-medium text-slate-500">First Name</label>
                                    <input
                                        type="text"
                                        name="first_name"
                                        value={formData.first_name}
                                        onChange={handleInputChange}
                                        disabled={!isEditing}
                                        className="w-full p-2 rounded border border-slate-200 bg-background disabled:bg-slate-50 disabled:text-slate-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-500">Last Name</label>
                                    <input
                                        type="text"
                                        name="last_name"
                                        value={formData.last_name}
                                        onChange={handleInputChange}
                                        disabled={!isEditing}
                                        className="w-full p-2 rounded border border-slate-200 bg-background disabled:bg-slate-50 disabled:text-slate-500"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-500">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    className="w-full p-2 rounded border border-slate-200 bg-background disabled:bg-slate-50 disabled:text-slate-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-500">Professional Role</label>
                                <input
                                    type="text"
                                    name="professionalrole"
                                    value={formData.professionalrole}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    className="w-full p-2 rounded border border-slate-200 bg-background disabled:bg-slate-50 disabled:text-slate-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-500">City</label>
                                <input
                                    type="text"
                                    name="work_city"
                                    value={formData.work_city}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    className="w-full p-2 rounded border border-slate-200 bg-background disabled:bg-slate-50 disabled:text-slate-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-500">System Role (Read-Only)</label>
                                <div className="w-full p-2 rounded border border-slate-200 bg-slate-50 text-slate-500 capitalize">
                                    {user.role.replace('_', ' ')}
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
                                    <div key={cert.studentcertification_id} className="flex items-start justify-between p-4 rounded-lg border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors">
                                        <div>
                                            <h4 className="font-bold text-slate-900">{cert.certification}</h4>
                                            <p className="text-sm text-slate-500">Awarded: {new Date(cert.certification_date).toLocaleDateString()}</p>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-xs flex items-center gap-1 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 text-slate-600"
                                            onClick={() => generateCertificatePDF(user, cert)}
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
        </div>
    );
}

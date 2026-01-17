
import type { TrainingCenter, TrainingEvent, User, Certification, Degree, DashboardStats } from './data/types';
import { getAuthHeaders } from '../contexts/AuthContext';

const API_BASE = 'http://localhost:3000/api';

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const headers = getAuthHeaders();
    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
            ...headers,
            ...options.headers,
        },
    });

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('Unauthorized');
        }
        throw new Error(`API Error: ${response.statusText}`);
    }
    const json = await response.json();
    return json.data || json;
}

export async function fetchCenters(): Promise<TrainingCenter[]> {
    return fetchWithAuth('/centers');
}

export async function fetchEvents(): Promise<TrainingEvent[]> {
    return fetchWithAuth('/events');
}

export async function fetchUsers(): Promise<User[]> {
    return fetchWithAuth('/admin/users');
}

export async function fetchMyCertifications(): Promise<Certification[]> {
    return fetchWithAuth('/my-certifications');
}

export async function fetchCertifications(): Promise<Certification[]> {
    return fetchWithAuth('/admin/certifications');
}

export async function fetchStats(): Promise<DashboardStats> {
    return fetchWithAuth('/admin/stats');
}

export async function fetchMapData(): Promise<{ name: string, coordinates: [number, number], count: number }[]> {
    return fetchWithAuth('/admin/map-data');
}


export async function fetchDegrees(): Promise<Degree[]> {
    return fetchWithAuth('/admin/degrees');
}

export async function createCenter(data: Partial<TrainingCenter>): Promise<TrainingCenter> {
    return fetchWithAuth('/admin/centers', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
    });
}

export async function updateProfile(data: Partial<User>): Promise<User> {
    return fetchWithAuth('/auth/me', {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
    });
}



export async function updateCenter(id: string, data: Partial<TrainingCenter>): Promise<TrainingCenter> {
    return fetchWithAuth(`/admin/centers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
    });
}

export async function deleteCenter(id: string): Promise<void> {
    await fetchWithAuth(`/admin/centers/${id}`, {
        method: 'DELETE'
    });
}

export async function uploadStamp(locationId: string, file: File): Promise<{ message: string, filename: string }> {
    const formData = new FormData();
    formData.append('stamp', file);
    formData.append('location_id', locationId);

    const headers = getAuthHeaders();
    // Remove Content-Type so browser sets boundary for FormData
    delete headers['Content-Type'];

    const response = await fetch(`${API_BASE}/locations/stamp`, {
        method: 'POST',
        headers: {
            ...headers,
        },
        body: formData
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Upload failed');
    }
    return response.json();
}

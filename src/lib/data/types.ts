export type UserRole = 'admin' | 'master_trainer' | 'trainer' | 'trainee' | 'center_director';

export interface Address {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    formatted?: string;
    lat?: string;
    lng?: string;
}

export interface User {
    id: string; // UUID
    email: string;
    first_name: string;
    last_name: string;
    credentials?: string;
    avatar_url?: string;
    address_json?: string; // Stored as JSON string in DB
    address?: Address; // Parsed for frontend
    roles: UserRole[];
    created_at: string;
    last_login_at?: string;
}

export type NurseryLevel = 1 | 2 | 3 | 4;

export interface TrainingCenter {
    id: string; // UUID
    name: string;
    address_json?: string; // Stored as JSON string
    address?: Address;     // Parsed for frontend
    // Legacy support while migrating
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;

    nursery_level: NurseryLevel;
    stamp_url?: string;
    is_active: boolean;
}

export type CourseType = string;

export interface TrainingEvent {
    id: string;
    center_id: string;
    course_type: CourseType;
    start_date: string;
    end_date: string;
    lead_trainer_id: string;
    center_name?: string; // Joined from API
    lead_trainer_name?: string; // Joined from API
}

export type EnrollmentStatus = 'registered' | 'attended' | 'completed' | 'incomplete';

export interface Enrollment {
    id: string;
    event_id: string;
    trainee_id: string;
    status: EnrollmentStatus;
    grade?: string;
}

export interface Certification {
    id: string;
    user_id: string;
    certification_type: string; // e.g. "NIDCAP Professional"
    issue_date: string;
    issuing_center_id: string;
    signer_user_id: string;
    pdf_url?: string;
    signature_hash?: string;
    revoked_at?: string;
    issuing_center_name?: string; // Joined
    issuing_center_stamp_url?: string; // Joined
    first_name?: string; // Joined (Trainee)
    last_name?: string; // Joined (Trainee)
}

export interface Degree {
    id: string;
    trainee_id: string;
    degree: string;
    discipline: string;
    first_name?: string; // Joined
    last_name?: string; // Joined
}

export interface DashboardStats {
    trainees: number;
    locations: number;
    certifications: number;
    courses: number;
}

export interface DatabaseState {
    users: User[];
    centers: TrainingCenter[];
    events: TrainingEvent[];
    enrollments: Enrollment[];
    certifications: Certification[];
}

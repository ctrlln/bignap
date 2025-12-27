
export type UserRole = 'admin' | 'master_trainer' | 'trainer' | 'student';

export interface Location {
    location_id: number;
    location_name: string;
    location_city: string;
    location_country: string;
    // ... add other fields as needed
    nurserylevel_id: number;
}

export interface Student {
    student_id: number;
    first_name: string;
    last_name: string;
    email: string;
    professionalrole: string;
    work_city: string;
    location_id: number;
    role: 'admin' | 'master_trainer' | 'trainer' | 'student';
}

export interface Degree {
    studentdegree_id: number;
    student_id: number;
    degree: string;
    discipline: string;
}

export interface Certification {
    studentcertification_id: number;
    student_id: number;
    certification: string;
    certification_date: string;
}

export interface Course {
    course_id: number;
    coursename: string;
    coursedate: string;
    center_name: string;
    student_id: number;
}

export interface Database {
    locations: Location[];
    students: Student[];
    degrees: Degree[];
    certifications: Certification[];
    courses: Course[];
}

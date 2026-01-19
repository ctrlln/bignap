
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { faker } from '@faker-js/faker';
import { db } from '../src/db'; // Assuming standard export
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';

const CSV_DIR = '/Users/oliver/Downloads/csv';

async function seed() {
    console.log('🌱 Starting database seed with CSV import...');

    // 1. Wipe existing data (Order matters for foreign keys)
    console.log('🧹 Cleaning up existing data...');
    const tables = ['degrees', 'certifications', 'enrollments', 'training_events', 'user_roles', 'users', 'training_centers'];
    for (const table of tables) {
        try {
            db.prepare(`DELETE FROM ${table}`).run();
        } catch (e) {
            console.warn(`Could not clear table ${table}, maybe it doesn't exist yet?`);
        }
    }

    // Ensure Roles exist (They might have been preserved or we can re-insert)
    // We'll trust db.ts or existing schema to have roles, but let's re-upsert them just in case.
    const ROLES = ['admin', 'master_trainer', 'trainer', 'trainee', 'center_director'];
    const roleIds: Record<string, string> = {};
    const insertRole = db.prepare('INSERT OR IGNORE INTO roles (id, name, description) VALUES (?, ?, ?)');
    const getRole = db.prepare('SELECT id FROM roles WHERE name = ?');

    for (const r of ROLES) {
        let id: string = randomUUID();
        // Try to get existing ID to keep stable if we didn't wipe roles (we didn't wipe roles in the list above)
        const existing = getRole.get(r) as { id: string } | undefined;
        if (existing) {
            id = existing.id;
        } else {
            insertRole.run(id, r, `Role for ${r}`);
        }
        roleIds[r] = id;
    }

    // Helpers
    const passwordHash = bcrypt.hashSync('password123', 10);
    const insertUser = db.prepare(`
    INSERT INTO users (id, email, password_hash, first_name, last_name, credentials, address_json, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
    const insertUserRole = db.prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)');

    const createCoreUser = (email: string, fName: string, lName: string, roles: string[], creds: string = 'RN', city: string = 'Boston', country: string = 'USA') => {
        const id = randomUUID();
        const address = { city, country, formatted: `${city}, ${country}` };
        insertUser.run(id, email, passwordHash, fName, lName, creds, JSON.stringify(address), 1, new Date().toISOString());
        for (const r of roles) {
            insertUserRole.run(id, roleIds[r]);
        }
        return id;
    };

    // 2. Restore Test Accounts
    console.log('👤 Restoring Test Accounts...');
    const adminId = createCoreUser('verna.schamberger@test.local', 'Verna', 'Schamberger', ['admin'], 'PhD, NIDCAP Master Trainer', 'Boston', 'USA');
    const masterId = createCoreUser('luther.jacobs@test.local', 'Luther', 'Jacobs', ['master_trainer', 'center_director'], 'MD, PhD', 'Stockholm', 'Sweden');
    const trainerId = createCoreUser('gayle.harvey@test.local', 'Gayle', 'Harvey', ['trainer'], 'RN, MSN', 'Oklahoma City', 'USA');

    // ID Mappings (Old CSV ID -> New UUID)
    const locationMap = new Map<string, string>(); // old_id -> new_uuid
    const studentMap = new Map<string, string>(); // old_id -> new_uuid

    // 3. Import Training Centers (Locations.csv)
    console.log('🏥 Importing Training Centers...');
    const locationsContent = fs.readFileSync(path.join(CSV_DIR, 'Locations.csv'));
    const locations = parse(locationsContent, { columns: true, bom: true, relax_quotes: true });

    const insertCenter = db.prepare(`
    INSERT INTO training_centers (id, name, address_json, nursery_level, is_active)
    VALUES (?, ?, ?, ?, ?)
  `);

    for (const loc of locations as any) {
        // Columns: location_id, location_name, add1, add2, city, state, zip, country, phone, fax, email, director_id, contact_id, trainer_id...
        const newId = randomUUID();
        locationMap.set(loc.location_id, newId);

        const address = {
            street: loc.add1,
            city: loc.city,
            state: loc.state,
            zip: loc.zip,
            country: loc.country,
            formatted: `${loc.city}, ${loc.country}`
        };

        insertCenter.run(
            newId,
            loc.location_name || 'Unknown Center',
            JSON.stringify(address),
            3, // Default level, CSV doesn't seem to have level
            1
        );
    }

    // 4. Import Students (Students.csv) -> Anonymized Users
    console.log('🎓 Importing Students (Anonymized)...');
    const studentsContent = fs.readFileSync(path.join(CSV_DIR, 'Students.csv'));
    const students = parse(studentsContent, { columns: true, bom: true, relax_quotes: true });

    for (const stu of students as any) {
        // Columns: student_id, first_name, last_name, email, ... location_id
        if (!stu.student_id) continue;

        const newId = randomUUID();
        studentMap.set(stu.student_id, newId);

        // Anonymize
        const fakeFirstName = faker.person.firstName();
        const fakeLastName = faker.person.lastName();
        const fakeEmail = faker.internet.email({ firstName: fakeFirstName, lastName: fakeLastName });

        // Map Location
        // Some students might have location_id that maps to a center
        // We can't easily link users to centers directly in the current schema unless they are directors, 
        // but the schema has `training_centers` and `users`. 
        // Usually trainees are just users. 
        // If we want to associate them, we might need a `center_id` on users or relying on enrollments.
        // For now, we just create the user.

        // Credentials from CSV or Fallback
        const creds = stu.credentials || faker.helpers.arrayElement(['RN', 'MD', 'PT', 'OT']);

        const address = {
            city: stu.work_city || stu.home_city || faker.location.city(),
            country: stu.work_country || stu.home_country || faker.location.country()
        };

        insertUser.run(
            newId,
            fakeEmail,
            passwordHash,
            fakeFirstName,
            fakeLastName,
            creds,
            JSON.stringify(address),
            1,
            new Date().toISOString()
        );

        insertUserRole.run(newId, roleIds['trainee']);
    }

    // 5. Import Degrees (StudentDegrees.csv)
    console.log('📜 Importing Degrees...');
    const degreesContent = fs.readFileSync(path.join(CSV_DIR, 'StudentDegrees.csv'));
    const degrees = parse(degreesContent, { columns: true, bom: true, relax_quotes: true }); // Columns: studentdegree_id, student_id, degree, major...

    const insertDegree = db.prepare('INSERT INTO degrees (id, trainee_id, degree, discipline) VALUES (?, ?, ?, ?)');

    for (const deg of degrees as any) {
        const traineeId = studentMap.get(deg.student_id);
        if (!traineeId) continue; // Skip if student not found (e.g. filtered out)

        insertDegree.run(
            randomUUID(),
            traineeId,
            deg.degree || 'Unknown',
            deg.major || 'General' // Mapping 'major' to 'discipline'
        );
    }

    // 6. Import Certifications (Certifications.csv)
    console.log('🏅 Importing Certifications...');
    const certsContent = fs.readFileSync(path.join(CSV_DIR, 'Certifications.csv'));
    const certs = parse(certsContent, { columns: true, bom: true, relax_quotes: true });

    const insertCert = db.prepare(`
    INSERT INTO certifications (id, user_id, certification_type, issue_date, issuing_center_id, signer_user_id) 
    VALUES (?, ?, ?, ?, ?, ?)
  `);

    for (const cert of certs as any) {
        // Columns: certification_id, student_id, certification_date, location_id (issuing center), ...
        const traineeId = studentMap.get(cert.student_id);
        if (!traineeId) continue;

        const centerId = locationMap.get(cert.location_id);

        insertCert.run(
            randomUUID(),
            traineeId,
            'NIDCAP Professional', // Defaulting type as it's likely NIDCAP
            cert.certification_date ? new Date(cert.certification_date).toISOString() : new Date().toISOString(),
            centerId || null,
            adminId // Default signer
        );
    }

    // 7. Import Courses (TrainingCourses.csv) -> Events & Enrollments
    console.log('📚 Importing Training Courses...');
    const coursesContent = fs.readFileSync(path.join(CSV_DIR, 'TrainingCourses.csv'));
    const courses = parse(coursesContent, { columns: true, bom: true, relax_quotes: true });

    const insertEvent = db.prepare(`
    INSERT INTO training_events (id, center_id, course_type, start_date, end_date, lead_trainer_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

    const insertEnrollment = db.prepare(`
      INSERT INTO enrollments (id, event_id, trainee_id, status, grade)
      VALUES (?, ?, ?, ?, ?)
  `);

    // It seems TrainingCourses.csv is denormalized: one row per student per course? 
    // "course_id, coursename, student_id..."
    // If so, we need to dedup events.
    // Group by course_id
    const eventMap = new Map<string, {
        id: string,
        center_id?: string,
        date?: string,
        name: string,
        trainer_id?: string
    }>();
    const enrollmentsToInsert: any[] = [];

    for (const row of courses as any) {
        // row.course_id is the grouping key
        if (!eventMap.has(row.course_id)) {
            eventMap.set(row.course_id, {
                id: randomUUID(),
                center_id: locationMap.get(row.center_id),
                date: row.coursedate,
                name: row.coursename || 'NIDCAP Training',
                trainer_id: trainerId // Default for now
            });
        }

        const event = eventMap.get(row.course_id)!;
        const traineeId = studentMap.get(row.student_id);

        if (traineeId && row.student_id !== '0') {
            enrollmentsToInsert.push({
                id: randomUUID(),
                event_id: event.id,
                trainee_id: traineeId,
                status: 'completed',
                grade: 'Pass'
            });
        }
    }

    // Insert distinct events
    for (const [oldId, evt] of eventMap) {
        const startDate = evt.date ? new Date(evt.date) : new Date();
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 3);

        insertEvent.run(
            evt.id,
            evt.center_id || null,
            evt.name, // Storing name in course_type for now or we might need a mapping
            startDate.toISOString(),
            endDate.toISOString(),
            masterId // Defaulting lead trainer
        );
    }

    // Now insert enrollments
    for (const enr of enrollmentsToInsert) {
        insertEnrollment.run(
            enr.id,
            enr.event_id,
            enr.trainee_id,
            enr.status,
            enr.grade
        );
    }

    // 8. Intro Lectures (IntroLectures.csv)
    console.log('🎤 Importing Intro Lectures...');
    const lecturesContent = fs.readFileSync(path.join(CSV_DIR, 'IntroLectures.csv'));
    const lectures = parse(lecturesContent, { columns: true, bom: true, relax_quotes: true });

    for (const lec of lectures as any) {
        // lecture_id, lecture_date, location_id
        const centerId = locationMap.get(lec.location_id);
        insertEvent.run(
            randomUUID(),
            centerId || null,
            'Intro Lecture',
            lec.lecture_date ? new Date(lec.lecture_date).toISOString() : new Date().toISOString(),
            lec.lecture_date ? new Date(lec.lecture_date).toISOString() : new Date().toISOString(), // Same day
            trainerId
        );
    }

    console.log('✅ Seeding complete!');
}

seed().catch(console.error);

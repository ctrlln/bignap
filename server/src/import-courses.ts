
import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { db, initDB } from './db.js';
import { randomUUID } from 'crypto';

const CSV_PATH = '/Users/oliver/Downloads/TrainingCourses.csv';

interface CSVRecord {
    course_id: string;
    coursename: string;
    coursedate: string;
    date_created: string;
    date_updated: string;
    Student: string;
    Trainer: string;
    mastertrainer: string;
    center_name: string;
}

async function main() {
    console.log('Running DB Init...');
    initDB();

    console.log(`Reading CSV from ${CSV_PATH}...`);
    const fileContent = fs.readFileSync(CSV_PATH, { encoding: 'utf-8' });

    const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_quotes: true
    }) as CSVRecord[];

    console.log(`Found ${records.length} records.`);

    // Cache lookup maps
    const centerMap = new Map<string, string>(); // name -> id
    const userMap = new Map<string, string>(); // name -> id
    const roleMap = new Map<string, string>(); // name -> id

    // Load Roles
    const roles = db.prepare('SELECT id, name FROM roles').all() as { id: string, name: string }[];
    for (const r of roles) roleMap.set(r.name, r.id);

    // Prepare Statements
    const findCenter = db.prepare('SELECT id FROM training_centers WHERE name = ?');
    const insertCenter = db.prepare('INSERT INTO training_centers (id, name, is_active, nursery_level) VALUES (?, ?, 1, 3)'); // Default level 3

    const findUserByName = db.prepare('SELECT id FROM users WHERE first_name = ? AND last_name = ?');
    const insertUser = db.prepare('INSERT INTO users (id, email, first_name, last_name, is_active, created_at) VALUES (?, ?, ?, ?, 1, ?)');
    const insertUserRole = db.prepare('INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)');

    const insertEvent = db.prepare('INSERT INTO training_events (id, center_id, course_type, start_date, end_date, lead_trainer_id) VALUES (?, ?, ?, ?, ?, ?)');
    const insertEnrollment = db.prepare('INSERT INTO enrollments (id, event_id, trainee_id, status) VALUES (?, ?, ?, ?)');

    // Helper: Find or Create User
    const getUserId = (fullName: string, role: string): string => {
        const trimmed = fullName.trim();
        if (!trimmed) return '';
        if (userMap.has(trimmed)) return userMap.get(trimmed)!;

        // Split Name
        // Handle "Mary "Sharon" Brennan" -> Remove quotes?
        // Simple heuristic: First part is First Name, rest is Last Name.
        // Clean quotes
        const cleanName = trimmed.replace(/"/g, '');
        const parts = cleanName.split(' ');
        const firstName = parts[0];
        const lastName = parts.slice(1).join(' ') || 'Unknown';

        // Check DB
        const existing = findUserByName.get(firstName, lastName) as { id: string } | undefined;
        if (existing) {
            userMap.set(trimmed, existing.id);
            return existing.id;
        }

        // Create
        const id = randomUUID();
        const email = `${firstName}.${lastName.replace(/\s/g, '')}.${id.substring(0, 4)}@import.local`.toLowerCase();

        insertUser.run(id, email, firstName, lastName, new Date().toISOString());

        // Add Role
        const roleId = roleMap.get(role);
        if (roleId) {
            insertUserRole.run(id, roleId);
        }

        console.log(`Created user: ${firstName} ${lastName} (${role})`);
        userMap.set(trimmed, id);
        return id;
    };

    // Helper: Find or Create Center
    const getCenterId = (centerName: string): string => {
        const trimmed = centerName.trim() || 'Unknown Center';
        if (centerMap.has(trimmed)) return centerMap.get(trimmed)!;

        const existing = findCenter.get(trimmed) as { id: string } | undefined;
        if (existing) {
            centerMap.set(trimmed, existing.id);
            return existing.id;
        }

        const id = randomUUID();
        insertCenter.run(id, trimmed);
        console.log(`Created Center: ${trimmed}`);
        centerMap.set(trimmed, id);
        return id;
    };

    db.transaction(() => {
        let importedCount = 0;

        for (const record of records) {
            // Validate essential fields
            if (!record.coursename) continue;

            const centerName = record.center_name || 'TBD';
            const centerId = getCenterId(centerName);

            // Determine Start Date
            let startDate = new Date().toISOString();
            if (record.coursedate) {
                try {
                    startDate = new Date(record.coursedate).toISOString();
                } catch (e) {
                    console.warn(`Invalid date: ${record.coursedate}`);
                }
            } else if (record.date_created) {
                try {
                    startDate = new Date(record.date_created).toISOString();
                } catch (e) { }
            }

            // Lead Trainer
            // Prefer Trainer, fallback to mastertrainer
            const trainerName = record.Trainer || record.mastertrainer || 'Staff';
            const trainerId = getUserId(trainerName, 'trainer');

            // Unique Event ID?
            // If CSV has course_id, we can map it to allow idempotency if we wanted, 
            // but UUID is safer for our system. 
            // We can check if event exists by same date/center/type to avoid dupes?
            // For now, let's just insert. User asked to "implement the data".

            const eventId = randomUUID(); // or use record.course_id + prefix? 

            insertEvent.run(
                eventId,
                centerId,
                record.coursename,
                startDate,
                startDate, // End date same as start for now
                trainerId
            );

            // Trainee Enrollment (was Student)
            if (record.Student) {
                const traineeId = getUserId(record.Student, 'trainee');
                insertEnrollment.run(randomUUID(), eventId, traineeId, 'completed');
            }

            importedCount++;
            if (importedCount % 100 === 0) process.stdout.write('.');
        }
        console.log(`\nImported ${importedCount} events.`);
    })();
}

main().catch(console.error);

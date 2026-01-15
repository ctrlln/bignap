import fs from 'fs';
import path from 'path';
import { db } from './db';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';

const CSV_PATH = '/Users/oliver/Downloads/Certifications.csv';

function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

function formatDate(dateStr: string): string {
    try {
        // Handle formats like "1/1/1753 12:00:00 AM"
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return new Date().toISOString();
        return date.toISOString();
    } catch {
        return new Date().toISOString();
    }
}

function seedCertifications() {
    console.log(`Reading CSV from ${CSV_PATH}...`);

    try {
        const fileContent = fs.readFileSync(CSV_PATH, 'utf-8');
        const lines = fileContent.split('\n').filter(l => l.trim().length > 0);

        // Skip header
        const dataLines = lines.slice(1);

        console.log(`Found ${dataLines.length} records. Processing...`);

        // Prepared statements
        const findUserByName = db.prepare('SELECT id, email FROM users WHERE first_name = ? AND last_name = ?');
        const findUserByEmail = db.prepare('SELECT id FROM users WHERE email = ?');
        const insertUser = db.prepare(`
            INSERT INTO users (id, email, password_hash, first_name, last_name, credentials, is_active, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const insertUserRole = db.prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)');
        const insertCert = db.prepare(`
            INSERT INTO certifications (id, user_id, certification_type, issue_date, issuing_center_id, pdf_url, revoked_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        // Get Student Role ID
        const studentRole = db.prepare("SELECT id FROM roles WHERE name = 'student'").get() as { id: string } | undefined;
        if (!studentRole) {
            console.error("Student role not found! Run server migration first.");
            process.exit(1);
        }

        // Default Password Hash
        const passwordHash = bcrypt.hashSync('password123', 10);

        let newUsers = 0;
        let newCerts = 0;

        db.transaction(() => {
            for (const line of dataLines) {
                // simple parse assuming no commas in fields for now, or basic structure
                const cols = parseCSVLine(line);
                // Schema: studentcertification_id,student_id,certification_id,certification_date,trainer_id,trainingcenter_id,certification,date_entered,date_updated,studentname

                if (cols.length < 10) continue;

                const certName = cols[6]; // e.g., "NIDCAP Professional"
                const certDate = formatDate(cols[3]);
                const studentName = cols[9];

                // Parse Name
                const nameParts = studentName.split(' ');
                const firstName = nameParts[0];
                const lastName = nameParts.slice(1).join(' ') || 'Unknown';

                // Find or Create User
                let userId: string;
                let user = findUserByName.get(firstName, lastName) as { id: string } | undefined;

                if (user) {
                    userId = user.id;
                } else {
                    // Create User
                    userId = randomUUID();
                    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/[^a-z0-9]/g, '')}@example.com`;

                    // Check if email exists (handle dup names resulting in dup emails)
                    let emailCheck = findUserByEmail.get(email);
                    let finalEmail = email;
                    let counter = 1;
                    while (emailCheck) {
                        finalEmail = `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/[^a-z0-9]/g, '')}${counter}@example.com`;
                        emailCheck = findUserByEmail.get(finalEmail);
                        counter++;
                    }

                    insertUser.run(
                        userId,
                        finalEmail,
                        passwordHash,
                        firstName,
                        lastName,
                        'Student',
                        1,
                        new Date().toISOString()
                    );
                    insertUserRole.run(userId, studentRole.id);
                    newUsers++;
                }

                // Insert Certification
                // We don't have training center mapping from CSV ID to our DB ID easily, 
                // so we'll pick a random one or generic one, OR try to map if possible.
                // For now, let's leave issuing_center_id NULL or pick a default if DB allows.
                // Our schema: FOREIGN KEY(issuing_center_id) REFERENCES training_centers(id)
                // Let's get a default center.
                const defaultCenter = db.prepare('SELECT id FROM training_centers LIMIT 1').get() as { id: string };

                insertCert.run(
                    randomUUID(),
                    userId,
                    certName,
                    certDate,
                    defaultCenter?.id || null, // Fallback
                    `/uploads/certs/fake_${randomUUID()}.pdf`, // Synthetic PDF URL
                    null // Revoked
                );
                newCerts++;
            }
        })();

        console.log(`Processed CSV. Created ${newUsers} users and ${newCerts} certifications.`);

        // --- Special Handling for Verna (Admin) ---
        const vernaEmail = 'verna.schamberger@test.local';
        const verna = findUserByEmail.get(vernaEmail) as { id: string } | undefined;

        if (verna) {
            console.log("Ensuring Verna has Master Trainer certificate...");
            const defaultCenter = db.prepare('SELECT id FROM training_centers LIMIT 1').get() as { id: string };

            insertCert.run(
                randomUUID(),
                verna.id,
                'NIDCAP Master Trainer',
                new Date('2015-06-15').toISOString(),
                defaultCenter?.id,
                '/uploads/certs/verna_master.pdf',
                null
            );
            console.log("Added Verna's certificate.");
        } else {
            console.warn("Verna user not found. Skipping manual cert assignment.");
        }

    } catch (err: any) {
        console.error("Error seeding certifications:", err.message);
    }
}

seedCertifications();

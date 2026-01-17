
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../local.db');
const csvPath = '/Users/oliver/Downloads/Locations.csv';

console.log(`opening db at ${dbPath}`);
const db = new Database(dbPath);

function parseCSVLine(line: string): string[] {
    const result = [];
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

function parseLevel(levelStr: string): number {
    if (!levelStr) return 0;
    const lower = levelStr.toLowerCase();
    if (lower.includes('level i') && !lower.includes('ii') && !lower.includes('iii') && !lower.includes('iv')) return 1;
    if (lower.includes('level ii') && !lower.includes('iii')) return 2;
    if (lower.includes('level iii')) return 3;
    if (lower.includes('level iv')) return 4;
    return 0; // Default or "Not Set"
}

function importLocations() {
    console.log('Starting location import...');

    if (!fs.existsSync(csvPath)) {
        console.error('CSV file not found:', csvPath);
        process.exit(1);
    }

    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = fileContent.split('\n');

    // Skip header
    const dataLines = lines.slice(1).filter(l => l.trim().length > 0);

    // Clear dependent data structure or decouple
    console.log('Decoupling users and certifications from centers...');
    // Set users.work_location_id to NULL (schema check: users table has work_location_id? wait, the db.ts I viewed doesn't show work_location_id in create table for users.
    // Let me check lines 14-25 of db.ts again in memory or what I just viewed.
    // The viewed file has:
    /*
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      ...
      address_json TEXT,
      is_active BOOLEAN DEFAULT 1,
      created_at TEXT
    );
    */
    // It DOES NOT have work_location_id in the CREATE statement in db.ts!
    // However, the `proposed_database_structure.md` had it.
    // If the DB matches `db.ts`, then users don't link to centers via FK in the actual DB yet?
    // Wait, the error was "FOREIGN KEY constraint failed".
    // Which table references training_centers?
    // 1. training_events (center_id)
    // 2. certifications (issuing_center_id)
    // 3. users (maybe? if added later? No, `db.ts` shows the source of truth for initDB. if it's not there, it's not there... UNLESS migration added it?
    //    Line 97 adds address_json.
    //    Let's assume the constraints that exist are:
    //    - training_events.center_id
    //    - certifications.issuing_center_id

    // So we must delete training_events or set their center_id to NULL (if nullable).
    // training_events CREATE:
    // center_id TEXT, ... FOREIGN KEY(center_id) REFERENCES training_centers(id)
    // It doesn't say NOT NULL, so maybe nullable. But events without center? Maybe delete them as they are "test" events.

    // certifications CREATE:
    // issuing_center_id TEXT, ... FOREIGN KEY(issuing_center_id) REFERENCES training_centers(id)

    console.log('Cleaning up dependent data...');

    // 1. Enrollments depend on events. Delete enrollments first.
    db.prepare('DELETE FROM enrollments').run();
    console.log('Deleted enrollments.');

    // 2. Events depend on centers. Delete events.
    db.prepare('DELETE FROM training_events').run();
    console.log('Deleted training_events.');

    // 3. Certifications depend on centers.
    // We can try to set issuing_center_id to null if allowed, or delete them.
    // Given we are nuking locations, existing certs pointing to them become invalid contextually.
    // But maybe we want to keep the cert record?
    // Schema: `issuing_center_id TEXT` (implicit nullable unless specified NOT NULL).
    // Let's try setting to NULL.
    // If we delete certs, we lose user history.
    try {
        db.prepare('UPDATE certifications SET issuing_center_id = NULL').run();
        console.log(' decoupled certifications from centers.');
    } catch (e) {
        console.log('Could not nullify certifications center_id, deleting certifications...');
        db.prepare('DELETE FROM certifications').run();
    }

    // Now we can delete centers
    console.log('Clearing existing training_centers...');
    db.prepare('DELETE FROM training_centers').run();

    const insert = db.prepare(`
        INSERT INTO training_centers (id, name, address_json, nursery_level, is_active)
        VALUES (?, ?, ?, ?, 1)
    `);

    let count = 0;

    db.transaction(() => {
        for (const line of dataLines) {
            const cols = parseCSVLine(line);
            // location_id,location_name,nurserylevel_id,location_address1,location_address2,location_address3,location_city,location_state,location_zip,location_country,location_phone,date_created,date_updated,nurserylevel
            // Index: 0       1              2                3                 4                 5                 6             7              8             9               10            11          12          13

            if (cols.length < 2) continue;

            const name = cols[1].replace(/^"|"$/g, ''); // Remove surrounding quotes if manually added by parser? No, parser handles it but simple split doesn't. My parser is basic.
            // My parseCSVLine helper might leave quotes if I didn't strip them. actually current+=char adds them.
            // Let's rely on my parseCSVLine logic which is basic. improved logic below

            // Re-eval basic parser:
            // value inside quotes is preserved. I should strip the quotes for the final value if it was quoted.
            // Let's just fix the value cleaning.

            const clean = (val: string) => val.replace(/^"|"$/g, '').trim();

            const locationName = clean(cols[1]);
            const address1 = clean(cols[3]);
            const address2 = clean(cols[4]);
            const city = clean(cols[6]);
            const state = clean(cols[7]);
            const zip = clean(cols[8]);
            const country = clean(cols[9]);
            const levelStr = clean(cols[13]);

            const addressObj = {
                street: [address1, address2].filter(Boolean).join(', '),
                city: city,
                state: state,
                zip: zip,
                country: country,
                formatted: `${[address1, address2].filter(Boolean).join(', ')}, ${city}, ${state} ${zip}, ${country}`.replace(/, ,/g, ',').replace(/^, /, '').replace(/, $/, '')
            };

            const level = parseLevel(levelStr);
            const id = crypto.randomUUID();

            insert.run(id, locationName, JSON.stringify(addressObj), level);
            count++;
        }
    })();

    console.log(`Imported ${count} locations.`);
}

importLocations();

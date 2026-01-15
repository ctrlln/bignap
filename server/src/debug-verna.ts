import { db } from './db';

const vernaEmail = 'verna.schamberger@test.local';

console.log('--- Debugging Verna ---');

const verna = db.prepare('SELECT id, email, first_name, last_name FROM users WHERE email = ?').get(vernaEmail) as any;

if (!verna) {
    console.error('Verna not found in DB!');
} else {
    console.log('Verna found:', verna);

    // Check Certs
    const certs = db.prepare('SELECT * FROM certifications WHERE user_id = ?').all(verna.id);
    console.log(`Found ${certs.length} certifications for Verna:`);
    console.dir(certs, { depth: null });
}

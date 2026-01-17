
import { db } from './src/db';
import { validateUser, generateToken } from './src/auth';
import fs from 'fs';

async function run() {
    console.log('--- Starting Debug (Query Param) ---');

    // 1. Login
    const user = validateUser('verna.schamberger@test.local', 'password123');
    if (!user) {
        console.error('Login failed');
        process.exit(1);
    }
    const token = generateToken(user);
    console.log('Logged in as:', user.email);

    // 2. Get Certs
    const cert = db.prepare('SELECT id FROM certifications WHERE user_id = ? LIMIT 1').get(user.id) as { id: string };
    if (!cert) {
        console.error('No certs found for user');
        process.exit(1);
    }
    console.log('Found cert:', cert.id);

    // 3. Download PDF with .pdf extension URL
    console.log('Fetching PDF via /download.pdf path...');
    // Note: The route in server is /my-certifications/:id/download.pdf
    const res = await fetch(`http://localhost:3000/api/my-certifications/${cert.id}/download.pdf?token=${token}`);

    console.log('Status:', res.status);
    console.log('Headers:', Object.fromEntries(res.headers.entries()));

    if (res.ok) {
        console.log('Authentication successful!');
    } else {
        const text = await res.text();
        console.log('Error Body:', text);
    }
}

run();

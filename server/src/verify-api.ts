
import app from './index'; // Import app to use supertest or just fetch if running
// Actually, since server is running, I can just use fetch against localhost:3000
// But I need to ensure it's running. It is.

async function verify() {
    console.log('--- Verifying API ---');
    try {
        // 1. Login
        console.log('Logging in as Verna...');
        const loginRes = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'verna.schamberger@test.local',
                password: 'password123'
            })
        });

        if (!loginRes.ok) {
            throw new Error(`Login failed: ${loginRes.status} ${loginRes.statusText}`);
        }

        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log('Login successful. Token obtained.');
        console.log('User ID from Login:', loginData.user.id);

        // 2. Fetch Certs
        console.log('Fetching certifications...');
        const certRes = await fetch('http://localhost:3000/api/my-certifications', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!certRes.ok) {
            throw new Error(`Fetch certs failed: ${certRes.status} ${certRes.statusText}`);
        }

        const certData = await certRes.json();
        console.log(`Found ${certData.data.length} certifications via API.`);
        console.dir(certData.data, { depth: null });

    } catch (err: any) {
        console.error('Verification failed:', err.message);
    }
}

verify();

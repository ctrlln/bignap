
import request from 'supertest';
import app from '../src/index.js';
import { db } from '../src/db.js';

describe('Auth & RBAC', () => {
    let adminToken: string;
    let userToken: string;

    beforeAll(async () => {
        // Wait for DB init (it's synchronous but good to be safe)
    });

    afterAll(() => {
        // Close DB connection if needed
        // db.close(); // better-sqlite3 closes on process exit, usually fine
    });

    describe('Authentication', () => {
        it('should login successfully with valid credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'verna.schamberger@test.local', password: 'password123' });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('token');
            expect(res.body.user.email).toBe('verna.schamberger@test.local');
            expect(res.body.user.roles).toContain('admin');

            adminToken = res.body.token;
        });

        it('should fail with invalid credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'verna.schamberger@test.local', password: 'wrong' });

            expect(res.status).toBe(401);
        });
    });

    describe('RBAC Access Control', () => {
        beforeAll(async () => {
            const loginRes = await request(app)
                .post('/api/auth/login')
                .send({ email: 'Werner69@hotmail.com', password: 'password123' });
            userToken = loginRes.body.token;
        });

        it('should allow admin to access admin routes', async () => {
            const res = await request(app)
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
        });

        it('should block non-admin from admin routes', async () => {
            const res = await request(app)
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.status).toBe(403);
        });
    });

    describe('Dev Role Override', () => {
        // Note: This relies on NODE_ENV not being 'production'. Jest sets NODE_ENV=test usually.
        // Our logic checks `process.env.NODE_ENV !== 'production'`. 'test' satisfies this.

        it('should allow user to override role to admin', async () => {
            const res = await request(app)
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${userToken}`)
                .set('X-Dev-Role-Override', 'admin');

            expect(res.status).toBe(200); // Should be allowed now
        });

        it('should ignore override if header is missing', async () => {
            const res = await request(app)
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.status).toBe(403);
        });
    });
});

import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { validateUser, generateToken } from './auth.js';
import { authenticate, requireAuth, requireRole, requireAnyRole, AuthRequest } from './middleware.js';
import { db } from './db.js';

const router = Router();

// Configure Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Public: Login
router.post('/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }

    const user = validateUser(email, password);

    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);
    res.json({ token, user });
});

// Middleware for all subsequent routes
router.use(authenticate);

// Helper to parsing address_json
const parseAddress = (item: any) => {
    if (!item) return item;
    const { address_json, ...rest } = item;
    let address = undefined;
    if (address_json) {
        try {
            address = JSON.parse(address_json);
        } catch (e) {
            console.warn('Failed to parse address_json', e);
        }
    }
    return { ...rest, address, address_json }; // Keep address_json just in case, but prefer address
};

// Protected: Get current user info
router.get('/auth/me', requireAuth, (req, res) => {
    const user = (req as AuthRequest).user;
    // req.user might come from token or DB. If from token, it might not have latest address string. 
    // Ideally we fetch fresh from DB or ensure token has it.
    // For now, let's fast path: fetch fresh user to ensure we have address.
    if (user) {
        const userId = user.sub;
        const freshUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
        if (freshUser) {
            const { password_hash, ...u } = freshUser;
            // Parse roles too if needed, but db.ts usually doesn't store roles on user table directly (user_roles table). 
            // Wait, previous code in /auth/login returned user with roles. 
            // Middleware verifyToken uses user from token.
            // Let's just return what parseAddress gives for freshUser + re-attach roles from token or fetch them.
            // The /admin/users route does a join. 
            // Simplified: Just use the stored user if it has address_json, otherwise fetch?
            // Let's fetch strict to be sure.

            // Re-fetch roles
            const roles = db.prepare(`SELECT r.name FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = ?`).all(userId) as { name: string }[];
            const userWithRoles = {
                ...u,
                roles: roles.map(r => r.name)
            };
            return res.json({ user: parseAddress(userWithRoles) });
        }
    }
    res.json({ user: parseAddress(user) });
});

// Protected: Admin only - Users List
router.get('/admin/users', requireRole('admin'), (req, res) => {
    try {
        const rawUsers = db.prepare(`
            SELECT u.id, u.email, u.first_name, u.last_name, u.address_json, group_concat(r.name) as roles_str, u.created_at
            FROM users u
            JOIN user_roles ur ON u.id = ur.user_id
            JOIN roles r ON ur.role_id = r.id
            GROUP BY u.id
        `).all() as any[];

        const users = rawUsers.map(u => {
            const parsed = parseAddress(u);
            return {
                ...parsed,
                roles: u.roles_str ? u.roles_str.split(',') : []
            };
        });

        res.json({ data: users });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Protected: Centers List (Publicly visible to auth users)
router.get('/centers', requireAuth, (req, res) => {
    try {
        const centers = db.prepare('SELECT * FROM training_centers WHERE is_active = 1').all() as any[];
        const parsed = centers.map(parseAddress);
        res.json({ data: parsed });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch centers' });
    }
});

// Protected: Events List
router.get('/events', requireAuth, (req, res) => {
    try {
        const events = db.prepare(`
            SELECT e.*, c.name as center_name, u.first_name || ' ' || u.last_name as lead_trainer_name
            FROM training_events e
            JOIN training_centers c ON e.center_id = c.id
            JOIN users u ON e.lead_trainer_id = u.id
            `).all();
        res.json({ data: events });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

// Protected: My Certifications
router.get('/my-certifications', requireAuth, (req, res) => {
    try {
        const user = (req as AuthRequest).user!;
        const userId = (user as any).id || user.sub;
        const certs = db.prepare(`
            SELECT c.*, centers.name as issuing_center_name, centers.stamp_url as issuing_center_stamp_url
            FROM certifications c
            LEFT JOIN training_centers centers ON c.issuing_center_id = centers.id
            WHERE c.user_id = ?
            `).all(userId);
        res.json({ data: certs });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch certifications' });
    }
});

// Protected: Download Certificate PDF
// Route for downloading certificate PDF (supports direct link with token query param)
// Matches both /pdf and /download.pdf to ensure browser sees extension in URL
router.get(['/my-certifications/:id/pdf', '/my-certifications/:id/download.pdf'], authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const certId = req.params.id;
        const userId = req.user!.sub; // authenticate middleware guarantees user is set

        // Fetch cert and verify ownership
        const cert = db.prepare(`
           SELECT c.*, centers.name as issuing_center_name, centers.stamp_url as issuing_center_stamp_url
           FROM certifications c
           LEFT JOIN training_centers centers ON c.issuing_center_id = centers.id
           WHERE c.id = ? AND c.user_id = ?
       `).get(certId, userId) as any;

        if (!cert) {
            return res.status(404).json({ error: 'Certification not found' });
        }

        // Fetch full user details for the name
        const userDetails = db.prepare('SELECT first_name, last_name FROM users WHERE id = ?').get(userId) as { first_name: string, last_name: string };

        // Set headers
        const safeName = cert.certification_type.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const filename = `certificate-${safeName}-${Date.now()}.pdf`;

        const tempDir = path.join(process.cwd(), 'uploads/temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        const tempFilePath = path.join(tempDir, filename);

        const { generateCertificatePDF } = await import('./pdf-generator.js');

        // Handle stamp URL
        let stampUrl = null;
        if (cert.issuing_center_stamp_url) {
            stampUrl = cert.issuing_center_stamp_url;
        }

        const pdfBuffer = await generateCertificatePDF(cert, { id: userId, email: req.user!.email, ...userDetails } as any, stampUrl);

        // Write to temp file
        // DEBUG: Verify signature structure before writing
        const bufferStr = pdfBuffer.toString('latin1');
        const hasFtSig = bufferStr.includes('/FT /Sig');
        const hasTypeSig = bufferStr.includes('/Type /Sig');
        console.log(`DEBUG CHECK: Result PDF Size: ${pdfBuffer.length}, Has /FT /Sig: ${hasFtSig}, Has /Type /Sig: ${hasTypeSig}`);

        if (!hasFtSig) {
            console.error('CRITICAL: PDF generated without Signature Field!');
        }

        fs.writeFileSync(tempFilePath, pdfBuffer);

        console.log('Sending file via res.download:', tempFilePath, filename);

        res.download(tempFilePath, filename, (err) => {
            if (err) {
                console.error('Download error:', err);
                if (!res.headersSent) {
                    res.status(500).send('Download failed');
                }
            }
            // Cleanup in both success and error cases (if file exists)
            try {
                if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
            } catch (cleanupErr) {
                console.error('Cleanup error:', cleanupErr);
            }
        });

    } catch (e) {
        console.error('PDF Generation Error:', e);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
});

// Admin: All Certifications
router.get('/admin/certifications', requireRole('admin'), (req, res) => {
    try {
        const certs = db.prepare(`
            SELECT c.*, centers.name as issuing_center_name, u.first_name, u.last_name
            FROM certifications c
            LEFT JOIN training_centers centers ON c.issuing_center_id = centers.id
            LEFT JOIN users u ON c.user_id = u.id
            `).all();
        res.json({ data: certs });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch certifications' });
    }
});






// Admin: Dashboard Stats
router.get('/admin/stats', requireRole('admin'), (req, res) => {
    try {
        const studentCount = db.prepare('SELECT count(*) as count FROM users').get() as { count: number };
        const centerCount = db.prepare('SELECT count(*) as count FROM training_centers').get() as { count: number };
        const certCount = db.prepare('SELECT count(*) as count FROM certifications').get() as { count: number };
        const eventCount = db.prepare('SELECT count(*) as count FROM training_events').get() as { count: number };

        res.json({
            data: {
                trainees: studentCount.count,
                locations: centerCount.count,
                certifications: certCount.count,
                courses: eventCount.count
            }
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// Protected: Admin: Degrees
router.get('/admin/degrees', requireRole('admin'), (req, res) => {
    try {
        const degrees = db.prepare(`
            SELECT d.*, u.first_name, u.last_name
            FROM degrees d
            JOIN users u ON d.trainee_id = u.id
            `).all();
        res.json({ data: degrees });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch degrees' });
    }
});


// STAMP ROUTES

// Upload Stamp (Admin/Master Trainer/Center Director)
router.post('/locations/stamp', requireAnyRole(['admin', 'master_trainer', 'center_director']), upload.single('stamp'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const user = (req as AuthRequest).user!;
    const requestedLocationId = req.body.location_id; // UUID now

    if (!requestedLocationId) {
        return res.status(400).json({ error: 'location_id is required' });
    }

    // TODO: In a real app, verify user belongs to this center if not admin
    // For now, allowing Master Trainers/Directors to upload to any ID they specify (or we'd check their user_role links if we had center_users table)

    const filename = req.file.filename;

    try {
        const stmt = db.prepare(`
            UPDATE training_centers 
            SET stamp_url = ?
            WHERE id = ?
                `);
        const result = stmt.run(filename, requestedLocationId);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Location not found' });
        }

        res.json({ message: 'Stamp uploaded successfully', filename });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Failed to update database' });
    }
});

// Get Stamp
router.get('/locations/:id/stamp', requireAuth, (req, res) => {
    const locationId = req.params.id;

    try {
        const row = db.prepare('SELECT stamp_url FROM training_centers WHERE id = ?').get(locationId) as { stamp_url: string } | undefined;

        if (!row || !row.stamp_url) {
            return res.status(404).json({ error: 'Stamp not found' });
        }

        // Return the URL
        res.json({
            url: `/ uploads / ${row.stamp_url} `,
            filename: row.stamp_url
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Failed to retrieve stamp' });
    }
});

// Create Training Center (Admin/Master Trainer only)
router.post('/admin/centers', requireAnyRole(['admin', 'master_trainer']), (req, res) => {
    const { name, nursery_level, address } = req.body;

    if (!name || !nursery_level) {
        return res.status(400).json({ error: 'Name and nursery_level are required' });
    }

    try {
        const id = crypto.randomUUID();
        // Validation could be improved here
        const addressJson = address ? JSON.stringify(address) : null;

        const stmt = db.prepare(`
            INSERT INTO training_centers (id, name, address_json, nursery_level, is_active)
            VALUES (?, ?, ?, ?, 1)
        `);

        stmt.run(id, name, addressJson, nursery_level);

        // Return the created center
        const newCenter = db.prepare('SELECT * FROM training_centers WHERE id = ?').get(id);
        res.json({ data: parseAddress(newCenter) });
    } catch (error) {
        console.error('Failed to create center:', error);
        res.status(500).json({ error: 'Failed to create training center' });
    }
});

// Update Training Center (Admin/Master Trainer)
router.put('/admin/centers/:id', requireAnyRole(['admin', 'master_trainer']), (req, res) => {
    const { id } = req.params;
    const { name, nursery_level, address, is_active } = req.body;

    // Build query
    const updates: string[] = [];
    const params: any[] = [];

    if (name) { updates.push('name = ?'); params.push(name); }
    if (nursery_level) { updates.push('nursery_level = ?'); params.push(nursery_level); }
    if (address) { updates.push('address_json = ?'); params.push(JSON.stringify(address)); }
    if (typeof is_active !== 'undefined') { updates.push('is_active = ?'); params.push(is_active); }

    if (updates.length === 0) return res.json({ data: null }); // Nothing to do

    params.push(id);

    try {
        const result = db.prepare(`UPDATE training_centers SET ${updates.join(', ')} WHERE id = ?`).run(...params);
        if (result.changes === 0) return res.status(404).json({ error: 'Center not found' });

        const updated = db.prepare('SELECT * FROM training_centers WHERE id = ?').get(id);
        res.json({ data: parseAddress(updated) });
    } catch (e) {
        console.error('Update center failed', e);
        res.status(500).json({ error: 'Failed to update center' });
    }
});

// Delete Training Center (Admin only - Soft Delete)
router.delete('/admin/centers/:id', requireRole('admin'), (req, res) => {
    const { id } = req.params;
    try {
        // Soft delete
        const result = db.prepare('UPDATE training_centers SET is_active = 0 WHERE id = ?').run(id);
        if (result.changes === 0) return res.status(404).json({ error: 'Center not found' });
        res.json({ message: 'Center deleted (soft)' });
    } catch (e) {
        console.error('Delete center failed', e);
        res.status(500).json({ error: 'Failed to delete center' });
    }
});

// Update Profile (Self Service)
router.put('/auth/me', requireAuth, (req, res) => {
    const user = (req as AuthRequest).user!;
    const { first_name, last_name, credentials, address } = req.body;

    try {
        // Build dynamic update query
        const updates: string[] = [];
        const params: any[] = [];

        if (first_name) { updates.push('first_name = ?'); params.push(first_name); }
        if (last_name) { updates.push('last_name = ?'); params.push(last_name); }
        if (credentials) { updates.push('credentials = ?'); params.push(credentials); }
        if (address) { updates.push('address_json = ?'); params.push(JSON.stringify(address)); }

        if (updates.length > 0) {
            params.push(user.sub); // Was user.sub
            db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);
        }

        // Return updated user
        const updatedUserRaw = db.prepare('SELECT * FROM users WHERE id = ?').get(user.sub) as any;
        const { password_hash, ...updatedUser } = updatedUserRaw;

        // Re-fetch roles
        const roles = db.prepare(`SELECT r.name FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = ?`).all(user.sub) as { name: string }[];
        const userFinal = { ...updatedUser, roles: roles.map(r => r.name) };

        res.json({ user: parseAddress(userFinal) });
    } catch (error) {
        console.error('Failed to update profile:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});



export default router;

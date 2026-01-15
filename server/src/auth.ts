import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-123';
const JWT_EXPIRES_IN = '1h';

export interface User {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    roles: string[];
    created_at: string;
}

export function validateUser(email: string, password: string): User | null {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;

    if (!user) return null;

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) return null;

    const roles = db.prepare(`
    SELECT r.name FROM roles r
    JOIN user_roles ur ON ur.role_id = r.id
    WHERE ur.user_id = ?
  `).all(user.id) as { name: string }[];

    return {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        roles: roles.map(r => r.name),
        created_at: user.created_at
    };
}

export function generateToken(user: User): string {
    const payload = {
        sub: user.id,
        email: user.email,
        roles: user.roles
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): any {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (e) {
        return null;
    }
}

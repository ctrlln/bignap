import { Request, Response, NextFunction } from 'express';
import { verifyToken, User } from './auth.js';

export interface AuthRequest extends Request {
    user?: {
        sub: string;
        email: string;
        roles: string[];
    };
}

const IS_DEV = process.env.NODE_ENV !== 'production';

export function authenticate(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];
    let token = authHeader && authHeader.split(' ')[1];

    if (!token && req.query && req.query.token) {
        token = req.query.token as string;
    }

    console.log('Auth Token Analysis:', {
        tokenExists: !!token,
        tokenLength: token ? token.length : 0,
        firstChar: token ? token[0] : 'N/A',
        lastChar: token ? token[token.length - 1] : 'N/A',
        raw: JSON.stringify(token)
    });

    if (token && (token.startsWith('"') || token.startsWith("'"))) {
        console.log('Detected quotes in token, stripping...');
        token = token.slice(1, -1);
    }

    if (!token) {
        return next(); // Don't block here, just don't attach user. requireAuth will block.
    }

    const payload = verifyToken(token);
    if (payload) {
        let roles = payload.roles;

        // DEV OVERRIDE LOGIC
        if (IS_DEV) {
            const overrideRole = req.headers['x-dev-role-override'];
            if (overrideRole && typeof overrideRole === 'string') {
                console.log(`[DEV] Overriding roles for ${payload.email} to ['${overrideRole}']`);
                roles = [overrideRole];
            }
        }

        (req as AuthRequest).user = {
            sub: payload.sub,
            email: payload.email,
            roles: roles
        };
    }

    next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
    if (!(req as AuthRequest).user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
}

export function requireRole(role: string) {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = (req as AuthRequest).user;
        if (!user || !user.roles.includes(role)) {
            return res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
        }
        next();
    };
}

export function requireAnyRole(roles: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = (req as AuthRequest).user;
        if (!user) return res.status(403).json({ error: 'Forbidden' });

        const hasRole = user.roles.some(r => roles.includes(r));
        if (!hasRole) {
            return res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
        }
        next();
    };
}

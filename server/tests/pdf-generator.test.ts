import { generateCertificatePDF, calculateSignature } from '../src/pdf-generator';
import { db } from '../src/db';
import { Response } from 'express';
import { Writable } from 'stream';

// Mock DB
jest.mock('../src/db', () => ({
    db: {
        prepare: jest.fn().mockReturnValue({
            run: jest.fn(),
            get: jest.fn()
        })
    }
}));

describe('PDF Generator', () => {
    it('should calculate signature correctly', () => {
        const data = { id: '123', type: 'Test' };
        const sig1 = calculateSignature(data);
        const sig2 = calculateSignature(data);
        expect(sig1).toBe(sig2);
        expect(sig1).toBeTruthy();
    });

    it('should generate PDF and write to stream', async () => {
        const mockRes = new Writable({
            write(chunk, encoding, callback) {
                callback();
            }
        }) as unknown as Response;

        const certification = {
            id: 'cert-123',
            certification_type: 'NIDCAP',
            issue_date: new Date().toISOString(),
            issuing_center_name: 'Test Center'
        };

        const user = {
            id: 'user-123',
            first_name: 'Test',
            last_name: 'User'
        };

        await generateCertificatePDF(mockRes, certification, user, null);

        // Verify DB update was called
        expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining('UPDATE certifications SET signature_hash'));
    });
});

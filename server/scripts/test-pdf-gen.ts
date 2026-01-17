
import fs from 'fs';
import { generateCertificatePDF } from '../src/pdf-generator.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
    const cert = {
        id: 'test-cert-id',
        certification_type: 'NIDCAP Professional',
        issue_date: new Date().toISOString(),
        issuing_center_name: 'Test Center'
    };
    const user = {
        id: 'test-user-id',
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com'
    };

    const outputPath = path.resolve('test-certificate-signed.pdf');

    // Mock Express Response
    const res: any = {
        send: (buffer: Buffer) => {
            console.log(`Received buffer of size: ${buffer.length}`);
            fs.writeFileSync(outputPath, buffer);
            console.log(`Written to ${outputPath}`);

            // Basic validation
            if (buffer.length < 5000) {
                console.warn("WARNING: Signed PDF size seems small!");
            }
            const content = buffer.toString('binary');
            if (content.includes('ByteRange')) {
                console.log('SUCCESS: "ByteRange" found in PDF, indicating a signature dictionary.');
            } else {
                console.error('FAILURE: No "ByteRange" found. Signature might be missing.');
            }
        },
        status: (code: number) => {
            console.log(`Status set to ${code}`);
            return res;
        },
        json: (data: any) => {
            console.log('JSON response:', data);
        }
    };

    console.log('Generating Signed PDF...');

    try {
        await generateCertificatePDF(res, cert, user, null);
    } catch (e) {
        console.error('Error during generation:', e);
    }
}

run();

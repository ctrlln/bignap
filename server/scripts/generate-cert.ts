
import forge from 'node-forge';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function generateCert() {
    console.log('Generating self-signed certificate...');

    const keys = forge.pki.rsa.generateKeyPair(2048);
    const cert = forge.pki.createCertificate();

    cert.publicKey = keys.publicKey;
    cert.serialNumber = '01';
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

    const attrs = [{
        name: 'commonName',
        value: 'Bignap Training Center'
    }, {
        name: 'countryName',
        value: 'US'
    }, {
        shortName: 'ST',
        value: 'Massachusetts'
    }, {
        name: 'localityName',
        value: 'Boston'
    }, {
        name: 'organizationName',
        value: 'Bignap Inc.'
    }, {
        shortName: 'OU',
        value: 'Training Division'
    }];

    cert.setSubject(attrs);
    cert.setIssuer(attrs);

    cert.setExtensions([{
        name: 'basicConstraints',
        cA: true
    }, {
        name: 'keyUsage',
        keyCertSign: true,
        digitalSignature: true,
        nonRepudiation: true,
        keyEncipherment: true,
        dataEncipherment: true
    }, {
        name: 'extKeyUsage',
        serverAuth: true,
        clientAuth: true,
        codeSigning: true,
        emailProtection: true,
        timeStamping: true
    }, {
        name: 'nsCertType',
        client: true,
        server: true,
        email: true,
        objsign: true,
        sslCA: true,
        emailCA: true,
        objCA: true
    }, {
        name: 'subjectKeyIdentifier'
    }]);

    cert.sign(keys.privateKey);

    const p12Asn1 = forge.pkcs12.toPkcs12Asn1(
        keys.privateKey,
        [cert],
        'password123',
        { algorithm: '3des' }
    );

    const p12Der = forge.asn1.toDer(p12Asn1).getBytes();
    const p12Buffer = Buffer.from(p12Der, 'binary');

    const certPath = path.join(__dirname, '../certs/signing-cert.p12');
    fs.writeFileSync(certPath, p12Buffer);

    console.log(`Certificate generated at: ${certPath}`);
    console.log('Password: password123');
}

generateCert();

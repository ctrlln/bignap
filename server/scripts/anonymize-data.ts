
import Database from 'better-sqlite3';
import { faker } from '@faker-js/faker';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../local.db');

console.log(`opening db at ${dbPath}`);
const db = new Database(dbPath);

const PRESERVED_EMAILS = [
    'verna.schamberger@test.local',
    'luther.jacobs@test.local',
    'gayle.harvey@test.local',
    'Werner69@hotmail.com'
];

function anonymizeData() {
    console.log('Starting data anonymization...');

    const users = db.prepare('SELECT id, email, first_name, last_name, address_json FROM users').all() as any[];
    let updatedCount = 0;

    const updateUser = db.prepare(`
        UPDATE users 
        SET first_name = ?, last_name = ?, email = ?, address_json = ?
        WHERE id = ?
    `);

    for (const user of users) {
        if (PRESERVED_EMAILS.includes(user.email)) {
            console.log(`Skipping preserved user: ${user.email}`);
            continue;
        }

        const newFirstName = faker.person.firstName();
        const newLastName = faker.person.lastName();
        const newEmail = faker.internet.email({ firstName: newFirstName, lastName: newLastName });

        let newAddress = user.address_json;
        try {
            // Check if existing address is valid json to potentially keep structure, 
            // but we want to anonymize location too.
            // Let's generate a completely new random address.
            const city = faker.location.city();
            const country = faker.location.country();
            const addressObj = {
                street: faker.location.streetAddress(),
                city: city,
                state: faker.location.state(),
                zip: faker.location.zipCode(),
                country: country,
                formatted: `${city}, ${country}`,
                lat: faker.location.latitude(),
                lng: faker.location.longitude()
            };
            newAddress = JSON.stringify(addressObj);
        } catch (e) {
            console.warn('Error generating address for user', user.id);
        }

        console.log(`Anonymizing ${user.email} -> ${newEmail}`);

        updateUser.run(newFirstName, newLastName, newEmail, newAddress, user.id);
        updatedCount++;
    }

    console.log(`\nAnonymization complete.`);
    console.log(`Total users processed: ${users.length}`);
    console.log(`Users anonymized: ${updatedCount}`);
    console.log(`Users preserved: ${users.length - updatedCount}`);
}

anonymizeData();


import fs from 'fs';
import path from 'path';
import { faker } from '@faker-js/faker';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NUM_STUDENTS = 100;
const NUM_LOCATIONS = 10;
const NUM_DEGREES = 20;
const NUM_CERTIFICATIONS = 50;
const NUM_COURSES = 30;

// Helpers
const randomId = () => faker.string.uuid();
const pickOne = (arr) => arr[Math.floor(Math.random() * arr.length)];

// 1. Generate Locations
const locations = Array.from({ length: NUM_LOCATIONS }).map((_, i) => ({
    location_id: i + 1,
    location_name: faker.location.city(),
    nurserylevel_id: faker.number.int({ min: 1, max: 5 }),
    location_address1: faker.location.streetAddress(),
    location_city: faker.location.city(),
    location_state: faker.location.state(),
    location_zip: faker.location.zipCode(),
    location_country: faker.location.country(),
    location_phone: faker.phone.number(),
    date_created: faker.date.past().toISOString(),
    date_updated: faker.date.recent().toISOString(),
}));

// 2. Generate Students
const students = Array.from({ length: NUM_STUDENTS }).map((_, i) => ({
    student_id: i + 1,
    first_name: faker.person.firstName(),
    last_name: faker.person.lastName(),
    email: faker.internet.email(),
    work_phone: faker.phone.number(),
    home_phone: faker.phone.number(),
    work_city: faker.location.city(),
    work_country: faker.location.country(),
    date_entered: faker.date.past().toISOString(),
    location_id: pickOne(locations).location_id,
    professionalrole: faker.person.jobTitle(),
}));

// 3. Student Degrees
const degrees = Array.from({ length: NUM_DEGREES }).map((_, i) => ({
    studentdegree_id: i + 1,
    student_id: pickOne(students).student_id,
    degree: pickOne(['BS', 'MS', 'PhD', 'MD', 'Associate']),
    discipline: faker.person.jobArea(),
    date_updated: faker.date.recent().toISOString(),
}));

// 4. Certifications
const certifications = Array.from({ length: NUM_CERTIFICATIONS }).map((_, i) => ({
    studentcertification_id: i + 1,
    student_id: pickOne(students).student_id,
    certification: faker.lorem.words(2).toUpperCase(),
    certification_date: faker.date.past().toISOString(),
    trainer_id: faker.number.int({ min: 1, max: 10 }),
}));

// 5. Training Courses
const courses = Array.from({ length: NUM_COURSES }).map((_, i) => ({
    course_id: i + 1,
    coursename: faker.company.catchPhrase(),
    coursedate: faker.date.future().toISOString(),
    student_id: pickOne(students).student_id,
    center_name: pickOne(locations).location_name,
    date_created: faker.date.past().toISOString(),
}));

// Write to DB file
const db = {
    locations,
    students,
    degrees,
    certifications,
    courses,
    // Add metadata or other tables if needed
};

const outputPath = path.join(__dirname, '../public/data/db.json');
fs.writeFileSync(outputPath, JSON.stringify(db, null, 2));

console.log(`Generated fake data at ${outputPath}`);
console.log(`- ${locations.length} Locations`);
console.log(`- ${students.length} Students`);
console.log(`- ${degrees.length} Degrees`);
console.log(`- ${certifications.length} Certifications`);
console.log(`- ${courses.length} Courses`);

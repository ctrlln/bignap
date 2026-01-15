import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { faker } from '@faker-js/faker';

const db = new Database('local.db', { verbose: console.log });
db.pragma('journal_mode = WAL');

const ROLES = ['admin', 'master_trainer', 'trainer', 'student', 'center_director'];

export function initDB() {
  // 1. Create Tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      password_hash TEXT,
      first_name TEXT,
      last_name TEXT,
      credentials TEXT,
      avatar_url TEXT,
      address_json TEXT,
      is_active BOOLEAN DEFAULT 1,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS user_roles (
      user_id TEXT,
      role_id TEXT,
      PRIMARY KEY (user_id, role_id),
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(role_id) REFERENCES roles(id)
    );

    CREATE TABLE IF NOT EXISTS training_centers (
      id TEXT PRIMARY KEY,
      name TEXT,
      address_json TEXT,
      nursery_level INTEGER,
      stamp_url TEXT,
      is_active BOOLEAN DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS training_events (
      id TEXT PRIMARY KEY,
      center_id TEXT,
      course_type TEXT,
      start_date TEXT,
      end_date TEXT,
      lead_trainer_id TEXT,
      FOREIGN KEY(center_id) REFERENCES training_centers(id),
      FOREIGN KEY(lead_trainer_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS enrollments (
      id TEXT PRIMARY KEY,
      event_id TEXT,
      student_id TEXT,
      status TEXT,
      grade TEXT,
      FOREIGN KEY(event_id) REFERENCES training_events(id),
      FOREIGN KEY(student_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS certifications (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      certification_type TEXT,
      issue_date TEXT,
      issuing_center_id TEXT,
      signer_user_id TEXT,
      pdf_url TEXT,
      signature_hash TEXT,
      revoked_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(issuing_center_id) REFERENCES training_centers(id),
      FOREIGN KEY(signer_user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS degrees (
      id TEXT PRIMARY KEY,
      student_id TEXT,
      degree TEXT,
      discipline TEXT,
      FOREIGN KEY(student_id) REFERENCES users(id)
    );
  `);

  // Migration: Ensure address_json exists (safe to run if column exists, will throw and be caught)
  try {
    db.prepare('ALTER TABLE users ADD COLUMN address_json TEXT').run();
    console.log('Migrated users table: Added address_json column');
  } catch (e: any) {
    // Ignore "duplicate column name" error
  }

  // 2. Seed Data
  const userCount = db.prepare('SELECT count(*) as count FROM users').get() as { count: number };

  if (userCount.count === 0) {
    console.log('Seeding database with realistic data...');

    // -- Roles --
    const roleIds: Record<string, string> = {};
    const insertRole = db.prepare('INSERT INTO roles (id, name, description) VALUES (?, ?, ?)');
    for (const r of ROLES) {
      const id = randomUUID();
      insertRole.run(id, r, `Role for ${r}`);
      roleIds[r] = id;
    }

    // -- Users --
    const passwordHash = bcrypt.hashSync('password123', 10);
    const insertUser = db.prepare(`
      INSERT INTO users (id, email, password_hash, first_name, last_name, credentials, address_json, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertUserRole = db.prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)');

    const createSeededUser = (email: string, fName: string, lName: string, roles: string[], creds: string = 'RN', city: string = 'Boston', country: string = 'USA') => {
      const id = randomUUID();
      const address = {
        city,
        country,
        formatted: `${city}, ${country}` // Simplified for seeding
      };
      insertUser.run(id, email, passwordHash, fName, lName, creds, JSON.stringify(address), 1, new Date().toISOString());
      for (const r of roles) {
        insertUserRole.run(id, roleIds[r]);
      }
      return id;
    };

    // Core Users
    const adminId = createSeededUser('verna.schamberger@test.local', 'Verna', 'Schamberger', ['admin'], 'PhD, NIDCAP Master Trainer', 'Boston', 'USA');
    const masterId = createSeededUser('luther.jacobs@test.local', 'Luther', 'Jacobs', ['master_trainer', 'center_director'], 'MD, PhD', 'Stockholm', 'Sweden');
    const trainerId = createSeededUser('gayle.harvey@test.local', 'Gayle', 'Harvey', ['trainer'], 'RN, MSN', 'Oklahoma City', 'USA');
    const studentId = createSeededUser('Werner69@hotmail.com', 'Marquise', 'Brakus', ['student'], 'RN', 'Berlin', 'Germany'); // From CSV

    // -- Degrees (Seeding for core student) --
    const insertDegree = db.prepare('INSERT INTO degrees (id, student_id, degree, discipline) VALUES (?, ?, ?, ?)');
    insertDegree.run(randomUUID(), studentId, 'BSN', 'Nursing');

    // Random Students
    const studentIds: string[] = [studentId];
    for (let i = 0; i < 40; i++) {
      const city = faker.location.city();
      const country = faker.location.country();
      const uid = createSeededUser(
        faker.internet.email(),
        faker.person.firstName(),
        faker.person.lastName(),
        ['student'],
        faker.helpers.arrayElement(['RN', 'MD', 'PT', 'OT']),
        city,
        country
      );
      studentIds.push(uid);

      // Random degree
      if (Math.random() > 0.3) {
        insertDegree.run(
          randomUUID(),
          uid,
          faker.helpers.arrayElement(['BSN', 'MSN', 'MD', 'PhD', 'DPT']),
          faker.helpers.arrayElement(['Nursing', 'Medicine', 'Physical Therapy', 'Psychology'])
        );
      }
    }

    // -- Training Centers --
    const insertCenter = db.prepare(`
      INSERT INTO training_centers (id, name, address_json, nursery_level, is_active)
      VALUES (?, ?, ?, ?, ?)
    `);

    const centerIds: string[] = [];
    const centers = [
      { name: 'West Coast NIDCAP Center', level: 4, city: 'San Francisco', country: 'USA', street: '550 16th Street', lat: '37.7670', lng: '-122.3916' },
      { name: 'Boston Children’s Hospital', level: 4, city: 'Boston', country: 'USA', street: '300 Longwood Avenue', lat: '42.3371', lng: '-71.1053' },
      { name: 'Karolinska NIDCAP Center', level: 4, city: 'Stockholm', country: 'Sweden', street: 'Astrid Lindgren Children’s Hospital', lat: '59.3516', lng: '18.0366' },
      { name: 'Sooner NIDCAP Training Center', level: 3, city: 'Oklahoma City', country: 'USA', street: '1200 Children’s Avenue', lat: '35.4800', lng: '-97.4981' },
      { name: 'St. Luke’s Boise', level: 3, city: 'Boise', country: 'USA', street: '190 E Bannock St', lat: '43.6163', lng: '-116.1965' },
      { name: 'NIDCAP Center of Modena', level: 3, city: 'Modena', country: 'Italy', street: 'Via del Pozzo 71', lat: '44.6346', lng: '10.9423' },
      { name: 'Barcelona NIDCAP Center', level: 2, city: 'Barcelona', country: 'Spain', street: 'Passeig de la Vall d’Hebron 119', lat: '41.4276', lng: '2.1449' },
    ];

    for (const c of centers) {
      const id = randomUUID();
      const address = {
        street: c.street,
        city: c.city,
        state: faker.location.state(), // Keeping distinct state for now
        zip: faker.location.zipCode(),
        country: c.country,
        formatted: `${c.street}, ${c.city}, ${c.country}`,
        lat: c.lat,
        lng: c.lng
      };
      insertCenter.run(id, c.name, JSON.stringify(address), c.level, 1);
      centerIds.push(id);
    }

    // -- Training Events & Enrollments --
    const insertEvent = db.prepare(`
        INSERT INTO training_events (id, center_id, course_type, start_date, end_date, lead_trainer_id)
        VALUES (?, ?, ?, ?, ?, ?)
    `);
    const insertEnrollment = db.prepare(`
        INSERT INTO enrollments (id, event_id, student_id, status, grade)
        VALUES (?, ?, ?, ?, ?)
    `);

    // Create 10 events
    for (let i = 0; i < 10; i++) {
      const eventId = randomUUID();
      const centerId = faker.helpers.arrayElement(centerIds);
      const startDate = faker.date.past();
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 4); // 4 day course

      insertEvent.run(
        eventId,
        centerId,
        'NIDCAP',
        startDate.toISOString(),
        endDate.toISOString(),
        faker.helpers.arrayElement([masterId, trainerId])
      );

      // Enroll 5-10 students per course
      const specificStudents = faker.helpers.arrayElements(studentIds, faker.number.int({ min: 5, max: 10 }));
      for (const sid of specificStudents) {
        insertEnrollment.run(
          randomUUID(),
          eventId,
          sid,
          faker.helpers.arrayElement(['completed', 'attended', 'registered']),
          faker.helpers.arrayElement(['Pass', 'Fail', 'Incomplete'])
        );
      }
    }

    console.log('Database seeded successfully!');
  }
}

export { db };

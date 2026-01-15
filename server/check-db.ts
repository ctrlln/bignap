import Database from 'better-sqlite3';
const db = new Database('local.db', { verbose: console.log });
const users = db.prepare('SELECT * FROM users').all();
console.log('Users found:', users);
const reed = db.prepare('SELECT * FROM users WHERE email = ?').get('reed.beahan@test.local');
console.log('Reed check:', reed);

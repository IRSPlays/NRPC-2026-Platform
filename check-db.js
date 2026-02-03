import sqlite3 from 'sqlite3';

const dbPath = './database.sqlite';
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
});

db.all('SELECT id, file_path, original_filename FROM submissions WHERE submission_type = ?', ['file'], (err, rows) => {
  if (err) {
    console.error('Query error:', err.message);
    process.exit(1);
  }
  
  console.log('Submissions with files:');
  rows.forEach((row) => {
    console.log(`  ID: ${row.id}`);
    console.log(`  file_path: "${row.file_path}"`);
    console.log(`  original_filename: "${row.original_filename}"`);
    console.log('  ---');
  });
  
  if (rows.length === 0) {
    console.log('No file submissions found.');
  }
  
  db.close();
});

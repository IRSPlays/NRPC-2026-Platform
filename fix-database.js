import sqlite3 from 'sqlite3';
import fs from 'fs';

const dbPath = './database.sqlite';

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
});

console.log('Connected to database. Fixing file paths...\n');

// Fix submissions with uploads\ or uploads/ prefix (Windows or Unix)
db.all("SELECT id, file_path FROM submissions WHERE file_path LIKE 'uploads/%' OR file_path LIKE 'uploads\\%'", (err, rows) => {
  if (err) {
    console.error('Error querying:', err.message);
    process.exit(1);
  }
  
  console.log(`Found ${rows.length} submissions with "uploads/" or "uploads\\" prefix`);
  
  if (rows.length > 0) {
    let fixed = 0;
    let errors = 0;
    
    rows.forEach((row) => {
      const newPath = row.file_path.replace(/^uploads[\/\\]/i, '');
      
      db.run('UPDATE submissions SET file_path = ? WHERE id = ?', [newPath, row.id], (err) => {
        if (err) {
          console.error(`Error updating ${row.id}:`, err.message);
          errors++;
        } else {
          fixed++;
          console.log(`Fixed: ${row.id} - "${row.file_path}" -> "${newPath}"`);
        }
      });
    });
    
    setTimeout(() => {
      console.log(`\nFixed ${fixed} submissions, ${errors} errors`);
      
      db.all("SELECT id, file_path FROM submissions WHERE file_path LIKE 'uploads/%' OR file_path LIKE 'uploads\\%'", (err, remaining) => {
        if (err) {
          console.error('Error verifying:', err.message);
        } else {
          console.log(`Remaining with prefix: ${remaining.length}`);
          
          console.log('\nAll submissions now have:');
          db.all("SELECT id, file_path FROM submissions WHERE file_path IS NOT NULL", (err, all) => {
            all.forEach((s) => {
              console.log(`  ID ${s.id}: "${s.file_path}"`);
            });
            
            console.log('\nDone! Please restart the server and refresh the browser.');
            db.close();
          });
        }
      });
    }, 500);
  } else {
    console.log('No submissions need fixing.');
    db.close();
  }
});

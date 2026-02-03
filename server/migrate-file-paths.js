#!/usr/bin/env node

/**
 * Database Migration Script: Fix file_path column
 * Removes "uploads/" prefix from file_path values in submissions table
 * 
 * This is a one-time fix to normalize file paths.
 * New uploads already store only the filename (req.file.filename).
 */

import { getDb } from './database.js';

async function migrateFilePaths() {
  console.log('Starting file_path migration...\n');
  
  try {
    const db = await getDb();
    
    // Find all records with "uploads/" prefix
    const records = await db.all(
      "SELECT id, file_path FROM submissions WHERE file_path LIKE 'uploads/%'"
    );
    
    console.log(`Found ${records.length} records with 'uploads/' prefix`);
    
    if (records.length === 0) {
      console.log('No migration needed. Database is already clean.\n');
      return;
    }
    
    // Show sample of what will be changed
    console.log('\nSample records to be updated:');
    records.slice(0, 5).forEach(record => {
      const newPath = record.file_path.replace(/^uploads\//, '');
      console.log(`  ID ${record.id}: "${record.file_path}" → "${newPath}"`);
    });
    if (records.length > 5) {
      console.log(`  ... and ${records.length - 5} more`);
    }
    
    // Perform the update
    console.log('\nApplying migration...');
    const result = await db.run(
      "UPDATE submissions SET file_path = REPLACE(file_path, 'uploads/', '') WHERE file_path LIKE 'uploads/%'"
    );
    
    console.log(`\n✅ Migration complete!`);
    console.log(`   Updated ${result.changes} records`);
    console.log(`   All file_path values now store only the filename without 'uploads/' prefix\n`);
    
    // Verify the fix
    const remaining = await db.get(
      "SELECT COUNT(*) as count FROM submissions WHERE file_path LIKE 'uploads/%'"
    );
    
    if (remaining.count === 0) {
      console.log('✅ Verification passed: No records with "uploads/" prefix remain\n');
    } else {
      console.log(`⚠️  Warning: ${remaining.count} records still have "uploads/" prefix\n`);
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateFilePaths();
}

export { migrateFilePaths };

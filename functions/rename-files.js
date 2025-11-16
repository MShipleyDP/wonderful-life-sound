const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp({
  databaseURL: 'https://wonderful-life-sound-default-rtdb.firebaseio.com',
  storageBucket: 'wonderful-life-sound.firebasestorage.app'
});

const db = admin.database();
const bucket = admin.storage().bucket();

// Remove number prefix from filename
function removeNumberPrefix(filename) {
  // Remove patterns like "01_", "02_", etc. from the start
  return filename.replace(/^\d+_/, '');
}

// Main rename function
async function renameAllFiles() {
  try {
    console.log('\n🚀 Starting filename cleanup...\n');

    // Get all sounds data
    const soundsSnapshot = await db.ref('sounds').once('value');
    const soundData = soundsSnapshot.val();

    if (!soundData) {
      console.error('No sound data found in database');
      return;
    }

    let totalFiles = 0;
    let renamedFiles = 0;
    let skippedFiles = 0;

    // Process each category
    for (const [categoryKey, category] of Object.entries(soundData)) {
      console.log(`\n📁 Category: ${category.title}`);

      const filenameTracker = new Map(); // Track filenames to detect duplicates
      const updatedFiles = [];

      for (const file of category.files) {
        totalFiles++;

        const oldFilename = file.filename || file;
        const cleanFilename = removeNumberPrefix(oldFilename);

        console.log(`\n  [${totalFiles}] ${oldFilename}`);

        // Check if this is actually a change
        if (oldFilename === cleanFilename) {
          console.log(`  ⊘ Skipping (no prefix to remove)`);
          skippedFiles++;

          // Generate unique ID for this file
          const uniqueId = db.ref().push().key;
          updatedFiles.push({
            id: uniqueId,
            filename: oldFilename,
            url: file.url,
            path: file.path
          });
          continue;
        }

        // Handle duplicates by adding _2, _3, etc.
        let finalFilename = cleanFilename;
        let counter = filenameTracker.get(cleanFilename) || 0;

        if (counter > 0) {
          const extension = cleanFilename.match(/\.[^.]+$/)?.[0] || '';
          const nameWithoutExt = cleanFilename.replace(/\.[^.]+$/, '');
          finalFilename = `${nameWithoutExt}_${counter + 1}${extension}`;
        }

        filenameTracker.set(cleanFilename, counter + 1);

        try {
          // Rename file in Firebase Storage
          const oldPath = file.path || `sounds/${categoryKey}/${oldFilename}`;
          const newPath = `sounds/${categoryKey}/${finalFilename}`;

          console.log(`  → Renaming: ${oldFilename} → ${finalFilename}`);

          const oldFile = bucket.file(oldPath);
          const newFile = bucket.file(newPath);

          // Copy to new location
          await oldFile.copy(newFile);
          console.log(`  ✓ Copied to new location`);

          // Delete old file
          await oldFile.delete();
          console.log(`  ✓ Deleted old file`);

          // Get new public URL
          const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(newPath)}?alt=media`;

          // Generate unique ID for this file
          const uniqueId = db.ref().push().key;

          updatedFiles.push({
            id: uniqueId,
            filename: finalFilename,
            url: publicUrl,
            path: newPath
          });

          renamedFiles++;
          console.log(`  ✓ Renamed successfully (ID: ${uniqueId})`);

        } catch (error) {
          console.error(`  ✗ Error renaming ${oldFilename}:`, error.message);
          // Keep original file data on error
          const uniqueId = db.ref().push().key;
          updatedFiles.push({
            id: uniqueId,
            ...file
          });
        }
      }

      // Update database with new filenames for this category
      console.log(`\n  💾 Updating database for ${category.title}...`);
      await db.ref(`sounds/${categoryKey}/files`).set(updatedFiles);
      console.log(`  ✓ Database updated`);
    }

    console.log('\n\n✅ Filename Cleanup Complete!');
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Total files:    ${totalFiles}`);
    console.log(`Renamed:        ${renamedFiles}`);
    console.log(`Skipped:        ${skippedFiles}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Rename failed:', error);
    process.exit(1);
  }
}

// Run rename
renameAllFiles();

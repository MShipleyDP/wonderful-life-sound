const admin = require('firebase-admin');
const https = require('https');
const http = require('http');
const { URL } = require('url');

// Initialize Firebase Admin
admin.initializeApp({
  databaseURL: 'https://wonderful-life-sound-default-rtdb.firebaseio.com',
  storageBucket: 'wonderful-life-sound.firebasestorage.app'
});

const db = admin.database();
const bucket = admin.storage().bucket();

// Download file from URL
function downloadFile(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;

    console.log(`  Downloading: ${url}`);

    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Handle redirect
        downloadFile(response.headers.location).then(resolve).catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }

      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

// Upload file to Firebase Storage
async function uploadToStorage(buffer, storagePath) {
  console.log(`  Uploading to: ${storagePath}`);

  const file = bucket.file(storagePath);

  await file.save(buffer, {
    metadata: {
      contentType: 'audio/mpeg',
      cacheControl: 'public, max-age=31536000', // 1 year
    },
    public: true,
  });

  // Get public URL
  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
  console.log(`  ✓ Uploaded: ${publicUrl}`);

  return publicUrl;
}

// Migrate a single file
async function migrateFile(githubUrl, categoryKey, filename) {
  try {
    // Skip if already migrated
    if (!githubUrl.includes('github.io')) {
      console.log(`  ⊘ Skipping (already migrated): ${filename}`);
      return githubUrl;
    }

    // Download from GitHub
    const buffer = await downloadFile(githubUrl);

    // Upload to Firebase Storage
    const storagePath = `sounds/${categoryKey}/${filename}`;
    const firebaseUrl = await uploadToStorage(buffer, storagePath);

    return firebaseUrl;
  } catch (error) {
    console.error(`  ✗ Error migrating ${filename}:`, error.message);
    throw error;
  }
}

// Main migration function
async function migrateAllFiles() {
  try {
    console.log('\n🚀 Starting migration from GitHub to Firebase Storage...\n');

    // Get all sounds data
    const soundsSnapshot = await db.ref('sounds').once('value');
    const soundData = soundsSnapshot.val();

    if (!soundData) {
      console.error('No sound data found in database');
      return;
    }

    let totalFiles = 0;
    let migratedFiles = 0;
    let skippedFiles = 0;
    let errorFiles = 0;

    // Process each category
    for (const [categoryKey, category] of Object.entries(soundData)) {
      console.log(`\n📁 Category: ${category.title}`);
      console.log(`   Files: ${category.files.length}`);

      const updatedFiles = [];

      for (const file of category.files) {
        totalFiles++;

        const filename = file.filename || file;
        const currentUrl = file.url || `${categoryKey}/${filename}`;

        console.log(`\n  [${totalFiles}] ${filename}`);

        try {
          // Build full GitHub URL if it's a relative path
          let fullUrl = currentUrl;
          if (!currentUrl.startsWith('http')) {
            fullUrl = `https://mshipleydp.github.io/wonderful-life-sound/${currentUrl}`;
          }

          // Migrate the file
          const newUrl = await migrateFile(fullUrl, categoryKey, filename);

          if (newUrl === fullUrl && !fullUrl.includes('github.io')) {
            skippedFiles++;
          } else if (newUrl !== fullUrl) {
            migratedFiles++;
          } else {
            skippedFiles++;
          }

          // Store updated file info
          updatedFiles.push({
            filename: filename,
            url: newUrl
          });

        } catch (error) {
          errorFiles++;
          console.error(`  ✗ Failed to migrate: ${filename}`);

          // Keep original URL on error
          updatedFiles.push(file);
        }
      }

      // Update database with new URLs for this category
      console.log(`\n  💾 Updating database for ${category.title}...`);
      await db.ref(`sounds/${categoryKey}/files`).set(updatedFiles);
      console.log(`  ✓ Database updated`);
    }

    console.log('\n\n✅ Migration Complete!');
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Total files:    ${totalFiles}`);
    console.log(`Migrated:       ${migratedFiles}`);
    console.log(`Skipped:        ${skippedFiles}`);
    console.log(`Errors:         ${errorFiles}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateAllFiles();

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const busboy = require('busboy');
const https = require('https');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');

// Initialize Firebase Admin SDK
// In Cloud Functions, this automatically uses the default service account
admin.initializeApp({
  databaseURL: 'https://wonderful-life-sound-default-rtdb.firebaseio.com',
  storageBucket: 'wonderful-life-sound.firebasestorage.app'
});

const db = admin.database();
const bucket = admin.storage().bucket();

// Create Express app for server-side rendering
const app = express();

// Configure Express
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// Enable CORS for all routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Authorized admin emails
const ADMIN_EMAILS = [
  'mike.shipley@clemsonlittletheatre.com'
];

// Authentication middleware for admin routes
async function requireAuth(req, res, next) {
  try {
    // Check for ID token in cookie, query param, or header
    const idToken = req.cookies.authToken || req.query.token || req.headers.authorization?.replace('Bearer ', '') || '';

    console.log('Auth check - Has token:', !!idToken);
    console.log('Auth source:', req.cookies.authToken ? 'cookie' : req.query.token ? 'query' : req.headers.authorization ? 'header' : 'none');

    if (!idToken) {
      console.log('No auth token found, redirecting to login');
      return res.redirect('/admin/login');
    }

    // Verify the ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log('Token verified for:', decodedToken.email);

    // Check if user's email is authorized
    if (!ADMIN_EMAILS.includes(decodedToken.email)) {
      console.log('Unauthorized email:', decodedToken.email);
      return res.status(403).send('Access denied. You are not authorized to access this admin panel.');
    }

    // If token came from query param, set cookie and redirect to clean URL
    if (req.query.token) {
      console.log('Setting cookie from query param');

      // Try setting cookie with minimal restrictions
      res.cookie('authToken', idToken, {
        maxAge: 60 * 60 * 1000,
        httpOnly: false,
        sameSite: 'none',
        path: '/',
        secure: true
      });

      console.log('Cookie set, redirecting to /admin');
      return res.redirect(302, '/admin');
    }

    // Attach user info to request
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    return res.redirect('/admin/login');
  }
}

// Main sound review page (server-side rendered)
app.get('/', async (req, res) => {
  try {
    const [soundsSnapshot, selectionsSnapshot] = await Promise.all([
      db.ref('sounds').once('value'),
      db.ref('selections').once('value')
    ]);

    const soundData = soundsSnapshot.val();
    const selectionsData = selectionsSnapshot.val() || {};

    if (!soundData) {
      return res.status(500).send('Error loading sounds from database');
    }

    // Transform selections to old format for rendering
    const selections = {
      favorites: [],
      ratings: {},
      notes: {},
      deleteFlags: {}
    };

    // Transform favorites from nested structure
    if (selectionsData.favorites) {
      Object.keys(selectionsData.favorites).forEach(category => {
        Object.keys(selectionsData.favorites[category]).forEach(filename => {
          const fav = selectionsData.favorites[category][filename];
          selections.favorites.push({ category: fav.category, file: fav.file });
        });
      });
    }

    // Transform ratings from nested structure
    if (selectionsData.ratings) {
      Object.keys(selectionsData.ratings).forEach(key => {
        const data = selectionsData.ratings[key];
        const ratingKey = `${data.category}/${data.filename}`;
        selections.ratings[ratingKey] = data.rating;
      });
    }

    // Transform notes from nested structure
    if (selectionsData.notes) {
      Object.keys(selectionsData.notes).forEach(category => {
        selections.notes[category] = selectionsData.notes[category].notes;
      });
    }

    // Transform delete flags from nested structure
    if (selectionsData.deleteFlags) {
      Object.keys(selectionsData.deleteFlags).forEach(fileId => {
        selections.deleteFlags[fileId] = selectionsData.deleteFlags[fileId].isFlagged;
      });
    }

    res.render('index', { soundData, selections });
  } catch (error) {
    console.error('Error loading sounds:', error);
    res.status(500).send('Error connecting to database');
  }
});

// Admin login page
app.get('/admin/login', (req, res) => {
  res.render('admin-login');
});

// Verify and store ID token endpoint
app.post('/admin/sessionLogin', async (req, res) => {
  try {
    const idToken = req.body.idToken.toString();

    // Verify the ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log('User logged in:', decodedToken.email);

    // Check if user is authorized
    if (!ADMIN_EMAILS.includes(decodedToken.email)) {
      console.log('Unauthorized access attempt:', decodedToken.email);
      return res.status(403).json({ error: 'Access denied. You are not authorized.' });
    }

    // Set ID token as cookie (expires in 1 hour - Firebase ID tokens are valid for 1 hour)
    // Note: Not using httpOnly so client can set it for proper redirect behavior
    const options = {
      maxAge: 60 * 60 * 1000, // 1 hour
      httpOnly: false,
      sameSite: 'lax',
      path: '/'
    };

    // Only set secure flag if on HTTPS
    if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
      options.secure = true;
    }

    console.log('Setting cookie with options:', options);
    res.cookie('authToken', idToken, options);

    res.json({ status: 'success', email: decodedToken.email });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: 'Authentication failed: ' + error.message });
  }
});

// Logout endpoint
app.post('/admin/logout', (req, res) => {
  res.clearCookie('authToken');
  res.json({ status: 'success' });
});

// Admin panel (server-side rendered) - Client-side auth check
app.get('/admin', async (req, res) => {
  try {
    const [soundsSnapshot, selectionsSnapshot] = await Promise.all([
      db.ref('sounds').once('value'),
      db.ref('selections').once('value')
    ]);

    const soundData = soundsSnapshot.val();
    const selections = selectionsSnapshot.val();

    // Pass empty user object - auth is handled client-side
    res.render('admin', { soundData, selections, user: { email: '' } });
  } catch (error) {
    console.error('Error loading admin data:', error);
    res.status(500).send('Error loading admin panel');
  }
});

// API: Get admin data (sounds + selections) for AJAX updates
app.get('/admin/data', async (req, res) => {
  try {
    const [soundsSnapshot, selectionsSnapshot] = await Promise.all([
      db.ref('sounds').once('value'),
      db.ref('selections').once('value')
    ]);

    res.json({
      soundData: soundsSnapshot.val(),
      selections: selectionsSnapshot.val()
    });
  } catch (error) {
    console.error('Error loading admin data:', error);
    res.status(500).json({ error: 'Error loading admin data' });
  }
});

// API: Get all sounds data (for AJAX requests)
app.get('/api/sounds', async (req, res) => {
  try {
    const snapshot = await db.ref('sounds').once('value');
    res.json(snapshot.val());
  } catch (error) {
    console.error('Error loading sounds:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Get selections data (for AJAX requests)
app.get('/api/selections', async (req, res) => {
  try {
    const snapshot = await db.ref('selections').once('value');
    res.json(snapshot.val());
  } catch (error) {
    console.error('Error loading selections:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Save selections (for AJAX requests)
app.post('/api/selections', async (req, res) => {
  try {
    const progress = req.body;
    await db.ref('selections').set(progress);
    res.json({ success: true, message: 'Progress saved to cloud!' });
  } catch (error) {
    console.error('Save error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Clear selections (for AJAX requests)
app.delete('/api/selections', async (req, res) => {
  try {
    await db.ref('selections').remove();
    res.json({ success: true, message: 'All selections cleared from cloud!' });
  } catch (error) {
    console.error('Clear error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Save individual favorite
app.post('/api/selections/favorite', async (req, res) => {
  try {
    const { category, filename, isFavorite } = req.body;
    // Encode filename to replace periods and other invalid Firebase path characters
    const encodedFilename = filename.replace(/[.#$\[\]]/g, '_');
    const favRef = db.ref(`selections/favorites/${category}/${encodedFilename}`);

    if (isFavorite) {
      await favRef.set({ category, file: filename, timestamp: admin.database.ServerValue.TIMESTAMP });
    } else {
      await favRef.remove();
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Favorite save error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Save individual rating
app.post('/api/selections/rating', async (req, res) => {
  try {
    const { category, filename, rating } = req.body;
    // Encode to replace slashes, periods, and other invalid Firebase path characters
    const ratingKey = `${category}/${filename}`.replace(/[.#$\[\]\/]/g, '_');

    if (rating > 0) {
      await db.ref(`selections/ratings/${ratingKey}`).set({
        category,
        filename,
        rating,
        timestamp: admin.database.ServerValue.TIMESTAMP
      });
    } else {
      await db.ref(`selections/ratings/${ratingKey}`).remove();
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Rating save error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Save individual note
app.post('/api/selections/note', async (req, res) => {
  try {
    const { category, notes } = req.body;

    if (notes && notes.trim()) {
      await db.ref(`selections/notes/${category}`).set({
        notes,
        timestamp: admin.database.ServerValue.TIMESTAMP
      });
    } else {
      await db.ref(`selections/notes/${category}`).remove();
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Note save error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Save individual delete flag
app.post('/api/selections/delete-flag', async (req, res) => {
  try {
    const { category, filename, fileId, isFlagged } = req.body;

    if (isFlagged) {
      await db.ref(`selections/deleteFlags/${fileId}`).set({
        category,
        filename,
        fileId,
        isFlagged,
        timestamp: admin.database.ServerValue.TIMESTAMP
      });
    } else {
      await db.ref(`selections/deleteFlags/${fileId}`).remove();
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete flag save error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Get Firebase config for client-side SDK
app.get('/api/firebase-config', (req, res) => {
  res.json({
    databaseURL: 'https://wonderful-life-sound-default-rtdb.firebaseio.com',
    projectId: 'wonderful-life-sound',
    storageBucket: 'wonderful-life-sound.firebasestorage.app'
  });
});

// API: Upload sound file
app.post('/api/upload', (req, res) => {
  const bb = busboy({ headers: req.headers });
  let categoryKey = '';
  let customFilename = '';
  let fileBuffer = null;
  let fileContentType = '';
  let originalFilename = '';

  bb.on('field', (fieldname, val) => {
    if (fieldname === 'category') categoryKey = val;
    if (fieldname === 'customFilename') customFilename = val;
  });

  bb.on('file', (fieldname, file, info) => {
    const { filename, mimeType } = info;
    originalFilename = filename;
    fileContentType = mimeType;

    const chunks = [];
    file.on('data', (data) => chunks.push(data));
    file.on('end', () => {
      fileBuffer = Buffer.concat(chunks);
    });
  });

  bb.on('finish', async () => {
    try {
      if (!categoryKey || !fileBuffer) {
        return res.status(400).json({ error: 'Missing category or file' });
      }

      const filename = customFilename || originalFilename;
      if (!filename.endsWith('.mp3')) {
        return res.status(400).json({ error: 'Only MP3 files allowed' });
      }

      const storagePath = `sounds/${categoryKey}/${filename}`;
      const file = bucket.file(storagePath);

      await file.save(fileBuffer, {
        contentType: fileContentType,
        metadata: {
          metadata: {
            firebaseStorageDownloadTokens: generateUUID()
          }
        }
      });

      const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;

      // Update database
      const categoryRef = db.ref(`sounds/${categoryKey}`);
      const snapshot = await categoryRef.once('value');
      const category = snapshot.val();

      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }

      const files = category.files || [];
      files.push({
        filename: filename,
        url: publicUrl,
        path: storagePath
      });

      await categoryRef.update({
        files: files,
        fileCount: files.length
      });

      res.json({
        success: true,
        filename: filename,
        url: publicUrl,
        path: storagePath
      });

    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  bb.end(req.rawBody);
});

// API: Batch import from URL
app.post('/api/batch-import', async (req, res) => {
  try {
    const { url, category, filename, description, categoryTitle, freesoundApiKey } = req.body;

    // Validate input
    if (!url || !category || !filename) {
      return res.status(400).json({ error: 'Missing required fields: url, category, filename' });
    }

    if (!filename.endsWith('.mp3')) {
      return res.status(400).json({ error: 'Filename must end with .mp3' });
    }

    // Check if category exists, create if it doesn't
    const categorySnapshot = await db.ref(`sounds/${category}`).once('value');
    let categoryData = categorySnapshot.val();

    if (!categoryData) {
      // Create new category
      const newCategoryTitle = categoryTitle || category.charAt(0).toUpperCase() + category.slice(1) + ' Sounds';
      console.log(`Creating new category: ${category} (${newCategoryTitle})`);

      categoryData = {
        title: newCategoryTitle,
        files: [],
        fileCount: 0
      };

      await db.ref(`sounds/${category}`).set(categoryData);
    }

    let fileBuffer;
    let metadata = {};

    // Check if URL is from Freesound.org
    const freesoundMatch = url.match(/freesound\.org\/people\/[^\/]+\/sounds\/(\d+)/);

    // Check if URL is from Pixabay
    const pixabayMatch = url.match(/pixabay\.com\/sound-effects\/[^\/]+-(\d+)/);

    if (freesoundMatch) {
      // Handle Freesound URL
      const soundId = freesoundMatch[1];
      console.log(`Detected Freesound URL, sound ID: ${soundId}`);

      if (!freesoundApiKey) {
        return res.status(400).json({ error: 'Freesound API key required for Freesound URLs. Add "freesoundApiKey" field to JSON.' });
      }

      // Get sound details
      const soundUrl = `https://freesound.org/apiv2/sounds/${soundId}/?token=${freesoundApiKey}`;
      const soundDetails = await new Promise((resolve, reject) => {
        https.get(soundUrl, (apiResponse) => {
          let data = '';
          apiResponse.on('data', (chunk) => data += chunk);
          apiResponse.on('end', () => {
            if (apiResponse.statusCode === 200) {
              resolve(JSON.parse(data));
            } else {
              reject(new Error(`Failed to get Freesound details: ${apiResponse.statusCode}`));
            }
          });
          apiResponse.on('error', reject);
        }).on('error', reject);
      });

      // Download HQ preview
      const downloadUrl = soundDetails.previews['preview-hq-mp3'];
      console.log(`Downloading from Freesound: ${downloadUrl}`);

      fileBuffer = await new Promise((resolve, reject) => {
        https.get(downloadUrl, (response) => {
          if (response.statusCode !== 200) {
            reject(new Error(`Failed to download: HTTP ${response.statusCode}`));
            return;
          }

          const chunks = [];
          response.on('data', (chunk) => chunks.push(chunk));
          response.on('end', () => resolve(Buffer.concat(chunks)));
          response.on('error', reject);
        }).on('error', reject);
      });

      // Add Freesound metadata
      metadata = {
        freesoundId: soundId,
        freesoundLicense: soundDetails.license,
        freesoundUsername: soundDetails.username
      };

    } else if (pixabayMatch) {
      // Handle Pixabay URL
      const soundId = pixabayMatch[1];
      console.log(`Detected Pixabay URL, sound ID: ${soundId}`);

      // Pixabay doesn't offer a free audio API
      // Users should provide direct MP3 URLs instead
      return res.status(400).json({
        error: 'Pixabay page URLs are not supported. Please use direct MP3 download URLs instead. ' +
               'Visit the Pixabay sound page, click Download, and copy the direct MP3 URL (it should end with .mp3).'
      });

    } else {
      // Handle direct URL download
      console.log(`Downloading MP3 from: ${url}`);

      fileBuffer = await new Promise((resolve, reject) => {
        https.get(url, (response) => {
          if (response.statusCode !== 200) {
            reject(new Error(`Failed to download: HTTP ${response.statusCode}`));
            return;
          }

          const chunks = [];
          response.on('data', (chunk) => chunks.push(chunk));
          response.on('end', () => resolve(Buffer.concat(chunks)));
          response.on('error', reject);
        }).on('error', reject);
      });
    }

    console.log(`Downloaded ${fileBuffer.length} bytes`);

    // Upload to Firebase Storage
    const storagePath = `sounds/${category}/${filename}`;
    const file = bucket.file(storagePath);

    await file.save(fileBuffer, {
      contentType: 'audio/mpeg',
      metadata: {
        metadata: {
          firebaseStorageDownloadTokens: generateUUID(),
          ...metadata
        }
      }
    });

    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;

    // Update database
    const categoryRef = db.ref(`sounds/${category}`);
    const snapshot = await categoryRef.once('value');
    const currentCategory = snapshot.val();

    const files = currentCategory.files || [];
    files.push({
      filename: filename,
      url: publicUrl,
      path: storagePath
    });

    await categoryRef.update({
      files: files,
      fileCount: files.length
    });

    console.log(`Successfully imported: ${filename}`);

    res.json({
      success: true,
      filename: filename,
      url: publicUrl,
      path: storagePath
    });

  } catch (error) {
    console.error('Batch import error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Delete sound file
app.post('/api/delete', async (req, res) => {
  try {
    const { categoryKey, filename } = req.body;

    if (!categoryKey || !filename) {
      return res.status(400).json({ error: 'Missing categoryKey or filename' });
    }

    // Get category data
    const categoryRef = db.ref(`sounds/${categoryKey}`);
    const snapshot = await categoryRef.once('value');
    const category = snapshot.val();

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Find the file
    const fileToDelete = category.files.find(f => {
      const fname = f.filename || f;
      return fname === filename;
    });

    // Delete from Storage if it exists
    if (fileToDelete && fileToDelete.path) {
      try {
        await bucket.file(fileToDelete.path).delete();
      } catch (storageError) {
        console.warn('Could not delete from storage:', storageError);
      }
    }

    // Update database - remove from files array
    const updatedFiles = category.files.filter(f => {
      const fname = f.filename || f;
      return fname !== filename;
    });

    await categoryRef.update({
      files: updatedFiles,
      fileCount: updatedFiles.length
    });

    // Also remove any delete flags for this file
    // The fileId format is: categoryKey_filenameWithoutExtension
    const filenameWithoutExt = filename.replace(/\.[^/.]+$/, '');
    const possibleFileId = `${categoryKey}_${filenameWithoutExt}`;

    try {
      const selectionsRef = db.ref('selections/deleteFlags');
      const flagsSnapshot = await selectionsRef.once('value');
      const flags = flagsSnapshot.val() || {};

      // Remove flag if it exists
      if (flags[possibleFileId]) {
        await selectionsRef.child(possibleFileId).remove();
        console.log(`Removed delete flag for: ${possibleFileId}`);
      }

      // Also check for the old fileId format (with dash) and remove if exists
      const oldFileId = `-${possibleFileId}`;
      if (flags[oldFileId]) {
        await selectionsRef.child(oldFileId).remove();
        console.log(`Removed old format delete flag for: ${oldFileId}`);
      }
    } catch (flagError) {
      console.warn('Could not remove delete flag:', flagError);
      // Don't fail the delete operation if flag removal fails
    }

    console.log(`Successfully deleted: ${filename} from ${categoryKey}`);
    res.json({ success: true, message: 'File deleted successfully' });

  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Clean up orphaned delete flags
app.post('/api/cleanup-flags', async (req, res) => {
  try {
    const selectionsRef = db.ref('selections/deleteFlags');
    const soundsRef = db.ref('sounds');

    // Get all delete flags
    const flagsSnapshot = await selectionsRef.once('value');
    const flags = flagsSnapshot.val() || {};

    console.log('Cleanup: Total delete flags:', Object.keys(flags).length);

    // Get all sound files
    const soundsSnapshot = await soundsRef.once('value');
    const soundData = soundsSnapshot.val() || {};

    // Build a set of all existing file IDs (new format only)
    const existingFileIds = new Set();
    const oldFormatIds = new Set();

    Object.keys(soundData).forEach(categoryKey => {
      const category = soundData[categoryKey];
      if (category.files && Array.isArray(category.files)) {
        category.files.forEach(file => {
          const fileName = file.filename || file;
          const filenameWithoutExt = fileName.replace(/\.[^/.]+$/, '');

          // New format ID
          const newFileId = `${categoryKey}_${filenameWithoutExt}`;
          existingFileIds.add(newFileId);

          // Check if file has old ID property
          if (file.id && file.id !== newFileId) {
            console.log('Found file with old ID:', file.id, 'should be:', newFileId);
            oldFormatIds.add(file.id);
          }
        });
      }
    });

    console.log('Existing file IDs (new format):', existingFileIds.size);
    console.log('Old format IDs found:', oldFormatIds.size);

    // Find orphaned flags (remove ALL flags that don't match new format)
    const orphanedFlags = [];
    Object.keys(flags).forEach(flagId => {
      // New format must be: categoryKey_filename (no dash at start)
      const isNewFormat = flagId.includes('_') && !flagId.startsWith('-');

      if (!isNewFormat) {
        // Old format - remove it
        console.log('Removing old format flag:', flagId);
        orphanedFlags.push(flagId);
      } else if (!existingFileIds.has(flagId)) {
        // New format but file doesn't exist - orphaned
        console.log('Removing orphaned flag:', flagId);
        orphanedFlags.push(flagId);
      } else {
        console.log('Keeping valid flag:', flagId);
      }
    });

    // Remove orphaned flags
    for (const flagId of orphanedFlags) {
      await selectionsRef.child(flagId).remove();
    }

    console.log(`Cleaned up ${orphanedFlags.length} orphaned delete flags`);
    res.json({
      success: true,
      cleaned: orphanedFlags.length,
      orphanedFlags: orphanedFlags
    });

  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Migrate file from GitHub to Firebase Storage
app.post('/api/migrate', async (req, res) => {
  try {
    const { categoryKey, filename, githubUrl } = req.body;

    if (!categoryKey || !filename || !githubUrl) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Download from GitHub
    const fileBuffer = await new Promise((resolve, reject) => {
      https.get(githubUrl, (response) => {
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => resolve(Buffer.concat(chunks)));
        response.on('error', reject);
      }).on('error', reject);
    });

    // Upload to Firebase Storage
    const storagePath = `sounds/${categoryKey}/${filename}`;
    const file = bucket.file(storagePath);

    await file.save(fileBuffer, {
      contentType: 'audio/mpeg',
      metadata: {
        metadata: {
          firebaseStorageDownloadTokens: generateUUID()
        }
      }
    });

    // Get public URL
    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;

    // Update database
    const categoryRef = db.ref(`sounds/${categoryKey}`);
    const snapshot = await categoryRef.once('value');
    const category = snapshot.val();

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const updatedFiles = category.files.map(f => {
      const fname = f.filename || f;
      if (fname === filename) {
        return {
          filename: filename,
          url: publicUrl,
          path: storagePath
        };
      }
      return f;
    });

    await categoryRef.update({
      files: updatedFiles
    });

    res.json({
      success: true,
      filename: filename,
      url: publicUrl,
      path: storagePath
    });

  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Migrate ALL files from GitHub to Firebase Storage
app.post('/api/migrate-all', async (req, res) => {
  try {
    console.log('Starting batch migration from GitHub to Firebase Storage...');

    // Get all sounds data
    const soundsSnapshot = await db.ref('sounds').once('value');
    const soundData = soundsSnapshot.val();

    if (!soundData) {
      return res.status(500).json({ error: 'No sound data found' });
    }

    const results = {
      total: 0,
      migrated: 0,
      skipped: 0,
      errors: []
    };

    // Process each category
    for (const [categoryKey, category] of Object.entries(soundData)) {
      console.log(`Processing category: ${category.title}`);

      const updatedFiles = [];

      for (const file of category.files) {
        results.total++;

        const filename = file.filename || file;
        const currentUrl = file.url || `${categoryKey}/${filename}`;

        try {
          // Skip if already migrated (not a GitHub URL)
          if (!currentUrl.includes('github.io')) {
            console.log(`  ⊘ Skipping (already migrated): ${filename}`);
            results.skipped++;
            updatedFiles.push(file);
            continue;
          }

          // Build full GitHub URL if relative
          let githubUrl = currentUrl;
          if (!currentUrl.startsWith('http')) {
            githubUrl = `https://mshipleydp.github.io/wonderful-life-sound/${currentUrl}`;
          }

          console.log(`  ↓ Downloading: ${filename}`);

          // Download from GitHub
          const fileBuffer = await new Promise((resolve, reject) => {
            https.get(githubUrl, (response) => {
              if (response.statusCode === 301 || response.statusCode === 302) {
                https.get(response.headers.location, (redirectResponse) => {
                  const chunks = [];
                  redirectResponse.on('data', (chunk) => chunks.push(chunk));
                  redirectResponse.on('end', () => resolve(Buffer.concat(chunks)));
                  redirectResponse.on('error', reject);
                }).on('error', reject);
                return;
              }

              const chunks = [];
              response.on('data', (chunk) => chunks.push(chunk));
              response.on('end', () => resolve(Buffer.concat(chunks)));
              response.on('error', reject);
            }).on('error', reject);
          });

          console.log(`  ↑ Uploading: ${filename}`);

          // Upload to Firebase Storage
          const storagePath = `sounds/${categoryKey}/${filename}`;
          const storageFile = bucket.file(storagePath);

          await storageFile.save(fileBuffer, {
            contentType: 'audio/mpeg',
            metadata: {
              metadata: {
                firebaseStorageDownloadTokens: generateUUID()
              }
            }
          });

          // Get public URL
          const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;

          console.log(`  ✓ Migrated: ${filename}`);
          results.migrated++;

          updatedFiles.push({
            filename: filename,
            url: publicUrl,
            path: storagePath
          });

        } catch (error) {
          console.error(`  ✗ Error migrating ${filename}:`, error.message);
          results.errors.push({ filename, error: error.message });
          // Keep original file data on error
          updatedFiles.push(file);
        }
      }

      // Update database for this category
      console.log(`  💾 Updating database for ${category.title}...`);
      await db.ref(`sounds/${categoryKey}/files`).set(updatedFiles);
      console.log(`  ✓ Database updated`);
    }

    console.log('Migration complete!');
    res.json({
      success: true,
      results: results
    });

  } catch (error) {
    console.error('Batch migration error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Rename files to remove number prefixes and add unique IDs
app.post('/api/rename-files', async (req, res) => {
  try {
    console.log('Starting filename cleanup...');

    // Get all sounds data
    const soundsSnapshot = await db.ref('sounds').once('value');
    const soundData = soundsSnapshot.val();

    if (!soundData) {
      return res.status(500).json({ error: 'No sound data found' });
    }

    const results = {
      total: 0,
      renamed: 0,
      skipped: 0,
      errors: []
    };

    // Helper function to remove number prefix
    function removeNumberPrefix(filename) {
      return filename.replace(/^\d+_/, '');
    }

    // Process each category
    for (const [categoryKey, category] of Object.entries(soundData)) {
      console.log(`Processing category: ${category.title}`);

      const filenameTracker = new Map();
      const updatedFiles = [];

      for (const file of category.files) {
        results.total++;

        const oldFilename = file.filename || file;
        const cleanFilename = removeNumberPrefix(oldFilename);

        try {
          // Check if this is actually a change
          if (oldFilename === cleanFilename) {
            console.log(`  ⊘ Skipping (no prefix): ${oldFilename}`);
            results.skipped++;

            // Generate unique ID for this file if it doesn't have one
            const uniqueId = file.id || db.ref().push().key;
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

          console.log(`  → Renaming: ${oldFilename} → ${finalFilename}`);

          // Rename file in Firebase Storage
          const oldPath = file.path || `sounds/${categoryKey}/${oldFilename}`;
          const newPath = `sounds/${categoryKey}/${finalFilename}`;

          const oldFile = bucket.file(oldPath);
          const newFile = bucket.file(newPath);

          // Copy to new location
          await oldFile.copy(newFile);
          console.log(`  ✓ Copied`);

          // Delete old file
          await oldFile.delete();
          console.log(`  ✓ Deleted old`);

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

          results.renamed++;
          console.log(`  ✓ Renamed (ID: ${uniqueId})`);

        } catch (error) {
          console.error(`  ✗ Error renaming ${oldFilename}:`, error.message);
          results.errors.push({ filename: oldFilename, error: error.message });

          // Keep original file data on error
          const uniqueId = file.id || db.ref().push().key;
          updatedFiles.push({
            id: uniqueId,
            ...file
          });
        }
      }

      // Update database with new filenames for this category
      console.log(`  💾 Updating database for ${category.title}...`);
      await db.ref(`sounds/${categoryKey}/files`).set(updatedFiles);
      console.log(`  ✓ Database updated`);
    }

    console.log('Filename cleanup complete!');
    res.json({
      success: true,
      results: results
    });

  } catch (error) {
    console.error('Rename error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Get all instruction templates
app.get('/api/instruction-templates', async (req, res) => {
  try {
    const snapshot = await db.ref('instructionTemplates').once('value');
    res.json(snapshot.val() || {});
  } catch (error) {
    console.error('Error loading instruction templates:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Save instruction template
app.post('/api/instruction-templates', async (req, res) => {
  try {
    const { name, content } = req.body;

    if (!name || !content) {
      return res.status(400).json({ error: 'Missing name or content' });
    }

    // Generate a unique key
    const templateRef = db.ref('instructionTemplates').push();
    await templateRef.set({
      name: name,
      content: content,
      created: admin.database.ServerValue.TIMESTAMP
    });

    res.json({ success: true, key: templateRef.key });
  } catch (error) {
    console.error('Error saving instruction template:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Delete instruction template
app.delete('/api/instruction-templates/:key', async (req, res) => {
  try {
    const { key } = req.params;

    if (!key) {
      return res.status(400).json({ error: 'Missing template key' });
    }

    await db.ref(`instructionTemplates/${key}`).remove();
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting instruction template:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Search Freesound.org
app.get('/api/freesound/search', async (req, res) => {
  try {
    const { query, apiKey, filter } = req.query;

    if (!query || !apiKey) {
      return res.status(400).json({ error: 'Missing query or API key' });
    }

    const url = `https://freesound.org/apiv2/search/text/?query=${encodeURIComponent(query)}&token=${apiKey}&fields=id,name,description,duration,license,username,previews${filter ? '&' + filter : ''}`;

    const response = await new Promise((resolve, reject) => {
      https.get(url, (apiResponse) => {
        let data = '';
        apiResponse.on('data', (chunk) => data += chunk);
        apiResponse.on('end', () => {
          if (apiResponse.statusCode === 200) {
            resolve(JSON.parse(data));
          } else {
            reject(new Error(`Freesound API error: ${apiResponse.statusCode}`));
          }
        });
        apiResponse.on('error', reject);
      }).on('error', reject);
    });

    res.json(response);
  } catch (error) {
    console.error('Freesound search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Download from Freesound.org and import
app.post('/api/freesound/download', async (req, res) => {
  try {
    const { soundId, category, filename, apiKey } = req.body;

    if (!soundId || !category || !filename || !apiKey) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log(`Downloading Freesound sound ${soundId}`);

    // Get sound details to get download URL
    const soundUrl = `https://freesound.org/apiv2/sounds/${soundId}/?token=${apiKey}`;
    const soundDetails = await new Promise((resolve, reject) => {
      https.get(soundUrl, (apiResponse) => {
        let data = '';
        apiResponse.on('data', (chunk) => data += chunk);
        apiResponse.on('end', () => {
          if (apiResponse.statusCode === 200) {
            resolve(JSON.parse(data));
          } else {
            reject(new Error(`Failed to get sound details: ${apiResponse.statusCode}`));
          }
        });
        apiResponse.on('error', reject);
      }).on('error', reject);
    });

    // Download the preview MP3 (HQ version)
    const downloadUrl = soundDetails.previews['preview-hq-mp3'];
    console.log(`Downloading from: ${downloadUrl}`);

    const fileBuffer = await new Promise((resolve, reject) => {
      https.get(downloadUrl, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download: HTTP ${response.statusCode}`));
          return;
        }

        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => resolve(Buffer.concat(chunks)));
        response.on('error', reject);
      }).on('error', reject);
    });

    console.log(`Downloaded ${fileBuffer.length} bytes`);

    // Check if category exists, create if it doesn't
    const categorySnapshot = await db.ref(`sounds/${category}`).once('value');
    let categoryData = categorySnapshot.val();

    if (!categoryData) {
      const newCategoryTitle = category.charAt(0).toUpperCase() + category.slice(1) + ' Sounds';
      console.log(`Creating new category: ${category} (${newCategoryTitle})`);

      categoryData = {
        title: newCategoryTitle,
        files: [],
        fileCount: 0
      };

      await db.ref(`sounds/${category}`).set(categoryData);
    }

    // Upload to Firebase Storage
    const storagePath = `sounds/${category}/${filename}`;
    const file = bucket.file(storagePath);

    await file.save(fileBuffer, {
      contentType: 'audio/mpeg',
      metadata: {
        metadata: {
          firebaseStorageDownloadTokens: generateUUID(),
          freesoundId: soundId.toString(),
          freesoundLicense: soundDetails.license,
          freesoundUsername: soundDetails.username
        }
      }
    });

    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;

    // Update database
    const categoryRef = db.ref(`sounds/${category}`);
    const snapshot = await categoryRef.once('value');
    const currentCategory = snapshot.val();

    const files = currentCategory.files || [];
    files.push({
      filename: filename,
      url: publicUrl,
      path: storagePath
    });

    await categoryRef.update({
      files: files,
      fileCount: files.length
    });

    console.log(`Successfully imported from Freesound: ${filename}`);

    res.json({
      success: true,
      filename: filename,
      url: publicUrl,
      path: storagePath
    });

  } catch (error) {
    console.error('Freesound download error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Search Pixabay (via web scraping)
app.get('/api/pixabay/search', async (req, res) => {
  try {
    const { query, audioType } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Missing query' });
    }

    console.log(`Scraping Pixabay for: ${query}`);

    // Build Pixabay search URL
    const searchType = audioType === 'music' ? 'music' : 'sound-effects';
    const searchUrl = `https://pixabay.com/${searchType}/search/${encodeURIComponent(query)}/`;

    // Fetch the search page
    const html = await new Promise((resolve, reject) => {
      https.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Referer': 'https://pixabay.com/',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'same-origin',
          'Cache-Control': 'max-age=0'
        }
      }, (response) => {
        let data = '';
        response.on('data', (chunk) => data += chunk);
        response.on('end', () => {
          if (response.statusCode === 200) {
            resolve(data);
          } else {
            reject(new Error(`Failed to fetch Pixabay page: ${response.statusCode}`));
          }
        });
        response.on('error', reject);
      }).on('error', reject);
    });

    // Parse the HTML to extract sound information
    const results = [];

    // Pixabay embeds data in script tags - look for the initial data
    const dataMatch = html.match(/var searchResults = ({.*?});/s);
    if (dataMatch) {
      try {
        const searchData = JSON.parse(dataMatch[1]);
        if (searchData.hits && Array.isArray(searchData.hits)) {
          searchData.hits.forEach(hit => {
            results.push({
              id: hit.id,
              pageURL: hit.pageURL || `https://pixabay.com/${searchType}/${hit.id}/`,
              tags: hit.tags || '',
              duration: hit.duration || 0,
              downloads: hit.downloads || 0,
              // Note: We'll need to fetch individual pages to get download URLs
              previewURL: hit.previewURL || null
            });
          });
        }
      } catch (e) {
        console.error('Error parsing Pixabay data:', e);
      }
    }

    // If JSON parsing didn't work, try regex pattern matching as fallback
    if (results.length === 0) {
      const itemRegex = /href="\/sound-effects\/([^"]+)-(\d+)\/"/g;
      let match;
      while ((match = itemRegex.exec(html)) !== null && results.length < 20) {
        const slug = match[1];
        const id = match[2];
        results.push({
          id: id,
          pageURL: `https://pixabay.com/sound-effects/${slug}-${id}/`,
          tags: slug.replace(/-/g, ' '),
          duration: 0,
          downloads: 0,
          previewURL: null
        });
      }
    }

    console.log(`Found ${results.length} Pixabay results`);

    res.json({
      results: results,
      totalHits: results.length,
      query: query
    });
  } catch (error) {
    console.error('Pixabay search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Download from Pixabay and import (via web scraping)
app.post('/api/pixabay/download', async (req, res) => {
  try {
    const { pageURL, category, filename, tags } = req.body;

    if (!pageURL || !category || !filename) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log(`Scraping Pixabay sound page: ${pageURL}`);

    // Fetch the sound detail page
    const html = await new Promise((resolve, reject) => {
      https.get(pageURL, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Referer': 'https://pixabay.com/sound-effects/',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'same-origin',
          'Cache-Control': 'max-age=0'
        }
      }, (response) => {
        let data = '';
        response.on('data', (chunk) => data += chunk);
        response.on('end', () => {
          if (response.statusCode === 200) {
            resolve(data);
          } else {
            reject(new Error(`Failed to fetch Pixabay page: ${response.statusCode}`));
          }
        });
        response.on('error', reject);
      }).on('error', reject);
    });

    // Extract download URL from the page
    // Pixabay typically has download links in the format: https://cdn.pixabay.com/download/audio/...
    let downloadUrl = null;

    // Try to find the download URL in the HTML
    const downloadMatch = html.match(/https:\/\/cdn\.pixabay\.com\/download\/audio\/[^"']+\.mp3/);
    if (downloadMatch) {
      downloadUrl = downloadMatch[0];
    }

    // Alternative: Look for data attributes or download buttons
    if (!downloadUrl) {
      const dataMatch = html.match(/data-download="([^"]+\.mp3)"/);
      if (dataMatch) {
        downloadUrl = dataMatch[1];
      }
    }

    if (!downloadUrl) {
      return res.status(400).json({
        error: 'Could not find download URL on Pixabay page. The page structure may have changed.'
      });
    }

    console.log(`Found download URL: ${downloadUrl}`);

    // Download the audio file
    const fileBuffer = await new Promise((resolve, reject) => {
      https.get(downloadUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      }, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download: HTTP ${response.statusCode}`));
          return;
        }

        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => resolve(Buffer.concat(chunks)));
        response.on('error', reject);
      }).on('error', reject);
    });

    console.log(`Downloaded ${fileBuffer.length} bytes from Pixabay`);

    // Check if category exists, create if it doesn't
    const categorySnapshot = await db.ref(`sounds/${category}`).once('value');
    let categoryData = categorySnapshot.val();

    if (!categoryData) {
      const newCategoryTitle = category.charAt(0).toUpperCase() + category.slice(1) + ' Sounds';
      console.log(`Creating new category: ${category} (${newCategoryTitle})`);

      categoryData = {
        title: newCategoryTitle,
        files: [],
        fileCount: 0
      };

      await db.ref(`sounds/${category}`).set(categoryData);
    }

    // Upload to Firebase Storage
    const storagePath = `sounds/${category}/${filename}`;
    const file = bucket.file(storagePath);

    await file.save(fileBuffer, {
      contentType: 'audio/mpeg',
      metadata: {
        metadata: {
          firebaseStorageDownloadTokens: generateUUID(),
          pixabayURL: pageURL,
          pixabayTags: tags || ''
        }
      }
    });

    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;

    // Update database
    const categoryRef = db.ref(`sounds/${category}`);
    const snapshot = await categoryRef.once('value');
    const currentCategory = snapshot.val();

    const files = currentCategory.files || [];
    files.push({
      filename: filename,
      url: publicUrl,
      path: storagePath
    });

    await categoryRef.update({
      files: files,
      fileCount: files.length
    });

    console.log(`Successfully imported from Pixabay: ${filename}`);

    res.json({
      success: true,
      filename: filename,
      url: publicUrl,
      path: storagePath
    });

  } catch (error) {
    console.error('Pixabay download error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Search Archive.org
app.get('/api/archive/search', async (req, res) => {
  try {
    const { query, collection } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Missing query' });
    }

    console.log(`Searching Archive.org for: ${query}`);

    // Build Archive.org search query
    // Note: Archive.org uses collections for audio, not mediatype
    let searchQuery = query;

    // Default to audio collections if no collection specified
    if (!collection) {
      searchQuery = `${query} AND (collection:opensource_audio OR collection:audio_bookspoetry OR collection:audio)`;
    } else {
      searchQuery = `${query} AND collection:${collection}`;
    }

    const searchUrl = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(searchQuery)}&fl=identifier,title,description,downloads,item_size&rows=20&output=json`;

    const response = await new Promise((resolve, reject) => {
      https.get(searchUrl, (apiResponse) => {
        let data = '';
        apiResponse.on('data', (chunk) => data += chunk);
        apiResponse.on('end', () => {
          if (apiResponse.statusCode === 200) {
            try {
              resolve(JSON.parse(data));
            } catch (parseError) {
              reject(new Error(`Failed to parse Archive.org response: ${parseError.message}`));
            }
          } else {
            reject(new Error(`Archive.org API error: ${apiResponse.statusCode}`));
          }
        });
        apiResponse.on('error', reject);
      }).on('error', reject);
    });

    console.log('Archive.org response:', JSON.stringify(response).substring(0, 200));

    if (!response || !response.response || !response.response.docs) {
      console.error('Unexpected Archive.org response structure:', response);
      return res.status(500).json({
        error: 'Unexpected response from Archive.org API',
        details: 'The API response structure was not as expected'
      });
    }

    const results = response.response.docs.map(doc => ({
      identifier: doc.identifier,
      title: doc.title,
      description: doc.description || 'No description available',
      downloads: doc.downloads || 0,
      size: doc.item_size || 0
    }));

    console.log(`Found ${results.length} Archive.org results`);

    res.json({
      results: results,
      totalHits: response.response.numFound
    });
  } catch (error) {
    console.error('Archive.org search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Get files from Archive.org item
app.get('/api/archive/files/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;

    console.log(`Getting files for Archive.org item: ${identifier}`);

    const metadataUrl = `https://archive.org/metadata/${identifier}`;

    const metadata = await new Promise((resolve, reject) => {
      https.get(metadataUrl, (apiResponse) => {
        let data = '';
        apiResponse.on('data', (chunk) => data += chunk);
        apiResponse.on('end', () => {
          if (apiResponse.statusCode === 200) {
            resolve(JSON.parse(data));
          } else {
            reject(new Error(`Archive.org metadata error: ${apiResponse.statusCode}`));
          }
        });
        apiResponse.on('error', reject);
      }).on('error', reject);
    });

    // Filter for audio files (mp3, ogg, flac, wav)
    const audioFiles = metadata.files.filter(file => {
      const format = (file.format || '').toLowerCase();
      return format.includes('mp3') || format.includes('mpeg') ||
             format.includes('ogg') || format.includes('vorbis') ||
             format.includes('flac') || format.includes('wav');
    }).map(file => ({
      name: file.name,
      format: file.format,
      size: file.size,
      length: file.length || '0:00',
      downloadUrl: `https://archive.org/download/${identifier}/${file.name}`
    }));

    console.log(`Found ${audioFiles.length} audio files`);

    res.json({
      identifier: identifier,
      title: metadata.metadata.title,
      files: audioFiles
    });
  } catch (error) {
    console.error('Archive.org files error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Download from Archive.org and import
app.post('/api/archive/download', async (req, res) => {
  try {
    const { downloadUrl, category, filename } = req.body;

    if (!downloadUrl || !category || !filename) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log(`Downloading from Archive.org: ${downloadUrl}`);

    // Download the audio file (follow redirects)
    const fileBuffer = await new Promise((resolve, reject) => {
      const downloadFile = (url, redirectCount = 0) => {
        if (redirectCount > 5) {
          reject(new Error('Too many redirects'));
          return;
        }

        https.get(url, (response) => {
          // Handle redirects
          if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307 || response.statusCode === 308) {
            const redirectUrl = response.headers.location;
            console.log(`Following redirect to: ${redirectUrl}`);
            downloadFile(redirectUrl, redirectCount + 1);
            return;
          }

          if (response.statusCode !== 200) {
            reject(new Error(`Failed to download: HTTP ${response.statusCode}`));
            return;
          }

          const chunks = [];
          response.on('data', (chunk) => chunks.push(chunk));
          response.on('end', () => resolve(Buffer.concat(chunks)));
          response.on('error', reject);
        }).on('error', reject);
      };

      downloadFile(downloadUrl);
    });

    console.log(`Downloaded ${fileBuffer.length} bytes from Archive.org`);

    // Check if category exists, create if it doesn't
    const categorySnapshot = await db.ref(`sounds/${category}`).once('value');
    let categoryData = categorySnapshot.val();

    if (!categoryData) {
      const newCategoryTitle = category.charAt(0).toUpperCase() + category.slice(1) + ' Sounds';
      console.log(`Creating new category: ${category} (${newCategoryTitle})`);

      categoryData = {
        title: newCategoryTitle,
        files: [],
        fileCount: 0
      };

      await db.ref(`sounds/${category}`).set(categoryData);
    }

    // Upload to Firebase Storage
    const storagePath = `sounds/${category}/${filename}`;
    const file = bucket.file(storagePath);

    await file.save(fileBuffer, {
      contentType: 'audio/mpeg',
      metadata: {
        metadata: {
          firebaseStorageDownloadTokens: generateUUID(),
          archiveURL: downloadUrl,
          source: 'archive.org'
        }
      }
    });

    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;

    // Update database
    const categoryRef = db.ref(`sounds/${category}`);
    const snapshot = await categoryRef.once('value');
    const currentCategory = snapshot.val();

    const files = currentCategory.files || [];
    files.push({
      filename: filename,
      url: publicUrl,
      path: storagePath
    });

    await categoryRef.update({
      files: files,
      fileCount: files.length
    });

    console.log(`Successfully imported from Archive.org: ${filename}`);

    res.json({
      success: true,
      filename: filename,
      url: publicUrl,
      path: storagePath
    });

  } catch (error) {
    console.error('Archive.org download error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to generate UUID for storage tokens
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Export Express app as Cloud Function with extended timeout
// All routes are now handled through the Express app above
exports.app = functions.https.onRequest(
  {
    timeoutSeconds: 540,
    memory: '1GiB'
  },
  app
);

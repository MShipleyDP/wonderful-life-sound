const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({origin: true});
const Busboy = require('busboy');
const https = require('https');

admin.initializeApp();

const db = admin.database();
const bucket = admin.storage().bucket();

// Upload sound file
exports.uploadSound = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }

    const busboy = Busboy({ headers: req.headers });
    let categoryKey = '';
    let customFilename = '';
    let fileBuffer = null;
    let fileContentType = '';
    let originalFilename = '';

    busboy.on('field', (fieldname, val) => {
      if (fieldname === 'category') categoryKey = val;
      if (fieldname === 'customFilename') customFilename = val;
    });

    busboy.on('file', (fieldname, file, info) => {
      const { filename, mimeType } = info;
      originalFilename = filename;
      fileContentType = mimeType;

      const chunks = [];
      file.on('data', (data) => chunks.push(data));
      file.on('end', () => {
        fileBuffer = Buffer.concat(chunks);
      });
    });

    busboy.on('finish', async () => {
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

        const [url] = await file.getSignedUrl({
          action: 'read',
          expires: '03-01-2500'
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

    busboy.end(req.rawBody);
  });
});

// Delete sound file
exports.deleteSound = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }

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

      // Update database
      const updatedFiles = category.files.filter(f => {
        const fname = f.filename || f;
        return fname !== filename;
      });

      await categoryRef.update({
        files: updatedFiles,
        fileCount: updatedFiles.length
      });

      res.json({ success: true, message: 'File deleted successfully' });

    } catch (error) {
      console.error('Delete error:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// Migrate file from GitHub to Firebase Storage
exports.migrateFile = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }

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
});

// List all sounds (for admin panel)
exports.listSounds = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const snapshot = await db.ref('sounds').once('value');
      res.json(snapshot.val());
    } catch (error) {
      console.error('List sounds error:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// Update director selection
exports.updateDirectorSelection = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }

    try {
      const { categoryKey, filename } = req.body;

      if (!categoryKey) {
        return res.status(400).json({ error: 'Missing categoryKey' });
      }

      const updateData = {
        selectedFile: filename || null,
        lastUpdated: admin.database.ServerValue.TIMESTAMP
      };

      await db.ref(`directorSelections/${categoryKey}`).set(updateData);

      res.json({ success: true, ...updateData });

    } catch (error) {
      console.error('Update selection error:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// Helper function to generate UUID for storage tokens
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

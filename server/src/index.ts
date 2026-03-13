// server/src/index.ts (REPLACE ENTIRE FILE)
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js'; // Import Supabase
import multer from 'multer'; // Import Multer
import { randomUUID } from 'crypto'; // For unique file names

const app = express();
const PORT = 5001;
const prisma = new PrismaClient();

// Configure Multer (we use memoryStorage to temporarily store the file buffer)
const upload = multer({ storage: multer.memoryStorage() });

// Initialize Supabase Client with powerful Service Key
const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

app.use(cors());
app.use(express.json());

// --- 1. Route to GET all posts from PostgreSQL ---
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

// --- 2. Route to POST a new post with dynamic Image Upload ---
// Note: Changed from `express.json()` to using `upload.single('image')`
app.post('/api/posts', upload.single('image'), async (req, res) => {
  try {
    const { title } = req.body;
    const file = req.file; // This contains the selected photo from Multer!

    // Safety fallback image
    let publicImageUrl = "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e"; 

    // If the user selected a photo, upload it to Supabase Storage
    if (file) {
      // 1. Generate a completely unique file name to avoid overwrite issues
      const fileExtension = file.originalname.split('.').pop();
      const uniqueFileName = `${randomUUID()}.${fileExtension}`;
      
      // 2. Upload the raw file buffer to the 'post_images' bucket
      const { data, error: uploadError } = await supabase.storage
        .from('post_images')
        .upload(uniqueFileName, file.buffer, {
          contentType: file.mimetype,
          cacheControl: '3600',
        });

      if (uploadError) {
        throw uploadError;
      }

      // 3. Construct the public web URL to this new file
      // URL format: project_url/storage/v1/object/public/bucket_name/file_name
      publicImageUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/post_images/${data.path}`;
    }

    // --- 3. Save the actual image link in the database via Prisma ---
    const newPost = await prisma.post.create({
      data: {
        authorName: "Anna & Archie",
        authorAvatar: "https://github.com/shadcn.png",
        imageUrl: publicImageUrl, // Using the new dynamic public URL or the fallback
        title: title || "", // Accept empty text posts
        likes: 0,
        type: "friend",
      },
    });

    res.status(201).json(newPost);
  } catch (error) {
    console.error("Backend post creation error:", error);
    res.status(500).json({ error: "Failed to create post. Please ensure bucket exists." });
  }
});

app.listen(PORT, () => {
  console.log(`Server is successfully running on http://localhost:${PORT}`);
});
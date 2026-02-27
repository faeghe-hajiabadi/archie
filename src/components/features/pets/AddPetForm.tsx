import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label"; // Fixed the path to use the alias

export default function AddPetForm({
  userId,
  userEmail,
  accessToken,
  onComplete,
}: {
  userId: string;
  userEmail: string;
  accessToken: string;
  onComplete: () => void | Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('Dog');
  const [breed, setBreed] = useState('');
  const [weight, setWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>('kg');
  
  // Image states
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const UPLOAD_TIMEOUT_MS = 30_000; // 30s for photo upload via REST
  const API_TIMEOUT_MS = 30_000;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file (e.g. JPEG, PNG).');
        return;
      }
      setImageFile(file);
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setPhotoUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPhotoUploadError(null);

    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!url?.trim() || !key?.trim()) {
      setError('Missing Supabase config. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local');
      setLoading(false);
      return;
    }
    if (!accessToken?.trim()) {
      setError('Not signed in. Please log out and log back in.');
      setLoading(false);
      return;
    }

    try {
      let imageUrl: string | null = null;

      // 1. Handle Image Upload if a file exists — use fetch + token so upload doesn't hang
      if (imageFile) {
        const ext = imageFile.name.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `${crypto.randomUUID()}.${ext}`;
        const filePath = `${userId}/${fileName}`;

        const uploadController = new AbortController();
        const uploadTimeoutId = setTimeout(() => uploadController.abort(), UPLOAD_TIMEOUT_MS);
        let uploadRes: Response | null = null;
        try {
          uploadRes = await fetch(`${url}/storage/v1/object/pet-images/${filePath}`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              apikey: key,
              'Content-Type': imageFile.type || 'image/jpeg',
            },
            body: imageFile,
            signal: uploadController.signal,
          });
        } catch (uploadErr) {
          const isAbort = uploadErr instanceof Error && uploadErr.name === 'AbortError';
          console.warn('Photo upload failed or timed out:', uploadErr);
          setPhotoUploadError(
            isAbort
              ? 'Photo upload timed out. Saving pet without photo.'
              : `Photo could not be uploaded: ${uploadErr instanceof Error ? uploadErr.message : 'Network error'}`
          );
          imageUrl = null;
        } finally {
          clearTimeout(uploadTimeoutId);
        }

        if (uploadRes?.ok) {
          // Store full public URL (same format as test1; requires bucket to be Public)
          imageUrl = `${url.replace(/\/$/, '')}/storage/v1/object/public/pet-images/${filePath}`;
        } else if (uploadRes) {
          const errBody = await uploadRes.json().catch(() => ({}));
          const msg = (errBody as { message?: string }).message || `Upload failed (${uploadRes.status})`;
          console.warn('Photo upload failed:', msg);
          setPhotoUploadError(`Photo could not be uploaded: ${msg}`);
          imageUrl = null;
        }
      }

      // 2. Ensure Profile exists (Satisfies Foreign Key) — use fetch + token so we don't hang
      const profileController = new AbortController();
      const profileTimeout = setTimeout(() => profileController.abort(), API_TIMEOUT_MS);
      let profileRes: Response;
      try {
        profileRes = await fetch(`${url}/rest/v1/profiles`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: key,
            Authorization: `Bearer ${accessToken}`,
            Prefer: 'resolution=merge-duplicates',
          },
          body: JSON.stringify({ id: userId, full_name: userEmail || 'User' }),
          signal: profileController.signal,
        });
      } finally {
        clearTimeout(profileTimeout);
      }
      if (!profileRes.ok) {
        const errBody = await profileRes.json().catch(() => ({}));
        throw new Error((errBody as { message?: string }).message || `Profile failed (${profileRes.status})`);
      }

      // 3. Insert Pet Record — use fetch + token so we don't hang
      const petController = new AbortController();
      const petTimeout = setTimeout(() => petController.abort(), API_TIMEOUT_MS);
      const petBody = {
        owner_id: userId,
        name,
        species,
        breed,
        weight: weight ? parseFloat(weight) : null,
        weight_unit: weightUnit,
        ...(imageUrl ? { image_url: imageUrl } : {}),
      };
      let petRes: Response;
      try {
        petRes = await fetch(`${url}/rest/v1/pets`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: key,
            Authorization: `Bearer ${accessToken}`,
            Prefer: 'return=representation',
          },
          body: JSON.stringify(petBody),
          signal: petController.signal,
        });
      } finally {
        clearTimeout(petTimeout);
      }
      if (!petRes.ok) {
        const errBody = await petRes.json().catch(() => ({}));
        const msg = (errBody as { message?: string }).message || `Save failed (${petRes.status})`;
        throw new Error(msg);
      }

      // 4. Success!
      await onComplete();
      
    } catch (err) {
      console.error('Submission error:', err);
      const isAbort = err instanceof Error && err.name === 'AbortError';
      const message = isAbort
        ? 'Request timed out. Check your connection and that VITE_SUPABASE_URL in .env.local matches your project.'
        : err instanceof Error
          ? err.message
          : 'Failed to add pet. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Register Your Pet</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name">Pet Name</Label>
            <Input 
              id="name" 
              placeholder="e.g. Archie" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
            />
          </div>

          {/* Image Upload Field */}
          <div className="space-y-2">
            <Label htmlFor="picture">Pet Photo</Label>
            <Input
              ref={fileInputRef}
              id="picture"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="cursor-pointer"
            />
            {imagePreview && (
              <div className="relative inline-block mt-2">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-24 w-24 rounded-lg object-cover border"
                />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center shadow-lg"
                >
                  ✕
                </button>
              </div>
            )}
            {photoUploadError && (
              <p className="text-sm text-amber-700 mt-1" role="alert">
                {photoUploadError}
              </p>
            )}
          </div>

          {/* Species & Breed */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="species">Species</Label>
              <Input id="species" value={species} onChange={(e) => setSpecies(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="breed">Breed</Label>
              <Input id="breed" placeholder="Golden Retriever" value={breed} onChange={(e) => setBreed(e.target.value)} />
            </div>
          </div>

          {/* Weight */}
          <div className="space-y-2">
            <Label htmlFor="weight">Weight</Label>
            <div className="flex gap-2">
              <Input
                id="weight"
                type="number"
                step="0.1"
                placeholder="0.0"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
              <select
                value={weightUnit}
                onChange={(e) => setWeightUnit(e.target.value as 'kg' | 'lb')}
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="kg">kg</option>
                <option value="lb">lb</option>
              </select>
            </div>
          </div>

          {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

          <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
            {loading ? "Saving..." : "Add Pet"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
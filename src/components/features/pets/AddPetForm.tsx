import { useState, useRef, useEffect } from 'react';
import heic2any from "heic2any";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

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
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form Fields
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('Dog');
  const [breed, setBreed] = useState('');
  const [weight, setWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>('kg');
  
  // Image states
  const [imageFile, setImageFile] = useState<File | Blob | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const UPLOAD_TIMEOUT_MS = 30_000;

  // Cleanup object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const isHeic = (file: File) =>
    file.type === 'image/heic' || file.type === 'image/heif' || /\.(heic|heif)$/i.test(file.name);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Check if it's HEIC
    if (isHeic(file)) {
      try {
        setIsConverting(true);
        // Convert to JPEG for browser compatibility
        const converted = await heic2any({
          blob: file,
          toType: "image/jpeg",
          quality: 0.8
        });
        
        const finalBlob = Array.isArray(converted) ? converted[0] : converted;
        setImageFile(finalBlob);
        setImagePreview(URL.createObjectURL(finalBlob));
      } catch (err) {
        console.error("HEIC Conversion error:", err);
        setError("Could not process HEIC file. Please try a JPEG or PNG.");
      } finally {
        setIsConverting(false);
      }
    } else if (file.type.startsWith('image/')) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    } else {
      setError('Please select an image file (JPEG, PNG, or HEIC).');
    }
  };

  const clearImage = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

    try {
      let imageUrl: string | null = null;

      // 1. Upload Image (Using converted JPEG if it was HEIC)
      if (imageFile) {
        const fileName = `${crypto.randomUUID()}.jpg`;
        const filePath = `${userId}/${fileName}`;

        const uploadRes = await fetch(`${url}/storage/v1/object/pet-images/${filePath}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            apikey: key,
            'Content-Type': 'image/jpeg',
          },
          body: imageFile,
        });

        if (uploadRes.ok) {
          imageUrl = `${url.replace(/\/$/, '')}/storage/v1/object/public/pet-images/${filePath}`;
        }
      }

      // 2. Ensure Profile exists
      await fetch(`${url}/rest/v1/profiles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: key,
          Authorization: `Bearer ${accessToken}`,
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify({ id: userId, full_name: userEmail || 'User' }),
      });

      // 3. Insert Pet Record
      const petRes = await fetch(`${url}/rest/v1/pets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: key,
          Authorization: `Bearer ${accessToken}`,
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          owner_id: userId,
          name,
          species,
          breed,
          weight: weight ? parseFloat(weight) : null,
          weight_unit: weightUnit,
          image_url: imageUrl,
        }),
      });

      if (!petRes.ok) throw new Error("Failed to save pet details.");

      await onComplete();
      
    } catch (err: any) {
      console.error('Submission error:', err);
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Register Your Pet</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Pet Name */}
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

          {/* Photo Upload */}
          <div className="space-y-2">
            <Label htmlFor="picture">
              Pet Photo 
              {isConverting && <span className="ml-2 text-xs text-green-600 animate-pulse">Converting HEIC...</span>}
            </Label>
            <Input
              ref={fileInputRef}
              id="picture"
              type="file"
              accept="image/*,.heic,.heif"
              onChange={handleImageChange}
              disabled={isConverting}
              className="cursor-pointer file:font-medium file:text-green-700"
            />
            {imagePreview && (
              <div className="relative inline-block mt-2">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-28 w-28 rounded-xl object-cover border-2 border-slate-100 shadow-sm"
                />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center hover:bg-red-600 shadow-md transition-colors"
                >
                  ✕
                </button>
              </div>
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
              <Input 
                id="breed" 
                placeholder="Golden Retriever" 
                value={breed} 
                onChange={(e) => setBreed(e.target.value)} 
              />
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
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none"
              >
                <option value="kg">kg</option>
                <option value="lb">lb</option>
              </select>
            </div>
          </div>

          {error && <p className="text-sm text-red-600 font-medium bg-red-50 p-2 rounded border border-red-100">{error}</p>}

          <Button 
            type="submit" 
            className="w-full bg-green-600 hover:bg-green-700 h-11 text-lg font-medium shadow-md transition-all active:scale-[0.98]" 
            disabled={loading || isConverting}
          >
            {loading ? "Saving Archie..." : isConverting ? "Processing Image..." : "Add Pet"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
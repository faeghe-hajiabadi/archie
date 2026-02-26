import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "../../ui/label";

export default function AddPetForm({ userId, accessToken, onComplete }: { userId: string; accessToken: string; onComplete: () => void | Promise<void> }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('Dog');
  const [breed, setBreed] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!url?.trim() || !key?.trim()) {
      setError('Missing Supabase config. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local and restart the dev server.');
      return;
    }
    if (!userId || !accessToken) {
      setError('You must be signed in to add a pet.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${url}/rest/v1/pets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: key,
          Authorization: `Bearer ${accessToken}`,
          Prefer: 'return=representation',
        },
        body: JSON.stringify([
          {
            owner_id: userId,
            name,
            species,
            breed,
            weight_unit: 'kg',
          },
        ]),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const message =
          (errorBody && (errorBody.message || errorBody.error)) ||
          `Request failed with status ${response.status}`;
        console.error('Supabase REST error:', message, errorBody);
        setError(message);
        return;
      }

      await onComplete();
    } catch (err) {
      console.error('Unexpected error while adding pet:', err);
      const message = err instanceof Error ? err.message : 'Something went wrong. Try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto mt-10">
      <CardHeader>
        <CardTitle>Register Your Pet</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
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
          <div className="space-y-2">
            <Label htmlFor="species">Species</Label>
            <Input 
              id="species" 
              value={species} 
              onChange={(e) => setSpecies(e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="breed">Breed</Label>
            <Input 
              id="breed" 
              placeholder="e.g. Golden Retriever" 
              value={breed} 
              onChange={(e) => setBreed(e.target.value)} 
            />
          </div>
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
            {loading ? "Saving..." : "Add Pet"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
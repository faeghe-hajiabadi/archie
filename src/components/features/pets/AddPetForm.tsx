import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "../../ui/label";

function isSessionExpired(status: number, message: string): boolean {
  return status === 401 || /JWT expired|expired|invalid.*token/i.test(message);
}

export default function AddPetForm({ userId, userEmail, accessToken, onComplete }: { userId: string; userEmail: string; accessToken: string; onComplete: () => void | Promise<void> }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('Dog');
  const [breed, setBreed] = useState('');
  const [weight, setWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>('kg');

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
      // Ensure profile row exists so pets.owner_id FK is satisfied (RLS must allow this)
      const profileRes = await fetch(`${url}/rest/v1/profiles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: key,
          Authorization: `Bearer ${accessToken}`,
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify({ id: userId, full_name: userEmail || 'User' }),
      });
      if (!profileRes.ok) {
        const errBody = await profileRes.json().catch(() => null);
        const msg = (errBody?.message ?? errBody?.error) || `Profile setup failed (${profileRes.status})`;
        if (isSessionExpired(profileRes.status, msg)) {
          await supabase.auth.refreshSession();
          setError("Your session expired. We've refreshed it — please try Add Pet again.");
        } else {
          setError(msg);
        }
        return;
      }

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
            ...(weight.trim() !== '' && !Number.isNaN(Number(weight)) ? { weight: Number(weight) } : {}),
            weight_unit: weightUnit,
          },
        ]),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const message =
          (errorBody && (errorBody.message || errorBody.error)) ||
          `Request failed with status ${response.status}`;
        if (isSessionExpired(response.status, message)) {
          await supabase.auth.refreshSession();
          setError("Your session expired. We've refreshed it — please try Add Pet again.");
        } else if (message.includes('pets_owner_id_fkey')) {
          setError(
            "Your profile couldn't be created. In Supabase SQL Editor run the policy in supabase/profiles-rls.sql, then sign out and sign back in."
          );
        } else {
          setError(message);
        }
        console.error('Supabase REST error:', message, errorBody);
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
          <div className="space-y-2">
            <Label htmlFor="weight">Weight</Label>
            <div className="flex gap-2">
              <Input
                id="weight"
                type="number"
                min="0"
                step="0.1"
                placeholder="e.g. 12.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
              <select
                value={weightUnit}
                onChange={(e) => setWeightUnit(e.target.value as 'kg' | 'lb')}
                className="flex h-9 w-16 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="kg">kg</option>
                <option value="lb">lb</option>
              </select>
            </div>
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
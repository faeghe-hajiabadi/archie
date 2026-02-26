import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function AddPetForm({ userId, onComplete }: { userId: string, onComplete: () => void }) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('Dog');
  const [breed, setBreed] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from('pets')
      .insert([
        { 
          owner_id: userId, 
          name, 
          species, 
          breed,
          weight_unit: 'kg' // Defaulting for Vancouver/Canada standards
        }
      ]);

    if (error) {
      alert(error.message);
    } else {
      onComplete(); // Refresh the dashboard or navigate home
    }
    setLoading(false);
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
          <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
            {loading ? "Saving..." : "Add Pet"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
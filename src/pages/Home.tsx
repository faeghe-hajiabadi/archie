import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Link } from 'react-router-dom';
import { Trash2, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import AddPetForm from '@/components/features/pets/AddPetForm';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Button } from '@/components/ui/button';

export default function Home({ session }: { session: Session }) {
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddPet, setShowAddPet] = useState(false);
  const [petToDelete, setPetToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const userId = session?.user?.id;

  const fetchPets = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const token = session?.access_token;
    if (!url?.trim() || !key?.trim() || !token?.trim()) {
      setLoading(false);
      return;
    }
    const restUrl = `${url.replace(/\/$/, '')}/rest/v1/pets?owner_id=eq.${encodeURIComponent(userId)}&select=*`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    try {
      const res = await fetch(restUrl, {
        method: 'GET',
        headers: {
          apikey: key,
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error((errBody as { message?: string }).message || `Pets request failed: ${res.status}`);
      }
      const data = await res.json();
      const list = Array.isArray(data) ? data : data ? [data] : [];
      setPets(list);
    } catch (err) {
      const isAbort = err instanceof Error && err.name === 'AbortError';
      if (isAbort) console.warn('[Home] fetchPets timed out');
      else console.error('[Home] fetchPets error:', err);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }, [userId, session?.access_token]);

  const handleDeletePet = async () => {
    if (!petToDelete) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from('pets').delete().eq('id', petToDelete.id);
      if (error) throw error;
      setPets((prev) => prev.filter((p) => p.id !== petToDelete.id));
      setPetToDelete(null);
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  if (loading && userId) return <HomeSkeleton />;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Your Pets</h1>
          <p className="text-slate-500">Manage Archie and your other furry friends.</p>
        </div>
        <Button 
          onClick={() => setShowAddPet(!showAddPet)}
          className="bg-green-600 hover:bg-green-700 transition-colors"
        >
          {showAddPet ? 'Cancel' : <><Plus className="w-4 h-4 mr-2" /> Add Pet</>}
        </Button>
      </header>

      {showAddPet && (
        <div className="bg-slate-50 p-6 rounded-xl border-2 border-dashed border-slate-200">
          <AddPetForm 
            userId={userId} 
            userEmail={session.user.email!} 
            accessToken={session.access_token ?? ''}
            onComplete={() => {
              setShowAddPet(false);
              fetchPets();
            }} 
          />
        </div>
      )}

      {pets.length === 0 && !showAddPet ? (
        <Card className="border-dashed border-2 py-20 flex flex-col items-center justify-center text-center">
          <p className="text-slate-400 mb-4">No pets registered yet.</p>
          <Button variant="outline" onClick={() => setShowAddPet(true)}>Register your first pet</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {pets.map((pet) => (
            <PetCard 
              key={pet.id} 
              pet={pet} 
              onDelete={() => setPetToDelete({ id: pet.id, name: pet.name })} 
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!petToDelete}
        onClose={() => !deleting && setPetToDelete(null)}
        onConfirm={handleDeletePet}
        title="Delete Pet"
        confirmLabel="Delete"
        variant="destructive"
        loading={deleting}
      >
        Are you sure you want to remove <strong>{petToDelete?.name}</strong>? This action is permanent.
      </ConfirmDialog>
    </div>
  );
}

function PetCard({ pet, onDelete }: { pet: any; onDelete: () => void }) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    async function getSecureUrl() {
      if (!pet.image_url) return;
      
      // Extract the path if it's stored as a full URL
      const path = pet.image_url.includes('pet-images/') 
        ? pet.image_url.split('pet-images/').pop() 
        : pet.image_url;

      const { data, error } = await supabase.storage
        .from('pet-images')
        .createSignedUrl(path, 3600);

      if (!error && data) setSignedUrl(data.signedUrl);
    }
    getSecureUrl();
  }, [pet.image_url]);

  return (
    <Card className="group relative overflow-hidden hover:shadow-lg transition-all border-slate-200">
      <Link to={`/health?petId=${pet.id}`}>
        <div className="aspect-[16/10] bg-slate-100 overflow-hidden">
          {signedUrl && !imgError ? (
            <img 
              src={signedUrl} 
              alt={pet.name} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-green-50 text-green-600 font-bold text-4xl">
              {pet.name[0]}
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <CardTitle className="text-xl mb-1">{pet.name}</CardTitle>
          <div className="flex justify-between items-center text-sm text-slate-500">
            <span>{pet.breed || pet.species}</span>
            <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-medium">
              {pet.weight ? `${pet.weight} ${pet.weight_unit}` : 'No weight info'}
            </span>
          </div>
        </CardContent>
      </Link>
      <button
        onClick={(e) => { e.preventDefault(); onDelete(); }}
        className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur rounded-full text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </Card>
  );
}

function HomeSkeleton() {
  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => <Skeleton key={i} className="h-64 w-full rounded-xl" />)}
    </div>
  );
}
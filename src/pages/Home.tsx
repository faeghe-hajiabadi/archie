import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import AddPetForm from '@/components/features/pets/AddPetForm';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

const FETCH_TIMEOUT_MS = 10_000;

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export default function Home({ session }: { session: Session }) {
  const [pets, setPets] = useState<{ id: string; name: string; breed?: string; species?: string; weight?: number; weight_unit?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showAddPet, setShowAddPet] = useState(false);
  const [petToDelete, setPetToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const userId = session?.user?.id;

  const fetchPets = useCallback(async (silent = false) => {
    if (!userId || !supabaseUrl || !supabaseAnonKey) {
      if (!silent) setLoading(false);
      return;
    }
    if (!silent) {
      setLoading(true);
      setFetchError(null);
    }
    try {
      const url = `${supabaseUrl}/rest/v1/pets?owner_id=eq.${encodeURIComponent(userId)}&select=*`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: supabaseAnonKey,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const errBody = await res.text();
        if (!silent) setFetchError(res.status === 401 ? 'Session expired. Please log in again.' : errBody || res.statusText);
        return;
      }
      const data = await res.json();
      setPets(Array.isArray(data) ? data : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load pets';
      if (!silent) {
        if ((err as Error).name === 'AbortError') {
          setFetchError('Request timed out');
        } else {
          setFetchError(message);
        }
      }
      console.error('[Home] fetchPets error:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [userId, session.access_token]);

  const handleAddPetComplete = useCallback(() => {
    fetchPets();
    setShowAddPet(false);
  }, [fetchPets]);

  const handleDeletePet = useCallback(async () => {
    if (!petToDelete || !supabaseUrl || !supabaseAnonKey) return;
    const idToDelete = petToDelete.id;
    setDeleting(true);
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/pets?id=eq.${encodeURIComponent(idToDelete)}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: supabaseAnonKey,
        },
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('Failed to delete pet');
      setPetToDelete(null);
      setPets((prev) => prev.filter((p) => p.id !== idToDelete));
      await fetchPets(true);
    } catch (err) {
      console.error('[Home] delete pet error:', err);
    } finally {
      setDeleting(false);
    }
  }, [petToDelete, session.access_token, fetchPets]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    fetchPets();
  }, [userId, fetchPets]);

  // Don't show skeleton if we don't have a user (shouldn't happen when logged in)
  if (!userId) {
    return (
      <div className="py-10 text-muted-foreground">
        Unable to load your profile. Please refresh or log out and back in.
      </div>
    );
  }

  if (loading) return <HomeSkeleton />;

  // Error state (timeout or Supabase error)
  if (fetchError) {
    return (
      <div className="py-10 space-y-4">
        <p className="text-destructive">{fetchError}</p>
        <button
          type="button"
          onClick={() => fetchPets()}
          className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700"
        >
          Try again
        </button>
      </div>
    );
  }

  // Case 1: No pets yet
  if (pets.length === 0) {
    return (
      <div className="py-10">
        <AddPetForm 
          userId={session.user.id} 
          userEmail={session.user.email!} 
          accessToken={session.access_token} 
          onComplete={fetchPets} 
        />
      </div>
    );
  }

  // Case 2: Show the Pet(s) and option to add another
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Your Pets</h1>
        <button
          type="button"
          onClick={() => setShowAddPet(true)}
          className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 text-sm font-medium"
        >
          Add pet
        </button>
      </div>

      {showAddPet && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Add another pet</h2>
            <button
              type="button"
              onClick={() => setShowAddPet(false)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
          <AddPetForm
            userId={session.user.id}
            userEmail={session.user.email!}
            accessToken={session.access_token}
            onComplete={handleAddPetComplete}
          />
        </Card>
      )}

      <ConfirmDialog
        open={!!petToDelete}
        onClose={() => !deleting && setPetToDelete(null)}
        onConfirm={handleDeletePet}
        title="Delete pet?"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        loading={deleting}
      >
        {petToDelete ? (
          <>Are you sure you want to delete <strong>{petToDelete.name}</strong>? This cannot be undone.</>
        ) : null}
      </ConfirmDialog>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pets.map((pet) => (
          <div key={pet.id} className="relative group">
            <Link to={`/health?petId=${pet.id}`} className="block">
              <Card className="hover:shadow-md transition-shadow cursor-pointer border-green-100">
                <CardHeader className="bg-green-50/50 pb-4">
                  <div className="w-12 h-12 bg-green-500 rounded-full mb-2 flex items-center justify-center text-white text-xl font-bold">
                    {pet.name[0]}
                  </div>
                  <CardTitle>{pet.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{pet.breed || pet.species}</p>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Weight</span>
                    <span className="font-medium text-green-700">{pet.weight != null ? `${pet.weight} ${pet.weight_unit ?? 'kg'}` : `-- ${pet.weight_unit ?? 'kg'}`}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setPetToDelete({ id: pet.id, name: pet.name });
              }}
              className="absolute top-3 right-3 p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              aria-label={`Delete ${pet.name}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Minimalist Skeleton for loading state
function HomeSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
    </div>
  );
}
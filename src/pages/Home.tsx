import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Session } from '@supabase/supabase-js';
import AddPetForm from '@/components/features/pets/AddPetForm';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home({ session }: { session: Session }) {
  const [pet, setPet] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchPet = async () => {
    setLoading(true);
    const FETCH_TIMEOUT_MS = 5000;

    const queryPromise = supabase
      .from('pets')
      .select('*')
      .eq('owner_id', session.user.id)
      .maybeSingle();

    const timeoutPromise = new Promise<{ data: null; error: null }>((resolve) =>
      setTimeout(() => resolve({ data: null, error: null }), FETCH_TIMEOUT_MS)
    );

    try {
      const result = await Promise.race([queryPromise, timeoutPromise]);

      if (result && !result.error && result.data) {
        setPet(result.data);
      } else {
        setPet(null);
      }
    } catch {
      setPet(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPet();
  }, [session.user.id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[200px] w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-[100px] w-full" />
          <Skeleton className="h-[100px] w-full" />
        </div>
      </div>
    );
  }

  // If no pet is found, show the Onboarding Form
  if (!pet) {
    return (
      <div className="max-w-2xl mx-auto py-10 text-center">
        <h1 className="text-3xl font-bold mb-2">Welcome to Archie!</h1>
        <p className="text-gray-500 mb-8">Let's start by creating a profile for your pet.</p>
        <AddPetForm userId={session.user.id} onComplete={fetchPet} />
      </div>
    );
  }

  // If pet exists, show the Dashboard
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Hello, {pet.name}! 👋</h1>
        <p className="text-gray-500">{pet.breed} • Vancouver, BC</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 overflow-hidden">
          <div className="h-48 bg-gray-100 flex items-center justify-center">
             {pet.photo_url ? (
               <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
             ) : (
               <span className="text-gray-400 italic">No photo added yet</span>
             )}
          </div>
          <CardContent className="p-6">
            <h3 className="font-bold text-lg mb-2">Recent Activity</h3>
            <p className="text-sm text-gray-500">No recent health records found. Visit the Health Vault to add one!</p>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h4 className="font-bold text-sm text-gray-400 uppercase tracking-wider mb-4">Quick Stats</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Weight</span>
                  <span className="font-bold">-- kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Next Vaccine</span>
                  <span className="font-bold text-green-600">Up to date</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
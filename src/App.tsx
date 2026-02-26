import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabaseClient'

// Components
import Auth from './components/features/Auth'
import Layout from './components/shared/Layout'
import Home from './pages/Home'
import HealthVault from './pages/HealthVault'
import Marketplace from './pages/Marketplace'
// import MapPage from './pages/MapPage' // Create these as you go

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled) return;
      try {
        setSession(session);

        if (session?.user) {
          const user = session.user;
          await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              full_name: user.email ?? '',
            });
        }
      } catch {
        // Profile upsert or other error; still let the app load
      } finally {
        if (!cancelled) setLoading(false);
      }
    });

    // If getSession never resolves (e.g. network issue), stop loading after 5s
    const timeout = setTimeout(() => {
      cancelled = true;
      setLoading(false);
    }, 5000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
  
        if (session?.user) {
          const user = session.user;
          await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              full_name: user.email ?? '',
            });
        }
      }
    );
  
    return () => {
      cancelled = true;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  if (loading) return <div className="flex h-screen items-center justify-center">Loading Archie...</div>

  if (!session) {
    return <Auth />
  }

  return (
    <Layout onLogout={() => setSession(null)}>
      <Routes>
        {/* Pass session to Home so it can check for pets */}
        <Route path="/" element={<Home session={session} />} />
        
        <Route path="/health" element={<HealthVault petId="ARCHIE_ID_HERE" />} />
        <Route path="/marketplace" element={<Marketplace />} />
        
        {/* Redirect any unknown routes to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default App
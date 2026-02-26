import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardHeader, CardContent, CardTitle } from '../ui/card'

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async (type: 'LOGIN' | 'SIGNUP') => {
    setLoading(true)
    const { error } = type === 'LOGIN' 
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password })

    if (error) alert(error.message)
    setLoading(false)
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-slate-50">
      <Card className="w-87.5">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Welcome to Archie</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input 
            type="email" 
            placeholder="Email" 
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} 
          />
          <Input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} 
          />
          <div className="flex flex-col gap-2">
            <Button onClick={() => handleLogin('LOGIN')} disabled={loading}>
              {loading ? 'Processing...' : 'Login'}
            </Button>
            <Button variant="outline" onClick={() => handleLogin('SIGNUP')} disabled={loading}>
              Sign Up
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
import React, { useState } from 'react';
import { emailService } from '../lib/email';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

export default function EmailTest() {
  const [email, setEmail] = useState('');
  const [passcode, setPasscode] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSendTest = async () => {
    if (!email) {
      alert('Please enter an email address');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await emailService.sendPasswordResetEmail({
        to: email,
        passcode,
        expirationTime: '15 minutes',
        resetUrl: 'https://new-era-club.vercel.app/login'
      });

      setResult(response);
    } catch (error) {
      setResult({
        success: false,
        error: error.message || 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await emailService.testConnection();
      setResult(response);
    } catch (error) {
      setResult({
        success: false,
        error: error.message || 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-md mx-auto bg-card p-6 rounded-lg border">
        <h1 className="text-2xl font-bold mb-6">Email Service Test</h1>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Test Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
            />
          </div>

          <div>
            <Label htmlFor="passcode">OTP Code</Label>
            <Input
              id="passcode"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="123456"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSendTest}
              disabled={loading || !email}
              className="flex-1"
            >
              {loading ? 'Sending...' : 'Send Test Email'}
            </Button>
            
            <Button
              onClick={handleTestConnection}
              disabled={loading}
              variant="outline"
            >
              Test Connection
            </Button>
          </div>
        </div>

        {result && (
          <div className={`mt-6 p-4 rounded-lg ${
            result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            <h3 className="font-semibold mb-2">
              {result.success ? '✅ Success' : '❌ Error'}
            </h3>
            <p className="text-sm mb-2">{result.message}</p>
            {result.error && (
              <p className="text-sm font-mono bg-black/10 p-2 rounded">
                {result.error}
              </p>
            )}
            {result.data && (
              <details className="text-sm">
                <summary>Response Data</summary>
                <pre className="mt-2 bg-black/10 p-2 rounded text-xs overflow-x-auto">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 text-blue-800 rounded-lg text-sm">
          <h4 className="font-semibold mb-2">Environment Check</h4>
          <p>VITE_RESEND_API: {import.meta.env.VITE_RESEND_API ? '✅ Set' : '❌ Missing'}</p>
          <p>RESEND_API_KEY: {import.meta.env.RESEND_API_KEY ? '✅ Set' : '❌ Missing'}</p>
        </div>
      </div>
    </div>
  );
}
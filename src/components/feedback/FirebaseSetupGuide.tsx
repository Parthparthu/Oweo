import React from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export const FirebaseSetupGuide: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-black text-2xl mx-auto shadow-lg shadow-primary/25">
            ₹
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Connect Firebase to Oweo
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Oweo uses Firebase for secure Google Sign-In and real-time offline-synchronized Firestore data.
          </p>
        </div>

        <Card className="p-6 space-y-5">
          <div className="space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                1
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground">Create a Firebase Project</h3>
                <p className="text-xs text-muted-foreground">
                  Go to the{' '}
                  <a
                    href="https://console.firebase.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary font-semibold underline underline-offset-2"
                  >
                    Firebase Console
                  </a>{' '}
                  and click <strong>Add Project</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                2
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground">Enable Google Sign-In &amp; Firestore</h3>
                <p className="text-xs text-muted-foreground">
                  Under <strong>Build &gt; Authentication</strong>, enable the <strong>Google</strong> provider. Under <strong>Build &gt; Firestore Database</strong>, click <strong>Create Database</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                3
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground">Add Web App &amp; Copy Keys to .env</h3>
                <p className="text-xs text-muted-foreground">
                  In Project Settings &gt; General &gt; Your Apps, register a Web App and add the values to your <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-[11px]">.env</code> file:
                </p>
              </div>
            </div>
          </div>

          <div className="bg-muted/70 rounded-xl p-3.5 font-mono text-xs text-foreground/90 overflow-x-auto border border-border/60">
            <pre>{`VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef`}</pre>
          </div>

          <div className="pt-2 flex justify-center">
            <Button
              onClick={() => window.location.reload()}
              variant="primary"
              className="w-full sm:w-auto"
            >
              I Have Added Credentials (Reload)
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

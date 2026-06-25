'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft, Copy, Check, RefreshCw, KeyRound, Code2, CreditCard, Zap, Loader2, CheckCircle2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { regenerateIngestKey } from '@/app/actions/email'

type Tab = 'embed' | 'stripe' | 'api' | 'nocode'

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
      className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-muted"
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

function CodeBlock({ code }: { code: string }) {
  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-lg bg-muted p-3 pr-16 text-xs leading-relaxed">
        <code>{code}</code>
      </pre>
      <div className="absolute right-2 top-2">
        <CopyButton text={code} />
      </div>
    </div>
  )
}

const TABS: { id: Tab; label: string; icon: typeof Code2 }[] = [
  { id: 'embed', label: 'Embed form', icon: Code2 },
  { id: 'stripe', label: 'Stripe', icon: CreditCard },
  { id: 'api', label: 'Custom / API', icon: KeyRound },
  { id: 'nocode', label: 'No-code', icon: Zap },
]

export function ConnectWizard({
  initialToken,
  endpoint,
  syncedCount,
}: {
  initialToken: string | null
  endpoint: string
  syncedCount: number
}) {
  const [token, setToken] = useState(initialToken)
  const [tab, setTab] = useState<Tab>('embed')
  const [regenerating, setRegenerating] = useState(false)
  const [testing, setTesting] = useState(false)
  const [tested, setTested] = useState(false)

  async function handleRegenerate() {
    setRegenerating(true)
    const res = await regenerateIngestKey()
    setRegenerating(false)
    if (res.token) {
      setToken(res.token)
      toast.success(initialToken ? 'New key generated' : 'Key generated')
    } else {
      toast.error(res.error ?? 'Failed to generate key')
    }
  }

  async function handleTest() {
    if (!token) return
    setTesting(true)
    setTested(false)
    try {
      // Auth+plan check without polluting the list: an authorized key with no
      // email payload returns 400 "No email", which proves connectivity.
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': token },
        body: JSON.stringify({}),
      })
      const data = await res.json().catch(() => ({}))
      if (res.status === 200 || (res.status === 400 && /email/i.test(data.error ?? ''))) {
        setTested(true)
        toast.success('Connection works! Your key is valid.')
      } else if (res.status === 402) {
        toast.error('Website sync requires Pro or Agency.')
      } else {
        toast.error(data.error ?? 'Connection failed')
      }
    } catch {
      toast.error('Could not reach the endpoint')
    } finally {
      setTesting(false)
    }
  }

  const key = token ?? 'YOUR_API_KEY'

  const embedSnippet = `<!-- Tala email-list signup. Paste before </body>. -->
<form id="tala-signup">
  <input type="email" name="email" placeholder="Email" required />
  <input type="text" name="name" placeholder="Name" />
  <button type="submit">Subscribe</button>
</form>
<script>
  document.getElementById('tala-signup').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    await fetch('${endpoint}', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': '${key}' },
      body: JSON.stringify({
        email: f.email.value,
        name: f.name.value,
        source: 'newsletter'
      })
    });
    f.reset();
    alert('Thanks for subscribing!');
  });
</script>`

  const curlSnippet = `curl -X POST '${endpoint}' \\
  -H 'Content-Type: application/json' \\
  -H 'x-api-key: ${key}' \\
  -d '{"email":"customer@example.com","name":"Jane Doe","source":"signup"}'`

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <Link href="/socials" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          Back to Socials
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Connect your website</h1>
        <p className="text-sm text-muted-foreground">
          Automatically add people to your email list when they buy, sign up, or subscribe on your
          site — no matter what it’s built on.
        </p>
      </div>

      {/* API key */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><KeyRound className="size-4" /> Your API key</CardTitle>
          <CardDescription>
            Keep this secret. It authorizes contacts being added to <em>your</em> list.
            {syncedCount > 0 && <> · {syncedCount} contacts synced so far.</>}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {token ? (
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded-lg bg-muted px-3 py-2 text-sm">{token}</code>
              <CopyButton text={token} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No key yet — generate one to get started.</p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleRegenerate} disabled={regenerating} className="gap-1.5">
              {regenerating ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
              {token ? 'Regenerate key' : 'Generate key'}
            </Button>
            {token && (
              <Button size="sm" onClick={handleTest} disabled={testing} className="gap-1.5">
                {testing ? <Loader2 className="size-3.5 animate-spin" /> : tested ? <CheckCircle2 className="size-3.5" /> : null}
                Test connection
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Endpoint: <code className="rounded bg-muted px-1 py-0.5">{endpoint}</code>
          </p>
        </CardContent>
      </Card>

      {/* method tabs */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-1.5">
            {TABS.map((t) => {
              const Icon = t.icon
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    tab === t.id ? 'bg-foreground text-background' : 'hover:bg-muted'
                  }`}
                >
                  <Icon className="size-4" />
                  {t.label}
                </button>
              )
            })}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          {tab === 'embed' && (
            <>
              <p className="text-muted-foreground">
                Add a signup form to any site that lets you paste HTML (Squarespace/Wix/WordPress
                code blocks, custom sites). Anyone who submits it is added to your list.
              </p>
              <CodeBlock code={embedSnippet} />
            </>
          )}
          {tab === 'stripe' && (
            <>
              <p className="text-muted-foreground">Auto-add paying customers from your store’s Stripe:</p>
              <ol className="list-decimal space-y-1.5 pl-5 text-muted-foreground">
                <li>In your <strong>Stripe Dashboard → Developers → Webhooks</strong>, click <strong>Add endpoint</strong>.</li>
                <li>Set the endpoint URL to your key’d endpoint below.</li>
                <li>Select the event <code className="rounded bg-muted px-1">checkout.session.completed</code>.</li>
                <li>Save. New customers’ emails flow into your list as “purchase”.</li>
              </ol>
              <CodeBlock code={`${endpoint}?key=${key}`} />
            </>
          )}
          {tab === 'api' && (
            <>
              <p className="text-muted-foreground">
                On a custom-built site, call the endpoint whenever someone signs up or pays. Send the
                key in the <code className="rounded bg-muted px-1">x-api-key</code> header.
              </p>
              <CodeBlock code={curlSnippet} />
              <p className="text-xs text-muted-foreground">
                Fields: <code>email</code> (required), <code>name</code>, <code>source</code>
                (manual | purchase | signup | newsletter | website).
              </p>
            </>
          )}
          {tab === 'nocode' && (
            <>
              <p className="text-muted-foreground">
                Connect Shopify, Mailchimp, Typeform, etc. through Zapier or Make:
              </p>
              <ol className="list-decimal space-y-1.5 pl-5 text-muted-foreground">
                <li>Create a Zap/Scenario with your app as the <strong>trigger</strong> (e.g. “New Shopify order”).</li>
                <li>Add a <strong>Webhooks → POST</strong> action.</li>
                <li>URL: the endpoint below. Add header <code className="rounded bg-muted px-1">x-api-key: {key}</code>.</li>
                <li>Map the customer’s email to an <code>email</code> field in the JSON body.</li>
              </ol>
              <CodeBlock code={endpoint} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

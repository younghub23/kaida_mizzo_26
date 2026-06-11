import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'

const FEATURES = [
  'Social scheduling',
  'Email & SMS',
  'AI tools',
  'Paid ads',
  'Analytics',
]

export default function AboutPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">About Us</h1>

      <Card>
        <CardHeader>
          <CardTitle>What is Tala?</CardTitle>
          <CardDescription>
            Tala is an AI-powered marketing platform built for small businesses,
            helping you manage your social presence, email and SMS campaigns,
            paid advertising, and performance analytics all in one place.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Our Mission</CardTitle>
          <CardDescription>
            We believe small businesses deserve the same marketing power as large
            enterprises. Our mission is to make professional marketing simple,
            affordable, and accessible to everyone, powered by AI.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Key Features</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-2">
            {FEATURES.map((feature) => (
              <li key={feature} className="text-sm text-muted-foreground">
                {feature}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact &amp; Support</CardTitle>
          <CardDescription>
            Have questions or need help? Reach out to us at{' '}
            <a href="mailto:support@tala.com" className="underline">
              support@tala.com
            </a>
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}

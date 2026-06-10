import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { UpgradeButton } from './upgrade-button'

export default function BillingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Tala Growth Plan</CardTitle>
          <CardDescription>$99/month</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Start your 7-day free trial. Cancel anytime.
          </p>
        </CardContent>
        <CardFooter>
          <UpgradeButton />
        </CardFooter>
      </Card>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Sparkles, Mail, FileText } from 'lucide-react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AIAssistant, type AIGenerateType } from '@/components/ai/AIAssistant'

const FEATURES: {
  type: AIGenerateType
  title: string
  description: string
  icon: typeof Sparkles
}[] = [
  {
    type: 'social',
    title: 'Social Caption Generator',
    description: 'Generate engaging captions with hashtags for your social media posts.',
    icon: Sparkles,
  },
  {
    type: 'email_subject',
    title: 'Email Subject Line Generator',
    description: 'Create compelling subject lines that boost your open rates.',
    icon: Mail,
  },
  {
    type: 'email_body',
    title: 'Email Body Generator',
    description: 'Draft short, persuasive email copy for your campaigns.',
    icon: FileText,
  },
]

export default function AiToolsPage() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeType, setActiveType] = useState<AIGenerateType>('social')
  const [lastSelected, setLastSelected] = useState('')

  function openAssistant(type: AIGenerateType) {
    setActiveType(type)
    setIsOpen(true)
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">AI Tools</h1>
        <p className="text-sm text-muted-foreground">Generate content with AI</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => {
          const Icon = feature.icon

          return (
            <Card key={feature.type}>
              <CardHeader>
                <Icon className="size-5 text-muted-foreground" />
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardFooter>
                <Button onClick={() => openAssistant(feature.type)} className="w-full">
                  Open Generator
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Last Generated</CardTitle>
          <CardDescription>Your most recently selected AI suggestion will appear here.</CardDescription>
        </CardHeader>
        <CardContent>
          {lastSelected ? (
            <p className="text-sm">{lastSelected}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Nothing yet — generate something above.</p>
          )}
        </CardContent>
      </Card>

      <AIAssistant
        key={activeType}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSelect={setLastSelected}
        defaultType={activeType}
      />
    </div>
  )
}

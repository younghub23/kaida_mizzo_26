'use client'

import dynamic from 'next/dynamic'
import type { UnlayerEditor } from '@unlayer/types'
import type { EmailEditorProps } from 'react-email-editor'

const EmailEditor = dynamic(() => import('react-email-editor'), { ssr: false })

type Props = {
  onReady?: (editor: UnlayerEditor) => void
}

export default function EmailBuilder({ onReady }: Props) {
  const handleReady: EmailEditorProps['onReady'] = (editor) => {
    onReady?.(editor as UnlayerEditor)
  }

  return (
    <div className="h-[600px] w-full overflow-hidden rounded-md border">
      <EmailEditor onReady={handleReady} minHeight="600px" />
    </div>
  )
}

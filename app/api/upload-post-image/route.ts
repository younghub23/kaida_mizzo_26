import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logError } from '@/lib/log'

// Requires a public 'post-images' bucket to be created in the Supabase Storage dashboard.
export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const admin = createAdminClient()
  const path = `${user.id}/${Date.now()}-${file.name}`

  const { error } = await admin.storage
    .from('post-images')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (error) {
    logError('upload-post-image', 'Supabase storage upload failed', error, { userId: user.id, path })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const {
    data: { publicUrl },
  } = admin.storage.from('post-images').getPublicUrl(path)

  return NextResponse.json({ url: publicUrl })
}

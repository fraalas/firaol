'use client'
import { useState, useRef } from 'react'
import { Camera, X, Loader2, ImagePlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface ImageUploadProps {
  propertyId: string
  existingImages?: string[]
  onUploadComplete: (urls: string[]) => void
}

export function ImageUpload({ propertyId, existingImages = [], onUploadComplete }: ImageUploadProps) {
  const supabase    = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [images, setImages]   = useState<string[]>(existingImages)
  const [uploading, setUploading] = useState(false)
  const [error, setError]     = useState('')

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    if (images.length + files.length > 6) {
      setError('Maximum 6 images per property')
      return
    }
    setUploading(true)
    setError('')

    const newUrls: string[] = []
    for (const file of files) {
      // Validate
      if (!file.type.startsWith('image/')) { setError('Only image files allowed'); continue }
      if (file.size > 5 * 1024 * 1024)    { setError('Max 5MB per image'); continue }

      const ext  = file.name.split('.').pop()
      const path = `${propertyId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { data, error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(path, file, { cacheControl: '3600', upsert: false })

      if (uploadError) { setError(uploadError.message); continue }

      const { data: { publicUrl } } = supabase.storage
        .from('property-images')
        .getPublicUrl(path)

      newUrls.push(publicUrl)
    }

    const updated = [...images, ...newUrls]
    setImages(updated)
    onUploadComplete(updated)
    setUploading(false)

    // Update property record
    await supabase.from('properties')
      .update({ images: updated })
      .eq('id', propertyId)
  }

  async function removeImage(url: string) {
    const path = url.split('/property-images/')[1]
    if (path) {
      await supabase.storage.from('property-images').remove([path])
    }
    const updated = images.filter(u => u !== url)
    setImages(updated)
    onUploadComplete(updated)
    await supabase.from('properties').update({ images: updated }).eq('id', propertyId)
  }

  return (
    <div>
      <div className="text-xs font-semibold text-[#4A5880] mb-2">
        Photos ({images.length}/6)
      </div>

      {error && (
        <div className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2 mb-2">
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        {images.map((url, i) => (
          <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-[#F5F7FB]">
            <img src={url} alt={`Property ${i+1}`} className="w-full h-full object-cover" />
            <button
              onClick={() => removeImage(url)}
              className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
            >
              <X size={12} className="text-white" />
            </button>
          </div>
        ))}

        {images.length < 6 && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-xl border-2 border-dashed border-[#E2E8F4] flex flex-col items-center justify-center gap-1 hover:border-[#075290] hover:bg-[#F5F7FB] transition-all disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 size={20} className="text-[#9AAAC8] animate-spin" />
            ) : (
              <>
                <ImagePlus size={20} className="text-[#9AAAC8]" />
                <span className="text-[9px] text-[#9AAAC8] font-medium">Add photo</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
      <div className="text-[10px] text-[#9AAAC8] mt-2">
        Max 6 photos • 5MB each • JPG, PNG, WebP
      </div>
    </div>
  )
}

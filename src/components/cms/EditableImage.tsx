import { ImagePlus, Loader2 } from 'lucide-react'
import { useRef } from 'react'
import { IMAGE_ACCEPT, useImageUpload } from '../../hooks/useImageUpload'
import SafeImage from '../ui/SafeImage'

type EditableImageProps = {
    src: string
    alt: string
    onChange: (url: string) => void
    label: string
    /** Must include a positioning utility (defaults to `relative`). */
    className?: string
    imgClassName?: string
    /** Positions the change-image button inside the image frame. */
    buttonClassName?: string
    invalid?: boolean
    folder?: string
}

export default function EditableImage({
    src,
    alt,
    onChange,
    label,
    className = 'relative',
    imgClassName = '',
    buttonClassName = 'right-3 top-3',
    invalid = false,
    folder,
}: EditableImageProps) {
    const inputRef = useRef<HTMLInputElement>(null)
    const { upload, isUploading, error } = useImageUpload(folder)

    const onFile = async (file: File | undefined) => {
        if (!file) return
        const url = await upload(file)
        if (url) onChange(url)
    }

    return (
        <div className={className}>
            {src ? (
                <SafeImage src={src} alt={alt} className="h-full w-full" imgClassName={imgClassName} />
            ) : (
                <div
                    className={`flex h-full w-full items-center justify-center bg-ink-card ${
                        invalid ? 'ring-1 ring-red-400/70 ring-inset' : ''
                    }`}
                >
                    <ImagePlus size={28} strokeWidth={1.2} className="text-silver/30" aria-hidden />
                </div>
            )}

            <div className={`absolute z-20 flex flex-col items-end gap-1.5 ${buttonClassName}`}>
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    disabled={isUploading}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-black/60 px-2.5 py-1.5 text-xs text-white backdrop-blur-sm transition hover:border-gold/50 hover:text-gold disabled:opacity-70"
                >
                    {isUploading ? (
                        <Loader2 size={13} className="animate-spin" aria-hidden />
                    ) : (
                        <ImagePlus size={13} strokeWidth={1.6} aria-hidden />
                    )}
                    {isUploading ? 'Uploading…' : src ? `Change ${label.toLowerCase()}` : `Add ${label.toLowerCase()}`}
                </button>
                {error ? (
                    <p className="rounded-md bg-black/70 px-2 py-1 text-[11px] text-red-300">{error}</p>
                ) : null}
            </div>

            <input
                ref={inputRef}
                type="file"
                accept={IMAGE_ACCEPT}
                className="hidden"
                onChange={(event) => {
                    void onFile(event.target.files?.[0])
                    event.target.value = ''
                }}
            />
        </div>
    )
}

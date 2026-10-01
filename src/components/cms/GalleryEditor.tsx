import { ArrowLeft, ArrowRight, ImagePlus, Loader2, RefreshCw, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { IMAGE_ACCEPT, useImageUpload } from '../../hooks/useImageUpload'
import { moveItem, removeItem, replaceItem } from '../../lib/listOps'
import SafeImage from '../ui/SafeImage'

type GalleryEditorProps = {
    images: string[]
    onChange: (images: string[]) => void
    title: string
}

const tileButtonClass =
    'flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white backdrop-blur-sm transition hover:border-gold/50 hover:text-gold disabled:pointer-events-none disabled:opacity-30'

export default function GalleryEditor({ images, onChange, title }: GalleryEditorProps) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [replaceIndex, setReplaceIndex] = useState<number | null>(null)
    const [busyIndex, setBusyIndex] = useState<number | null>(null)
    const { upload, isUploading, error } = useImageUpload()

    const pick = (index: number | null) => {
        setReplaceIndex(index)
        inputRef.current?.click()
    }

    const onFile = async (file: File | undefined) => {
        if (!file) return
        const target = replaceIndex
        setBusyIndex(target ?? images.length)
        const url = await upload(file)
        setBusyIndex(null)
        if (!url) return
        onChange(target === null ? [...images, url] : replaceItem(images, target, url))
    }

    return (
        <div className="space-y-3">
            <div className="flex items-end justify-between gap-3">
                <h2 className="font-serif text-2xl text-gold-gradient">Gallery</h2>
                <p className="text-[10px] uppercase tracking-[0.18em] text-silver/50">
                    {images.length === 0 ? 'Empty · the cover image is shown instead' : `${images.length} photos`}
                </p>
            </div>

            <div className="-mx-1 overflow-x-auto pb-1 [scrollbar-width:thin] [scrollbar-color:rgba(212,175,55,0.35)_transparent]">
                <div className="flex w-max gap-3 px-1">
                    {images.map((src, index) => (
                        <div
                            key={`${src}-${index}`}
                            className="group relative aspect-[4/3] w-[min(78vw,18rem)] shrink-0 overflow-hidden rounded-xl border border-white/8 sm:w-72"
                        >
                            <SafeImage
                                src={src}
                                alt={`${title} photo ${index + 1}`}
                                className="h-full w-full"
                                imgClassName="object-cover"
                            />
                            <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-80" />
                            {busyIndex === index ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                    <Loader2 size={20} className="animate-spin text-gold" aria-hidden />
                                </div>
                            ) : null}
                            <div className="absolute inset-x-2 bottom-2 flex items-center justify-between gap-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                                <div className="flex gap-1.5">
                                    <button
                                        type="button"
                                        aria-label={`Move photo ${index + 1} left`}
                                        disabled={index === 0}
                                        onClick={() => onChange(moveItem(images, index, index - 1))}
                                        className={tileButtonClass}
                                    >
                                        <ArrowLeft size={13} strokeWidth={1.75} />
                                    </button>
                                    <button
                                        type="button"
                                        aria-label={`Move photo ${index + 1} right`}
                                        disabled={index === images.length - 1}
                                        onClick={() => onChange(moveItem(images, index, index + 1))}
                                        className={tileButtonClass}
                                    >
                                        <ArrowRight size={13} strokeWidth={1.75} />
                                    </button>
                                </div>
                                <div className="flex gap-1.5">
                                    <button
                                        type="button"
                                        aria-label={`Replace photo ${index + 1}`}
                                        disabled={isUploading}
                                        onClick={() => pick(index)}
                                        className={tileButtonClass}
                                    >
                                        <RefreshCw size={13} strokeWidth={1.75} />
                                    </button>
                                    <button
                                        type="button"
                                        aria-label={`Remove photo ${index + 1}`}
                                        onClick={() => onChange(removeItem(images, index))}
                                        className={`${tileButtonClass} hover:text-red-300`}
                                    >
                                        <X size={14} strokeWidth={1.75} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={() => pick(null)}
                        disabled={isUploading}
                        className="flex aspect-[4/3] w-[min(78vw,18rem)] shrink-0 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 text-xs text-silver/60 transition hover:border-gold/50 hover:text-gold disabled:opacity-60 sm:w-72"
                    >
                        {busyIndex === images.length ? (
                            <Loader2 size={20} className="animate-spin" aria-hidden />
                        ) : (
                            <ImagePlus size={20} strokeWidth={1.3} aria-hidden />
                        )}
                        {busyIndex === images.length ? 'Uploading…' : 'Add photo'}
                    </button>
                </div>
            </div>

            {error ? <p className="text-xs text-red-300">{error}</p> : null}

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

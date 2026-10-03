export default function BrandWordmark({ className = 'text-xl' }: { className?: string }) {
    return (
        <span className="flex items-baseline gap-2">
            <span className={`font-lejour leading-none tracking-[0.16em] text-ink ${className}`}>
                AVENtures
            </span>
            <span className="text-[10px] font-medium tracking-[0.3em] text-royal uppercase">
                Admin
            </span>
        </span>
    )
}

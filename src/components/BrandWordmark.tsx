export default function BrandWordmark({ className = 'text-xl' }: { className?: string }) {
    return (
        <span className="flex items-baseline gap-1.5">
            <span className={`font-serif leading-none tracking-wide ${className}`}>
                <span className="text-gold-gradient">AVEN</span>
                <span className="text-white">tures</span>
            </span>
            <span className="text-[10px] font-medium tracking-widest text-gold uppercase">
                Admin
            </span>
        </span>
    )
}

import { WAVE_LABELS, type Wave } from '../config/navigation'

const WAVE_STYLES: Record<Wave, string> = {
    live: 'bg-emerald-600/10 text-emerald-700',
    next: 'bg-gold/20 text-gold-ink',
    later: 'bg-royal/[0.06] text-ink/55',
    suggested: 'bg-royal/10 text-royal',
}

export default function WaveBadge({ wave }: { wave: Wave }) {
    return (
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium tracking-wide ${WAVE_STYLES[wave]}`}>
            {WAVE_LABELS[wave]}
        </span>
    )
}

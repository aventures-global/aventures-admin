import { WAVE_LABELS, type Wave } from '../config/navigation'
import StatusBadge, { type StatusTone } from './admin/StatusBadge'

const WAVE_TONES: Record<Wave, StatusTone> = {
    live: 'success',
    next: 'warning',
    later: 'neutral',
    suggested: 'accent',
}

export default function WaveBadge({ wave }: { wave: Wave }) {
    return <StatusBadge tone={WAVE_TONES[wave]}>{WAVE_LABELS[wave]}</StatusBadge>
}

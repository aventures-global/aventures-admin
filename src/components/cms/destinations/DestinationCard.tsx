import { ArrowUpRight, Star } from 'lucide-react'
import { cardCoverFocus } from '../../../lib/coverFocus'
import { regionLabel, type TourSummary } from '../../../types/tour'
import SafeImage from '../../ui/SafeImage'

type DestinationCardProps = {
    tour: TourSummary
    lifted?: boolean
}

export default function DestinationCard({ tour, lifted = false }: DestinationCardProps) {
    return (
        <div
            className={`group relative block overflow-hidden rounded-xl border transition-colors duration-500 ${
                lifted
                    ? 'border-gold/60 shadow-2xl shadow-black/60'
                    : 'border-white/8 hover:border-gold/40'
            }`}
        >
            <SafeImage
                src={tour.coverImage}
                alt={tour.title}
                className="aspect-[4/3] w-full"
                imgClassName={`object-cover ${cardCoverFocus(tour.id)} transition duration-700 group-hover:scale-[1.04]`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/25" />
            {tour.featured ? (
                <span className="absolute left-3.5 top-3.5 inline-flex items-center gap-1 rounded-full border border-gold/40 bg-black/50 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-gold backdrop-blur-sm">
                    <Star size={10} strokeWidth={2} className="fill-gold" aria-hidden />
                    Featured
                </span>
            ) : null}
            <span
                aria-hidden
                className="absolute right-3.5 top-3.5 text-gold/40 transition duration-500 group-hover:text-gold"
            >
                <ArrowUpRight size={18} strokeWidth={1.3} />
            </span>
            <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                <p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-gold">
                    {tour.location}
                    {tour.region === 'other' ? (
                        <span
                            title="Assign a region so this destination appears in region filters"
                            className="rounded-full border border-white/20 px-1.5 py-px text-[9px] tracking-[0.12em] text-silver/70"
                        >
                            {regionLabel(tour.region)} region
                        </span>
                    ) : null}
                </p>
                <h2 className="mt-1.5 font-serif text-xl leading-snug text-white">{tour.title}</h2>
                <p className="mt-1 text-sm text-white/70">{tour.tagline}</p>
            </div>
        </div>
    )
}

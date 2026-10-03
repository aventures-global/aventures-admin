import { ArrowDown, ArrowUp, ArrowUpDown, Star } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cardCoverFocus } from '../../../lib/coverFocus'
import { regionLabel, type Tour, type TourSearchParams, type TourSort } from '../../../types/tour'
import SafeImage from '../../ui/SafeImage'

type DestinationTableProps = {
    tours: Tour[]
    sort: TourSearchParams['sort']
    dir: TourSearchParams['dir']
    onSort: (sort: TourSort) => void
}

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })

export default function DestinationTable({ tours, sort, dir, onSort }: DestinationTableProps) {
    const navigate = useNavigate()

    const header = (label: string, key?: TourSort, className = '') => {
        if (!key) {
            return (
                <th scope="col" className={`px-3 py-2.5 font-normal ${className}`}>
                    {label}
                </th>
            )
        }
        const active = sort === key
        const Icon = !active ? ArrowUpDown : dir === 'asc' ? ArrowUp : ArrowDown
        return (
            <th
                scope="col"
                aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                className={`px-3 py-2.5 font-normal ${className}`}
            >
                <button
                    type="button"
                    onClick={() => onSort(key)}
                    className={`inline-flex items-center gap-1.5 transition hover:text-royal ${
                        active ? 'text-royal' : ''
                    }`}
                >
                    {label}
                    <Icon size={12} strokeWidth={1.75} className={active ? '' : 'opacity-40'} aria-hidden />
                </button>
            </th>
        )
    }

    return (
        <div className="paper-card overflow-x-auto rounded-[3px]">
            <table className="w-full min-w-[56rem] text-left text-sm">
                <thead className="border-b border-royal/15 bg-cream text-[11px] uppercase tracking-[0.14em] text-ink/55">
                    <tr>
                        {header('', undefined, 'w-20')}
                        {header('Title', 'name')}
                        {header('Location', 'location')}
                        {header('Region', 'region')}
                        {header('Duration')}
                        {header('Price')}
                        {header('Featured', 'featured', 'text-center')}
                        {header('Updated', 'updated')}
                    </tr>
                </thead>
                <tbody className="divide-y divide-royal/10">
                    {tours.map((tour) => (
                        <tr
                            key={tour.id}
                            tabIndex={0}
                            onClick={() => navigate(tour.slug)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') navigate(tour.slug)
                            }}
                            className="cursor-pointer transition-colors hover:bg-royal/[0.03] focus-visible:bg-royal/[0.05] focus-visible:outline-none"
                        >
                            <td className="px-3 py-2">
                                <SafeImage
                                    src={tour.coverImage}
                                    alt=""
                                    className="h-10 w-14 rounded-[3px]"
                                    imgClassName={`object-cover ${cardCoverFocus(tour.id)}`}
                                />
                            </td>
                            <td className="px-3 py-2">
                                <p className="font-noto-serif text-base text-ink">{tour.title}</p>
                                <p className="text-xs text-ink/45">/{tour.slug}</p>
                            </td>
                            <td className="px-3 py-2 text-ink/80">{tour.location}</td>
                            <td className="px-3 py-2">
                                <span
                                    className={
                                        tour.region === 'other' ? 'text-ink/45 italic' : 'text-ink/80'
                                    }
                                >
                                    {regionLabel(tour.region)}
                                </span>
                            </td>
                            <td className="px-3 py-2 text-ink/70">{tour.duration}</td>
                            <td className="px-3 py-2 text-ink/70">{tour.startingPrice}</td>
                            <td className="px-3 py-2 text-center">
                                {tour.featured ? (
                                    <Star
                                        size={15}
                                        strokeWidth={1.75}
                                        className="inline fill-gold-deep text-gold-deep"
                                        aria-label="Featured"
                                    />
                                ) : (
                                    <span className="text-ink/25" aria-label="Not featured">
                                        —
                                    </span>
                                )}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-ink/55">
                                {dateFormat.format(new Date(tour.updatedAt))}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

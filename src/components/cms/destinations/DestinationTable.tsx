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
                    className={`inline-flex items-center gap-1.5 transition hover:text-gold ${
                        active ? 'text-gold' : ''
                    }`}
                >
                    {label}
                    <Icon size={12} strokeWidth={1.75} className={active ? '' : 'opacity-40'} aria-hidden />
                </button>
            </th>
        )
    }

    return (
        <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[56rem] text-left text-sm">
                <thead className="border-b border-white/10 bg-ink-soft text-[11px] uppercase tracking-[0.14em] text-silver/60">
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
                <tbody className="divide-y divide-white/5">
                    {tours.map((tour) => (
                        <tr
                            key={tour.id}
                            tabIndex={0}
                            onClick={() => navigate(tour.slug)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') navigate(tour.slug)
                            }}
                            className="cursor-pointer transition-colors hover:bg-white/[0.03] focus-visible:bg-white/[0.05] focus-visible:outline-none"
                        >
                            <td className="px-3 py-2">
                                <SafeImage
                                    src={tour.coverImage}
                                    alt=""
                                    className="h-10 w-14 rounded-md"
                                    imgClassName={`object-cover ${cardCoverFocus(tour.id)}`}
                                />
                            </td>
                            <td className="px-3 py-2">
                                <p className="font-serif text-base text-white">{tour.title}</p>
                                <p className="text-xs text-silver/50">/{tour.slug}</p>
                            </td>
                            <td className="px-3 py-2 text-silver/85">{tour.location}</td>
                            <td className="px-3 py-2">
                                <span
                                    className={
                                        tour.region === 'other' ? 'text-silver/50 italic' : 'text-silver/85'
                                    }
                                >
                                    {regionLabel(tour.region)}
                                </span>
                            </td>
                            <td className="px-3 py-2 text-silver/75">{tour.duration}</td>
                            <td className="px-3 py-2 text-silver/75">{tour.startingPrice}</td>
                            <td className="px-3 py-2 text-center">
                                {tour.featured ? (
                                    <Star
                                        size={15}
                                        strokeWidth={1.75}
                                        className="inline fill-gold text-gold"
                                        aria-label="Featured"
                                    />
                                ) : (
                                    <span className="text-silver/25" aria-label="Not featured">
                                        —
                                    </span>
                                )}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-silver/60">
                                {dateFormat.format(new Date(tour.updatedAt))}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

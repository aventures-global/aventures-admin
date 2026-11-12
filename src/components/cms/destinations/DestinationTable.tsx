import { ArrowDown, ArrowUp, ArrowUpDown, Star } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cardCoverFocus } from '../../../lib/coverFocus'
import { regionLabel, type TourSearchParams, type TourSort, type TourSummary } from '../../../types/tour'
import { AdminPanel, DataTableBody, DataTableHead } from '../../admin'
import SafeImage from '../../ui/SafeImage'

type DestinationTableProps = {
    tours: TourSummary[]
    sort: TourSearchParams['sort']
    dir: TourSearchParams['dir']
    featuringSlug?: string | null
    onSort: (sort: TourSort) => void
    onToggleFeatured: (tour: TourSummary) => void
}

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })

export default function DestinationTable({
    tours,
    sort,
    dir,
    featuringSlug = null,
    onSort,
    onToggleFeatured,
}: DestinationTableProps) {
    const navigate = useNavigate()

    const header = (label: string, key?: TourSort, className = '') => {
        if (!key) {
            return (
                <th scope="col" className={`px-3 py-2.5 font-medium ${className}`}>
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
                className={`px-3 py-2.5 font-medium ${className}`}
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
        <AdminPanel className="overflow-x-auto">
            <table className="w-full min-w-[56rem] text-left text-sm">
                <DataTableHead>
                    <tr>
                        {header('', undefined, 'w-20')}
                        {header('Title', 'name')}
                        {header('Location', 'location')}
                        {header('Region', 'region')}
                        {header('Tagline')}
                        {header('Featured', 'featured', 'text-center')}
                        {header('Updated', 'updated')}
                    </tr>
                </DataTableHead>
                <DataTableBody>
                    {tours.map((tour) => {
                        const featuring = featuringSlug === tour.slug
                        return (
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
                                    <p className="font-medium text-ink">{tour.title}</p>
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
                                <td className="max-w-64 truncate px-3 py-2 text-ink/70">{tour.tagline}</td>
                                <td className="px-3 py-2 text-center">
                                    <button
                                        type="button"
                                        disabled={featuring}
                                        aria-pressed={tour.featured}
                                        aria-label={
                                            tour.featured ? 'Remove from featured' : 'Mark as featured'
                                        }
                                        title={
                                            tour.featured ? 'Remove from featured' : 'Mark as featured'
                                        }
                                        onClick={(event) => {
                                            event.stopPropagation()
                                            onToggleFeatured(tour)
                                        }}
                                        className={`inline-flex rounded p-1 transition hover:bg-royal/5 disabled:opacity-60 ${
                                            tour.featured ? 'text-royal' : 'text-ink/30 hover:text-royal/70'
                                        }`}
                                    >
                                        <Star
                                            size={15}
                                            strokeWidth={1.75}
                                            className={`${tour.featured ? 'fill-royal' : ''} ${
                                                featuring ? 'animate-pulse' : ''
                                            }`}
                                            aria-hidden
                                        />
                                    </button>
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-ink/55">
                                    {dateFormat.format(new Date(tour.updatedAt))}
                                </td>
                            </tr>
                        )
                    })}
                </DataTableBody>
            </table>
        </AdminPanel>
    )
}

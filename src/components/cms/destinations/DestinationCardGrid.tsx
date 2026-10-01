import {
    DndContext,
    DragOverlay,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    closestCenter,
    useSensor,
    useSensors,
    type DragEndEvent,
    type DragStartEvent,
} from '@dnd-kit/core'
import {
    SortableContext,
    rectSortingStrategy,
    sortableKeyboardCoordinates,
    useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useRef, useState, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { moveItem } from '../../../lib/listOps'
import type { TourMove } from '../../../services/tourService'
import type { Tour } from '../../../types/tour'
import DestinationCard from './DestinationCard'

type DestinationCardGridProps = {
    tours: Tour[]
    sortable: boolean
    onMove: (move: { slug: string; from: number; to: number; move: TourMove }) => void
}

const gridClass = 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'

export default function DestinationCardGrid({ tours, sortable, onMove }: DestinationCardGridProps) {
    const [activeSlug, setActiveSlug] = useState<string | null>(null)
    const suppressClickRef = useRef(false)

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
            keyboardCodes: { start: ['Space'], cancel: ['Escape'], end: ['Space', 'Enter'] },
        }),
    )

    const activeTour = activeSlug ? tours.find((tour) => tour.slug === activeSlug) : null

    const onDragStart = (event: DragStartEvent) => {
        suppressClickRef.current = true
        setActiveSlug(String(event.active.id))
    }

    const finishDrag = () => {
        setActiveSlug(null)
        window.setTimeout(() => {
            suppressClickRef.current = false
        }, 0)
    }

    const onDragEnd = ({ active, over }: DragEndEvent) => {
        finishDrag()
        if (!over || active.id === over.id) return
        const from = tours.findIndex((tour) => tour.slug === active.id)
        const to = tours.findIndex((tour) => tour.slug === over.id)
        if (from < 0 || to < 0) return
        const reordered = moveItem(tours, from, to)
        const before = reordered[to - 1]
        const after = reordered[to + 1]
        onMove({
            slug: String(active.id),
            from,
            to,
            move: before ? { beforeSlug: before.slug } : { afterSlug: after?.slug },
        })
    }

    const guardClick = (event: MouseEvent) => {
        if (suppressClickRef.current) event.preventDefault()
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragCancel={finishDrag}
        >
            <SortableContext
                items={tours.map((tour) => tour.slug)}
                strategy={rectSortingStrategy}
                disabled={!sortable}
            >
                <div className={gridClass}>
                    {tours.map((tour) => (
                        <SortableCard
                            key={tour.id}
                            tour={tour}
                            sortable={sortable}
                            onClickCapture={guardClick}
                        />
                    ))}
                </div>
            </SortableContext>
            <DragOverlay>
                {activeTour ? (
                    <div className="cursor-grabbing">
                        <DestinationCard tour={activeTour} lifted />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    )
}

function SortableCard({
    tour,
    sortable,
    onClickCapture,
}: {
    tour: Tour
    sortable: boolean
    onClickCapture: (event: MouseEvent) => void
}) {
    const { setNodeRef, listeners, attributes, transform, transition, isDragging } = useSortable({
        id: tour.slug,
        disabled: !sortable,
    })

    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            className={isDragging ? 'opacity-30' : ''}
        >
            <Link
                to={tour.slug}
                draggable={false}
                onClickCapture={onClickCapture}
                aria-roledescription={sortable ? 'sortable destination' : undefined}
                aria-describedby={sortable ? attributes['aria-describedby'] : undefined}
                className={`block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-gold/60 [&_img]:[-webkit-user-drag:none] ${
                    sortable ? 'cursor-grab touch-manipulation' : ''
                }`}
                {...(sortable ? listeners : {})}
            >
                <DestinationCard tour={tour} />
            </Link>
        </div>
    )
}

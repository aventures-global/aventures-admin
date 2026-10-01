import { moveItem, removeItem, replaceItem } from '../../lib/listOps'
import type { TourItineraryDay } from '../../types/tour'
import AddItemButton from './AddItemButton'
import EditableText from './EditableText'
import ItemControls from './ItemControls'

type ItineraryEditorProps = {
    days: TourItineraryDay[]
    onChange: (days: TourItineraryDay[]) => void
    showErrors?: boolean
}

function renumber(days: TourItineraryDay[]): TourItineraryDay[] {
    return days.map((day, index) => ({ ...day, day: index + 1 }))
}

export default function ItineraryEditor({ days, onChange, showErrors = false }: ItineraryEditorProps) {
    const update = (index: number, patch: Partial<TourItineraryDay>) =>
        onChange(replaceItem(days, index, { ...days[index], ...patch }))

    return (
        <div>
            {days.length > 0 ? (
                <ol className="mt-5 space-y-5">
                    {days.map((day, index) => (
                        <li key={index} className="group border-l border-gold/30 pl-4">
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-xs uppercase tracking-wider text-gold">Day {index + 1}</p>
                                <ItemControls
                                    index={index}
                                    count={days.length}
                                    label={`day ${index + 1}`}
                                    onMove={(from, to) => onChange(renumber(moveItem(days, from, to)))}
                                    onRemove={(i) => onChange(renumber(removeItem(days, i)))}
                                />
                            </div>
                            <EditableText
                                className="mt-1 font-medium text-white"
                                value={day.title}
                                label={`Day ${index + 1} title`}
                                placeholder="Day title"
                                invalid={showErrors && !day.title.trim()}
                                onChange={(title) => update(index, { title })}
                            />
                            <EditableText
                                multiline
                                className="mt-1 text-sm text-muted"
                                value={day.description}
                                label={`Day ${index + 1} description`}
                                placeholder="What happens on this day"
                                invalid={showErrors && !day.description.trim()}
                                onChange={(description) => update(index, { description })}
                            />
                        </li>
                    ))}
                </ol>
            ) : null}
            <AddItemButton
                label="Add day"
                className="mt-5"
                onClick={() =>
                    onChange([...days, { day: days.length + 1, title: '', description: '' }])
                }
            />
        </div>
    )
}

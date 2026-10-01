import { useState } from 'react'
import { moveItem, removeItem, replaceItem } from '../../lib/listOps'
import AddItemButton from './AddItemButton'
import EditableText from './EditableText'
import ItemControls from './ItemControls'

type EditableListProps = {
    items: string[]
    onChange: (items: string[]) => void
    /** Singular noun used in labels, e.g. "highlight". */
    itemLabel: string
    variant: 'cards' | 'bullets'
    className?: string
}

export default function EditableList({
    items,
    onChange,
    itemLabel,
    variant,
    className = '',
}: EditableListProps) {
    const [freshIndex, setFreshIndex] = useState<number | null>(null)

    const add = () => {
        setFreshIndex(items.length)
        onChange([...items, ''])
    }

    const endEdit = (index: number, value: string) => {
        if (index === freshIndex) setFreshIndex(null)
        if (!value.trim()) onChange(removeItem(items, index))
    }

    const remove = (index: number) => {
        setFreshIndex(null)
        onChange(removeItem(items, index))
    }

    const move = (from: number, to: number) => {
        setFreshIndex(null)
        onChange(moveItem(items, from, to))
    }

    return (
        <div>
            {items.length > 0 ? (
                <ul className={className}>
                    {items.map((item, index) => (
                        <li
                            key={index}
                            className={
                                variant === 'cards'
                                    ? 'group flex items-start gap-3 rounded-xl border border-white/8 bg-ink-card/60 px-4 py-3.5 text-sm text-silver/90'
                                    : 'group flex items-start gap-2 text-sm text-silver/85'
                            }
                        >
                            {variant === 'cards' ? (
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                            ) : (
                                <span aria-hidden>•</span>
                            )}
                            <EditableText
                                as="span"
                                className="block min-w-0 flex-1"
                                value={item}
                                label={itemLabel}
                                placeholder={`New ${itemLabel}`}
                                autoEdit={index === freshIndex}
                                onChange={(value) => onChange(replaceItem(items, index, value))}
                                onEditEnd={(value) => endEdit(index, value)}
                            />
                            <ItemControls
                                index={index}
                                count={items.length}
                                label={itemLabel}
                                onMove={move}
                                onRemove={remove}
                                className="-my-0.5"
                            />
                        </li>
                    ))}
                </ul>
            ) : null}
            <AddItemButton
                label={`Add ${itemLabel}`}
                onClick={add}
                className={items.length > 0 ? 'mt-3' : ''}
            />
        </div>
    )
}

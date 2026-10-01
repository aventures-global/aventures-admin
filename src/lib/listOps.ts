export function moveItem<T>(items: T[], from: number, to: number): T[] {
    if (to < 0 || to >= items.length) return items
    const next = [...items]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    return next
}

export function replaceItem<T>(items: T[], index: number, value: T): T[] {
    return items.map((item, i) => (i === index ? value : item))
}

export function removeItem<T>(items: T[], index: number): T[] {
    return items.filter((_, i) => i !== index)
}

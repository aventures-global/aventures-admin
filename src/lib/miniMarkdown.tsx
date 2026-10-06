import { Fragment, type ReactNode } from 'react'
import { publicSiteUrl } from './publicSite'

/**
 * Preview copy of the public site's renderer (client/src/lib/miniMarkdown.tsx): blank-line paragraphs,
 * `- ` bullet lists, `**bold**`, `[text](url)`, and `{placeholder}` values. Site-relative links open the
 * live site in a new tab so previews never navigate the admin.
 */

/** Placeholder values as they appear on the public site. */
const previewMarkdownVars: Record<string, string> = {
    fullName: 'AVENtures Global Resources and Travel Agency',
    email: 'admin@aventurestravel.com',
    phone: '+1 (916) 268-7731',
    address: '3419 Arden Way, Sacramento, CA, United States',
}

// Placeholders are filled after parsing, since values like phone numbers contain spaces and parentheses.
const INLINE = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g

function fill(text: string) {
    return text.replace(/\{(\w+)\}/g, (match, key: string) => previewMarkdownVars[key] ?? match)
}

function safeHref(href: string) {
    if (href.startsWith('tel:')) return `tel:${href.slice(4).replace(/[^\d+]/g, '')}`
    if (/^\/(?!\/)/.test(href)) return publicSiteUrl(href)
    if (/^(#|mailto:|https?:\/\/)/.test(href)) return href
    return null
}

function renderInline(text: string, linkClassName: string): ReactNode[] {
    const nodes: ReactNode[] = []
    let last = 0
    for (const match of text.matchAll(INLINE)) {
        const index = match.index ?? 0
        if (index > last) nodes.push(fill(text.slice(last, index)))
        const key = nodes.length
        if (match[1] !== undefined) {
            nodes.push(
                <strong key={key} className="font-medium text-ink">
                    {renderInline(match[1], linkClassName)}
                </strong>,
            )
        } else {
            const label = fill(match[2])
            const href = safeHref(fill(match[3]))
            nodes.push(
                href ? (
                    <a key={key} href={href} target="_blank" rel="noreferrer" className={linkClassName}>
                        {label}
                    </a>
                ) : (
                    label
                ),
            )
        }
        last = index + match[0].length
    }
    if (last < text.length) nodes.push(fill(text.slice(last)))
    return nodes
}

export default function MiniMarkdown({
    text,
    linkClassName = 'font-medium text-royal underline underline-offset-4',
    listClassName = 'list-disc space-y-2 pl-5 marker:text-gold-deep',
}: {
    text: string
    linkClassName?: string
    listClassName?: string
}) {
    const blocks = text
        .replace(/\r\n/g, '\n')
        .split(/\n\s*\n/)
        .map((block) => block.trim())
        .filter(Boolean)

    return (
        <>
            {blocks.map((block, index) => {
                const lines = block.split('\n').map((line) => line.trim())
                if (lines.every((line) => line.startsWith('- '))) {
                    return (
                        <ul key={index} className={listClassName}>
                            {lines.map((line, i) => (
                                <li key={i}>{renderInline(line.slice(2), linkClassName)}</li>
                            ))}
                        </ul>
                    )
                }
                return (
                    <p key={index}>
                        {lines.map((line, i) => (
                            <Fragment key={i}>
                                {i > 0 ? ' ' : null}
                                {renderInline(line, linkClassName)}
                            </Fragment>
                        ))}
                    </p>
                )
            })}
        </>
    )
}

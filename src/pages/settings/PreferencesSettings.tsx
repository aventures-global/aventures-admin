import { Monitor, Moon, RotateCcw, Sun, type LucideIcon } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import Notice from '../../components/cms/faqs/Notice'
import PageHeader from '../../components/PageHeader'
import { useNotice } from '../../hooks/useNotice'
import { usePreferences, useUpdatePreferences } from '../../hooks/useSettings'
import { DEFAULT_PREFERENCES, storedPreferences } from '../../lib/appearance'
import { ghostActionClass } from '../../lib/formStyles'
import type {
    Accent,
    Density,
    FontFace,
    MotionPreference,
    Preferences,
    TextSize,
    Theme,
} from '../../services/userService'

type Option<T extends string> = {
    id: T
    label: string
    description?: string
    icon?: LucideIcon
    swatch?: string
    style?: CSSProperties
}

const THEMES: Option<Theme>[] = [
    { id: 'light', label: 'Light', description: 'Cream pages, matching the public website.', icon: Sun },
    { id: 'dark', label: 'Dark', description: 'Easier on the eyes in low light.', icon: Moon },
    { id: 'system', label: 'Match system', description: 'Follows your device setting.', icon: Monitor },
]

const ACCENTS: Option<Accent>[] = [
    { id: 'royal', label: 'Royal', swatch: '#163765' },
    { id: 'emerald', label: 'Emerald', swatch: '#1f5f4a' },
    { id: 'burgundy', label: 'Burgundy', swatch: '#6b1f33' },
    { id: 'slate', label: 'Slate', swatch: '#334155' },
    { id: 'gold', label: 'Gold', swatch: '#85600a' },
]

const FONTS: Option<FontFace>[] = [
    { id: 'poppins', label: 'Poppins', description: 'The brand default.', style: { fontFamily: '"Poppins", sans-serif' } },
    { id: 'inter', label: 'Inter', description: 'Compact and neutral.', style: { fontFamily: '"Inter", sans-serif' } },
    {
        id: 'system',
        label: 'System',
        description: 'Your device’s own font.',
        style: { fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif' },
    },
    { id: 'serif', label: 'Serif', description: 'Editorial, like the site.', style: { fontFamily: '"Noto Serif", Georgia, serif' } },
]

const TEXT_SIZES: Option<TextSize>[] = [
    { id: 'small', label: 'Small', description: 'Fits more on screen.', style: { fontSize: '0.8rem' } },
    { id: 'default', label: 'Default', description: 'Standard size.', style: { fontSize: '0.9rem' } },
    { id: 'large', label: 'Large', description: 'Easier to read.', style: { fontSize: '1.05rem' } },
]

const DENSITIES: Option<Density>[] = [
    { id: 'comfortable', label: 'Comfortable', description: 'Roomy tables and forms.' },
    { id: 'compact', label: 'Compact', description: 'Tighter rows, more data per screen.' },
]

const MOTIONS: Option<MotionPreference>[] = [
    { id: 'system', label: 'Match system', description: 'Follows your device’s reduce-motion setting.' },
    { id: 'reduce', label: 'Reduce', description: 'Turns off animations and transitions.' },
    { id: 'full', label: 'Full', description: 'Always show animations.' },
]

function OptionGroup<T extends string>({
    label,
    options,
    value,
    onChange,
    columns = 3,
}: {
    label: string
    options: Option<T>[]
    value: T
    onChange: (next: T) => void
    columns?: 2 | 3 | 4 | 5
}) {
    const grid = {
        2: 'sm:grid-cols-2',
        3: 'sm:grid-cols-3',
        4: 'sm:grid-cols-2 lg:grid-cols-4',
        5: 'grid-cols-2 sm:grid-cols-5',
    }[columns]

    return (
        <div className="space-y-2">
            <p className="text-sm text-ink/75">{label}</p>
            <div role="radiogroup" aria-label={label} className={`grid gap-3 ${grid}`}>
                {options.map((option) => {
                    const Icon = option.icon
                    const active = option.id === value
                    return (
                        <button
                            key={option.id}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => onChange(option.id)}
                            className={`flex flex-col items-start gap-1.5 rounded-[3px] border px-3 py-3 text-left transition ${
                                active ? 'border-royal bg-royal/[0.06]' : 'border-royal/15 hover:border-royal/50'
                            }`}
                        >
                            {Icon && <Icon size={18} strokeWidth={1.5} aria-hidden className="text-gold-deep" />}
                            <span className="flex items-center gap-2 text-sm text-ink" style={option.style}>
                                {option.swatch && (
                                    <span
                                        aria-hidden
                                        className="h-4 w-4 shrink-0 rounded-full border border-ink/10"
                                        style={{ backgroundColor: option.swatch }}
                                    />
                                )}
                                {option.label}
                            </span>
                            {option.description && <span className="text-xs text-ink/55">{option.description}</span>}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

function Card({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="paper-card space-y-5 rounded-[3px] p-5">
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-royal">{title}</p>
            {children}
        </section>
    )
}

export default function PreferencesSettings() {
    const { data } = usePreferences()
    const updatePreferences = useUpdatePreferences()
    const [notice, setNotice] = useNotice()
    const prefs = data ?? storedPreferences()

    const save = (input: Partial<Preferences>) =>
        updatePreferences.mutate(input, {
            onError: (err) => setNotice({ tone: 'error', text: err.message }),
        })

    const set =
        <K extends keyof Preferences>(key: K) =>
        (next: Preferences[K]) => {
            if (prefs[key] !== next) save({ [key]: next } as Partial<Preferences>)
        }

    const isDefault = (Object.keys(DEFAULT_PREFERENCES) as (keyof Preferences)[]).every(
        (key) => prefs[key] === DEFAULT_PREFERENCES[key],
    )

    return (
        <div>
            <PageHeader
                eyebrow="Settings"
                title="Preferences"
                description="How the admin site looks for you. Saved to your account, so it follows you to other devices."
            />

            <div className="mt-6 max-w-3xl space-y-5">
                <Notice notice={notice} />

                <Card title="Appearance">
                    <OptionGroup label="Theme" options={THEMES} value={prefs.theme} onChange={set('theme')} />
                    <OptionGroup
                        label="Accent color"
                        options={ACCENTS}
                        value={prefs.accent}
                        onChange={set('accent')}
                        columns={5}
                    />
                    <OptionGroup label="Font" options={FONTS} value={prefs.font} onChange={set('font')} columns={4} />
                </Card>

                <Card title="Display">
                    <OptionGroup
                        label="Text size"
                        options={TEXT_SIZES}
                        value={prefs.textSize}
                        onChange={set('textSize')}
                    />
                    <OptionGroup
                        label="Density"
                        options={DENSITIES}
                        value={prefs.density}
                        onChange={set('density')}
                        columns={2}
                    />
                </Card>

                <Card title="Accessibility">
                    <OptionGroup label="Motion" options={MOTIONS} value={prefs.motion} onChange={set('motion')} />
                </Card>

                <div className="flex justify-end">
                    <button
                        type="button"
                        className={`${ghostActionClass} inline-flex items-center gap-2`}
                        disabled={isDefault || updatePreferences.isPending}
                        onClick={() => save(DEFAULT_PREFERENCES)}
                    >
                        <RotateCcw size={14} strokeWidth={1.75} aria-hidden />
                        Reset to defaults
                    </button>
                </div>
            </div>
        </div>
    )
}

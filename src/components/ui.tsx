import type { ReactNode } from 'react'
import { Moon, Snowflake, Sun } from 'lucide-react'
import { useCamp } from '../i18n/CampState'

/** Segmented toggle. `tone` picks colours for dark (over imagery) or light surfaces. */
export function Seg<T extends string>({
  value,
  onChange,
  options,
  label,
  tone = 'dark',
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string; icon?: ReactNode }[]
  label: string
  tone?: 'dark' | 'light'
}) {
  const wrap = tone === 'dark' ? 'border-white/20 bg-pine-900/60 backdrop-blur-md' : 'border-pine/15 bg-white'
  const idle = tone === 'dark' ? 'text-white/75 hover:text-white' : 'text-pine/70 hover:text-pine'
  return (
    <div role="group" aria-label={label} className={`inline-flex rounded-full border p-[3px] text-[13px] font-semibold ${wrap}`}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
          className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 transition-colors ${o.value === value ? 'bg-cedar text-pine-900 shadow-sm' : idle}`}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function SeasonToggle({ tone }: { tone?: 'dark' | 'light' }) {
  const { season, setSeason, s } = useCamp()
  return (
    <Seg
      tone={tone}
      label={s.header.seasonLabel}
      value={season}
      onChange={setSeason}
      options={[
        { value: 'winter', label: s.seasons.winter, icon: <Snowflake size={14} aria-hidden /> },
        { value: 'summer', label: s.seasons.summer, icon: <Sun size={14} aria-hidden /> },
      ]}
    />
  )
}

export function LangToggle({ tone }: { tone?: 'dark' | 'light' }) {
  const { lang, setLang, s } = useCamp()
  return (
    <Seg
      tone={tone}
      label={s.header.langLabel}
      value={lang}
      onChange={setLang}
      options={[
        { value: 'zh-TW', label: '繁中' },
        { value: 'en', label: 'EN' },
      ]}
    />
  )
}

export function TimeToggle() {
  const { time, setTime, s } = useCamp()
  return (
    <Seg
      label={s.map.timeLabel}
      value={time}
      onChange={setTime}
      options={[
        { value: 'day', label: s.map.morning, icon: <Sun size={14} aria-hidden /> },
        { value: 'dusk', label: s.map.evening, icon: <Moon size={14} aria-hidden /> },
      ]}
    />
  )
}

export function Kicker({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`text-xs font-bold uppercase tracking-[0.2em] text-cedar-600 ${className}`}>{children}</p>
}

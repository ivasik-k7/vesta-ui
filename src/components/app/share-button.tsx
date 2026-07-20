import { Check, Copy, ExternalLink, Link2, Mail, MessageCircle, Send, Share2 } from 'lucide-react'
import {
  type ComponentType,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'

import { useNotify } from '@/lib/notify/context'

interface ShareOption {
  key: string
  label: string
  icon: ComponentType<{ className?: string }>
  dot?: string
  run: (ctx: { link: string; text: string; value: string; copy: (s: string) => void }) => void
}

const openTab = (url: string) => window.open(url, '_blank', 'noopener,noreferrer')
const enc = encodeURIComponent

const OPTIONS: ShareOption[] = [
  { key: 'link', label: 'Copy link', icon: Link2, run: ({ link, copy }) => copy(link) },
  { key: 'address', label: 'Copy address', icon: Copy, run: ({ value, copy }) => copy(value) },
  {
    key: 'email',
    label: 'Email',
    icon: Mail,
    dot: 'bg-sky-400',
    run: ({ text, link }) =>
      openTab(`mailto:?subject=${enc('VESTA on Solana')}&body=${enc(`${text}\n${link}`)}`),
  },
  {
    key: 'x',
    label: 'Share on X',
    icon: Share2,
    dot: 'bg-neutral-300',
    run: ({ text, link }) =>
      openTab(`https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(link)}`),
  },
  {
    key: 'telegram',
    label: 'Telegram',
    icon: Send,
    dot: 'bg-sky-500',
    run: ({ text, link }) => openTab(`https://t.me/share/url?url=${enc(link)}&text=${enc(text)}`),
  },
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    icon: MessageCircle,
    dot: 'bg-emerald-500',
    run: ({ text, link }) => openTab(`https://wa.me/?text=${enc(`${text} ${link}`)}`),
  },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    icon: ExternalLink,
    dot: 'bg-blue-500',
    run: ({ link }) => openTab(`https://www.linkedin.com/sharing/share-offsite/?url=${enc(link)}`),
  },
  {
    key: 'reddit',
    label: 'Reddit',
    icon: ExternalLink,
    dot: 'bg-orange-500',
    run: ({ link, text }) =>
      openTab(`https://www.reddit.com/submit?url=${enc(link)}&title=${enc(text)}`),
  },
]

const MENU_W = 224
const MENU_MAXH = 360
const GAP = 8
const PAD = 8

/** A powerful, viewport-aware share menu. Portaled to <body> and positioned
 *  with fixed coordinates so it never clips inside overflow-hidden cards. */
export function ShareButton({
  value,
  url,
  title = 'VESTA — the living loyalty protocol',
  what = 'Address',
  label = 'Share',
  className,
}: {
  value: string
  url?: string
  title?: string
  what?: string
  label?: string
  /** Overrides the trigger styling entirely (e.g. to render as a card cell). */
  className?: string
}) {
  const { notify } = useNotify()
  const [open, setOpen] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [coords, setCoords] = useState<{ left: number; top: number } | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const place = useCallback(() => {
    const el = triggerRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    let left = r.right - MENU_W
    left = Math.max(PAD, Math.min(left, vw - MENU_W - PAD))
    let top = r.bottom + GAP
    if (top + MENU_MAXH > vh) {
      const above = r.top - GAP - MENU_MAXH
      top = above > PAD ? above : Math.max(PAD, vh - MENU_MAXH - PAD)
    }
    setCoords({ left, top })
  }, [])

  useLayoutEffect(() => {
    if (!open) return
    place()
    const onMove = () => place()
    window.addEventListener('resize', onMove)
    window.addEventListener('scroll', onMove, true)
    return () => {
      window.removeEventListener('resize', onMove)
      window.removeEventListener('scroll', onMove, true)
    }
  }, [open, place])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (triggerRef.current?.contains(t) || menuRef.current?.contains(t)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const link = url ?? (typeof window !== 'undefined' ? window.location.href : value)
  const text = title

  const copy = (s: string, key = 'link') => {
    navigator.clipboard.writeText(s).then(
      () => {
        setCopiedKey(key)
        notify('info', `${key === 'address' ? what : 'Link'} copied`, {
          message: s,
          persist: false,
        })
        setTimeout(() => setCopiedKey(null), 1500)
      },
      () => notify('error', 'Could not copy', { persist: false }),
    )
  }

  const nativeShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url: link })
        setOpen(false)
      }
    } catch {
      // share sheet cancelled — ignore
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={
          className ??
          'inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-muted-foreground text-sm transition-colors hover:border-flame/40 hover:text-flame'
        }
      >
        <Share2 className="size-3.5" aria-hidden />
        {label}
      </button>

      {open && coords
        ? createPortal(
            <div
              ref={menuRef}
              style={{
                position: 'fixed',
                left: coords.left,
                top: coords.top,
                width: MENU_W,
                maxHeight: MENU_MAXH,
              }}
              className="z-[120] animate-in fade-in zoom-in-95 overflow-hidden rounded-xl border border-border bg-popover shadow-2xl"
            >
              <div className="border-border/60 border-b px-4 py-2.5">
                <p className="font-medium text-sm">Share {what.toLowerCase()}</p>
                <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground/70">
                  {value}
                </p>
              </div>
              <div className="scrollbar-flame max-h-72 overflow-y-auto py-1">
                {typeof navigator !== 'undefined' && 'share' in navigator ? (
                  <Row icon={Share2} label="Share via device…" onClick={nativeShare} />
                ) : null}
                {OPTIONS.map((opt) => {
                  const copied = copiedKey === opt.key
                  return (
                    <Row
                      key={opt.key}
                      icon={copied ? Check : opt.icon}
                      label={copied ? 'Copied!' : opt.label}
                      dot={opt.dot}
                      onClick={() => {
                        opt.run({ link, text, value, copy: (s) => copy(s, opt.key) })
                        if (opt.key !== 'link' && opt.key !== 'address') setOpen(false)
                      }}
                    />
                  )
                })}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  )
}

function Row({
  icon: Icon,
  label,
  dot,
  onClick,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  dot?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm transition-colors hover:bg-secondary"
    >
      <span className="relative flex size-4 items-center justify-center">
        <Icon className="size-4 text-muted-foreground" aria-hidden />
        {dot ? (
          <span
            className={`-right-0.5 -top-0.5 absolute size-1.5 rounded-full ${dot}`}
            aria-hidden
          />
        ) : null}
      </span>
      {label}
    </button>
  )
}

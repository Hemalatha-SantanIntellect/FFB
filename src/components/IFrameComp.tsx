import { useState } from 'react'
import { Globe, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'

const PLATFORM_LINKS = {
  DTOP_Local: "http://localhost:3000/",
  DTOP_Live: "https://devdtop.santanintellect.com/" // Note: YouTube requires /embed/ URL to work in iframes
}

export function IFrameComp() {
  const [activeLink, setActiveLink] = useState<'DTOP_Local' | 'DTOP_Live'>('DTOP_Local')

  return (
    <div className="flex flex-col gap-3 mt-4">
      {/* Header with Nav */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500 flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-blue-500 flex items-center justify-center">
             <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
          </div>
          Integration of the Digital Trust Operating Platform
        </h3>

        <div className="flex bg-white p-1 rounded-md border border-neutral-200 shadow-sm">
          <button
            onClick={() => setActiveLink('DTOP_Local')}
            className={cn(
              "px-3 py-1 text-[10px] font-bold uppercase tracking-tight rounded transition-all",
              activeLink === 'DTOP_Local' ? "bg-blue-600 text-white" : "text-neutral-500 hover:bg-neutral-50"
            )}
          >
            DTOP Local
          </button>
          <button
            onClick={() => setActiveLink('DTOP_Live')}
            className={cn(
              "px-3 py-1 text-[10px] font-bold uppercase tracking-tight rounded transition-all",
              activeLink === 'DTOP_Live' ? "bg-blue-600 text-white" : "text-neutral-500 hover:bg-neutral-50"
            )}
          >
            DTOP Live
          </button>
        </div>
      </div>

      {/* Browser Window Container */}
      <div className="w-full overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg">
        <div className="bg-neutral-900 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
              <div className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
            </div>
            <div className="h-4 w-px bg-white/10 mx-1" />
            <div className="flex items-center gap-2 text-neutral-400">
              <Globe className="h-3 w-3" />
              <span className="text-[10px] font-mono tracking-tight uppercase">
                {activeLink === 'DTOP_Local' ? 'secure.dtop.local' : 'secure.dtop.live'}
              </span>
            </div>
          </div>
          <Monitor className="h-3.5 w-3.5 text-neutral-500" />
        </div>
        
        <iframe
          src={PLATFORM_LINKS[activeLink]}
          className="w-full h-[650px] border-none bg-neutral-50"
          title="Digital Trust Operating Platform"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  )
}
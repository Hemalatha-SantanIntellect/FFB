import { useState } from 'react'
import { createPortal } from 'react-dom' // Added for Portal
import { 
  Bot, 
  X, 
  Cpu, 
  Key, 
  Play, 
  CheckCircle2, 
  Zap, 
  ShieldAlert, 
  Loader2 
} from 'lucide-react'
import { cn } from '@/lib/utils'

const AGENT_TYPES = [
  { 
    id: 'health', 
    label: 'Health Monitoring Agent', 
    icon: Zap,
    desc: 'Simulates IoT sensor data that streams into the dashboard corresponding to the asset data retrieved from AGOL.'
  },
  { 
    id: 'security', 
    label: 'Security Monitoring Agent', 
    icon: ShieldAlert,
    desc: 'Simulates Threat, Risk, and Breach data into the dashboard using predictive modeling.'
  }
]

const MODELS = [
  { group: 'Gemini', variants: ['Gemini 1.5 Pro', 'Gemini 1.5 Flash', 'Gemini 1.0 Ultra'] },
  { group: 'GPT', variants: ['GPT-4o', 'GPT-4 Turbo', 'GPT-3.5 Turbo'] },
  { group: 'Claude', variants: ['Claude 3.5 Sonnet', 'Claude 3 Opus', 'Claude 3 Haiku'] }
]

export function AgentConfigModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [agentType, setAgentType] = useState('health')
  const [selectedModel, setSelectedModel] = useState('Gemini 1.5 Pro')
  const [apiKey, setApiKey] = useState('')
  const [status, setStatus] = useState<'idle' | 'running' | 'success'>('idle')

  const handleRunAgent = (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('running')
    
    setTimeout(() => {
      setStatus('success')
      setTimeout(() => {
        setStatus('idle')
        setIsOpen(false)
      }, 2000)
    }, 2500)
  }

  // Define the Modal Content
  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/35 p-4 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-200 text-slate-900">
        
        {status !== 'success' ? (
          <>
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-sky-100 p-2">
                  <Cpu className="h-5 w-5 text-sky-700" />
                </div>
                <div>
                  <h2 className="text-base font-semibold leading-none tracking-tight text-slate-900">Agent Fusion Console</h2>
                  <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Configure Simulation Engine</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="cursor-pointer rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form Container */}
            <form onSubmit={handleRunAgent} className="custom-scrollbar flex-1 space-y-6 overflow-y-auto bg-white p-6">
              <div className="space-y-2">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Agent Purpose</label>
                <select 
                  value={agentType}
                  onChange={(e) => setAgentType(e.target.value)}
                  className="w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 outline-none transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                >
                  {AGENT_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
                <p className="rounded-md border border-slate-200 bg-slate-50 p-3 text-[11px] italic leading-relaxed text-slate-600">
                  {AGENT_TYPES.find(t => t.id === agentType)?.desc}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Inference Model</label>
                <select 
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 outline-none transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                >
                  {MODELS.map(group => (
                    <optgroup key={group.group} label={group.group} className="text-slate-600">
                      {group.variants.map(v => <option key={v} value={v} className="text-slate-800">{v}</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div className="space-y-2 pb-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Provider API Key</label>
                  <span className="text-[9px] font-semibold uppercase tracking-tighter text-sky-700">Encrypted Connection</span>
                </div>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="password"
                    required
                    placeholder="Paste your key here..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-xs font-mono text-slate-800 outline-none transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  />
                </div>
              </div>

              <div className="sticky bottom-0 bg-white pb-2 pt-2">
                <button 
                  type="submit"
                  disabled={status === 'running'}
                  className={cn(
                    'flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white transition-all active:scale-[0.98]',
                    status === 'running'
                      ? 'cursor-not-allowed bg-slate-400'
                      : 'bg-sky-600 shadow-lg shadow-sky-900/15 hover:bg-sky-700',
                  )}
                >
                  {status === 'running' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Initializing streams...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 fill-current" />
                      Run agent simulation
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        ) : (
       /* Success View */
        <div className="relative flex flex-col items-center justify-center bg-white px-10 py-24 text-center animate-in zoom-in-90 duration-300">
        
        {/* The X Button positioned absolutely */}
        <button 
            onClick={() => setIsOpen(false)} 
            className="absolute right-4 top-4 cursor-pointer rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
            <X className="h-5 w-5" />
        </button>

        <div className="mb-6 rounded-full bg-emerald-100 p-5 ring-8 ring-emerald-50">
            <CheckCircle2 className="h-14 w-14 text-emerald-600" />
        </div>
        
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">Simulation Active</h2>
        
        <p className="mt-3 max-w-[280px] text-sm leading-relaxed text-slate-600">
            The <span className="font-semibold text-emerald-700">{selectedModel}</span> engine is now streaming synthetic data into your dashboard.
        </p>
        </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* The Button stays in the header */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-5 z-[120] flex h-12 w-12 items-center justify-center rounded-full bg-sky-600 text-white shadow-[0_10px_25px_-8px_rgba(2,132,199,0.65)] transition-all hover:bg-sky-700 hover:shadow-[0_14px_28px_-10px_rgba(2,132,199,0.7)] focus:outline-none focus:ring-2 focus:ring-sky-300 focus:ring-offset-2 sm:bottom-6 sm:right-6"
        title="Open Agent Fusion Console"
      >
        <Bot className="h-5 w-5" strokeWidth={1.8} />
      </button>

      {/* The Modal is "Teleported" to the Body root */}
      {isOpen && createPortal(modalContent, document.body)}
    </>
  )
}
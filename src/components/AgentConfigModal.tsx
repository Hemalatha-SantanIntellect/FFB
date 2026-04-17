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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-neutral-950/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-200 text-white">
        
        {status !== 'success' ? (
          <>
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-6 py-5 bg-neutral-900">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-sky-500/20 p-2">
                  <Cpu className="h-5 w-5 text-sky-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold tracking-tight text-white leading-none">Agent Fusion Console</h2>
                  <p className="mt-1.5 text-[10px] uppercase tracking-widest text-neutral-400 font-bold">Configure Simulation Engine</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="rounded-full p-1.5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form Container */}
            <form onSubmit={handleRunAgent} className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1 bg-neutral-900">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Agent Purpose</label>
                <select 
                  value={agentType}
                  onChange={(e) => setAgentType(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-neutral-800 px-4 py-2.5 text-sm font-medium outline-none focus:border-sky-500 transition-colors cursor-pointer"
                >
                  {AGENT_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
                <p className="text-[11px] leading-relaxed text-neutral-400 italic bg-white/5 p-3 rounded-md border border-white/5">
                  {AGENT_TYPES.find(t => t.id === agentType)?.desc}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Inference Model</label>
                <select 
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-neutral-800 px-4 py-2.5 text-sm font-medium outline-none focus:border-sky-500 transition-colors cursor-pointer"
                >
                  {MODELS.map(group => (
                    <optgroup key={group.group} label={group.group} className="bg-neutral-800 text-neutral-400">
                      {group.variants.map(v => <option key={v} value={v} className="text-white">{v}</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div className="space-y-2 pb-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Provider API Key</label>
                  <span className="text-[9px] font-bold text-sky-400 uppercase tracking-tighter">Encrypted Connection</span>
                </div>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-500" />
                  <input 
                    type="password"
                    required
                    placeholder="Paste your key here..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-neutral-800 pl-9 pr-4 py-2.5 text-xs font-mono outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
              </div>

              <div className="pt-2 sticky bottom-0 bg-neutral-900 pb-2">
                <button 
                  type="submit"
                  disabled={status === 'running'}
                  className={cn(
                    "flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold transition-all active:scale-[0.98] cursor-pointer",
                    status === 'running' ? "bg-neutral-700 cursor-not-allowed" : "bg-sky-600 hover:bg-sky-500 shadow-lg shadow-sky-900/20"
                  )}
                >
                  {status === 'running' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      INITIALIZING STREAMS...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 fill-current" />
                      RUN AGENT SIMULATION
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        ) : (
       /* Success View */
        <div className="relative flex flex-col items-center justify-center py-24 px-10 text-center animate-in zoom-in-90 duration-300 bg-neutral-900">
        
        {/* The X Button positioned absolutely */}
        <button 
            onClick={() => setIsOpen(false)} 
            className="absolute right-4 top-4 rounded-full p-2 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
            <X className="h-5 w-5" />
        </button>

        <div className="mb-6 rounded-full bg-emerald-500/20 p-5 ring-8 ring-emerald-500/5">
            <CheckCircle2 className="h-14 w-14 text-emerald-400" />
        </div>
        
        <h2 className="text-xl font-bold text-white tracking-tight">Simulation Active</h2>
        
        <p className="mt-3 text-sm text-neutral-400 leading-relaxed max-w-[280px]">
            The <span className="text-emerald-400 font-bold">{selectedModel}</span> engine is now streaming synthetic data into your dashboard.
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
        className="flex h-9 w-9 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-600 hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200 transition-all shadow-sm cursor-pointer"
        title="Agent Configuration"
      >
        <Bot className="h-5 w-5" strokeWidth={1.5} />
      </button>

      {/* The Modal is "Teleported" to the Body root */}
      {isOpen && createPortal(modalContent, document.body)}
    </>
  )
}
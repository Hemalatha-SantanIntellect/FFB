import { useState } from 'react'
import { createPortal } from 'react-dom'
import { 
  Bot, 
  X, 
  Cpu, 
  Key, 
  Play, 
  CheckCircle2, 
  Zap, 
  ShieldAlert, 
  Loader2,
  ExternalLink,
  Hash
} from 'lucide-react'
import { cn } from '@/lib/utils'
import fundingData from '@/data/fin_funding.json'

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
  const [simulationCount, setSimulationCount] = useState(5) // New State for count
  const [apiKey, setApiKey] = useState('')
  const [status, setStatus] = useState<'idle' | 'running' | 'success'>('idle')
  const [simulatedIncidents, setSimulatedIncidents] = useState<any[]>([])

  // Hardcoded Credentials
  const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY; 
  const SN_INSTANCE = 'https://accelareincdemo7.service-now.com';
  const SN_USER = 'gautham_api_interface';
  const SN_PWD = 'AccelareDemo7#';

  const saveSimulatedDataLocally = (data: any[]) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `finley_usa_report_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generateAndSendIncidents = async () => {
    const allCategories = Object.keys(fundingData) as Array<keyof typeof fundingData>;
    const flatAssets: any[] = [];
    const results: any[] = [];

    allCategories.forEach((cat) => {
      fundingData[cat].forEach((item: any) => {
        flatAssets.push({ ...item, assetType: cat });
      });
    });

    const getSimulationFromAI = async (asset: any) => {
      const prompt = `Generate a realistic ServiceNow incident for a ${asset.assetType} with RID ${asset.rid}. 
      Organization: Finley USA.
      Context: The asset is in state ${asset.lifecycle_state} and has sensor: ${asset.sensor_metadata?.sensor_name}.
      Return JSON only: { "short_description": "...", "description": "...", "comments": "...", "impact": "1, 2, or 3", "urgency": "1, 2, or 3", "category": "Hardware or Network or Software" }`;

      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" }
          })
        });
        const data = await res.json();
        return JSON.parse(data.choices[0].message.content);
      } catch (e) {
        return {
          short_description: `Emergency: ${asset.assetType} failure`,
          description: `Critical alert for Finley USA asset ${asset.rid}.`,
          comments: "Generated via fallback.",
          impact: "2",
          urgency: "2",
          category: "Hardware"
        };
      }
    };

    const auth = btoa(`${SN_USER}:${SN_PWD}`);

    // Loop based on user input
    for (let i = 0; i < simulationCount; i++) {
      const randomAsset = flatAssets[Math.floor(Math.random() * flatAssets.length)];
      const aiContent = await getSimulationFromAI(randomAsset);

      const payload = {
        short_description: `${aiContent.short_description}`, // Added tag to description
        description: aiContent.description,
        comments: aiContent.comments,
        impact: aiContent.impact,
        urgency: aiContent.urgency,
        category: aiContent.category,
        company: "Finley USA", // ServiceNow Standard Field
        u_organization: "Finley USA", // Custom field fallback
        correlation_id: randomAsset.guid,
        u_asset_rid: randomAsset.rid,
        cmdb_ci: randomAsset.name_as || randomAsset.rid
      };

      try {
        const response = await fetch(`${SN_INSTANCE}/api/now/table/incident`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(payload)
        });
        
        const snData = await response.json();
        results.push({
          ...payload,
          sys_id: snData.result?.sys_id,
          number: snData.result?.number || `INC-SIM-${i}`
        });
      } catch (err) {
        console.error("SN Post Error", err);
      }
    }

    setSimulatedIncidents(results);
    saveSimulatedDataLocally(results);
  };

  const handleRunAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('running');
    try {
      await generateAndSendIncidents();
      setStatus('success');
    } catch (err) {
      console.error(err);
      setStatus('idle');
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="flex h-[600px] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-200 text-slate-900">
        
        {status !== 'success' ? (
          <>
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
              <button onClick={() => setIsOpen(false)} className="cursor-pointer rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRunAgent} className="flex-1 space-y-6 overflow-y-auto bg-white p-6 custom-scrollbar">
              <div className="space-y-2">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Agent Purpose</label>
                <select value={agentType} onChange={(e) => setAgentType(e.target.value)} className="w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-sky-500">
                  {AGENT_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>

              {/* NEW: Incident Count Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Incident Volume</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="number" 
                    min="1" 
                    max="20"
                    value={isNaN(simulationCount) ? '' : simulationCount}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setSimulationCount(isNaN(val) ? 0 : val); // Fallback to 0
                      }}
                    className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-xs font-mono text-slate-800 outline-none focus:border-sky-500" 
                  />
                </div>
                <p className="text-[10px] text-slate-400">Specify how many Finley USA incidents to generate (Max 20).</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Inference Model</label>
                <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} className="w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-sky-500">
                  {MODELS.map(group => (
                    <optgroup key={group.group} label={group.group}>
                      {group.variants.map(v => <option key={v} value={v}>{v}</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div className="space-y-2 pb-2">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Provider API Key</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input type="password" required placeholder="Paste your key here..." value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-xs font-mono text-slate-800 outline-none focus:border-sky-500" />
                </div>
              </div>

              <div className="sticky bottom-0 bg-white pb-2 pt-2">
                <button type="submit" disabled={status === 'running'} className={cn('flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white transition-all', status === 'running' ? 'bg-slate-400' : 'bg-sky-600 hover:bg-sky-700')}>
                  {status === 'running' ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />Simulating {simulationCount} agents...</>
                  ) : (
                    <><Play className="h-4 w-4 fill-current" />Run {simulationCount} Finley Simulations</>
                  )}
                </button>
              </div>
            </form>
          </>
        ) : (
          /* Success View - Fixes Scroll and Finley Tag */
          <div className="flex flex-col h-full bg-white animate-in zoom-in-95 duration-300">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-4">
               <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <h2 className="text-sm font-bold text-slate-800">Finley USA: Simulation Active</h2>
               </div>
               <button onClick={() => {setIsOpen(false); setStatus('idle');}} className="rounded-full p-1 hover:bg-slate-100">
                  <X className="h-4 w-4 text-slate-400" />
               </button>
            </div>

            {/* Scrollable Container */}
            <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6 custom-scrollbar">
              <div className="mb-6 space-y-3">
                {simulatedIncidents.map((inc, idx) => (
                  <div key={idx} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-sky-300 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black uppercase text-sky-700">{inc.number}</span>
                          <span className="text-[9px] font-medium text-slate-400">FINLEY_USA</span>
                        </div>
                        <h3 className="text-xs font-bold text-slate-900">{inc.short_description}</h3>
                      </div>
                      <div className="rounded bg-slate-100 px-1.5 py-0.5 text-[8px] font-bold text-slate-600">
                        {inc.u_asset_rid}
                      </div>
                    </div>
                    <p className="mt-2 text-[10px] text-slate-500 italic">"{inc.description}"</p>
                    <a 
                      href={`${SN_INSTANCE}/nav_to.do?uri=incident.do?sys_id=${inc.sys_id}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1 text-[9px] font-bold text-sky-600 hover:underline"
                    >
                      View Record <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>
                ))}
              </div>
            </div>

            <div className="shrink-0 border-t border-slate-100 bg-white p-4">
              <button onClick={() => {setIsOpen(false); setStatus('idle');}} className="w-full rounded-lg bg-slate-900 py-3 text-xs font-bold text-white">
                Finish & Close Console
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="fixed bottom-5 right-5 z-[120] flex h-12 w-12 items-center justify-center rounded-full bg-sky-600 text-white shadow-xl hover:bg-sky-700">
        <Bot className="h-5 w-5" />
      </button>
      {isOpen && createPortal(modalContent, document.body)}
    </>
  )
}
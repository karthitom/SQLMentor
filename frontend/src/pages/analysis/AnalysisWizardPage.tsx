import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  Link2, Search, Play, BarChart3, MessageSquare,
  ChevronRight, AlertCircle, CheckCircle, Loader,
  ArrowRight, ExternalLink, Eye,
} from 'lucide-react'
import { analysisApi, workspacesApi, projectsApi } from '@/api/client'
import { useToast } from '@/components/UI/Toast'

const WIZARD_STEPS = [
  { id: 1, label: 'Target URL', icon: Link2 },
  { id: 2, label: 'Discover Inputs', icon: Search },
  { id: 3, label: 'Run Test', icon: Play },
  { id: 4, label: 'AI Explanation', icon: MessageSquare },
]

const step1Schema = z.object({
  project_id: z.string().min(1, 'Please select a project'),
  target_url: z.string()
    .min(1, 'URL is required')
    .url('Please enter a valid URL')
    .refine((url) => url.startsWith('http://') || url.startsWith('https://'), {
      message: 'URL must use http or https',
    }),
  title: z.string().optional(),
})

const step3Schema = z.object({
  parameter_name: z.string().min(1, 'Parameter name is required'),
  parameter_location: z.enum(['query', 'form', 'header', 'cookie', 'json_body']),
  baseline_value: z.string().min(1, 'Baseline value is required'),
  test_value: z.string().min(1, 'Test value is required'),
  request_method: z.enum(['GET', 'POST']),
})

type Step1Form = z.infer<typeof step1Schema>
type Step3Form = z.infer<typeof step3Schema>

interface AnalysisState {
  analysisId: string | null
  parameters: any[]
  comparison: any | null
  aiExplanation: any | null
}

export default function AnalysisWizardPage() {
  const toast = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('')
  const [state, setState] = useState<AnalysisState>({
    analysisId: null, parameters: [], comparison: null, aiExplanation: null,
  })

  const step1Form = useForm<Step1Form>({ resolver: zodResolver(step1Schema) })
  const step3Form = useForm<Step3Form>({ resolver: zodResolver(step3Schema), defaultValues: { request_method: 'GET', parameter_location: 'query' } })

  // Fetch workspaces for the selector
  const { data: workspacesData, isLoading: workspacesLoading } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => workspacesApi.list(),
  })
  const workspaces: any[] = workspacesData?.data || []

  // Fetch projects when a workspace is selected
  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects', selectedWorkspaceId],
    queryFn: () => projectsApi.list(selectedWorkspaceId),
    enabled: !!selectedWorkspaceId,
  })
  const projects: any[] = projectsData?.data || []

  // Clear selected project when workspace changes
  useEffect(() => {
    step1Form.setValue('project_id', '')
  }, [selectedWorkspaceId])

  // Step 1: Create analysis
  const createMutation = useMutation({
    mutationFn: (data: Step1Form) => analysisApi.create(data),
    onSuccess: (res) => {
      setState((s) => ({ ...s, analysisId: res.data.id }))
      setCurrentStep(2)
      toast.success('Analysis created. Discovering parameters...')
      discoverMutation.mutate(res.data.id)
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || 'Failed to create analysis'),
  })

  // Step 2: Discover parameters
  const discoverMutation = useMutation({
    mutationFn: (id: string) => analysisApi.discover(id),
    onSuccess: (res) => {
      setState((s) => ({ ...s, parameters: res.data.parameters || [] }))
      toast.success(`Found ${res.data.parameters_found} input parameter(s)`)
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || 'Parameter discovery failed'),
  })

  // Step 3: Run test
  const testMutation = useMutation({
    mutationFn: (data: Step3Form) => analysisApi.runTest(state.analysisId!, data),
    onSuccess: (res) => {
      setState((s) => ({ ...s, comparison: res.data.comparison, aiExplanation: res.data.ai_explanation }))
      setCurrentStep(4)
      toast.success('Test complete! AI explanation ready.')
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || 'Test failed'),
  })

  const canProceedStep2 = !discoverMutation.isPending
  const canProceedStep3 = state.parameters.length > 0

  return (
    <div>
      {/* Educational Warning */}
      <div className="disclaimer-banner">
        <AlertCircle size={16} style={{ flexShrink: 0 }} />
        <span>
          <strong>⚠️ Authorized Testing Only</strong> — Only analyze systems you own or have
          explicit written authorization to test. The DVWA lab on port 8080 is provided for safe practice.
        </span>
      </div>

      <div className="page-header">
        <h1 className="page-title">Analysis Wizard</h1>
        <p className="page-subtitle">Educational step-by-step SQL injection behavior analysis</p>
      </div>

      {/* Wizard Steps */}
      <div className="wizard-steps" style={{ marginBottom: '2rem' }}>
        {WIZARD_STEPS.map((step, i) => (
          <div key={step.id} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div className={`wizard-step ${currentStep === step.id ? 'active' : ''} ${currentStep > step.id ? 'completed' : ''}`} style={{ flex: 'none' }}>
              <div className="wizard-step-number">
                {currentStep > step.id ? <CheckCircle size={14} /> : step.id}
              </div>
              <div>
                <div className="wizard-step-label">{step.label}</div>
              </div>
            </div>
            {i < WIZARD_STEPS.length - 1 && <div className="wizard-connector" style={{ flex: 1 }} />}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        {/* Step 1 — Target URL */}
        {currentStep === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="card" style={{ padding: '2rem', maxWidth: 640 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Link2 size={18} color="var(--color-primary-400)" />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Target Lab URL</h2>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Enter the URL of your intentionally vulnerable lab application</p>
                </div>
              </div>

              <form onSubmit={step1Form.handleSubmit((data) => createMutation.mutate(data))}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Workspace selector */}
                  <div>
                    <label htmlFor="wizard-workspace" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
                      Workspace <span style={{ color: 'var(--color-danger)' }}>*</span>
                    </label>
                    <select
                      id="wizard-workspace"
                      className="input"
                      value={selectedWorkspaceId}
                      onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                      disabled={workspacesLoading}
                    >
                      <option value="">
                        {workspacesLoading ? 'Loading workspaces...' : '— Select a workspace —'}
                      </option>
                      {workspaces.map((ws: any) => (
                        <option key={ws.id} value={ws.id}>{ws.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Project selector */}
                  <div>
                    <label htmlFor="wizard-project" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
                      Project <span style={{ color: 'var(--color-danger)' }}>*</span>
                    </label>
                    <select
                      id="wizard-project"
                      className={`input ${step1Form.formState.errors.project_id ? 'error' : ''}`}
                      disabled={!selectedWorkspaceId || projectsLoading}
                      {...step1Form.register('project_id')}
                    >
                      <option value="">
                        {!selectedWorkspaceId
                          ? '— Select a workspace first —'
                          : projectsLoading
                          ? 'Loading projects...'
                          : projects.length === 0
                          ? 'No projects in this workspace'
                          : '— Select a project —'}
                      </option>
                      {projects.map((p: any) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    {step1Form.formState.errors.project_id && (
                      <p style={{ color: 'var(--color-danger)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                        {step1Form.formState.errors.project_id.message}
                      </p>
                    )}
                  </div>

                  {/* Target URL */}
                  <div>
                    <label htmlFor="wizard-url" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
                      Lab URL <span style={{ color: 'var(--color-danger)' }}>*</span>
                    </label>
                    <input
                      id="wizard-url"
                      type="url"
                      className={`input ${step1Form.formState.errors.target_url ? 'error' : ''}`}
                      placeholder="http://localhost:8080/dvwa/vulnerabilities/sqli/"
                      {...step1Form.register('target_url')}
                    />
                    {step1Form.formState.errors.target_url && <p style={{ color: 'var(--color-danger)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>{step1Form.formState.errors.target_url.message}</p>}
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.375rem' }}>
                      💡 Use the bundled DVWA lab: <code style={{ fontSize: '0.8125rem', background: 'var(--surface-3)', padding: '0.125rem 0.375rem', borderRadius: 4 }}>http://localhost:8080</code>
                    </p>
                  </div>

                  {/* Title */}
                  <div>
                    <label htmlFor="wizard-title" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
                      Analysis Title (optional)
                    </label>
                    <input id="wizard-title" className="input" placeholder="e.g., DVWA SQL Injection Study" {...step1Form.register('title')} />
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={createMutation.isPending} id="wizard-step1-next">
                    {createMutation.isPending ? <><div className="animate-spin" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%' }} /> Creating...</> : <>Next: Discover Inputs <ChevronRight size={16} /></>}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {/* Step 2 — Parameter Discovery */}
        {currentStep === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="card" style={{ padding: '2rem', maxWidth: 800 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Search size={18} color="var(--color-accent-400)" />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Input Parameter Discovery</h2>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>User-controllable inputs found in the lab application</p>
                </div>
              </div>

              {discoverMutation.isPending ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <div className="animate-spin" style={{ width: 40, height: 40, border: '3px solid var(--surface-4)', borderTop: '3px solid var(--color-accent-500)', borderRadius: '50%', margin: '0 auto 1rem' }} />
                  <p style={{ color: 'var(--text-muted)' }}>Inspecting lab application inputs...</p>
                </div>
              ) : state.parameters.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  <p>No parameters discovered. The lab may require authentication or a different URL.</p>
                </div>
              ) : (
                <>
                  <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--surface-4)' }}>
                          {['Parameter Name', 'Location', 'Sample Value', 'Type'].map((h) => (
                            <th key={h} style={{ padding: '0.625rem 0.875rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {state.parameters.map((p: any, i: number) => (
                          <tr key={i} style={{ borderBottom: '1px solid var(--surface-4)' }}>
                            <td style={{ padding: '0.625rem 0.875rem', fontFamily: 'var(--font-mono)', color: 'var(--color-primary-300)' }}>{p.name}</td>
                            <td style={{ padding: '0.625rem 0.875rem' }}><span className={`badge ${p.location === 'query' ? 'badge-blue' : 'badge-purple'}`}>{p.location}</span></td>
                            <td style={{ padding: '0.625rem 0.875rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>{p.sample_value || '—'}</td>
                            <td style={{ padding: '0.625rem 0.875rem', color: 'var(--text-muted)' }}>{p.type || 'text'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ display: 'flex', gap: '0.875rem' }}>
                    <button className="btn btn-secondary" onClick={() => setCurrentStep(1)}>Back</button>
                    <button className="btn btn-primary" onClick={() => setCurrentStep(3)} id="wizard-step2-next">
                      Next: Run Test <ChevronRight size={16} />
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* Step 3 — Run Test */}
        {currentStep === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', maxWidth: 900 }}>
              <div className="card" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Play size={18} color="var(--color-success)" />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Behavioral Test</h2>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Compare normal vs. modified input responses</p>
                  </div>
                </div>

                <form onSubmit={step3Form.handleSubmit((data) => testMutation.mutate(data))}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>Parameter Name</label>
                      <input className="input" placeholder="id" {...step3Form.register('parameter_name')} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>Location</label>
                      <select className="input" {...step3Form.register('parameter_location')}>
                        <option value="query">Query String</option>
                        <option value="form">Form POST</option>
                        <option value="header">Header</option>
                        <option value="cookie">Cookie</option>
                        <option value="json_body">JSON Body</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>Baseline Value (Normal)</label>
                      <input className="input" placeholder="1" {...step3Form.register('baseline_value')} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>Test Value (Modified)</label>
                      <input className="input" placeholder="1'" {...step3Form.register('test_value')} />
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Used for educational behavioral observation only</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.625rem' }}>
                      <button type="button" className="btn btn-secondary" style={{ flex: '0 0 auto' }} onClick={() => setCurrentStep(2)}>Back</button>
                      <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={testMutation.isPending} id="wizard-run-test-btn">
                        {testMutation.isPending ? <><div className="animate-spin" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%' }} /> Running...</> : <><Play size={15} /> Run Educational Test</>}
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Educational context */}
              <div className="card" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.06), rgba(139,92,246,0.06))', borderColor: 'rgba(59,130,246,0.2)' }}>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>📚 What You're Learning</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  <p>By comparing responses between a normal value and a modified value, you observe <strong style={{ color: 'var(--text-primary)' }}>behavioral differences</strong> caused by improper input handling.</p>
                  <p>Observable indicators include:</p>
                  <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                    <li>HTTP status code changes</li>
                    <li>Response size differences</li>
                    <li>Visible error messages</li>
                    <li>Response time variations</li>
                    <li>Content changes in the body</li>
                  </ul>
                  <p style={{ color: 'var(--color-warning)', fontSize: '0.8125rem' }}>⚠️ Only use on intentionally vulnerable lab applications you control.</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 4 — AI Explanation */}
        {currentStep === 4 && state.aiExplanation && (
          <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div style={{ maxWidth: 900 }}>
              <div className="card" style={{ padding: '2rem', marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(59,130,246,0.05), rgba(139,92,246,0.05))' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, var(--color-primary-700), var(--color-accent-700))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MessageSquare size={18} color="white" />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>AI Educational Explanation</h2>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Powered by SQLMentor AI — for learning only</p>
                  </div>
                </div>

                {/* AI Summary */}
                <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.25rem' }}>
                  <h3 style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: '0.625rem', color: 'var(--color-primary-300)' }}>Summary</h3>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>{state.aiExplanation.summary || 'Analysis complete.'}</p>
                </div>

                {/* Explanation Tabs */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {[
                    { label: '🔍 What Happened', content: state.aiExplanation.what_happened },
                    { label: '💡 Why It Happened', content: state.aiExplanation.why_it_happened },
                    { label: '🔐 Prevention', content: state.aiExplanation.prevention },
                    { label: '📖 Concept', content: state.aiExplanation.concept_demonstrated },
                  ].filter((item) => item.content).map((item) => (
                    <div key={item.label} style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                      <h4 style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>{item.label}</h4>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{item.content}</p>
                    </div>
                  ))}
                </div>

                {/* Key Takeaways */}
                {state.aiExplanation.key_takeaways && (
                  <div style={{ marginTop: '1.25rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                    <h4 style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.625rem', color: '#34d399' }}>✅ Key Takeaways</h4>
                    <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                      {state.aiExplanation.key_takeaways.map((t: string, i: number) => (
                        <li key={i} style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Educational Disclaimer in AI Output */}
                {state.aiExplanation.educational_disclaimer && (
                  <p style={{ marginTop: '1rem', fontSize: '0.8125rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    {state.aiExplanation.educational_disclaimer}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.875rem' }}>
                <button className="btn btn-secondary" onClick={() => setCurrentStep(3)}>Run Another Test</button>
                <button className="btn btn-primary" onClick={() => setCurrentStep(1)} id="wizard-new-analysis-btn">
                  <Play size={15} /> New Analysis
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

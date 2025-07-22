import { create } from 'zustand'
import { persist, devtools } from 'zustand/middleware'
import { AnalysisSession, UploadedFile, AnalysisResult, AnalysisSettings } from './types'

interface KPAnalyzerState {
  // Current session
  currentSession: AnalysisSession | null
  
  // File management
  tzFile: UploadedFile | null
  kpFiles: UploadedFile[]
  
  // Analysis state
  isAnalyzing: boolean
  currentStep: 'upload' | 'analyzing' | 'results'
  analysisProgress: number
  
  // Results
  results: AnalysisResult[]
  
  // History
  sessions: AnalysisSession[]
  
  // Settings
  settings: AnalysisSettings
  
  // Actions - Session management
  createSession: (name?: string) => void
  loadSession: (sessionId: string) => void
  saveSession: () => void
  deleteSession: (sessionId: string) => void
  updateSessionName: (name: string) => void
  
  // Actions - File management
  setTzFile: (file: UploadedFile) => void
  addKpFile: (file: UploadedFile) => void
  removeKpFile: (fileId: string) => void
  clearFiles: () => void
  updateFileStatus: (fileId: string, status: UploadedFile['status']) => void
  
  // Actions - Analysis
  startAnalysis: () => void
  pauseAnalysis: () => void
  cancelAnalysis: () => void
  setAnalysisProgress: (progress: number) => void
  addAnalysisResult: (result: AnalysisResult) => void
  updateAnalysisResult: (resultId: string, updates: Partial<AnalysisResult>) => void
  
  // Actions - Settings
  updateSettings: (settings: Partial<AnalysisSettings>) => void
  
  // Actions - Navigation
  setCurrentStep: (step: 'upload' | 'analyzing' | 'results') => void
  
  // Actions - History
  getSessionHistory: () => AnalysisSession[]
  searchSessions: (query: string) => AnalysisSession[]
  
  // Getters
  getCompletedFiles: () => UploadedFile[]
  getFailedFiles: () => UploadedFile[]
  getTotalFiles: () => number
  getAverageComplianceScore: () => number
  getBestPerformingKP: () => AnalysisResult | null
  getSessionById: (id: string) => AnalysisSession | null
}

const defaultSettings: AnalysisSettings = {
  includeRiskAssessment: true,
  includeContractorResearch: true,
  complianceThreshold: 70,
  language: 'ru',
  reportFormat: 'detailed'
}

export const useKPAnalyzerStore = create<KPAnalyzerState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        currentSession: null,
        tzFile: null,
        kpFiles: [],
        isAnalyzing: false,
        currentStep: 'upload',
        analysisProgress: 0,
        results: [],
        sessions: [],
        settings: defaultSettings,
        
        // Session management
        createSession: (name) => {
          const session: AnalysisSession = {
            id: Date.now().toString(),
            name: name || `Анализ ${new Date().toLocaleDateString()}`,
            createdAt: new Date(),
            updatedAt: new Date(),
            status: 'draft',
            tzFile: null,
            kpFiles: [],
            selectedModel: 'claude-3-5-sonnet',
            results: [],
            settings: get().settings
          }
          
          set((state) => ({
            currentSession: session,
            sessions: [...state.sessions, session],
            tzFile: null,
            kpFiles: [],
            results: [],
            currentStep: 'upload'
          }))
        },
        
        loadSession: (sessionId) => {
          const { sessions } = get()
          const session = sessions.find(s => s.id === sessionId)
          
          if (session) {
            set({
              currentSession: session,
              tzFile: session.tzFile,
              kpFiles: session.kpFiles,
              results: session.results,
              settings: session.settings,
              currentStep: session.results.length > 0 ? 'results' : 'upload'
            })
          }
        },
        
        saveSession: () => {
          const { currentSession, tzFile, kpFiles, results, settings } = get()
          
          if (currentSession) {
            const updatedSession: AnalysisSession = {
              ...currentSession,
              tzFile,
              kpFiles,
              results,
              settings,
              updatedAt: new Date()
            }
            
            set((state) => ({
              currentSession: updatedSession,
              sessions: state.sessions.map(s => 
                s.id === currentSession.id ? updatedSession : s
              )
            }))
          }
        },
        
        deleteSession: (sessionId) => {
          set((state) => ({
            sessions: state.sessions.filter(s => s.id !== sessionId),
            currentSession: state.currentSession?.id === sessionId ? null : state.currentSession
          }))
        },
        
        updateSessionName: (name) => {
          const { currentSession } = get()
          if (currentSession) {
            set((state) => ({
              currentSession: { ...currentSession, name },
              sessions: state.sessions.map(s => 
                s.id === currentSession.id ? { ...s, name } : s
              )
            }))
          }
        },
        
        // File management
        setTzFile: (file) => {
          set({ tzFile: file })
          get().saveSession()
        },
        
        addKpFile: (file) => {
          set((state) => ({
            kpFiles: [...state.kpFiles, file]
          }))
          get().saveSession()
        },
        
        removeKpFile: (fileId) => {
          set((state) => ({
            kpFiles: state.kpFiles.filter(f => f.id !== fileId),
            results: state.results.filter(r => r.fileId !== fileId)
          }))
          get().saveSession()
        },
        
        clearFiles: () => {
          set({
            tzFile: null,
            kpFiles: [],
            results: [],
            currentStep: 'upload'
          })
          get().saveSession()
        },
        
        updateFileStatus: (fileId, status) => {
          set((state) => ({
            tzFile: state.tzFile?.id === fileId ? { ...state.tzFile, status } : state.tzFile,
            kpFiles: state.kpFiles.map(f => 
              f.id === fileId ? { ...f, status } : f
            )
          }))
          get().saveSession()
        },
        
        // Analysis management
        startAnalysis: () => {
          set({ 
            isAnalyzing: true, 
            currentStep: 'analyzing', 
            analysisProgress: 0 
          })
          
          // Update session status
          const { currentSession } = get()
          if (currentSession) {
            set((state) => ({
              currentSession: { ...currentSession, status: 'processing' }
            }))
          }
        },
        
        pauseAnalysis: () => {
          set({ isAnalyzing: false })
        },
        
        cancelAnalysis: () => {
          set({ 
            isAnalyzing: false, 
            currentStep: 'upload', 
            analysisProgress: 0 
          })
        },
        
        setAnalysisProgress: (progress) => {
          set({ analysisProgress: progress })
        },
        
        addAnalysisResult: (result) => {
          set((state) => ({
            results: [...state.results, result]
          }))
          get().saveSession()
        },
        
        updateAnalysisResult: (resultId, updates) => {
          set((state) => ({
            results: state.results.map(r => 
              r.id === resultId ? { ...r, ...updates } : r
            )
          }))
          get().saveSession()
        },
        
        // Settings
        updateSettings: (updates) => {
          set((state) => ({
            settings: { ...state.settings, ...updates }
          }))
          get().saveSession()
        },
        
        // Navigation
        setCurrentStep: (step) => {
          set({ currentStep: step })
        },
        
        // History
        getSessionHistory: () => {
          const { sessions } = get()
          return sessions.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        },
        
        searchSessions: (query) => {
          const { sessions } = get()
          return sessions.filter(session => 
            session.name.toLowerCase().includes(query.toLowerCase()) ||
            session.tzFile?.name.toLowerCase().includes(query.toLowerCase()) ||
            session.kpFiles.some(f => f.name.toLowerCase().includes(query.toLowerCase()))
          )
        },
        
        // Getters
        getCompletedFiles: () => {
          const { kpFiles } = get()
          return kpFiles.filter(f => f.status === 'success')
        },
        
        getFailedFiles: () => {
          const { kpFiles } = get()
          return kpFiles.filter(f => f.status === 'error')
        },
        
        getTotalFiles: () => {
          const { kpFiles } = get()
          return kpFiles.length
        },
        
        getAverageComplianceScore: () => {
          const { results } = get()
          if (results.length === 0) return 0
          
          const total = results.reduce((sum, r) => sum + r.complianceScore, 0)
          return Math.round(total / results.length)
        },
        
        getBestPerformingKP: () => {
          const { results } = get()
          if (results.length === 0) return null
          
          return results.reduce((best, current) => 
            current.complianceScore > best.complianceScore ? current : best
          )
        },
        
        getSessionById: (id) => {
          const { sessions } = get()
          return sessions.find(s => s.id === id) || null
        }
      }),
      {
        name: 'kp-analyzer-storage',
        partialize: (state) => ({ 
          sessions: state.sessions,
          settings: state.settings
        })
      }
    ),
    { name: 'kp-analyzer-store' }
  )
)
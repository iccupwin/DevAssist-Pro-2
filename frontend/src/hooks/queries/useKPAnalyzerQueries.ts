import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { queryKeys } from '../../services/queryClient'
import { AnalysisSession, AnalysisResult, UploadedFile, AnalysisSettings } from '../../stores/types'

// Mock KP Analyzer API service
const kpAnalyzerApi = {
  getSessions: async (page = 0, limit = 10): Promise<{ sessions: AnalysisSession[], total: number, hasMore: boolean }> => {
    await new Promise(resolve => setTimeout(resolve, 800))
    
    const allSessions: AnalysisSession[] = Array.from({ length: 25 }, (_, i) => ({
      id: `session-${i + 1}`,
      name: `Анализ КП ${i + 1}`,
      createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - i * 12 * 60 * 60 * 1000),
      status: ['completed', 'processing', 'failed', 'draft'][i % 4] as any,
      tzFile: {
        id: `tz-${i + 1}`,
        name: `TZ_${i + 1}.pdf`,
        size: 1024 * 1024,
        type: 'application/pdf',
        uploadedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        status: 'success'
      },
      kpFiles: Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, j) => ({
        id: `kp-${i + 1}-${j + 1}`,
        name: `KP_${i + 1}_${j + 1}.pdf`,
        size: 512 * 1024,
        type: 'application/pdf',
        uploadedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        status: 'success'
      })),
      selectedModel: ['claude-3-5-sonnet', 'gpt-4o', 'claude-3-haiku'][i % 3],
      results: [],
      settings: {
        includeRiskAssessment: true,
        includeContractorResearch: true,
        complianceThreshold: 70,
        language: 'ru',
        reportFormat: 'detailed'
      }
    }))
    
    const start = page * limit
    const end = start + limit
    const sessions = allSessions.slice(start, end)
    
    return {
      sessions,
      total: allSessions.length,
      hasMore: end < allSessions.length
    }
  },
  
  getSession: async (sessionId: string): Promise<AnalysisSession> => {
    await new Promise(resolve => setTimeout(resolve, 600))
    
    return {
      id: sessionId,
      name: `Анализ КП ${sessionId}`,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      status: 'completed',
      tzFile: {
        id: 'tz-1',
        name: 'TZ_Project.pdf',
        size: 1024 * 1024,
        type: 'application/pdf',
        uploadedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        status: 'success'
      },
      kpFiles: [
        {
          id: 'kp-1',
          name: 'KP_Company_A.pdf',
          size: 512 * 1024,
          type: 'application/pdf',
          uploadedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          status: 'success'
        }
      ],
      selectedModel: 'claude-3-5-sonnet',
      results: [
        {
          id: 'result-1',
          fileId: 'kp-1',
          fileName: 'KP_Company_A.pdf',
          complianceScore: 87,
          status: 'completed',
          findings: [
            {
              category: 'Техническая совместимость',
              score: 85,
              status: 'compliant',
              details: ['Соответствует основным требованиям', 'Некоторые детали требуют уточнения'],
              requirements: ['Использование современных технологий', 'Соответствие стандартам'],
              gaps: ['Отсутствует детализация по безопасности']
            }
          ],
          summary: 'Высокий уровень соответствия техническому заданию',
          risks: [
            {
              level: 'medium',
              category: 'Технический',
              description: 'Недостаточная детализация в некоторых разделах',
              impact: 'Может потребоваться дополнительное согласование',
              mitigation: 'Запросить дополнительные технические спецификации'
            }
          ],
          recommendations: [
            'Запросить детализацию по системе безопасности',
            'Уточнить сроки выполнения отдельных этапов'
          ],
          processedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
          processingTime: 45000
        }
      ],
      settings: {
        includeRiskAssessment: true,
        includeContractorResearch: true,
        complianceThreshold: 70,
        language: 'ru',
        reportFormat: 'detailed'
      }
    }
  },
  
  createSession: async (data: { name: string; settings?: Partial<AnalysisSettings> }): Promise<AnalysisSession> => {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return {
      id: `session-${Date.now()}`,
      name: data.name,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'draft',
      tzFile: null,
      kpFiles: [],
      selectedModel: 'claude-3-5-sonnet',
      results: [],
      settings: {
        includeRiskAssessment: true,
        includeContractorResearch: true,
        complianceThreshold: 70,
        language: 'ru',
        reportFormat: 'detailed',
        ...data.settings
      }
    }
  },
  
  updateSession: async (sessionId: string, updates: Partial<AnalysisSession>): Promise<AnalysisSession> => {
    await new Promise(resolve => setTimeout(resolve, 400))
    
    const current = await kpAnalyzerApi.getSession(sessionId)
    return { ...current, ...updates, updatedAt: new Date() }
  },
  
  deleteSession: async (sessionId: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 300))
  },
  
  uploadFile: async (file: File, sessionId: string): Promise<UploadedFile> => {
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    return {
      id: `file-${Date.now()}`,
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date(),
      status: 'success',
      url: `https://storage.devassist.pro/files/${sessionId}/${file.name}`
    }
  },
  
  startAnalysis: async (sessionId: string): Promise<{ analysisId: string }> => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    return {
      analysisId: `analysis-${Date.now()}`
    }
  },
  
  getAnalysisStatus: async (analysisId: string): Promise<{ status: 'processing' | 'completed' | 'failed'; progress: number }> => {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return {
      status: 'processing',
      progress: Math.floor(Math.random() * 100)
    }
  },
  
  getAnalysisResults: async (sessionId: string): Promise<AnalysisResult[]> => {
    await new Promise(resolve => setTimeout(resolve, 800))
    
    return [
      {
        id: 'result-1',
        fileId: 'kp-1',
        fileName: 'KP_Company_A.pdf',
        complianceScore: 87,
        status: 'completed',
        findings: [
          {
            category: 'Техническая совместимость',
            score: 85,
            status: 'compliant',
            details: ['Соответствует основным требованиям'],
            requirements: ['Использование современных технологий'],
            gaps: ['Отсутствует детализация по безопасности']
          }
        ],
        summary: 'Высокий уровень соответствия техническому заданию',
        risks: [],
        recommendations: ['Запросить детализацию по системе безопасности'],
        processedAt: new Date(),
        processingTime: 45000
      }
    ]
  },
  
  searchSessions: async (query: string): Promise<AnalysisSession[]> => {
    await new Promise(resolve => setTimeout(resolve, 600))
    
    const { sessions } = await kpAnalyzerApi.getSessions(0, 100)
    return sessions.filter(session => 
      session.name.toLowerCase().includes(query.toLowerCase()) ||
      session.tzFile?.name.toLowerCase().includes(query.toLowerCase()) ||
      session.kpFiles.some(f => f.name.toLowerCase().includes(query.toLowerCase()))
    )
  }
}

// Infinite query for sessions list
export const useKPAnalyzerSessions = () => {
  return useInfiniteQuery({
    queryKey: queryKeys.kpAnalyzer.sessions,
    queryFn: ({ pageParam = 0 }) => kpAnalyzerApi.getSessions(pageParam, 10),
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length : undefined
    },
    initialPageParam: 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Single session query
export const useKPAnalyzerSession = (sessionId: string) => {
  return useQuery({
    queryKey: queryKeys.kpAnalyzer.session(sessionId),
    queryFn: () => kpAnalyzerApi.getSession(sessionId),
    enabled: !!sessionId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Create session mutation
export const useCreateKPAnalyzerSession = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: kpAnalyzerApi.createSession,
    onSuccess: (data) => {
      // Update sessions cache
      queryClient.invalidateQueries({ queryKey: queryKeys.kpAnalyzer.sessions })
      // Set the new session data
      queryClient.setQueryData(queryKeys.kpAnalyzer.session(data.id), data)
    },
    onError: (error) => {
      console.error('Failed to create session:', error)
    }
  })
}

// Update session mutation
export const useUpdateKPAnalyzerSession = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ sessionId, updates }: { sessionId: string; updates: Partial<AnalysisSession> }) => 
      kpAnalyzerApi.updateSession(sessionId, updates),
    onSuccess: (data) => {
      // Update specific session cache
      queryClient.setQueryData(queryKeys.kpAnalyzer.session(data.id), data)
      // Invalidate sessions list
      queryClient.invalidateQueries({ queryKey: queryKeys.kpAnalyzer.sessions })
    },
    onError: (error) => {
      console.error('Failed to update session:', error)
    }
  })
}

// Delete session mutation
export const useDeleteKPAnalyzerSession = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: kpAnalyzerApi.deleteSession,
    onSuccess: (_, sessionId) => {
      // Remove from sessions cache
      queryClient.invalidateQueries({ queryKey: queryKeys.kpAnalyzer.sessions })
      // Remove specific session cache
      queryClient.removeQueries({ queryKey: queryKeys.kpAnalyzer.session(sessionId) })
    },
    onError: (error) => {
      console.error('Failed to delete session:', error)
    }
  })
}

// File upload mutation
export const useUploadFile = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ file, sessionId }: { file: File; sessionId: string }) => 
      kpAnalyzerApi.uploadFile(file, sessionId),
    onSuccess: (data, variables) => {
      // Invalidate session data to refresh file list
      queryClient.invalidateQueries({ queryKey: queryKeys.kpAnalyzer.session(variables.sessionId) })
    },
    onError: (error) => {
      console.error('Failed to upload file:', error)
    }
  })
}

// Start analysis mutation
export const useStartAnalysis = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: kpAnalyzerApi.startAnalysis,
    onSuccess: (data, sessionId) => {
      // Invalidate session to update status
      queryClient.invalidateQueries({ queryKey: queryKeys.kpAnalyzer.session(sessionId) })
      // Start polling for analysis status
      queryClient.invalidateQueries({ queryKey: queryKeys.kpAnalyzer.analysis(sessionId) })
    },
    onError: (error) => {
      console.error('Failed to start analysis:', error)
    }
  })
}

// Analysis results query
export const useAnalysisResults = (sessionId: string) => {
  return useQuery({
    queryKey: queryKeys.kpAnalyzer.results(sessionId),
    queryFn: () => kpAnalyzerApi.getAnalysisResults(sessionId),
    enabled: !!sessionId,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 5 * 1000, // Refetch every 5 seconds when analysis is running
  })
}

// Search sessions query
export const useSearchSessions = (query: string) => {
  return useQuery({
    queryKey: [...queryKeys.kpAnalyzer.sessions, 'search', query],
    queryFn: () => kpAnalyzerApi.searchSessions(query),
    enabled: query.length > 2, // Only search if query is longer than 2 characters
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

// Combined hook for KP Analyzer dashboard
export const useKPAnalyzerDashboard = () => {
  const sessions = useKPAnalyzerSessions()
  
  return {
    sessions,
    isLoading: sessions.isLoading,
    error: sessions.error,
    hasMore: sessions.hasNextPage,
    fetchMore: sessions.fetchNextPage,
    isFetchingMore: sessions.isFetchingNextPage
  }
}
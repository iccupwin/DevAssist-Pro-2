/**
 * WebSocket Service for Real-time Analysis Progress Updates
 * 
 * Provides real-time progress updates during comprehensive AI analysis
 */

import { getBackendApiUrl } from '../../config/app';

export interface AnalysisProgressMessage {
  type: 'progress' | 'completed' | 'error' | 'keepalive';
  stage?: string;
  message?: string;
  progress?: number;
  result?: any;
  error?: string;
  timestamp: string;
}

export interface AnalysisProgressCallbacks {
  onProgress?: (stage: string, message: string, progress: number) => void;
  onCompleted?: (result: any) => void;
  onError?: (error: string) => void;
  onDisconnected?: () => void;
}

class AnalysisWebSocketService {
  private connections: Map<string, WebSocket> = new Map();
  private callbacks: Map<string, AnalysisProgressCallbacks> = new Map();

  /**
   * Start analysis with real-time progress updates
   */
  async startAnalysisWithProgress(
    prompt: string,
    callbacks: AnalysisProgressCallbacks,
    model: string = 'claude-3-5-sonnet-20241022'
  ): Promise<string> {
    // Start the analysis
    const response = await fetch(`${getBackendApiUrl()}/api/llm/analyze-with-progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        model,
        max_tokens: 2000,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to start analysis: ${response.status}`);
    }

    const result = await response.json();
    const analysisId = result.analysis_id;

    if (!analysisId) {
      throw new Error('No analysis ID returned from server');
    }

    // Connect to WebSocket for progress updates
    this.connectToAnalysis(analysisId, callbacks);

    return analysisId;
  }

  /**
   * Connect to WebSocket for specific analysis
   */
  private connectToAnalysis(analysisId: string, callbacks: AnalysisProgressCallbacks) {
    const backendUrl = getBackendApiUrl();
    const wsUrl = backendUrl.replace('http', 'ws');
    
    console.log(`🔌 Connecting to WebSocket: ${wsUrl}/ws/analysis/${analysisId}`);
    
    const ws = new WebSocket(`${wsUrl}/ws/analysis/${analysisId}`);
    
    ws.onopen = () => {
      console.log(`✅ WebSocket connected for analysis ${analysisId}`);
      
      // Send initial ping to establish connection
      ws.send('ping');
    };
    
    ws.onmessage = (event) => {
      try {
        const message: AnalysisProgressMessage = JSON.parse(event.data);
        
        switch (message.type) {
          case 'progress':
            if (callbacks.onProgress && message.stage && message.message && message.progress !== undefined) {
              callbacks.onProgress(message.stage, message.message, message.progress);
            }
            break;
            
          case 'completed':
            if (callbacks.onCompleted && message.result) {
              callbacks.onCompleted(message.result);
            }
            // Close connection after completion
            this.disconnect(analysisId);
            break;
            
          case 'error':
            if (callbacks.onError && message.error) {
              callbacks.onError(message.error);
            }
            this.disconnect(analysisId);
            break;
            
          case 'keepalive':
            // Send pong response to keep connection alive
            if (ws.readyState === WebSocket.OPEN) {
              ws.send('pong');
            }
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    ws.onclose = (event) => {
      console.log(`🔌 WebSocket closed for analysis ${analysisId}`, event.code);
      this.connections.delete(analysisId);
      this.callbacks.delete(analysisId);
      
      if (callbacks.onDisconnected) {
        callbacks.onDisconnected();
      }
    };
    
    ws.onerror = (error) => {
      console.error(`❌ WebSocket error for analysis ${analysisId}:`, error);
      if (callbacks.onError) {
        callbacks.onError(`WebSocket connection failed`);
      }
      this.disconnect(analysisId);
    };
    
    // Store connection and callbacks
    this.connections.set(analysisId, ws);
    this.callbacks.set(analysisId, callbacks);
  }

  /**
   * Disconnect specific analysis WebSocket
   */
  disconnect(analysisId: string) {
    const ws = this.connections.get(analysisId);
    if (ws) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      this.connections.delete(analysisId);
      this.callbacks.delete(analysisId);
    }
  }

  /**
   * Disconnect all active connections
   */
  disconnectAll() {
    for (const [analysisId, ws] of this.connections.entries()) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    }
    this.connections.clear();
    this.callbacks.clear();
  }

  /**
   * Check if analysis WebSocket is connected
   */
  isConnected(analysisId: string): boolean {
    const ws = this.connections.get(analysisId);
    return ws ? ws.readyState === WebSocket.OPEN : false;
  }

  /**
   * Get number of active connections
   */
  getActiveConnectionsCount(): number {
    return this.connections.size;
  }
}

export const analysisWebSocketService = new AnalysisWebSocketService();
export default analysisWebSocketService;
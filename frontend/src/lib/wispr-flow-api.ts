// WISPR Flow WebSocket API Integration
// Based on: https://api-docs.wisprflow.ai/websocket_api

export interface WisprFlowConfig {
  apiKey: string;
  onSegment?: (text: string, isFinal: boolean) => void;
  onError?: (error: any) => void;
  onStart?: () => void;
  onStop?: () => void;
}

export class WisprFlowAPI {
  private ws: WebSocket | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private config: WisprFlowConfig;
  private isRecording = false;

  constructor(config: WisprFlowConfig) {
    this.config = config;
  }

  async start(): Promise<void> {
    try {
      console.log("🎤 Starting WISPR Flow WebSocket connection...");
      
      // Get microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });

      // Connect to WISPR Flow WebSocket
      this.ws = new WebSocket('wss://api.wisprflow.ai/websocket');
      
      this.ws.onopen = () => {
        console.log("🎤 WISPR Flow WebSocket connected");
        
        // Send authentication
        this.ws?.send(JSON.stringify({
          type: 'auth',
          api_key: this.config.apiKey
        }));

        // Start recording audio
        this.startRecording();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("🎤 WISPR Flow response:", data);
          
          if (data.type === 'transcript') {
            this.config.onSegment?.(data.text, data.is_final);
          } else if (data.type === 'error') {
            this.config.onError?.(data.error);
          }
        } catch (e) {
          console.error("Error parsing WISPR Flow response:", e);
        }
      };

      this.ws.onerror = (error) => {
        console.error("🎤 WISPR Flow WebSocket error:", error);
        this.config.onError?.(error);
      };

      this.ws.onclose = () => {
        console.log("🎤 WISPR Flow WebSocket disconnected");
        this.stopRecording();
      };

      this.config.onStart?.();

    } catch (error) {
      console.error("🎤 WISPR Flow initialization error:", error);
      this.config.onError?.(error);
      throw error;
    }
  }

  private startRecording(): void {
    if (!this.stream || this.isRecording) return;

    console.log("🎤 Starting audio recording...");
    
    // Create MediaRecorder with WAV format
    const options = {
      mimeType: 'audio/webm;codecs=opus',
      audioBitsPerSecond: 16000
    };

    this.mediaRecorder = new MediaRecorder(this.stream, options);
    
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0 && this.ws?.readyState === WebSocket.OPEN) {
        // Convert audio to base64 and send to WISPR Flow
        this.sendAudioData(event.data);
      }
    };

    this.mediaRecorder.start(100); // Send data every 100ms
    this.isRecording = true;
  }

  private async sendAudioData(audioBlob: Blob): Promise<void> {
    try {
      // Convert to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      // Send to WISPR Flow
      this.ws?.send(JSON.stringify({
        type: 'audio',
        data: base64Audio,
        format: 'webm'
      }));
    } catch (error) {
      console.error("Error sending audio data:", error);
    }
  }

  stop(): void {
    console.log("🎤 Stopping WISPR Flow...");
    
    this.stopRecording();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    this.config.onStop?.();
  }

  private stopRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      console.log("🎤 Audio recording stopped");
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

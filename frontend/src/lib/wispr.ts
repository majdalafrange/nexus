import { useEffect, useRef, useState, useCallback } from "react";

type Opts = {
  onTranscriptFinal?: (t: string) => void;
  onStart?: () => void;
  onStop?: () => void;
};

type UseWisprReturn = {
  startPTT: () => void;
  stopPTT: () => void;
  isFallback: boolean;
  isDictating: boolean;
  builderWords: string[];
  error: string | null;
  supported: boolean;
};

export function useWispr(opts: Opts): UseWisprReturn {
  const [isFallback, setFallback] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState<boolean>(true);
  const [isDictating, setIsDictating] = useState(false);

  const recRef = useRef<any>(null);
  const wisprFlowRef = useRef<any>(null);
  const listeningRef = useRef(false);
  const partialRef = useRef("");
  const hadFinalRef = useRef(false);

  useEffect(() => {
    // Check for Web Speech API support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.log("🎤 Web Speech API not supported");
      setSupported(false);
      setError("Speech recognition not supported in this browser");
      return;
    }

    console.log("🎤 Using Web Speech API for speech recognition");
    setFallback(true);
    setSupported(true);
    
    // Initialize speech recognition
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    recognition.onstart = () => {
      console.log('🎤 Speech recognition started');
      listeningRef.current = true;
      setIsDictating(true);
      opts.onStart?.();
    };
    
    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      
      if (finalTranscript) {
        console.log('🎤 Final transcript:', finalTranscript);
        opts.onTranscriptFinal?.(finalTranscript);
        hadFinalRef.current = true;
      }
      
      if (interimTranscript) {
        console.log('🎤 Interim transcript:', interimTranscript);
        partialRef.current = interimTranscript;
      }
    };
    
    recognition.onerror = (event: any) => {
      console.error('🎤 Speech recognition error:', event.error);
      setError(`Speech recognition error: ${event.error}`);
      listeningRef.current = false;
      setIsDictating(false);
      opts.onStop?.();
    };
    
     recognition.onend = () => {
       console.log('🎤 Speech recognition ended');
       // Only auto-stop if we weren't manually stopped
       if (listeningRef.current) {
         // If user released before a final result, flush the latest interim
         if (!hadFinalRef.current && partialRef.current.trim().length > 0) {
           console.log('🎤 Flushing interim transcript:', partialRef.current);
           opts.onTranscriptFinal?.(partialRef.current);
           partialRef.current = "";
         }
         listeningRef.current = false;
         setIsDictating(false);
         opts.onStop?.();
       }
     };
    
    recRef.current = recognition;
    
    return () => {
      if (recRef.current) {
        recRef.current.stop();
      }
    };
  }, []);

  async function ensureMicPermission() {
    // Not needed for Web Speech API
    return true;
  }

  async function startPTT() {
    if (listeningRef.current || !recRef.current) return;
    
    try {
      console.log("🎤 Starting speech recognition...");
      hadFinalRef.current = false;
      partialRef.current = "";
      recRef.current.start();
    } catch (e) {
      console.error("Error starting speech recognition:", e);
      setError("Failed to start speech recognition");
    }
  }

   function stopPTT() {
     if (!listeningRef.current || !recRef.current) return;
     
     try {
       console.log("🎤 Stopping speech recognition...");
       listeningRef.current = false;
       
       // Flush any interim transcript before stopping
       if (!hadFinalRef.current && partialRef.current.trim().length > 0) {
         console.log('🎤 Flushing final interim transcript:', partialRef.current);
         opts.onTranscriptFinal?.(partialRef.current);
         partialRef.current = "";
       }
       
       recRef.current.stop();
       setIsDictating(false);
       opts.onStop?.();
     } catch (e) {
       console.error("Error stopping speech recognition:", e);
       listeningRef.current = false;
       setIsDictating(false);
       opts.onStop?.();
     }
   }

  return {
    startPTT,
    stopPTT,
    isFallback,
    isDictating,
    builderWords: [], // Not using word counter
    error,
    supported,
  };
}

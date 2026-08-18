/** Web Speech API helper for JARVIS Voice Control & Synthesis */

export interface SpeechRecognitionResultHandler {
  onResult: (transcript: string) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

export class JarvisSpeechService {
  private recognition: any = null;

  constructor() {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = "en-US";
      }
    }
  }

  public isSupported(): boolean {
    return this.recognition !== null;
  }

  public startListening(handlers: SpeechRecognitionResultHandler): void {
    if (!this.recognition) {
      if (handlers.onError) handlers.onError("Speech recognition is not supported in this browser.");
      return;
    }

    this.recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      handlers.onResult(transcript);
    };

    this.recognition.onerror = (event: any) => {
      if (handlers.onError) handlers.onError(event.error);
    };

    this.recognition.onend = () => {
      if (handlers.onEnd) handlers.onEnd();
    };

    try {
      this.recognition.start();
    } catch {
      // If recognition is already running
    }
  }

  public stopListening(): void {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Ignore
      }
    }
  }

  public speak(text: string, onEnd?: () => void): void {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    // Clean markdown formatting before speaking
    const cleanText = text
      .replace(/\*\*/g, "")
      .replace(/\[/g, "")
      .replace(/\]/g, "")
      .replace(/•/g, "")
      .replace(/✔/g, "")
      .replace(/✓/g, "");

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 0.95; // Futuristic slightly deeper AI voice tone

    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(
      (v) => v.lang.includes("en") && (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Male"))
    ) || voices.find((v) => v.lang.includes("en"));

    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    if (onEnd) {
      utterance.onend = onEnd;
    }

    window.speechSynthesis.speak(utterance);
  }

  public stopSpeaking(): void {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const jarvisSpeech = new JarvisSpeechService();

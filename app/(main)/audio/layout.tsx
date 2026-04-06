"use client"
import { useEffect, useRef, useState, useMemo } from "react";
import GreetingMessage from "@/components/features/GreetingMessage";
import RenderPageContent from "@/components/RenderPageContent";
import { Button } from "@/components/ui/button";
import { FileUploadButton } from "@/components/ui/file-upload-button";
import { MicButton } from "@/components/ui/MicButton";
import { Textarea } from "@/components/ui/textarea";
import { ALLOWED_FILE_TYPES, cn, validateFile } from "@/lib/utils";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { Headphones, MicVocal, Upload, FileAudio, Router, Play, Pause, Loader, Trash2, CloudUpload } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { UploadedFile } from "@/lib/types";
import { FilePreview } from "@/components/ui/file-preview";
import { useContentStore, useHistoryStore, useSelectedModelsStore, useSidebarStore, useStreamingTitlesStore, useUsageRestrictionsStore } from "@/stores";
import { useConversationStore, useModelsStore } from "@/stores/models";
import { modelsApi } from "@/lib/api/models";
import { audioApi } from "@/lib/api/audio";
import { chatApi } from "@/lib/api/chat";
import { useAudioTabStore } from "@/stores/audioTabStore";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { processFile } from "@/lib/fileProcessing";
import { usePathname } from "next/navigation";
import { historyApi } from "@/lib/api/history";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { useAudioCategorySelectionStore } from "@/stores/audioCategorySelectionStore";
import { RestrictionWarning } from "@/components/ui/restriction-warning";
import { ModelSelectionModal } from "@/components/ui/modals/model-selection-modal";
import { PromptModal } from "@/components/ui/modals";

// Audio file types
// const AUDIO_FILE_TYPES = [
//   "mp3", "mp4", "mp4a", "mov", "aac", "wav", "ogg", 
//   "opus", "mpeg", "wma", "wmv"
// ];

const AUDIO_FILE_TYPES = [
  "mp3", "wav",
];

// Create a filtered version instead of deleting
const CHAT_ALLOWED_FILE_TYPES = Object.fromEntries(
  Object.entries(ALLOWED_FILE_TYPES).filter(([type]) => 
    !type.startsWith('audio/') && type !== 'video/mp4' && !type.startsWith('image/')
  )
) as typeof ALLOWED_FILE_TYPES;

// Animation variants for smooth transitions
const fadeVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.3 } }
};

// static options
const options = [
    {
      label: "Generate a cinematic soundtrack",
      icon: <Headphones className="w-4 h-4 text-yellow-500" />,
      description: "Create dramatic music with epic orchestral sounds"
    },
    {
      label: "Create a lo-fi chill beats track",
      icon: <MicVocal className="w-4 h-4 text-blue-400" />,
      description: "Generate a smooth and mellow lo-fi music track for studying or relaxation"
    },
  ];

// Voice options for gpt-4o-mini-tts model
const VOICE_OPTIONS = ["alloy", "ash", "ballad", "coral", "echo", "fable", "nova", "onyx", "sage"];
const OUTPUT_FORMAT_OPTIONS = ["mp3", "wav", "aac"];


// TTS Model parameters type
type TTSModelParams = {
  voice: string;
  voice_instructions: string;
  speed: number;
  output_format: string;
};

interface ModelInputParams {
  voices?: string[];
  output_formats?: string[];
  speed?: string[];
  voice_instructions?: boolean;
  [key: string]: any; // Allow for other parameters we might not know about
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { setContent } = useContentStore();
  const [prompt, setPrompt] = useState("");
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showModelPrompt, setShowModelPrompt] = useState(false);
  const [modelSelectionModalOpen, setModelSelectionModalOpen] = useState(false);
  const { selectedModels } = useSelectedModelsStore();
  const { audioModels, setAudioModels, setLoading: setModelsLoading, setError: setModelsError } = useModelsStore();
  const { addHistory, updateHistoryTitle, getHistoryByType, setHistory, setLoading: setHistoryLoading, setError: setHistoryError } = useHistoryStore();
  const { setConversationId, setPromptId, setGenerationType } = useConversationStore();
  const { activeTab, setActiveTab } = useAudioTabStore();
  const { startStreamingTitle, stopStreamingTitle } = useStreamingTitlesStore();
  const router = useRouter();
  const pathname = usePathname();
  const { getCategoryModel } = useAudioCategorySelectionStore();
  const { setTempSelectedModels, saveSelectedModels } = useSelectedModelsStore();
  const { setRestriction, restrictions, clearRestriction } = useUsageRestrictionsStore.getState();
  const { isRestricted } = useUsageRestrictionsStore();

      

  const isPathRestricted = isRestricted('audio') 

  const [showRecorder, setShowRecorder] = useState(false);
  const audioRecording = useAudioRecorder();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { isListening, toggleListening } = useSpeechRecognition({
    onTranscript: setPrompt,
    inputRef: textareaRef
  });

  const preferredOrder = ['']

  const audioCondition = pathname === "/audio" && selectedModels.audio.length < 1;

  const setCurrentPage = useSidebarStore((state) => state.setCurrentPage);

  useEffect(() => {
    setCurrentPage("audio");
  }, [setCurrentPage]);
  
    // Load audio models on mount if not already loaded
    useEffect(() => {

      const loadAudioModels = async () => {
        if (audioModels && audioModels.length > 0) return;
  
        setModelsLoading(true);
        try {
          const models = await modelsApi.getModels('audio');
          const sortedAudioModels = models.sort((a, b) => {
            const indexA = preferredOrder.indexOf(a.model_uid);
            const indexB = preferredOrder.indexOf(b.model_uid);
          
            // If both models are in the preferred order, sort by their index
            if (indexA !== -1 && indexB !== -1) {
              return indexA - indexB;
            }
            
            // If only a is in the preferred order, it should come first
            if (indexA !== -1) return -1;
            
            // If only b is in the preferred order, it should come first
            if (indexB !== -1) return 1;
          
            // If neither are in the preferred order, maintain their original order
            return 0;
          });
          // console.log('Audio models loaded', sortedAudioModels);
          setAudioModels(sortedAudioModels);
        } catch (err: any) {
          setModelsError(err.response.data.error || err.response.data.message || 'Failed to load audio models');
        } finally {
          setModelsLoading(false);
        }
      };
  
      loadAudioModels();
    }, [setAudioModels, setModelsLoading, setModelsError]);

    // Load audio history
    useEffect(() => {
      const loadHistory = async () => {
        const audioHistory = getHistoryByType('audio');
        if (audioHistory && audioHistory.length > 0) {
          return;
        }
  
        setHistoryLoading(true);
        try {
          const response = await historyApi.getHistory('audio');
          // console.log('Audio history loaded', response.data);
          setHistory(response.data);
        } catch (err: any) {
          setHistoryError(err.response.data.error || err.response.data.message || 'Failed to load audio history');
        } finally {
          setHistoryLoading(false);
        }
      };
  
      loadHistory();
    }, []);

  // Clear inputs when tab changes
  useEffect(() => {
    // Reset the prompt and uploaded file when changing tabs
    setPrompt("");
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [activeTab, isListening]);

  const handleFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const paths = {
    tts: '/audio/tts/',
    stt: '/audio/stt/',
    ag: '/audio/ag/',
  };

  // Add effect to track restriction timers
  useEffect(() => {
    // Check if audio is restricted and has a comeback time
    if (restrictions.audio.isRestricted && restrictions.audio.comebackTime) {
      const comebackTime = new Date(restrictions.audio.comebackTime).getTime();
      const now = Date.now();
      const timeUntilComeback = comebackTime - now;

      // If comeback time is in the future, set a timer
      if (timeUntilComeback > 0) {
        const timer = setTimeout(() => {
          clearRestriction('audio');
          toast.success('Audio restrictions have been lifted!');
        }, timeUntilComeback);

        // Cleanup timer on unmount or if restrictions change
        return () => clearTimeout(timer);
      } else {
        // If comeback time has already passed, clear restriction immediately
        clearRestriction('audio');
      }
    }
  }, [restrictions.audio.isRestricted, restrictions.audio.comebackTime]);

  const selectedModelWithParams = useMemo(() => {
    if (!selectedModels.audio.length) return null;
    
    const selectedModelId = selectedModels.audio[0];
    const model = audioModels.find(m => m.model_uid === selectedModelId);
    
    if (!model) return null;
    
    return {
      model,
      inputParams: (model as any).input_params as ModelInputParams || {}
    };
  }, [selectedModels.audio, audioModels]);
  
  // Check if the selected model has input params data
  const hasTTSParams = useMemo(() => {
    const modelData = selectedModelWithParams;
    return !!(modelData && (
      modelData.inputParams.voices || 
      modelData.inputParams.output_formats || 
      modelData.inputParams.speed
    ));
  }, [selectedModelWithParams]);

  // Model specific parameters for TTS
  const [ttsModelParams, setTtsModelParams] = useState<TTSModelParams>({
    voice: "nova",
    voice_instructions: "",
    speed: 1.0,
    output_format: "mp3"
  });

  // Set default values when model changes
  useEffect(() => {
    const modelData = selectedModelWithParams;
    if (!modelData) return;
    
    const params = modelData.inputParams;
    
    setTtsModelParams(prev => ({
      ...prev,
      // If voices available, set to first voice, otherwise keep current
      voice: params.voices && params.voices.length > 0 ? params.voices[0] : prev.voice,
      // If output_formats available, set to first format, otherwise keep current
      output_format: params.output_formats && params.output_formats.length > 0 
        ? params.output_formats[0] 
        : prev.output_format,
      // If speed available, set to first speed (or middle value), otherwise keep current
      speed: params.speed && params.speed.length > 0 
        ? parseFloat(params.speed[Math.floor(params.speed.length / params.speed.length)]) 
        : prev.speed
    }));
  }, [selectedModelWithParams]);

  const getRequiredInfo = (pathname: string): string => {
    switch (true) {
      case pathname.startsWith('/audio'):
        return '1 model';
      default:
        return '1 model';
    }
  };
  

  const handleSubmit = async () => {    

    if (audioCondition) {
      setShowModelPrompt(true);
      return;
    }

    if (uploadedFile && uploadedFile.type.startsWith('audio/wav') && (selectedModels.audio[0] == 'gpt-4o-mini-transcribe') || (selectedModels.audio[0] == 'gpt-4o-transcribe')) {
      toast.info("Selected model doesn't support WAV at the moment. Please use MP3 files.");
      return;
    }

    const { isRestricted, restrictions } = useUsageRestrictionsStore.getState();
    
    // Check if audio is currently restricted
    if (isRestricted('audio') && restrictions.audio.comebackTime) {
      const restriction = restrictions.audio;
      const comebackTime = new Date(restriction.comebackTime!);
      const formattedTime = comebackTime.toLocaleTimeString();
      return;
    }
    
    if (activeTab === 'stt' && !uploadedFile) return;
    if (activeTab === 'tts' && (!prompt.trim() || selectedModels.audio.length === 0)) return;
    if (activeTab === 'ag' && (!prompt.trim() || selectedModels.audio.length === 0)) return;
    
    setIsLoading(true);
    
    try {
      // Create conversation with selected audio models
      const conversationResponse = await chatApi.createConversation(selectedModels.audio, 'audio');

      switch (conversationResponse.status_code) {
        case 'limit_reached':
          setRestriction('audio', conversationResponse.message, conversationResponse.comeback_time);
          return;
      }

      const conversationId = conversationResponse.session;
      
      let promptResponse;

      if (activeTab === 'tts') {
        // TTS flow
        let voice, speed, output_format;
        
        const modelData = selectedModelWithParams;
        if (modelData && hasTTSParams) {
          // Use the parameter values if the model supports them
          if (modelData.inputParams.voices) voice = ttsModelParams.voice.split('_')[1];
          if (modelData.inputParams.speed) speed = ttsModelParams.speed;
          if (modelData.inputParams.output_formats) output_format = ttsModelParams.output_format;
        }

        promptResponse = await audioApi.createPromptTTS(
          conversationId,
          prompt,
          voice,
          speed,
          output_format
        );
      } else if (activeTab === 'stt') {
        // STT flow - use original file if available, otherwise fetch from blob URL
        if (uploadedFile) {
          try {
            let file;
            
            // Use original file reference if available
            if (uploadedFile.originalFile) {
              file = uploadedFile.originalFile;
            } else if (uploadedFile.url) {
              // Fallback to fetching from blob URL
              const response = await fetch(uploadedFile.url);
              const fileBlob = await response.blob();
              
              // Create a File object from the blob
              file = new File([fileBlob], uploadedFile.name, { 
                type: uploadedFile.type 
              });
            } else {
              throw new Error("No file data available");
            }
            
            const options = {
              input_content: {
                uploaded_files: [{
                  file_name: uploadedFile.name,
                  file_size: uploadedFile.size.toString(),
                  file_type: 'audio',
                  file_content: file // Send the actual file
                }]
              }
            };
            
            promptResponse = await audioApi.createPromptSTT(
              conversationId,
              "_", 
              options
            );
          } catch (error) {
            // console.error("Error processing audio file:", error);
            // toast.error("Failed to process audio file");
            setIsLoading(false);
            return;
          }
        } else {
          // No file uploaded
          promptResponse = await audioApi.createPromptSTT(
            conversationId,
            "_"
          );
        }
      } else if (activeTab === 'ag') {
        // console.log('AG flow');
        promptResponse = await audioApi.createPromptAG(
          conversationId,
          prompt
        );
      }

      // Add to history
      addHistory({
        session: conversationId,
        title: conversationResponse.title,
        conversation_category: activeTab,
        type: 'audio',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      setContent("audio", "input", (activeTab === 'tts' || activeTab === 'ag') ? prompt : ""); 
      setConversationId(conversationId);
      setPromptId(promptResponse.id);

      // Route to the appropriate audio result page
      const basePath = activeTab === 'tts' ? '/audio/tts/' :
                      activeTab === 'stt' ? '/audio/stt/' :
                      '/audio/ag/';

      // For STT, extract the audio file URL to pass to the result page
      let audioFileUrl = '';
      let audioFileName = '';
      
      if (activeTab === 'stt' && promptResponse && promptResponse.input_content?.uploaded_files?.length > 0) {
        const fileData = promptResponse.input_content.uploaded_files[0];
        audioFileUrl = fileData.file_content || fileData.file_url || '';
        audioFileName = fileData.file_name || '';
        
        // Store in sessionStorage for the result page to access
        sessionStorage.setItem('audioFileUrl', audioFileUrl);
        sessionStorage.setItem('audioFileName', audioFileName);
      } else {
        // toast.error('Something went wrong, please try again');
        // console.log('No audio file URL available in promptResponse:', promptResponse);
      }

      setGenerationType("new");
      router.push(`${basePath}${conversationId}`);
      setPrompt("");
      setUploadedFile(null); // Clear the uploaded file after successful submission

      // Get actual title based on prompt
      historyApi.getConversationTitle(conversationId, (activeTab === 'tts' || activeTab === 'ag') ? prompt : audioFileName, 'audio')
        .then(response => {
          startStreamingTitle(conversationId);
          updateHistoryTitle(conversationId, response.title);
          document.title = `${response.title} - Alle-AI`;
          setTimeout(() => {
            stopStreamingTitle(conversationId);
          }, 800);
        })
        .catch(error => {
          // toast.error('Error getting conversation title');
        });

    } catch (error) {
      // toast.error("Failed to process your request");
    } finally {
      setIsLoading(false);
    }
  };

    const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

    const handleFileUploadProgress = (progress: number) => {
    setUploadedFile(prev => prev ? { ...prev, progress } : null);
  };

  const handleFileError = (error: any) => {
    if (uploadedFile?.url) {
      URL.revokeObjectURL(uploadedFile.url);
    }
    setUploadedFile(prev => prev ? { ...prev, status: 'error' } : null);
    toast.error(`${error instanceof Error ? error.message : "Failed to process file"}`)
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (activeTab === 'stt') {
      // Accept only audio files for STT
      if (!isAudioFile(file)) {
        toast.error('Supported file  mp3, wav');
        return;
      }
    } else if (activeTab === 'tts' || activeTab === 'ag') {
      // Reject audio files for TTS and AG
      if (!isTextFile(file)) {
        toast.error('Supported file types: pdf, txt, doc, docx');
        return;
      }
    }

    const validation = validateFile(file);
    if (!validation.isValid) {
      toast.error(`${validation.error}`);
      return;
    }

    try {
      // Create blob URL
      const fileUrl = URL.createObjectURL(file);
      
      // Clean up previous blob URL if it exists
      if (uploadedFile?.url) {
        URL.revokeObjectURL(uploadedFile.url);
      }

      const newUploadedFile: UploadedFile = {
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type,
        size: file.size,
        url: fileUrl,
        status: 'loading',
        progress: 0,
        originalFile: file // Store the original file reference
      };

      setUploadedFile(newUploadedFile);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        handleFileUploadProgress(Math.random() * 100);
      }, 200);

      // Process the file
      const { text } = await processFile(file);
      // console.log('content', text);

      // Clear interval and set progress to 100%
      clearInterval(progressInterval);
      handleFileUploadProgress(100);

      // For TTS and AG tabs, extract text from the document and put it in the textarea
    if ((activeTab === 'tts' || activeTab === 'ag') && 
        (file.type === 'application/pdf' || 
         file.type === 'text/plain' || 
         file.type === 'application/msword' || 
         file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
      
      // Update the prompt with extracted text
      setPrompt(text);
      
      // After setting the text, clear the file upload
      setTimeout(() => {
        setUploadedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        toast.success('File uploaded');
      }, 500);
      
      // Focus on the textarea
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    } else {
      // For other file types or STT tab, keep the file attached
      setTimeout(() => {
        setUploadedFile(prev => prev ? { ...prev, status: 'ready' } : null);
      }, 500);
      toast.success('File uploaded');
    }
    } catch (error) {
      handleFileError(error);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
    // Helper function to detect audio files
    const isAudioFile = (file: File): boolean => {
      return file.type.startsWith('audio/') || 
             /\.(mp3|wav)$/i.test(file.name);
    };

    const isWavFile = (file: File): boolean => {
      return file.type.startsWith('audio/') || 
             /\.(wav)$/i.test(file.name);
    };

    const isTextFile = (file: File): boolean => {
      return file.type === 'text/plain' || 
             file.type === 'application/msword' || 
             file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
             file.type === 'application/pdf';
    };

    const isVideoFile = (file: File): boolean => {
      return file.type.startsWith('video/') || 
             /\.(mp4|mov|avi|mkv|webm)$/i.test(file.name);
    };

  // Function to handle drag and drop for speech-to-text
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();

    if (isPathRestricted) return;
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];

      // Accept only audio files
      if (!isAudioFile(file)) {
        toast.error('Supported file types: mp3, wav');
        return;
      }

      const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
      if (AUDIO_FILE_TYPES.includes(fileExt)) {
        const fileUrl = URL.createObjectURL(file);
        setUploadedFile({
          id: crypto.randomUUID(),
          name: file.name,
          size: file.size,
          type: file.type,
          url: fileUrl,
          status: 'loading',
          progress: 0,
          originalFile: file // Store the original file reference
        });
        
        // Simulate upload progress
        let progress = 0;
        const progressInterval = setInterval(() => {
          const increment = Math.max(1, (90 - progress) / 10);
          progress = Math.min(90, progress + increment);
          
          setUploadedFile(prev => 
            prev ? { ...prev, progress } : null
          );
        }, 100);
        
        // After a delay, mark as ready
        setTimeout(() => {
          clearInterval(progressInterval);
          setUploadedFile(prev => 
            prev ? { ...prev, progress: 100, status: 'ready' } : null
          );
          toast.success('File uploaded');
        }, 1500);
      } else {
        toast.error('Unsupported file format');
      }
    }
  };

  const handleClicked = (option: { label: String; icon?: React.ReactNode; description?: string }) => {
    setPrompt(option.label as string);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

    const handlePaste = async (event: React.ClipboardEvent) => {
    const items = event.clipboardData.items;
    
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        event.preventDefault();
        
        const file = item.getAsFile();
        if (!file) continue;

        if (activeTab === 'stt') {
          // Accept only audio files for STT
          if (!isAudioFile(file)) {
            toast.error('Supported file  mp3, wav');
            return;
          }
        } else if (activeTab === 'tts' || activeTab === 'ag') {
          // Reject audio files for TTS and AG
          if (!isTextFile(file)) {
            toast.error('Supported file types: pdf, txt, doc, docx');
            return;
          }
        }

        const validation = validateFile(file);
        if (!validation.isValid) {
          toast.error(`${validation.error}`)
          return;
        }

        try {
          const fileUrl = URL.createObjectURL(file);
          
          if (uploadedFile?.url) {
            URL.revokeObjectURL(uploadedFile.url);
          }

          const newUploadedFile: UploadedFile = {
            id: crypto.randomUUID(),
            name: `IMG ${new Date().toISOString()}.${file.type.split('/')[1]}`,
            type: file.type,
            size: file.size,
            url: fileUrl,
            status: 'loading',
            progress: 0,
            originalFile: file // Store the original file reference
          };

          setUploadedFile(newUploadedFile);

          let progress = 0;
          const progressInterval = setInterval(() => {
            const increment = Math.max(1, (90 - progress) / 10);
            progress = Math.min(90, progress + increment);
            
            setUploadedFile(prev => 
              prev ? { ...prev, progress } : null
            );
          }, 100);

          const { text } = await processFile(file);
          // console.log('content', text);

          clearInterval(progressInterval);
          
          setUploadedFile(prev => 
            prev ? { ...prev, progress: 100 } : null
          );

          await new Promise(resolve => setTimeout(resolve, 500));
          setUploadedFile(prev => 
            prev ? { ...prev, status: 'ready' } : null
          );

          toast.success('Image uploaded');

        } catch (error) {
          if (uploadedFile?.url) {
            URL.revokeObjectURL(uploadedFile.url);
          }
          setUploadedFile(prev => prev ? { ...prev, status: 'error' } : null);
          toast.error(`${error instanceof Error ? error.message : "Failed to process file"}`)
        }
      }
    }
  };

  // Update functions for TTS model parameters
  const handleVoiceChange = (value: string) => {
    setTtsModelParams(prev => ({ ...prev, voice: value }));
  };
  
  const handleOutputFormatChange = (value: string) => {
    setTtsModelParams(prev => ({ ...prev, output_format: value }));
  };
  
  const handleVoiceInstructionsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Limit to 50 characters
    const value = e.target.value.slice(0, 50);
    setTtsModelParams(prev => ({ ...prev, voice_instructions: value }));
  };
  
  const handleSpeedChange = (values: number[]) => {
    setTtsModelParams(prev => ({ ...prev, speed: values[0] }));
  };

  // Add state for voice preview
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Function to play voice sample
  const playVoiceSample = () => {
    const modelData = selectedModelWithParams;
    if (!modelData || !modelData.model) {
      toast.error("Model information not available");
      return;
    }

    // Get the model_uid directly from the model object
    const modelUid = modelData.model.model_uid;

    // Build the S3 URL with model_uid and voice
    const voiceUrl = `https://alle-ai-file-server.s3.us-east-1.amazonaws.com/assets/voices/${modelUid}-${ttsModelParams.voice.split('_')[0]}.mp3`;

    if (!audioRef.current) {
      audioRef.current = new Audio(voiceUrl);
      
      audioRef.current.onended = () => {
        setIsPlayingVoice(false);
      };
    } else {
      // Update the source if voice changed
      audioRef.current.src = voiceUrl;
    }
    
    // Set the playback rate based on the speed slider
    audioRef.current.playbackRate = ttsModelParams.speed;
    
    if (isPlayingVoice) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlayingVoice(false);
    } else {
      audioRef.current.play().catch(err => {
        console.error("Error playing audio:", err);
        toast.error("Could not play voice sample");
      });
      setIsPlayingVoice(true);
    }
  };
  
  // Reset audio when voice changes
  useEffect(() => {
    if (audioRef.current && isPlayingVoice) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlayingVoice(false);
    }
  }, [ttsModelParams.voice]);

  // Update playback rate when speed changes during playback
  useEffect(() => {
    if (audioRef.current && isPlayingVoice) {
      audioRef.current.playbackRate = ttsModelParams.speed;
    }
  }, [ttsModelParams.speed, isPlayingVoice]);
  
  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Add a new state to track playback
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Create a state to store the visualization data for playback
  const [playbackVisualizationData, setPlaybackVisualizationData] = useState<number[]>([]);

  // Add this effect that generates random visualization data during playback
  useEffect(() => {
    let animationFrame: number;
    
    if (isPlayingRecording) {
      // Generate random visualization data that simulates audio levels
      const generateRandomLevels = () => {
        const newData = Array.from({ length: 20 }, () => {
          // Generate values between 0.2 and 0.9
          return 0.2 + Math.random() * 0.7;
        });
        setPlaybackVisualizationData(newData);
        animationFrame = requestAnimationFrame(generateRandomLevels);
      };
      
      generateRandomLevels();
    } else {
      // Reset to empty when not playing
      setPlaybackVisualizationData([]);
    }
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isPlayingRecording]);

  useEffect(() => {
    const modelId = getCategoryModel(activeTab);
    if (modelId) {
      setTempSelectedModels([modelId]);
      saveSelectedModels('audio');
    } else {
      setTempSelectedModels([]);
      saveSelectedModels('audio');
    }
  }, [activeTab]);

  return (
        <RenderPageContent>
        <div className={cn(
          "max-w-7xl w-full mx-auto flex flex-col h-full transition-all duration-300 gap-0",
        )}>
          <div className={cn(
            `flex flex-col transition-all duration-300 mx-auto w-full ${pathname.startsWith('/audio/') ? '' :'sm:w-2/3 md:w-2/3 lg:w-1/2'} h-[calc(100svh-14rem)] my-auto`,
          )}>
          {!pathname.includes('/audio/') && (
            <>
            <GreetingMessage 
              username="Pascal" 
              questionText={activeTab === 'tts' ? 'Give your text a voice.' : activeTab === 'stt' ? 'Convert your audio to text' : (activeTab === 'ag') ? 'Generate audio from text' : ''} 
              handlePressed={handleClicked}
            />
            <AnimatePresence mode="wait">
              {activeTab === "tts" && (
                <motion.div 
                  key="tts" 
                  variants={fadeVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="flex flex-col flex-1"
                >
                    {/* Add restriction warning for TTS */}
                  <div className="flex flex-col flex-1 p-4 space-y-4">
                    {restrictions.audio.isRestricted && restrictions.audio.comebackTime && (
                      <RestrictionWarning 
                        message={restrictions.audio.message || "You've reached the audio limit."}
                        comebackTime={new Date(restrictions.audio.comebackTime).toLocaleTimeString()}
                      />
                    )}
                    <div className="flex flex-col space-y-2">
                      <Textarea
                        ref={textareaRef}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Enter the text you want to convert to speech..."
                        onKeyPress={handleKeyPress}
                        onPaste={handlePaste}
                        className="bg-backgroundSecondary flex-1 min-h-[100px] resize-none border-borderColorPrimary focus-visible:outline-none focus:border-2 scrollbar-thin scrollbar-webkit"
                      />
                    </div>

                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleFileChange}
                      accept={Object.entries(CHAT_ALLOWED_FILE_TYPES)
                        .flatMap(([, exts]) => exts)
                        .join(',')}
                    />

                    <div className="flex items-center gap-4">
                      <FileUploadButton
                        onUploadFromComputer={handleFileUpload}
                        onUploadFromDrive={() => {}}
                        buttonIcon={
                          <Button
                            variant="outline" 
                            className="flex items-center gap-2 border-borderColorPrimary"
                          >
                            <Upload className="w-4 h-4" />
                            Upload file
                          </Button>
                        }
                      />

                      <MicButton 
                        className={`w-10 h-10 bg-transparent rounded-md text-black dark:text-white ${isListening ? "border-none" : "border border-borderColorPrimary"} `} 
                        isListening={isListening} 
                        onClick={toggleListening} 
                      />
                      
                      <div className="ml-auto text-sm text-muted-foreground">
                        {uploadedFile && (
                          <div className="mb-2">
                            <FilePreview 
                              file={uploadedFile} 
                              onRemove={handleRemoveFile}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {hasTTSParams && (
                      <div className="bg-backgroundSecondary border border-borderColorPrimary rounded-md p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium">Voice settings</h3>
                          <span className="text-xs text-muted-foreground">{selectedModelWithParams?.model?.model_name}</span>
                        </div>
                        
                        <Separator className="my-2" />
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Voice selector - only show if model has voices */}
                          {selectedModelWithParams?.inputParams?.voices && selectedModelWithParams.inputParams.voices.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label htmlFor="voice" className="text-xs">Voice</Label>
                                <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Play voice sample</span>
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 rounded-full"
                                  onClick={playVoiceSample}
                                  title={`Play ${ttsModelParams.voice} voice sample`}
                                >
                                  {isPlayingVoice ? (
                                    <Pause className="h-3 w-3" />
                                  ) : (
                                    <Play className="h-3 w-3" />
                                  )}
                                </Button>
                                </div>
                              </div>
                              <Select 
                                value={ttsModelParams.voice} 
                                onValueChange={handleVoiceChange}
                              >
                                <SelectTrigger id="voice" className="bg-backgroundSecondary border-borderColorPrimary text-sm h-8 capitalize">
                                  <SelectValue placeholder="Select a voice" />
                                </SelectTrigger>
                                <SelectContent>
                                  {selectedModelWithParams.inputParams.voices.map(voice => (
                                    <SelectItem key={voice} value={voice} className="capitalize">
                                      {voice.split('_')[0]}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                          
                          {/* Output format selector - only show if model has output_formats */}
                          {selectedModelWithParams?.inputParams?.output_formats && selectedModelWithParams.inputParams.output_formats.length > 0 && (
                            <div className="space-y-2">
                              <Label htmlFor="format" className="text-xs">Output Format</Label>
                              <Select 
                                value={ttsModelParams.output_format} 
                                onValueChange={handleOutputFormatChange}
                              >
                                <SelectTrigger id="format" className="bg-backgroundSecondary border-borderColorPrimary text-sm h-8">
                                  <SelectValue placeholder="Select a format" />
                                </SelectTrigger>
                                <SelectContent>
                                  {selectedModelWithParams.inputParams.output_formats.map(format => (
                                    <SelectItem key={format} value={format} className="uppercase">
                                      {format}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                        
                        {/* Voice instructions - available for all models */}
                        {selectedModelWithParams?.inputParams?.voice_instructions && (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <Label htmlFor="instructions" className="text-xs">
                                Voice Instructions 
                              </Label>
                              <span className="text-xs text-muted-foreground">
                                {ttsModelParams.voice_instructions.length}/50
                              </span>
                            </div>
                            <Input
                              id="instructions"
                              placeholder="E.g., Use a calm and friendly tone"
                              value={ttsModelParams.voice_instructions}
                              onChange={handleVoiceInstructionsChange}
                              className="bg-backgroundSecondary border-borderColorPrimary text-sm h-8 focus-visible:outline-none"
                            />
                          </div>
                        )}
                        
                        {/* Speed slider - only show if model has speed */}
                        {selectedModelWithParams?.inputParams?.speed && selectedModelWithParams.inputParams.speed.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <Label htmlFor="speed" className="text-xs">Speaking Speed</Label>
                              <span className="text-xs font-medium">{ttsModelParams.speed}x</span>
                            </div>
                            <Slider
                              id="speed"
                              min={parseFloat(selectedModelWithParams.inputParams.speed[0])}
                              max={parseFloat(selectedModelWithParams.inputParams.speed[selectedModelWithParams.inputParams.speed.length - 1])}
                              step={0.1}
                              value={[ttsModelParams.speed]}
                              onValueChange={handleSpeedChange}
                              className="mt-2"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Slower</span>
                              <span>Faster</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <Button 
                      onClick={handleSubmit}
                      disabled={!prompt.trim() || isLoading ||  isPathRestricted}
                      className="w-full mt-auto"
                    >
                      {isLoading ? <Loader className="h-4 w-4 animate-spin" /> : "Convert"}
                    </Button>
                  </div>
                </motion.div>
              )}

              {activeTab === "stt" && (
                <motion.div 
                  key="stt" 
                  variants={fadeVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="flex flex-col flex-1"
                >
                  <div className="flex flex-col flex-1 p-4 space-y-4">
                    {/* Add restriction warning for STT */}
                    {restrictions.audio.isRestricted && restrictions.audio.comebackTime && (
                      <RestrictionWarning 
                        message={restrictions.audio.message || "You've reached the audio limit."}
                        comebackTime={new Date(restrictions.audio.comebackTime).toLocaleTimeString()}
                      />
                    )}
                    {!showRecorder ? (
                      // File upload UI - shown when not recording
                      <div 
                        className={`flex flex-col justify-center items-center border-2 border-dashed ${uploadedFile ? 'border-blue-500' : 'border-borderColorPrimary'} rounded-md p-8 min-h-[200px] transition-colors`}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}

                      >
                        {!uploadedFile ? (
                          <>
                            <FileAudio className="w-16 h-16 text-muted-foreground mb-4" />
                            <p className="text-center text-muted-foreground mb-2">Drag and drop audio file here</p>
                            <div className="flex flex-col sm:flex-row gap-4 mt-2">
                              <Button 
                                variant="outline" 
                                onClick={handleFileUpload}
                                disabled={isPathRestricted}
                              >
                                <CloudUpload  className="w-4 h-4 mr-2" />
                                Select file
                              </Button>
                              <span className="text-muted-foreground mx-auto">or</span>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  if(selectedModels.audio[0] !== 'scribe-v1'){
                                    toast.info(`Scribe V1 is the only model that supports recording at the moment.`,{
                                      duration: 5000,
                                      action: {
                                        label: 'Change Model',
                                        onClick: () => {
                                          setModelSelectionModalOpen(true)
                                        }
                                      }
                                    })
                                  } else {
                                    setShowRecorder(true)
                                  }
                                }}
                                disabled={isPathRestricted}
                                className="text-blue-500 bg-blue-500/10 hover:bg-blue-500/20 hover:text-white"
                              >
                                <MicVocal className="w-4 h-4 mr-2" />
                                Record audio
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-4">
                              {/* Supported formats: mp3, mp4, wav, aac, ogg and more */}
                              Supported formats: mp3, (other formats will be added soon)
                            </p>
                          </>
                        ) : (
                          <FilePreview 
                            file={uploadedFile} 
                            onRemove={handleRemoveFile}
                          />
                        )}
                      </div>
                    ) : (
                      // Recording UI - shown when recording
                      <div className="flex flex-col items-center border-2 border-dashed border-primary rounded-md p-8 min-h-[200px] transition-colors">
                        {!audioRecording.audioUrl ? (
                          // Active recording state
                          <div className="flex flex-col items-center w-full">
                            <div className="mb-4 text-center">
                              <div className="flex flex-col items-center">
                                <div className="flex justify-center items-center gap-1 w-full mb-4">
                                  {/* Waveform visualization */}
                                  <div className="flex items-end justify-center h-16 gap-[2px] w-full max-w-[300px]">
                                    {audioRecording.visualizationData.length > 0 ? (
                                      audioRecording.visualizationData.map((value, index) => (
                                        <div
                                          key={index}
                                          className="w-1.5 bg-primary rounded-full transition-all duration-75"
                                          style={{ 
                                            height: `${Math.max(4, value * 48)}px`,
                                            opacity: value > 0.05 ? 1 : 0.5
                                          }}
                                        />
                                      ))
                                    ) : (
                                      // Default bars when no data yet
                                      Array.from({ length: 20 }).map((_, i) => (
                                        <div 
                                          key={i}
                                          className="w-1.5 bg-primary/40 rounded-full animate-pulse"
                                          style={{
                                            height: `${4 + Math.random() * 8}px`,
                                            animationDelay: `${i * 0.05}s`
                                          }}
                                        />
                                      ))
                                    )}
                                  </div>
                                </div>
                                <div className="text-sm font-mono">
                                  <span className="text-primary">● REC</span> {audioRecording.formattedDuration}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex gap-2 mt-2">
                              <Button
                                variant={audioRecording.isRecording ? "destructive" : "default"}
                                onClick={audioRecording.isRecording ? audioRecording.stopRecording : audioRecording.startRecording}
                                className="bg-blue-500 hover:bg-blue-600 text-white min-w-28"
                              >
                                {audioRecording.isRecording ? 'Stop Recording' : 'Start Recording'}
                              </Button>
                              
                              {!audioRecording.isRecording && (
                                <Button
                                  variant="outline"
                                  onClick={() => setShowRecorder(false)}
                                >
                                  Cancel
                                </Button>
                              )}
                            </div>
                          </div>
                        ) : (
                          // Recording review state
                          <div className="flex flex-col items-center w-full">
                            <div className="mb-4 w-full">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">Your Recording ({audioRecording.formattedDuration})</span>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  className="h-7 w-7 rounded-md"
                                  onClick={() => {
                                    // Stop any playing audio
                                    if (audioPlayerRef.current) {
                                      audioPlayerRef.current.pause();
                                      audioPlayerRef.current = null;
                                    }
                                    setIsPlayingRecording(false);
                                    audioRecording.resetRecording();
                                  }}
                                  title="Delete recording"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                              <div className="h-16 bg-background border border-borderColorPrimary rounded-md overflow-hidden relative mb-3">
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="flex items-end justify-center h-16 gap-[2px] w-full max-w-[300px]">
                                    {isPlayingRecording && playbackVisualizationData.length > 0 ? (
                                      // Active visualization when playing
                                      playbackVisualizationData.map((value, index) => (
                                        <div
                                          key={index}
                                          className="w-1.5 bg-primary rounded-full transition-all duration-75"
                                          style={{ 
                                            height: `${Math.max(4, value * 48)}px`,
                                            opacity: value > 0.3 ? 1 : 0.6
                                          }}
                                        />
                                      ))
                                    ) : (
                                      // Static bars when not playing
                                      Array.from({ length: 20 }).map((_, i) => (
                                        <div 
                                          key={i}
                                          className="w-1.5 bg-primary/40 rounded-full"
                                          style={{
                                            height: `${4 + Math.sin(i / 2) * 8 + Math.random() * 4}px`
                                          }}
                                        />
                                      ))
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex justify-center space-x-3 mb-4">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className={`h-10 w-10 rounded-full ${isPlayingRecording ? 'bg-primary/10' : ''}`}
                                  onClick={() => {
                                    // Stop previous playback if any
                                    if (audioPlayerRef.current && isPlayingRecording) {
                                      audioPlayerRef.current.pause();
                                      audioPlayerRef.current.currentTime = 0;
                                      setIsPlayingRecording(false);
                                      return;
                                    }
                                    
                                    // Create new audio
                                    const audio = new Audio(audioRecording.audioUrl!);
                                    audioPlayerRef.current = audio;
                                    
                                    // Set up event listeners
                                    audio.onended = () => {
                                      setIsPlayingRecording(false);
                                      audioPlayerRef.current = null;
                                    };
                                    
                                    audio.onpause = () => {
                                      setIsPlayingRecording(false);
                                    };
                                    
                                    // Play the audio
                                    setIsPlayingRecording(true);
                                    audio.play().catch(err => {
                                      console.error("Error playing audio:", err);
                                      toast.error("Failed to play recording");
                                      setIsPlayingRecording(false);
                                    });
                                  }}
                                >
                                  {isPlayingRecording ? (
                                    <Pause className="h-5 w-5" />
                                  ) : (
                                    <Play className="h-5 w-5" />
                                  )}
                                </Button>
                              </div>
                            </div>
                            
                            <div className="flex gap-2 w-full max-w-xs">
                              <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => {
                                  // Stop any playing audio
                                  if (audioPlayerRef.current) {
                                    audioPlayerRef.current.pause();
                                    audioPlayerRef.current = null;
                                  }
                                  setIsPlayingRecording(false);
                                  
                                  audioRecording.resetRecording();
                                  // Start a new recording immediately
                                  setTimeout(() => audioRecording.startRecording(), 100);
                                }}
                              >
                                Record Again
                              </Button>
                              <Button
                                className="flex-1"
                                onClick={() => {
                                  if (audioRecording.audioBlob) {
                                    // Stop any playing audio
                                    if (audioPlayerRef.current) {
                                      audioPlayerRef.current.pause();
                                      audioPlayerRef.current = null;
                                    }
                                    setIsPlayingRecording(false);
                                    
                                    // Create a File object from the blob
                                    const file = new File(
                                      [audioRecording.audioBlob], 
                                      `recording-${new Date().toISOString().substring(0, 19).replace(/:/g, '-')}.wav`, 
                                      { type: 'audio/wav' }
                                    );
                                    
                                    // Create an UploadedFile object
                                    const recordedFile: UploadedFile = {
                                      id: crypto.randomUUID(),
                                      name: file.name,
                                      type: file.type,
                                      size: file.size,
                                      url: audioRecording.audioUrl!,
                                      status: 'ready',
                                      progress: 100,
                                      originalFile: file
                                    };
                                    
                                    // Set as the uploaded file
                                    setUploadedFile(recordedFile);
                                    
                                    // Hide recorder
                                    setShowRecorder(false);
                                    
                                    toast.success("Recording uploaded successfully");
                                  }
                                }}
                              >
                                Use Recording
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleFileChange}
                      accept={AUDIO_FILE_TYPES.map(ext => `.${ext}`).join(',')}
                    />

                    <Button 
                      onClick={handleSubmit}
                      disabled={(!uploadedFile && !showRecorder) || isLoading }
                      className="w-full mt-auto"
                    >
                      {isLoading ? <Loader className="h-4 w-4 animate-spin" /> : "Transcribe"}
                    </Button>
                  </div>
                </motion.div>
              )}

              {activeTab === "ag" && (
                <motion.div 
                  key="ag" 
                  variants={fadeVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="flex flex-col"
                >
                  {/* Add restriction warning for AG */}
                  <div className="flex flex-col flex-1 p-4 space-y-4">
                    {restrictions.audio.isRestricted && restrictions.audio.comebackTime && (
                      <RestrictionWarning 
                        message={restrictions.audio.message || "You've reached the audio limit."}
                        comebackTime={new Date(restrictions.audio.comebackTime).toLocaleTimeString()}
                      />
                    )}
                    <div className="flex flex-col space-y-2">
                      <Textarea
                        ref={textareaRef}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe the audio you want to generate..."
                        className="bg-backgroundSecondary flex-1 min-h-[100px] resize-none border-borderColorPrimary focus-visible:outline-none focus:border-2 scrollbar-thin scrollbar-webkit"
                      />
                    </div>
        
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleFileChange}
                      accept={Object.entries(CHAT_ALLOWED_FILE_TYPES)
                        .flatMap(([, exts]) => exts)
                        .join(',')}
                    />
        
                    <div className="flex items-center gap-4">
                      <FileUploadButton
                        onUploadFromComputer={handleFileUpload}
                        onUploadFromDrive={() => {}}
                        buttonIcon={
                          <Button
                            variant="outline" 
                            className="flex items-center gap-2 border-borderColorPrimary"
                          >
                            <Upload className="w-4 h-4" />
                            Upload file
                          </Button>
                        }
                      />
        
                      <MicButton 
                        className={`w-10 h-10 bg-transparent rounded-md text-black dark:text-white ${isListening ? "border-none" : "border border-borderColorPrimary"} `} 
                        isListening={isListening} 
                        onClick={toggleListening} 
                      />
                
                      <div className="ml-auto text-sm text-muted-foreground">
                        {uploadedFile && (
                          <div className="mb-2">
                            <FilePreview 
                              file={uploadedFile} 
                              onRemove={handleRemoveFile}
                            />
                          </div>
                        )}
                      </div>
                    </div>
        
                    <Button 
                      onClick={handleSubmit}
                      disabled={!prompt.trim() || isLoading }
                      className="w-full mt-auto"
                    >
                      {isLoading ? <Loader className="h-4 w-4 animate-spin" /> : "Generate"}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
          )}
          {children}
          </div>
          <PromptModal
            isOpen={showModelPrompt}
            onClose={() => setShowModelPrompt(false)}
            title="No Models Selected"
            message={<>Please select <span className="font-bold text-foreground">{getRequiredInfo(pathname)}</span> to start a conversation</>}
            metadata={{
              link: {
                text: "Learn why",
                url: "/faq/3742473-others/models-selection"
              }
            }}
            actions={[
              {
                label: "Close",
                onClick: () => setShowModelPrompt(false),
                variant: "outline"
              },
              {
                label: "Select Models",
                onClick: () => {
                  setShowModelPrompt(false);
                  setModelSelectionModalOpen(true)
                },
                variant: "default"
              }
            ]}
          />
          <ModelSelectionModal
            isOpen={modelSelectionModalOpen}
            onClose={() => setModelSelectionModalOpen(false)}
          />
        </div>
      </RenderPageContent>
    );
  }
"use client"
import RenderPageContent from "@/components/RenderPageContent";
import { ModelSelectionModal } from "@/components/ui/modals/model-selection-modal";
import { PromptModal, VideoSettingsInfoModal } from "@/components/ui/modals";
import { useEffect, useRef, useState } from "react";
import { processFile } from "@/lib/fileProcessing";
import { ALLOWED_FILE_TYPES, cn, validateFile } from "@/lib/utils";
import { toast } from "sonner";
import { RestrictionWarning } from "@/components/ui/restriction-warning";

import { UploadedFile } from "@/lib/types";
import { FilePreview } from "@/components/ui/file-preview";
import { FileUploadButton } from "@/components/ui/file-upload-button";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { GalleryHorizontal, Grid2x2, GalleryVerticalEnd, Info, Plus, RectangleHorizontal, RectangleVertical, Square, TvMinimalPlay, Clock8, Aperture, Film, Clapperboard, Clock9, Loader } from "lucide-react";
import { MicButton } from "@/components/ui/MicButton";
import { DropdownMenu, DropdownMenuLabel, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuRadioItem, DropdownMenuRadioGroup, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useContentStore, useSelectedModelsStore, useLikedMediaStore, useUsageRestrictionsStore, useSidebarStore } from "@/stores";
import GreetingMessage from "@/components/features/GreetingMessage";
import { useVideoSettingsStore } from "@/stores/videoSettingsStore";

import { usePathname, useRouter } from "next/navigation";
import { historyApi } from '@/lib/api/history';
import { chatApi } from '@/lib/api/chat';
import { useConversationStore, useModelsStore } from "@/stores/models";
import { useHistoryStore } from "@/stores";
import { modelsApi } from "@/lib/api/models";
import { videoOptions } from "@/lib/constants";


interface VideoSettings {
  aspectRatio: "16:9" | "1:1" | "9:16";
  quality: "480p" | "720p" | "1080p";
  duration: number;
  display: "column" | "grid" | "carousel";
}

export default function Layout({ children }: { children: React.ReactNode }) {
    const [infoModalOpen, setInfoModalOpen] = useState(false);
    const [currentSettingInfo, setCurrentSettingInfo] = useState<'aspectRatio' | 'quality' | 'duration' | 'display'>('aspectRatio');
    const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [prompt, setPrompt] = useState("");
    const { settings, setSettings } = useVideoSettingsStore();
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const { addHistory, updateHistoryTitle, getHistoryByType, setHistory, setLoading: setHistoryLoading, setError: setHistoryError } = useHistoryStore();

    const showSettingInfo = (setting: 'aspectRatio' | 'quality' | 'duration' | 'display') => {
    setCurrentSettingInfo(setting);
    setInfoModalOpen(true);
    };
    const { selectedModels } = useSelectedModelsStore();
    const { content, setContent } = useContentStore();
    const { setConversationId, setPromptId, setGenerationType } = useConversationStore();
    const { videoModels, setVideoModels, setLoading: setModelsLoading, setError: setModelsError } = useModelsStore();
    const { setRestriction, restrictions, clearRestriction } = useUsageRestrictionsStore();
    const [showModelPrompt, setShowModelPrompt] = useState(false);
    const [modelSelectionModalOpen, setModelSelectionModalOpen] = useState(false);
    const { isOpen } = useSidebarStore();
    
    const setCurrentPage = useSidebarStore((state) => state.setCurrentPage);


    useEffect(() => {
      setCurrentPage("video");
    }, [setCurrentPage]);
    


    const videoCondition = pathname === "/video" && selectedModels.video.length < 1;

    const getRequiredInfo = (pathname: string): string => {
        switch (true) {
          case pathname.startsWith('/video'):
            return 'at least 1 model';
          default:
            return 'at least 1 model';
        }
      };


    const { isListening, toggleListening } = useSpeechRecognition({
        onTranscript: setPrompt,
        inputRef: textareaRef
    });

    
    // Add this constant at the beginning of the ChatInput component
  const CHAT_ALLOWED_FILE_TYPES = Object.fromEntries(
    Object.entries(ALLOWED_FILE_TYPES).filter(([type]) => 
      !type.startsWith('audio/') && type !== 'video/mp4'
    )
  ) as typeof ALLOWED_FILE_TYPES;

  const isImageFile = (file: File) => {
    return file.type.startsWith('image/');
  }

  const isVideoFile = (file: File) => {
    return file.type.startsWith('video/');
  }
  
  const isAudioFile = (file: File) => {
      return file.type.startsWith('audio/');
    }
    
    const preferredOrder = ['']
    // Load video models on mount if not already loaded
    useEffect(() => {
        const loadVideoModels = async () => {

        if (videoModels && videoModels.length > 0) return;
        setModelsLoading(true);
        try {
            const models = await modelsApi.getModels('video');
            const sortedVideoModels = models.sort((a, b) => {
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
            setVideoModels(sortedVideoModels);
            // console.log('Video models loaded', sortedVideoModels);
        } catch (err) {
            // toast.error('Failed to load video models');
            // setModelsError(err instanceof Error ? err.message : 'Failed to load image models');
        } finally {
            setModelsLoading(false);
        }
        };

        loadVideoModels();
    }, [setVideoModels, setModelsLoading, setModelsError]);

    // Load video history
    useEffect(() => {
        const loadHistory = async () => {
        const videoHistory = getHistoryByType('video');
        if (videoHistory && videoHistory.length > 0) {
            return;
        }
        
        setHistoryLoading(true);
        try {
            const response = await historyApi.getHistory('video');
            // console.log("Fetched image history:", response.data);
            setHistory(response.data);
        } catch (err: any) {
            setHistoryError(err.response.data.error || err.response.data.message || 'Failed to load video history');
        } finally {
            setHistoryLoading(false);
        }
        };

        loadHistory();
    }, []);

    // Add effect to track restriction timers
    useEffect(() => {
        // Check if image is restricted and has a comeback time
        if (restrictions.video.isRestricted && restrictions.video.comebackTime) {
            const comebackTime = new Date(restrictions.video.comebackTime).getTime();
            const now = Date.now();
            const timeUntilComeback = comebackTime - now;
    
            // If comeback time is in the future, set a timer
            if (timeUntilComeback > 0) {
            const timer = setTimeout(() => {
                clearRestriction('video');
                toast.success('Video restrictions have been lifted!');
            }, timeUntilComeback);
    
            // Cleanup timer on unmount or if restrictions change
            return () => clearTimeout(timer);
            } else {
            // If comeback time has already passed, clear restriction immediately
            clearRestriction('video');
            }
        }
    }, [restrictions.video.isRestricted, restrictions.video.comebackTime]);

    const handleSubmit = async () => {
        if (!prompt.trim()) return;
        
        if (videoCondition) {
            setShowModelPrompt(true);
            return;
          }
        
        const { isRestricted, restrictions } = useUsageRestrictionsStore.getState();
        // Check if video is currently restricted
        if (isRestricted('video') && restrictions.video.comebackTime) {
        const restriction = restrictions.video;
        const comebackTime = new Date(restriction.comebackTime!);
        const formattedTime = comebackTime.toLocaleTimeString();
        return;
    }

        setIsLoading(true);
        try {
            const allSelectedModels = selectedModels.video;
            
            const conversationResponse = await chatApi.createConversation(allSelectedModels, 'video');

            switch (conversationResponse.status_code) {
                case 'limit_reached':
                    setRestriction('video', conversationResponse.message, conversationResponse.comeback_time);
                    return;
            }

            const conversationId = conversationResponse.session;

            // console.log('conversationResponse', conversationResponse);

            
            const promptResponse = await chatApi.createPrompt(
                conversationId, 
                prompt,
            );

            // console.log('promptResponse', promptResponse);
            
            setContent("video", "input", prompt);
            setGenerationType('new');
            
            setConversationId(conversationId);
            setPromptId(promptResponse.id);

            router.push(`/video/res/${conversationId}`);
            setPrompt("");
            
            addHistory({
                session: conversationId,
                title: prompt,
                type: 'video',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            });

            // Get actual title based on prompt
            historyApi.getConversationTitle(conversationId, prompt, 'video')
                .then(response => {
                    updateHistoryTitle(conversationId, response.title);
                    document.title = `${response.title} - Alle-AI`;
                })
                .catch(error => {
                    // console.error('Error getting conversation title:', error);
                });

        } catch (error) {
            // console.error('Error in video generation flow:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClicked = (option: { label: String; icon?: React.ReactNode; description?: string }) => {
    setPrompt(option.label as string);
    setTimeout(() => textareaRef.current?.focus(), 0);
    };
    
    const handleRemoveFile = () => {
        if (uploadedFile?.url) {
          URL.revokeObjectURL(uploadedFile.url);
          setUploadedFile(null);
        }
    };

    const handleUploadFromComputer = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (isImageFile(file)) {
            toast.info('This feature will be available soon!');
            return;
        }

        if (isVideoFile(file)) {
            toast.info('This feature will be available soon!');
            return;
        }

        if (isAudioFile(file)) {
            toast.info('This feature will be available soon!');
            return;
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
            name: file.name,
            type: file.type,
            size: file.size,
            url: fileUrl,
            status: 'loading',
            progress: 0
          };
    
          setUploadedFile(newUploadedFile);
    
          // Create a more natural progress simulation
          let progress = 0;
          const progressInterval = setInterval(() => {
            // Exponential slowdown as we approach 90%
            const increment = Math.max(1, (90 - progress) / 10);
            progress = Math.min(90, progress + increment);
            
            setUploadedFile(prev => 
              prev ? { ...prev, progress } : null
            );
          }, 100);
    
          // Process the file
          const { text } = await processFile(file);
          // console.log('content', text);
    
          // Complete the progress animation
          clearInterval(progressInterval);
          
          // Jump to 100% and show completion
          setUploadedFile(prev => 
            prev ? { ...prev, progress: 100 } : null
          );
    
          // Short delay before showing ready state
          await new Promise(resolve => setTimeout(resolve, 500));
          setUploadedFile(prev => 
            prev ? { ...prev, status: 'ready' } : null
          );
    
          toast.success('File uploaded');
        } catch (error) {
          if (uploadedFile?.url) {
            URL.revokeObjectURL(uploadedFile.url);
          }
          setUploadedFile(prev => prev ? { ...prev, status: 'error' } : null);
          toast.error(`${error instanceof Error ? error.message : "Failed to upload file"}`)
        }
    };

    const handleUploadFromDrive = async (file: File) => {
    try {
        const validation = validateFile(file);
        if (!validation.isValid) {
        toast.error(`${validation.error}`)
        return;
        }

        const fileUrl = URL.createObjectURL(file);
        
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
        progress: 0
        };

        setUploadedFile(newUploadedFile);

        // Create a more natural progress simulation
        let progress = 0;
        const progressInterval = setInterval(() => {
        // Exponential slowdown as we approach 90%
        const increment = Math.max(1, (90 - progress) / 10);
        progress = Math.min(90, progress + increment);
        
        setUploadedFile(prev => 
            prev ? { ...prev, progress } : null
        );
        }, 100);

        const { text } = await processFile(file);
        // console.log('content', text);
        setPrompt(text);

        // Complete the progress animation
        clearInterval(progressInterval);
        
        // Jump to 100% and show completion
        setUploadedFile(prev => 
        prev ? { ...prev, progress: 100 } : null
        );

        // Short delay before showing ready state
        await new Promise(resolve => setTimeout(resolve, 500));
        setUploadedFile(prev => 
        prev ? { ...prev, status: 'ready' } : null
        );

        toast.success('File uploaded');
        toast.success('File uploaded');
    } catch (error) {
        if (uploadedFile?.url) {
        URL.revokeObjectURL(uploadedFile.url);
        }
        setUploadedFile(prev => prev ? { ...prev, status: 'error' } : null);
        toast.error(`${error instanceof Error ? error.message : "Failed to upload file"}`)

    }
    };

    const handlePaste = async (event: React.ClipboardEvent) => {
    const items = event.clipboardData.items;
    
    for (const item of items) {
        if (item.type.startsWith('image/')) {
        event.preventDefault();
        
        const file = item.getAsFile();
        if (!file) continue;

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
            progress: 0
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

            toast.success('Image uploaded')
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

    const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };
    const { isRestricted } = useUsageRestrictionsStore();


    const isPathRestricted = isRestricted('video');

    const DurationControl = () => {
    const durations = [5, 10, 15, 30, 60, 120]; // Duration options in seconds

    return (
        <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button 
            variant="outline" 
            className={cn(
                "flex gap-2 h-10 px-4 rounded-xl border-2 transition-all duration-200 group border-muted text-muted-foreground hover:bg-accent/50 select-none"
            )}
            >
            <Clock8 className="h-4 w-4" />
            <span className="font-medium">{formatDuration(settings.duration)}</span>
            </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end">
            <DropdownMenuLabel className="flex items-center justify-between">
            Duration
            <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 rounded-full hover:bg-accent/50"
            onClick={() => showSettingInfo('duration')}
            >
                <Info className="h-3 w-3" />
            </Button>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup 
            value={settings.duration.toString()}
            onValueChange={(value) => 
                setSettings({ duration: parseInt(value) })
            }
            >
            {durations.map((duration) => (
                <DropdownMenuRadioItem 
                key={duration} 
                value={duration.toString()}
                >
                {formatDuration(duration)}
                </DropdownMenuRadioItem>
            ))}
            </DropdownMenuRadioGroup>
        </DropdownMenuContent>
        </DropdownMenu>
    );
    };

    const AdvancedOptions = () => (
    <div className="flex items-center justify-center gap-6 mt-4">
        {pathname === ('/video') && (
            <>
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button 
                    variant="outline" 
                    className={cn(
                        "flex gap-2 h-10 px-4 rounded-xl border-2 transition-all duration-200 group border-muted text-muted-foreground hover:bg-accent/50 select-none"
                    )}
                    >
                    <RectangleHorizontal className="h-4 w-4" />
                    <span className="font-medium">{settings.aspectRatio}</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="min-w-[120px]">
                    <DropdownMenuLabel className="flex items-center justify-between">
                    Aspect Ratio
                    <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 rounded-full hover:bg-accent/50"
                    onClick={() => showSettingInfo('aspectRatio')}
                    >
                        <Info className="h-3 w-3" />
                    </Button>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup 
                    value={settings.aspectRatio} 
                    onValueChange={(value) => 
                        setSettings({ aspectRatio: value as VideoSettings["aspectRatio"] })
                    }
                    >
                    <DropdownMenuRadioItem value="16:9" className="gap-2">
                        <RectangleHorizontal className="w-4 h-4" />
                        16:9
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="1:1" className="gap-2">
                        <Square className="w-4 h-4" />
                        1:1
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="9:16" className="gap-2">
                        <RectangleVertical className="w-4 h-4" />
                        9:16
                    </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                </DropdownMenuContent>
                </DropdownMenu>
                

                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button 
                    variant="outline" 
                    className={cn(
                        "flex gap-2 h-10 px-4 rounded-xl border-2 transition-all duration-200 group select-none",
                        settings.quality === "1080p" 
                        ? "border-primary text-primary hover:bg-primary/10"
                        : "border-muted text-muted-foreground hover:bg-accent/50"
                    )}
                    >
                    <TvMinimalPlay className="h-4 w-4" />
                    <span className="font-medium">{settings.quality}</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="min-w-[120px]">
                    <DropdownMenuLabel className="flex items-center justify-between">
                    Quality
                    <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 rounded-full hover:bg-accent/50"
                    onClick={() => showSettingInfo('quality')}
                    >
                        <Info className="h-3 w-3" />
                    </Button>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup 
                    value={settings.quality}
                    onValueChange={(value) => 
                        setSettings({ quality: value as VideoSettings["quality"] })
                    }
                    >
                    <DropdownMenuRadioItem value="480p">480p - SD</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="720p">720p - HD</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="1080p">1080p - FHD</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                </DropdownMenuContent>
                </DropdownMenu>

                <DurationControl />
            </>
        )}

        <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button 
            variant="outline" 
            className={cn(
                "flex gap-2 h-10 px-4 rounded-xl border-2 transition-all duration-200 group border-muted text-muted-foreground hover:bg-accent/50 select-none"
            )}
            >
            {settings.display === "column" ? (
                <GalleryVerticalEnd className="h-4 w-4" />
                ) : settings.display === "grid" ? (
                <Grid2x2 className="h-4 w-4" />
                ) : (
                <GalleryHorizontal className="h-4 w-4" />
                )}
            <span className="font-medium">
                {settings.display === "column" ? "Column" : settings.display === "grid" ? "Grid" : "Carousel"}
                
            </span>
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
            <DropdownMenuLabel className="flex items-center justify-between">
            Display Layout
            <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 rounded-full hover:bg-accent/50"
            onClick={() => showSettingInfo('display')}
            >
                <Info className="h-3 w-3" />
            </Button>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup 
            value={settings.display}
            onValueChange={(value) => 
                setSettings({ display: value as VideoSettings["display"] })
            }
            >
            <DropdownMenuRadioItem value="column" className="gap-2">
                <GalleryVerticalEnd  className="w-4 h-4" />
                Column
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="grid" className="gap-2">
                <Grid2x2 className="w-4 h-4" />
                Grid
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="carousel" className="gap-2">
                <GalleryHorizontal className="w-4 h-4" />
                Carousel
            </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
        </DropdownMenuContent>
        </DropdownMenu>
    </div>
    );

    return (
        <div>
            <div className={`flex flex-col min-h-[calc(100vh-3.5rem)] transition-all duration-300 ${isOpen ? "pl-40" : "pl-0"}`}>
                <div className="flex flex-1 flex-col h-full">
                    {pathname === "/video" && (
                        <div className="flex-1 flex items-center justify-center my-10">
                            <GreetingMessage
                            username="Pascal" 
                            questionText="Ready to create your next video masterpiece?"
                            options={videoOptions}
                            handlePressed={handleClicked}
                            />
                        </div>
                    )}

                    <div className={pathname === "/video" ? "flex-initial" : "flex-1"}>
                        {children}
                    </div>

                    {/* Prompt Input Area - Fixed at the bottom */}
                    <div className="mt-auto">
                        <div className="max-w-4xl mx-auto p-2">
                            {/* Add restriction warning */}
                            {restrictions.video.isRestricted && restrictions.video.comebackTime && (
                                <div className="mb-2">
                                    <RestrictionWarning 
                                        message={restrictions.video.message || "You've reached the video limit."}
                                        comebackTime={new Date(restrictions.video.comebackTime).toLocaleTimeString()}
                                    />
                                </div>
                            )}

                            {uploadedFile && pathname === ('/video') && (
                            <div className="mb-2">
                                <FilePreview 
                                file={uploadedFile} 
                                onRemove={handleRemoveFile} 
                                />
                            </div>
                            )}
                            
                            {pathname === ('/video') && (
                                <div className="relative flex items-center gap-2 mb-2">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={handleFileChange}
                                    accept={Object.entries(CHAT_ALLOWED_FILE_TYPES)
                                    .flatMap(([, exts]) => exts)
                                    .join(',')}
                                />
                                
                                <div className="flex-1 flex items-end gap-2 px-4 py-3 rounded-xl border bg-backgroundSecondary border-borderColorPrimary transition-colors shadow-lg relative">
                                    <div className="flex justify-center items-center relative">
                                        

                                        <FileUploadButton
                                        onUploadFromComputer={handleUploadFromComputer}
                                        onUploadFromDrive={handleUploadFromDrive}
                                        buttonIcon={
                                        <Button 
                                            variant="ghost" 
                                            size="icon"
                                            className="h-8 w-8 rounded-full focus-visible:outline-none"
                                            >
                                            <Plus className="absolute p-1 border border-borderColorPrimary top-0 rounded-full h-8 w-8" />
                                        </Button>
                                        }
                                />
                                    </div>
                                    
                                    <Textarea
                                    ref={textareaRef}
                                    placeholder="Describe your video"
                                    className="flex-1 bg-transparent border-0 outline-none text-base resize-none overflow-auto min-h-[2rem] max-h-[10rem] p-0 focus:border-0 focus:ring-0"
                                    value={prompt}
                                    onPaste={handlePaste}
                                    onChange={(e) => {
                                        e.target.style.height = 'inherit';
                                        e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
                                        setPrompt(e.target.value);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSubmit();
                                        }
                                    }}
                                    rows={1}
                                    style={{
                                        overflow: prompt.split('\n').length > 4 ? 'auto' : 'hidden',
                                        scrollbarWidth: 'none',
                                    }}
                                    />

                                    <MicButton isListening={isListening} onClick={toggleListening} 
                                    className={`rounded-full h-8 w-8 bg-bodyColor hover:bg-opacity-70 transition-all duration-200 text-white dark:text-black ${
                                        prompt.trim()
                                        && "hidden"
                                        }`}
                                    />

                                    <div className="flex items-center gap-2">
                                    <Button 
                                        onClick={handleSubmit}
                                        disabled={!prompt.trim() || isLoading || isPathRestricted}
                                        className={cn(
                                        "rounded-xl px-4",
                                        "transition-all duration-200",
                                        prompt.trim() && selectedModels.video.length >= 0
                                            ? "bg-bodyColor hover:bg-opacity-70 transition-all duration-200"
                                            : "bg-gray-300 text-gray-500 hover:bg-gray-300"
                                        )}
                                    >
                                        {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : "Generate"}
                                    </Button>
                                    </div>
                                </div>
                                </div>
                            )}
                            <AdvancedOptions />
                        </div>
                    </div>
                </div>
                <VideoSettingsInfoModal
                    isOpen={infoModalOpen}
                    onClose={() => setInfoModalOpen(false)}
                    settingType={currentSettingInfo}
                />
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
        </div>
    )
}
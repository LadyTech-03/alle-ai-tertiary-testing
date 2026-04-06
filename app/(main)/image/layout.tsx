// @ts-nocheck
"use client";
import { useState, useRef, useEffect } from "react";
import { ChatInput } from "@/components/features/ChatInput";
import GreetingMessage from "@/components/features/GreetingMessage";
import { useContentStore, useSidebarStore, useHistoryStore, useUsageRestrictionsStore, useAuthStore } from "@/stores";
import { usePathname, useRouter } from "next/navigation";
import RenderPageContent from "@/components/RenderPageContent";
import Link from "next/link";
import { Lightbulb, Image, Anchor, TreePalm } from 'lucide-react';
import { chatApi } from '@/lib/api/chat';
import { historyApi } from '@/lib/api/history';
import { useSelectedModelsStore } from '@/stores';
import { useConversationStore } from '@/stores/models';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { useModelsStore } from "@/stores/models";
import { modelsApi } from "@/lib/api/models";
import { QuickLoader } from "@/components/QuickLoader";
import { imageOptions } from "@/lib/constants";
import { is } from "date-fns/locale";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { content, setContent } = useContentStore();
  const router = useRouter();
  const pathname = usePathname();
  const { isOpen } = useSidebarStore();
  const { selectedModels } = useSelectedModelsStore();
  const { setConversationId, setPromptId, setGenerationType } = useConversationStore();
  const { addHistory, updateHistoryTitle, getHistoryByType, setHistory, setLoading: setHistoryLoading, setError: setHistoryError } = useHistoryStore();
  const [showNegativePrompt, setShowNegativePrompt] = useState(false);
  const [negativePrompt, setNegativePrompt] = useState("");
  const { imageModels, setImageModels, setLoading: setModelsLoading, setError: setModelsError } = useModelsStore();
  const { setRestriction, restrictions, clearRestriction } = useUsageRestrictionsStore();
  const [preLoading, setPreLoading ] = useState(false);
  const { isAuthenticated, token } = useAuthStore();

      // Treat share routes as public: skip auth checks here
  const isShareRoute = (
    pathname.startsWith('/chat/shares/') ||
    pathname.startsWith('/image/shares/') ||
    pathname.startsWith('/audio/shares/') ||
    pathname.startsWith('/video/shares/') ||
    pathname.startsWith('/share/')
  );
  

  const setCurrentPage = useSidebarStore((state) => state.setCurrentPage);

  useEffect(() => {
    setCurrentPage("image");
  }, [setCurrentPage]);

  // Reset the value of preloader when pathname changes
  useEffect(()=>{
    setPreLoading(false);
  },[pathname])

  // Add effect to track restriction timers
  useEffect(() => {
    // Check if image is restricted and has a comeback time
    if (restrictions.image.isRestricted && restrictions.image.comebackTime) {
      const comebackTime = new Date(restrictions.image.comebackTime).getTime();
      const now = Date.now();
      const timeUntilComeback = comebackTime - now;

      // If comeback time is in the future, set a timer
      if (timeUntilComeback > 0) {
        const timer = setTimeout(() => {
          clearRestriction('image');
          toast.success('Image restrictions have been lifted!');
        }, timeUntilComeback);

        // Cleanup timer on unmount or if restrictions change
        return () => clearTimeout(timer);
      } else {
        // If comeback time has already passed, clear restriction immediately
        clearRestriction('image');
      }
    }
  }, [restrictions.image.isRestricted, restrictions.image.comebackTime]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const { isRestricted, restrictions } = useUsageRestrictionsStore.getState();
    
    // Check if image is currently restricted
    if (isRestricted('image') && restrictions.image.comebackTime) {
      const restriction = restrictions.image;
      const comebackTime = new Date(restriction.comebackTime!);
      const formattedTime = comebackTime.toLocaleTimeString();
      return;
    }
    
    try {
      setIsLoading(true);
      setPreLoading(true);
      const allSelectedModels = selectedModels.image;
          
      // const conversationResponse = await chatApi.createConversation(allSelectedModels, 'image');
      const newConversationResponse = await chatApi.newConversation(
        allSelectedModels,
        'image',
        input,
      );

      if (!newConversationResponse) {
      setPreLoading(false);
      return;
    }

      switch (newConversationResponse.status_code) {
        case 'limit_reached':
          setRestriction('image', newConversationResponse.message, newConversationResponse.comeback_time);
          return;
      }

      const conversationId = newConversationResponse.data.conversation.session;
      const promptData = newConversationResponse.data.promptData;
      
      setContent("image", "input", input);
      setGenerationType('new');
      
      setConversationId(conversationId);
      setPromptId(promptData.id);
      router.push(`/image/res/${conversationId}`);
      setInput("");
      
      addHistory({
        session: conversationId,
        title: input,
        type: 'image',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Get actual title based on prompt
      historyApi.getConversationTitle(conversationId, input, 'image')
        .then(response => {
          updateHistoryTitle(conversationId, response.title);
           // Set document title
           document.title = `${response.title} - Alle-AI`;
        })
        .catch(error => {
          // console.error('Error getting conversation title:', error);
        });


    } catch (error) {
      // console.error('Error in image generation flow:', error);
      setPreLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  const preferredOrder = ['dall-e-3','imagen-4-ultra','stable-image-ultra','imagen-4','grok-2-image','stable-diffusion-3-5-large','imagen-4','gemini-2-0-flash-image-generation']

  // Load image models on mount if not already loaded
  useEffect(() => {

    // Skip verification entirely for public share routes
      if (isShareRoute && !isAuthenticated && !token) {
        return;
      }

    const loadImageModels = async () => {

      if (imageModels && imageModels.length > 0) return;
      setModelsLoading(true);
      try {
        const models = await modelsApi.getModels('image');
        const sortedImageModels = models.sort((a, b) => {
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
        setImageModels(sortedImageModels);
        // console.log('Image models loaded', models);
      } catch (err: any) {
        setModelsError(err.response.data.error || err.response.data.message || 'Failed to load image models');
      } finally {
        setModelsLoading(false);
      }
    };

    loadImageModels();
  }, [setImageModels, setModelsLoading, setModelsError, imageModels, isAuthenticated, isShareRoute, token]);

        // Load image history
  useEffect(() => {

    // Skip verification entirely for public share routes
      if (isShareRoute && !isAuthenticated && !token) {
        return;
      }

    const loadHistory = async () => {
      const imageHistory = getHistoryByType('image');
      if (imageHistory && imageHistory.length > 0) {
        return;
      }
      
      setHistoryLoading(true);
      try {
        const response = await historyApi.getHistory('image');
        // console.log("Fetched image history:", response.data);
        setHistory(response.data);
      } catch (err: any) {
        setHistoryError(err.response.data.error || err.response.data.message || 'Failed to load image history');
      } finally {
        setHistoryLoading(false);
      }
    };

    loadHistory();
  }, [getHistoryByType, isAuthenticated, isShareRoute, setHistory, setHistoryError, setHistoryLoading, token]);
  

  const handleClicked = (opt: { label: string }) => {
    setInput(opt.label);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <div className={`flex flex-col min-h-[calc(100vh-3.5rem)] transition-all duration-300 ${isOpen ? "pl-40" : "pl-0"}`}>
        <div className={`${pathname.startsWith('/image/res/') ? '' : 'flex-1'} flex flex-col`}>
        {preLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <QuickLoader size="sm" />
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center items-center gap-8">
            {pathname === "/image" && (
            <GreetingMessage
              options={imageOptions}
              handlePressed={handleClicked}
              questionText="Ready to create something amazing today?"
            />
            )}
            {pathname === '/image' && (
              <div className="w-full max-w-3xl px-4">
                <ChatInput
                  value={input}
                  onChange={setInput}
                  onSend={handleSend}
                  inputRef={inputRef}
                  isLoading={isLoading}
                />
                {/* <div className="flex items-center space-x-2 p-2">
                  <Switch
                    variant="sm"
                    id="negative-prompt"
                    checked={showNegativePrompt}
                    onCheckedChange={setShowNegativePrompt}
                  />
                  <Label htmlFor="negative-prompt">Negative Prompt</Label>
                </div> */}
                {showNegativePrompt && (
                  <Textarea
                    placeholder="Enter negative prompt here..."
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    className="min-h-[100px] border-borderColorPrimary focus-visible:outline-none"
                  />
                )}
                
              </div>
            )}
          </div>
        )}
        </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

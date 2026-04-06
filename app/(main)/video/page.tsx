"use client"
import { useEffect } from "react";
import { useSidebarStore } from "@/stores";
import VideoArea from "@/components/features/video/VideoArea";
import { toast } from "sonner";
import { useModelsStore } from "@/stores/models";
import { useSelectedModelsStore } from "@/stores";
import { Model, modelsApi } from "@/lib/api/models";

interface ErrorResponse {
  status: boolean;
  status_code: number;
  message: string;
}

export default function VideoGenerationPage() {
  const { videoModels, setVideoModels, setLoading: setModelsLoading, setError: setModelsError } = useModelsStore();
  const { 
    selectedModels,
    setTempSelectedModels, 
    saveSelectedModels, 
    setLoadingLatest 
  } = useSelectedModelsStore();
  const { isOpen } = useSidebarStore();

  const preferredOrder = [''];

      // Load video models on mount if not already loaded
      useEffect(() => {
        const loadVideoModels = async () => {
          // Skip if models are already loaded
          if (videoModels && videoModels.length > 0){
            loadLatestSelectedModels();
            return;
          }
          setLoadingLatest(true);
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
            // console.log('Video models loaded', models);
            await loadLatestSelectedModels();
          } catch (err: any) {
            setModelsError(err.response.data.error || err.response.data.message || 'Failed to load video models');
          } finally {
            setModelsLoading(false);
          }
        };
    
      const loadLatestSelectedModels = async () => {
        if (selectedModels.video && selectedModels.video.length > 0) return;
  
        setLoadingLatest(true);
        try {
          const latestModels = await modelsApi.getLatestSelectedModels('video');

          if (!Array.isArray(latestModels) && ((latestModels as ErrorResponse).status == false && (latestModels as ErrorResponse).status_code === 201)) {
            return;            
          } else if (!Array.isArray(latestModels) && (latestModels as ErrorResponse).status == false) {
            toast.error((latestModels as ErrorResponse).message);
            return;
          }

          const modelUids = latestModels.map(model => model.model_uid);
          setTempSelectedModels(modelUids);
          saveSelectedModels('video');
  
          // Toggle inactive models using toggleModelActive
          latestModels.forEach((model: Model) => {
            if (model.active === 0) {
              useSelectedModelsStore.getState().toggleModelActive(model.model_uid);
            }
          });
        } catch (err: any) {
          if(err.response?.status === 404) {
            return;
          } else {
            // toast.error('Error loading last used models');
          }
        } finally {
          setLoadingLatest(false);
        }
      };
  
      loadVideoModels();
    }, [setVideoModels, setModelsLoading, setModelsError, selectedModels.video]);


  return ;
}

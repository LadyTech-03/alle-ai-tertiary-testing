"use client";
import { useEffect } from "react";
import { useSelectedModelsStore, useSidebarStore } from "@/stores";
import { useModelsStore } from "@/stores/models";
import { Model, modelsApi } from "@/lib/api/models";
import { useAudioTabStore } from '@/stores/audioTabStore';
import { useAudioCategorySelectionStore } from '@/stores/audioCategorySelectionStore';
import { toast } from "sonner";

interface ErrorResponse {
  status: boolean;
  status_code: number;
  message: string;
}

export default function AudioGenerationPage() {

  const { isOpen } = useSidebarStore();
  const { 
    selectedModels,
    setTempSelectedModels, 
    saveSelectedModels, 
    setLoadingLatest,
    setInitialized, 
  } = useSelectedModelsStore();
  const { audioModels, setAudioModels, setLoading: setModelsLoading, setError: setModelsError } = useModelsStore();
  const { activeTab } = useAudioTabStore();
  const { getCategoryModel, setCategoryModel } = useAudioCategorySelectionStore();

  const preferredOrder = [''];


  // Load audio models on mount if not already loaded
  useEffect(() => {
    const loadAudioModels = async () => {
      if (audioModels && audioModels.length > 0) {
        loadLatestSelectedModels();
        return;
      };

      // setLoadingLatest(true);
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
        // console.log(sortedAudioModels, 'These are the models')
        setAudioModels(sortedAudioModels);

        // Now that we have audio models, load the latest selected models
        await loadLatestSelectedModels(); 
      } catch (err: any) {
        setModelsError(err.response.data.error || err.response.data.message || 'Failed to load audio models');
      } finally {
        setModelsLoading(false);
      }
    };

    const loadLatestSelectedModels = async () => {
      // Instead of checking selectedModels.audio, check the per-category store
      const modelId = getCategoryModel(activeTab);
      if (modelId) {
        setTempSelectedModels([modelId]);
        saveSelectedModels('audio');
        return;
      }

      setLoadingLatest(true);
      try {
        const latestModels = await modelsApi.getLatestSelectedModels('audio');

        if (!Array.isArray(latestModels) && ((latestModels as ErrorResponse).status == false && (latestModels as ErrorResponse).status_code === 201)) {
          return;            
        } else if (!Array.isArray(latestModels) && (latestModels as ErrorResponse).status == false) {
          toast.error((latestModels as ErrorResponse).message);
          return;
        }

        // Save each model to the correct slot in the audioCategorySelectionStore
        latestModels.forEach((model: Model) => {
          if (model.model_category && model.model_uid && ['tts', 'stt', 'ag'].includes(model.model_category)) {
            setCategoryModel(model.model_category as 'tts' | 'stt' | 'ag', model.model_uid);
          }
          if (model.active === 0) {
            useSelectedModelsStore.getState().toggleModelActive(model.model_uid);
          }
        });

        // After saving, set the selected model for the current tab from the store
        const storeModelId = getCategoryModel(activeTab);
        if (storeModelId) {
          setTempSelectedModels([storeModelId]);
        } else {
          setTempSelectedModels([]);
        }
        saveSelectedModels('audio');
      } catch (err: any) {
        return;
      } finally { 
        setLoadingLatest(false);
        setInitialized(true);
      }
    };

    loadAudioModels();
  }, [setAudioModels, setModelsLoading, setModelsError, activeTab, audioModels]);

  return null;
}

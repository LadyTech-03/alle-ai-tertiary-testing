"use client";
import { useState, useEffect } from "react";
import {
  useCreateClassGroups,
  useUpdateClassGroup,
} from "@/hooks/use-org-course";
import { Loader } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
interface ClassInput {
  id: string;
  name: string;
  free_chat: boolean;
}


interface ClassModalProps {
  mode: "add" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: {
    name: string;
    slug: string;
    free_chat: boolean;
  };
}


export default function ClassModal({
  mode,
  open,
  onOpenChange,
  initialData,
}: ClassModalProps) {
  // Mutation hooks 
  const createClassGroupsMutation = useCreateClassGroups();
  const updateClassGroupMutation = useUpdateClassGroup();
  // For edit mode - single class
  const [name, setName] = useState("");
  const [freeChat, setFreeChat] = useState(false);

  // For add mode - multiple classes
  const [classes, setClasses] = useState<ClassInput[]>([
    { id: "1", name: "", free_chat: true },
  ]);

  useEffect(() => {
    if (mode === "edit" && initialData) {
      setName(initialData.name);
      setFreeChat(initialData.free_chat);
    } else {
      setClasses([{ id: "1", name: "", free_chat: true }]);
    }
  }, [mode, initialData, open]);

  const addClassInput = () => {
    setClasses([
      ...classes,
      { id: Date.now().toString(), name: "", free_chat: true },
    ]);
  };

  const removeClassInput = (id: string) => {
    if (classes.length > 1) {
      setClasses(classes.filter((cls) => cls.id !== id));
    }
  };


  const updateClassName = (id: string, name: string) => {
    setClasses(classes.map((cls) => (cls.id === id ? { ...cls, name } : cls)));
  };

  const updateClassFreeChat = (id: string, free_chat: boolean) => {
    setClasses(
      classes.map((cls) => (cls.id === id ? { ...cls, free_chat } : cls))
    );
  };

  // Validation logic
  const isEditValid =
    mode === "edit" &&
    name.trim() !== "" &&
    (name !== initialData?.name || freeChat !== initialData?.free_chat);

  const validClassesCount = classes.filter(
    (cls) => cls.name.trim() !== ""
  ).length;
  const isAddValid = mode === "add" && validClassesCount > 0;

  const isSubmitting =
    createClassGroupsMutation.isPending || updateClassGroupMutation.isPending;
  const canSubmit =
    (mode === "edit" ? isEditValid : isAddValid) && !isSubmitting;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit) return;

    if (mode === "edit") {
      if (!initialData?.slug) return;

      updateClassGroupMutation.mutate(
        {
          slug: initialData.slug,
          payload: {
            name: name.trim(),
            free_chat: freeChat,
          },
        },
        {
          onSuccess: () => {
            setName("");
            setFreeChat(false);
            onOpenChange(false);
          },
        }
      );
    } else {
      // Filter out empty names
      const validClasses = classes.filter((cls) => cls.name.trim() !== "");

      createClassGroupsMutation.mutate(
        {
          class_groups: validClasses.map(({ name, free_chat }) => ({
            name: name.trim(),
            free_chat,
          })),
        },
        {
          onSuccess: () => {
            setClasses([{ id: "1", name: "", free_chat: true }]);
            onOpenChange(false);
          },
        }
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit Class" : "Add Classes"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update the class name and free chat settings"
              : "Add multiple classes at once. Each class can have its own free chat setting."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {mode === "edit" ? (
              // Edit mode - single class
              <>
                <div className="grid gap-2">
                  <Label htmlFor="name">Class Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Basic Seven"
                    required
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="free-chat">Free Chat</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow students to use chat features
                    </p>
                  </div>
                  <Switch
                    id="free-chat"
                    checked={freeChat}
                    onCheckedChange={setFreeChat}
                  />
                </div>
              </>
            ) : (
              // Add mode - multiple classes
              <>
                <AnimatePresence mode="popLayout">
                  {classes.map((cls, index) => (
                    <motion.div
                      key={cls.id}
                      initial={{ opacity: 0, height: 0, y: -10 }}
                      animate={{ opacity: 1, height: "auto", y: 0 }}
                      exit={{ opacity: 0, height: 0, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                      <div className="grid gap-3 p-4 border rounded-lg relative">
                        <div className="flex items-start justify-between gap-2">
                          <Label className="text-sm font-medium">
                            Class {index + 1}
                          </Label>
                          {classes.length > 1 && (
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 -mt-1"
                                onClick={() => removeClassInput(cls.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            </motion.div>
                          )}
                        </div>
                        <Input
                          value={cls.name}
                          onChange={(e) =>
                            updateClassName(cls.id, e.target.value)
                          }
                          placeholder="e.g., Basic Seven"
                          required
                        />
                        <div className="flex items-center justify-between">
                          <Label
                            htmlFor={`free-chat-${cls.id}`}
                            className="text-sm text-muted-foreground"
                          >
                            Free Chat
                          </Label>
                          <Switch
                            id={`free-chat-${cls.id}`}
                            checked={cls.free_chat}
                            onCheckedChange={(checked) =>
                              updateClassFreeChat(cls.id, checked)
                            }
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addClassInput}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Class
                  </Button>
                </motion.div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {isSubmitting && <Loader className="h-4 w-4 mr-2 animate-spin" />}
              {isSubmitting
                ? mode === "edit"
                  ? "Saving..."
                  : "Creating..."
                : mode === "edit"
                  ? "Save Changes"
                  : "Create Classes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

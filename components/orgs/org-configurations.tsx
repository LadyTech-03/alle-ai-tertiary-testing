import { Card, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { ScrollArea } from "../ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { ChevronDown, Filter, Loader2, Loader, Edit, Save, X } from "lucide-react";
import { useState } from "react";

const facultyOptions = [
  {
    value: "default",
    label: "Default",
    description: "Standard response style",
  },
  {
    value: "curriculum-architect",
    label: "Curriculum Architect",
    description:
      "Outcome-driven design. Generates lesson plans, activities, and assignments aligned to specific learning objectives.",
  },
  {
    value: "technical-editor",
    label: "Technical Editor",
    description:
      "Rigorous review. Focuses solely on checking text for clarity, conciseness, and adherence to specific institutional style guides.",
  },
  {
    value: "assessment-rubric",
    label: "Assessment Rubric Maker",
    description:
      "Criterion-based. Automatically formats output as a grading rubric, defining criteria, tiers, and associated scores.",
  },
  {
    value: "research-synthesis",
    label: "Research Synthesis",
    description:
      "Analytical. Focuses on summarizing, comparing, and analyzing complex data or multiple academic sources.",
  },
  {
    value: "formal-communications",
    label: "Formal Communications",
    description:
      "Policy and memo-focused. Generates professional, structured text suitable for internal administration and policy documents.",
  },
];

const studentOptions = [
  {
    value: "default",
    label: "Default",
    description: "Standard response style",
  },
  {
    value: "questioner",
    label: "Study Partner: Questioner",
    description:
      "Questions-first approach. Provides hints and counter-questions instead of direct answers to build critical thinking.",
  },
  {
    value: "step-by-step",
    label: "Learning Mode: Step-by-Step",
    description:
      "Procedural and structured. Provides output as clear, numbered lists and methodical steps for processes and solutions.",
  },
  {
    value: "visuals-first",
    label: "Learning Mode: Visuals First",
    description:
      "Image-priority. Explains concepts primarily through diagrams, charts, and suggested visual representations.",
  },
  {
    value: "explainer",
    label: "Study Partner: Explainer",
    description:
      "Jargon-free and analogical. Breaks down complex ideas using simple language and relatable metaphors.",
  },
  {
    value: "factual-review",
    label: "Test Prep: Factual Review",
    description:
      "Assessment-focused. Delivers information as flashcards, practice questions, or concise definitions for recall.",
  },
];

export default function OrgConfigurations() {
  const [selectedFaculty, setSelectedFaculty] = useState("default");
  const [selectedStudent, setSelectedStudent] = useState("default");
  const [isModelManagerOpen, setIsModelManagerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  // Loading states for feature toggles
  const [loadingFeatures, setLoadingFeatures] = useState<Record<string, boolean>>({});
  
  // Loading states for model toggles  
  const [loadingModels, setLoadingModels] = useState<Record<string, boolean>>({});

  // Custom instructions state
  const [customInstructions, setCustomInstructions] = useState({
    faculty: "",
    student: ""
  });
  const [editingInstructions, setEditingInstructions] = useState({
    faculty: false,
    student: false
  });
  const [savingInstructions, setSavingInstructions] = useState({
    faculty: false,
    student: false
  });

  const [featureAccess, setFeatureAccess] = useState({
    chat: { faculty: true, student: true },
    image: { faculty: true, student: true },
    webSearch: { faculty: true, student: true },
    audio: { faculty: true, student: true },
    video: { faculty: true, student: true }
  });

  const [modelRestrictions, setModelRestrictions] = useState({
    "gpt-4": { faculty: true, student: true },
    "gpt-3.5-turbo": { faculty: true, student: true },
    "claude-3": { faculty: true, student: true },
    "gemini-pro": { faculty: true, student: true },
    "dall-e-3": { faculty: true, student: true },
    "midjourney": { faculty: true, student: true },
    "stable-diffusion": { faculty: true, student: true },
    "elevenlabs": { faculty: true, student: true },
    "whisper": { faculty: true, student: true },
    "sora": { faculty: true, student: true },
    "runway": { faculty: true, student: true }
  });

  const handleFeatureToggle = async (feature: string, role: 'faculty' | 'student') => {
    const loadingKey = `${feature}-${role}`;
    
    // Set loading state
    setLoadingFeatures(prev => ({ ...prev, [loadingKey]: true }));

    // Simulate API call with 3-second delay
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Update the actual state
    setFeatureAccess(prev => ({
      ...prev,
      [feature]: {
        ...prev[feature as keyof typeof prev],
        [role]: !prev[feature as keyof typeof prev][role]
      }
    }));

    // Clear loading state
    setLoadingFeatures(prev => ({ ...prev, [loadingKey]: false }));
  };

  const handleModelToggle = async (model: string, role: 'faculty' | 'student') => {
    const loadingKey = `${model}-${role}`;
    
    // Set loading state
    setLoadingModels(prev => ({ ...prev, [loadingKey]: true }));

    // Simulate API call with 3-second delay
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Update the actual state
    setModelRestrictions(prev => ({
      ...prev,
      [model]: {
        ...prev[model as keyof typeof prev],
        [role]: !prev[model as keyof typeof prev][role]
      }
    }));

    // Clear loading state
    setLoadingModels(prev => ({ ...prev, [loadingKey]: false }));
  };

  const handleSaveInstructions = async (role: 'faculty' | 'student') => {
    setSavingInstructions(prev => ({ ...prev, [role]: true }));
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setEditingInstructions(prev => ({ ...prev, [role]: false }));
    setSavingInstructions(prev => ({ ...prev, [role]: false }));
  };

  const handleCancelEdit = (role: 'faculty' | 'student') => {
    setEditingInstructions(prev => ({ ...prev, [role]: false }));
  };

  const features = [
    { key: 'chat', label: 'Chat' },
    { key: 'image', label: 'Image' },
    { key: 'webSearch', label: 'Web Search' },
    { key: 'audio', label: 'Audio' },
    { key: 'video', label: 'Video' }
  ];

  const modelCategories = [
    { value: "all", label: "All Models" },
    { value: "chat", label: "Chat" },
    { value: "image", label: "Image" },
    { value: "audio", label: "Audio" },
    { value: "video", label: "Video" },
    { value: "disabled", label: "Disabled" }
  ];

  const models = [
    {
      id: "gpt-4",
      name: "GPT-4",
      provider: "OpenAI",
      category: "chat",
      avatar: "/public/models/gpt-4.webp"
    },
    {
      id: "gpt-3.5-turbo",
      name: "GPT-3.5 Turbo",
      provider: "OpenAI",
      category: "chat",
      avatar: "/public/models/gpt-3-5.webp"
    },
    {
      id: "claude-3",
      name: "Claude 3",
      provider: "Anthropic",
      category: "chat",
      avatar: "/public/models/claude-3.webp"
    },
    {
      id: "gemini-pro",
      name: "Gemini Pro",
      provider: "Google",
      category: "chat",
      avatar: "/public/models/gemini.webp"
    },
    {
      id: "dall-e-3",
      name: "DALL-E 3",
      provider: "OpenAI",
      category: "image",
      avatar: "/public/models/dall-e.webp"
    },
    {
      id: "midjourney",
      name: "Midjourney",
      provider: "Midjourney",
      category: "image",
      avatar: "/public/models/midjourney.webp"
    },
    {
      id: "stable-diffusion",
      name: "Stable Diffusion",
      provider: "Stability AI",
      category: "image",
      avatar: "/public/models/stability-ai.webp"
    },
    {
      id: "elevenlabs",
      name: "ElevenLabs",
      provider: "ElevenLabs",
      category: "audio",
      avatar: "/public/models/elevenLabs.webp"
    },
    {
      id: "whisper",
      name: "Whisper",
      provider: "OpenAI",
      category: "audio",
      avatar: "/public/models/openai.webp"
    },
    {
      id: "sora",
      name: "Sora",
      provider: "OpenAI",
      category: "video",
      avatar: "/public/models/sora.webp"
    },
    {
      id: "runway",
      name: "Runway",
      provider: "Runway",
      category: "video",
      avatar: "/public/models/runway.webp"
    }
  ];

  const filteredModels = (() => {
    if (selectedCategory === "all") {
      return models;
    } else if (selectedCategory === "disabled") {
      return models.filter(model => 
        !modelRestrictions[model.id as keyof typeof modelRestrictions]?.faculty || 
        !modelRestrictions[model.id as keyof typeof modelRestrictions]?.student
      );
    } else {
      return models.filter(model => model.category === selectedCategory);
    }
  })();

  return (
    <Card className="bg-background max-w-4xl p-6">
      <CardTitle className="text-xl mb-2">Configuration</CardTitle>
      <Separator className="mb-6" />

      <div className="flex mb-6 justify-between items-start gap-8">
        <div className="flex-1">
          <h2 className="text-lg font-semibold mb-2">Base style and tone</h2>
          <p className="text-sm max-w-3xl text-muted-foreground">
            {`Set the style and tone of how models responds to your members. This
            doesn't impact the models capabilities`}
          </p>
        </div>

        <div className="flex flex-col gap-3 min-w-[200px]">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium w-20">Faculty</span>
            <DropdownMenu>
              <DropdownMenuTrigger className="px-3 py-2 border dark:bg-accent rounded-md text-sm flex items-center gap-2">
                {facultyOptions.find((o) => o.value === selectedFaculty)?.label}
                <ChevronDown className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 bg-background dark:bg-accent">
                <TooltipProvider>
                  {facultyOptions.map((option) => (
                    <Tooltip key={option.value}>
                      <TooltipTrigger asChild>
                        <DropdownMenuItem
                          onClick={() => setSelectedFaculty(option.value)}
                        >
                          {option.label}
                        </DropdownMenuItem>
                      </TooltipTrigger>
                      <TooltipContent
                        side="left"
                        className="max-w-sm bg-background"
                      >
                        <p className="text-sm">{option.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </TooltipProvider>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium w-20">Students</span>
            <DropdownMenu>
              <DropdownMenuTrigger className="px-3 py-2 dark:bg-accent border rounded-md text-sm flex items-center gap-2">
                {studentOptions.find((o) => o.value === selectedStudent)?.label}
                <ChevronDown className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 bg-background dark:bg-accent ">
                <TooltipProvider>
                  {studentOptions.map((option) => (
                    <Tooltip key={option.value}>
                      <TooltipTrigger asChild>
                        <DropdownMenuItem
                          onClick={() => setSelectedStudent(option.value)}
                        >
                          {option.label}
                        </DropdownMenuItem>
                      </TooltipTrigger>
                      <TooltipContent
                        side="left"
                        className="max-w-sm bg-background dark:bg-accent"
                      >
                        <p className="text-sm">{option.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </TooltipProvider>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      <Separator className="mb-6" />

      {/* Custom Instructions Section */}
      <div className="flex mb-4 justify-between items-start gap-8">
        <div className="flex-1">
          <h2 className="text-lg font-semibold mb-2">Custom Instructions</h2>
          <p className="text-sm max-w-3xl text-muted-foreground ">
            Add custom instructions for faculty and students to personalize their experience
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Faculty Instructions */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Faculty</Label>
          {editingInstructions.faculty ? (
            <div className="flex items-start gap-2 max-w-2xl">
              <Input
                value={customInstructions.faculty}
                onChange={(e) => setCustomInstructions(prev => ({ ...prev, faculty: e.target.value }))}
                placeholder="Enter custom instructions for faculty..."
                className="flex-1"
              />
              <div className="flex items-center gap-1">
                {savingInstructions.faculty ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            onClick={() => handleSaveInstructions('faculty')}
                            className="h-9"
                          >
                            <Save className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Save instructions</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancelEdit('faculty')}
                            className="h-9"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Cancel editing</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 max-w-2xl">
              <div className="flex-1 bg-muted/50 rounded-md px-3 py-2 text-sm">
                {customInstructions.faculty ? (
                  <p className="truncate">{customInstructions.faculty}</p>
                ) : (
                  <p className="text-muted-foreground italic">No custom instructions set</p>
                )}
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingInstructions(prev => ({ ...prev, faculty: true }))}
                      className="h-9"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Edit instructions</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>

        {/* Student Instructions */}
        <div className="space-y-2 mb-6">
          <Label className="text-sm font-medium">Students</Label>
          {editingInstructions.student ? (
            <div className="flex items-start gap-2 max-w-2xl">
              <Input
                value={customInstructions.student}
                onChange={(e) => setCustomInstructions(prev => ({ ...prev, student: e.target.value }))}
                placeholder="Enter custom instructions for students..."
                className="flex-1"
              />
              <div className="flex items-center gap-1">
                {savingInstructions.student ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            onClick={() => handleSaveInstructions('student')}
                            className="h-9"
                          >
                            <Save className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Save instructions</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancelEdit('student')}
                            className="h-9"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Cancel </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 max-w-2xl">
              <div className="flex-1 bg-muted/50 rounded-md px-3 py-2 text-sm">
                {customInstructions.student ? (
                  <p className="truncate">{customInstructions.student}</p>
                ) : (
                  <p className="text-muted-foreground italic">No custom instructions set</p>
                )}
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingInstructions(prev => ({ ...prev, student: true }))}
                      className="h-9"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Edit instructions</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>
      </div>
      <Separator className="mb-6 mt-6" />

      {/* Feature Access Section */}
      <div className="flex mb-4 justify-between items-start gap-8">
        <div className="flex-1">
          <h2 className="text-lg font-semibold mb-2">Feature Access</h2>
          <p className="text-sm max-w-3xl text-muted-foreground">
            Control which features are available to faculty and students
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Header Row */}
        <div className="flex items-center gap-6">
          <div className="w-32 text-sm font-medium text-muted-foreground">Features</div>
          <div className="flex-1 grid grid-cols-2 gap-8">
            <div className="text-sm font-medium text-center">Faculty</div>
            <div className="text-sm font-medium text-center">Students</div>
          </div>
        </div>

        {/* Feature Rows */}
        {features.map((feature) => {
          const facultyLoadingKey = `${feature.key}-faculty`;
          const studentLoadingKey = `${feature.key}-student`;
          
          return (
            <div key={feature.key} className="flex items-center gap-6">
              <div className="w-32 text-sm font-medium">{feature.label}</div>
              <div className="flex-1 grid grid-cols-2 gap-8">
                <div className="flex justify-center">
                  {loadingFeatures[facultyLoadingKey] ? (
                    <Loader className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <Switch
                      checked={featureAccess[feature.key as keyof typeof featureAccess].faculty}
                      onCheckedChange={() => handleFeatureToggle(feature.key, 'faculty')}
                    />
                  )}
                </div>
                <div className="flex justify-center">
                  {loadingFeatures[studentLoadingKey] ? (
                    <Loader className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <Switch
                      checked={featureAccess[feature.key as keyof typeof featureAccess].student}
                      onCheckedChange={() => handleFeatureToggle(feature.key, 'student')}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <Separator className="mb-6 mt-6" />

      {/* Model Restrictions Section */}
      <div className="flex mb-4 justify-between items-start gap-8">
        <div className="flex-1">
          <h2 className="text-lg font-semibold mb-2">Model Restrictions</h2>
          <p className="text-sm max-w-3xl text-muted-foreground mb-4">
            Disable specific models for Students or Faculty
          </p>
          <Dialog open={isModelManagerOpen} onOpenChange={setIsModelManagerOpen}>
            <DialogTrigger asChild>
              <Button className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90">
                Open model manager
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl h-[600px]">
              <DialogHeader>
                <DialogTitle>Model Restrictions Manager</DialogTitle>
                <DialogDescription>
                  Enable or disable specific models for faculty and students
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Statistics Bar */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <span className="font-medium">Total Models:</span> {models.length}
                    </div>
                    <div>
                      <span className="font-medium">Disabled for Faculty:</span> {models.filter(model => !modelRestrictions[model.id as keyof typeof modelRestrictions]?.faculty).length}
                    </div>
                    <div>
                      <span className="font-medium">Disabled for Students:</span> {models.filter(model => !modelRestrictions[model.id as keyof typeof modelRestrictions]?.student).length}
                    </div>
                  </div>
                </div>

                {/* Search and Filter Controls */}
                <div className="flex items-center gap-4">
                  {/* Search Input */}
                  <div className="flex-1">
                    <Input
                      placeholder="Search models..."
                      className="w-full"
                    />
                  </div>
                  
                  {/* Category Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        {modelCategories.find(cat => cat.value === selectedCategory)?.label || "All Models"}
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {modelCategories.map((category) => (
                        <DropdownMenuItem
                          key={category.value}
                          onClick={() => setSelectedCategory(category.value)}
                        >
                          {category.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Models Table */}
                <div className="border rounded-lg">
                  <ScrollArea className="h-[350px]">
                    <Table>
                      <TableHeader className="bg-background sticky top-0 z-10">
                        <TableRow>
                          <TableHead className="w-[250px]">Model</TableHead>
                          <TableHead>Provider</TableHead>
                          <TableHead className="text-center">Faculty</TableHead>
                          <TableHead className="text-center">Students</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredModels.map((model) => (
                          <TableRow key={model.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={model.avatar} alt={model.name} />
                                  <AvatarFallback>{model.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{model.name}</div>
                                  <div className="text-xs text-muted-foreground capitalize">{model.category}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{model.provider}</TableCell>
                            <TableCell className="text-center">
                              {loadingModels[`${model.id}-faculty`] ? (
                                <Loader className="h-4 w-4 animate-spin text-muted-foreground mx-auto" />
                              ) : (
                                <Switch
                                  checked={modelRestrictions[model.id as keyof typeof modelRestrictions]?.faculty ?? true}
                                  onCheckedChange={() => handleModelToggle(model.id, 'faculty')}
                                />
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {loadingModels[`${model.id}-student`] ? (
                                <Loader className="h-4 w-4 animate-spin text-muted-foreground mx-auto" />
                              ) : (
                                <Switch
                                  checked={modelRestrictions[model.id as keyof typeof modelRestrictions]?.student ?? true}
                                  onCheckedChange={() => handleModelToggle(model.id, 'student')}
                                />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </Card>
  );
}

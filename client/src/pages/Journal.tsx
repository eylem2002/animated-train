import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { JournalEntry } from "@shared/schema";
import { 
  Mic, 
  MicOff, 
  Plus, 
  Trash2, 
  Clock, 
  Smile, 
  Frown, 
  Meh,
  Sparkles,
  BookOpen,
  Calendar,
  Heart,
  Zap,
  AlertCircle,
  Loader2
} from "lucide-react";
import { format } from "date-fns";

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

const moodIcons: Record<string, typeof Smile> = {
  happy: Smile,
  excited: Zap,
  grateful: Heart,
  calm: Meh,
  neutral: Meh,
  anxious: AlertCircle,
  sad: Frown,
  frustrated: AlertCircle,
  reflective: BookOpen,
};

const moodColors: Record<string, string> = {
  happy: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400",
  excited: "bg-orange-500/20 text-orange-600 dark:text-orange-400",
  grateful: "bg-pink-500/20 text-pink-600 dark:text-pink-400",
  calm: "bg-blue-500/20 text-blue-600 dark:text-blue-400",
  neutral: "bg-gray-500/20 text-gray-600 dark:text-gray-400",
  anxious: "bg-purple-500/20 text-purple-600 dark:text-purple-400",
  sad: "bg-indigo-500/20 text-indigo-600 dark:text-indigo-400",
  frustrated: "bg-red-500/20 text-red-600 dark:text-red-400",
  reflective: "bg-teal-500/20 text-teal-600 dark:text-teal-400",
};

export default function Journal() {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [title, setTitle] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { data: entries, isLoading } = useQuery<JournalEntry[]>({
    queryKey: ["/api/journal"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { title: string; transcript: string; duration?: number }) => {
      const response = await apiRequest("POST", "/api/journal", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal"] });
      setTranscript("");
      setTitle("");
      setRecordingTime(0);
      setIsDialogOpen(false);
      toast({ title: "Journal entry saved", description: "Your thoughts have been recorded" });
    },
    onError: () => {
      toast({ title: "Failed to save", description: "Could not save your journal entry", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/journal/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal"] });
      toast({ title: "Entry deleted" });
    },
  });

  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast({ 
        title: "Not supported", 
        description: "Speech recognition is not supported in your browser. Try Chrome or Edge.", 
        variant: "destructive" 
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + " ";
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      if (finalTranscript) {
        setTranscript((prev) => prev + finalTranscript);
      }
    };

    recognition.onerror = () => {
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    };

    recognition.onend = () => {
      if (isRecording) {
        recognition.start();
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    setRecordingTime(0);
    
    timerRef.current = setInterval(() => {
      setRecordingTime((t) => t + 1);
    }, 1000);
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const handleSave = async () => {
    if (!transcript.trim()) {
      toast({ title: "Empty entry", description: "Please record or type something first", variant: "destructive" });
      return;
    }
    
    setIsAnalyzing(true);
    try {
      await createMutation.mutateAsync({
        title: title || `Journal Entry - ${format(new Date(), "MMM d, yyyy")}`,
        transcript: transcript.trim(),
        duration: recordingTime > 0 ? recordingTime : undefined,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getSentimentLabel = (sentiment: string | null) => {
    if (!sentiment) return null;
    const value = parseFloat(sentiment);
    if (value > 0.3) return "Positive";
    if (value < -0.3) return "Negative";
    return "Neutral";
  };

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-journal-title">Voice Journal</h1>
            <p className="text-muted-foreground">Record your thoughts and track your emotional journey</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-new-entry">
                <Plus className="w-4 h-4 mr-2" />
                New Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>New Journal Entry</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <Input
                  placeholder="Entry title (optional)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  data-testid="input-entry-title"
                />
                
                <div className="flex items-center justify-center gap-4 py-6">
                  <Button
                    size="lg"
                    variant={isRecording ? "destructive" : "default"}
                    onClick={isRecording ? stopRecording : startRecording}
                    className="h-20 w-20 rounded-full"
                    data-testid="button-record"
                  >
                    {isRecording ? (
                      <MicOff className="w-8 h-8" />
                    ) : (
                      <Mic className="w-8 h-8" />
                    )}
                  </Button>
                  
                  {isRecording && (
                    <div className="flex items-center gap-2 text-destructive">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
                      </span>
                      <span className="font-mono text-lg" data-testid="text-recording-time">
                        {formatTime(recordingTime)}
                      </span>
                    </div>
                  )}
                </div>
                
                <p className="text-center text-sm text-muted-foreground">
                  {isRecording ? "Recording... Speak your thoughts" : "Click the microphone to start recording"}
                </p>
                
                <Textarea
                  placeholder="Your thoughts will appear here... or type directly"
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  className="min-h-[150px] resize-none"
                  data-testid="textarea-transcript"
                />
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSave} 
                    disabled={!transcript.trim() || createMutation.isPending || isAnalyzing}
                    data-testid="button-save-entry"
                  >
                    {(createMutation.isPending || isAnalyzing) && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    {isAnalyzing ? "Analyzing..." : "Save Entry"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-48 mb-2" />
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : entries && entries.length > 0 ? (
          <ScrollArea className="h-[calc(100vh-220px)]">
            <div className="grid gap-4 pr-4">
              {entries.map((entry) => {
                const MoodIcon = entry.mood ? moodIcons[entry.mood] || Meh : null;
                const moodColor = entry.mood ? moodColors[entry.mood] : "";
                
                return (
                  <Card key={entry.id} className="group" data-testid={`card-entry-${entry.id}`}>
                    <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">
                          {entry.title || `Journal Entry`}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground flex-wrap">
                          <Calendar className="w-3 h-3" />
                          <span>{format(new Date(entry.createdAt!), "MMM d, yyyy 'at' h:mm a")}</span>
                          {entry.duration && (
                            <>
                              <Clock className="w-3 h-3 ml-2" />
                              <span>{formatTime(entry.duration)}</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {entry.mood && MoodIcon && (
                          <Badge variant="secondary" className={moodColor}>
                            <MoodIcon className="w-3 h-3 mr-1" />
                            {entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1)}
                          </Badge>
                        )}
                        
                        {entry.sentiment && (
                          <Badge variant="outline" className="gap-1">
                            <Sparkles className="w-3 h-3" />
                            {getSentimentLabel(entry.sentiment)}
                          </Badge>
                        )}
                        
                        <Button
                          size="icon"
                          variant="ghost"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => deleteMutation.mutate(entry.id)}
                          data-testid={`button-delete-${entry.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-foreground/80 whitespace-pre-wrap line-clamp-4">
                        {entry.transcript}
                      </p>
                      
                      {entry.tags && entry.tags.length > 0 && (
                        <div className="flex gap-1 mt-3 flex-wrap">
                          {entry.tags.map((tag, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        ) : (
          <Card className="py-12">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <BookOpen className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No journal entries yet</h3>
              <p className="text-muted-foreground mb-4">
                Start recording your thoughts and feelings
              </p>
              <Button onClick={() => setIsDialogOpen(true)} data-testid="button-start-journaling">
                <Mic className="w-4 h-4 mr-2" />
                Start Journaling
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Mic, Square, Send, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface VoiceRecorderProps {
  onVoiceRecorded: (audioBlob: Blob) => void
  onCancel: () => void
}

export function VoiceRecorder({ onVoiceRecorded, onCancel }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop()
      }
    }
  }, [isRecording])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        setAudioBlob(audioBlob)

        // Stop all audio tracks
        stream.getAudioTracks().forEach((track) => track.stop())

        if (timerRef.current) {
          clearInterval(timerRef.current)
        }
      }

      // Start recording
      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          // Auto-stop after 60 seconds
          if (prev >= 60) {
            if (mediaRecorderRef.current) {
              mediaRecorderRef.current.stop()
              setIsRecording(false)
            }
            if (timerRef.current) {
              clearInterval(timerRef.current)
            }
            return prev
          }
          return prev + 1
        })
      }, 1000)
    } catch (error) {
      console.error("Error accessing microphone:", error)
      toast({
        title: "Microphone Error",
        description: "Could not access your microphone. Please check permissions.",
        variant: "destructive",
      })
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
    setAudioBlob(null)
    onCancel()
  }

  const sendVoiceMessage = () => {
    if (audioBlob) {
      onVoiceRecorded(audioBlob)
      setAudioBlob(null)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="p-4 bg-background border rounded-lg">
      <div className="flex flex-col items-center gap-4">
        {!audioBlob ? (
          <>
            <div className="flex items-center gap-4">
              {isRecording ? (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-sm font-medium">{formatTime(recordingTime)}</span>
                  </div>
                  <Button variant="destructive" size="icon" onClick={stopRecording} className="h-10 w-10 rounded-full">
                    <Square className="h-5 w-5" />
                  </Button>
                </>
              ) : (
                <Button onClick={startRecording} variant="outline" size="icon" className="h-12 w-12 rounded-full">
                  <Mic className="h-6 w-6" />
                </Button>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {isRecording ? "Recording in progress..." : "Tap to start recording"}
            </div>
          </>
        ) : (
          <>
            <div className="w-full">
              <div className="flex items-center justify-between w-full mb-2">
                <span className="text-sm font-medium">Voice message ({formatTime(recordingTime)})</span>
                <div className="flex gap-2">
                  <Button variant="destructive" size="icon" onClick={cancelRecording} className="h-8 w-8">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button variant="default" size="icon" onClick={sendVoiceMessage} className="h-8 w-8">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="w-full h-12 bg-accent rounded-md flex items-center justify-center">
                <div className="w-full px-4">
                  {/* Audio waveform visualization (simplified) */}
                  <div className="w-full h-6 flex items-center gap-0.5">
                    {Array.from({ length: 30 }).map((_, i) => (
                      <div
                        key={i}
                        className="bg-primary/80 w-1 rounded-full"
                        style={{
                          height: `${Math.max(4, Math.min(24, Math.random() * 24))}px`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

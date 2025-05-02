"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, Volume2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Slider } from "@/components/ui/slider"

interface VoiceMessagePlayerProps {
  audioUrl: string
  duration?: number
  className?: string
}

export function VoiceMessagePlayer({ audioUrl, duration = 0, className }: VoiceMessagePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [audioDuration, setAudioDuration] = useState(duration)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Create audio element
    const audio = new Audio(audioUrl)
    audioRef.current = audio

    // Set up event listeners
    audio.addEventListener("loadedmetadata", () => {
      setAudioDuration(audio.duration)
    })

    audio.addEventListener("ended", () => {
      setIsPlaying(false)
      setCurrentTime(0)
    })

    // Clean up
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ""
      }
    }
  }, [audioUrl])

  const togglePlayPause = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    } else {
      audioRef.current.play()
      intervalRef.current = setInterval(() => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime)
        }
      }, 100)
    }

    setIsPlaying(!isPlaying)
  }

  const handleSliderChange = (value: number[]) => {
    if (!audioRef.current) return

    const newTime = value[0]
    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className={cn("flex items-center gap-2 p-2 bg-accent/50 rounded-lg w-full max-w-xs", className)}>
      <Button
        variant="ghost"
        size="icon"
        onClick={togglePlayPause}
        className="h-8 w-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>

      <div className="flex-1 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Volume2 className="h-3 w-3 text-muted-foreground" />
          <Slider
            value={[currentTime]}
            max={audioDuration || 100}
            step={0.1}
            onValueChange={handleSliderChange}
            className="h-2"
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(audioDuration)}</span>
        </div>
      </div>
    </div>
  )
}

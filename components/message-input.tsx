"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Paperclip, Send, ImageIcon, Smile, Mic } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { FileAttachment } from "@/components/file-attachment"
import { EmojiPicker } from "@/components/emoji-picker"
import { VoiceRecorder } from "@/components/voice-recorder"

interface MessageInputProps {
  onSendMessage: (formData: FormData) => Promise<void>
  onTyping: (isTyping: boolean) => void
}

export function MessageInput({ onSendMessage, onTyping }: MessageInputProps) {
  const [message, setMessage] = useState("")
  const [attachments, setAttachments] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()

  // Handle typing indicator
  useEffect(() => {
    if (message && !typingTimeoutRef.current) {
      try {
        onTyping(true)
        typingTimeoutRef.current = setTimeout(() => {
          try {
            onTyping(false)
          } catch (error) {
            console.error("Error updating typing status:", error)
          }
          typingTimeoutRef.current = null
        }, 3000)
      } catch (error) {
        console.error("Error updating typing status:", error)
      }
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = null
        try {
          onTyping(false)
        } catch (error) {
          console.error("Error updating typing status on cleanup:", error)
        }
      }
    }
  }, [message, onTyping])

  async function handleSubmit(formData: FormData) {
    if (!message.trim() && attachments.length === 0) return

    setIsSubmitting(true)

    try {
      // Add message content to form data
      formData.set("content", message)

      // Add attachments to form data
      attachments.forEach((file, index) => {
        formData.append(`file-${index}`, file)
      })

      // Add attachment count to form data
      formData.set("attachmentCount", String(attachments.length))

      await onSendMessage(formData)
      setMessage("")
      setAttachments([])
      formRef.current?.reset()
    } catch (error) {
      console.error("Failed to send message:", error)
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      formRef.current?.requestSubmit()
    }
  }

  function handleFileSelect() {
    fileInputRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)

      // Limit total attachments to 5
      const totalFiles = [...attachments, ...newFiles]
      if (totalFiles.length > 5) {
        toast({
          title: "Too many attachments",
          description: "You can only attach up to 5 files per message.",
          variant: "destructive",
        })
        return
      }

      // Check file size (10MB limit per file)
      const oversizedFiles = newFiles.filter((file) => file.size > 10 * 1024 * 1024)
      if (oversizedFiles.length > 0) {
        toast({
          title: "File too large",
          description: `Some files exceed the 10MB size limit and were not added.`,
          variant: "destructive",
        })

        // Only add files that are within size limits
        const validFiles = newFiles.filter((file) => file.size <= 10 * 1024 * 1024)
        setAttachments((prev) => [...prev, ...validFiles])
      } else {
        setAttachments((prev) => [...prev, ...newFiles])
      }
    }

    // Reset input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  function removeAttachment(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  function handleEmojiSelect(emoji: string) {
    setMessage((prev) => prev + emoji)
    setShowEmojiPicker(false)
  }

  function handleVoiceRecorded(audioBlob: Blob) {
    // Create a File object from the Blob
    const audioFile = new File([audioBlob], `voice-message-${Date.now()}.webm`, { type: "audio/webm" })

    // Add to attachments
    setAttachments((prev) => [...prev, audioFile])
    setShowVoiceRecorder(false)

    // Auto-submit the form with the voice message
    const formData = new FormData()
    formData.set("content", "")
    formData.append("file-0", audioFile)
    formData.set("attachmentCount", "1")
    formData.set("isVoiceMessage", "true")

    onSendMessage(formData).catch((error) => {
      console.error("Failed to send voice message:", error)
      toast({
        title: "Error",
        description: "Failed to send voice message. Please try again.",
        variant: "destructive",
      })
    })
  }

  return (
    <div className="p-4 bg-background dark:bg-card border-t border-border">
      {showVoiceRecorder && (
        <div className="mb-4">
          <VoiceRecorder onVoiceRecorded={handleVoiceRecorded} onCancel={() => setShowVoiceRecorder(false)} />
        </div>
      )}

      {attachments.length > 0 && (
        <div className="flex gap-2 mb-2 overflow-x-auto pb-2">
          {attachments.map((file, index) => (
            <FileAttachment
              key={index}
              file={file}
              onRemove={() => removeAttachment(index)}
              className="min-w-[200px] max-w-[250px]"
            />
          ))}
        </div>
      )}

      <form ref={formRef} action={handleSubmit} className="flex items-end gap-2">
        <div className="flex flex-shrink-0">
          <Button type="button" variant="ghost" size="icon" onClick={handleFileSelect}>
            <Paperclip className="h-5 w-5" />
            <span className="sr-only">Attach file</span>
          </Button>

          <Button type="button" variant="ghost" size="icon" onClick={handleFileSelect}>
            <ImageIcon className="h-5 w-5" />
            <span className="sr-only">Attach image</span>
          </Button>

          <Button type="button" variant="ghost" size="icon" onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}>
            <Mic className="h-5 w-5" />
            <span className="sr-only">Voice message</span>
          </Button>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
            multiple
            accept="image/*,audio/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.*,text/plain"
          />

          <div className="relative">
            <Button type="button" variant="ghost" size="icon" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
              <Smile className="h-5 w-5" />
              <span className="sr-only">Add emoji</span>
            </Button>

            {showEmojiPicker && (
              <div className="absolute bottom-full right-0 mb-2 z-10">
                <EmojiPicker onEmojiSelect={handleEmojiSelect} />
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 relative">
          <Textarea
            placeholder="Type a message..."
            className={cn("resize-none pr-12", message.length > 0 || attachments.length > 0 ? "h-auto" : "h-10")}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <Button
            type="submit"
            size="icon"
            variant="ghost"
            className="absolute right-2 bottom-1"
            disabled={isSubmitting || (!message.trim() && attachments.length === 0)}
          >
            <Send className="h-5 w-5" />
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </form>
    </div>
  )
}

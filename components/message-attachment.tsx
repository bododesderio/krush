"use client"

import { FileIcon, FileText, ImageIcon, Music, Video, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatFileSize } from "@/lib/upload"
import Image from "next/image"
import type { MessageAttachment } from "@/lib/messages"
// Add useEffect hooks to handle async functions
import { useState, useEffect } from "react"

interface MessageAttachmentProps {
  attachment: MessageAttachment
  isOwnMessage: boolean
}

async function getFileIcon(type: string): Promise<string> {
  switch (type) {
    case "document":
      return "file-text"
    case "video":
      return "video"
    case "audio":
      return "music"
    case "image":
      return "image"
    default:
      return "file"
  }
}

export function MessageAttachmentView({ attachment, isOwnMessage }: MessageAttachmentProps) {
  const [iconName, setIconName] = useState<string>("file")
  const [formattedSize, setFormattedSize] = useState<string>("")

  useEffect(() => {
    async function loadData() {
      if (attachment.type) {
        const icon = await getFileIcon(attachment.type)
        setIconName(icon)
      }

      const size = await formatFileSize(attachment.size)
      setFormattedSize(size)
    }

    loadData()
  }, [attachment.type, attachment.size])

  const getIcon = () => {
    switch (iconName) {
      case "file-text":
        return <FileText className="h-6 w-6 text-blue-500" />
      case "video":
        return <Video className="h-6 w-6 text-purple-500" />
      case "music":
        return <Music className="h-6 w-6 text-pink-500" />
      case "image":
        return <ImageIcon className="h-6 w-6 text-green-500" />
      default:
        return <FileIcon className="h-6 w-6 text-gray-500" />
    }
  }

  if (attachment.type === "image") {
    return (
      <div className="mb-2">
        <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="block">
          <div className="relative rounded-md overflow-hidden w-full max-w-xs h-48">
            <Image
              src={attachment.url || "/placeholder.svg"}
              alt={attachment.name || "Image attachment"}
              fill
              className="object-cover"
            />
          </div>
        </a>
      </div>
    )
  }

  if (attachment.type === "video") {
    return (
      <div className="mb-2">
        <video src={attachment.url} controls className="rounded-md max-w-xs w-full" />
        <div className="text-xs text-muted-foreground mt-1">{attachment.name}</div>
      </div>
    )
  }

  if (attachment.type === "audio") {
    return (
      <div className="mb-2">
        <audio src={attachment.url} controls className="max-w-xs w-full" />
        <div className="text-xs text-muted-foreground mt-1">{attachment.name}</div>
      </div>
    )
  }

  // For documents and other files
  return (
    <div
      className={`
      mb-2 flex items-center gap-3 rounded-md border p-2 max-w-xs
      ${isOwnMessage ? "bg-primary/20" : "bg-muted/50"}
    `}
    >
      <div className="flex items-center justify-center h-10 w-10 rounded-md bg-muted">{getIcon()}</div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{attachment.name}</p>
        <p className="text-xs text-muted-foreground">{formattedSize}</p>
      </div>

      <a href={attachment.url} target="_blank" rel="noopener noreferrer">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <ExternalLink className="h-4 w-4" />
          <span className="sr-only">Open file</span>
        </Button>
      </a>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { FileIcon, FileText, ImageIcon, Music, Video, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatFileSize, getFileIcon, getFileType } from "@/lib/upload"
import Image from "next/image"

interface FileAttachmentProps {
  file: File
  onRemove: () => void
  className?: string
}

export function FileAttachment({ file, onRemove, className }: FileAttachmentProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [fileType, setFileType] = useState<"image" | "document" | "video" | "audio" | "other">("other")
  const [iconName, setIconName] = useState<string>("file")

  useEffect(() => {
    async function loadFileInfo() {
      const type = await getFileType(file.type)
      setFileType(type)
      const icon = await getFileIcon(type)
      setIconName(icon)
    }

    loadFileInfo()
  }, [file.type])

  // Generate preview for images
  useEffect(() => {
    if (fileType === "image" && !preview) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }, [fileType, file, preview])

  const [formattedSize, setFormattedSize] = useState("")

  useEffect(() => {
    async function loadSize() {
      const size = await formatFileSize(file.size)
      setFormattedSize(size)
    }

    loadSize()
  }, [file.size])

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

  return (
    <div
      className={cn(
        "group relative flex items-center gap-3 rounded-md border p-2 bg-background/50",
        fileType === "image" ? "h-24" : "h-16",
        className,
      )}
    >
      {fileType === "image" && preview ? (
        <div className="h-full aspect-square relative rounded-md overflow-hidden">
          <Image src={preview || "/placeholder.svg"} alt={file.name} fill className="object-cover" />
        </div>
      ) : (
        <div className="flex items-center justify-center h-12 w-12 rounded-md bg-muted">{getIcon()}</div>
      )}

      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{file.name}</p>
        <p className="text-xs text-muted-foreground">{formattedSize}</p>
      </div>

      <Button
        onClick={onRemove}
        variant="ghost"
        size="icon"
        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Remove</span>
      </Button>
    </div>
  )
}

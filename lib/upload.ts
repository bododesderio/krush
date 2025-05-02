"use server"

import { put } from "@vercel/blob"
import { nanoid } from "nanoid"

export type FileUploadResult = {
  url: string
  name: string
  size: number
  type: string
}

export async function uploadFile(formData: FormData): Promise<FileUploadResult> {
  const file = formData.get("file") as File
  if (!file) {
    throw new Error("No file provided")
  }

  // Generate a unique filename
  const filename = `${nanoid()}-${file.name}`

  try {
    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: "public",
    })

    return {
      url: blob.url,
      name: file.name,
      size: file.size,
      type: file.type,
    }
  } catch (error) {
    console.error("Error uploading file:", error)
    throw new Error("Failed to upload file")
  }
}

export async function getFileType(mimeType: string): Promise<"image" | "document" | "video" | "audio" | "other"> {
  if (mimeType.startsWith("image/")) {
    return "image"
  } else if (mimeType.startsWith("video/")) {
    return "video"
  } else if (mimeType.startsWith("audio/")) {
    return "audio"
  } else if (
    mimeType === "application/pdf" ||
    mimeType.includes("document") ||
    mimeType.includes("sheet") ||
    mimeType.includes("presentation")
  ) {
    return "document"
  }
  return "other"
}

export async function getFileIcon(fileType: "image" | "document" | "video" | "audio" | "other"): Promise<string> {
  switch (fileType) {
    case "image":
      return "image"
    case "document":
      return "file-text"
    case "video":
      return "video"
    case "audio":
      return "music"
    case "other":
    default:
      return "file"
  }
}

export async function formatFileSize(bytes: number): Promise<string> {
  if (bytes < 1024) {
    return bytes + " B"
  } else if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(1) + " KB"
  } else if (bytes < 1024 * 1024 * 1024) {
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  } else {
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB"
  }
}

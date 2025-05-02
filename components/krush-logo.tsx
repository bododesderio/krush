import Image from "next/image"
import { cn } from "@/lib/utils"

interface KrushLogoProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

export function KrushLogo({ className, size = "md" }: KrushLogoProps) {
  const sizes = {
    sm: { height: 30, width: 80 },
    md: { height: 40, width: 106 },
    lg: { height: 60, width: 160 },
  }

  return (
    <div className={cn("relative", className)}>
      <Image
        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/KRUSH-k9x6Mh7qBHw1fj5A8vZorYzlGanSvg.png"
        alt="Krush"
        height={sizes[size].height}
        width={sizes[size].width}
        className="object-contain"
        priority
      />
    </div>
  )
}

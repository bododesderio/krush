"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { KrushLogo } from "@/components/krush-logo"
import { ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"

export default function WelcomePage() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const router = useRouter()

  const slides = [
    {
      title: "Welcome to Krush",
      description: "The modern messaging platform for connecting with friends, family, and colleagues.",
      image: "/placeholder.svg?height=300&width=500",
    },
    {
      title: "Private Messaging",
      description: "Send messages, photos, videos, and documents securely to your contacts.",
      image: "/placeholder.svg?height=300&width=500",
    },
    {
      title: "Group Chats",
      description: "Create groups with your contacts to stay connected with everyone at once.",
      image: "/placeholder.svg?height=300&width=500",
    },
    {
      title: "Ready to Start?",
      description: "Sign up or log in to start messaging with your contacts.",
      image: "/placeholder.svg?height=300&width=500",
    },
  ]

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1)
    } else {
      router.push("/login")
    }
  }

  const handleSkip = () => {
    router.push("/login")
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="mb-8">
          <KrushLogo size="lg" />
        </div>

        <div className="w-full max-w-md">
          <div className="relative aspect-video w-full mb-8 rounded-xl overflow-hidden bg-muted">
            <Image
              src={slides[currentSlide].image || "/placeholder.svg"}
              alt={slides[currentSlide].title}
              fill
              className="object-cover"
              priority
            />
          </div>

          <h1 className="text-2xl font-bold text-center mb-2">{slides[currentSlide].title}</h1>
          <p className="text-center text-muted-foreground mb-8">{slides[currentSlide].description}</p>

          <div className="flex justify-center mb-8">
            {slides.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full mx-1 ${
                  index === currentSlide ? "bg-primary" : "bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 flex justify-between">
        <Button variant="ghost" onClick={handleSkip}>
          Skip
        </Button>
        <Button onClick={handleNext} className="bg-krush hover:bg-krush-dark">
          {currentSlide < slides.length - 1 ? (
            <>
              Next <ChevronRight className="ml-1 h-4 w-4" />
            </>
          ) : (
            "Get Started"
          )}
        </Button>
      </div>
    </div>
  )
}

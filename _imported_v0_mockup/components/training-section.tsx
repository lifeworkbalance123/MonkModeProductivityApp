"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Play, 
  Clock, 
  BookOpen, 
  Video, 
  FileText,
  Lock,
  ChevronRight,
  Zap
} from "lucide-react"

const modules = [
  {
    id: 1,
    title: "The Pomodoro Technique Mastery",
    description: "Learn how to use 25-minute focused sessions to maximize productivity and avoid burnout.",
    type: "video",
    duration: "12 min",
    locked: false,
    thumbnail: "pomodoro",
  },
  {
    id: 2,
    title: "Time Boxing Fundamentals",
    description: "Master the art of scheduling every minute of your day for maximum effectiveness.",
    type: "video",
    duration: "18 min",
    locked: false,
    thumbnail: "timeboxing",
  },
  {
    id: 3,
    title: "Building Atomic Habits",
    description: "Small changes, remarkable results. Learn to build habits that stick.",
    type: "article",
    duration: "8 min read",
    locked: false,
    thumbnail: "habits",
  },
  {
    id: 4,
    title: "Morning Routine Blueprint",
    description: "Design a morning routine that sets you up for a productive day.",
    type: "video",
    duration: "15 min",
    locked: true,
    thumbnail: "morning",
  },
  {
    id: 5,
    title: "Deep Work Strategies",
    description: "Techniques for achieving flow state and eliminating distractions.",
    type: "video",
    duration: "22 min",
    locked: true,
    thumbnail: "deepwork",
  },
  {
    id: 6,
    title: "Evening Reflection Practice",
    description: "How to review your day and prepare for tomorrow effectively.",
    type: "article",
    duration: "5 min read",
    locked: true,
    thumbnail: "evening",
  },
]

const typeIcons = {
  video: Video,
  article: FileText,
}

export function TrainingSection() {
  return (
    <section className="py-24 bg-card/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border mb-4">
              <BookOpen className="w-4 h-4 text-accent" />
              <span className="text-sm text-muted-foreground">Training Hub</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-balance">
              Learn. Grow. Transform.
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl text-pretty">
              Access curated content on productivity techniques, habit building, and personal development. New content added weekly.
            </p>
          </div>
          <Button variant="outline" className="shrink-0">
            View All Content
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => {
            const TypeIcon = typeIcons[module.type as keyof typeof typeIcons]
            
            return (
              <Card
                key={module.id}
                className={`overflow-hidden group cursor-pointer transition-all hover:border-accent/50 ${
                  module.locked ? "opacity-75" : ""
                }`}
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-secondary relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    {module.locked ? (
                      <div className="w-12 h-12 rounded-full bg-background/80 flex items-center justify-center">
                        <Lock className="w-5 h-5 text-muted-foreground" />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-accent/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Play className="w-6 h-6 text-accent-foreground ml-0.5" />
                      </div>
                    )}
                  </div>
                  
                  {/* Duration Badge */}
                  <div className="absolute bottom-3 right-3">
                    <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
                      <Clock className="w-3 h-3 mr-1" />
                      {module.duration}
                    </Badge>
                  </div>

                  {/* Type Badge */}
                  <div className="absolute top-3 left-3">
                    <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
                      <TypeIcon className="w-3 h-3 mr-1" />
                      {module.type === "video" ? "Video" : "Article"}
                    </Badge>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold mb-2 group-hover:text-accent transition-colors">
                    {module.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {module.description}
                  </p>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Upload CTA */}
        <Card className="mt-12 p-8 bg-secondary/50 border-dashed">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                <Zap className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Create Your Own Training Content</h3>
                <p className="text-sm text-muted-foreground">
                  Upload videos, images, and text to build your personal motivation library.
                </p>
              </div>
            </div>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
              Upload Content
            </Button>
          </div>
        </Card>
      </div>
    </section>
  )
}

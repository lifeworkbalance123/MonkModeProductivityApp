"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Play, Flame, Target, Clock, CheckCircle2 } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/10 via-background to-background" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border mb-8">
            <Flame className="w-4 h-4 text-accent" />
            <span className="text-sm text-muted-foreground">Enter Deep Focus Mode</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-balance mb-6">
            Master your time.
            <br />
            <span className="text-muted-foreground">Transform your life.</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 text-pretty">
            The ultimate productivity system for intentional living. Track habits, time-box your days, set powerful goals, and unlock your full potential.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 px-8 h-12">
              Start Free Trial
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button variant="outline" size="lg" className="px-8 h-12">
              <Play className="mr-2 w-4 h-4" />
              Watch Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
            {[
              { value: "10K+", label: "Active Users" },
              { value: "2M+", label: "Tasks Completed" },
              { value: "98%", label: "Productivity Boost" },
              { value: "4.9", label: "User Rating" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Preview Cards */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div className="p-6 rounded-xl bg-card border border-border">
            <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center mb-4">
              <Clock className="w-5 h-5 text-accent" />
            </div>
            <h3 className="font-semibold mb-2">Time Boxing</h3>
            <p className="text-sm text-muted-foreground">
              Schedule every 30-minute block. Visualize your day with color-coded categories.
            </p>
          </div>
          
          <div className="p-6 rounded-xl bg-card border border-border">
            <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-5 h-5 text-accent" />
            </div>
            <h3 className="font-semibold mb-2">Habit Tracking</h3>
            <p className="text-sm text-muted-foreground">
              Build powerful routines with daily habit checklists and progress visualization.
            </p>
          </div>
          
          <div className="p-6 rounded-xl bg-card border border-border">
            <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center mb-4">
              <Target className="w-5 h-5 text-accent" />
            </div>
            <h3 className="font-semibold mb-2">Goal Setting</h3>
            <p className="text-sm text-muted-foreground">
              Set your top 5 daily goals. Morning gratitude and evening reflection built-in.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

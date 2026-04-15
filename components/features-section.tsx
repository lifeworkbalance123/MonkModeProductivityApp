"use client"

import { 
  Calendar, 
  CheckSquare, 
  Target, 
  PlayCircle, 
  Sparkles,
  BarChart3,
  Palette,
  Bell,
  Users,
  Lock
} from "lucide-react"

const features = [
  {
    icon: Calendar,
    title: "Weekly Planner",
    description: "7-day view with 30-minute time slots. Plan your entire week in one glance with drag-and-drop scheduling.",
    color: "bg-[oklch(0.75_0.12_145/0.2)]",
    iconColor: "text-[oklch(0.75_0.12_145)]",
  },
  {
    icon: CheckSquare,
    title: "Daily Habits",
    description: "Track habits like making your bed, meditation, gym, and more. Visual progress bars show your consistency.",
    color: "bg-[oklch(0.65_0.12_185/0.2)]",
    iconColor: "text-[oklch(0.65_0.12_185)]",
  },
  {
    icon: Target,
    title: "Top 5 Daily Goals",
    description: "Focus on what matters most. Set your top 5 priorities each day and watch your productivity soar.",
    color: "bg-[oklch(0.70_0.18_85/0.2)]",
    iconColor: "text-[oklch(0.70_0.18_85)]",
  },
  {
    icon: Sparkles,
    title: "Gratitude & Reflection",
    description: "Start each day with 3 things you're grateful for. End with 3 achievements to celebrate your progress.",
    color: "bg-[oklch(0.60_0.15_280/0.2)]",
    iconColor: "text-[oklch(0.60_0.15_280)]",
  },
  {
    icon: Palette,
    title: "Custom Categories",
    description: "10 color-coded categories: Work, Personal, Gym, Health, Meal, Study, Family, Household, Pets, Transport.",
    color: "bg-[oklch(0.70_0.20_30/0.2)]",
    iconColor: "text-[oklch(0.70_0.20_30)]",
  },
  {
    icon: PlayCircle,
    title: "Training Modules",
    description: "Access motivational videos, productivity techniques like Pomodoro, and guided content to stay inspired.",
    color: "bg-[oklch(0.75_0.15_145/0.2)]",
    iconColor: "text-[oklch(0.75_0.15_145)]",
  },
  {
    icon: BarChart3,
    title: "Progress Analytics",
    description: "Visualize your productivity trends. Weekly and monthly reports show your growth over time.",
    color: "bg-[oklch(0.65_0.12_185/0.2)]",
    iconColor: "text-[oklch(0.65_0.12_185)]",
  },
  {
    icon: Bell,
    title: "Smart Reminders",
    description: "Get notified for upcoming tasks, habit check-ins, and goal deadlines. Never miss a beat.",
    color: "bg-[oklch(0.70_0.18_85/0.2)]",
    iconColor: "text-[oklch(0.70_0.18_85)]",
  },
  {
    icon: Users,
    title: "Community & Accountability",
    description: "Join a community of focused individuals. Share progress and stay accountable together.",
    color: "bg-[oklch(0.60_0.15_280/0.2)]",
    iconColor: "text-[oklch(0.60_0.15_280)]",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-background scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-semibold mb-4 text-balance">
            Everything you need for structured depth
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            A complete productivity system designed for deep focus, intentional living, and continuous self-improvement.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group p-6 rounded-xl bg-card border border-border hover:border-accent/50 transition-all duration-300"
            >
              <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                <feature.icon className={`w-6 h-6 ${feature.iconColor}`} />
              </div>
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

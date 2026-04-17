"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronRight, ChevronLeft, Sparkles, Zap, Users } from "lucide-react"

const questions = [
  {
    id: 1,
    question: "What is your primary productivity goal?",
    options: [
      { value: "focus", label: "Deep focus and concentration" },
      { value: "habits", label: "Building better habits" },
      { value: "time", label: "Better time management" },
      { value: "goals", label: "Achieving specific goals" },
    ],
  },
  {
    id: 2,
    question: "How would you describe your current productivity level?",
    options: [
      { value: "beginner", label: "Just getting started" },
      { value: "intermediate", label: "Some systems in place" },
      { value: "advanced", label: "Looking to optimize" },
      { value: "expert", label: "Seeking marginal gains" },
    ],
  },
  {
    id: 3,
    question: "Which categories are most important to you?",
    type: "multi",
    options: [
      { value: "work", label: "Work / Career" },
      { value: "health", label: "Health / Fitness" },
      { value: "personal", label: "Personal Development" },
      { value: "family", label: "Family / Relationships" },
      { value: "study", label: "Study / Learning" },
      { value: "creative", label: "Creative Projects" },
    ],
  },
  {
    id: 4,
    question: "When are you most productive?",
    options: [
      { value: "early", label: "Early morning (5-8 AM)" },
      { value: "morning", label: "Morning (8-12 PM)" },
      { value: "afternoon", label: "Afternoon (12-5 PM)" },
      { value: "evening", label: "Evening (5-10 PM)" },
    ],
  },
]

export function OnboardingSection() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string | string[]>>({})
  const [selectedMulti, setSelectedMulti] = useState<string[]>([])
  const [showDemo, setShowDemo] = useState(false)

  const question = questions[currentQuestion]
  const isMulti = question.type === "multi"
  const progress = ((currentQuestion + 1) / questions.length) * 100

  const handleNext = () => {
    if (isMulti) {
      setAnswers({ ...answers, [question.id]: selectedMulti })
      setSelectedMulti([])
    }
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      setShowDemo(true)
    }
  }

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const toggleMultiOption = (value: string) => {
    setSelectedMulti((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    )
  }

  const scrollToQuestionnaire = () => {
    document
      .getElementById("onboarding-questionnaire")
      ?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <section id="onboarding" className="py-24 bg-background scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left - Content */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border mb-6">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-sm text-muted-foreground">Personalized Experience</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-balance">
              Standard or Customized?
              <br />
              <span className="text-muted-foreground">You choose.</span>
            </h2>
            
            <p className="text-lg text-muted-foreground mb-8 text-pretty">
              Start with our full-featured standard version, or answer a few questions to get a personalized setup tailored to your goals and lifestyle.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <Link href="/dashboard" className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                <Card className="p-4 border-2 border-transparent hover:border-accent/50 cursor-pointer transition-all h-full">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center mb-3">
                    <Zap className="w-5 h-5 text-foreground" />
                  </div>
                  <h3 className="font-semibold mb-1">Standard</h3>
                  <p className="text-sm text-muted-foreground">
                    All features, default settings. Start immediately.
                  </p>
                </Card>
              </Link>

              <button
                type="button"
                onClick={scrollToQuestionnaire}
                className="text-left rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <Card className="p-4 border-2 border-accent cursor-pointer bg-accent/5 h-full">
                  <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center mb-3">
                    <Users className="w-5 h-5 text-accent" />
                  </div>
                  <h3 className="font-semibold mb-1">Customized</h3>
                  <p className="text-sm text-muted-foreground">
                    Tailored to your goals after quick questionnaire.
                  </p>
                </Card>
              </button>
            </div>
          </div>

          {/* Right - Questionnaire Demo */}
          <div className="lg:pl-8">
            <Card
              id="onboarding-questionnaire"
              className="p-6 bg-card border border-border scroll-mt-24"
            >
              {!showDemo ? (
                <>
                  {/* Progress */}
                  <div className="mb-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">
                        Question {currentQuestion + 1} of {questions.length}
                      </span>
                      <span className="text-accent">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-1 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Question */}
                  <h3 className="text-lg font-semibold mb-6">{question.question}</h3>

                  {/* Options */}
                  {isMulti ? (
                    <div className="space-y-3 mb-6">
                      {question.options.map((option) => (
                        <div
                          key={option.value}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedMulti.includes(option.value)
                              ? "border-accent bg-accent/10"
                              : "border-border hover:border-accent/50"
                          }`}
                          onClick={() => toggleMultiOption(option.value)}
                        >
                          <Checkbox
                            checked={selectedMulti.includes(option.value)}
                            className="pointer-events-none"
                          />
                          <span className="text-sm">{option.label}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <RadioGroup
                      value={answers[question.id] as string}
                      onValueChange={(value) => setAnswers({ ...answers, [question.id]: value })}
                      className="space-y-3 mb-6"
                    >
                      {question.options.map((option) => {
                        const optionId = `q${question.id}-${option.value}`
                        return (
                          <div
                            key={option.value}
                            onClick={() =>
                              setAnswers({ ...answers, [question.id]: option.value })
                            }
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                              answers[question.id] === option.value
                                ? "border-accent bg-accent/10"
                                : "border-border hover:border-accent/50"
                            }`}
                          >
                            <RadioGroupItem value={option.value} id={optionId} />
                            <Label htmlFor={optionId} className="cursor-pointer flex-1">
                              {option.label}
                            </Label>
                          </div>
                        )
                      })}
                    </RadioGroup>
                  )}

                  {/* Navigation */}
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={handleBack}
                      disabled={currentQuestion === 0}
                      className="flex-1"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Back
                    </Button>
                    <Button
                      onClick={handleNext}
                      disabled={
                        isMulti
                          ? selectedMulti.length === 0
                          : !answers[question.id]
                      }
                      className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                    >
                      {currentQuestion === questions.length - 1 ? "Finish" : "Next"}
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-accent" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Perfect!</h3>
                  <p className="text-muted-foreground mb-6">
                    Your personalized monkcubed experience is ready.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button className="bg-accent text-accent-foreground hover:bg-accent/90" asChild>
                      <Link href="/dashboard">Open dashboard</Link>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowDemo(false)
                        setCurrentQuestion(0)
                        setAnswers({})
                      }}
                    >
                      Try demo again
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}

import { dayInLife, setupGuide, type Tool, type ToolSection } from '@/lib/toolsContent'
import { ToolCard } from '@/components/tools/ToolCard'

type Grouped = Record<ToolSection, Tool[]>

function groupBySection(filtered: Tool[], sectionOrder: ToolSection[]): Grouped {
  const map = {} as Grouped
  for (const s of sectionOrder) {
    map[s] = []
  }
  for (const t of filtered) {
    map[t.section].push(t)
  }
  return map
}

type Props = {
  tools: Tool[]
  sectionOrder: ToolSection[]
  emptyToolSearchMessage?: string | null
}

export function ToolLibraryContent({
  tools: toolList,
  sectionOrder,
  emptyToolSearchMessage,
}: Props) {
  const grouped = groupBySection(toolList, sectionOrder)
  const showToolGrid = toolList.length > 0

  return (
    <div className="space-y-12">
      <section className="rounded-xl border border-border/80 bg-muted/20 p-6 md:p-8">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          Your first day
        </h2>
        <div className="mt-6 space-y-6 text-sm leading-relaxed text-foreground md:text-base">
          <div>
            <h3 className="text-base font-medium text-foreground">
              Setting up the productivity tools
            </h3>
            <p className="mt-2 text-muted-foreground">{setupGuide.day1Tool}</p>
          </div>
          <div>
            <h3 className="text-base font-medium text-foreground">Joining a program</h3>
            <p className="mt-2 text-muted-foreground">{setupGuide.day1Program}</p>
          </div>
          <div>
            <h3 className="text-base font-medium text-foreground">Initial settings</h3>
            <p className="mt-2 text-muted-foreground">{setupGuide.day1Settings}</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold tracking-tight text-foreground">
          Tool instructions
        </h2>
        {!showToolGrid && emptyToolSearchMessage ? (
          <p className="rounded-lg border border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
            {emptyToolSearchMessage}
          </p>
        ) : (
          <div className="space-y-10">
            {sectionOrder.map((section) => {
              const items = grouped[section]
              if (items.length === 0) return null
              return (
                <div key={section} aria-labelledby={`section-${section}`}>
                  <h3
                    id={`section-${section}`}
                    className="mb-4 border-b border-border pb-2 text-lg font-semibold text-foreground"
                  >
                    {section}
                  </h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {items.map((tool) => (
                      <ToolCard key={tool.id} tool={tool} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold tracking-tight text-foreground">
          Day in the life
        </h2>
        <div className="space-y-6 text-sm leading-relaxed md:text-base">
          <div className="rounded-lg border border-border/60 bg-card p-4 md:p-5">
            <h3 className="font-medium text-foreground">First-time user</h3>
            <p className="mt-2 text-muted-foreground">{dayInLife.firstTimeUser}</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-card p-4 md:p-5">
            <h3 className="font-medium text-foreground">
              Enrolled in Transform (day 23)
            </h3>
            <p className="mt-2 text-muted-foreground">{dayInLife.enrolledUser}</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-card p-4 md:p-5">
            <h3 className="font-medium text-foreground">General productivity user</h3>
            <p className="mt-2 text-muted-foreground">{dayInLife.generalUser}</p>
          </div>
        </div>
      </section>
    </div>
  )
}

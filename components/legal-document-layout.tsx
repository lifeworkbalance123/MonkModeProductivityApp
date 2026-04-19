import type { ReactNode } from "react"
import { AppPageChrome } from "@/components/navigation"
import { Footer } from "@/components/footer"

export function LegalDocumentLayout({
  title,
  lastUpdated,
  children,
}: {
  title: string
  lastUpdated: string
  children: ReactNode
}) {
  return (
    <AppPageChrome className="!bg-background !pt-24 text-foreground">
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <main className="flex-1 pb-16 pt-4 md:pt-2">
        <article className="mx-auto max-w-[760px] px-4 sm:px-6">
          <h1 className="text-3xl font-bold tracking-tight text-primary">
            {title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
          <div className="mt-10 space-y-10 text-[15px] leading-relaxed text-foreground/90 [&_a]:text-primary [&_a]:underline [&_a:hover]:text-primary/80 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_strong]:text-foreground">
            {children}
          </div>
        </article>
      </main>
      <Footer />
      </div>
    </AppPageChrome>
  )
}

export function LegalSection({
  id,
  title,
  children,
}: {
  id?: string
  title: string
  children: ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="mb-3 text-xl font-semibold text-primary">{title}</h2>
      <div className="space-y-3 text-muted-foreground">{children}</div>
    </section>
  )
}

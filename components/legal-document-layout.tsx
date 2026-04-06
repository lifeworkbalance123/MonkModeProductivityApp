import type { ReactNode } from "react"
import { Navigation } from "@/components/navigation"
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
    <div className="min-h-screen flex flex-col bg-[#111827] text-white">
      <Navigation />
      <main className="flex-1 pt-24 pb-16">
        <article className="max-w-[760px] mx-auto px-4 sm:px-6">
          <h1 className="text-3xl font-bold text-amber-400 tracking-tight">
            {title}
          </h1>
          <p className="mt-2 text-sm text-gray-400">Last updated: {lastUpdated}</p>
          <div className="mt-10 space-y-10 text-[15px] leading-relaxed text-gray-100 [&_a]:text-amber-400 [&_a]:underline [&_a:hover]:text-amber-300 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_strong]:text-white">
            {children}
          </div>
        </article>
      </main>
      <Footer />
    </div>
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
      <h2 className="text-xl font-semibold text-amber-400 mb-3">{title}</h2>
      <div className="space-y-3 text-gray-200">{children}</div>
    </section>
  )
}

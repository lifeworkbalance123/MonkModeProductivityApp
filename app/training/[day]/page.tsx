import { redirect, notFound } from 'next/navigation'

type Props = {
  params: Promise<{ day: string }>
}

export default async function TrainingDayPage({ params }: Props) {
  const { day } = await params
  const n = parseInt(day, 10)
  if (!Number.isFinite(n) || n < 1) {
    notFound()
  }
  redirect(`/today?day=${n}`)
}

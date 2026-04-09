import Image from 'next/image'

export default function HeroVisual() {
  return (
    <div className="relative">
      <div className="absolute -inset-10 rounded-full bg-[radial-gradient(circle,rgba(245,158,11,0.22)_0%,rgba(245,158,11,0)_65%)]" />
      <Image
        src="/hero-dashboard-mockup.png"
        alt="MonkMode dashboard preview"
        width={700}
        height={480}
        className="relative w-full rounded-2xl border border-white/10 shadow-2xl"
        loading="lazy"
      />
    </div>
  )
}


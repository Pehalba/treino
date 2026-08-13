export function Toast({ message }: { message: string }) {
  if (!message) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-28 z-50 flex justify-center px-4 lg:bottom-8">
      <p className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-[#08090B] shadow-lg">{message}</p>
    </div>
  )
}

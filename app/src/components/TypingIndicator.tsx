export function TypingIndicator() {
  return (
    <div className="flex w-full justify-start animate-message-appear">
      <div className="flex gap-3 max-w-[80%]">
        {/* AI Avatar */}
        <div className="w-7 h-7 rounded-full shrink-0 overflow-hidden">
          <img src="/AI.png" alt="AI" className="w-full h-full object-cover" />
        </div>

        {/* Typing dots */}
        <div className="px-4 py-3.5 rounded-2xl rounded-tl-sm bg-[#F9F9FB] dark:bg-[#2D3748] border border-[#E5E7EB] dark:border-[#374151]">
          <div className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full bg-[#9CA3AF] dark:bg-[#6B7280] animate-typing-bounce"
              style={{ animationDelay: '0ms' }}
            />
            <div
              className="w-2 h-2 rounded-full bg-[#9CA3AF] dark:bg-[#6B7280] animate-typing-bounce"
              style={{ animationDelay: '120ms' }}
            />
            <div
              className="w-2 h-2 rounded-full bg-[#9CA3AF] dark:bg-[#6B7280] animate-typing-bounce"
              style={{ animationDelay: '240ms' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

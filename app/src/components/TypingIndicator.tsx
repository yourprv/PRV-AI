import { BrandMark } from './BrandMark';

export function TypingIndicator() {
  return (
    <div className="flex w-full justify-start animate-message-appear">
      <div className="flex gap-3 max-w-[80%]">
        {/* PRV mark */}
        <div className="flex h-7 w-7 shrink-0 items-center justify-center"><BrandMark size="sm" /></div>

        {/* Typing dots */}
        <div className="px-4 py-3.5 rounded-2xl rounded-tl-sm bg-transparent dark:bg-[#37352b]">
          <div className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full bg-[#9CA3AF] dark:bg-[#625c49] animate-typing-bounce"
              style={{ animationDelay: '0ms' }}
            />
            <div
              className="w-2 h-2 rounded-full bg-[#9CA3AF] dark:bg-[#625c49] animate-typing-bounce"
              style={{ animationDelay: '120ms' }}
            />
            <div
              className="w-2 h-2 rounded-full bg-[#9CA3AF] dark:bg-[#625c49] animate-typing-bounce"
              style={{ animationDelay: '240ms' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

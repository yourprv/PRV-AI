import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Sidebar } from '@/components/Sidebar';
import { ChatArea } from '@/components/ChatArea';
import { SearchOverlay } from '@/components/SearchOverlay';
import { AuthModal } from '@/components/AuthModal';
import { streamGeminiReply } from '@/lib/gemini';
import { fetchTavilySearch } from '@/lib/tavily';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import type { Chat, Message, ModelId, ModeType } from '@/types/chat';

// Generate unique IDs
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Generate chat title from first message
function generateTitle(content: string): string {
  const trimmed = content.trim();
  if (trimmed.length <= 40) return trimmed;
  return trimmed.substring(0, 40) + '...';
}

export default function Home() {
  const navigate = useNavigate();
  const { chatId } = useParams<{ chatId?: string }>();
  const [chats, setChats] = useLocalStorage<Chat[]>('prv_chats', []);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [currentModel, setCurrentModel] = useState<ModelId>('prv-v1-flash');
  const [mode, setMode] = useState<ModeType>('fast');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchingWeb, setIsSearchingWeb] = useState(false);
  const [requestController, setRequestController] = useState<AbortController | null>(null);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [unauthenticatedSendAttempts, setUnauthenticatedSendAttempts] = useState(0);
  const [initialLoginPromptShown, setInitialLoginPromptShown] = useState(false);
  const { user, isAuthReady } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [renameChatId, setRenameChatId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState('');
  const [deleteChatId, setDeleteChatId] = useState<string | null>(null);

  // Get active chat
  const activeChat = chats.find((c) => c.id === activeChatId);
  const selectedModel = activeChat?.model ?? currentModel;
  const isModelLocked = Boolean(activeChat);
  const messages = activeChat?.messages || [];
  const renameChat = renameChatId ? chats.find((c) => c.id === renameChatId) : undefined;
  const deleteChat = deleteChatId ? chats.find((c) => c.id === deleteChatId) : undefined;

  // Handle sidebar toggle
  const toggleSidebar = useCallback(() => {
    setSidebarExpanded((prev) => !prev);
  }, []);

  useEffect(() => {
    setActiveChatId(chatId ?? null);
  }, [chatId]);

  useEffect(() => {
    if (activeChat) {
      setCurrentModel(activeChat.model);
    }
  }, [activeChat]);

  useEffect(() => {
    if (!isAuthReady) {
      return;
    }

    if (!user && !initialLoginPromptShown) {
      setShowLoginModal(true);
      setInitialLoginPromptShown(true);
      return;
    }

    if (user) {
      setUnauthenticatedSendAttempts(0);
      setShowLoginModal(false);
    }
  }, [user, isAuthReady, initialLoginPromptShown]);

  useEffect(() => {
    if (renameChat) {
      setRenameTitle(renameChat.title);
    } else {
      setRenameTitle('');
    }
  }, [renameChat]);

  // Handle new chat
  const handleNewChat = useCallback(() => {
    setActiveChatId(null);
    navigate('/');
    setSidebarExpanded(true);
  }, [navigate]);

  // Handle select chat
  const handleSelectChat = useCallback(
    (chatId: string) => {
      setActiveChatId(chatId);
      navigate(`/chat/${chatId}`);
      // On mobile, collapse sidebar
      if (window.innerWidth < 768) {
        setSidebarExpanded(false);
      }
    },
    [navigate]
  );

  // Handle settings click
  const handleSettingsClick = useCallback(() => {
    navigate('/settings');
  }, [navigate]);

  const handleToggleWebSearch = useCallback(() => {
    setWebSearchEnabled((prev) => !prev);
  }, []);

  const handleCancelResponse = useCallback(() => {
    if (requestController) {
      requestController.abort();
      setRequestController(null);
    }
    setIsLoading(false);
    setIsSearchingWeb(false);
    toast('Response cancelled.', { icon: '✋' });
  }, [requestController]);

  const handleModelChange = useCallback(
    (model: ModelId) => {
      if (activeChat) {
        toast.info('You cannot change models inside an active chat. Start a new chat to use a different model.');
        return;
      }
      setCurrentModel(model);
    },
    [activeChat]
  );

  const handleBlockedModelChange = useCallback(() => {
    if (activeChat) {
      toast.info('You cannot change models inside an active chat. Start a new chat to use a different model.');
    }
  }, [activeChat]);

  const handleRenameChat = useCallback((chatId: string) => {
    setRenameChatId(chatId);
  }, []);

  const handleDeleteChat = useCallback((chatId: string) => {
    setDeleteChatId(chatId);
  }, []);

  const handleRenameSubmit = useCallback(() => {
    if (!renameChatId) return;
    const title = renameTitle.trim();
    if (!title) return;
    setChats((prev) =>
      prev.map((c) =>
        c.id === renameChatId ? { ...c, title, updatedAt: Date.now() } : c
      )
    );
    setRenameChatId(null);
  }, [renameChatId, renameTitle, setChats]);

  const handleConfirmDeleteChat = useCallback(() => {
    if (!deleteChatId) return;
    const chat = chats.find((c) => c.id === deleteChatId);
    if (!chat) return;
    setChats((prev) => prev.filter((c) => c.id !== deleteChatId));
    if (activeChatId === deleteChatId) {
      setActiveChatId(null);
      navigate('/');
    }
    setDeleteChatId(null);
  }, [activeChatId, chats, deleteChatId, navigate, setChats]);

  const handleCancelRename = useCallback(() => {
    setRenameChatId(null);
  }, []);

  const handleCancelDelete = useCallback(() => {
    setDeleteChatId(null);
  }, []);

  // Handle send message
  const handleSend = useCallback(
    async (content: string, attachmentFiles?: File[]) => {
      if (!user) {
        const nextAttempt = unauthenticatedSendAttempts + 1;
        setUnauthenticatedSendAttempts(nextAttempt);
        setShowLoginModal(true);

        if (nextAttempt >= 2) {
          toast.error('Please login/signup to continue using our AI Chatbot.');
        } else {
          toast('Please login to continue using PRV AI.', { icon: '🔒' });
        }

        return;
      }

      // Create or update chat
      let chatId = activeChatId;

      if (!chatId) {
        // Create new chat when the first message is sent
        const newChat: Chat = {
          id: generateId(),
          title: generateTitle(content),
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          model: currentModel,
        };
        setChats((prev) => [newChat, ...prev]);
        chatId = newChat.id;
        setActiveChatId(chatId);
        navigate(`/chat/${chatId}`);
      }

      // Process attachments
      let attachments: Chat['messages'][0]['attachments'] = undefined;
      if (attachmentFiles && attachmentFiles.length > 0) {
        attachments = [];
        for (const file of attachmentFiles) {
          const reader = new FileReader();
          await new Promise((resolve, reject) => {
            reader.onload = () => {
              const base64 = (reader.result as string).split(',')[1];
              attachments!.push({
                name: file.name,
                mimeType: file.type,
                data: base64,
              });
              resolve(null);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        }
      }

      // Add user message
      const userMessage: Message = {
        id: generateId(),
        role: 'user',
        content,
        timestamp: Date.now(),
        attachments,
      };

      setChats((prev) =>
        prev.map((c) =>
          c.id === chatId
            ? {
                ...c,
                messages: [...c.messages, userMessage],
                updatedAt: Date.now(),
              }
            : c
        )
      );

      // Send the message to Gemini through the selected mode and model
      const willSearchWeb = webSearchEnabled && content.trim().length > 0;
      if (willSearchWeb) {
        setIsSearchingWeb(true);
      }
      setIsLoading(true);
      const controller = new AbortController();
      setRequestController(controller);

      const assistantMessageId = generateId();
      const placeholderMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        thinking: '',
        mode,
      };

      setChats((prev) =>
        prev.map((c) =>
          c.id === chatId
            ? {
                ...c,
                messages: [...c.messages, placeholderMessage],
                updatedAt: Date.now(),
              }
            : c
        )
      );

      let aiResponse = '';
      let thinkingText: string | undefined;
      let thinkingStream = '';
      let answerStream = '';

      try {
        let promptContent = content;
        const willSearchWeb = webSearchEnabled && content.trim().length > 0;
        if (willSearchWeb) {
          try {
            const searchResults = await fetchTavilySearch(content, controller.signal);
            promptContent = `Use the following web search results to answer the user query in detail.\n\n${searchResults}\n\nUser request: ${content}\n\nInstructions:\n- Use only the information from the search results.\n- Cite source URLs when possible.\n- If the results do not contain enough real-time data, say so instead of guessing.\n- Do not invent details that are not supported by the search results.`;
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            toast.error(`Web search failed: ${message}`);
            const failedMessage: Message = {
              id: assistantMessageId,
              role: 'assistant',
              content: `Web search failed: ${message}`,
              timestamp: Date.now(),
              mode,
            };
            setChats((prev) =>
              prev.map((c) =>
                c.id === chatId
                  ? {
                      ...c,
                      messages: c.messages.map((message) =>
                        message.id === assistantMessageId ? failedMessage : message
                      ),
                      updatedAt: Date.now(),
                    }
                  : c
              )
            );
            if (webSearchEnabled) {
              setWebSearchEnabled(false);
            }
            setIsSearchingWeb(false);
            setIsLoading(false);
            setRequestController(null);
            return;
          }
        }

        const reply = await streamGeminiReply({
          content: promptContent,
          model: currentModel,
          mode,
          history: activeChat?.messages ?? [],
          attachments,
          signal: controller.signal,
          onChunk: ({ text, thinking, phase }) => {
            if (phase === 'thinking') {
              if (!thinking) return;
              thinkingStream += thinking;
              setChats((prev) =>
                prev.map((c) =>
                  c.id === chatId
                    ? {
                        ...c,
                        messages: c.messages.map((message) =>
                          message.id === assistantMessageId
                            ? { ...message, thinking: thinkingStream }
                            : message
                        ),
                        updatedAt: Date.now(),
                      }
                    : c
                )
              );
              return;
            }

            if (phase === 'answer') {
              if (!text) return;
              answerStream += text;
              setChats((prev) =>
                prev.map((c) =>
                  c.id === chatId
                    ? {
                        ...c,
                        messages: c.messages.map((message) =>
                          message.id === assistantMessageId
                            ? { ...message, content: answerStream }
                            : message
                        ),
                        updatedAt: Date.now(),
                      }
                    : c
                )
              );
            }
          },
        });

        aiResponse = reply.content;
        thinkingText = reply.thinking;
      } catch (error) {
        if (controller.signal.aborted) {
          aiResponse = 'Response cancelled.';
        } else {
          console.error('Gemini request failed:', error);
          aiResponse = 'I could not reach the Gemini API right now. Please try again in a moment.';
        }
      }

      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: aiResponse,
        timestamp: Date.now(),
        thinking: thinkingText || thinkingStream || undefined,
        mode,
      };

      const usedWebSearch = webSearchEnabled;
      setChats((prev) =>
        prev.map((c) =>
          c.id === chatId
            ? {
                ...c,
                messages: c.messages.some((message) => message.id === assistantMessageId)
                  ? c.messages.map((message) =>
                      message.id === assistantMessageId ? assistantMessage : message
                    )
                  : [...c.messages, assistantMessage],
                updatedAt: Date.now(),
                title: c.messages.length === 0 ? generateTitle(content) : c.title,
              }
            : c
        )
      );
      if (usedWebSearch) {
        setWebSearchEnabled(false);
      }
      setRequestController(null);
      setIsSearchingWeb(false);

      setIsLoading(false);
    },
    [activeChatId, currentModel, mode, setChats, webSearchEnabled, unauthenticatedSendAttempts, user]
  );

  // Handle regenerate
  const handleRegenerate = useCallback(
    async (messageId: string) => {
      if (!activeChatId) return;

      // Find the last user message before this assistant message
      const chat = chats.find((c) => c.id === activeChatId);
      if (!chat) return;

      const msgIndex = chat.messages.findIndex((m) => m.id === messageId);
      if (msgIndex <= 0) return;

      // Get the user message that prompted this
      const userMessage = chat.messages[msgIndex - 1];
      if (userMessage.role !== 'user') return;

      // Remove the assistant message and re-send
      setChats((prev) =>
        prev.map((c) =>
          c.id === activeChatId
            ? { ...c, messages: c.messages.slice(0, msgIndex) }
            : c
        )
      );

      setIsLoading(true);
      const regenController = new AbortController();
      setRequestController(regenController);

      const assistantMessageId = generateId();
      const placeholderMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        thinking: '',
        mode,
      };

      setChats((prev) =>
        prev.map((c) =>
          c.id === activeChatId
            ? {
                ...c,
                messages: [...c.messages, placeholderMessage],
                updatedAt: Date.now(),
              }
            : c
        )
      );

      let regeneratedResponse = '';
      let thinkingStream = '';

      try {
        const reply = await streamGeminiReply({
          content: userMessage.content,
          model: currentModel,
          mode,
          history: chat.messages.slice(0, msgIndex - 1),
          attachments: userMessage.attachments,
          signal: regenController.signal,
          onChunk: ({ text, thinking, phase }) => {
            if (phase === 'thinking') {
              if (!thinking) return;
              thinkingStream += thinking;
              setChats((prev) =>
                prev.map((c) =>
                  c.id === activeChatId
                    ? {
                        ...c,
                        messages: c.messages.map((message) =>
                          message.id === assistantMessageId
                            ? { ...message, thinking: thinkingStream }
                            : message
                        ),
                        updatedAt: Date.now(),
                      }
                    : c
                )
              );
              return;
            }

            if (!text) return;
            regeneratedResponse += text;
            setChats((prev) =>
              prev.map((c) =>
                c.id === activeChatId
                  ? {
                      ...c,
                      messages: c.messages.map((message) =>
                        message.id === assistantMessageId
                          ? { ...message, content: regeneratedResponse }
                          : message
                      ),
                      updatedAt: Date.now(),
                    }
                  : c
              )
            );
          },
        });

        const assistantMessage: Message = {
          id: assistantMessageId,
          role: 'assistant',
          content: reply.content,
          timestamp: Date.now(),
          thinking: reply.thinking || thinkingStream || undefined,
          mode,
        };

        setChats((prev) =>
          prev.map((c) =>
            c.id === activeChatId
              ? {
                  ...c,
                  messages: c.messages.some((message) => message.id === assistantMessageId)
                    ? c.messages.map((message) =>
                        message.id === assistantMessageId ? assistantMessage : message
                      )
                    : [...c.messages, assistantMessage],
                  updatedAt: Date.now(),
                }
              : c
          )
        );
      } catch (error) {
        console.error('Gemini regeneration failed:', error);
      }

      setRequestController(null);
      setIsSearchingWeb(false);
      setIsLoading(false);
    },
    [activeChatId, chats, currentModel, mode, setChats]
  );

  // Load sidebar state
  useEffect(() => {
    const stored = localStorage.getItem('prv_sidebar');
    if (stored !== null) {
      setSidebarExpanded(JSON.parse(stored));
    }
  }, []);

  // Save sidebar state
  useEffect(() => {
    localStorage.setItem('prv_sidebar', JSON.stringify(sidebarExpanded));
  }, [sidebarExpanded]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-[#0F172A]">
      {/* Sidebar - Hidden on mobile, visible on desktop */}
      <div className="hidden lg:block">
        <Sidebar
          isExpanded={sidebarExpanded}
          onToggle={toggleSidebar}
          chats={chats}
          activeChatId={activeChatId}
          onSelectChat={handleSelectChat}
          onNewChat={handleNewChat}
          onSearchOpen={() => setSearchOpen(true)}
          onRenameChat={handleRenameChat}
          onDeleteChat={handleDeleteChat}
        />
      </div>

      {/* Mobile Sidebar Drawer Overlay */}
      {sidebarExpanded && (
        <div className="fixed inset-0 lg:hidden z-40 bg-black/50" onClick={toggleSidebar} />
      )}

      {/* Mobile Sidebar */}
      {sidebarExpanded && (
        <div className="fixed left-0 top-0 h-screen lg:hidden z-50">
          <Sidebar
            isExpanded={true}
            onToggle={toggleSidebar}
            chats={chats}
            activeChatId={activeChatId}
            onSelectChat={handleSelectChat}
            onNewChat={handleNewChat}
            onSearchOpen={() => setSearchOpen(true)}
            onRenameChat={handleRenameChat}
            onDeleteChat={handleDeleteChat}
          />
        </div>
      )}

      {/* Main chat area */}
      <main className="flex-1 flex flex-col min-w-0">
        <ChatArea
          user={user}
          onOpenAuthModal={() => setShowLoginModal(true)}
          messages={messages}
          isLoading={isLoading}
          isSearchingWeb={isSearchingWeb}
          currentModel={selectedModel}
          onModelChange={handleModelChange}
          modelSelectorDisabled={isModelLocked}
          onModelSelectorClick={handleBlockedModelChange}
          webSearchEnabled={webSearchEnabled}
          onToggleWebSearch={handleToggleWebSearch}
          onCancel={handleCancelResponse}
          mode={mode}
          onModeChange={setMode}
          onSend={handleSend}
          onRegenerate={handleRegenerate}
          sidebarExpanded={sidebarExpanded}
          onSettingsClick={handleSettingsClick}
        />
      </main>

      {/* Search overlay */}
      <SearchOverlay
        chats={chats}
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectChat={handleSelectChat}
      />

      <AuthModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />

      <Dialog open={Boolean(renameChatId)} onOpenChange={(open) => { if (!open) setRenameChatId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename chat</DialogTitle>
            <DialogDescription>Update this conversation title to make it easier to find later.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <label className="block text-sm font-medium text-[#374151] dark:text-[#D1D5DB]">
              Chat title
            </label>
            <input
              value={renameTitle}
              onChange={(event) => setRenameTitle(event.target.value)}
              className="w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#111827] shadow-sm outline-none transition-colors duration-200 focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20 dark:border-[#374151] dark:bg-[#111827] dark:text-[#F3F4F6] dark:focus:border-[#818CF8]"
              placeholder="Enter a chat name"
              autoFocus
            />
          </div>
          <DialogFooter className="mt-4 gap-2">
            <button
              type="button"
              onClick={handleCancelRename}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-[#D1D5DB] bg-white px-4 text-sm font-medium text-[#374151] transition-colors duration-200 hover:bg-[#F5F5F7] dark:border-[#4B5563] dark:bg-[#111827] dark:text-[#D1D5DB] dark:hover:bg-[#1F2937]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleRenameSubmit}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-[#4F46E5] px-4 text-sm font-medium text-white transition-colors duration-200 hover:bg-[#4338CA] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!renameTitle.trim()}
            >
              Save
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteChatId)} onOpenChange={(open) => { if (!open) setDeleteChatId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete chat?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteChat
                ? `Delete "${deleteChat.title}"? This action cannot be undone.`
                : 'Delete this chat? This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeleteChat} className="bg-destructive text-white hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

<template>
  <div
    class="max-w-3xl mx-auto px-4 sm:px-6 flex flex-col overflow-hidden"
    :style="containerStyle"
  >
    <!-- Top area (back + header) -->
    <div class="shrink-0 pt-5 sm:pt-8 pb-4">
      <!-- Back link -->
      <NuxtLink
        :to="`/items/${route.params.id}`"
        class="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors mb-4 self-start"
      >
        <UIcon name="i-lucide-arrow-left" class="w-4 h-4" />
        Back to item
      </NuxtLink>

      <!-- Header -->
      <div class="flex items-center gap-3">
        <div
          class="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-950/40 ring-1 ring-primary-100 dark:ring-primary-900/40 flex items-center justify-center shrink-0"
        >
          <UIcon
            name="i-lucide-message-circle"
            class="w-4.5 h-4.5 text-primary-500"
          />
        </div>
        <div class="min-w-0">
          <h1
            class="text-base font-semibold text-neutral-900 dark:text-white leading-tight"
          >
            Discuss with AI
          </h1>
          <p
            v-if="itemTitle"
            class="text-xs text-neutral-400 dark:text-neutral-500 truncate mt-0.5"
          >
            {{ itemTitle }}
          </p>
        </div>
      </div>
    </div>

    <!-- Limit error banner -->
    <div
      v-if="limitError"
      class="mb-3 shrink-0 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 flex items-start gap-3"
    >
      <UIcon
        name="i-lucide-triangle-alert"
        class="w-4 h-4 text-amber-500 shrink-0 mt-0.5"
      />
      <div class="min-w-0">
        <p class="text-sm text-amber-900 dark:text-amber-200 font-medium">
          {{ limitError.error }}
        </p>
        <NuxtLink
          to="/settings"
          class="text-xs text-amber-700 dark:text-amber-400 underline underline-offset-2 mt-0.5 inline-block"
        >
          Upgrade your plan →
        </NuxtLink>
      </div>
    </div>

    <!-- Messages area -->
    <div
      ref="messagesEl"
      class="flex-1 overflow-y-auto min-h-0"
      style="overscroll-behavior: contain"
    >
      <div class="space-y-3 py-2">
        <!-- Initial loading -->
        <div v-if="loading" class="flex items-center justify-center py-20">
          <UIcon
            name="i-lucide-loader-circle"
            class="w-5 h-5 text-neutral-400 animate-spin"
          />
        </div>

        <!-- Empty state -->
        <div
          v-else-if="messages.length === 0"
          class="flex flex-col items-center justify-center py-16 gap-4 text-center px-4"
        >
          <div class="space-y-1.5">
            <p
              class="text-sm font-medium text-neutral-700 dark:text-neutral-300"
            >
              What would you like to know?
            </p>
            <p
              class="text-xs text-neutral-400 dark:text-neutral-500 max-w-[260px] leading-relaxed"
            >
              Ask about themes, comparisons, recommendations, or anything
              <span v-if="itemTitle"
                >about
                <span
                  class="text-neutral-600 dark:text-neutral-400 font-medium"
                  >{{ itemTitle }}</span
                >
              </span>
              <span v-else>about this</span>.
            </p>
          </div>
          <!-- Starter prompts -->
          <div class="flex flex-col gap-2 w-full max-w-xs">
            <button
              v-for="prompt in starterPrompts"
              :key="prompt"
              class="text-left text-xs px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 text-neutral-600 dark:text-neutral-400 hover:border-primary-300 dark:hover:border-primary-700/70 hover:bg-primary-50/50 dark:hover:bg-primary-950/20 hover:text-primary-700 dark:hover:text-primary-400 transition-all"
              @click="sendStarter(prompt)"
            >
              {{ prompt }}
            </button>
          </div>
        </div>

        <!-- Message bubbles -->
        <template v-else>
          <div
            v-for="(msg, i) in messages"
            :key="i"
            class="flex"
            :class="msg.role === 'user' ? 'justify-end' : 'justify-start'"
          >
            <!-- AI avatar -->
            <div
              v-if="msg.role === 'assistant'"
              class="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center shrink-0 mr-2 mt-1 overflow-hidden"
            >
              <img src="/logo.svg" alt="Meloria" class="w-3.5 h-3.5" />
            </div>

            <div
              class="text-sm leading-relaxed"
              :class="
                msg.role === 'user'
                  ? 'max-w-[78%] bg-primary-500 text-white rounded-2xl rounded-br-md px-4 py-2.5 whitespace-pre-wrap shadow-sm'
                  : 'max-w-[82%] bg-neutral-50 dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-neutral-800/80 text-neutral-900 dark:text-neutral-100 rounded-2xl rounded-bl-md px-4 py-2.5 prose prose-sm dark:prose-invert max-w-none'
              "
            >
              <template v-if="msg.role === 'assistant'">
                <!-- eslint-disable-next-line vue/no-v-html -->
                <span v-html="renderMarkdown(msg.content)" />
                <span
                  v-if="i === messages.length - 1 && streaming && !msg.content"
                  class="inline-flex items-center gap-1 py-0.5"
                >
                  <span
                    class="w-1.5 h-1.5 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-bounce"
                    style="animation-delay: 0ms"
                  />
                  <span
                    class="w-1.5 h-1.5 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-bounce"
                    style="animation-delay: 150ms"
                  />
                  <span
                    class="w-1.5 h-1.5 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-bounce"
                    style="animation-delay: 300ms"
                  />
                </span>
                <span
                  v-else-if="i === messages.length - 1 && streaming"
                  class="inline-block w-0.5 h-3.5 bg-neutral-400 dark:bg-neutral-500 rounded-sm animate-pulse ml-0.5 align-text-bottom"
                />
              </template>
              <span v-else>{{ msg.content }}</span>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Input bar -->
    <div
      class="shrink-0 pt-2.5 pb-3 sm:pb-5 mt-1 border-t border-neutral-200 dark:border-neutral-800"
      :style="inputBarStyle"
    >
      <div class="flex gap-2 items-end">
        <textarea
          ref="inputEl"
          v-model="input"
          rows="1"
          placeholder="Ask something…"
          :disabled="streaming || !!limitError"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="sentences"
          class="flex-1 resize-none rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-600 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 dark:focus:border-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed max-h-32 overflow-y-auto"
          style="field-sizing: content"
          @keydown.enter.exact.prevent="send"
          @keydown.enter.shift.exact="undefined"
          @input="autoResize"
        />
        <UButton
          :disabled="!input.trim() || streaming || !!limitError"
          :loading="streaming"
          icon="i-lucide-send"
          color="primary"
          variant="solid"
          size="md"
          class="rounded-xl shrink-0 mb-px"
          @click="send"
        />
      </div>
      <p class="hidden sm:block text-xs text-neutral-400 mt-1.5 text-center">
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  createItemsService,
  type DiscussionMessage,
  type DiscussionLimitError,
} from "~/services/items.service";

useHead({ title: "Discuss with AI" });

const route = useRoute();
const api = useApiService();
const itemsService = createItemsService(api);

const itemId = computed(() => route.params.id as string);

const loading = ref(true);
const streaming = ref(false);
const messages = ref<DiscussionMessage[]>([]);
const input = ref("");
const itemTitle = ref<string | null>(null);
const limitError = ref<DiscussionLimitError | null>(null);
const messagesEl = ref<HTMLElement | null>(null);
const inputEl = ref<HTMLTextAreaElement | null>(null);

// Track visual viewport height to handle mobile keyboard gap
const vvHeight = ref<number | null>(null);

const containerStyle = computed(() => {
  const h = vvHeight.value;
  return {
    height: h !== null ? `calc(${h}px - 4rem)` : "calc(100dvh - 4rem)",
  };
});

// On mobile, add bottom padding equal to safe-area-inset-bottom when keyboard is open
const inputBarStyle = computed(() => {
  // No extra padding needed — container height already accounts for keyboard
  return {};
});

function renderMarkdown(text: string): string {
  if (!text) return "";
  return (
    text
      // Escape raw HTML from AI output to prevent XSS
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      // Code blocks (must come before inline code)
      .replace(
        /```[\w]*\n?([\s\S]*?)```/g,
        '<pre class="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-3 my-2 overflow-x-auto text-xs"><code>$1</code></pre>',
      )
      // Inline code
      .replace(
        /`([^`]+)`/g,
        '<code class="bg-neutral-100 dark:bg-neutral-800 rounded px-1 py-0.5 text-xs font-mono">$1</code>',
      )
      // Bold
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      // Italic
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      // Bullet list items (lines starting with - or *)
      .replace(/^[\-\*] (.+)$/gm, "<li>$1</li>")
      // Wrap consecutive <li> in <ul>
      .replace(
        /(<li>.*<\/li>\n?)+/g,
        (match) => `<ul class="list-disc pl-4 my-1 space-y-0.5">${match}</ul>`,
      )
      // Numbered list items
      .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
      // Double newline → paragraph break
      .replace(/\n\n/g, "</p><p class='mt-2'>")
      // Single newline → line break
      .replace(/\n/g, "<br />")
      // Wrap in paragraph
      .replace(/^(.+)$/, "<p>$1</p>")
  );
}

const starterPrompts = computed(() => {
  const title = itemTitle.value;
  return [
    title
      ? `What themes does ${title} explore?`
      : "What themes does this explore?",

    title
      ? `Let's discuss ${title}. What are your thoughts?`
      : "Let's discuss this item. What are your thoughts?",
    title
      ? `What should I watch/read next after ${title}?`
      : "What should I watch or read next?",
  ];
});

async function loadDiscussion() {
  try {
    const [discussion, item] = await Promise.all([
      itemsService.getDiscussion(itemId.value),
      itemsService.getById(itemId.value).catch(() => null),
    ]);
    messages.value = discussion.messages;
    if (item?.title) itemTitle.value = item.title;
  } catch (e) {
    console.error("[Discussion] Failed to load:", e);
  } finally {
    loading.value = false;
    await nextTick();
    scrollToBottom();
  }
}

async function send() {
  const text = input.value.trim();
  if (!text || streaming.value) return;

  const userMessage: DiscussionMessage = { role: "user", content: text };
  messages.value.push(userMessage);
  input.value = "";
  await nextTick();
  scrollToBottom();
  await nextTick();
  autoResize();

  // Optimistic assistant bubble
  messages.value.push({ role: "assistant", content: "" });
  streaming.value = true;
  limitError.value = null;

  // Pass all messages including the new user one (exclude the empty assistant bubble at end)
  const messagesToSend = messages.value.slice(0, -1);

  try {
    const response = await itemsService.sendDiscussionMessage(
      itemId.value,
      messagesToSend,
    );

    if (!response.ok) {
      const errData = await response
        .json()
        .catch(() => ({ error: "An error occurred." }));
      messages.value.pop(); // remove empty assistant bubble
      messages.value.pop(); // remove user message (didn't go through)
      if (errData.upgrade_required) {
        limitError.value = errData as DiscussionLimitError;
      }
      streaming.value = false;
      return;
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";

      for (const part of parts) {
        if (!part.startsWith("data: ")) continue;
        const raw = part.slice(6).trim();
        if (raw === "[DONE]" || raw === "[ERROR]") break;
        try {
          const parsed = JSON.parse(raw) as { t: string };
          messages.value[messages.value.length - 1].content += parsed.t ?? "";
          await nextTick();
          scrollToBottom();
        } catch {
          // malformed SSE chunk — skip
        }
      }
    }
  } catch (err) {
    console.error("[Discussion] Send error:", err);
    if (messages.value[messages.value.length - 1]?.role === "assistant") {
      messages.value[messages.value.length - 1].content =
        "Sorry, something went wrong. Please try again.";
    }
  } finally {
    streaming.value = false;
    await nextTick();
    scrollToBottom();
    inputEl.value?.focus();
  }
}

function sendStarter(prompt: string) {
  input.value = prompt;
  send();
}

function scrollToBottom() {
  if (messagesEl.value) {
    messagesEl.value.scrollTop = messagesEl.value.scrollHeight;
  }
}

function autoResize() {
  if (inputEl.value) {
    inputEl.value.style.height = "auto";
    inputEl.value.style.height = `${Math.min(inputEl.value.scrollHeight, 144)}px`;
  }
}

onMounted(() => {
  loadDiscussion();

  if (typeof window !== "undefined" && window.visualViewport) {
    vvHeight.value = window.visualViewport.height;

    const handleViewport = () => {
      const newH = window.visualViewport!.height;
      const prev = vvHeight.value;
      vvHeight.value = newH;
      // Scroll to bottom when keyboard opens (viewport shrinks)
      if (prev !== null && newH < prev) {
        nextTick(scrollToBottom);
      }
    };

    window.visualViewport.addEventListener("resize", handleViewport);
    window.visualViewport.addEventListener("scroll", handleViewport);

    onUnmounted(() => {
      window.visualViewport?.removeEventListener("resize", handleViewport);
      window.visualViewport?.removeEventListener("scroll", handleViewport);
    });
  }
});
</script>

<template>
  <Transition name="cookie-banner">
    <div
      v-if="visible"
      class="cookie-banner"
      role="dialog"
      aria-label="Cookie consent"
    >
      <div class="cookie-banner-content">
        <p class="cookie-banner-text">
          We use cookies to improve your experience and analyse site usage. By
          continuing, you agree to our
          <NuxtLink to="/privacy" class="cookie-banner-link"
            >Privacy Policy</NuxtLink
          >.
        </p>
        <div class="cookie-banner-actions">
          <button class="cookie-btn cookie-btn-accept" @click="accept">
            Accept
          </button>
          <button class="cookie-btn cookie-btn-decline" @click="decline">
            Decline
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
const STORAGE_KEY = "cookie_consent";

const visible = ref(false);

onMounted(() => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    visible.value = true;
  }
});

function accept() {
  localStorage.setItem(STORAGE_KEY, "accepted");
  visible.value = false;
}

function decline() {
  localStorage.setItem(STORAGE_KEY, "declined");
  visible.value = false;
}
</script>

<style scoped>
.cookie-banner {
  position: fixed;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  width: calc(100% - 2rem);
  max-width: 640px;
  background: #1a1a2e;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  padding: 1rem 1.25rem;
}

.cookie-banner-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.cookie-banner-text {
  flex: 1;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.75);
  margin: 0;
  min-width: 200px;
}

.cookie-banner-link {
  color: #a78bfa;
  text-decoration: underline;
}

.cookie-banner-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.cookie-btn {
  padding: 0.4rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: opacity 0.15s;
}

.cookie-btn:hover {
  opacity: 0.85;
}

.cookie-btn-accept {
  background: #7c3aed;
  color: #fff;
}

.cookie-btn-decline {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.7);
}

.cookie-banner-enter-active,
.cookie-banner-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.cookie-banner-enter-from,
.cookie-banner-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(1rem);
}
</style>

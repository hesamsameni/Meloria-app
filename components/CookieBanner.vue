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
  background: #1c1a17;
  border: 1px solid #2a2620;
  border-radius: 16px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.5);
  padding: 1rem 1.25rem;
  font-family: "Google Sans", "Raleway", sans-serif;
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
  color: #a89880;
  margin: 0;
  min-width: 200px;
  line-height: 1.5;
}

.cookie-banner-link {
  color: #f0855a;
  text-decoration: underline;
  transition: color 0.2s;
}

.cookie-banner-link:hover {
  color: #f3f0ea;
}

.cookie-banner-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.cookie-btn {
  display: inline-flex;
  align-items: center;
  padding: 0.45rem 1.1rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
  font-family: inherit;
}

.cookie-btn-accept {
  background: linear-gradient(135deg, #f0855a, #b03f1e);
  color: #fff;
  box-shadow: 0 4px 16px rgba(232, 103, 58, 0.3);
}

.cookie-btn-accept:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 24px rgba(232, 103, 58, 0.4);
}

.cookie-btn-decline {
  background: transparent;
  color: #a89880;
  border: 1px solid #2a2620;
}

.cookie-btn-decline:hover {
  color: #f3f0ea;
  border-color: #3a3020;
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

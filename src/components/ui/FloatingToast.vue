<template>
  <teleport to="body">
    <transition name="toast">
      <div
        v-if="message"
        class="toast"
        :class="`toast--${mode}`"
        role="status"
        aria-live="polite"
      >
        <span class="toast-icon" aria-hidden="true">
          <svg v-if="mode === 'success'" viewBox="0 0 24 24" fill="none">
            <path
              d="M20 7L10.5 16.5L4 10"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>

          <svg v-else-if="mode === 'error'" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 21a9 9 0 1 0-9-9 9 9 0 0 0 9 9Z"
              stroke="currentColor"
              stroke-width="2"
            />
            <path d="M15 9l-6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" />
            <path d="M9 9l6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" />
          </svg>

          <svg v-else viewBox="0 0 24 24" fill="none">
            <path
              d="M10.3 4.6h3.4L22 20H2L10.3 4.6Z"
              stroke="currentColor"
              stroke-width="2"
              stroke-linejoin="round"
            />
            <path d="M12 9v5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" />
            <path d="M12 17.5h.01" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" />
          </svg>
        </span>

        <span class="toast-text">{{ message }}</span>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    message: string | null
    mode?: 'success' | 'error' | 'warning'
  }>(),
  { mode: 'success' }
)
</script>

<style scoped>
@reference "../../assets/main.css";

.toast {
  position: fixed;
  left: 50%;
  bottom: max(1.75rem, calc(env(safe-area-inset-bottom, 0px) + 1.25rem));
  transform: translateX(-50%);
  z-index: 9999;
  pointer-events: none;

  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  min-width: 220px;
  max-width: min(520px, calc(100vw - 2.5rem));
  padding: 0.7rem 0.9rem;
  border-radius: 0.95rem;
  color: rgba(15, 23, 42, 0.92);
  font-size: 0.875rem;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(226, 232, 240, 0.9);
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.16);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

.toast-icon {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  background: rgba(15, 23, 42, 0.06);
}

.toast-icon svg {
  width: 18px;
  height: 18px;
}

.toast-text {
  line-height: 1.25rem;
  font-weight: 600;
  color: rgba(15, 23, 42, 0.86);
}

.toast--success {
  border-color: rgba(16, 185, 129, 0.25);
}
.toast--success .toast-icon {
  background: rgba(16, 185, 129, 0.14);
  color: rgb(5, 150, 105);
}

.toast--warning {
  border-color: rgba(245, 158, 11, 0.28);
}
.toast--warning .toast-icon {
  background: rgba(245, 158, 11, 0.16);
  color: rgb(217, 119, 6);
}

.toast--error {
  border-color: rgba(244, 63, 94, 0.25);
}
.toast--error .toast-icon {
  background: rgba(244, 63, 94, 0.14);
  color: rgb(225, 29, 72);
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 200ms ease, transform 220ms ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(10px) scale(0.99);
}
.toast-enter-to,
.toast-leave-from {
  opacity: 1;
  transform: translateX(-50%) translateY(0) scale(1);
}
</style>


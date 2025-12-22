<template>
  <section class="home-shell">
    <div class="glass-card home-card">
      <div class="home-header">
        <p class="eyebrow">遊戲實驗室</p>
        <h1>網頁小遊戲</h1>
        <p class="subtitle">
          互動小遊戲沙盒。
        </p>
      </div>

      <div class="home-actions">
        <router-link
          to="/game/game1_guessword/quiz"
          class="primary"
        >
          開始遊玩「猜字遊戲」
        </router-link>
        <router-link
          to="/game/game1_guessword/editor"
          class="ghost"
        >
          前往題目編輯
        </router-link>
      </div>

      <div class="role-card" aria-label="目前使用者身分">
        <p class="role-title">目前身分</p>
        <div class="role-pills">
          <AuthGate roles="guest">
            <span class="role-pill role-guest">遊客（guest）</span>
          </AuthGate>
          <AuthGate roles="user">
            <span class="role-pill role-user">一般使用者（user）</span>
          </AuthGate>
          <AuthGate roles="admin">
            <span class="role-pill role-admin">管理員（admin）</span>
          </AuthGate>
        </div>
        <p class="role-hint">若身分不符預期，請先登出後重新登入。</p>
      </div>

      <div class="home-footer">
        <p>目前已啟用遊戲：</p>
        <ul>
          <li>猜字遊戲（格子遮罩 / 大遮罩雙模式）</li>
        </ul>

        <div class="license-note" aria-label="字體授權聲明">
          <p class="license-text">
            本網站使用「教育部標準楷書字形檔（Version 5.00）」，採創用 CC「姓名標示-禁止改作」授權（CC BY-ND）。引用請標示「中華民國教育部」。
          </p>
          <p class="license-text">
            授權/說明文件：
            <a
              class="license-link"
              href="https://language.moe.gov.tw/001/Upload/Files/site_content/M0001/edukai.pdf"
              target="_blank"
              rel="noopener noreferrer"
            >
              edukai.pdf（教育部）
            </a>
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
</script>

<style scoped>
@reference "../assets/main.css";

.home-shell {
  @apply flex justify-center items-start w-full px-4 pt-10 pb-16;
}

.home-card {
  @apply w-full max-w-4xl px-8 py-10 text-slate-900;
}

.home-header {
  @apply space-y-3 mb-8;
}

.eyebrow {
  @apply text-[11px] font-semibold tracking-[0.25em] uppercase text-sky-300/80;
}

.home-card h1 {
  @apply text-3xl font-semibold tracking-tight text-slate-900;
}

.subtitle {
  @apply text-sm leading-relaxed text-slate-600/90 max-w-2xl;
}

.home-actions {
  @apply flex flex-wrap items-center gap-3 mb-8;
}

.role-card {
  @apply mb-8 rounded-2xl border border-slate-200 bg-white/70 backdrop-blur-3xl px-5 py-4;
}

.role-title {
  @apply text-xs font-semibold tracking-[0.18em] uppercase text-slate-500;
}

.role-pills {
  @apply mt-2 flex flex-wrap items-center gap-2;
}

.role-pill {
  @apply inline-flex items-center px-3 py-1 rounded-full text-[12px] font-semibold border;
}

.role-guest {
  @apply bg-slate-900/10 text-slate-700 border-slate-300/70;
}

.role-user {
  @apply bg-sky-500/10 text-sky-700 border-sky-300/70;
}

.role-admin {
  @apply bg-violet-500/10 text-violet-700 border-violet-300/70;
}

.role-hint {
  @apply mt-2 text-[12px] text-slate-500;
}

.primary {
  @apply inline-flex items-center justify-center px-5 py-2.5 rounded-full text-[13px] font-medium bg-gradient-to-r from-sky-500 to-violet-500 text-white shadow-md shadow-sky-500/40 hover:opacity-95 hover:-translate-y-0.5 transition-all;
}

.ghost {
  @apply inline-flex items-center justify-center px-5 py-2.5 rounded-full text-[13px] font-medium bg-white/70 border border-slate-200 text-slate-700 hover:bg-white hover:border-slate-400 transition-all;
}

.home-footer {
  @apply border-t border-slate-200 pt-5 mt-4 text-xs text-slate-500;
}

.home-footer ul {
  @apply list-disc list-inside mt-1 space-y-0.5;
}

.license-note {
  @apply mt-4 pt-4 border-t border-slate-200/80;
}

.license-text {
  @apply text-[11px] leading-relaxed text-slate-500;
}

.license-link {
  @apply underline underline-offset-2 text-slate-600 hover:text-slate-900;
}
</style>

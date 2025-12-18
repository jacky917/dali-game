// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import LoginView from '../views/LoginView.vue'
import HomeView from '../views/HomeView.vue'
import QuizView from '../views/game1_guessword/QuizView.vue'
import EditorView from '../views/game1_guessword/EditorView.vue'

const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/', redirect: '/home' },
        { path: '/login', name: 'login', component: LoginView },
        { path: '/home', name: 'home', component: HomeView },
        {
            path: '/game/:gameName',
            redirect: (to) => ({ path: `/game/${to.params.gameName}/quiz` })
        },
        {
            path: '/game/:gameName/quiz',
            name: 'game-quiz',
            component: QuizView,
            props: true,
        },
        {
            path: '/game/:gameName/editor',
            name: 'game-editor',
            component: EditorView,
            props: true,
        },
    ],
})

// 全域守衛：每次換頁前都會來這裡先驗證 token
router.beforeEach((to) => {
    const { isLoggedIn, checkAuth } = useAuth()

    // 重新從 localStorage 讀 token 並更新 isLoggedIn
    checkAuth()

    // 沒登入，且不是要去登入頁 → 強制轉到登入
    if (!isLoggedIn.value && to.name !== 'login') {
        return { name: 'login' }
    }

    // 已登入，卻還要去登入頁 → 丟回首頁
    if (isLoggedIn.value && to.name === 'login') {
        return { name: 'home' }
    }

    // 其他情況正常通行
})

export default router

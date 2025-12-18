// src/composables/useAuth.ts
import { ref } from 'vue'

const TOKEN_KEY = 'dali-auth-token'
// 這是「唯一合法」的 token，現在先寫死
const VALID_TOKEN = 'SUPER_SECRET_TOKEN_123'

// 小工具：從 localStorage 讀出 token
function getStoredToken(): string | null {
    return localStorage.getItem(TOKEN_KEY)
}

// 小工具：檢查 token 是否有效（現在用字串比對）
// 之後要接後端，只要改這裡就好
function isTokenValid(token: string | null): boolean {
    return token === VALID_TOKEN
}

// 一開始就從 localStorage 抓 token，決定預設登入狀態
const isLoggedIn = ref<boolean>(isTokenValid(getStoredToken()))

export function useAuth() {
    const login = (password: string) => {
        // 簡單示範：密碼正確時，就發「合法 token」
        if (password === '0423380303') {
            localStorage.setItem(TOKEN_KEY, VALID_TOKEN)
            isLoggedIn.value = true
            return true
        }
        return false
    }

    const logout = () => {
        localStorage.removeItem(TOKEN_KEY)
        isLoggedIn.value = false
    }

    // 給路由守衛／其他地方用：重新從 localStorage 讀 token 再驗證一次
    const checkAuth = () => {
        const token = getStoredToken()
        isLoggedIn.value = isTokenValid(token)
        return isLoggedIn.value
    }

    return {
        isLoggedIn,
        login,
        logout,
        checkAuth,
    }
}

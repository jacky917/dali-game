// src/composables/useAuth.ts
import { computed, ref } from 'vue'

const TOKEN_KEY = 'dali-auth-token'

export type AuthRole = 'guest' | 'user' | 'admin'
export type Ability =
  | 'quiz:edit' // 可否儲存/修改題目設定
  | 'styles:edit' // 可否修改遮罩樣式設定（長按編輯等）
  | 'admin:all' // 未來保留：管理員完整權限

// 以「token」代表角色（之後接後端也可直接替換成 JWT / session）
const TOKENS: Record<AuthRole, string> = {
  guest: 'DALIGAME_TOKEN_GUEST',
  user: 'DALIGAME_TOKEN_USER',
  admin: 'DALIGAME_TOKEN_ADMIN',
}

// 你指定的三組代碼（注意 guest 有前導 0，要用字串比對）
const PASSWORD_TO_ROLE: Record<string, AuthRole> = {
  '0423380303': 'guest',
  '123456789': 'user',
  '22988753': 'admin',
}

// 小工具：從 localStorage 讀出 token
function getStoredToken(): string | null {
    return localStorage.getItem(TOKEN_KEY)
}

function roleFromToken(token: string | null): AuthRole | null {
  if (!token) return null
  if (token === TOKENS.guest) return 'guest'
  if (token === TOKENS.user) return 'user'
  if (token === TOKENS.admin) return 'admin'
  return null
}

// 一開始就從 localStorage 抓 token，決定預設登入狀態
const role = ref<AuthRole | null>(roleFromToken(getStoredToken()))
const isLoggedIn = computed(() => role.value !== null)

const ROLE_ABILITIES: Record<AuthRole, Record<Ability, boolean>> = {
  guest: {
    // 目前原則：畫面顯示就可操作（包含儲存題目/編輯樣式）
    'quiz:edit': true,
    'styles:edit': true,
    'admin:all': false,
  },
  user: {
    'quiz:edit': true,
    'styles:edit': true,
    'admin:all': false,
  },
  admin: {
    'quiz:edit': true,
    'styles:edit': true,
    'admin:all': true,
  },
}

export function useAuth() {
    const login = (password: string) => {
        const nextRole = PASSWORD_TO_ROLE[String(password ?? '')]
        if (!nextRole) return false
        localStorage.setItem(TOKEN_KEY, TOKENS[nextRole])
        role.value = nextRole
        return true
    }

    const logout = () => {
        localStorage.removeItem(TOKEN_KEY)
        role.value = null
    }

    // 給路由守衛／其他地方用：重新從 localStorage 讀 token 再驗證一次
    const checkAuth = () => {
        const token = getStoredToken()
        role.value = roleFromToken(token)
        return isLoggedIn.value
    }

    const isGuest = computed(() => role.value === 'guest')
    const isUser = computed(() => role.value === 'user')
    const isAdmin = computed(() => role.value === 'admin')

    // 權限：用 ability 表達，未來新增/調整只要改 ROLE_ABILITIES
    const can = (ability: Ability) => computed(() => {
      const r = role.value
      if (!r) return false
      return !!ROLE_ABILITIES[r]?.[ability]
    })

    // 更好用的通用判斷（可直接在 template / 任意 JS 使用）
    const hasRole = (roles: AuthRole | AuthRole[]) => {
      const r = role.value
      if (!r) return false
      const list = Array.isArray(roles) ? roles : [roles]
      return list.includes(r)
    }

    const canDo = (abilities: Ability | Ability[]) => {
      const r = role.value
      if (!r) return false
      const list = Array.isArray(abilities) ? abilities : [abilities]
      return list.some((a) => !!ROLE_ABILITIES[r]?.[a])
    }

    // 常用能力（避免各頁重複寫字串）
    const canEditQuiz = can('quiz:edit')
    const canEditStyles = can('styles:edit')
    const canAdminAll = can('admin:all')

    // 向後相容：舊命名（目前等同 quiz:edit）
    const canEdit = canEditQuiz

    return {
        isLoggedIn,
        role,
        login,
        logout,
        checkAuth,
        isGuest,
        isUser,
        isAdmin,
        canEdit,
        can,
        hasRole,
        canDo,
        canEditQuiz,
        canEditStyles,
        canAdminAll,
    }
}

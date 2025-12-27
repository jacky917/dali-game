<template>
  <slot v-if="allowed" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuth, type Ability, type AuthRole } from '@/composables/useAuth'

const props = defineProps<{
  /** 允許的角色（任一符合即可） */
  roles?: AuthRole | AuthRole[]
  /** 需要的能力（任一符合即可） */
  ability?: Ability | Ability[]
}>()

const { hasRole, canDo } = useAuth()

const allowed = computed(() => {
  const roleOk = props.roles ? hasRole(props.roles) : true
  const abilityOk = props.ability ? canDo(props.ability) : true
  return roleOk && abilityOk
})
</script>


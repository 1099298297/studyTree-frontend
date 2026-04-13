// src/stores/user.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as userApi from '@/api/user'

export const useUserStore = defineStore('user', () => {
  // 状态
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(null)

  // 登录
  const login = async (loginData) => {
    const res = await userApi.login(loginData)
    token.value = res.data
    localStorage.setItem('token', res.data)
    await fetchUserInfo()
  }

  // 注册
  const register = async (registerData) => {
    const res = await userApi.register(registerData)
    token.value = res.data
    localStorage.setItem('token', res.data)
    await fetchUserInfo()
  }

  // 获取用户信息
  const fetchUserInfo = async () => {
    const res = await userApi.getUserInfo()
    // 注意：接口返回的是 Map，必须从 data.user 获取用户信息
    userInfo.value = res.data.user
    return res.data // 返回完整数据以便组件获取 totalLps
  }

  // 更新用户信息（包括权重）
  const updateUserInfo = async (updateData) => {
    await userApi.updateUser(updateData)
    await fetchUserInfo() // 更新后立即刷新
  }

  // 退出登录
  const logout = () => {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
  }

  return {
    token,
    userInfo,
    login,
    register,
    fetchUserInfo,
    updateUserInfo,
    logout
  }
})
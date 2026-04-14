// src/api/study.js
import request from '@/utils/request'

// ==================== 学习记录接口 ====================
// 获取指定日期的学习记录
export const getStudyLogsByDate = (date) => {
  return request.get(`/log/date/${date}`)
}

// 获取指定日期的总LPS
export const getDailyTotalLps = (date) => {
  return request.get(`/log/daily-lps/${date}`)
}

// ==================== 统计数据接口 ====================
// 获取个人统计概览（今日/本周/本月数据）
export const getStatisticsOverview = () => {
  return request.get('/statistics/overview')
}
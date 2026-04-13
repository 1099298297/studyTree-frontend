import request from '@/utils/request'

// 获取最近学习动态
export const getRecentLogs = (limit = 20) => {
  return request({
    url: '/square/recent-logs',
    method: 'get',
    params: { limit }
  })
}

// 总LPS榜单
export const getTotalLpsRank = () => {
  return request({
    url: '/square/rank/total-lps',
    method: 'get'
  })
}

// 连续学习天数榜单
export const getStreakRank = () => {
  return request({
    url: '/square/rank/streak-days',
    method: 'get'
  })
}
import request from '@/utils/request'

// 获取概览统计
export const getOverview = () => {
  return request({
    url: '/statistics/overview',
    method: 'get'
  })
}

// 获取学习热力图
export const getHeatmap = (params) => {
  return request({
    url: '/statistics/heatmap',
    method: 'get',
    params
  })
}
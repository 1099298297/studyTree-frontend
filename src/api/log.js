import request from '@/utils/request'

// 创建学习记录
export const createStudyLog = (data) => {
  return request({
    url: '/log/create',
    method: 'post',
    data
  })
}

// 获取指定日期的学习记录
export const getLogByDate = (date) => {
  return request({
    url: `/log/date/${date}`,
    method: 'get'
  })
}

// 删除学习记录
export const deleteStudyLog = (logId) => {
  return request({
    url: `/log/delete/${logId}`,
    method: 'delete'
  })
}

export const getDailyTotalLps = (date) => {
  return request.get(`/log/daily-lps/${date}`)
}

// 🔥 新增：获取日期范围的LPS数据
export const getDailyLpsRange = (startDate, endDate) => {
  return request.get('/log/daily-lps/range', {
    params: { startDate, endDate }
  })
}
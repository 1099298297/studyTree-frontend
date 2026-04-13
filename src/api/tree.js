import request from '@/utils/request'

// 创建知识树
export const createTree = (data) => {
  return request({
    url: '/tree/create',
    method: 'post',
    data
  })
}

// 获取知识树列表
export const getTreeList = () => {
  return request({
    url: '/tree/list',
    method: 'get'
  })
}

// 更新知识树
export const updateTree = (treeId, data) => {
  return request({
    url: `/tree/update/${treeId}`,
    method: 'put',
    data
  })
}

// 删除知识树
export const deleteTree = (treeId) => {
  return request({
    url: `/tree/delete/${treeId}`,
    method: 'delete'
  })
}
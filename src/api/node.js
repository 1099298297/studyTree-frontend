import request from '@/utils/request'

// 创建节点
export const createNode = (data) => {
  return request({
    url: '/node/create',
    method: 'post',
    data
  })
}

// 获取树的所有节点
export const getNodeList = (treeId) => {
  return request({
    url: `/node/list/${treeId}`,
    method: 'get'
  })
}

// 获取节点总LPS（删除前必须调用）
export const getNodeTotalLps = (nodeId) => {
  return request({
    url: `/node/total-lps/${nodeId}`,
    method: 'get'
  })
}

// 删除节点
export const deleteNode = (nodeId) => {
  return request({
    url: `/node/delete/${nodeId}`,
    method: 'delete'
  })
}

// 更新节点名称
export const updateNode = (nodeId, data) => {
  return request({
    url: `/node/update/${nodeId}`,
    method: 'put',
    data
  })
}

// 切换掌握状态
export const toggleNodeMastered = (nodeId) => {
  return request({
    url: `/node/toggle-mastered/${nodeId}`,
    method: 'put'
  })
}
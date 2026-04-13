export const concentrationFilter = (v) => {
  const map = { general: '通识学习', system: '系统学习', depth: '深度攻克' }
  return map[v] || v
}

export const periodFilter = (v) => {
  const map = {
    morning: '上午',
    noon: '中午',
    afternoon: '下午',
    evening: '晚间',
    midnight: '午夜'
  }
  return map[v] || v
}
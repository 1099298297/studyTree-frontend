<template>
  <div class="record-container">
    <!-- 顶部导航栏 -->
    <div class="header-bar">
      <div class="header-left">
        <el-button @click="goBack" icon="Back" class="btn-back">返回</el-button>
        <el-button @click="router.push('/')" class="btn-home">首页</el-button>
      </div>
      <h2 class="page-title">📝 我的学习记录</h2>
      <div></div>
    </div>

    <!-- 统计概览卡片 -->
    <div class="stats-grid" v-loading="statsLoading">
      <div class="stat-card">
        <div class="stat-icon today">📅</div>
        <div class="stat-content">
          <div class="stat-value">{{ todayLps || 0 }} LPS</div>
          <div class="stat-label">今日获得积分</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon week">📊</div>
        <div class="stat-content">
          <div class="stat-value">{{ totalLps || 0 }} LPS</div>
          <div class="stat-label">累计总积分</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon month">🏆</div>
        <div class="stat-content">
          <div class="stat-value">{{ userInfo?.streakDays || 0 }} 天</div>
          <div class="stat-label">连续学习天数</div>
        </div>
      </div>
    </div>

    <!-- 日期筛选区 -->
    <div class="filter-bar">
      <div class="quick-buttons">
        <!-- 动态生成最近10个学习日期 -->
        <el-button 
          v-for="btn in quickDates" 
          :key="btn.date"
          :type="activeDate === btn.date ? 'primary' : ''"
          @click="selectDateByBtn(btn)"
          class="quick-btn"
        >
          {{ btn.label }}
        </el-button>
      </div>
      <el-date-picker
        v-model="selectedDate"
        type="date"
        placeholder="选择日期"
        @change="onDateChange"
        class="date-picker"
        value-format="YYYY-MM-DD"
      />
    </div>

    <!-- 学习记录列表 -->
    <div class="record-list" v-loading="listLoading">
      <div v-if="recordList.length === 0" class="empty-state">
        <el-icon size="48" color="#c0c4cc"><Document /></el-icon>
        <p>该日期暂无学习记录</p>
        <el-button type="primary" @click="goToTreeList" class="go-btn">去学习吧</el-button>
      </div>

      <div v-else class="record-item" v-for="item in recordList" :key="item.id">
        <div class="record-left">
          <div class="node-name" v-html="item.path || '加载中...'"></div>
          <div class="record-meta">
            <span class="time">⏱️ {{ item.timePeriod || '未知时段' }}</span>
            <span class="concentration">{{ concentrationFilter(item.concentration) }}</span>
          </div>
        </div>
        <div class="record-right">
          <div class="finish-time">{{ formatTime(item.createTime) }}</div>
          <el-button type="danger" size="small" circle @click="delLog(item.id)">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Document, Close, Back } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

import * as logApi from '@/api/log'

const router = useRouter()
const userStore = useUserStore()

const statsLoading = ref(false)
const listLoading = ref(false)
const totalLps = ref(0)
const userInfo = ref({})
const todayLps = ref(0)
const recordList = ref([])

const selectedDate = ref('')
const activeDate = ref('')
const quickDates = ref([])

const concentrationFilter = v => ({
  general: '通识学习',
  system: '系统学习',
  depth: '深度攻克'
}[v] || '学习')

// ============== 工具方法 ==============
const goBack = () => router.back()
const goToTreeList = () => router.push('/tree/list')

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

const formatDate = (date) => {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 🔥 优化后的日期标签：今天/昨天/今年(月-日)/往年(年-月-日)
const getDateLabel = (dateStr) => {
  const today = formatDate(new Date())
  const yesterday = formatDate(new Date().setDate(new Date().getDate() - 1))
  
  // 优先级最高：今天/昨天
  if (dateStr === today) return '今天'
  if (dateStr === yesterday) return '昨天'
  
  // 判断是否是今年
  const currentYear = new Date().getFullYear()
  const [year, month, day] = dateStr.split('-')
  if (parseInt(year) === currentYear) {
    return `${month}-${day}` // 今年只显示 月-日
  }
  return dateStr // 往年显示完整日期
}

// ============== 节点路径 ==============
const getNodePath = async (nodeId) => {
  try {
    const res = await fetch(`/api/node/path/${nodeId}`)
    const result = await res.json()
    if (result.code === 200 && result.data) {
      const nodes = result.data.map(it => it.name)
      if (nodes.length === 1) {
        return `<span class="target">${nodes[0]}</span>`
      }
      const target = nodes.pop()
      const prefix = nodes.join(' → ')
      return `${prefix} → <span class="target">${target}</span>`
    }
    return '未知节点'
  } catch {
    return '未知节点'
  }
}

// ============== 数据加载 ==============
const loadUserData = async () => {
  try {
    const res = await userStore.fetchUserInfo()
    totalLps.value = res.totalLps || 0
    userInfo.value = res.user || {}
  } catch (e) {
    totalLps.value = 0
    userInfo.value = {}
  }
}

const loadLogs = async (dateStr) => {
  listLoading.value = true
  try {
    const res = await logApi.getLogByDate(dateStr)
    const logs = res.data || []
    for (let log of logs) {
      log.path = await getNodePath(log.nodeId)
    }
    recordList.value = logs
  } catch (e) {
    console.error('加载记录失败', e)
  } finally {
    listLoading.value = false
  }
}

const loadTodayLps = async (dateStr) => {
  try {
    const res = await logApi.getDailyTotalLps(dateStr)
    if (res.code === 200 || res.success) {
      todayLps.value = res.data || 0
    }
  } catch (e) {
    todayLps.value = 0
  }
}

// 加载最近10个学习日期
const loadRecentDates = async () => {
  try {
    // 获取最近1年的日期范围
    const endDate = formatDate(new Date())
    const startDate = formatDate(new Date().setFullYear(new Date().getFullYear() - 1))
    
    const res = await logApi.getDailyLpsRange(startDate, endDate)
    if (res.code === 200 && res.data) {
      // 按日期倒序排列（最新的在最前面）
      const sortedDates = res.data.sort((a, b) => new Date(b.date) - new Date(a.date))
      
      // 取最近10个
      const recent10 = sortedDates.slice(0, 10)
      
      // 生成 quickDates，自动识别日期标签
      quickDates.value = recent10.map(item => ({
        date: item.date,
        label: getDateLabel(item.date),
        lps: item.lps
      }))
    }
  } catch (e) {
    console.error('加载最近日期失败', e)
  }
}

const loadAllByDate = async (dateStr) => {
  await loadLogs(dateStr)
  await loadTodayLps(dateStr)
}

// ============== 日期切换 ==============
const selectDateByBtn = async (btn) => {
  activeDate.value = btn.date
  selectedDate.value = btn.date
  await loadAllByDate(btn.date)
}

const onDateChange = async (date) => {
  if (!date) return
  activeDate.value = ''
  const dateStr = date
  selectedDate.value = dateStr
  await loadAllByDate(dateStr)
}

// ============== 删除 ==============
const delLog = async (logId) => {
  try {
    await ElMessageBox.confirm('确定删除该学习记录？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await logApi.deleteStudyLog(logId)
    ElMessage.success('删除成功')
    
    // 删除后重新加载所有数据
    await loadAllByDate(selectedDate.value)
    await loadRecentDates() // 重新加载最近日期列表
    await loadUserData()
  } catch (e) {
    ElMessage.info('已取消删除')
  }
}

// ============== 初始化 ==============
onMounted(async () => {
  await loadUserData()
  await loadRecentDates() // 先加载最近日期
  
  // 默认选中今天（如果今天在列表里）
  const today = formatDate(new Date())
  const todayBtn = quickDates.value.find(b => b.date === today)
  
  if (todayBtn) {
    await selectDateByBtn(todayBtn)
  } else if (quickDates.value.length > 0) {
    // 如果今天没学习，选中最近的一个
    await selectDateByBtn(quickDates.value[0])
  } else {
    // 如果没有任何学习记录，显示今天
    selectedDate.value = today
    activeDate.value = today
  }
})
</script>

<style scoped>
.record-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f4ff 0%, #e8f0ff 100%);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.1);
}
.header-left {
  display: flex;
  gap: 12px;
}
.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}
.btn-back, .btn-home {
  border-radius: 8px;
  height: 36px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}
.stat-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.1);
  transition: all 0.3s;
}
.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(102, 126, 234, 0.15);
}
.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}
.stat-icon.today {
  background: linear-gradient(135deg, #667eea 0%, #8c92ff 100%);
}
.stat-icon.week {
  background: linear-gradient(135deg, #42b883 0%, #67c23a 100%);
}
.stat-icon.month {
  background: linear-gradient(135deg, #f56c6c 0%, #ff7875 100%);
}
.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 4px;
}
.stat-label {
  font-size: 14px;
  color: #7f8c8d;
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.1);
}
.quick-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  max-width: 70%;
}
.quick-btn {
  border-radius: 8px;
  height: 36px;
}
.date-picker {
  width: 180px;
  flex-shrink: 0;
}

.record-list {
  flex: 1;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.1);
}
.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid rgba(102, 126, 234, 0.1);
  transition: background 0.2s;
}
.record-item:last-child {
  border-bottom: none;
}
.record-item:hover {
  background: rgba(102, 126, 234, 0.05);
}
.node-name {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
}
.record-meta {
  display: flex;
  gap: 12px;
  font-size: 13px;
  color: #7f8c8d;
}
.record-right {
  text-align: right;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;
}
.finish-time {
  font-size: 13px;
  color: #7f8c8d;
}

.empty-state {
  text-align: center;
  padding: 80px 0;
  color: #999;
}
.empty-state p {
  margin: 16px 0 24px;
  font-size: 16px;
}
.go-btn {
  border-radius: 8px;
  height: 36px;
}

:deep(.target) {
  color: #1890ff;
  font-weight: bold;
  font-size: 16px;
}
</style>
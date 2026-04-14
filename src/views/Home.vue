<template>
  <div class="fancy-home">
    <div class="glass-top">
      <div class="user-box">
        <h2>🎉 欢迎回来，{{ userInfo?.username || '学习者' }}</h2>
        <div class="lps-badge">
          总学习力指数
          <span class="lps-glow">{{ totalLps }}</span>
        </div>
      </div>
      <div class="btn-group">
        <el-button type="success" @click="router.push('/tree/list')">
          <el-icon><Menu /></el-icon> 知识树
        </el-button>
        <el-button type="primary" @click="router.push('/study/record')">
          <el-icon><Document /></el-icon> 学习记录
        </el-button>
        <el-button type="danger" @click="handleLogout">
          退出登录
        </el-button>
      </div>
    </div>

    <div class="stats-grid">
      <el-card class="stat-card color1" shadow="hover">
        <div class="stat-content">
          <p class="title">总学习力</p>
          <p class="num">{{ totalLps }}</p>
        </div>
      </el-card>
      <el-card class="stat-card color2" shadow="hover">
        <div class="stat-content">
          <p class="title">连续学习</p>
          <p class="num">{{ userInfo?.streakDays || 0 }}天</p>
        </div>
      </el-card>
      <el-card class="stat-card color3" shadow="hover">
        <div class="stat-content">
          <p class="title">学习记录</p>
          <p class="num">{{ userInfo?.totalRecords || 0 }}</p>
        </div>
      </el-card>
    </div>

    <div class="heatmap-section">
      <h3 class="section-title">📅 每日学习力(LPS)热力图</h3>
      <div class="heatmap-card">
        <CalendarHeatmap
          :values="heatmapData"
          :end-date="heatmapEndDate"
          color-range="#ebedf0,#9be9a8,#40c463,#216e39"
          :tooltip="true"
          lang="zh"
        />
      </div>
    </div>

    <div class="period-section">
      <h3 class="section-title">🚀 选择学习时段</h3>
      <div class="period-buttons">
        <el-button
          v-for="p in periods"
          :key="p.key"
          class="period-btn"
          :class="currentPeriod === p.key ? 'active' : ''"
          @click="openLogDialog(p.key)"
        >
          {{ p.label }}
        </el-button>
      </div>
    </div>

    <div class="log-section">
      <h3 class="section-title">📚 今日学习记录</h3>
      <div class="log-list" v-loading="loadingLogs">
        <div class="log-item" v-for="log in todayLogs" :key="log.id">
          <div class="log-left">
            <div class="log-title" v-html="log.path || '加载路径中...'"></div>
            <div class="log-tags">
              <span class="tag type">{{ concentrationFilter(log.concentration) }}</span>
              <span class="tag time">{{ periodFilter(log.timePeriod) }}</span>
            </div>
          </div>
          <el-button type="danger" size="small" circle @click="delLog(log.id)">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
        <div v-if="todayLogs.length === 0" class="empty-box">
          📖 暂无学习记录，点击上方时段开始学习吧！
        </div>
      </div>
    </div>

    <el-dialog v-model="logDialogVisible" title="✨ 添加学习记录" width="700px" @close="clearTreeCheck">
      <el-tree
        :data="treeListData"
        show-checkbox
        node-key="id"
        ref="treeRef"
        default-expand-all
        check-strictly
        class="tree-select"
      />
      <div class="btns-row">
        <el-button type="success" @click="createLog('general')">🟢 通识学习</el-button>
        <el-button type="warning" @click="createLog('system')">🟡 系统学习</el-button>
        <el-button type="danger" @click="createLog('depth')">🔴 深度攻克</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { Menu, Close, Document } from '@element-plus/icons-vue'

import { CalendarHeatmap } from 'vue3-cal-heatmap'
import 'vue3-cal-heatmap/dist/style.css'

// 🔥 引入 getDailyLpsRange
import * as logApi from '@/api/log'
import * as treeApi from '@/api/tree'
import * as nodeApi from '@/api/node'

const router = useRouter()
const userStore = useUserStore()

const totalLps = ref(0)
const userInfo = ref({})
const today = new Date().toISOString().split('T')[0]
const currentPeriod = ref('')
const todayLogs = ref([])
const treeListData = ref([])
const loadingLogs = ref(false)
const logDialogVisible = ref(false)
const treeRef = ref(null)

const heatmapData = ref([])
const heatmapEndDate = ref(new Date().toISOString().split('T')[0])

const periods = [
  { key: 'morning', label: '上午' },
  { key: 'noon', label: '中午' },
  { key: 'afternoon', label: '下午' },
  { key: 'evening', label: '晚间' },
  { key: 'midnight', label: '午夜' }
]

const concentrationFilter = v => ({
  general: '通识学习',
  system: '系统学习',
  depth: '深度攻克'
}[v] || '学习')

const periodFilter = v => ({
  morning: '上午',
  noon: '中午',
  afternoon: '下午',
  evening: '晚间',
  midnight: '午夜'
}[v] || '时段')

// 格式化日期
const formatDate = (date) => {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const loadUserData = async () => {
  try {
    const res = await userStore.fetchUserInfo()
    totalLps.value = res.totalLps || 0
    userInfo.value = res.user || {}
  } catch (e) {
    totalLps.value = 0
    userInfo.value = {}
    ElMessage.error('用户信息加载失败')
  }
}

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

const loadLogs = async () => {
  loadingLogs.value = true
  try {
    const res = await logApi.getLogByDate(today)
    const logs = res.data || []
    for (let log of logs) {
      log.path = await getNodePath(log.nodeId)
    }
    todayLogs.value = logs
  } catch (e) {
    console.error('加载记录失败', e)
  } finally {
    loadingLogs.value = false
  }
}

const loadTree = async () => {
  try {
    const treeRes = await treeApi.getTreeList()
    const nodeArray = []
    for (let tree of treeRes.data) {
      const nodeRes = await nodeApi.getNodeList(tree.id)
      nodeRes.data.forEach(it => {
        it.label = it.name
        nodeArray.push(it)
      })
    }
    treeListData.value = buildTree(nodeArray)
  } catch (e) {}
}

const buildTree = (nodes) => {
  const map = {}
  const roots = []
  nodes.forEach(it => {
    it.children = []
    map[it.id] = it
  })
  nodes.forEach(it => {
    if (it.parentId === 0) {
      roots.push(it)
    } else {
      const parent = map[it.parentId]
      if (parent) parent.children.push(it)
    }
  })
  return roots
}

const openLogDialog = (period) => {
  currentPeriod.value = period
  logDialogVisible.value = true
  loadTree()
}

const clearTreeCheck = () => {
  if (treeRef.value) {
    treeRef.value.setCheckedKeys([])
  }
}

const createLog = async (type) => {
  const nodes = treeRef.value?.getCheckedNodes() || []
  if (nodes.length === 0) {
    ElMessage.warning('请选择学习节点')
    return
  }

  try {
    await logApi.createStudyLog({
      studyDate: today,
      timePeriod: currentPeriod.value,
      nodeIds: nodes.map(it => it.id),
      concentration: type,
      remark: ''
    })
    ElMessage.success('学习记录添加成功！')
    logDialogVisible.value = false
    await loadUserData()
    await loadLogs()
    await getHeatmapData()
  } catch (e) {
    ElMessage.error('添加失败')
  }
}

const delLog = async (logId) => {
  try {
    await ElMessageBox.confirm('确定删除该学习记录？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await logApi.deleteStudyLog(logId)
    ElMessage.success('删除成功')
    await loadLogs()
    await getHeatmapData()
  } catch (e) {
    ElMessage.info('已取消删除')
  }
}

const handleLogout = () => {
  userStore.logout()
  ElMessage.success('退出登录成功')
  router.push('/login')
}

// ==============================================
// 🔥 核心修改：对接真实接口 + 补全缺失日期
// ==============================================
const getHeatmapData = async () => {
  try {
    // 1. 计算日期范围：最近1年
    const endDate = formatDate(new Date())
    const startDate = formatDate(new Date().setFullYear(new Date().getFullYear() - 1))
    
    // 2. 调用真实接口
    const res = await logApi.getDailyLpsRange(startDate, endDate)
    if (res.code === 200 && res.data) {
      // 3. 把接口返回的数据转成 Map，方便查找
      const lpsMap = new Map()
      res.data.forEach(item => {
        lpsMap.set(item.date, item.lps)
      })
      
      // 4. 生成过去一年的所有日期，补全缺失的（LPS=0）
      const fullData = []
      const end = new Date()
      for (let i = 364; i >= 0; i--) {
        const date = new Date(end.getTime() - i * 86400000)
        const dateStr = formatDate(date)
        fullData.push({
          date: dateStr,
          count: lpsMap.get(dateStr) || 0 // 🔥 接口没返回的日子，count=0
        })
      }
      
      heatmapData.value = fullData
      return
    }
  } catch (e) {
    console.error('获取热力图数据失败', e)
  }
  
  // 接口失败时的备用模拟数据
  const data = []
  const end = new Date()
  for (let i = 364; i >= 0; i--) {
    const date = new Date(end.getTime() - i * 86400000)
    data.push({
      date: date.toISOString().split("T")[0],
      count: Math.floor(Math.random() * 25)
    })
  }
  heatmapData.value = data
}

onMounted(async () => {
  await loadUserData()
  await loadLogs()
  await getHeatmapData()
})
</script>

<style scoped>
.fancy-home {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4efe9 100%);
  padding: 20px;
}

.glass-top {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}

.lps-glow {
  font-size: 24px;
  font-weight: bold;
  color: #4facfe;
  text-shadow: 0 0 10px rgba(79, 172, 254, 0.3);
  margin-left: 8px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  border-radius: 16px;
  border: none;
  color: white;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.15);
}

.color1 { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.color2 { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
.color3 { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }

.stat-content {
  text-align: center;
  padding: 12px 0;
}

.title {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 4px;
}

.num {
  font-size: 24px;
  font-weight: bold;
}

.section-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 16px;
  color: #333;
}

.heatmap-section {
  margin-bottom: 24px;
}
.heatmap-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.period-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.period-btn {
  border-radius: 20px;
  padding: 8px 20px;
  border: none;
  background: white;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.period-btn.active {
  background: linear-gradient(135deg, #4facfe, #00f2fe) !important;
  color: white !important;
}

.log-section {
  margin-top: 24px;
}

.log-item {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  transition: all 0.3s;
}

.log-item:hover {
  transform: translateX(4px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.1);
}

:deep(.target) {
  color: #1890ff;
  font-weight: bold;
  font-size: 18px;
}
.log-title {
  color: #999;
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 8px;
}

.log-tags {
  display: flex;
  gap: 8px;
}

.tag {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.tag.type { background: #e6f7ff; color: #1890ff; }
.tag.time { background: #f0f2f5; color: #666; }

.empty-box {
  text-align: center;
  padding: 40px 20px;
  color: #999;
  background: white;
  border-radius: 12px;
}

.tree-select {
  height: 320px;
  overflow-y: auto;
  margin: 16px 0;
}

.btns-row {
  display: flex;
  gap: 16px;
  justify-content: center;
}
</style>
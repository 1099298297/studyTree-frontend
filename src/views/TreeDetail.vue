<template>
  <div class="tree-detail-container" @click="closeContextMenu">
    <!-- 顶部栏 -->
    <div class="detail-header">
      <el-button @click="goBack" icon="Back" class="btn-back">返回</el-button>
      <h2 class="page-title">🌳 知识思维导图</h2>
      <el-button type="primary" @click="openCreateDialogByRoot" icon="Plus" class="btn-add">添加根节点</el-button>
    </div>

    <!-- 自适应思维导图 -->
    <div class="mindmap-box" v-loading="loading">
      <svg 
        :viewBox="viewBox" 
        width="100%" 
        height="100%" 
        preserveAspectRatio="xMidYMid meet"
        class="mindmap-svg"
      >
        <!-- 连线 -->
        <g v-for="line in lines" :key="line.id">
          <line :x1="line.x1" :y1="line.y1" :x2="line.x2" :y2="line.y2" stroke="#667eea" stroke-width="2"/>
        </g>
        <!-- 节点 -->
        <g 
          v-for="item in nodes" 
          :key="item.id" 
          @click="selectNode(item)"
          @contextmenu.prevent="openContextMenu($event, item)"
        >
          <rect 
            :x="item.x - 60" :y="item.y - 15" 
            width="120" height="30" 
            rx="6" 
            fill="rgba(255,255,255,0.9)"
            stroke="#667eea"
            stroke-width="1"
            :class="{ active: currentNode?.id === item.id }"
          />
          <text :x="item.x" :y="item.y" text-anchor="middle" dominant-baseline="middle" fill="#333" font-size="13">
            {{ item.label }}
          </text>
        </g>
      </svg>
    </div>

    <!-- 🔥 右键菜单 -->
    <div 
      v-if="showContextMenu"
      class="context-menu"
      :style="{ left: `${menuX}px`, top: `${menuY}px` }"
    >
      <div class="menu-item" @click.stop="openCreateChildDialog">在此节点增加</div>
      <div class="menu-item" @click.stop="openEditDialog">修改此节点</div>
      <div class="menu-item danger" @click.stop="doDeleteNode">删除节点</div>
    </div>

    <!-- 编辑/创建弹窗 -->
    <el-dialog v-model="nodeDialogVisible" :title="dialogTitle" @close="resetNodeForm">
      <el-form :model="nodeForm" :rules="nodeRules" ref="nodeFormRef" @keyup.enter="submitNodeForm">
        <el-form-item label="节点名称" prop="name">
          <el-input v-model="nodeForm.name" placeholder="请输入节点名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="nodeDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitNodeForm">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as nodeApi from '@/api/node'

const router = useRouter()
const route = useRoute()
const treeId = route.params.treeId

// 布局配置
const CONFIG = {
  NODE_WIDTH: 120,
  NODE_HEIGHT: 30,
  H_STEP: 240,
  V_STEP: 80,
  PADDING: 100
}

// 核心数据
const treeData = ref([])
const loading = ref(false)
const currentNode = ref(null)
const nodes = ref([])
const lines = ref([])
const viewBox = ref('0 0 800 600')

// 右键菜单
const showContextMenu = ref(false)
const menuX = ref(0)
const menuY = ref(0)
const currentContextNode = ref(null)

// 弹窗
const nodeDialogVisible = ref(false)
const isEditNode = ref(false)
const nodeFormRef = ref(null)
const submitLoading = ref(false)
const nodeForm = ref({ name: '', parentId: 0 })
const nodeRules = { name: [{ required: true, message: '请输入名称', trigger: 'blur' }] }
const dialogTitle = ref('创建节点')

// ============== 基础方法 ==============
const goBack = () => router.push('/tree/list')
const resetNodeForm = () => nodeFormRef.value?.clearValidate()

// 构建树形结构
const buildTree = (list) => {
  const map = {}, roots = []
  list.forEach(n => { n.children = []; n.label = n.name; map[n.id] = n })
  list.forEach(n => n.parentId === 0 ? roots.push(n) : map[n.parentId]?.children.push(n))
  return roots
}

// 自动布局 + 居中
const layoutTree = (root) => {
  nodes.value = []
  lines.value = []
  let yCounter = 0

  const dfs = (node, level) => {
    node.x = 150 + level * CONFIG.H_STEP
    if (node.children?.length) {
      node.children.forEach(child => dfs(child, level + 1))
      const ys = node.children.map(c => c.y)
      node.y = (Math.min(...ys) + Math.max(...ys)) / 2
    } else {
      node.y = yCounter
      yCounter += CONFIG.V_STEP
    }
    nodes.value.push({ id: node.id, label: node.label, x: node.x, y: node.y })
    node.children?.forEach(child => {
      lines.value.push({
        id: `${node.id}-${child.id}`,
        x1: node.x + CONFIG.NODE_WIDTH / 2,
        y1: node.y,
        x2: child.x - CONFIG.NODE_WIDTH / 2,
        y2: child.y
      })
    })
  }

  if (root.length) dfs(root[0], 0)
  if (nodes.value.length === 0) return
  const xs = nodes.value.map(i => i.x)
  const ys = nodes.value.map(i => i.y)
  const minX = Math.min(...xs) - CONFIG.PADDING
  const maxX = Math.max(...xs) + CONFIG.PADDING
  const minY = Math.min(...ys) - CONFIG.PADDING
  const maxY = Math.max(...ys) + CONFIG.PADDING
  viewBox.value = `${minX} ${minY} ${maxX - minX} ${maxY - minY}`
}

// 刷新数据
const fetchNodeList = async () => {
  loading.value = true
  const res = await nodeApi.getNodeList(treeId)
  treeData.value = buildTree(res.data)
  layoutTree(treeData.value)
  loading.value = false
}

// ============== 右键菜单 ==============
const openContextMenu = (e, node) => {
  currentContextNode.value = node
  menuX.value = e.clientX
  menuY.value = e.clientY
  showContextMenu.value = true
}
const closeContextMenu = () => {
  showContextMenu.value = false
}

// ============== 菜单对应操作 ==============
// 在此节点增加子节点
const openCreateChildDialog = () => {
  closeContextMenu()
  isEditNode.value = false
  dialogTitle.value = '在此节点增加'
  nodeForm.value = { name: '', parentId: currentContextNode.value.id }
  nodeDialogVisible.value = true
}
// 根节点新增
const openCreateDialogByRoot = () => {
  isEditNode.value = false
  dialogTitle.value = '创建根节点'
  nodeForm.value = { name: '', parentId: 0 }
  nodeDialogVisible.value = true
}
// 修改节点
const openEditDialog = () => {
  closeContextMenu()
  isEditNode.value = true
  dialogTitle.value = '修改此节点'
  nodeForm.value = { name: currentContextNode.value.label, parentId: null }
  nodeDialogVisible.value = true
}
// 删除节点
const doDeleteNode = async () => {
  closeContextMenu()
  const id = currentContextNode.value.id
  const lps = await nodeApi.getNodeTotalLps(id)
  await ElMessageBox.confirm(`涉及 ${lps.data} LPS，确定删除？`, '警告', { type: 'warning' })
  await nodeApi.deleteNode(id)
  ElMessage.success('删除成功')
  fetchNodeList()
}

// ============== 提交 ==============
const submitNodeForm = async () => {
  await nodeFormRef.value.validate(async valid => {
    if (!valid) return
    submitLoading.value = true
    try {
      if (isEditNode.value) {
        await nodeApi.updateNode(currentContextNode.value.id, { name: nodeForm.value.name })
      } else {
        await nodeApi.createNode({ 
          treeId, 
          parentId: nodeForm.value.parentId, 
          name: nodeForm.value.name 
        })
      }
      ElMessage.success('操作成功')
      nodeDialogVisible.value = false
      fetchNodeList()
    } catch (e) {
      ElMessage.error('操作失败')
    }
    submitLoading.value = false
  })
}

const selectNode = (item) => currentNode.value = item

onMounted(() => fetchNodeList())
</script>

<style scoped>
.tree-detail-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f4ff 0%, #e8f0ff 100%);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  flex-shrink: 0;
}
.page-title { font-size: 20px; margin: 0; }
.btn-back,.btn-add { border-radius: 8px; height: 36px; }

.mindmap-box {
  flex: 1;
  background: rgba(255,255,255,0.9);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.mindmap-svg {
  display: block;
  max-width: 100%;
  max-height: 100%;
}
.active {
  fill: rgba(102, 126, 234, 0.15) !important;
  stroke-width: 2px !important;
}

/* 🔥 右键菜单样式 */
.context-menu {
  position: fixed;
  z-index: 9999;
  width: 160px;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(12px);
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  border: 1px solid rgba(255,255,255,0.3);
  overflow: hidden;
}
.menu-item {
  padding: 10px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}
.menu-item:hover {
  background: rgba(102, 126, 234, 0.1);
}
.menu-item.danger {
  color: #f56c6c;
}
.menu-item.danger:hover {
  background: rgba(245, 108, 108, 0.1);
}
</style>
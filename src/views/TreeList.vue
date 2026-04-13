<template>
  <div class="tree-container">
    <!-- 顶部导航栏 -->
    <div class="tree-header">
      <div class="header-left">
        <h2>🌳 我的知识树</h2>
        <p>管理你的学习体系，轻松掌握知识</p>
      </div>
      <el-button 
        type="primary" 
        @click="openCreateDialog"
        class="btn-create"
      >
        <el-icon><Plus /></el-icon>
        创建知识树
      </el-button>
    </div>

    <!-- 知识树卡片列表 -->
    <div class="tree-content" v-loading="loading" element-loading-class="loading-glass">
      <div class="card-grid">
        <el-card 
          v-for="tree in treeList" 
          :key="tree.id" 
          class="tree-glass-card"
          shadow="never"
        >
          <!-- 卡片头部 -->
          <div class="card-top">
            <h3 class="tree-title">{{ tree.name }}</h3>
            <div class="card-btn-group">
              <el-button 
                circle 
                icon="Edit" 
                @click="openEditDialog(tree)" 
                class="btn-icon btn-edit"
              />
              <el-button 
                circle 
                icon="Delete" 
                type="danger" 
                @click="handleDeleteTree(tree.id)"
                class="btn-icon btn-delete"
              />
            </div>
          </div>

          <!-- 卡片描述 -->
          <div class="card-desc">
            {{ tree.description || '暂无描述，点击编辑添加说明~' }}
          </div>

          <!-- 卡片底部 -->
          <div class="card-bottom">
            <el-button 
              type="success" 
              @click="goToTreeDetail(tree.id)"
              class="btn-study"
            >
              进入学习
            </el-button>
          </div>
        </el-card>

        <!-- 空状态 -->
        <div v-if="!treeList.length && !loading" class="empty-card">
          <div class="empty-box">
            <el-icon size="50" color="#8c92ff"><FolderOpened /></el-icon>
            <p>暂无知识树，快去创建第一个吧</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑/创建弹窗 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="isEdit ? '编辑知识树' : '创建知识树'" 
      @close="resetForm"
      class="glass-dialog"
      width="500px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" class="tree-form">
        <el-form-item label="知识树名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入名称" />
        </el-form-item>
        <el-form-item label="知识树描述">
          <el-input v-model="form.description" type="textarea" rows="4" placeholder="请输入描述信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="submitForm">确认保存</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, FolderOpened } from '@element-plus/icons-vue'
import * as treeApi from '@/api/tree'

const router = useRouter()
const treeList = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const currentTreeId = ref(null)
const formRef = ref(null)
const submitLoading = ref(false)

const form = ref({ name: '', description: '' })
const rules = { 
  name: [{ required: true, message: '请输入知识树名称', trigger: 'blur' }] 
}

// 获取列表
const fetchTreeList = async () => {
  loading.value = true
  const res = await treeApi.getTreeList()
  treeList.value = res.data
  loading.value = false
}

// 打开创建
const openCreateDialog = () => {
  isEdit.value = false
  form.value = { name: '', description: '' }
  dialogVisible.value = true
}

// 打开编辑
const openEditDialog = (t) => {
  isEdit.value = true
  currentTreeId.value = t.id
  form.value = { name: t.name, description: t.description || '' }
  dialogVisible.value = true
}

// 重置表单
const resetForm = () => formRef.value?.clearValidate()

// 提交
const submitForm = async () => {
  await formRef.value.validate(async valid => {
    if (!valid) return
    submitLoading.value = true
    try {
      isEdit.value 
        ? await treeApi.updateTree(currentTreeId.value, form.value) 
        : await treeApi.createTree(form.value)
      ElMessage.success(isEdit.value ? '编辑成功' : '创建成功')
      dialogVisible.value = false
      fetchTreeList()
    } catch (e) {
      ElMessage.error('操作失败')
    }
    submitLoading.value = false
  })
}

// 删除
const handleDeleteTree = async (id) => {
  await ElMessageBox.confirm(
    `确定删除？删除后将移入回收站，7天内可恢复\n所有节点和学习记录将被隐藏`,
    '警告',
    { type: 'warning' }
  )
  await treeApi.deleteTree(id)
  ElMessage.success('删除成功')
  fetchTreeList()
}

// 跳转详情
const goToTreeDetail = (id) => router.push(`/tree/detail/${id}`)

onMounted(() => fetchTreeList())
</script>

<style scoped>
/* ========== 全局容器 ========== */
.tree-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f4ff 0%, #e8f0ff 50%, #f5f7ff 100%);
  padding: 2rem 4rem;
  box-sizing: border-box;
}

/* ========== 顶部标题栏 ========== */
.tree-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3rem;
  padding: 1.5rem 2rem;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(140, 146, 255, 0.1);
}

.header-left h2 {
  font-size: 2rem;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
}

.header-left p {
  font-size: 1rem;
  color: #7f8c8d;
  margin: 0;
}

/* 创建按钮 */
.btn-create {
  height: 44px;
  border-radius: 12px;
  padding: 0 24px;
  font-weight: 600;
  border: none;
  background: linear-gradient(135deg, #667eea 0%, #8c92ff 100%);
  transition: all 0.3s ease;
}

.btn-create:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
}

/* ========== 内容区域 ========== */
.tree-content {
  width: 100%;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 28px;
}

/* ========== 毛玻璃卡片 ========== */
.tree-glass-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 8px 32px rgba(140, 146, 255, 0.12);
  padding: 24px;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
}

.tree-glass-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 20px 40px rgba(102, 126, 234, 0.2);
  border-color: rgba(102, 126, 234, 0.2);
}

/* 卡片头部 */
.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.tree-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-btn-group {
  display: flex;
  gap: 8px;
}

.btn-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-edit:hover {
  background: rgba(102, 126, 234, 0.1);
}

.btn-delete:hover {
  background: rgba(240, 71, 71, 0.1);
}

/* 卡片描述 */
.card-desc {
  color: #718096;
  line-height: 1.6;
  min-height: 60px;
  margin-bottom: 20px;
  font-size: 0.95rem;
}

/* 卡片底部按钮 */
.card-bottom {
  text-align: right;
}

.btn-study {
  border-radius: 12px;
  padding: 6px 20px;
  font-weight: 500;
  transition: all 0.3s;
}

.btn-study:hover {
  transform: scale(1.08);
}

/* ========== 空状态 ========== */
.empty-card {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-box {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 60px 100px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(140, 146, 255, 0.1);
}

.empty-box p {
  color: #7f8c8d;
  font-size: 1rem;
  margin-top: 16px;
}

/* ========== 弹窗样式 ========== */
:deep(.glass-dialog .el-dialog) {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
}

.tree-form {
  padding: 10px 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 加载动画毛玻璃 */
:deep(.loading-glass) {
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
}
</style>
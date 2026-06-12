<template>
  <div class="app-container">
    <el-form :model="form" ref="form" label-width="100px" v-loading="formLoading">
      <el-form-item label="ID：" prop="id" style="width: 473px">
        <el-input v-model="form.id" disabled></el-input>
      </el-form-item>
      <el-form-item label="套餐名：" prop="title" required style="width: 473px">
        <el-input v-model="form.title"></el-input>
      </el-form-item>
      <el-form-item label="内容：" prop="content" required style="width: 473px">
        <el-input v-model="form.content"></el-input>
      </el-form-item>
      <el-form-item label="价格：" prop="pirce" required style="width: 473px">
        <el-input v-model="form.pirce" type="number"></el-input>
      </el-form-item>
      <el-form-item label="创建时间：" required>
        <el-date-picker v-model="form.createTime" type="date" value-format="yyyy-MM-dd" placeholder="选择日期"
          style="width: 373px" disabled />
      </el-form-item>
      <el-form-item label="修改时间：" required>
        <el-date-picker v-model="form.updateTime" type="date" value-format="yyyy-MM-dd" placeholder="选择日期"
          style="width: 373px" />
      </el-form-item>
      <el-form-item label="备注：" prop="remark" style="width: 473px">
        <el-input v-model="form.remark" type="textarea"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="submitForm">提交</el-button>
        <el-button @click="resetForm">重置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import { mapActions } from 'vuex'
import { updatePackage, getPackageById } from '../../api/package'

export default {
  data () {
    return {
      form: {
        content: '',
        createTime: '',
        id: 0,
        pirce: 0,
        remark: '',
        title: '',
        updateTime: ''
      },
      formLoading: false,
      rules: {
        title: [
          { required: true, message: '请输入套餐名', trigger: 'blur' }
        ],
        content: [
          { required: true, message: '请输入内容', trigger: 'blur' }
        ],
        pirce: [
          { required: true, message: '请输入价格', trigger: 'blur' },
          { type: 'number', message: '价格必须为数字', trigger: 'blur' }
        ]
      }
    }
  },
  async created () {
    let id = this.$route.query.id
    let _this = this
    if (id && parseInt(id) !== 0) {
      _this.formLoading = true
      try {
        const res = await getPackageById(id)
        _this.form = res.response
      } catch (error) {
        _this.$message.error('获取数据失败')
      } finally {
        _this.formLoading = false
      }
    }
  },
  methods: {
    async submitForm () {
      let _this = this
      this.$refs['form'].validate(async (valid) => {
        if (valid) {
          _this.formLoading = true
          try {
            const data = await updatePackage(_this.form)
            if (data.code === 1) {
              _this.$message.success(data.message)
              _this.delCurrentView(_this).then(() => {
                _this.$router.push('/package/list')
              })
            } else {
              _this.$message.error(data.message)
            }
          } catch (error) {
            _this.$message.error('提交失败')
          } finally {
            _this.formLoading = false
          }
        }
      })
    },
    resetForm () {
      this.$refs['form'].resetFields()
      // Keep the original ID and createTime after reset
      const originalId = this.form.id
      const originalCreateTime = this.form.createTime
      this.form = {
        id: originalId,
        content: '',
        createTime: originalCreateTime,
        pirce: 0,
        remark: '',
        title: '',
        updateTime: ''
      }
    },
    ...mapActions('tagsView', { delCurrentView: 'delCurrentView' })
  }
}
</script>

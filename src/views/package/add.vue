<template>
  <div class="app-container">
    <el-form :model="form" ref="form" label-width="100px" v-loading="formLoading">
      <el-form-item label="套餐名：" prop="title" required>
        <el-input v-model="form.title" style="width: 473px" placeholder="请输入套餐名称"></el-input>
      </el-form-item>
      <el-form-item label="内容：" prop="content" required>
        <el-input v-model="form.content" style="width: 473px" placeholder="请输入套餐内容"></el-input>
      </el-form-item>
      <el-form-item label="价格：" prop="pirce" required>
        <el-input v-model.number="form.pirce" style="width: 473px" placeholder="请输入价格" type="number" min="0"></el-input>
      </el-form-item>
      <el-form-item label="备注：">
        <el-input v-model="form.remark" style="width: 473px" placeholder="可选备注信息" type="textarea" :rows="2"></el-input>
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
import { addNewPackage } from '../../api/package'

export default {
  data () {
    return {
      form: {
        content: '',
        pirce: null,
        remark: '',
        title: ''
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
  methods: {
    async submitForm () {
      let _this = this
      this.$refs.form.validate(async (valid) => {
        if (valid) {
          this.formLoading = true
          try {
            const res = await addNewPackage(this.form)
            if (res.code === 1) {
              _this.$message.success(res.message)
              _this.delCurrentView(_this).then(() => {
                _this.$router.push('/package/list')
              })
            } else {
              _this.$message.error(res.message)
            }
          } catch (error) {
            _this.$message.error('提交失败，请稍后重试')
          } finally {
            _this.formLoading = false
          }
        }
      })
    },
    resetForm () {
      this.$refs['form'].resetFields()
      this.form = {
        content: '',
        pirce: null,
        remark: '',
        title: ''
      }
    },
    ...mapActions('tagsView', { delCurrentView: 'delCurrentView' })
  }
}
</script>

<style scoped>
.app-container {
  padding: 20px;
}
</style>

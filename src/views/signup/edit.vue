<template>
  <div class="app-container">
    <el-form :model="form" ref="form" :rules="rules" label-width="100px" v-loading="formLoading">
      <el-form-item label="邮箱：" prop="email" required style="width: 473px">
        <el-input v-model="form.email" placeholder="邮箱"></el-input>
      </el-form-item>
      <el-form-item label="Id：" style="width: 473px">
        <el-input v-model="form.id" placeholder="Id" disabled></el-input>
      </el-form-item>
      <el-form-item label="头像路径：" style="width: 473px">
        <el-input v-model="form.imagePath" placeholder="头像路径" disabled></el-input>
      </el-form-item>
      <el-form-item label="套餐id：" style="width: 473px">
        <el-input v-model="form.packageId" placeholder="套餐id" disabled></el-input>
      </el-form-item>
      <el-form-item label="支付ID：" style="width: 473px">
        <el-input v-model="form.payId" placeholder="支付ID" disabled></el-input>
      </el-form-item>
      <el-form-item label="电话：" prop="phone" required style="width: 473px">
        <el-input v-model="form.phone" placeholder="电话"></el-input>
      </el-form-item>
      <el-form-item label="真实姓名：" prop="realName" required style="width: 473px">
        <el-input v-model="form.realName" placeholder="真实姓名"></el-input>
      </el-form-item>
      <el-form-item label="预约时间：" required>
        <el-date-picker v-model="form.reservationTime" type="datetime" value-format="yyyy-MM-dd HH:mm:ss"
          placeholder="选择日期时间" style="width: 373px" />
      </el-form-item>
      <el-form-item label="预约状态：" style="width: 473px">
        <el-select v-model="tempStatus" placeholder="请选择状态">
          <el-option label="成功" value="成功"></el-option>
          <el-option label="失败" value="失败"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="用户名：" prop="userName" required style="width: 473px">
        <el-input v-model="form.userName" placeholder="用户名"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="submitForm">提交</el-button>
        <el-button @click="resetForm">重置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import { mapGetters, mapState, mapActions } from 'vuex'
import { update, select } from '@/api/signup'

export default {
  data () {
    return {
      form: {
        email: '',
        id: 0,
        imagePath: '',
        packageId: 0,
        payId: '',
        payType: 0,
        phone: '',
        realName: '',
        reservationTime: '',
        status: '',
        userName: ''
      },
      tempStatus: '',
      formLoading: false,
      rules: {
        email: [
          { required: true, message: '请输入邮箱', trigger: 'blur' },
          { pattern: /^[A-z0-9_]+@qq\.com$/, message: '请输入正确的邮箱', trigger: 'blur' }
        ],
        phone: [
          { required: true, message: '请输入电话', trigger: 'blur' },
          { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的电话', trigger: 'blur' }
        ],
        userName: [
          { required: true, message: '请输入用户名', trigger: 'blur' }
        ],
        realName: [
          { required: true, message: '请输入真实姓名', trigger: 'blur' }
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
        const res = await select(id)
        _this.form = res.response
        _this.tempStatus = _this.formatStatus(_this.form.status)
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
      this.$refs.form.validate(async (valid) => {
        if (valid) {
          this.formLoading = true
          try {
            this.form.status = this.tempStatus === '成功' ? 1 : 0
            const res = await update(this.form)
            if (res.code === 1) {
              _this.$message.success(res.message)
              _this.delCurrentView(_this).then(() => {
                _this.$router.push('/signup/list')
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
      // Keep original ID fields when resetting
      const originalIds = {
        id: this.form.id,
        imagePath: this.form.imagePath,
        packageId: this.form.packageId,
        payId: this.form.payId
      }

      this.$refs['form'].resetFields()
      Object.assign(this.form, originalIds)
    },
    ...mapActions('tagsView', { delCurrentView: 'delCurrentView' })
  },
  computed: {
    ...mapGetters('enumItem', [
      'enumFormat'
    ]),
    ...mapState('enumItem', {
      levelEnum: state => state.user.levelEnum,
      payType: state => state.user.payType
    }),
    formatStatus () {
      return (status) => {
        return status === 1 ? '成功' : '失败'
      }
    }
  },
  watch: {
    tempStatus (newVal) {
      this.form.status = newVal === '成功' ? 1 : 0
    }
  }
}
</script>

<style scoped>
.app-container {
  padding: 20px;
}
</style>

<template>
  <div class="app-container">

    <el-form :model="form" ref="form" label-width="100px" v-loading="formLoading">
      <el-form-item label="邮箱：" required style="width: 473px">
        <el-input v-model="form.email" placeholder="邮箱"/>
      </el-form-item>
      <el-form-item label="套餐id：" required style="width: 473px">
        <el-input v-model="form.packageId" placeholder="套餐id"/>
      </el-form-item>
      <el-form-item label="支付方式：" required>
        <el-select v-model="form.payType" placeholder="支付方式" style="width: 373px">
          <el-option v-for="item in payType" :key="item.key" :value="item.key" :label="item.value"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="电话：" required style="width: 473px">
        <el-input v-model="form.phone" placeholder="电话"/>
      </el-form-item>
      <el-form-item label="真实姓名：" prop="realName" required style="width: 473px">
        <el-input v-model="form.realName" placeholder="真实姓名"/>
      </el-form-item>
      <el-form-item label="用户名：" prop="userName" required style="width: 473px">
        <el-input v-model="form.userName" placeholder="用户名"/>
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
import { add } from '@/api/signup'

export default {
  data () {
    return {
      form: {
        email: '',
        packageId: '',
        payType: '',
        phone: '',
        realName: '',
        userName: ''
      },
      formLoading: false,
      rules: {
        userName: [
          { required: true, message: '请输入用户名', trigger: 'blur' }
        ],
        realName: [
          { required: true, message: '请输入真实姓名', trigger: 'blur' }
        ]
      }
    }
  },
  created () {
  },
  methods: {
    submitForm () {
      let _this = this
      this.$refs.form.validate(async (valid) => {
        if (valid) {
          this.formLoading = true
          const res = await add(this.form)
          if (res.code === 1) {
            _this.$message.success(res.message)
            _this.delCurrentView(_this).then(() => {
              _this.$router.push('/signup/list')
            })
          } else {
            _this.$message.error(res.message)
            _this.formLoading = false
          }
        } else {
          return false
        }
      })
    },
    resetForm () {
      this.$refs['form'].resetFields()
      this.form = {
        email: '',
        packageId: '',
        payType: '',
        phone: '',
        realName: '',
        userName: ''
      }
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
    })
  }
}
</script>

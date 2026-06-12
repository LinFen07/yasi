<template>
  <div class="app-container">
    <el-form :model="form" ref="form" label-width="100px" v-loading="formLoading" :rules="rules">
      <el-form-item label="用户名：" prop="userName" required style="width: 325px">
        <el-input v-model="form.userName"></el-input>
      </el-form-item>
      <el-form-item label="密码：" required style="width: 325px">
        <el-input v-model="form.password" type="password"></el-input>
      </el-form-item>
      <el-form-item label="真实姓名：" prop="realName" required style="width: 325px">
        <el-input v-model="form.realName"></el-input>
      </el-form-item>
      <el-form-item label="身份证号：" prop="identity" style="width: 325px">
        <el-input v-model="form.identity" @blur="calculateAge"></el-input>
      </el-form-item>
      <el-form-item label="年龄：" style="width: 325px">
        <el-input v-model="form.age" disabled></el-input>
      </el-form-item>
      <el-form-item label="性别：">
        <el-select v-model="form.sex" placeholder="性别" clearable>
          <el-option v-for="item in sexEnum" :key="item.key" :value="item.key" :label="item.value"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="邮箱：" style="width: 325px">
        <el-input v-model="form.email" type="email"></el-input>
      </el-form-item>
      <el-form-item label="手机：" style="width: 325px">
        <el-input v-model="form.phone"></el-input>
      </el-form-item>
      <el-form-item label="居住城市：" style="width: 325px">
        <el-input v-model="form.address"></el-input>
      </el-form-item>
      <el-form-item label="状态：" required>
        <el-select v-model="form.status" placeholder="状态">
          <el-option v-for="item in statusEnum" :key="item.key" :value="item.key" :label="item.value"></el-option>
        </el-select>
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
import userApi from '@/api/user'

export default {
  data () {
    return {
      form: {
        id: null,
        userName: '',
        password: '',
        realName: '',
        role: 1,
        status: 1,
        age: '',
        sex: '',
        identity: '',
        email: '',
        phone: null,
        address: ''
      },
      formLoading: false,
      rules: {
        userName: [
          { required: true, message: '请输入用户名', trigger: 'blur' }
        ],
        realName: [
          { required: true, message: '请输入真实姓名', trigger: 'blur' }
        ],
        identity: [
          { required: true, message: '请输入身份证号', trigger: 'blur' },
          { pattern: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/, message: '请输入正确的身份证号', trigger: 'blur' }
        ]
      }
    }
  },
  created () {
    let id = this.$route.query.id
    let _this = this
    if (id && parseInt(id) !== 0) {
      _this.formLoading = true
      userApi.selectUser(id).then(re => {
        _this.form = re.response
        // Calculate age from ID card if it exists
        if (_this.form.identity) {
          _this.calculateAge()
        }
        _this.formLoading = false
      })
    }
  },
  methods: {
    calculateAge () {
      if (!this.form.identity) return

      // Extract birth date from ID card (15 or 18 digits)
      let birthYear, birthMonth, birthDay
      if (this.form.identity.length === 15) {
        birthYear = '19' + this.form.identity.substr(6, 2)
        birthMonth = this.form.identity.substr(8, 2)
        birthDay = this.form.identity.substr(10, 2)
      } else if (this.form.identity.length === 18) {
        birthYear = this.form.identity.substr(6, 4)
        birthMonth = this.form.identity.substr(10, 2)
        birthDay = this.form.identity.substr(12, 2)
      } else {
        return
      }

      // Calculate age
      const today = new Date()
      const birthDate = new Date(`${birthYear}-${birthMonth}-${birthDay}`)
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }

      this.form.age = age
    },
    submitForm () {
      let _this = this
      this.$refs.form.validate((valid) => {
        if (valid) {
          this.formLoading = true
          userApi.createUser(this.form).then(data => {
            if (data.code === 1) {
              _this.$message.success(data.message)
              _this.delCurrentView(_this).then(() => {
                _this.$router.push('/user/student/list')
              })
            } else {
              _this.$message.error(data.message)
              _this.formLoading = false
            }
          }).catch(e => {
            _this.formLoading = false
          })
        } else {
          return false
        }
      })
    },
    resetForm () {
      let lastId = this.form.id
      this.$refs['form'].resetFields()
      this.form = {
        id: null,
        userName: '',
        password: '',
        realName: '',
        role: 1,
        status: 1,
        age: '',
        sex: '',
        identity: '',
        email: '',
        phone: null,
        address: ''
      }
      this.form.id = lastId
    },
    ...mapActions('tagsView', { delCurrentView: 'delCurrentView' })
  },
  computed: {
    ...mapGetters('enumItem', [
      'enumFormat'
    ]),
    ...mapState('enumItem', {
      sexEnum: state => state.user.sexEnum,
      roleEnum: state => state.user.roleEnum,
      statusEnum: state => state.user.statusEnum
    })
  }
}
</script>

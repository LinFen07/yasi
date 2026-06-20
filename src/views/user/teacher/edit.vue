<template>
  <div class="app-container">
    <el-form :model="form" ref="form" label-width="100px" v-loading="formLoading" :rules="rules">
      <el-form-item label="用户名：" prop="userName" required style="width: 325px">
        <el-input v-model="form.userName" autocomplete="off" placeholder="请输入用户名"></el-input>
      </el-form-item>
      <el-form-item label="密码：" :required="!isEdit" prop="password" style="width: 325px">
        <el-input
          v-model="form.password"
          type="password"
          autocomplete="new-password"
          :placeholder="isEdit ? '不修改请留空' : '请输入密码'"
          show-password
        ></el-input>
      </el-form-item>
      <el-form-item label="真实姓名：" prop="realName" required style="width: 325px">
        <el-input v-model="form.realName"></el-input>
      </el-form-item>
      <el-form-item label="性别：">
        <el-select v-model="form.sex" placeholder="性别" clearable>
          <el-option v-for="item in sexEnum" :key="item.key" :value="item.key" :label="item.value"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="手机：" style="width: 325px">
        <el-input v-model="form.phone"></el-input>
      </el-form-item>
      <el-form-item label="状态：">
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
        role: 2, // 教师角色
        status: 1,
        sex: '',
        phone: null
      },
      formLoading: false,
      rules: {
        userName: [
          { required: true, message: '请输入用户名', trigger: 'blur' }
        ],
        realName: [
          { required: true, message: '请输入真实姓名', trigger: 'blur' }
        ],
        password: [
          {
            validator: (rule, value, callback) => {
              if (!this.isEdit && !value) {
                callback(new Error('请输入密码'))
              } else {
                callback()
              }
            },
            trigger: 'blur'
          }
        ]
      }
    }
  },
  created () {
    this.initForm()
  },
  watch: {
    '$route' () {
      this.initForm()
    }
  },
  methods: {
    getDefaultForm () {
      return {
        id: null,
        userName: '',
        password: '',
        realName: '',
        role: 2,
        status: 1,
        sex: '',
        phone: null
      }
    },
    initForm () {
      const id = this.$route.query.id
      if (id && parseInt(id) !== 0) {
        this.formLoading = true
        userApi.selectUser(id).then(re => {
          this.form = { ...re.response, password: '' }
          this.formLoading = false
          this.$nextTick(() => {
            this.$refs.form && this.$refs.form.clearValidate()
          })
        })
      } else {
        this.form = this.getDefaultForm()
        this.formLoading = false
        this.$nextTick(() => {
          this.$refs.form && this.$refs.form.resetFields()
          this.$refs.form && this.$refs.form.clearValidate()
        })
      }
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
                _this.$router.push('/user/teacher/list')
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
      const lastId = this.form.id
      this.form = this.getDefaultForm()
      this.form.id = lastId
      this.$nextTick(() => {
        this.$refs.form && this.$refs.form.clearValidate()
      })
    },
    ...mapActions('tagsView', { delCurrentView: 'delCurrentView' })
  },
  computed: {
    isEdit () {
      const id = this.$route.query.id
      return id && parseInt(id) !== 0
    },
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

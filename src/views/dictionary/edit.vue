<template>
  <div class="app-container">
    <el-form :model="form" ref="form" label-width="100px" v-loading="formLoading" :rules="rules">
      <el-form-item label="字典类型：" prop="dictType" required style="width: 325px">
        <el-input v-model="form.dictType" placeholder="请输入字典类型"></el-input>
      </el-form-item>
      <el-form-item label="字典键：" prop="dictKey" required style="width: 325px">
        <el-input v-model="form.dictKey" placeholder="请输入字典键"></el-input>
      </el-form-item>
      <el-form-item label="字典值：" prop="dictValue" required style="width: 325px">
        <el-input v-model="form.dictValue" placeholder="请输入字典值"></el-input>
      </el-form-item>
      <el-form-item label="排序：" style="width: 325px">
        <el-input-number v-model="form.sort" :min="0" :max="999" style="width: 100%"></el-input-number>
      </el-form-item>
      <el-form-item label="状态：" required>
        <el-select v-model="form.status" placeholder="状态">
          <el-option :value="1" label="启用"></el-option>
          <el-option :value="0" label="禁用"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="描述：" style="width: 500px">
        <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入描述"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="submitForm">提交</el-button>
        <el-button @click="resetForm">重置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import dictionaryApi from '@/api/dictionary'

export default {
  name: 'DictionaryEdit',
  data () {
    return {
      form: {
        id: null,
        dictType: '',
        dictKey: '',
        dictValue: '',
        sort: 0,
        status: 1,
        description: ''
      },
      formLoading: false,
      rules: {
        dictType: [
          { required: true, message: '请输入字典类型', trigger: 'blur' }
        ],
        dictKey: [
          { required: true, message: '请输入字典键', trigger: 'blur' }
        ],
        dictValue: [
          { required: true, message: '请输入字典值', trigger: 'blur' }
        ]
      }
    }
  },
  created () {
    let id = this.$route.query.id
    let _this = this
    if (id && parseInt(id) !== 0) {
      _this.formLoading = true
      dictionaryApi.findById(id).then(res => {
        if (res.code === 1) {
          _this.form = res.response
        } else {
          _this.$message.error(res.message || '获取字典信息失败')
        }
        _this.formLoading = false
      }).catch(() => {
        _this.formLoading = false
        _this.$message.error('获取字典信息失败')
      })
    }
  },
  methods: {
    submitForm () {
      let _this = this
      this.$refs.form.validate((valid) => {
        if (valid) {
          this.formLoading = true
          dictionaryApi.update(this.form).then(data => {
            if (data.code === 1) {
              _this.$message.success(data.message || '更新成功')
              _this.$router.push('/dictionary/list')
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
        dictType: '',
        dictKey: '',
        dictValue: '',
        sort: 0,
        status: 1,
        description: ''
      }
      this.form.id = lastId
    }
  }
}
</script>

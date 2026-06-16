<template>
  <div class="login-container">
    <div class="login-card">
      <div class="logo-container">
        <img src="@/assets/zklogo.png" alt="Logo" class="logo">
      </div>

      <div class="title-container">
        <h3 class="title">仲燕英语语言能力测试平台</h3>
      </div>

      <el-form ref="loginForm" :model="loginForm" :rules="loginRules" class="login-form" auto-complete="on" label-position="left">
        <el-form-item prop="userName">
          <span class="svg-container">
            <svg-icon icon-class="user" />
          </span>
          <el-input
            ref="userName"
            v-model="loginForm.userName"
            placeholder="用户名"
            name="userName"
            type="text"
            tabindex="1"
            auto-complete="on"
          />
        </el-form-item>

        <el-tooltip v-model="capsTooltip" content="Caps lock is On" placement="right" manual>
          <el-form-item prop="password">
            <span class="svg-container">
              <svg-icon icon-class="password" />
            </span>
            <el-input
              :key="passwordType"
              ref="password"
              v-model="loginForm.password"
              :type="passwordType"
              placeholder="密码"
              name="password"
              tabindex="2"
              auto-complete="on"
              @keyup.native="checkCapslock"
              @blur="capsTooltip = false"
              @keyup.enter.native="handleLogin"
            />
            <span class="show-pwd" @click="showPwd">
              <svg-icon :icon-class="passwordType === 'password' ? 'eye' : 'eye-open'" />
            </span>
          </el-form-item>
        </el-tooltip>

        <el-checkbox v-model="loginForm.remember" style="margin-bottom: 20px;margin-left: 5px;">记住密码</el-checkbox>

        <el-button :loading="loading" type="primary" style="width:100%;height:45px;font-size:16px;margin-bottom:20px;" @click.native.prevent="handleLogin">登录</el-button>
      </el-form>
    </div>

    <div class="account-foot-copyright">
      <span style="color: #777;">仲恺农业工程学院 北京燕兴国际教育咨询有限公司 版权所有</span>
    </div>
  </div>
</template>

<script>
import { mapMutations } from 'vuex'
import loginApi from '@/api/login'

export default {
  name: 'Login',
  data () {
    const validatePassword = (rule, value, callback) => {
      if (value.length < 5) {
        callback(new Error('密码不能少于5个字符'))
      } else {
        callback()
      }
    }
    return {
      loginForm: {
        userName: '',
        password: '',
        remember: false
      },
      loginRules: {
        userName: [{ required: true, message: '用户名不能为空', trigger: 'blur' }],
        password: [{ required: true, trigger: 'blur', validator: validatePassword }]
      },
      passwordType: 'password',
      capsTooltip: false,
      loading: false,
      showDialog: false
    }
  },
  created () {
    // window.addEventListener('storage', this.afterQRScan)
  },
  mounted () {
    if (this.loginForm.userName === '') {
      this.$refs.userName.focus()
    } else if (this.loginForm.password === '') {
      this.$refs.password.focus()
    }
  },
  destroyed () {
    // window.removeEventListener('storage', this.afterQRScan)
  },
  methods: {
    checkCapslock ({ shiftKey, key } = {}) {
      if (key && key.length === 1) {
        // eslint-disable-next-line no-mixed-operators
        if (shiftKey && (key >= 'a' && key <= 'z') || !shiftKey && (key >= 'A' && key <= 'Z')) {
          this.capsTooltip = true
        } else {
          this.capsTooltip = false
        }
      }
      if (key === 'CapsLock' && this.capsTooltip === true) {
        this.capsTooltip = false
      }
    },
    showPwd () {
      if (this.passwordType === 'password') {
        this.passwordType = ''
      } else {
        this.passwordType = 'password'
      }
      this.$nextTick(() => {
        this.$refs.password.focus()
      })
    },
    handleLogin () {
      let _this = this
      this.$refs.loginForm.validate(valid => {
        if (valid) {
          this.loading = true
          loginApi.login(this.loginForm).then(function (result) {
            if (result && result.code === 1) {
              _this.setUserName(_this.loginForm.userName)
              _this.$router.push({ path: '/dashboard' })
            } else {
              _this.loading = false
              _this.$message({
                message: result.message,
                type: 'error'
              })
            }
          }).catch(function (reason) {
            _this.loading = false
          })
        } else {
          return false
          // _this.$router.push({ path: '/login' })
        }
      })
    },
    ...mapMutations('user', ['setUserName'])
  }
}
</script>

<style rel="stylesheet/scss" lang="scss">
/* 修复input 背景不协调 和光标变色 */
$bg:#f0f8ff;
$light_gray:#333;
$cursor: #333;

@supports (-webkit-mask: none) and (not (cater-color: $cursor)) {
  .login-container .el-input input {
    color: $cursor;
  }
}

/* reset element-ui css */
.login-container {
  .el-input {
    display: inline-block;
    height: 47px;
    width: 100%;

    input {
      background: #f0f8ff;
      border: 1px solid #e1e8ed;
      -webkit-appearance: none;
      appearance: none;
      // border-radius: 4px;
      padding: 12px 45px 12px 45px;
      color: $light_gray;
      height: 47px;
      caret-color: $cursor;
      width: 100%;

      &:-webkit-autofill {
        box-shadow: 0 0 0px 1000px $bg inset !important;
        -webkit-text-fill-color: $cursor !important;
      }

      &:focus {
        border-color: #409eff;
        outline: none;
      }
    }
  }

  .el-form-item {
    border: none;
    background: transparent;
    border-radius: 5px;
    color: #454545;
    margin-bottom: 30px;
    position: relative;
  }
}
</style>

<style lang="scss" scoped>
$light_blue:#5daff0;
$dark_gray:#666;
$light_gray:#333;

.login-container {
  min-height: 90vh;
  width: 100%;
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  overflow: hidden;

  .login-card {
    position: relative;
    width: 450px;
    max-width: 90%;
    padding: 80px 50px 40px 50px;
    background: #ffffff;
    border-radius: 5px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    margin-bottom: 40px;
  }

  .logo-container {
    position: absolute;
    top: -60px;
    left: 50%;
    transform: translateX(-50%);

    .logo {
      width: 110px;
      height: 110px;
      border-radius: 50%;
      background: #ffffff;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      object-fit: cover;
    }
  }

  .title-container {
    text-align: center;
    margin-bottom: 30px;

    .title {
      font-size: 22px;
      color: rgb(126, 207, 235);
      margin: 0;
      font-weight: 600;
      line-height: 1.4;
    }
  }

  .login-form {
    width: 100%;
  }  .svg-container {
    position: absolute;
    left: 15px;
    top: 15px;
    color: $dark_gray;
    width: 16px;
    height: 16px;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .show-pwd {
    position: absolute;
    right: 15px;
    top: 12px;
    font-size: 16px;
    color: $dark_gray;
    cursor: pointer;
    user-select: none;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
  }
  .account-foot-copyright {
    position: fixed;
    bottom: 20px;
    // left: 0;
    right: 0;
    // color: #666;
    text-align: center;
    color: #999;
    font-size: 12px;
    padding: 0 20px;

    span {
      line-height: 1.4;
    }
  }

  @media only screen and (max-width: 500px) {
    .login-card {
      width: 95%;
      padding: 80px 30px 40px 30px;
    }

    .title-container .title {
      font-size: 18px;
    }
  }
}
</style>

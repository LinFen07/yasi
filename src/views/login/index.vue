<template>
  <div class="login-container">
    <div class="login-bg">
      <div class="login-bg__gradient" />
      <div class="login-bg__orb login-bg__orb--1" />
      <div class="login-bg__orb login-bg__orb--2" />
      <div class="login-bg__orb login-bg__orb--3" />
      <div class="login-bg__grid" />
    </div>

    <div class="login-content">
      <div class="login-card">
        <div class="login-card__header">
          <div class="logo-wrap">
            <img src="@/assets/zklogo.png" alt="Logo" class="logo">
          </div>
          <h3 class="title">仲燕英语语言能力测试平台</h3>
          <p class="subtitle">欢迎登录管理后台</p>
        </div>

        <el-form ref="loginForm" :model="loginForm" :rules="loginRules" class="login-form" auto-complete="on" label-position="left">
          <el-form-item prop="userName">
            <span class="svg-container">
              <svg-icon icon-class="user" />
            </span>
            <el-input
              ref="loginUserName"
              v-model="loginForm.userName"
              placeholder="用户名"
              name="userName"
              type="text"
              tabindex="1"
              autocomplete="username"
              @input="clearFieldValidate('userName')"
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
                autocomplete="current-password"
                @input="clearFieldValidate('password')"
                @keyup.native="checkCapslock"
                @blur="capsTooltip = false"
                @keyup.enter.native="handleLogin"
              />
              <span class="show-pwd" @click="showPwd">
                <svg-icon :icon-class="passwordType === 'password' ? 'eye' : 'eye-open'" />
              </span>
            </el-form-item>
          </el-tooltip>

          <el-checkbox v-model="loginForm.remember" class="remember-check">记住密码</el-checkbox>

          <el-button
            :loading="loading"
            class="login-btn"
            @click.native.prevent="handleLogin"
          >登录</el-button>
        </el-form>
      </div>
    </div>

    <div class="account-foot-copyright">
      <span>仲恺农业工程学院 北京燕兴国际教育咨询有限公司 版权所有</span>
    </div>
  </div>
</template>

<script>
import { mapMutations } from 'vuex'
import loginApi from '@/api/login'

export default {
  name: 'Login',
  data () {
    const validateUserName = (rule, value, callback) => {
      const name = (value || '').trim()
      if (!name) {
        callback(new Error('用户名不能为空'))
      } else {
        callback()
      }
    }
    const validatePassword = (rule, value, callback) => {
      const pwd = value || ''
      if (!pwd) {
        callback(new Error('密码不能为空'))
      } else if (pwd.length < 5) {
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
        userName: [{ required: true, trigger: 'blur', validator: validateUserName }],
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
    this.syncAutofill()
    setTimeout(() => this.syncAutofill(), 300)
    if (this.loginForm.userName === '') {
      this.$refs.loginUserName && this.$refs.loginUserName.focus()
    } else if (this.loginForm.password === '') {
      this.$refs.password && this.$refs.password.focus()
    }
  },
  destroyed () {
    // window.removeEventListener('storage', this.afterQRScan)
  },
  methods: {
    getNativeInput (refName) {
      const ref = this.$refs[refName]
      if (!ref || !ref.$el) return null
      return ref.$el.querySelector('input')
    },
    syncAutofill () {
      const userInput = this.getNativeInput('loginUserName')
      const pwdInput = this.getNativeInput('password')
      if (userInput && userInput.value && userInput.value !== this.loginForm.userName) {
        this.loginForm.userName = userInput.value
      }
      if (pwdInput && pwdInput.value && pwdInput.value !== this.loginForm.password) {
        this.loginForm.password = pwdInput.value
      }
      if (this.loginForm.userName || this.loginForm.password) {
        this.$refs.loginForm && this.$refs.loginForm.clearValidate()
      }
    },
    clearFieldValidate (field) {
      this.$refs.loginForm && this.$refs.loginForm.clearValidate(field)
    },
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
      this.syncAutofill()
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
        }
      })
    },
    ...mapMutations('user', ['setUserName'])
  }
}
</script>

<style rel="stylesheet/scss" lang="scss">
@import "~@/styles/variables.scss";

$input-bg: #f5f6fa;
$input-text: #303133;
$input-border: rgba(102, 126, 234, 0.12);

@supports (-webkit-mask: none) and (not (cater-color: $input-text)) {
  .login-container .el-input input {
    color: $input-text;
  }
}

.login-container {
  .el-input {
    display: inline-block;
    height: 48px;
    width: 100%;

    input {
      background: $input-bg;
      border: 1px solid $input-border;
      border-radius: 12px;
      -webkit-appearance: none;
      appearance: none;
      padding: 12px 44px 12px 44px;
      color: $input-text;
      height: 48px;
      caret-color: $primaryStart;
      width: 100%;
      transition: all 0.25s;

      &:-webkit-autofill {
        box-shadow: 0 0 0 1000px $input-bg inset !important;
        -webkit-text-fill-color: $input-text !important;
      }

      &:focus {
        border-color: rgba(102, 126, 234, 0.55);
        background: #fff;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.12);
        outline: none;
      }

      &::placeholder {
        color: #b0b8cc;
      }
    }
  }

  .el-form-item {
    border: none;
    background: transparent;
    color: #454545;
    margin-bottom: 22px;
    position: relative;
  }

  .remember-check {
    margin-bottom: 24px;
    margin-left: 4px;

    .el-checkbox__label {
      color: #5a607a;
      font-size: 13px;
    }

    .el-checkbox__input.is-checked .el-checkbox__inner {
      background-color: $primaryStart;
      border-color: $primaryStart;
    }

    .el-checkbox__input.is-checked + .el-checkbox__label {
      color: $primaryStart;
    }
  }

  .login-btn {
    width: 100%;
    height: 48px;
    font-size: 16px;
    font-weight: 600;
    letter-spacing: 2px;
    border: none;
    border-radius: 12px;
    color: #fff;
    background: $primaryGradient;
    box-shadow: 0 8px 24px rgba(102, 126, 234, 0.35);
    transition: all 0.28s;

    &:hover,
    &:focus {
      background: linear-gradient(135deg, #7589f0 0%, #8559b5 100%);
      box-shadow: 0 12px 28px rgba(102, 126, 234, 0.45);
    }

    &.is-loading {
      opacity: 0.85;
    }
  }
}
</style>

<style lang="scss" scoped>
@import "~@/styles/variables.scss";

.login-container {
  position: relative;
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.login-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;

  &__gradient {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 15% 20%, rgba(102, 126, 234, 0.35) 0%, transparent 42%),
      radial-gradient(circle at 85% 75%, rgba(118, 75, 162, 0.28) 0%, transparent 40%),
      radial-gradient(circle at 60% 10%, rgba(56, 239, 125, 0.08) 0%, transparent 30%),
      linear-gradient(135deg, #1a1f30 0%, #222738 45%, #2a3048 100%);
  }

  &__grid {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
    background-size: 48px 48px;
    mask-image: radial-gradient(ellipse at center, black 30%, transparent 75%);
  }

  &__orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(60px);
    pointer-events: none;
    animation: float 8s ease-in-out infinite;

    &--1 {
      width: 320px;
      height: 320px;
      top: -80px;
      left: -60px;
      background: rgba(102, 126, 234, 0.35);
    }

    &--2 {
      width: 280px;
      height: 280px;
      bottom: -60px;
      right: -40px;
      background: rgba(118, 75, 162, 0.3);
      animation-delay: -3s;
    }

    &--3 {
      width: 180px;
      height: 180px;
      top: 40%;
      right: 15%;
      background: rgba(102, 126, 234, 0.2);
      animation-delay: -5s;
    }
  }
}

@keyframes float {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(12px, -16px); }
}

.login-content {
  position: relative;
  z-index: 1;
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 40px 20px 80px;
}

.login-card {
  width: 440px;
  max-width: 100%;
  padding: 36px 40px 32px;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow:
    0 24px 64px rgba(15, 23, 42, 0.35),
    0 0 0 1px rgba(102, 126, 234, 0.08);
  animation: cardIn 0.6s ease-out;

  &__header {
    text-align: center;
    margin-bottom: 28px;
  }
}

@keyframes cardIn {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.logo-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 88px;
  height: 88px;
  margin-bottom: 16px;
  border-radius: 50%;
  background: #fff;
  box-shadow:
    0 8px 24px rgba(102, 126, 234, 0.2),
    0 0 0 4px rgba(102, 126, 234, 0.08);

  .logo {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    object-fit: cover;
  }
}

.title {
  margin: 0 0 8px;
  font-size: 21px;
  font-weight: 700;
  line-height: 1.4;
  background: $primaryGradient;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  margin: 0;
  font-size: 13px;
  color: $headerTextMuted;
  letter-spacing: 0.5px;
}

.login-form {
  width: 100%;
}

.svg-container {
  position: absolute;
  left: 16px;
  top: 16px;
  color: $primaryStart;
  width: 16px;
  height: 16px;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
}

.show-pwd {
  position: absolute;
  right: 16px;
  top: 14px;
  font-size: 16px;
  color: $headerTextMuted;
  cursor: pointer;
  user-select: none;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  transition: color 0.2s;

  &:hover {
    color: $primaryStart;
  }
}

.account-foot-copyright {
  position: fixed;
  bottom: 20px;
  left: 50%;
  right: auto;
  transform: translateX(-50%);
  z-index: 1;
  width: auto;
  max-width: calc(100% - 40px);
  text-align: center;
  font-size: 12px;
  padding: 0 20px;
  box-sizing: border-box;

  span {
    display: inline-block;
    line-height: 1.5;
    color: rgba(200, 205, 224, 0.65);
    white-space: nowrap;
  }
}

@media only screen and (max-width: 500px) {
  .login-card {
    padding: 28px 24px 24px;
    border-radius: 16px;
  }

  .title {
    font-size: 18px;
  }

  .logo-wrap {
    width: 76px;
    height: 76px;

    .logo {
      width: 62px;
      height: 62px;
    }
  }

  .account-foot-copyright span {
    white-space: normal;
  }
}
</style>

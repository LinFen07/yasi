<template>
  <div class="navbar">
    <hamburger id="hamburger-container" :is-active="sidebar.opened" class="hamburger-container"
      @toggleClick="toggleSideBar" />

    <breadcrumb id="breadcrumb-container" class="breadcrumb-container" />

    <div class="right-menu">
      <el-dropdown
        class="avatar-container right-menu-item hover-effect"
        trigger="click"
        placement="bottom-end"
        popper-class="user-dropdown-popper"
      >
        <div class="avatar-wrapper">
          <span class="user-avatar">{{ userInitial }}</span>
          <span class="user-name">{{ userName }}</span>
          <i class="el-icon-arrow-down user-arrow" />
        </div>
        <el-dropdown-menu slot="dropdown" class="user-dropdown-menu">
          <el-dropdown-item class="logout-item" @click.native="logout">
            <i class="el-icon-switch-button logout-icon" />
            <span>退出登录</span>
          </el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex'
import loginApi from '@/api/login'
import Breadcrumb from '@/components/Breadcrumb'
import Hamburger from '@/components/Hamburger'

export default {
  components: {
    Breadcrumb,
    Hamburger
  },
  computed: {
    ...mapGetters([
      'sidebar',
      'device',
      'userName'
    ]),
    userInitial () {
      const name = (this.userName || '').trim()
      return name ? name.charAt(0).toUpperCase() : 'U'
    }
  },
  methods: {
    toggleSideBar () {
      this.$store.dispatch('app/toggleSideBar')
    },
    logout () {
      loginApi.logout().finally(() => {
        this.clearLogin()
        this.$router.replace({ path: '/login' })
      })
    },
    ...mapMutations('user', ['clearLogin'])
  }
}
</script>

<style lang="scss" scoped>
@import "~@/styles/variables.scss";

.navbar {
  height: 50px;
  overflow: hidden;
  position: relative;
  background: transparent;

  .hamburger-container {
    line-height: 46px;
    height: 100%;
    float: left;
    cursor: pointer;
    transition: all .25s;
    border-radius: 8px;
    margin: 0 4px 0 8px;
    -webkit-tap-highlight-color: transparent;

    ::v-deep .hamburger {
      fill: $headerText;
      transition: fill .25s;
    }

    &:hover {
      background: rgba(102, 126, 234, 0.08);

      ::v-deep .hamburger {
        fill: $primaryStart;
      }
    }
  }

  .breadcrumb-container {
    float: left;
  }

  .right-menu {
    float: right;
    height: 100%;
    line-height: 50px;
    padding-right: 16px;

    &:focus {
      outline: none;
    }

    .right-menu-item {
      display: inline-block;
      padding: 0 8px;
      height: 100%;
      font-size: 18px;
      color: $headerText;
      vertical-align: text-bottom;

      &.hover-effect {
        cursor: pointer;
        transition: all .25s;

        &:hover {
          background: transparent;
        }
      }
    }

    .avatar-container {
      margin-right: 8px;

      .avatar-wrapper {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 5px 12px 5px 5px;
        border-radius: 24px;
        background: $headerBgSoft;
        border: 1px solid $headerBorder;
        transition: all .25s;
        line-height: 1;

        .user-avatar {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: $primaryGradient;
          color: #fff;
          font-size: 13px;
          font-weight: 600;
          flex-shrink: 0;
          box-shadow: 0 2px 6px rgba(102, 126, 234, 0.35);
        }

        .user-name {
          font-size: 13px;
          font-weight: 500;
          color: $headerText;
          max-width: 80px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .user-arrow {
          font-size: 12px;
          color: $headerTextMuted;
          transition: transform .25s;
        }

        &:hover {
          border-color: rgba(102, 126, 234, 0.35);
          background: rgba(102, 126, 234, 0.06);
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.12);

          .user-arrow {
            color: $primaryStart;
          }
        }
      }
    }
  }
}
</style>

<style lang="scss">
@import "~@/styles/variables.scss";

.user-dropdown-popper {
  margin-top: 8px !important;
  padding: 0 !important;
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;

  .popper__arrow {
    display: none;
  }

  .user-dropdown-menu {
    min-width: 140px;
    padding: 6px;
    border-radius: 12px;
    border: 1px solid $headerBorder;
    box-shadow: 0 8px 24px rgba(35, 40, 56, 0.12);
    background: #fff;

    .logout-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      color: $headerText;
      line-height: 1;
      transition: all .2s;

      .logout-icon {
        font-size: 15px;
        color: $primaryStart;
      }

      &:hover {
        background: rgba(102, 126, 234, 0.08);
        color: $primaryStart;
      }
    }
  }
}
</style>

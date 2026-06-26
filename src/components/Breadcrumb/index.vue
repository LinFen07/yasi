<template>
  <el-breadcrumb class="app-breadcrumb" separator-class="el-icon-arrow-right">
    <transition-group name="breadcrumb">
      <el-breadcrumb-item v-for="(item,index) in levelList" :key="item.path">
        <span class="breadcrumb-item-inner">
          <svg-icon
            v-if="getIcon(item)"
            :icon-class="getIcon(item)"
            class="breadcrumb-icon"
          />
          <span
            v-if="item.redirect==='noRedirect'||index==levelList.length-1"
            class="no-redirect"
          >{{ item.meta.title }}</span>
          <a v-else @click.prevent="handleLink(item)">{{ item.meta.title }}</a>
        </span>
      </el-breadcrumb-item>
    </transition-group>
  </el-breadcrumb>
</template>

<script>
import * as pathToRegexp from 'path-to-regexp'

export default {
  data () {
    return {
      levelList: null
    }
  },
  watch: {
    $route (route) {
      if (route.path.startsWith('/redirect/')) {
        return
      }
      this.getBreadcrumb()
    }
  },
  created () {
    this.getBreadcrumb()
  },
  methods: {
    getBreadcrumb () {
      let matched = this.$route.matched.filter(item => item.meta && item.meta.title)
      const first = matched[0]

      if (!this.isDashboard(first)) {
        matched = [{ path: '/dashboard', meta: { title: '主页', icon: 'home' } }].concat(matched)
      }
      this.levelList = matched.filter(item => item.meta && item.meta.title && item.meta.breadcrumb !== false)
    },
    isDashboard (route) {
      const name = route && route.name
      if (!name) {
        return false
      }
      return name.trim().toLocaleLowerCase() === 'Dashboard'.toLocaleLowerCase()
    },
    getIcon (item) {
      if (item.meta && item.meta.icon) {
        return item.meta.icon
      }
      if (this.isDashboard(item)) {
        return 'home'
      }
      return null
    },
    pathCompile (path) {
      const { params } = this.$route
      var toPath = pathToRegexp.compile(path)
      return toPath(params)
    },
    handleLink (item) {
      const { redirect, path } = item
      if (redirect) {
        this.$router.push(redirect)
        return
      }
      this.$router.push(this.pathCompile(path))
    }
  }
}
</script>

<style lang="scss" scoped>
@import "~@/styles/variables.scss";

.app-breadcrumb.el-breadcrumb {
  display: inline-block;
  font-size: 14px;
  line-height: 50px;
  margin-left: 4px;

  ::v-deep .el-breadcrumb__separator {
    color: $headerTextMuted;
    font-weight: 400;
    margin: 0 6px;
  }

  .breadcrumb-item-inner {
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }

  .breadcrumb-icon {
    font-size: 15px;
    color: $primaryStart;
    flex-shrink: 0;
  }

  a {
    color: $headerText;
    font-weight: 500;
    transition: color 0.2s;

    &:hover {
      color: $primaryStart;
    }
  }

  .no-redirect {
    color: $primaryEnd;
    cursor: text;
    font-weight: 600;
  }
}
</style>

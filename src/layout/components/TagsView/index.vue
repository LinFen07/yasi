<template>
  <div id="tags-view-container" class="tags-view-container">
    <scroll-pane ref="scrollPane" class="tags-view-wrapper">
      <router-link
        v-for="tag in visitedViews"
        ref="tag"
        :key="tag.path"
        :class="isActive(tag)?'active':''"
        :to="{ path: tag.path, query: tag.query, fullPath: tag.fullPath }"
        tag="span"
        class="tags-view-item"
        @click.middle.native="closeSelectedTag(tag)"
        @contextmenu.prevent.native="openMenu(tag,$event)"
      >
        <svg-icon
          v-if="tag.meta && tag.meta.icon"
          :icon-class="tag.meta.icon"
          class="tag-icon"
        />
        <span class="tag-title">{{ tag.title }}</span>
        <span v-if="!tag.meta.affix" class="el-icon-close" @click.prevent.stop="closeSelectedTag(tag)" />
      </router-link>
    </scroll-pane>
    <ul v-show="visible" :style="{left:left+'px',top:top+'px'}" class="contextmenu">
      <li @click="refreshSelectedTag(selectedTag)">刷新</li>
      <li v-if="!(selectedTag.meta&&selectedTag.meta.affix)" @click="closeSelectedTag(selectedTag)">关闭</li>
      <li @click="closeOthersTags">关闭其他</li>
      <li @click="closeAllTags(selectedTag)">关闭全部</li>
    </ul>
  </div>
</template>

<script>
import ScrollPane from './ScrollPane'
import path from 'path'
import { mapGetters } from 'vuex'

export default {
  components: { ScrollPane },
  data () {
    return {
      visible: false,
      top: 0,
      left: 0,
      selectedTag: {},
      affixTags: []
    }
  },
  computed: {
    visitedViews () {
      return this.$store.state.tagsView.visitedViews
    },
    ...mapGetters([
      'routes'
    ])
  },
  watch: {
    $route () {
      this.addTags()
      this.moveToCurrentTag()
    },
    visible (value) {
      if (value) {
        document.body.addEventListener('click', this.closeMenu)
      } else {
        document.body.removeEventListener('click', this.closeMenu)
      }
    }
  },
  mounted () {
    this.initTags()
    this.addTags()
  },
  methods: {
    isActive (route) {
      return route.path === this.$route.path
    },
    filterAffixTags (routes, basePath = '/') {
      let tags = []
      routes.forEach(route => {
        if (route.meta && route.meta.affix) {
          const tagPath = path.resolve(basePath, route.path)
          tags.push({
            fullPath: tagPath,
            path: tagPath,
            name: route.name,
            meta: { ...route.meta }
          })
        }
        if (route.children) {
          const tempTags = this.filterAffixTags(route.children, route.path)
          if (tempTags.length >= 1) {
            tags = [...tags, ...tempTags]
          }
        }
      })
      return tags
    },
    initTags () {
      const affixTags = this.affixTags = this.filterAffixTags(this.routes)
      for (const tag of affixTags) {
        // Must have tag name
        if (tag.name) {
          this.$store.dispatch('tagsView/addVisitedView', tag)
        }
      }
    },
    addTags () {
      const { name } = this.$route
      if (name) {
        this.$store.dispatch('tagsView/addView', this.$route)
      }
      return false
    },
    moveToCurrentTag () {
      const tags = this.$refs.tag
      this.$nextTick(() => {
        for (const tag of tags) {
          if (tag.to.path === this.$route.path) {
            this.$refs.scrollPane.moveToTarget(tag)
            // when query is different then update
            if (tag.to.fullPath !== this.$route.fullPath) {
              this.$store.dispatch('tagsView/updateVisitedView', this.$route)
            }
            break
          }
        }
      })
    },
    refreshSelectedTag (view) {
      this.$store.dispatch('tagsView/delCachedView', view).then(() => {
        const { fullPath } = view
        this.$nextTick(() => {
          this.$router.replace({
            path: '/redirect' + fullPath
          })
        })
      })
    },
    closeSelectedTag (view) {
      this.$store.dispatch('tagsView/delView', view).then(({ visitedViews }) => {
        if (this.isActive(view)) {
          this.toLastView(visitedViews, view)
        }
      })
    },
    closeOthersTags () {
      if (this.$route.fullPath !== this.selectedTag.fullPath) {
        this.$router.push(this.selectedTag)
      }
      this.$store.dispatch('tagsView/delOthersViews', this.selectedTag).then(() => {
        this.moveToCurrentTag()
      })
    },
    closeAllTags (view) {
      this.$store.dispatch('tagsView/delAllViews').then(({ visitedViews }) => {
        if (this.affixTags.some(tag => tag.path === view.path)) {
          return
        }
        this.toLastView(visitedViews, view)
      })
    },
    toLastView (visitedViews, view) {
      const latestView = visitedViews.slice(-1)[0]
      if (latestView) {
        this.$router.push(latestView)
      } else {
        // now the default is to redirect to the home page if there is no tags-view,
        // you can adjust it according to your needs.
        if (view.name === 'Dashboard') {
          // to reload home page
          this.$router.replace({ path: '/redirect' + view.fullPath })
        } else {
          this.$router.push('/')
        }
      }
    },
    openMenu (tag, e) {
      const menuMinWidth = 105
      const offsetLeft = this.$el.getBoundingClientRect().left // container margin left
      const offsetWidth = this.$el.offsetWidth // container width
      const maxLeft = offsetWidth - menuMinWidth // left boundary
      const left = e.clientX - offsetLeft + 15 // 15: margin right

      if (left > maxLeft) {
        this.left = maxLeft
      } else {
        this.left = left
      }

      this.top = e.clientY
      this.visible = true
      this.selectedTag = tag
    },
    closeMenu () {
      this.visible = false
    }
  }
}
</script>

<style lang="scss" scoped>
@import "~@/styles/variables.scss";

.tags-view-container {
  height: 34px;
  width: 100%;
  background: $headerBgSoft;
  border-bottom: 1px solid $headerBorder;

  .tags-view-wrapper {
    .tags-view-item {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      position: relative;
      cursor: pointer;
      height: 26px;
      line-height: 1;
      border: 1px solid rgba(102, 126, 234, 0.12);
      color: $headerText;
      background: #fff;
      padding: 0 10px;
      font-size: 12px;
      border-radius: 13px;
      margin-left: 6px;
      margin-top: 4px;
      transition: all .25s;
      box-shadow: 0 1px 3px rgba(35, 40, 56, 0.04);

      .tag-icon {
        font-size: 13px;
        color: $primaryStart;
        flex-shrink: 0;
      }

      .tag-title {
        max-width: 120px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      &:first-of-type {
        margin-left: 12px;
      }

      &:last-of-type {
        margin-right: 12px;
      }

      &:hover {
        border-color: rgba(102, 126, 234, 0.3);
        color: $primaryStart;
        box-shadow: 0 2px 8px rgba(102, 126, 234, 0.12);
      }

      &.active {
        background: $primaryGradient;
        color: #fff;
        border-color: transparent;
        box-shadow: 0 3px 10px rgba(102, 126, 234, 0.35);

        .tag-icon {
          color: rgba(255, 255, 255, 0.95);
        }
      }
    }
  }

  .contextmenu {
    margin: 0;
    background: #fff;
    z-index: 3000;
    position: absolute;
    list-style-type: none;
    padding: 6px 0;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 400;
    color: #333;
    border: 1px solid $headerBorder;
    box-shadow: 0 4px 16px rgba(35, 40, 56, 0.12);

    li {
      margin: 0;
      padding: 8px 18px;
      cursor: pointer;
      transition: background .2s;

      &:hover {
        background: rgba(102, 126, 234, 0.08);
        color: $primaryStart;
      }
    }
  }
}
</style>

<style lang="scss">
@import "~@/styles/variables.scss";

.tags-view-wrapper {
  .tags-view-item {
    .el-icon-close {
      width: 16px;
      height: 16px;
      vertical-align: middle;
      border-radius: 50%;
      text-align: center;
      transition: all .25s;
      transform-origin: 100% 50%;
      margin-left: 2px;

      &:before {
        transform: scale(.6);
        display: inline-block;
        vertical-align: -3px;
      }

      &:hover {
        background-color: rgba(0, 0, 0, 0.12);
        color: inherit;
      }
    }

    &.active .el-icon-close:hover {
      background-color: rgba(255, 255, 255, 0.25);
      color: #fff;
    }
  }
}
</style>

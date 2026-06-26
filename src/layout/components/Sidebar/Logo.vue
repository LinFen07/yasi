<template>
  <div class="sidebar-logo-container" :class="{'collapse':collapse}">
    <transition name="sidebarLogoFade">
      <div v-if="collapse" key="collapse" class="sidebar-logo-link" @click="handleLogoClick">
        <img src="@/assets/logoimage.png" class="sidebar-logo sidebar-logo--mini" alt="logo">
      </div>
      <div v-else key="expand" class="sidebar-logo-link" @click="handleLogoClick">
        <img src="@/assets/logoimage.png" class="sidebar-logo" alt="logo">
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  name: 'SidebarLogo',
  props: {
    collapse: {
      type: Boolean,
      required: true
    }
  },
  methods: {
    handleLogoClick () {
      if (this.$route.path !== '/dashboard') {
        this.$router.push('/dashboard')
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.sidebarLogoFade-enter-active {
  transition: opacity 1.5s;
}

.sidebarLogoFade-enter,
.sidebarLogoFade-leave-to {
  opacity: 0;
}

.sidebar-logo-container {
  position: relative;
  width: 100%;
  height: 84px;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.28) 0%, rgba(118, 75, 162, 0.12) 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  z-index: 2;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.08) 0%, transparent 70%);
    pointer-events: none;
  }

  .sidebar-logo-link {
    position: relative;
    z-index: 1;
    height: 100%;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 2px;
    overflow: hidden;
    cursor: pointer;
    box-sizing: border-box;
  }

  .sidebar-logo {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center;
    transform: translateY(-6.5px);
    filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.18));
  }

  .sidebar-logo--mini {
    width: 40px;
    height: 40px;
    object-fit: contain;
  }

  &.collapse {
    .sidebar-logo-link {
      align-items: center;
      padding: 0;
    }

    .sidebar-logo--mini {
      transform: none;
    }
  }
}
</style>

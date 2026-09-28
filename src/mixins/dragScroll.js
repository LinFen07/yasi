export default {
  data () {
    return {
      _dragScrollState: {
        isDragging: false,
        animationFrameId: null,
        edgeSize: 80,
        maxScrollSpeed: 15
      }
    }
  },
  methods: {
    initDragScroll () {
      this.$el.addEventListener('dragstart', this._onDragStart)
      this.$el.addEventListener('dragend', this._onDragEnd)
    },
    destroyDragScroll () {
      this._stopScrollAnimation()
      this.$el.removeEventListener('dragstart', this._onDragStart)
      this.$el.removeEventListener('dragend', this._onDragEnd)
    },
    _onDragStart (e) {
      this._dragScrollState.isDragging = true
      document.addEventListener('mousemove', this._onMouseMove)
      document.addEventListener('touchmove', this._onTouchMove, { passive: false })
    },
    _onDragEnd () {
      this._dragScrollState.isDragging = false
      this._stopScrollAnimation()
      document.removeEventListener('mousemove', this._onMouseMove)
      document.removeEventListener('touchmove', this._onTouchMove)
    },
    _onMouseMove (e) {
      if (!this._dragScrollState.isDragging) return
      this._calculateScroll(e.clientY)
    },
    _onTouchMove (e) {
      if (!this._dragScrollState.isDragging) return
      if (e.touches.length > 0) {
        this._calculateScroll(e.touches[0].clientY)
      }
    },
    _calculateScroll (clientY) {
      const { edgeSize, maxScrollSpeed } = this._dragScrollState
      const windowHeight = window.innerHeight
      let scrollSpeed = 0

      if (clientY < edgeSize) {
        const ratio = 1 - (clientY / edgeSize)
        scrollSpeed = -Math.ceil(maxScrollSpeed * ratio)
      } else if (clientY > windowHeight - edgeSize) {
        const ratio = 1 - ((windowHeight - clientY) / edgeSize)
        scrollSpeed = Math.ceil(maxScrollSpeed * ratio)
      }

      if (scrollSpeed !== 0) {
        this._startScrollAnimation(scrollSpeed)
      } else {
        this._stopScrollAnimation()
      }
    },
    _startScrollAnimation (speed) {
      const state = this._dragScrollState
      if (state.animationFrameId && state.currentSpeed === speed) return
      state.currentSpeed = speed
      const scroll = () => {
        window.scrollBy(0, speed)
        state.animationFrameId = requestAnimationFrame(scroll)
      }
      this._stopScrollAnimation()
      state.animationFrameId = requestAnimationFrame(scroll)
    },
    _stopScrollAnimation () {
      const state = this._dragScrollState
      if (state.animationFrameId) {
        cancelAnimationFrame(state.animationFrameId)
        state.animationFrameId = null
        state.currentSpeed = 0
      }
    }
  },
  mounted () {
    this.initDragScroll()
  },
  beforeDestroy () {
    this.destroyDragScroll()
  }
}

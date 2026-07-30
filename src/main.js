import Vue from 'vue'
import App from './App.vue'
import { router } from './router'
import store from './store'
import 'normalize.css/normalize.css'

// Element UI 按需引入（按使用频率排序）
import {
  Button,
  ButtonGroup,
  Form,
  FormItem,
  Input,
  Select,
  Option,
  OptionGroup,
  Table,
  TableColumn,
  Pagination,
  Dialog,
  Message,
  MessageBox,
  Notification,
  Loading,
  Row,
  Col,
  Container,
  Header,
  Aside,
  Main,
  Menu,
  MenuItem,
  MenuItemGroup,
  Submenu,
  Dropdown,
  DropdownMenu,
  DropdownItem,
  Tabs,
  TabPane,
  Tag,
  Alert,
  Card,
  Rate,
  DatePicker,
  InputNumber,
  Switch,
  Checkbox,
  CheckboxGroup,
  Radio,
  RadioGroup,
  Tooltip,
  Popover,
  Timeline,
  TimelineItem,
  Upload,
  Icon,
  Badge,
  Avatar,
  Breadcrumb,
  BreadcrumbItem,
  Steps,
  Step,
  Progress,
  Spinner,
  Collapse,
  CollapseItem,
  Scrollbar,
  ColorPicker
} from 'element-ui'

import '@/styles/index.scss' // global css
import './icons' // icon
import '@wangeditor/editor/dist/css/style.css'
import ListeningSection from '@/views/exam/paper/components/ListeningSection.vue'
import ReadingSection from '@/views/exam/paper/components/ReadingSection.vue'
import WritingSection from '@/views/exam/paper/components/WritingSection.vue'
import NProgress from 'nprogress' // progress bar
import 'nprogress/nprogress.css' // progress bar style
import axios from 'axios'

Vue.prototype.$http = axios

// 注册所有 Element UI 组件
const components = [
  Button,
  ButtonGroup,
  Form,
  FormItem,
  Input,
  Select,
  Option,
  OptionGroup,
  Table,
  TableColumn,
  Pagination,
  Dialog,
  Row,
  Col,
  Container,
  Header,
  Aside,
  Main,
  Menu,
  MenuItem,
  MenuItemGroup,
  Submenu,
  Dropdown,
  DropdownMenu,
  DropdownItem,
  Tabs,
  TabPane,
  Tag,
  Alert,
  Card,
  Rate,
  DatePicker,
  InputNumber,
  Switch,
  Checkbox,
  CheckboxGroup,
  Radio,
  RadioGroup,
  Tooltip,
  Popover,
  Timeline,
  TimelineItem,
  Upload,
  Icon,
  Badge,
  Avatar,
  Breadcrumb,
  BreadcrumbItem,
  Steps,
  Step,
  Progress,
  Spinner,
  Collapse,
  CollapseItem
]

components.forEach(component => {
  Vue.use(component)
})

// 单独注册指令和服务
Vue.use(Loading.directive)
Vue.prototype.$loading = Loading.service
Vue.prototype.$message = Message
Vue.prototype.$msgbox = MessageBox
Vue.prototype.$alert = MessageBox.alert
Vue.prototype.$confirm = MessageBox.confirm
Vue.prototype.$prompt = MessageBox.prompt
Vue.prototype.$notify = Notification
Vue.prototype.$ELEMENT = { size: 'medium' }

Vue.config.productionTip = false

Vue.component('ListeningSection', ListeningSection)
Vue.component('ReadingSection', ReadingSection)
Vue.component('WritingSection', WritingSection)

NProgress.configure({ showSpinner: false }) // NProgress Configuration

let routerInitialized = false
router.beforeEach(async (to, from, next) => {
  // start progress bar
  NProgress.start()
  if (to.meta.title !== undefined) {
    document.title = to.meta.title
  } else {
    document.title = '\u200E'
  }
  if (!routerInitialized) {
    store.commit('router/initRoutes')
    routerInitialized = true
  }
  if (to.path) {
    // eslint-disable-next-line no-undef
    _hmt.push(['_trackPageview', '/#' + to.fullPath])
  }

  next()
})

router.afterEach(() => {
  // finish progress bar
  NProgress.done()
})

Vue.prototype.$$router = router

new Vue({
  router: router,
  store: store,
  render: h => h(App)
}).$mount('#app')

const assert = require('assert')
const fs = require('fs')
const path = require('path')
const vm = require('vm')
const babel = require('@babel/core')
const compiler = require('vue-template-compiler')

const root = path.join(__dirname, '..')
const storage = new Map()
global.localStorage = {
  getItem: key => storage.get(key) || null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: key => storage.delete(key)
}

const redirects = []
const requests = []
const vue = { prototype: {
  $loading: () => ({ close () {} }),
  $message: { error () {} },
  $$router: { push: route => redirects.push(route.path) }
} }
const axios = { request: async query => {
  requests.push(query)
  if (query.url === '/api/user/login') {
    return { data: { code: 1, response: { token: 'test-token' } } }
  }
  return { data: query.headers.Authorization === 'Bearer test-token'
    ? { code: 1, response: {} }
    : { code: 502, message: '未登录' } }
} }

const cache = {}
function load (filename) {
  if (cache[filename]) return cache[filename].exports
  const absolute = path.join(root, filename)
  const source = filename.endsWith('.vue')
    ? compiler.parseComponent(fs.readFileSync(absolute, 'utf8')).script.content
    : fs.readFileSync(absolute, 'utf8')
  const compiled = babel.transformSync(source, {
    babelrc: false,
    configFile: false,
    plugins: ['@babel/plugin-transform-modules-commonjs']
  }).code
  const module = { exports: {} }
  cache[filename] = module
  const dependencies = {
    axios,
    vue,
    vuex: { mapMutations: () => ({}) },
    '@/utils/request': () => load('src/utils/request.js'),
    '@/api/login': () => load('src/api/login.js'),
    '@/utils/auth': () => load('src/utils/auth.js')
  }
  vm.runInNewContext(compiled, {
    module,
    exports: module.exports,
    require: name => typeof dependencies[name] === 'function' ? dependencies[name]() : dependencies[name],
    process: { env: { VUE_APP_URL: '' } },
    localStorage: global.localStorage,
    setTimeout
  }, { filename })
  return module.exports
}

async function run () {
  const login = load('src/views/login/index.vue').default
  const instance = {
    loginForm: { userName: 'admin', password: 'password' },
    $refs: { loginForm: { validate: valid => valid(true) } },
    syncAutofill () {},
    setUserName () {},
    setToken (token) { load('src/utils/auth.js').setToken(token) },
    $router: { push: route => redirects.push(route.path) },
    $message () {}
  }
  login.methods.handleLogin.call(instance)
  await new Promise(resolve => setTimeout(resolve, 0))
  assert(redirects.includes('/dashboard'), 'login must reach dashboard')
  await load('src/utils/request.js').post('/api/admin/dashboard/index')
  assert.strictEqual(requests[1].headers.Authorization, 'Bearer test-token')
  assert(!redirects.includes('/login'), 'first protected request must not send user back to login')
  console.log('login session persists through first protected request')
}

run().catch(error => { console.error(error); process.exitCode = 1 })

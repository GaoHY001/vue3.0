import Vue from 'vue'
import Vuex, { StoreOptions } from 'vuex'
import { RootState } from './modules/types'
// import { profile } from './modules/profile'
import { login } from './modules/login'
import { assit } from './modules/assist'
Vue.use(Vuex)
const store: StoreOptions<RootState> = {
    state: {
      version: 'v1.0.0'
    },
    modules: {
    //   profile,
      login,
      assit
    }
  }
  export default new Vuex.Store<RootState>(store);
<template>
  <div class="login-img">
     <!-- <particles></particles> 粒子特效背景组件 -->
      <div class="login-card">
        <div class="login-title">{{loginTitle}}</div>
        <div class="login-cont" @keyup.enter="login">
          <el-form @submit.native.prevent label-position="left" label-width="70px" class="login-form">
            <el-form-item class="bip-form-item" label="账   户:">
              <el-input v-model="user.userCode"></el-input>
            </el-form-item>
            <el-form-item class="bip-form-item" label="密   码:">
              <el-input id="pwd" v-model="user.password" :show-password="true" type="password"></el-input>
            </el-form-item>
          </el-form>
          <div class="remember">
            <div>
               <el-checkbox v-model="checked" style="color:#a0a0a0;">记住账户</el-checkbox>
            </div>
            <div>
              <!-- <span @click="resetPassword">忘记密码?</span> -->
            </div>
            <!-- <div>
              <el-button @click="registered" type="text">注册</el-button>
            </div> -->
          </div>
          <!-- <el-row type="flex" justify="start">
            <el-col :span="12">
              <el-row type="flex" justify="start">
                <el-col :span="12">
                  <el-button @click="registered" type="text">注册</el-button>
                </el-col> 
              </el-row>
            </el-col>
            <el-col :span="12">
              <el-row type="flex" >
                <el-col :span="12">
                  <el-checkbox v-model="checked" style="color:#a0a0a0;">记住账户</el-checkbox>
                </el-col> 
                <el-col :span="12" >
                  忘记密码？
                </el-col>
              </el-row>
            </el-col>
          </el-row> -->
          <el-row>
            <el-col :span="24"  style="margin-top:10px">
              <el-button
                id="login"
                style="width:100%"
                type="primary"
                :disabled="canClick"
                @click="login"
              >登录</el-button>
            </el-col>
          </el-row>
      </div>
      <div class="login-footer">
        <address>&copy;{{COPYRIGHT}}</address>
        <!-- <address>技术支持：北京信唐普华科技有限公司</address> -->
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import Particles from '@/components/particles/index'
import { Component, Vue, Provide, Prop, Watch } from "vue-property-decorator";
import { User } from "@/classes/User";
import { Menu } from "@/classes/Menu";
import qs from "qs";
import { BIPUtil } from "@/utils/Request";
import { BaseVariable } from "@/utils/BaseICL";
import { State, Action, Getter, Mutation } from "vuex-class";
import { BIPUtils } from "@/utils/BaseUtil";
let baseTool = BIPUtils.baseUtil;
const namespace: string = "login";
@Component({
    components:{
        Particles
    }
})
export default class Login extends Vue {
  @Provide() fullscreenLoading: boolean = false;
  @Getter("user", { namespace }) user?: User;
  @Getter("menulist", { namespace }) menus?: Menu[];
  @Mutation("isLogin", { namespace }) setIsLogin: any;
  @Mutation("snkey", { namespace }) setSnkey: any;
  @Mutation("user", { namespace }) setUserInfo: any;
  @Mutation("menulist", { namespace }) setMenusInfo: any;
  @Mutation("isOtherePage", {  namespace: 'login' }) setIsOtherePage: any;
  @Provide() checked:boolean =false;
  @Provide() loginTitle = "";
  @Provide() COPYRIGHT ="";
  mounted() {
    if(!this.user){
      this.user = new User("", "", "");
    }else{
      this.user.userCode="";
    }
    this.getlocalStorage()
    this.loginTitle = BaseVariable.Project_Name;
    this.COPYRIGHT = BaseVariable.COPYRIGHT;
    this.setIsOtherePage(true)
  }
  //注册
  registered(){
    this.$router.push({ path: "/registered", name: "registered" });
  }
  // 重置密码
  resetPassword(){
    this.$router.push({path:"/resetpassword",name:"resetpassword"});
  }
  login() {
    if(this.fullscreenLoading)
      return;
    this.fullscreenLoading = true;
    const loading = this.$loading({
      lock: true,
      text: "登陆中",
      spinner: "el-icon-loading",
      background: "background:'rgba(0, 0, 0, 0.7)'"
    });
    if (!this.user) {
      return;
    }
    BIPUtil.ServApi.login(this.user)
      .then((res: any) => {
        let data = res.data;
        let _u:any = Object.assign({},this.user);
        if (data.id === 0) {
          let userI = data.data.user;
          let snkey = data.data.snkey;
          userI.password = "";
          let ms = data.data.menulist;
          this.setIsLogin(true);
          this.setSnkey(snkey);
          this.setUserInfo(userI);
          this.setMenusInfo(ms);
          // 判断记住账户是否为true,是将新账户存储至localStroge，否则清除localStroge中的账户
          if(this.checked){
            if(_u){
              this.setlocalStorage(_u.userCode);
            }       
          }else {
            this.clear()
          }
          setTimeout(() => {
            this.$notify.success({
              title:"",
              type: 'success',
              message: '登录成功',
              offset: 40
            })
            this.gotoPage();
            loading.close();
          }, 500);
        } else {
          this.$notify.error(data.message);
          loading.close();
        }
        this.fullscreenLoading = false;
      })
      .catch((res: any) => {
        this.$notify.error("服务没有启动！");
        loading.close();
        this.fullscreenLoading = false;
      });
  }

  get canClick() {
    if (!this.user) {
      return false;
    }
    return this.user.userCode === "";
  }
  // 将账户信息存储值localStroge
  setlocalStorage(c_name:String) {
    if(c_name && c_name !='undefined'){
      localStorage.siteName = c_name
    }
  }
  // 获取localStroge中的账户信息
  getlocalStorage() {
    var c_usrname = localStorage.getItem('siteName');
    if(this.user){
      if(c_usrname && c_usrname !='undefined'){
        this.user.userCode = c_usrname
        this.checked = true;
      }
    }
  }
  // 清除localStroge中的账户信息
  clear(){
    localStorage.removeItem('siteName');
  }
  @Watch("BaseVariable")
  titleWatch(){
    this.loginTitle = BaseVariable.Project_Name;
    this.COPYRIGHT = BaseVariable.COPYRIGHT;
  }

  gotoPage(){
    this.$router.push({ path: "/report", name: "Report" });
  }

}
</script>


<style lang="scss" scoped>
.login-img {
  top: 0%;
  left: 0%;
  position: fixed;
  width: 100%;
  height: 100%;
  background-size: 100% 100%;
  background-color: #011020;
}
.login-card {
  height: 350px;
  width: 500px;
  position: fixed;
  left: 50%;
  top: 50%;
  border: 1px solid #cfd8e0;
  margin-top: -175px;
  margin-left: -240px;
  border-radius: 5px;
}
.login-title {
  height: 60px;
  line-height: 60px;
  text-align: center;
  font-size: 20px;
  color: #ffffff;
  font-family: '华文楷体'
}
.login-cont {
  background-color: #F0FCFA;
  padding: 40px 70px;
}

.el-row {
  margin-bottom: 30px !important;
  height: 30px;
  line-height: 30px;
  font-size: 16px;
  &:last-child {
    margin-bottom: 20px;
  }
}
.bip-form-item {
  margin-bottom: 22px !important;
}
.login-footer {
  text-align: center;
  font-family: Arial;
  font-size: 10px;
  height: 30px;
  line-height: 30px;
}
address {
  color: #FAFBFC;
}
.rt {
  text-align: right;    
  width: 120px;
  float: right;
}
.reg{
  width: 50px;
  float: left;
  padding-left: 60px;
  font-weight: 500;
  font-size: 14px;
  color: #a0a0a0;
}
.el-form-item__label{
  background-color: #0ea0b9 I !important;
}
.remember {
  display: flex;
}
.remember div {
  flex: 1;
  height: 26px;
  line-height: 26px;
}
.remember div:nth-child(1){
  padding-left: 20px;
}
.remember div:nth-child(2){
  text-align: right;
}

</style>
<style lang="scss">
.login-form{
  .el-form-item__label{
    height: 40px !important;
    line-height: 40px !important;
    border-width: 0px !important;
    padding: 0px 15px !important;
    background:transparent !important;
  }
}
</style>

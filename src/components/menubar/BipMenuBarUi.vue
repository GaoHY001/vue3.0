<template>
    <el-row class="menubar">
        <el-button-group v-if="mbs && initOk">
            <template  v-for="(btn,index) in mbs.menuList">
                <template v-if="btnShow[index]">
                    <el-button class="bip-menu-bar" :class="btn.type?'bip_btn_'+btn.type:'bip_btn_default'" :key="index" v-if="btn.dlgType == '' || showDlg" :size="btn.size" @click.native="invokecmd(btn)" :disabled="!btn.enable">     
                        <template v-if="btn.hasIcon">
                            <template v-if="btn.icon&&btn.bIconleft">
                                <i :class="btn.icon"></i>{{btn.name}}
                            </template>    
                            <template v-else>
                                {{btn.name}} <i :class="btn.icon"></i> 
                            </template>
                        </template>
                        <template v-else>
                            {{btn.name}}
                        </template>
                    </el-button>
                </template>
            </template>
        </el-button-group>
        <template v-if="!place">
            <hr class="menubar-hr"/>
        </template>
    </el-row>

</template>
<script lang="ts">
//压缩;浏览;查询;缓存;5:增加;删除;保存;非定位;审核;
//10:审批;关联;文件;图形;引用;15:功能文字;统计;外部SQL;展开;批量打印;
//20:全部打印;邮件;无表格线;行单元底线;行单元边框;25:普通表头;关闭速查;执行可改
import { Component, Vue, Provide, Prop, Watch } from "vue-property-decorator";
import BipMenuBar from '@/classes/pub/BipMenuBar';
import CDataSet from '@/classes/pub/CDataSet';
@Component({})
export default class BipMenuBarUI extends Vue{
    @Prop() mbs!:BipMenuBar;
    @Prop() cds!:CDataSet;
    @Prop() place:any;//按钮组出现的位置
    bInsert:boolean = true;
    showDlg:boolean = true;
    initOk:boolean = false;
    btnShow:any=[]
    invokecmd(btn:any){
        this.$emit('invokecmd',btn);
    }
    mounted(){ 
        this.getBtnShow();
    }
    beforeDestroy(){
        
    }
    ReportTableShape(){
        this.showDlg = !this.showDlg;
    }

    @Watch("cds.currRecord.c_state")
    getBtnShow(){
        this.btnShow =[];
        for(var i=0;i< this.mbs.menuList.length;i++){
            this.btnShow.push(false)
            let btn:any = this.mbs.menuList[i];
            if(btn.cmd =='SAVE' && this.cds.currRecord){
                if ((this.cds.currRecord.c_state & 2) > 0 || (this.cds.currRecord.c_state & 1) > 0) {
                    this.btnShow[i] = true;
                    continue;
                }
                if(this.cds.opera){
                    let statefld = this.cds.opera.statefld;
                    if(statefld){
                        let state = this.cds.currRecord.data[statefld];
                        if(state){
                            state = state+""
                            if(state == '0' || state =='-1'){
                                this.btnShow[i] = true;
                            }else{
                                this.btnShow[i] = false;
                            }
                        }else{
                            this.btnShow[i] = true;
                        }
                    }else{
                        this.btnShow[i] = true;
                    }
                }else{
                    this.btnShow[i] = true;
                }
            }else if(btn.cmd =='DEL' && this.cds.currRecord){
                if ((this.cds.currRecord.c_state & 1) > 0) {
                    this.btnShow[i] = false;
                    continue;
                }
                if(this.cds.opera){
                    let statefld = this.cds.opera.statefld;
                    if(statefld){
                        let state = this.cds.currRecord.data[statefld];
                        if(state){
                            state = state+""
                            if(state == '0' || state =='-1'){
                                this.btnShow[i] = true;
                            }else{
                                this.btnShow[i] = false;
                            }
                        }else{
                            this.btnShow[i] = true;
                        }
                    }else{
                        this.btnShow[i] = true;
                    }
                }else{
                    this.btnShow[i] = true;
                }
            }else{
                let save_after = ['COPY','ADD','CHECKPROCESS','SUBMIT']
                if(save_after.indexOf(btn.cmd)>-1){
                    if(this.cds.currRecord){
                        if ((this.cds.currRecord.c_state & 1) > 0) {
                            this.btnShow[i] = false;
                        }else{
                            this.btnShow[i] = true;
                        }
                    }else{
                        if(btn.cmd == 'ADD'){
                            this.btnShow[i] = true;
                        }else{
                            this.btnShow[i] = false;
                        }
                    }
                }else{
                    this.btnShow[i] = true;
                }
            }
        }
        this.initOk = true;
        this.$forceUpdate();
    }
    @Watch("mbs.menuList")
    menuListChange(){
        this.getBtnShow();
    }
    @Watch("cds.currRecord",{deep:true})
    cdsChange(){
        this.getBtnShow();
    }
    @Watch("cds.opera")
    cdsOperaChange(){
        this.getBtnShow();
    }
}
</script>
<style lang="scss" scoped>
.bip-menu-bar{
    @include bip_menu_bar();
}
.menubar-hr{
    margin: 0px;
    border: 2px solid #e6e6e6;
}
</style>

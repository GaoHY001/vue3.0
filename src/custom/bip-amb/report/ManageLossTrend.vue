<template> 
    <el-container>
        <el-header style="height:45px;padding:0px 10px;border-bottom: 1px solid #CCCCCC;    line-height: 45px;">
            <Accounting @dataChange="accChange" class="topdiv1"></Accounting> 
 <!--            <Period class="topdiv1" :calendar_id="calendar_id" @dataChange="fm_Period_change" :type="'min'"></Period>
            <Period class="topdiv1" :calendar_id="calendar_id" @dataChange="to_Period_change" :type="'max'"></Period> -->
            <el-date-picker v-model="fm_date" format="yyyy-MM-dd" class="topdiv1" type="date" @change="fm_dateChange"  placeholder="选择日期" size="small"></el-date-picker>
            <el-date-picker v-model="to_date" format="yyyy-MM-dd" class="topdiv1" type="date" @change="to_dateChange"  placeholder="选择日期" size="small"></el-date-picker>
            <amb-tree-dialog class="topdiv1" @dataChange="treeChange" :purposesId="amb_purposes_id" :showCbox="true" ></amb-tree-dialog>
            <div class="topdiv1"><!-- 刷新 -->
                <el-button style="border:0px" @click="initData"  class="bip_btn_primary">      
                    <i class="el-icon-search"></i>
                    <span>查找</span>
                </el-button>
            </div>
        </el-header>
        <el-container>
            <el-main style="padding:0px">
                <bip-chart :style="chartStyle" :option="chartOption" :chartStyle="chartStyle"></bip-chart>
            </el-main>
        </el-container>
    </el-container>
</template>
<script lang="ts">
import { Component, Vue, Provide, Watch } from "vue-property-decorator";
import { State, Action, Getter, Mutation } from 'vuex-class';
import Accounting from "../components/Accounting.vue"//核算目的
import AmbTreeDialog from "../components/AmbTreeDialog.vue"//阿米巴树
import Period from "../components/Period.vue"//阿米期间
import BipChart from "@/components/chart/BipChart.vue"
import { BIPUtil } from "@/utils/Request";
import {BipMenuBtn} from '@/classes/BipMenuBtn'
import moment from 'moment';
let tools = BIPUtil.ServApi;
@Component({
    components: {
        Accounting,
        AmbTreeDialog,
        Period,
        BipChart
    }
})
/**
 * 经营趋势分析
 */
export default class ProfitLossFunction extends Vue {
    @State('bipComHeight', { namespace: 'login' }) height!: number;
    amb_purposes_id:string = "";//核算目的id
    amb_group_ids:any =[];//核算阿米巴key
 /*    fm_period_id:any = "";//开始期间
    to_period_id:any = "";//结束期间 */
    fm_date:any =""; //开始时间
    to_date:any=""; //结束时间  
    calendar_id:any = "";
    treeHeight:any ="500";
    chartStyle:string = "height :400px;";
    chartOption:any = null;
    async created() {
        this.fm_date = moment(new Date()).add(-1, 'days').format("YYYY-MM-DD")
        this.to_date = moment(new Date()).add(-1, 'days').format("YYYY-MM-DD")
        this.treeHeight =  this.height -60
        this.initChartOption();
    }
    initChartOption(){
        this.chartOption = null;
        return  { 
            tooltip: {
                trigger: 'axis'
            },
            legend: {
                data: ['收入','成本','利润']
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true
            }, 
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: []
            },
            yAxis: {
                type: 'value'
            },
            series: [
                {
                    name: '收入',
                    type: 'line',
                    stack: '总量',
                    data: []
                },
                {
                    name: '成本',
                    type: 'line',
                    stack: '总量',
                    data: []
                },
                {
                    name: '利润',
                    type: 'line',
                    stack: '总量',
                    data: []
                }
            ]
        };
    }
    async initData(){
        let option:any = this.initChartOption();
        if(this.amb_purposes_id !="" && this.amb_group_ids.length>0 && this.fm_date && this.to_date){
            let btn1 = new BipMenuBtn("DLG","经营趋势分析")
            btn1.setDlgType("D")
            btn1.setDlgCont("amb.serv.util.report.ProfitsInvoke*202;0;0");//职能损益表
            let b = JSON.stringify(btn1)
            let prarm = {
                "purpose_id":this.amb_purposes_id,//核算目的
                "group_ids":this.amb_group_ids, //阿米巴集合
                /* "fm_period_id":this.fm_period_id,//开始期间
                "to_period_id":this.to_period_id   //结束期间 */
                "fm_date":this.fm_date,
                "to_date":this.to_date
                
            }

            let v = JSON.stringify(prarm);
            let res = await tools.getDlgRunClass(v,b);
            let tdata = []; 
            let xAxisData = [];
            if(res.data.id ==0){
                tdata = res.data.data.data  
                for(var i=0;i<tdata.length;i++){
                    let row = tdata[i];
                    option.xAxis.data.push(row.period_name);
                    option.series[0].data.push(parseFloat(row.in_money).toFixed(2))
                    option.series[1].data.push(parseFloat(row.out_money).toFixed(2))
                    option.series[2].data.push(parseFloat(row.bal_money).toFixed(2))
                } 
                this.chartOption = option
            }else{
                this.$notify.error(res.data.message)
            }
        }
    }
    
    //核算目的发生变化 value = 核算目的ID
    accChange(value:any){
        console.log(value)
        this.calendar_id = value.calendar_id
        this.amb_purposes_id = value.id;
        // this.initData();
    }
   /*  //期间发生变化
    fm_Period_change(value:any){
        this.fm_period_id = value;
        // this.initData();
    }
    //期间发生变化
    to_Period_change(value:any){
        this.to_period_id = value;
        // this.initData();
    } */
    //期间发生变化
    fm_dateChange(value:any){
        this.fm_date = moment(value).format("YYYY-MM-DD")       
    }
    //期间发生变化
    to_dateChange(value:any){
        this.to_date = moment(value).format("YYYY-MM-DD")  
    }
    //阿米巴发生变化
    treeChange(checkData:any){
        this.amb_group_ids = checkData.keys;
        // this.initData();
    }
    @Watch("height")
    heightChange() {
        this.treeHeight =  this.height -60
    }
}
</script>
<style scoped lang="scss" >
.topdiv1{
    float: left;
    margin-right: 3px;
}
.topdiv2{
    float: right;
    margin-right: 3px;
}
</style>
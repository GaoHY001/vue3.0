<template>
    <el-col :span="span" :xs="24" :sm="24" :md="span">
        <template v-if="!bgrid">
            <el-form-item :label="cell.labelString" class="bip-input-item" :required="cell.isReq">
                <span slot="label" v-if="cell.labelString">
                    <template v-if="cell.labelString.length>(cell.isReq?4:6)">
                        <el-tooltip class="item" effect="dark" :content="cell.labelString" placement="top">
                            <span>{{cell.labelString.substring(0,(cell.isReq?4:5))}}…</span>
                        </el-tooltip>
                    </template>
                    <template v-else>
                        {{cell.labelString}}
                    </template>
                </span>                
                <el-input :placeholder="cell.placeholder" :readonly="readonly" :style="cell.desc?'width: calc(100% - 29px);':''" v-model="model1" size="medium" :clearable="true" :disabled="(cell.attr&0x40)>0" 
                        @focus="readonly?'':getFocus(true)"
                        @blur="getFocus(false)"
                        @change="dataChange"
                    >
                    <template v-if="this.model1&&readonly&&canEdit">
                        <i slot="suffix" class="el-input__icon el-icon-circle-close" @click="clearvalue"></i>
                    </template>
                    
                    <el-button slot="append" icon="el-icon-search" @click="iconClick"></el-button>
                </el-input>
                <template v-if="cell.desc">
                    <span style="position:relative;line-height:32px;width:29px;padding: 5px 0px 5px 5px;">
                        <el-tooltip class="item" effect="dark" :content="cell.desc" placement="top">
                            <i class="iconfont icon-bip-bangzhu" style="font-size:14px;"></i>
                        </el-tooltip>
                    </span>
                </template>
            </el-form-item>
        </template>
        <template v-else>
            <el-input :placeholder="cell.placeholder" v-model="model1" size="medium" :clearable="clearable" :disabled="(cell.attr&0x40)>0">
                 <template v-if="this.model1&&canEdit">
                        <i slot="suffix" class="el-input__icon el-icon-circle-close" @click="clearvalue"></i>
                </template>
                <el-button slot="append" icon="el-icon-search" @click="iconClick"></el-button>
            </el-input>
        </template>

        <!-- <template v-if="dia"> -->
            <bip-pop-view :cell="cell" :cds="cds" :bipInsAid="bipInsAid" :row="row" :env="env"
                ref="ak" @select="selectOK" :value="refLink.realV"
            ></bip-pop-view>
        <!-- </template> -->

    </el-col>
</template>
<script lang="ts">
import { Component, Vue, Provide, Prop, Watch } from "vue-property-decorator"
import CDataSet from '@/classes/pub/CDataSet';
import { Cell } from '@/classes/pub/coob/Cell';
import {CommICL} from '@/utils/CommICL'
let ICL = CommICL

import { State, Action, Getter, Mutation } from "vuex-class";
import BipInsAidNew from '../../classes/BipInsAidNew';
import BipPopView from './cutil/BipPopView.vue'
import CRecord from '../../classes/pub/CRecord';
import CCliEnv from '@/classes/cenv/CCliEnv'
@Component({
    components:{BipPopView}
})
export default class BipInsAidEditor extends Vue{
    @Prop() cds!:CDataSet
    @Prop() cell!:Cell
    @Prop() model:any
    @Prop() row!:number
    @Prop() bgrid!:boolean
    @Prop() bipInsAid!:BipInsAidNew
    @Prop() env!:CCliEnv
    model1:any = ""
    clearable:boolean = false
    multiple:boolean = false
    refId:string = ''
    initOK:boolean = false
    span:number = 6

    methodName:string = ''

    dia:boolean = false;

    readonly:boolean = false;//非输入

    mulcols: boolean = false;//多列
    bcode: boolean = false;//文本编码
    bfmt: boolean = false;//格式化
    othCols: Array<string> = [];
    othColsIndex: Array<number> = [];
    refLink:BipInsAidNew = new BipInsAidNew("")
    linkName:string = ""
    aidMarkKey:string = "";

    @State("aidInfos", { namespace: "insaid" }) aidInfo: any;
    @State("aidValues", { namespace: "insaid" }) aidValues: any;
    @State("inProcess", { namespace: "insaid" }) inProcess: any;
    @Action("fetchInsAid", { namespace: "insaid" }) fetchInsAid: any;
    @Action("fetchInsDataByCont", { namespace: "insaid" }) fetchInsDataByCont: any;
    @Mutation("setAidInfo", { namespace: "insaid" }) setAidInfo: any;
    @Mutation("setAidValue", { namespace: "insaid" }) setAidValue: any;
    async mounted(){
        this.multiple = (this.cds.ccells.attr&0x80)>0
        this.mulcols = (this.cell.attr & 0x100000) > 0;
        this.bfmt = (this.cell.attr & 0x10000) > 0;
        this.readonly = (this.cell.attr & 0x2000000) > 0;
        this.bcode = (this.cell.attr & 0x40000) > 0 ;//|| (this.bipInsAid!=null && this.bipInsAid.bType === 'CGroupEditor');
        this.aidMarkKey = this.cds.ccells.obj_id + "_" + this.cell.id+'_';
        if(!this.bgrid){
            this.span = Math.round(24/this.cds.ccells.widthCell*this.cell.ccHorCell)
        }else{
            this.span = 24
        }
        this.model1 = this.model
        let str = this.cell.refValue
        if(str){
            if(str.indexOf('&')>0){
                str = str.substring(2,str.length-1)
                this.linkName = str;
                if(!this.inProcess.get(ICL.AID_KEY+this.aidMarkKey+this.linkName)){
                    await this.getInsAidInfoBy(this.linkName)
                }else{
                    let rr = this.aidInfo.get(ICL.AID_KEY+this.aidMarkKey+this.linkName)
                    if(rr)
                        this.refLink = rr
                }
            }
        }else{
            if(this.bipInsAid){
                this.refLink = this.bipInsAid
                this.linkName = this.bipInsAid.id
            }

        }
        // this.refLink = Object.assign({},this.refLink,this.bipInsAid)
        if(this.refLink){
            this.refLink.realV = this.model
            this.refLink.showV = this.model
        }

        await this.getRefValues()
        this.methodName = ICL.EV_CELL_CHANGE+'_'+this.cds.ccells.obj_id+'_'+this.cell.id
        if(this.mulcols){
            this.initMulColInfo()
            let record: CRecord = this.cds.getRecordAtIndex(this.row<0?0:this.row);
            let _val = this.refLink.values;
            let val:any = null;
            for(var i=0;i<_val.length;i++){
                let vv = _val[0]
                if(vv[this.refLink.cells.cels[0].id] == this.model){
                    val = vv;
                }
            }
            if(record && record.data && val){
                this.othCols.forEach((fld, index) => {
                    let idx = this.othColsIndex[index];
                    let layC = this.bipInsAid.cells.cels[idx];
                    if (layC && !record.data[fld]) {
                        record.data[fld] = val[layC.id]||"";
                        let cel = this.cds.getCell(fld)
                        this.cds.checkGS(cel);
                    }
                });
            }
        }
    }

    get canEdit(){
        return this.cds.currCanEdit(this.row>-1?this.row:0);
    }

    clearvalue(){
        
        this.model1 = '';
        this.dataChange('');
    }

    iconClick(checkCell:boolean = true) {
        console.log("iconClick")
        this.$emit("focus",{})
        if(checkCell && this.bipInsAid && this.bipInsAid.cells && this.bipInsAid.cells.cels.length ==0){
            this.$emit("refInsAid")
            return;
        }
        if(this.bipInsAid){
            if (!((this.cell.attr & 0x40) > 0)) {
                if(this.bipInsAid.bType =="CGroupEditor"){
                    let groupFld = this.bipInsAid.groupFld;
                    if(this.cds.ccells.exTbName){
                        let tname = this.cds.ccells.exTbName.split(",")
                        tname.push(this.cds.ccells.tbName)
                        for(var i=0;i<tname.length;i++){
                            let _groupFld = groupFld;
                            if(groupFld.indexOf( tname[i]) ==-1)
                                _groupFld = tname[i]+"."+groupFld
                            if(!this.cds.currRecord.data[_groupFld]){
                                let cel:any = this.cds.getCell(_groupFld)
                                if(cel){
                                    this.$notify.warning('请先填写：'+cel.labelString)
                                    return;
                                }
                            }
                        }
                    }else{
                        let ds = this.cds;
                        if(groupFld && groupFld.indexOf("*") !=-1){
                            let obj_id = groupFld.split("*")[0];
                            ds = this.env.getDataSet(obj_id);
                            groupFld = groupFld.split("*")[1];
                        }
                        if(ds && !ds.currRecord.data[groupFld]){
                            let cel:any = ds.getCell(groupFld)
                            if(cel){
                                let msg = ds.ccells.desc;
                                this.$notify.warning('请先填写：'+msg+" "+cel.labelString)
                            }   
                            return;
                        }
                    }
                }
                setTimeout(() => {
                    let dia: any = this.$refs.ak;
                    if (dia) dia.open();
                }, 100);
            }
        }else{
            this.$notify.warning('没有辅助：'+this.cell.editName)
        }
    }
    openRefDl(){
        this.iconClick(false);
    }

    selectOK(val:any,close:boolean = false){
        console.log("selectOK")
        if(this.cds.currCanEdit()){
            let record: CRecord = this.cds.getRecordAtIndex(this.row<0?0:this.row);
            this.cds.setStateOrAnd(ICL.R_EDITED);
            this.model1 = "";
            let strval = "";
            for(var i=0;i<val.length;i++){
                let oneVal = val[i];
                let key = oneVal[this.bipInsAid.cells.cels[0].id] 
                this.model1 += key+";" 
                let key1 = ICL.AID_KEY+this.aidMarkKey+this.linkName+"_"+key
                let vrs = this.aidValues.get(key1);
                if(!vrs){
                    this.setAidValue({key:key1,value:oneVal});
                }else{
                    oneVal = vrs;
                }
                strval+=oneVal[this.bipInsAid.cells.cels[1].id]+";"
            }
            if (this.mulcols) {
                this.othCols.forEach((fld, index) => {
                    let idx = this.othColsIndex[index];
                    let layC = this.bipInsAid.cells.cels[idx];
                    if (layC) {
                        record.data[fld] = val[0][layC.id]||"";
                        let cel = this.cds.getCell(fld)
                        this.cds.checkGS(cel);
                    }
                });
            }
            if(this.model1.length>1)
            this.model1 = this.model1.substring(0,this.model1.length-1);
            record.data[this.cell.id] = this.model1
            if(this.refLink){
                this.refLink.realV = this.model1
                this.refLink.showV = strval
                this.refLink.values = []
                this.refLink.values = val
            }
            this.cds.currRecord = record
            this.cds.cdata.data[this.row<0?0:this.row]= record
            // this.cds.setRecordAtIndex(record,this.row<0?0:this.row)
            // this.$bus.$emit('cell_edit')
            this.getRefValues()
            this.cds.checkGS(this.cell);
            this.cds.currRecord.c_state |= 2;
            if(this.cds.ds_par){
                this.cds.ds_par.currRecord.c_state |= 2;
            }
        }
        if(close){
            setTimeout(() => {
                let dia: any = this.$refs.ak;
                if (dia) dia.close();
            }, 100);
        }
    }
//#region /**初始化多列参照 */
    initMulColInfo() {
        let script = this.cell ? this.cell.script : "";
        if (script) {
            let vals = script.split("&");
            if (vals.length < 2) {
                this.$notify.error("多列定义错误" + script);
            } else {
                let flds = vals[0].split(",");
                let flds_index: Array<number> = vals[1]
                    .split(",")
                    .map(value => {
                        return parseInt(value);
                    });
                if (flds.length != flds_index.length) {
                    this.$notify.error(
                        "多列参照定义的字段和下标的个数不对" + script
                    );
                } else {
                    this.othCols = flds;
                    this.othColsIndex = flds_index;
                }
            }
        }
    }
//#endregion

    makeShow() {
        if(!this.bcode){
            if(this.refLink.values&&this.refLink.values.length>0){
                if(this.refLink.values){
                    this.refLink.showV = ''
                    for(var i=0;i<this.refLink.values.length;i++){
                        let vv = this.refLink.values[i];
                        this.refLink.showV += vv[this.refLink.cells.cels[1].id]+";"||this.refLink.realV+";"
                    }
                    if(this.refLink.showV.length>1)
                    this.refLink.showV = this.refLink.showV.substring(0,this.refLink.showV.length-1)
                }else{
                    this.refLink.showV = this.refLink.realV
                }
            }else{
                this.refLink.realV = this.model1
                this.refLink.showV = this.refLink.realV
            }
        }else{
            this.refLink.realV = this.model
            this.refLink.showV = this.refLink.realV
        }

        this.getFocus(false)
        
    }

    async getRefValues(){
        if(this.refLink&&this.refLink.id.length>0&&this.model1.length>0){
             this.refLink.values = []
            if(this.model&&this.model.length>0){
                let vlarr = this.model.split(";")
                let values = [];
                for(var i=0;i<vlarr.length;i++){
                    let val = vlarr[i]
                    let cont = "";
                    if(this.refLink.cells.cels.length>0){
                        cont = this.refLink.cells.cels[0].id+"='"+val+"' "
                    }
                    let key = ICL.AID_KEY+this.aidMarkKey+this.linkName+"_"+val
                    let vrs = this.aidValues.get(key);
                    if(!vrs){
                        let str = window.sessionStorage.getItem(key)
                        if(!str){
                            let groupV = null;
                            if(this.bipInsAid.bType =="CGroupEditor"){
                                let groupFld = this.bipInsAid.groupFld;
                                groupV = this.cds.currRecord.data[groupFld];
                            }
                            let vvs = {id:this.linkName,key:key,cont:cont,groupV:groupV}
                            let res = await this.fetchInsDataByCont(vvs)
                            if(res.data.id ==0){
                                vrs = res.data.data.data.values[0]
                            }
                            if(vrs)
                                values.push(vrs)
                        }else{
                            vrs = JSON.parse(str);
                            this.setAidValue({key:key,value:vrs})
                            values.push(vrs);
                            this.makeShow()
                        }
                    }else{
                        values.push(vrs);
                    }

                }
                this.refLink.values = []
                this.refLink.values = values
                this.makeShow()
                // let cont = this.refLink.cells.cels[0].id+"='"+this.model+"' "
                // let key = ICL.AID_KEY+this.aidMarkKey+this.linkName+"_"+this.model
                // let vrs = this.aidValues.get(key);
                // if(!vrs){
                //     let str = window.sessionStorage.getItem(key)
                //     if(!str){
                //         let vvs = {id:this.linkName,key:key,cont:cont}
                //         this.fetchInsDataByCont(vvs)
                //     }else{
                //         vrs = JSON.parse(str);
                //         this.setAidValue({key:key,value:vrs})
                //         this.refLink.values = []
                //         this.refLink.values[0] = vrs
                //         this.makeShow()
                //     }
                // }else{
                //     this.refLink.values = []
                //     this.refLink.values[0] = vrs
                //     this.makeShow()
                // }

            }else{
                this.refLink.realV = this.model
                this.refLink.showV = this.refLink.realV
                this.makeShow()
            }
        }
    }

    getFocus(gets: boolean) {
        if (gets) {
            this.$emit("focus",{})
            if (this.refLink && this.refLink.realV) {
                this.model1 = this.refLink.realV;
            } else {
                this.model1 = this.model;
            }
        } else {
            if (this.refLink && this.refLink.showV) {
                if (this.bcode) {
                    this.model1 = this.refLink.realV;
                } else{
                    this.model1 = this.refLink.showV;
                } 
            } else {
                this.model1 = this.model;
            }
        }
    }

    async getInsAidInfoBy(editName:string,bcl:boolean = false){
        let str = editName
        if(bcl){
            str = ICL.AID_KEYCL+this.aidMarkKey+str;
        }else{
            str = ICL.AID_KEY+this.aidMarkKey+str;
        }
        let vv = this.aidInfo.get(str)
        if(!vv){
            vv  = window.sessionStorage.getItem(str)
            if(!vv){
                    let vars = {id:bcl?300:200,aid:editName,ak:this.aidMarkKey}
                    await this.fetchInsAid(vars);
            }else{
                this.refLink = JSON.parse(vv)
                let vals = {key:str,value:this.refLink}
                this.setAidInfo(vals)
            }
        }else{
            this.refLink = vv;
        }
    }

    @Watch('aidInfo')
    mapChanges(){
        if(!this.refLink.id){
            let rr = this.aidInfo.get(ICL.AID_KEY+this.aidMarkKey+this.linkName)
            if(rr){
                this.refLink = rr
            }
            this.getRefValues()      
        }
    }

    @Watch('model')
    valueChanges(){
        this.refLink.realV = this.model
        if(this.model1 === this.model){
            this.refLink.realV = this.model
            this.refLink.showV = this.model
        }else{
            this.refLink.realV = this.model
            this.refLink.showV = this.model
            this.model1 = this.model
        }
        if(this.model.length>0)
            this.getRefValues()
        else{
            this.refLink.values = []
            this.makeShow() 
        }
        if (this.mulcols) {
            let record: CRecord = this.cds.getRecordAtIndex(this.row<0?0:this.row);
            let val = this.refLink.values;
            if(record){
                this.othCols.forEach((fld, index) => {
                    let idx = this.othColsIndex[index];
                    let layC = this.bipInsAid.cells.cels[idx];
                    if (layC && !record.data[fld] && val.length>0) {
                        record.data[fld] = val[0][layC.id]||"";
                        let cel = this.cds.getCell(fld)
                        this.cds.checkGS(cel);
                    }
                });
            }
        }
    }

    @Watch('aidValues')
    aidValuesChange(){
        if(this.refLink&&this.refLink.id.length>0&&this.model1){
            if(this.model&&this.model.length>0){
                let vlarr = this.model.split(";")
                var values:any = [];
                for(var i=0;i<vlarr.length;i++){
                    let key = ICL.AID_KEY+this.aidMarkKey+this.linkName+"_"+vlarr[i]
                    let vvs = this.aidValues.get(key);
                    if(vvs){
                        this.refLink.realV = this.model
                        values.push(vvs);
                    }
                }
                this.refLink.values = []
                this.refLink.values = values
                this.makeShow()
            }
        }
    }

    @Watch('bipInsAid')
    bipInsAidChange(){
        this.bcode = (this.cell.attr & 0x40000) > 0;// || (this.bipInsAid!=null && this.bipInsAid.bType === 'CGroupEditor');
        this.refLink = this.bipInsAid         
    }

    dataChange(value:string|number){
        if(this.cds&&this.cell){
            if(this.cds.currCanEdit()){
                this.cds.currRecord.data[this.cell.id] = this.model1;
                this.cds.cdata.data[this.cds.index].data[this.cell.id] = this.model1
                this.cds.cdata.data[this.cds.index] = this.cds.currRecord;
                // const key:string = this.cell.id
                // this.cds.cdata.data[this.row].c_state |=2;
                this.cds.setStateOrAnd(ICL.R_EDITED)
                this.cds.checkGS(this.cell);
                this.cds.currRecord.c_state |= 2;
                if(this.cds.ds_par){
                    this.cds.ds_par.currRecord.c_state |= 2;
                }
            }else{
                this.model1 = this.model
            }
        }   
    }
}
</script>




<template>
  <el-dialog
    class="bip-file"
    :visible.sync="outerVisible"
    :append-to-body="true"
    :close-on-press-escape="true"
    :close-on-click-modal="false"
    :before-close="selectOK"
  >
    <!--弹出框头部-->
    <span slot="title">
        <div class="el-dialog__title" style="padding-bottom:5px">
            <i class="el-icon-upload"></i>
            {{title}}
        </div>
    </span>
    <el-tabs v-model="activeName">
      <el-tab-pane v-if="showUpPage"  name="file-up">
         <span slot="label"><i class="el-icon-upload2"></i> 文件上传</span>
        <el-upload
            class="upload-demo"
            ref="upload"
            :multiple="true"
            :action="uri"
            :on-preview="handlePreview"
            :on-remove="handleRemove"
            :before-remove="beforeRemove"
            :file-list="fileList"
            :on-change="fileChange"
            :auto-upload="false"
            :http-request="uploadFile"
            :list-type="fileListType"
        >
          <el-button slot="trigger" size="small" type="primary">选取文件</el-button>
          <el-button
            style="margin-left: 10px;"
            size="small"
            type="success"
            @click="submitUpload"
            :disabled="!canUpFile"
          >上传到服务器</el-button>
          <!-- <div slot="tip" class="el-upload__tip">只能上传jpg/png文件，且不超过500kb</div> -->
        </el-upload>
      </el-tab-pane>
      <el-tab-pane 　 name="file-down">
        <span slot="label"><i class="el-icon-download"></i> 文件下载</span>
        <el-table size="small" stripe :data="fileList" style="width: 100%">
          <el-table-column label="文件名称" :show-overflow-tooltip="true">
            <template slot-scope="scope">
              <i class="el-icon-document"></i>
              <span style="margin-left: 10px">{{ scope.row.name }}</span>
            </template>
          </el-table-column>
          <el-table-column :align="'center'" label="状态">
            <template slot-scope="scope">
              <el-tag :type="scope.row.status">{{ scope.row.status}}</el-tag>
              <!-- <span style="margin-left: 10px">{{ scope.row.status}}</span> -->
            </template>
          </el-table-column>
          <el-table-column :show-overflow-tooltip="true" :align="'center'" label="地址">
            <template slot-scope="scope">
              <span style="margin-left: 10px">{{ scope.row.url}}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作">
            <template slot-scope="scope">
              <el-button size="mini" type="danger" @click="handleDown(scope.$index, scope.row)">下载</el-button>
              <el-button v-if="canPreviewList.includes(scope.row.name.substring(scope.row.name.lastIndexOf('.') + 1))" size="mini" type="success" @click="previewFileEvent(scope.$index, scope.row)">预览</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <span slot="footer" class="dialog-footer">
      <el-button size="small" @click="cancel()">取 消</el-button>
      <el-button size="small" type="primary" @click="selectOK">确 定</el-button>
    </span>
  </el-dialog>
</template>
<script lang="ts">
/**
 * 文件上传下载弹出框
 */
import { Component, Vue, Provide, Prop, Watch } from "vue-property-decorator";
import { BIPUtil } from "@/utils/Request";
import {BaseVariable} from "@/utils/BaseICL"
import CDataSet from '@/classes/pub/CDataSet';
import { Cell } from '@/classes/pub/coob/Cell';
let tools = BIPUtil.ServApi
import { CommICL } from '@/utils/CommICL';
let icl = CommICL
import { GlobalVariable } from '@/utils/ICL';
import CCliEnv from '@/classes/cenv/CCliEnv'
@Component({})
export default class BipFileInfo extends Vue {
    @Prop() env!:CCliEnv    
    @Prop() cds!: CDataSet;
    @Prop() cell!: Cell;
    @Prop() index!: number;
    outerVisible: boolean = false;
    title = "文件上传下载";
    fileList: Array<any> = [];
    activeName: string = "file-up";
    uri:string=GlobalVariable.API_UPD//附件操作接口
    baseURL:string=''// 项目路径
    upLoadDid:string = ''
    showUpPage:boolean = true;
    canUpFile:boolean = true;
    fjrootCell:Cell = new Cell();//附件路径对象
    fileListType:any = "text";
    canPreviewList:Array<any> = ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx','pdf','txt','png','jpg']
    created(){
        let snkey = window.sessionStorage.getItem('snkey');
        this.uri = BaseVariable.BaseUri+''+GlobalVariable.API_UPD
        this.baseURL = BaseVariable.BaseUri
        console.log(this.baseURL);
        if(this.env){
            let pattr = this.env.uriParams.pattr;
            if((pattr & 0x40 ) <= 0){//菜单参数中未勾选保存属性
                this.showUpPage = false;
            }
        }
    }
    mounted() {
        if(this.cds&&this.cell){
            if(this.cell.refValue=='{2}'){
                this.fileListType="picture-card";
            }
            if(this.cds){
                let cels = this.cds.ccells.cels;
                for(var i=0;i<cels.length;i++){
                    let cel = cels[i];
                    if(cel.id == 'fj_root'){
                        this.fjrootCell = cel;
                        break;
                    }
                    if(cel.id == this.cell.id){
                        this.fjrootCell = cels[i-1];
                    }
                }
            }
            this.makefjRoot()
        }
    }


    open() {
        this.canUpFile = true;
        this.fileList = [];
        if(!this.upLoadDid)
            this.upLoadDid = this.cds.currRecord.data[this.fjrootCell.id];
        if(!this.upLoadDid)
            this.upLoadDid = "";
        let fileName = this.cds.currRecord.data[this.cell.id];
        if(fileName && fileName.length>0){
            let nameArr = fileName.split(";");
            for(var i=0;i<nameArr.length;i++){
                let name = nameArr[i];
                let snkey = JSON.parse(window.sessionStorage.getItem('snkey')+'');
                snkey = encodeURIComponent(snkey); 
                let fileUrl = this.uri+'/'+this.upLoadDid+'/'+name+"?imageMogr2/thumbnail/360x360/format/webp/quality/101";
                if(this.cell.refValue=='{2}'){
                    fileUrl = this.uri+'?snkey='+snkey+'&fjroot='+this.upLoadDid+'&updid=36&fjname='+name;
                }
                let f1 = {name:name,url:fileUrl,status:'success'}
                this.fileList.push(f1)
            }
        }
        this.outerVisible = true;
    }

    /**
     * 上传文件
     */
    async uploadFile(param:any){
        let file = param.file
        let name = file.name
        let size = file.size
        let succeed = 0;
        let shardSize = 2 * 1024 * 1024,    //以2MB为一个分片
        shardCount = Math.ceil(size / shardSize);  //总片数
        let fkey = this.makePath();
        let pro:any = {};
        for(let i = 0;i < shardCount;i++){
            let start = i * shardSize,end = Math.min(size, start + shardSize);
            let form = new FormData();
            let config:any  = {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                params:{
                    snkey:JSON.parse(window.sessionStorage.getItem('snkey')+''),
                },
                onUploadProgress: (progressEvent:any) => {
                    pro[fkey+"_"+i] = (progressEvent.loaded/progressEvent.total)*100
                    let num = 0;
                    for(let key in pro){
                        num += pro[key]
                    }
                    num = num /shardCount;
                    num = Math.floor(num*100)/100;
                    if(num >= 99)
                        num = 99;
                    let upload:any = this.$refs.upload
                    let files:Array<any> = upload.uploadFiles
                    for(var j=0;j<files.length;j++){
                        if(files[j].uid == file.uid){
                            files[j].name = files[j].name.split("   ")[0]+"   "+num+"%"
                        }
                    }
                },
            };
            config.params.name = name;
            config.params.total = shardCount;//总片数
            config.params.fkey = fkey;//一个文件一个key
            config.params.fid = 0;//当前是第几片
            config.params.fjkey = this.cds?this.cds.ccells.obj_id:'aaa';
            config.params.updid = '33';
            form.append("index", i+'');
            form.append("total",shardCount+'');
            // form.append("fjroot",this.root?this.root:'');//fj_500301
            form.append("fjroot",this.upLoadDid);
            form.append("data", file.slice(start,end)); 
            await this.$axios.post(this.uri,form,config).then((res)=>{
                if(res.data.id==-1){
                    this.$notify.error("上传失败！");
                    this.canUpFile = true;
                }else{
                    succeed++;
                    if(res.data.id==0){
                        this.canUpFile = true;
                        this.$notify.success( "上传完成！")
                        param.onSuccess(res)
                        let dir = res.data.data[this.fjrootCell.id];
                        if(!this.upLoadDid){
                            this.upLoadDid = dir
                        }
                        let name = res.data.data.fname;
                        let snkey = JSON.parse(window.sessionStorage.getItem('snkey')+'');
                        snkey = encodeURIComponent(snkey); 
                        let fileUrl = this.uri+'/'+this.upLoadDid+'/'+name+"?imageMogr2/thumbnail/360x360/format/webp/quality/101";
                        if(this.cell.refValue=='{2}'){
                            fileUrl = this.uri+'?snkey='+snkey+'&fjroot='+this.upLoadDid+'&updid=36&fjname='+name;
                        }
                        let f1 = {name:name,url:fileUrl,status:'success'}
                        this.fileList.push(f1)
                    }
                }
            });
        } 
    }

    
    uploadVideoProcess(){
        console.log("uploadVideoProcess")
    }
    makePath(){
        let time = new Date().getTime();
        const key = 999;
        let add1 = Math.floor(Math.random() * (key));
        return add1+"_"+time;
    }


    submitUpload() {
        this.canUpFile = false;
        let upload: any = this.$refs.upload;
        if (upload) {
            upload.submit();
        }else{
            this.canUpFile = true;
        }
    }

    beforeRemove(file:any, fileList:any) {
        return this.$confirm(`确定移除 ${ file.name }？`);
    }
    async handleRemove(file: any, fileList: any) {
        var name = file.name;
        console.log(encodeURIComponent(name))
        name = encodeURIComponent(name);
        var params = {
            snkey: JSON.parse(window.sessionStorage.getItem('snkey')+''),
            fjroot: this.upLoadDid,
            fjname: name,
            updid: '34'
        }
        if(file&&file.name){
            let res = await tools.fileOPeration(params);
            if(res.data.id==0){
                let i = this.fileList.findIndex((f1:any)=>{
                    return f1 == file
                });
                if(i>-1){
                    this.fileList.splice(i,1)
                }
            }
        }
    }
    handlePreview(file: any) {
        console.log(file)
    }

    fileChange(file:any,fileLis:any){
        let f2:Array<any> = fileLis.filter((f1:any)=>f1.status != 'success')
        if(f2&&f2.length>0){
            this.canUpFile = true;
        }
    }

    cancel() {
        this.outerVisible = false;
    }

    selectOK() {
        if(this.$refs.upload){
            let upload:any = this.$refs.upload
            let files:Array<any> = upload.uploadFiles
            if(files&&files.length>0){
                let f2:Array<any> = files.filter(f1=>f1.status != 'success')
                if(f2&&f2.length>0){
                    this.$alert('有未上传的文件，请上传文件！','',{type:'error'});
                    return 
                }
            }
            if(this.cds&&this.cell){
                let record:any = this.cds.currRecord
                let old_vl = record.data[this.cell.id];
                record.data[this.fjrootCell.id] = this.upLoadDid
                let fis = ''
                this.fileList.forEach(file => {
                    fis += file.name+';'
                });
                if(fis.length>0)
                    fis = fis.substring(0,fis.length-1)
                record.data[this.cell.id] = fis   
                this.cds.setStateOrAnd(icl.R_EDITED)
                this.$bus.$emit('cell_edit');
                if(old_vl != fis){
                    this.$emit('select',true)
                }
            }
        }
        this.outerVisible = false
        this.$emit('select',false)
        // this.outerVisible = false
    }

    close(){
        this.outerVisible = false;
    }
    /**
     * 下载文件
     */
    handleDown(index:number,file:any) {
        let name = file.name;
        let snkey = JSON.parse(window.sessionStorage.getItem('snkey')+'');
        let fjroot = this.upLoadDid
        let updid =  '36';
        snkey = encodeURIComponent(snkey);
        window.open(this.uri+'?snkey='+snkey+'&fjroot='+fjroot+'&updid='+updid+'&fjname='+name);
    }
    // 在线预览
    previewFileEvent(index:number,file:any){
        let name = file.name;
        let fileExtension = name.substring(name.lastIndexOf('.') + 1);
        let fjroot = this.upLoadDid
        const typeArr = ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx']
        let url = ''
        if (typeArr.indexOf(fileExtension) !== -1) {
            // 用docx云服务的在线预览
            url = 'http://view.xdocin.com/xdoc?_xdoc='+ this.baseURL +'/mydoc/db_01/' + fjroot +'/'+name;
        } else {
            url = this.baseURL +'/mydoc/db_01/' + fjroot +'/'+name;
        }
        console.log(url);
        // window.open()居中打开
        const width = 1000; const height = 800
        const top = (window.screen.availHeight - height) / 2
        const left = (window.screen.availWidth - width) / 2
        window.open(url, '', 'width=' + width + ',height=' + height + ',top=' + top + ',left=' + left)
    }
    makefjRoot(){
        if(this.cds&&this.cell){
            let record:any
            let _i = this.index==-1?0:this.index
            if(this.index){
                record = this.cds.cdata.data[this.index]
            }else{
                record = this.cds.currRecord
            }
            this.upLoadDid = record?record.data[this.fjrootCell.id]:'';
            if(!this.upLoadDid){
                this.upLoadDid = ''
            }
        }
    }
}
</script>
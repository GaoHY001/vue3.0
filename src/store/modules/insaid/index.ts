import { RootState } from '../types';
import { BipInsState } from './types';
import { Module,GetterTree, MutationTree, ActionTree } from 'vuex';
import BipInsAidNew from '@/classes/BipInsAidNew';
import { BIPUtil } from "@/utils/Request";
import { AxiosPromise } from 'axios';
import QueryEntity from '@/classes/search/QueryEntity';
import {CommICL} from '@/utils/CommICL'
let tools = BIPUtil.ServApi;
let ICL = CommICL
const state : BipInsState = {
    aidInfos: new Map<string,BipInsAidNew>(),//辅助ID,对象信息
    inProcess: new Map<string,boolean>(),//辅助ID,是否正在访问
    aidValues: new Map<string,any>(),//辅助ID+查询条件,values值
}


const getters: GetterTree<BipInsState, RootState> = {
    AID_INFOS(state) : Map<string,BipInsAidNew> {
        return state.aidInfos;
    },
    IN_Process(state) : Map<string,boolean> {
        return state.inProcess
    },

    AID_VALUES(state) : Map<string,any> {
       return state.aidValues
    }
  }

const mutations :MutationTree<BipInsState> = {
setAidInfo:(state:BipInsState,vals:any) => {
    if(vals && vals.value){
        state.aidInfos.set(vals.key,vals.value)
        state.aidInfos = new Map(state.aidInfos)
        state.inProcess.set(vals.key,true)
        window.sessionStorage.setItem(vals.key,JSON.stringify(vals.value))
    }
},
setKeyMap:(state:BipInsState,key:string)=>{
    state.inProcess.set(key,true);
    state.inProcess = new Map(state.inProcess);
},

setKeyMapCancel:(state:BipInsState,key:string)=>{
    state.inProcess.set(key,false);
    state.inProcess = new Map(state.inProcess);
},
setAidValue:(state:BipInsState,vals:any) => {
    if(vals && vals.value){
        state.aidValues.set(vals.key,vals.value);
        state.aidValues = new Map(state.aidValues);
        window.sessionStorage.setItem(vals.key,JSON.stringify(vals.value))
    }
}
}

const actions: ActionTree<BipInsState, RootState> = {
    fetchInsAid:({commit},val:any): AxiosPromise<BipInsState>  => {
        let id = val.id;
        let aid = val.aid;
        let eq = val.eq;
        let k1 = aid
        let k = "";
        if(val.ak){
            k  = val.ak
        }
        if(id==300){
            k1 = ICL.AID_KEYCL+k+aid;
        }else{
            k1 = ICL.AID_KEY+k+aid;
        }
        commit('setKeyMap',k1);
        return tools.getBipInsAidInfo(aid, id,eq).then(res=>{
            if(res.data.id==0){
                let vrr = res.data.data.data
                commit('setAidInfo',{key:k1,value:vrr});
            }
            return res;
        }).catch(err=>{
            commit('setKeyMapCancel',k1);
            return err;
        });
    },

    fetchInsDataByCont:({commit},val:any): AxiosPromise<BipInsState>  => {
        let aid = val.id
        let key = val.key
        let cont = val.cont
        let groupV = val.groupV
        commit('setKeyMap',key);
        let qe = new QueryEntity("","");
        qe.cont = cont
        qe.groupV = groupV
        return tools.getBipInsAidInfo(aid, 210,qe).then(res=>{
            if(res.data.id==0){
                let vrr = res.data.data.data
                commit('setAidValue',{key:key,value:vrr.values[0]});
            }else{
                commit('setKeyMapCancel',key);
            }
            return res;
        }).catch(err=>{
            commit('setKeyMapCancel',key);
            return err;
        });
    }



}

const namespaced: boolean = true;


export const insaid: Module<BipInsState, RootState> = {
    namespaced,
    state,
    getters,
    actions,
    mutations
  };
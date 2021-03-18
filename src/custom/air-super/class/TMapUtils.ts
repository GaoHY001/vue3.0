import QueryEntity from "@/classes/search/QueryEntity";
import QueryCont from "@/classes/search/QueryCont";
import { BIPUtil } from "@/utils/Request";
let tools = BIPUtil.ServApi;
import { T } from "@/components/map/js/TMap";
import { Cells } from "@/classes/pub/coob/Cells";
import CDataSet from "@/classes/pub/CDataSet";
export namespace TMapUtils {
    class TMapUtils {
        /**
         * 规划路线
         * @param lngLat 经纬度 信息   经度,纬度;经度,纬度。。。。。。
         * @param color 颜色 未实现
         * @param tMap 当前地图对象
         * @returns 线对象
         */
        async makeRoute(lngLat:string,color:string,tMap:any){
            let editLine = null;
            if(lngLat && lngLat.length>1){
                let points:any = [];
                let boundary = lngLat.split(";");
                for (var j = 0; j < boundary.length; j++) {
                    let poin = boundary[j].split(",");
                    if (poin.length >= 2) {
                    points.push(new T.LngLat(poin[0], poin[1]));
                    }
                }
                let options ={color:color,
                    opacity: 1,
                    weight: 4,};
                //创建线对象
                editLine = new T.Polyline(points,options);
                //向地图上添加线
                tMap.addOverLay(editLine); 
            }
            return editLine;
        }
        /**
         * 获取作业区、航空区
         * @param oaid 作业区 航空识别区 编码
         * @param tMap 当前地图对象
         * @returns 全部作业区全部点集合
         */
        async getOpera(oaid:any,tMap:any){
            let points:any = [];
            if(oaid){
                let aid = oaid.split(";")
                for(var i=0;i<aid.length;i++){
                    let cc = await this.getOpera0(aid[i],tMap);
                    points = points.concat(cc);
                }
            }
            return points;
        }
        async getOpera0(oid:any,tMap:any){
            let oneCont =[];
            let allCont = [];
            let cont = "";
            let qCont = new QueryCont('id', oid, 12);
            qCont.setContrast(0);
            oneCont.push(qCont);
            if (oneCont.length != 0) {
                allCont.push(oneCont);
                cont = "~" + JSON.stringify(allCont);
            }
            let qe: QueryEntity = new QueryEntity("", "");
            qe.page.currPage = 1;
            qe.page.pageSize = 400;
            qe.cont = cont;
            let vv = await tools.getBipInsAidInfo("ROUTEOPERA", 210, qe);
            let points:any =[];
            if(vv.data.id == 0){
                let values = vv.data.data.data.values;
                for(var i =0;i<values.length;i++){
                    let vl = values[i];
                    if(vl.mergeid){
                        let oidArr:any = vl.mergeid.split(";");
                        for(var l =0;l<oidArr.length;l++){
                            let cc = await this.getOpera0(oidArr[l],tMap);
                            points = points.concat(cc);
                        }
                    }else{
                        let cc = this.markSurface(vl.boundary1,vl.color,tMap)
                        points = points.concat(cc);
                    }
                }
            }
            return points;
        }
        /**
         * 获取航线规划线路 
         * @param oaid 作业区
         * @param tMap 地图对象
         */
        async getOperaRoute(oaid:any,tMap:any){
            console.log(oaid)
            let points:any = [];
            if(oaid){
                let aid = oaid.split(";")
                for(var i=0;i<aid.length;i++){
                    let cc = await this.getOperaRoute0(aid[i],tMap);
                    points = points.concat(cc);
                }
            }
            return points;
        }
        async getOperaRoute0(oaid:any,tMap:any){
            let oneCont =[];
            let allCont = [];
            let cont = "";
            let qCont = new QueryCont('id', oaid, 12);
            qCont.setContrast(0);
            oneCont.push(qCont);
            if (oneCont.length != 0) {
                allCont.push(oneCont);
                cont = "~" + JSON.stringify(allCont);
            }
            let qe: QueryEntity = new QueryEntity("", "");
            qe.page.currPage = 1;
            qe.page.pageSize = 400;
            qe.cont = cont;
            let vv = await tools.getBipInsAidInfo("ROUTEOPERA", 210, qe);
            let points:any =[];
            if(vv.data.id == 0){
                let values = vv.data.data.data.values;
                for(var i =0;i<values.length;i++){
                    let vl = values[i];
                    this.makeRoute(vl.route,'#00FFFF',tMap)
                }
            }
            return points;
        }
        /**
         * 获取避让区域
         * @param oid 作业区编码
         * @param tMap 当前地图对象
         */
        async getOperaBr(hoaid:any,tMap:any){
            if(hoaid){
                let haid = hoaid.split(";")
                for(var i=0;i<haid.length;i++){
                    let oneCont =[];
                    let allCont = [];
                    let cont = "";
                    let qCont = new QueryCont('id', haid[i], 12);
                    qCont.setContrast(0);
                    oneCont.push(qCont);
                    if (oneCont.length != 0) {
                        allCont.push(oneCont);
                        cont = "~" + JSON.stringify(allCont);
                    }
                    let qe: QueryEntity = new QueryEntity("", "");
                    qe.page.currPage = 1;
                    qe.page.pageSize = 400;
                    qe.cont = cont;
                    let vv = await tools.getBipInsAidInfo("ROUTEOPERA", 210, qe);
                    if(vv.data.id == 0){
                        let values = vv.data.data.data.values;
                        for(var z =0;z<values.length;z++){
                            let vl = values[z];
                            if(vl.mergeid){
                                let oidArr:any = vl.mergeid.split(";");
                                for(var l =0;l<oidArr.length;l++){
                                    this.getOperaBr0(oidArr[l],tMap);
                                }
                            }else{
                                this.getOperaBr0(haid[i],tMap);
                            }
                        }
                    }
                    
                }
            }
        }
        async getOperaBr0(oid:any,tMap:any){
            let oneCont =[];
            let allCont = [];
            let cont = "";
            let qCont = new QueryCont('oid', oid, 12);
            qCont.setContrast(0);
            oneCont.push(qCont);
            if (oneCont.length != 0) {
            allCont.push(oneCont);
            cont = "~" + JSON.stringify(allCont);
            }
            let qe: QueryEntity = new QueryEntity("", "");
            qe.page.currPage = 1;
            qe.page.pageSize = 400;
            qe.cont = cont;
            let vv = await tools.getBipInsAidInfo("ROUTEOPERAA", 210, qe);
            if(vv.data.id == 0){
                let values = vv.data.data.data.values;
                for(var i =0;i<values.length;i++){
                    let vl = values[i];
                    if(vl.type ==1){
                        this.markSurface(vl.avoid,vl.color,tMap)
                    }else if(vl.type ==2){
                        this.markCircle(vl.avoid,vl.color,vl.radius,tMap);
                    }else if(vl.type ==0){
                        this.markpoint(vl.avoid,tMap)
                    }
                }
            }
        }
        /**
         * 画覆盖面
         * @param lngLat 经纬度 信息   经度,纬度;经度,纬度。。。。。。
         * @param color 覆盖区颜色
         * @param tMap  当前地图对象
         */
        markSurface(lngLat:string,color:string,tMap:any){
            let boundary = lngLat.split(";");
            var points = [];
            for (var j = 0; j < boundary.length; j++) {
                let poin = boundary[j].split(",");
                if (poin.length >= 2) {
                points.push(new T.LngLat(poin[0], poin[1]));
                }
            }
            //创建面对象
            var polygon = new T.Polygon(points, {
                color: "blue",
                weight: 1,
                opacity: 0.5,
                fillColor: color,
                fillOpacity: 0.5
            });
            tMap.addOverLay(polygon);
            return points;
        }
        /**
         * 画覆盖点
         * @param lngLat 经纬度 信息   经度,纬度
         * @param tMap  当前地图对象
         */
        markpoint(lngLat:string,tMap:any){
            var marker = new T.Marker(new T.LngLat(lngLat.split(",")[0], lngLat.split(",")[1]));
            //向地图上添加标注
            tMap.addOverLay(marker);
        }
        /**
         * 覆盖圆
         * @param lngLat 经纬度
         * @param color 颜色
         * @param radius 半径
         * @param tMap 地图
         */
        markCircle(lngLat:string,color:string,radius:any,tMap:any){
            radius = parseFloat(radius+'')
            var circle = new T.Circle(new T.LngLat(lngLat.split(",")[0], lngLat.split(",")[1]), radius,{color:"blue",weight:1,opacity:0.7,fillColor:color,fillOpacity:0.5,lineStyle:"solid"});
            //向地图上添加圆
            tMap.addOverLay(circle); 
        }
        /**
         * 添加自定义标注图片
         * @param lngLat 
         * @param tMap 
         */
        markpoint1(lngLat:string,tMap:any){
            var icon = new T.Icon({
                iconUrl: require('@/assets/air-super/check.gif'),
                iconSize: new T.Point(10, 10),
                iconAnchor: new T.Point(5, 5)
            });
            var marker = new T.Marker(new T.LngLat(lngLat.split(",")[0], lngLat.split(",")[1]), {icon: icon});
            //向地图上添加标注
            tMap.addOverLay(marker);
            return marker;
        }
        /** 
         * @description   添加自定义飞机标注图片
         * @param lngLat  经纬度信息   xxx,xxx
         * @param tMap    天地图对象
         * @param key     标注点唯一值
         * @param click   单机回调方法
         * @param msg     鼠标悬浮显示内容
         * @param offline true 离线，false在线
         * @returns 标注点对象
         * */        
        markRealTimeAir(lngLat:string,tMap:any,key:any,click:any,msg:any="",offline:boolean=false){
            let zIndexOffset = 10;
            var icon = new T.Icon({
                iconUrl: require('@/assets/air-super/plane.png'),
                iconSize: new T.Point(40, 40),
                iconAnchor: new T.Point(20, 20)
            });
            if(offline){
                icon = new T.Icon({
                    iconUrl: require('@/assets/air-super/offlinePlane.png'),
                    iconSize: new T.Point(40, 40),
                    iconAnchor: new T.Point(20, 20)
                });
                zIndexOffset = 9;
            }
            var marker = new T.Marker(new T.LngLat(lngLat.split(",")[0], lngLat.split(",")[1]), {icon: icon,zIndexOffset:zIndexOffset});
            //向地图上添加标注
            tMap.addOverLay(marker);
            marker.key = key;
            if(offline == false){
                marker.addEventListener("click",click)
            }
            if(msg.length>0){
                var markerInfoWin = new T.InfoWindow(msg);
                marker.addEventListener("mouseover", function () {
                    marker.openInfoWindow(markerInfoWin);
                });// 将标注添加到地图中
            }
            return marker;
        }
        /**
         *在每个点的真实步骤中设置小车转动的角度
         */
        setRotation(curPos:any, targetPos:any,TMap:any) {
            var deg = 0;
            //start!
            curPos = TMap.lngLatToContainerPoint(curPos);//起点经纬度
            targetPos = TMap.lngLatToContainerPoint(targetPos);//终点经纬度
            if(curPos == null)
                return 360;
            if(targetPos == null)
                return 360;
            if (targetPos.x != curPos.x) {
                var tan = (targetPos.y - curPos.y) / (targetPos.x - curPos.x),
                        atan = Math.atan(tan);
                deg = atan * 360 / (2 * Math.PI);
                //degree  correction;
                if (targetPos.x < curPos.x) {
                    deg = -deg + 90 + 90;
                } else {
                    deg = -deg;
                }
                return (-deg);
            } else {
                var disy = targetPos.y - curPos.y;
                var bias = 0;
                if (disy > 0)
                    bias = -1
                else
                    bias = 1
                return (-bias * 90);
            }
            return 0;
        }
        /**
         * 每个浏览器的偏转兼容
         * @returns {string}
         * @constructor
         */
        CSS_TRANSFORM() {
            var div = document.createElement('div');
            var props = [
                'transform',
                'WebkitTransform',
                'MozTransform',
                'OTransform',
                'msTransform'
            ];

            for (var i = 0; i < props.length; i++) {
                var prop:any = props[i];
                if (div.style[prop] !== undefined) {
                    return prop;
                }
            }
            return props[0];
        }
        /**
         * 获取对象
         * @param cellid  对象编码
         */
        async getCell(cellid: string) {
            let res = await tools.getCCellsParams(cellid);
            let rtn: any = res.data;
            if (rtn.id == 0) {
                let kn: Array<Cells> = rtn.data.layCels;
                let cells = kn;
                return new CDataSet(cells[0]);
            } else {
                return new CDataSet("");
            }
        }
        /**
         * 检查非空项
         * @param cds CdataSet 对象
         */
        checkNotNull(cds: CDataSet): string {
            let bok:string = "";
            cds.ccells.cels.forEach(item => {
                if (item.unNull && bok == "") {
                    let vl = null;
                    let hide: any = [];
                    if (cds.currRecord.data[item.id] != null)
                        vl = cds.currRecord.data[item.id] + "";
                    if (!vl && hide.indexOf(item.id) == -1) {
                        bok = "【" + item.labelString + "】不能为空!";
                        return bok;
                    }
                }
            });
            return bok;
        } 
        
        dateFormat(time:any, format:any){
            var t = new Date(time);
            var tf = function(i:any){return (i < 10 ? '0' : '') + i};
            return format.replace(/yyyy|MM|dd|HH|mm|ss/g, function(a:any){
                switch(a){
                    case 'yyyy':
                        return tf(t.getFullYear());
                        break;
                    case 'MM':
                        return tf(t.getMonth() + 1);
                        break;
                    case 'mm':
                        return tf(t.getMinutes());
                        break;
                    case 'dd':
                        return tf(t.getDate());
                        break;
                    case 'HH':
                        return tf(t.getHours());
                        break;
                    case 'ss':
                        return tf(t.getSeconds());
                        break;
                }
            })
        }
        
    }
    export let TMapUt = new TMapUtils();
}
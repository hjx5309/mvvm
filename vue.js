// 传三个参数 vm ,表达式，更新回调
class Watcher{
   constructor(vm,expr,cb){
      this.cb = cb;
      this.vm = vm;
      this.expr = expr;
      this.oldVlaue = this.get()
   }
   get(){
    Dep.target = this;
    let value = CompileUtil.getVal(this.vm,this.expr)
    Dep.target = null;
    return value
   }
   updater(){
    let newValue = CompileUtil.getVal(this.vm,this.expr)
     if(this.oldVlaue!==newValue){
      console.log()
      this.cb(newValue)
     }
      
   }
}
class Dep{
  constructor(){
    this.subs = [];
  }
  addSubs(watcher){
    this.subs.push(watcher)
  }
  notify(){
    this.subs.forEach(watcher=>{
      watcher.updater()
    })
  }
}
class Observer{
   constructor(data){
     this.data = data;
     this.addObserver(this.data )
   }
   addObserver(data){
     if(data&&typeof(data)=="object"){
       console.log(typeof(data),data);
       // 遍历对象,每个属性挨个
       for(let key in data){
        this.ResObserver(data,key,data[key])
       }
     
     }
   }
   ResObserver(data,key,value){
       // 如果对应的键值对也是对象，递归监听
      this.addObserver(data[key])
       let dep = new Dep()
       Object.defineProperty(data,key,{
          get:()=>{
            Dep.target&&dep.addSubs(Dep.target)
            return value
          },
          set:(newVal)=>{
             value = newVal;
             // 发布事件
             dep.notify()
             // 如果有了新的值继续递归监听
             this.addObserver(data[key])
          },
       })
   
    
   }
}
class Complier{
  constructor(el,vm){
    // 判断是否是节点,是节点就赋值，不是说就document.querySelector节点不属于文档树，
    this.el = this.isElementNode(el)?el:document.querySelector(el);
    let fragment = this.node2Fragment(this.el);
    this.vm = vm
    // 把节点的内容中的内容进行替换
    // 编译模板，用数据编译
    this.complie(fragment)
    // 把内容替换到页面中
    this.el.appendChild(fragment)
  }
  // 判断是否是节点 nodeType==1表示节点 nodeType==3表示文本
  isElementNode(node){
    return node.nodeType ===1;
  }
  // 判断是不是指令
  isDirective(attr){
    return attr.startsWith("v-")
  }
  // 针对节点的编译方法
  complieElement(node){
   let attributes = node.attributes;// 这里是节点的类数组
   [...attributes].forEach(attr=>{
     // value:expr获取对象里面的value所对应具体的值 name:v-model,value: "school.name"  expr--> school.name
     let {name,value:expr} = attr;
     if(this.isDirective(name)){
       // 取数组的第二个元素
       let [,fn] = name.split("-");
       // 点击事件
       let [directive,event] = fn.split(":");
       console.log(directive);
     //  console.log(event);
       // 从vm上所定义的data上查找数据
       CompileUtil[directive](node,expr,this.vm,event);
     }
   })
   
  }
  // 针对文本的编译方法
  complieText(node){
    let content = node.textContent;
   if(/\{\{(.+?)\}\}/.test(content)){ // 找到匹配{{xxx}}的表达式
     // 找到匹配的表达式
     CompileUtil["text"](node,content,this.vm)
   }
  }
  // 用来编译内存dom
  complie(fragment){
    // 获取子节点
    let childNodes = fragment.childNodes;
    [...childNodes].forEach(child=>{
      if(this.isElementNode(child)){
       this.complieElement(child);
       // 如果不是文本继续递归
       this.complie(child)
      }else{
        this.complieText(child)
      }
    })
    
  }
// 创建一个文档碎片
  node2Fragment(node){
    // 但是有一个很使用的特点，
    //当把一个DocumentFragment 节点插入到文档树中时，插入的不是DocumentFragment 自身，而是它所有的子孙节点，
    //这个特性是的DocumentFragment 在需要添加大量的dom元素的时候，可以先将dom元素插入DocumentFragment 中，然后在插入到页面中，这样就可以大大的减少页面渲染dom元素，提升效率。
    let fragment = document.createDocumentFragment();
    let firstChild;
    while(firstChild=node.firstChild){
      // appendChild具有移动性，他会把子节点移动到内存里面fragment
      fragment.appendChild(firstChild)
    }
    return fragment
  }
}

const CompileUtil = {
  getVal(vm,expr){
    // 获取此时在data实例上的表达式对应的值
    return expr.split(".").reduce((data,currunt)=>{
      return data[currunt]
    },vm.$data)
  },
  getTextVal(vm,expr){
    // 正则的replace后面传入的函数所return的值，就是所匹配时，替换的值
    return expr.replace(/\{\{(.+?)\}\}/g,(...arg)=>{
      return this.getVal(vm,arg[1])
    })
  },
  // 事件
  on(node,expr,vm,event){
    node.addEventListener(event,(e)=>{
      vm[expr].call(vm,e)
    })
  },
  model(node,expr,vm,event){// node是节点，expr是表达式，vm是实例对象
    let fn = this.updater["modelUpdater"];
    let value = this.getVal(vm,expr);
    // 监听输入方法，获取值以后去赋值；这样触发订阅者
    node.addEventListener("input",(e)=>{
      var value = e.target.value;
      this.setContent(vm,expr,value)
    })
    if(event){
      this.on(node,expr,vm,event)
    }
    new Watcher(vm,expr,(value)=>{
      fn(node,value)
    })
    fn(node,value)
  },
  //
  setContent(vm,expr,value){
     expr.split(".").reduce((data,currunt,index,arr)=>{
      if(index==arr.length-1){
        data[currunt] =value
      }
      return data[currunt]
    },vm.$data)
  },
  text(node,expr,vm){
    let fn = this.updater["textUpdate"];
    expr.replace(/\{\{(.+?)\}\}/g,(...arg)=>{
      new Watcher(vm,arg[1],()=>{
        fn(node,this.getTextVal(vm,expr))
      })
      return this.getVal(vm,arg[1])
    })
  
    fn(node,this.getTextVal(vm,expr))
  },
  updater:{
    // 设置input标签里面的值
    modelUpdater(node,value){
      node.value = value
    },
    textUpdate(node,value){
      // 设置节点的文本属性
      node.textContent = value
    }
  }
}

class Vue{
  constructor(options){
    // 渲染节点
    this.$el = options.el;
    this.computed = options.computed || {};
    this.methods = options.methods || {};
    // 节点数据
    this.$data = options.data;
    if(this.$el){
        // 劫持this.$data上的数据
        new Observer(this.$data);
        this.proxyVm(this.$data);
        // 计算属性,将computer里面的属性劫持到data上，当CompileUtil.getVal()时，他就会去寻找vm.data被劫持的属性，此时get返回的就是定义在computed上的值
        for(let key in this.computed){
          Object.defineProperty(this.$data,key,{
            get:()=>{        
              return this.computed[key].call(this)
            }
          })
        }
        for(var key in this.methods){
          Object.defineProperty(this,key,{
            get:()=>{                
              return this.methods[key]
            }
          })
        }
        new Complier(this.$el,this)
    }
  }
  proxyVm(data){
    for(var key in data){
       Object.defineProperty(this,key,{
         get:()=>{
           return data[key]
         },
         set(newVal){
           data[key] = newVal
         }
       })
    }
  }
}
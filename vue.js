class Watcher{}
class Dep{}
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
       let [,directive] = name.split("-")
       // 从vm上所定义的data上查找数据
       CompileUtil[directive](node,expr,this.vm);
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
  model(node,expr,vm){// node是节点，expr是表达式，vm是实例对象
    let fn = this.updater["modelUpdater"];
    fn(node,this.getVal(vm,expr))
  },
  text(node,expr,vm){
    let fn = this.updater["textUpdate"];
    fn(node,this.getTextVal(vm,expr))
  },
  updater:{
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
    // 节点数据
    this.$data = options.data;
    if(this.$el){
        new Complier(this.$el,this)
    }
  }
}
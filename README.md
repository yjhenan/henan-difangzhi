# henan-difangzhi
# 河南省地方志
> epub 生成脚本，只需手动从复制 `地方志网址` 填写到指定位置，通过此脚本可以生成需要的 `地方志.epub`格式，并兼容多看阅读图片查看模式。
```js
/**
 * 地方志网站地址:index.ts文件下
 */
export const urlBook = "http://www.hnsqw.com.cn/zmdsjk/zmdsz/zmddqzx/"
```

## 用法
```sh
#直接运行
ts-node index.ts
```
或
```sh
#先编译TypeScript
tsc index.ts
#然后运行js
node index.ts
```

## 依赖
> 见`package.json`
```sh
#安装Node.JS后直接
npm install
``

## 注意
1. 依赖于Node.JS，且node版本 >= 10.x
2. 目前只支持`河南省地方志`
3. 手机端可能打不开，需要用`Sigil`处理下
4. 只测试了驻马店市地方志，其他未知

## 预览
![截图](/img/深度截图_选择区域_20190319192207.png)
![截图](/img/深度截图_sigil_20190319191555.png)

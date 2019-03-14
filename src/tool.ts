import * as fs from "fs";
import * as http from "http";
import * as path from "path";
import * as url from "url";
import iconv from "iconv-lite";
import cheerio from "cheerio";
import { urlBook, dirPath, urlHtml } from "..";

class Tool {
    /**
     * 创建需要的路径
     * @param dirPath 全路径
     */
    static mkdir(dirPath: string) {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath);
            console.log(`${path.basename(dirPath)}创建成功`);
        } else {
            console.log(`${path.basename(dirPath)}已存在`);
        }
    }
    /**
     * 根据根路径创建需要所以资源路径
     * @param dirPath 根路径
     */
    static mkdirAll(dirPath: string) {
        this.mkdir(path.join(dirPath,"META-INF"))
        let epub = path.join(dirPath,"EPUB")
        this.mkdir(epub) // 创建资源目录
        this.mkdir(path.join(epub,"Text")) // 创建 Text 目录
        this.mkdir(path.join(epub,"Images")) // 创建 Images 目录
        this.mkdir(path.join(epub,"Styles")) // 创建 Styles 目录
    }

    /**
     * 获取URL所指定的网页内容
     * @param url 需要获取的地址
     */
    static getHtml(url: string): Promise<string | Error> {
        return new Promise((resolve, reject) => {
            http.get(url, res => {
                let htmlSrting = "";
                res.on("data", chunk => {
                    htmlSrting += chunk;
                })
                res.on("end", () => {
                    resolve(htmlSrting);
                })
            }).on("error", err => {
                console.log("获取数据错误！");
                reject(err);
            })
        })
    }
    /**
     * 单个文件下载
     * @param url 下载地址
     * @param fileName 文件名字
     * @param dirPath 存放路径
     */
    static downFile(url: string | http.RequestOptions, fileName: string, dirPath: string) {
        return new Promise((resolve, reject) => {
            http.get(url, (response) => {
                if (response.statusCode == 200) {
                    fileName = path.parse(fileName).base; // 去除斜线
                    let stream = fs.createWriteStream(path.join(dirPath, fileName));
                    response.pipe(stream).on("close", () => {
                        resolve({ message: "下载成功" + fileName });
                    });
                }
                else { 
                    reject(new Error(`下载失败，状态码：${response.statusCode}##${url}`));
                }
            }).on("error", err => reject(new Error(err.message)));
        });
    }
    /**
     * 下载多个文件
     * @param fileArray 文件列表
     * @param dirPath 文件存放路径
     */
    static async  downHtmlFiles(fileArray: Array<string>, dirPath: string) {
        //循环多线程下载
        for (let i = 0; i < fileArray.length; i++) {
            let fileName = fileArray[i]; // 文件名
            let fileUrl = url.resolve(urlBook, fileName); // 组合文件URL
            try {
                await this.downFile(fileUrl, fileName, dirPath);
                console.log("下载成功" + fileName);
            } catch (err) {
                console.log(err);
                break;
            }
        }
    }

    /**
     * 过滤错误或无用的HTML节点及字符串
     * @param pathHtml 需要调整的HTML文本
     * @param url 当前页面所在路径，默认全局urlHTML
     */
    static setHtml(pathHtml: Buffer) {
        return new Promise((resolve, reject) => {
            let utf8String = iconv.decode(pathHtml, "gb2312");  // 编码
            utf8String = utf8String.toString().replace(/<script(.*)(src)(.*)>/, "");// 去除错误的script标签
            utf8String = utf8String.toString().replace(/<(body|BODY)(.*)>/, "<body>");// 去除body标签的属性
            utf8String = utf8String.toString().replace(/gb2312/i, "utf-8");// 去除body标签的属性
            const $ = cheerio.load(utf8String);
            $("script").remove() // 删除js脚本及其标签
            // fs.writeFile(dirPath + "/EPUB/Text/temp.html", $.html({ decodeEntities: false }), err => err ? reject(err) : resolve());
            resolve($.html({decodeEntities:false}))
        })
    }
    static async  setImages(html:string,htmlUrl=urlHtml){
        const $ = cheerio.load(html);
        $("img").map(async (index, ele) => {
            if (ele.attribs.src.includes("gov-space")) {
                $(ele).remove()
            } else {
                let temp = url.resolve(htmlUrl,ele.attribs.src)
                // 下载img
                await this.downFile(url.resolve(htmlUrl,ele.attribs.src),path.basename(ele.attribs.src),path.join(dirPath,"/EPUB/Images"))
                ele.attribs.src = "../Images/" + path.basename(ele.attribs.src);
            }
        })
        return $.html({decodeEntities:false})
    }
    /**
     * 根据节点返回XML结构字符串
     * @param ele 待添加的节点
     * @param index 所对应的索引
     */
    static getNcx(ele: CheerioElement, index: number) {
        return `<navPoint id="navPoint-${index}" playOrder="${index}">
                <navLabel>
                    <text>${ele.attribs.name}</text>
                </navLabel>
                <content src="Text/${path.parse(ele.attribs.link).base}"/>
            </navPoint>`
    }
}
export default Tool
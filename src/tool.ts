import * as fs from "fs";
import { promises as fsP } from "fs";
import * as http from "http";
import * as path from "path";
import * as url from "url";
import iconv from "iconv-lite";
import cheerio from "cheerio";
import { dirPath, urlBook } from "..";
import CleanCSS from "clean-css";

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
        this.mkdir(path.join(dirPath, "META-INF"))
        let epub = path.join(dirPath, "OEBPS")
        this.mkdir(epub) // 创建资源目录
        this.mkdir(path.join(epub, "Text")) // 创建 Text 目录
        this.mkdir(path.join(epub, "Images")) // 创建 Images 目录
        this.mkdir(path.join(epub, "Styles")) // 创建 Styles 目录
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
                    htmlSrting += iconv.decode(chunk, "gb2312");
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
                    let stream = fs.createWriteStream(path.join(dirPath, fileName))
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
     * @param $opf 配置文件jq
     */
    static async  downHtmlFiles(fileArray: Array<string>, dirPath: string, $opf: CheerioStatic) {
        Tool.setHtmlOpf(fileArray, $opf);
        //循环下载
        for (let i = 0; i < fileArray.length; i++) {
            /**
             * 原始文件名：带路径
             */
            let file = fileArray[i]; // 文件名
            /**
             * 文件下载地址：全路径
             */
            let fileUrl = url.resolve(urlBook, file); // 组合文件URL
            /**
             * 文件名
             */
            const fileName = path.parse(file).base;
            try {
                // await this.downFile(fileUrl, fileName, dirPath);
                let html = await this.getHtml(fileUrl) as string;
                let $ = cheerio.load(html);
                $ = await Tool.setHtml($); // 处理HTML
                $ = await Tool.setImages($, $opf, fileUrl); // 下载图片
                // 写入HTML
                await fsP.writeFile(dirPath + `/OEBPS/Text/${fileName}`, $.html({ decodeEntities: false }))
                console.log(`下载成功[${i + 1}]：${fileName}`);
            } catch (err) {
                console.error(err);
                break;
            }
        }
    }

    /**
     * 过滤错误或无用的HTML节点及字符串
     * @param pathHtml 需要调整的HTML文本
     */
    static async setHtml($: CheerioStatic) {
        let temp = $.html({ decodeEntities: false })
        temp = temp.replace(/<script(.*)(src)(.*)>/, "");// 去除错误的script标签
        temp = temp.replace(/<(body|BODY)(.*)>/, "<body>");// 去除body标签的属性
        temp = temp.replace(/gb2312/i, "utf-8");// 改变gb2312为utf-8
        // temp = temp.replace(/<((table|tbody|td|tr)|(\/(table|tbody|td|tr)))[^>]*>/i, "");// 去除表格标签
        $ = cheerio.load(temp, { decodeEntities: false })
        $("script").remove() // 删除js脚本及其标签
        $("table").map((index, item) => {
            let temp = /[\u4e00-\u9fa5]/g.test($(item).html() as string)
            if (!temp) {
                $(item).remove()
            }
        })
        return Promise.resolve($)
    }
    /**
     * 分析HTML内容下载图片，并添加到配置文件
     * @param $ 当前HTML的jq
     * @param $opf 配置文件的jq
     * @param urlHtml 当前HTML页面的URL
     */
    static async setImages($: CheerioStatic, $opf: CheerioStatic, urlHtml: string) {
        for (const ele of $("img").toArray()) {
            if (ele.attribs.src.includes("gov-space")) {
                $(ele).remove()
            } else {
                // 下载img
                await this.downFile(url.resolve(urlHtml, ele.attribs.src), path.basename(ele.attribs.src), path.join(dirPath, "/OEBPS/Images"))
                const imgIndex = $opf("manifest").children(`item[media-type="image/jpeg"]`).length //下载计数
                console.info(`下载成功[${imgIndex}]${ele.attribs.src}`);
                $(ele).attr("src", `../Images/${path.basename(ele.attribs.src)}`)
                $(ele).wrap(`<div class="duokan-image-single"></div>`)
                $opf("manifest").append(`<item id="${path.basename(ele.attribs.src)}" href="Images/${path.basename(ele.attribs.src)}" media-type="image/jpeg" />`);
                // 第一个图片为封面
                if (imgIndex == 0) {
                    $opf("metadata").append(`<meta name="cover" content="${path.basename(ele.attribs.src)}" />`)
                    // 提取公共CSS
                    const css = $("link").attr("href");
                    await this.downFile(url.resolve(urlHtml, css), "style.css", dirPath + `/OEBPS/Styles/`)
                }
            }
        }
        // 获取CSS并写入到文件
        return await fsP.appendFile(dirPath + `/OEBPS/Styles/style.css`, $("style").html()).then(() => {
            $("link").attr("href", `../Styles/style.css`)
            $("style").remove()
            return Promise.resolve($)
        })
    }
    /**
     * 根据文件列表添加到opf配置文件
     * @param fileName 文件名清单
     * @param $opf 配置文件jq
     */
    static setHtmlOpf(fileName: string[], $opf: CheerioStatic) {
        fileName.forEach((item, index) => {
            $opf("manifest").append(`<item id="${path.basename(item)}" href="Text/${path.basename(item)}" media-type="application/xhtml+xml" />`);
            $opf("spine").append(`<itemref idref="${path.basename(item)}"/>`);
            index == 0 ? $opf("guide").append(`<reference type="cover" title="Cover" href="Text/${path.basename(item)}"/>`) : ""
            if (index == 0) {
                $opf
            }
        })
        return $opf
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
    static async cleanCSS() {
        const css = await fsP.readFile(dirPath + `/OEBPS/Styles/style.css`);
        await fsP.writeFile(dirPath + `/OEBPS/Styles/style.css`, new CleanCSS({ format: "beautify", level: 2 }).minify(css).styles);
    }
}
export default Tool
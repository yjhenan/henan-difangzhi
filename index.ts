
//文件下载
import * as path from "path";
import cheerio from "cheerio";
import { promises as fs } from "fs";
import Tool from "./src/tool";
import url from "url";
import zip from "zip-local";

/**
 * 地方志网站地址
 */
export const urlBook = "http://www.hnsqw.com.cn/zmdsjk/zmdxqz/xcxz/"
export const urlHtml = url.resolve(urlBook, "./201411/")
let ncx = `<?xml version="1.0" encoding="utf-8" ?>
            <!DOCTYPE ncx PUBLIC "-//NISO//DTD ncx 2005-1//EN"
            "http://www.daisy.org/z3986/2005/ncx-2005-1.dtd">
            <ncx version="2005-1" 
                xmlns="http://www.daisy.org/z3986/2005/ncx/">
                <head>
                    <meta content="3" name="dtb:depth"/>
                </head>
                <docTitle>
                    <text>地方志</text>
                </docTitle>
                <navMap>
                </navMap>
            </ncx>`
/**
 * 信息资源文件
 */
let opf = `<?xml version="1.0" encoding="utf-8"?>
            <package version="2.0" unique-identifier="uuid_id" xmlns="http://www.idpf.org/2007/opf">
                <metadata xmlns:calibre="http://calibre.kovidgoyal.net/2009/metadata" xmlns:dc="http://purl.org/dc/elements/1.1/"
                    xmlns:dcterms="http://purl.org/dc/terms/" xmlns:opf="http://www.idpf.org/2007/opf"
                    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
                    <dc:title>地方志</dc:title>
                    <dc:language>zh</dc:language>
                    <dc:date opf:event="modification">2016-03-12</dc:date>
                    <dc:type>地方志</dc:type>
                </metadata>
                <manifest>
                <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
                <item id="style.css" href="Styles/style.css" media-type="text/css"/>
                </manifest>
                <spine toc="ncx">
                </spine>
                <guide>
                </guide>
            </package>`
/**
 * 描述文件
 */
let metaINF = `<?xml version="1.0" encoding="UTF-8"?>
                <container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
                    <rootfiles>
                        <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
                </rootfiles>
                </container>`
/**
 * 创建文件夹目录
 */
export let dirPath = path.join(__dirname, "file");

// getHtml(urlBook).then(res =>{
//     const $ = cheerio.load(res as string);
//     $("[src]").map((index,item) =>{
//         const temp = $(item).attr("src")
//         if (temp.includes("xml")) {
//             console.log(temp);
//             downFile(urlBook+temp,temp,dirPath)
//         }
//     })
// })

fs.readFile("./temp/index.xml").then(async result => {
    /**
     * XML目录
     */
    const $ = cheerio.load(result, { xmlMode: true });
    /**
     * 地方志标题
     */
    const title = $("TITLE").children("a").text().replace(/\s/, "")
    dirPath = path.join(dirPath, title); // 根据标题生产目录
    Tool.mkdir(dirPath) // 创建根目录
    Tool.mkdirAll(dirPath) // 创建所以
    /**
     * ncx目录
     */
    const $ncx = cheerio.load(ncx, { xmlMode: true });
    $ncx("docTitle").children("text").text(title)
    /**
     * opf组织XML:配置文件
     */
    const $opf = cheerio.load(opf, { xmlMode: true })
    $opf("dc\\:title").text(title)
    $opf("dc\\:date").text(new Date().toLocaleDateString())
    /**
     * 信息文件写入
     */
    await fs.writeFile(path.join(dirPath, "/META-INF/container.xml"), metaINF)
    /**
     * 下载链接数组
     */
    let linkArray: string[] = [];
    $("STRUCTURE").eq(0).children().toArray().map(PIECE => {
        if (PIECE.attribs) {
            linkArray.push(PIECE.attribs.link)
            $ncx("navMap").append(Tool.getNcx(PIECE, linkArray.length))
            /**
             * 一级索引
             */
            const indexPIECE = linkArray.length;
            // 下一级
            PIECE.children.map(CHAPTER => {
                if (CHAPTER.attribs) {
                    linkArray.push(CHAPTER.attribs.link);
                    $ncx(`navPoint[playOrder="${indexPIECE}"]`).append(Tool.getNcx(CHAPTER, linkArray.length));
                    /**
                    * 二级索引
                    */
                    const indexCHAPTER = linkArray.length;
                    // 下一级
                    CHAPTER.children.map(SECTION => {
                        if (SECTION.attribs) {
                            linkArray.push(SECTION.attribs.link)
                            $ncx(`navPoint[playOrder="${indexCHAPTER}"]`).append(Tool.getNcx(SECTION, linkArray.length))
                        }
                    })
                }

            })
        }
    })
    linkArray = [...new Set(linkArray)]
    // 下载
    await Tool.downHtmlFiles(linkArray, dirPath, $opf)
    // 写入ncx目录
    await fs.writeFile(path.join(dirPath, "/OEBPS/toc.ncx"), $ncx.html({ decodeEntities: false }))
    // 写入opf配置
    await fs.writeFile(path.join(dirPath, "/OEBPS/content.opf"), $opf.html({ decodeEntities: false }))
    // 清理CSS
    await Tool.cleanCSS();
    // 打包
    await zip.sync.zip(dirPath).compress().save(dirPath + ".epub");

}).catch(err => {
    if (err) return new Error("打开文件错误！")
})

// fs.readFile("./file/新蔡县志/OEBPS/Text/t20141125_157895.htm").then(res => {
//     const $ = cheerio.load(res);
//     test2($)
//     console.log($.html({ decodeEntities: false }));
// })
// function test2($: CheerioStatic) {
//     $("img").each((index, item) => {
//         const temp = $(item)
//         temp.attr("src", 123)
//     })
// }
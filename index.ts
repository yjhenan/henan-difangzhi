
//文件下载
import * as path from "path";
import cheerio from "cheerio";
import * as fs from "fs";
import Tool from "./src/tool";
import  url  from "url";

/**
 * 地方志网站地址
 */
export const urlBook = "http://www.hnsqw.com.cn/zmdsjk/zmdxqz/xcxz/"
export const urlHtml = url.resolve(urlBook,"./201411/")
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
                    <dc:title>三体</dc:title>
                    <dc:language>zh</dc:language>
                    <dc:date opf:event="modification">2016-03-12</dc:date>
                    <dc:type>地方志</dc:type>
                </metadata>
                <manifest>
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
                        <rootfile full-path="EPUB/content.opf" media-type="application/oebps-package+xml"/>
                </rootfiles>
                </container>
                `
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

fs.readFile("./index.xml", (err, result) => {
    /**
     * XML目录
     */
    const $ = cheerio.load(result, { xmlMode: true });
    /**
     * 地方志标题
     */
    const title = $("TITLE").children("a").text().replace(/\s/,"")
    dirPath = path.join(dirPath, title); // 根据标题生产目录
    Tool.mkdir(dirPath) // 创建根目录
    Tool.mkdirAll(dirPath)
    /**
     * ncx目录
     */
    const $ncx = cheerio.load(ncx, { xmlMode: true });
    $ncx("docTitle").children("text").text(title)
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
    // downFiles(linkArray,dirPath)
    // console.log(linkArray);
    // console.log($ncx.html({decodeEntities:false}));
    // fs.writeFile(path.join(dirPath, "/EPUB/toc.ncx"), $ncx.html({ decodeEntities: false }), err => err ? console.log(err) : "")
    fs.readFile("./file/Text/t20141125_157503.htm", (err, result) => {
        Tool.setHtml(result)
    })
})
"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//文件下载
const path = __importStar(require("path"));
const cheerio_1 = __importDefault(require("cheerio"));
const fs_1 = require("fs");
const tool_1 = __importDefault(require("./src/tool"));
const url_1 = __importDefault(require("url"));
const zip_local_1 = __importDefault(require("zip-local"));
/**
 * 地方志网站地址
 */
exports.urlBook = "http://www.hnsqw.com.cn/zmdsjk/zmdxqz/xcxz/";
exports.urlHtml = url_1.default.resolve(exports.urlBook, "./201411/");
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
            </ncx>`;
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
                </manifest>
                <spine toc="ncx">
                </spine>
                <guide>
                </guide>
            </package>`;
/**
 * 描述文件
 */
let metaINF = `<?xml version="1.0" encoding="UTF-8"?>
                <container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
                    <rootfiles>
                        <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
                </rootfiles>
                </container>`;
/**
 * 创建文件夹目录
 */
exports.dirPath = path.join(__dirname, "file");
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
fs_1.promises.readFile("./temp/index.xml").then(async (result) => {
    /**
     * XML目录
     */
    const $ = cheerio_1.default.load(result, { xmlMode: true });
    /**
     * 地方志标题
     */
    const title = $("TITLE").children("a").text().replace(/\s/, "");
    exports.dirPath = path.join(exports.dirPath, title); // 根据标题生产目录
    tool_1.default.mkdir(exports.dirPath); // 创建根目录
    tool_1.default.mkdirAll(exports.dirPath); // 创建所以
    /**
     * ncx目录
     */
    const $ncx = cheerio_1.default.load(ncx, { xmlMode: true });
    $ncx("docTitle").children("text").text(title);
    /**
     * opf组织XML:配置文件
     */
    const $opf = cheerio_1.default.load(opf, { xmlMode: true });
    $opf("dc\\:title").text(title);
    $opf("dc\\:date").text(new Date().toLocaleDateString());
    /**
     * 信息文件写入
     */
    await fs_1.promises.writeFile(path.join(exports.dirPath, "/META-INF/container.xml"), metaINF);
    /**
     * 下载链接数组
     */
    let linkArray = [];
    $("STRUCTURE").eq(0).children().toArray().map(PIECE => {
        if (PIECE.attribs) {
            linkArray.push(PIECE.attribs.link);
            $ncx("navMap").append(tool_1.default.getNcx(PIECE, linkArray.length));
            /**
             * 一级索引
             */
            const indexPIECE = linkArray.length;
            // 下一级
            PIECE.children.map(CHAPTER => {
                if (CHAPTER.attribs) {
                    linkArray.push(CHAPTER.attribs.link);
                    $ncx(`navPoint[playOrder="${indexPIECE}"]`).append(tool_1.default.getNcx(CHAPTER, linkArray.length));
                    /**
                    * 二级索引
                    */
                    const indexCHAPTER = linkArray.length;
                    // 下一级
                    CHAPTER.children.map(SECTION => {
                        if (SECTION.attribs) {
                            linkArray.push(SECTION.attribs.link);
                            $ncx(`navPoint[playOrder="${indexCHAPTER}"]`).append(tool_1.default.getNcx(SECTION, linkArray.length));
                        }
                    });
                }
            });
        }
    });
    linkArray = [...new Set(linkArray)];
    // 下载
    await tool_1.default.downHtmlFiles(linkArray, exports.dirPath, $opf);
    // 写入ncx目录
    await fs_1.promises.writeFile(path.join(exports.dirPath, "/OEBPS/toc.ncx"), $ncx.html({ decodeEntities: false }));
    // 写入opf配置
    await fs_1.promises.writeFile(path.join(exports.dirPath, "/OEBPS/content.opf"), $opf.html({ decodeEntities: false }));
    await zip_local_1.default.sync.zip(exports.dirPath).compress().save(exports.dirPath + ".epub");
}).catch(err => {
    if (err)
        return new Error("打开文件错误！");
});
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

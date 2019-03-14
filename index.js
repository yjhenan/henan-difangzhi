"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
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
var path = __importStar(require("path"));
var cheerio_1 = __importDefault(require("cheerio"));
var fs = __importStar(require("fs"));
var tool_1 = __importDefault(require("./src/tool"));
var url_1 = __importDefault(require("url"));
/**
 * 地方志网站地址
 */
exports.urlBook = "http://www.hnsqw.com.cn/zmdsjk/zmdxqz/xcxz/";
exports.urlHtml = url_1.default.resolve(exports.urlBook, "./201411/");
var ncx = "<?xml version=\"1.0\" encoding=\"utf-8\" ?>\n            <!DOCTYPE ncx PUBLIC \"-//NISO//DTD ncx 2005-1//EN\"\n            \"http://www.daisy.org/z3986/2005/ncx-2005-1.dtd\">\n            <ncx version=\"2005-1\" \n                xmlns=\"http://www.daisy.org/z3986/2005/ncx/\">\n                <head>\n                    <meta content=\"3\" name=\"dtb:depth\"/>\n                </head>\n                <docTitle>\n                    <text>\u5730\u65B9\u5FD7</text>\n                </docTitle>\n                <navMap>\n                </navMap>\n            </ncx>";
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
fs.readFile("./index.xml", function (err, result) {
    /**
     * XML目录
     */
    var $ = cheerio_1.default.load(result, { xmlMode: true });
    /**
     * 地方志标题
     */
    var title = $("TITLE").children("a").text().replace(/\s/, "");
    exports.dirPath = path.join(exports.dirPath, title); // 根据标题生产目录
    tool_1.default.mkdir(exports.dirPath); // 创建根目录
    tool_1.default.mkdirAll(exports.dirPath);
    /**
     * ncx目录
     */
    var $ncx = cheerio_1.default.load(ncx, { xmlMode: true });
    $ncx("docTitle").children("text").text(title);
    /**
     * 下载链接数组
     */
    var linkArray = [];
    $("STRUCTURE").eq(0).children().toArray().map(function (PIECE) {
        if (PIECE.attribs) {
            linkArray.push(PIECE.attribs.link);
            $ncx("navMap").append(tool_1.default.getNcx(PIECE, linkArray.length));
            /**
             * 一级索引
             */
            var indexPIECE_1 = linkArray.length;
            // 下一级
            PIECE.children.map(function (CHAPTER) {
                if (CHAPTER.attribs) {
                    linkArray.push(CHAPTER.attribs.link);
                    $ncx("navPoint[playOrder=\"" + indexPIECE_1 + "\"]").append(tool_1.default.getNcx(CHAPTER, linkArray.length));
                    /**
                    * 二级索引
                    */
                    var indexCHAPTER_1 = linkArray.length;
                    // 下一级
                    CHAPTER.children.map(function (SECTION) {
                        if (SECTION.attribs) {
                            linkArray.push(SECTION.attribs.link);
                            $ncx("navPoint[playOrder=\"" + indexCHAPTER_1 + "\"]").append(tool_1.default.getNcx(SECTION, linkArray.length));
                        }
                    });
                }
            });
        }
    });
    linkArray = __spread(new Set(linkArray));
    // downFiles(linkArray,dirPath)
    // console.log(linkArray);
    // console.log($ncx.html({decodeEntities:false}));
    // fs.writeFile(path.join(dirPath, "/EPUB/toc.ncx"), $ncx.html({ decodeEntities: false }), err => err ? console.log(err) : "")
    fs.readFile("./file/Text/t20141125_157503.htm", function (err, result) {
        tool_1.default.setHtml(result);
    });
});

"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
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
var fs = __importStar(require("fs"));
var http = __importStar(require("http"));
var path = __importStar(require("path"));
var url = __importStar(require("url"));
var iconv_lite_1 = __importDefault(require("iconv-lite"));
var cheerio_1 = __importDefault(require("cheerio"));
var __1 = require("..");
var Tool = /** @class */ (function () {
    function Tool() {
    }
    /**
     * 创建需要的路径
     * @param dirPath 全路径
     */
    Tool.mkdir = function (dirPath) {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath);
            console.log(path.basename(dirPath) + "\u521B\u5EFA\u6210\u529F");
        }
        else {
            console.log(path.basename(dirPath) + "\u5DF2\u5B58\u5728");
        }
    };
    /**
     * 根据根路径创建需要所以资源路径
     * @param dirPath 根路径
     */
    Tool.mkdirAll = function (dirPath) {
        this.mkdir(path.join(dirPath, "META-INF"));
        var epub = path.join(dirPath, "EPUB");
        this.mkdir(epub); // 创建资源目录
        this.mkdir(path.join(epub, "Text")); // 创建 Text 目录
        this.mkdir(path.join(epub, "Images")); // 创建 Images 目录
        this.mkdir(path.join(epub, "Styles")); // 创建 Styles 目录
    };
    /**
     * 获取URL所指定的网页内容
     * @param url 需要获取的地址
     */
    Tool.getHtml = function (url) {
        return new Promise(function (resolve, reject) {
            http.get(url, function (res) {
                var htmlSrting = "";
                res.on("data", function (chunk) {
                    htmlSrting += chunk;
                });
                res.on("end", function () {
                    resolve(htmlSrting);
                });
            }).on("error", function (err) {
                console.log("获取数据错误！");
                reject(err);
            });
        });
    };
    /**
     * 单个文件下载
     * @param url 下载地址
     * @param fileName 文件名字
     * @param dirPath 存放路径
     */
    Tool.downFile = function (url, fileName, dirPath) {
        return new Promise(function (resolve, reject) {
            http.get(url, function (response) {
                if (response.statusCode == 200) {
                    fileName = path.parse(fileName).base; // 去除斜线
                    var stream = fs.createWriteStream(path.join(dirPath, fileName));
                    response.pipe(stream).on("close", function () {
                        resolve({ message: "下载成功" + fileName });
                    });
                }
                else {
                    reject(new Error("\u4E0B\u8F7D\u5931\u8D25\uFF0C\u72B6\u6001\u7801\uFF1A" + response.statusCode + "##" + url));
                }
            }).on("error", function (err) { return reject(new Error(err.message)); });
        });
    };
    /**
     * 下载多个文件
     * @param fileArray 文件列表
     * @param dirPath 文件存放路径
     */
    Tool.downHtmlFiles = function (fileArray, dirPath) {
        return __awaiter(this, void 0, void 0, function () {
            var i, fileName, fileUrl, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < fileArray.length)) return [3 /*break*/, 6];
                        fileName = fileArray[i];
                        fileUrl = url.resolve(__1.urlBook, fileName);
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.downFile(fileUrl, fileName, dirPath)];
                    case 3:
                        _a.sent();
                        console.log("下载成功" + fileName);
                        return [3 /*break*/, 5];
                    case 4:
                        err_1 = _a.sent();
                        console.log(err_1);
                        return [3 /*break*/, 6];
                    case 5:
                        i++;
                        return [3 /*break*/, 1];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 过滤错误或无用的HTML节点及字符串
     * @param pathHtml 需要调整的HTML文本
     * @param url 当前页面所在路径，默认全局urlHTML
     */
    Tool.setHtml = function (pathHtml, htmlUrl) {
        var _this = this;
        if (htmlUrl === void 0) { htmlUrl = __1.urlHtml; }
        return new Promise(function (resolve, reject) {
            var utf8String = iconv_lite_1.default.decode(pathHtml, "gb2312"); // 编码
            utf8String = utf8String.toString().replace(/<script(.*)(src)(.*)>/, ""); // 去除错误的script标签
            utf8String = utf8String.toString().replace(/<(body|BODY)(.*)>/, "<body>"); // 去除body标签的属性
            utf8String = utf8String.toString().replace(/gb2312/i, "utf-8"); // 去除body标签的属性
            var $ = cheerio_1.default.load(utf8String);
            $("script").remove(); // 删除js脚本及其标签
            $("img").map(function (index, ele) {
                if (ele.attribs.src.includes("gov-space")) {
                    $(ele).remove();
                }
                else {
                    var temp = url.resolve(htmlUrl, ele.attribs.src);
                    console.log(temp);
                    // 下载img
                    _this.downFile(url.resolve(htmlUrl, ele.attribs.src), path.basename(ele.attribs.src), path.join(__1.dirPath, "/EPUB/Images"));
                    ele.attribs.src = "../Images/" + path.basename(ele.attribs.src);
                }
            });
            fs.writeFile(__1.dirPath + "/EPUB/Text/temp.html", $.html({ decodeEntities: false }), function (err) { return err ? reject(err) : resolve(); });
            resolve($.html({ decodeEntities: false }));
        });
    };
    /**
     * 根据节点返回XML结构字符串
     * @param ele 待添加的节点
     * @param index 所对应的索引
     */
    Tool.getNcx = function (ele, index) {
        return "<navPoint id=\"navPoint-" + index + "\" playOrder=\"" + index + "\">\n                <navLabel>\n                    <text>" + ele.attribs.name + "</text>\n                </navLabel>\n                <content src=\"Text/" + path.parse(ele.attribs.link).base + "\"/>\n            </navPoint>";
    };
    return Tool;
}());
exports.default = Tool;

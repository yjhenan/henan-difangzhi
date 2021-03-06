// Generated by https://quicktype.io

//#region 目录XML文件
/**
 * XML目录
 */
export interface xmlFile {
    BOOK: Book;
}

export interface Book {
    "xmlns:dt": string;
    TITLE:      Title;
    blank:      string;
    STRUCTURE:  Structure;
}

export interface Structure {
    PIECE: Piece[];
}

export interface Piece {
    name:     string;
    link:     string;
    id:       string;
    CHAPTER?: Piece[];
    SECTION?: Piece[];
}

export interface Title {
    cover: string;
    a:     A;
}

export interface A {
    href: string;
    $t:   string;
}
//#endregion
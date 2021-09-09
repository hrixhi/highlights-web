// export const htmlStringParser = (htmlString: string) => {
//     const parsedString = htmlString.replace(/<[^>]+>/g, '\n').split('&nbsp;').join(' ');
//     const lines = parsedString.split('\n')
//     const filteredLines = lines.filter(i => {
//         return i.toString().trim() !== ""
//     })
//     let title = ''
//     if (filteredLines.length > 0 && filteredLines[0][0] === '{' && filteredLines[0][filteredLines[0].length - 1] === '}') {
//         const obj = JSON.parse(filteredLines[0])
//         title = obj.title ? obj.title : 'file'
//     } else {
//         title = filteredLines.length > 0 ? filteredLines[0] : 'Alert'
//     }
//     return {
//         title,
//         subtitle: filteredLines.length > 1 ? filteredLines[1] : ''
//     }
// }

import { PreferredLanguageText } from "./LanguageContext";

export const htmlStringParser = (htmlString: string) => {

    if (htmlString === null || !htmlString) {
        return {
            title: 'No content',
            subtitle: ''
        }
    }

    const parsedString = htmlString.replace(/<[^>]+>/g, '\n').split('&nbsp;').join(' ');
    const lines = parsedString.split('\n')
    const filteredLines = lines.filter(i => {
        return i.toString().trim() !== ""
    })
    let title = ''
    if (filteredLines.length > 0) {
        if (filteredLines[0][0] === '{' && filteredLines[0][filteredLines[0].length - 1] === '}') {
            const obj = JSON.parse(filteredLines[0])
            title = obj.title ? obj.title : 'file'
        } else {
            title = filteredLines.length > 0 ? filteredLines[0] : "No Content"
        }
    } else {
        title = "No Content"
    }
    return {
        title,
        subtitle: filteredLines.length > 1 ? filteredLines[1] : ''
    }
}